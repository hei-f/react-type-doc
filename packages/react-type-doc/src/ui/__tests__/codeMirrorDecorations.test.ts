/**
 * CodeMirror decoration helper tests
 */

import { EditorState, Text } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import type { OutputResult, TypeInfo } from '../../shared/types';
import { PropsDocReader } from '../../runtime/reader';
import {
  buildClickableDecorationsSet,
  clickableRangeToOffsets,
  createClickableDecorationsField,
  requestClickableDecorationsRebuildEffect,
} from '../codeMirrorClickableDecorations';
import {
  buildJSDocClickTargetsFromCode,
  createJSDocDecorationsField,
  requestJSDocDecorationsRebuildEffect,
} from '../codeMirrorJSDocDecorations';
import {
  CODE_MIRROR_CLICKABLE_TYPE_CLASS_NAME,
  CODE_MIRROR_JSDOC_TAG_CLASS_NAME,
  CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME,
  CODE_MIRROR_JSDOC_URL_CLASS_NAME,
} from '../codeMirrorEditorUiConstants';
import type { JSDocBlockMeta } from '../typeToCode';
import { rainbowBracketsField } from '../codeMirrorRainbowBrackets';

const buttonType: TypeInfo = {
  kind: 'object',
  text: 'Button',
  properties: {
    label: {
      kind: 'primitive',
      text: 'string',
      required: true,
    },
  },
};

const mockData: OutputResult = {
  generatedAt: '2026-03-23T00:00:00.000Z',
  keys: {
    Button: buttonType,
  },
  typeRegistry: {
    Button: buttonType,
  },
};

function collectDecorations(set: any, doc: Text) {
  const decorations: Array<{
    from: number;
    to: number;
    className?: string;
    title?: string;
  }> = [];

  set.between(0, doc.length, (from: number, to: number, value: any) => {
    decorations.push({
      from,
      to,
      className: value.spec?.class,
      title: value.spec?.attributes?.title,
    });
  });

  return decorations;
}

describe('clickable decorations', () => {
  it('should convert ranges and build clickable marks', () => {
    const doc = Text.of(['type Result =', '  | Success', '  | Error']);

    expect(
      clickableRangeToOffsets(doc, {
        startLine: 2,
        startColumn: 5,
        endLine: 2,
        endColumn: 12,
      }),
    ).toEqual({
      from: doc.line(2).from + 4,
      to: doc.line(2).from + 11,
    });
    expect(
      clickableRangeToOffsets(doc, {
        startLine: 0,
        startColumn: 1,
        endLine: 1,
        endColumn: 2,
      }),
    ).toBeNull();

    const decorations = buildClickableDecorationsSet(
      doc,
      [
        {
          range: {
            startLine: 3,
            startColumn: 5,
            endLine: 3,
            endColumn: 10,
          },
          typeName: 'Error',
          typeInfo: { kind: 'primitive', text: 'Error' },
        },
        {
          range: {
            startLine: 2,
            startColumn: 5,
            endLine: 2,
            endColumn: 12,
          },
          typeName: 'Success',
          typeInfo: { kind: 'primitive', text: 'Success' },
        },
      ],
      'View type',
    );

    const spans = collectDecorations(decorations, doc);
    expect(spans).toHaveLength(2);
    expect(spans[0]?.from).toBeLessThan(spans[1]?.from ?? 0);
    expect(spans[0]?.className).toBe(CODE_MIRROR_CLICKABLE_TYPE_CLASS_NAME);
    expect(spans[0]?.title).toBe('View type');
  });

  it('should rebuild clickable decorations when requested', () => {
    const doc = Text.of(['type Result =', '  | Success']);
    let ranges = [
      {
        range: {
          startLine: 2,
          startColumn: 5,
          endLine: 2,
          endColumn: 12,
        },
        typeName: 'Success',
        typeInfo: { kind: 'primitive', text: 'Success' },
      },
    ];

    const field = createClickableDecorationsField(
      () => ranges,
      () => 'View type',
    );
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    expect(collectDecorations(state.field(field), doc)).toHaveLength(1);

    ranges = [];
    const nextState = state.update({
      effects: requestClickableDecorationsRebuildEffect.of(null),
    }).state;

    expect(collectDecorations(nextState.field(field), doc)).toHaveLength(0);
  });
});

describe('JSDoc decorations', () => {
  it('should collect click targets and decorations from JSDoc blocks', () => {
    const reader = PropsDocReader.create(mockData);
    const code = [
      '/**',
      ' * @param value See {@link Button|button docs} and https://example.com',
      ' */',
      'interface Example {}',
    ].join('\n');
    const blocks: JSDocBlockMeta[] = [
      {
        kind: 'multi',
        firstContentLine: 2,
        lastContentLine: 2,
        indent: '',
        description:
          '@param value See {@link Button|button docs} and https://example.com',
        descriptionLinks: {
          Button: 'Button',
        },
      },
    ];

    const clicks = buildJSDocClickTargetsFromCode(
      code,
      blocks,
      reader,
      (name) => `View ${name}`,
    );

    expect(clicks).toHaveLength(2);
    expect(clicks.map((click) => click.kind)).toEqual(['type', 'url']);
    expect(clicks[0]).toMatchObject({
      kind: 'type',
      typeInfo: buttonType,
      typeName: 'Button',
    });
    expect(clicks[1]).toMatchObject({
      kind: 'url',
      href: 'https://example.com',
    });

    const field = createJSDocDecorationsField(
      () => code,
      () => blocks,
      () => reader,
      () => (name) => `View ${name}`,
    );
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(
      spans.some((span) => span.className === CODE_MIRROR_JSDOC_TAG_CLASS_NAME),
    ).toBe(true);
    expect(
      spans.some(
        (span) => span.className === CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME,
      ),
    ).toBe(true);
    expect(
      spans.some((span) => span.className === CODE_MIRROR_JSDOC_URL_CLASS_NAME),
    ).toBe(true);

    const rebuiltState = state.update({
      effects: requestJSDocDecorationsRebuildEffect.of(null),
    }).state;
    expect(
      collectDecorations(rebuiltState.field(field), doc).length,
    ).toBeGreaterThan(0);
  });
});

describe('rainbow brackets', () => {
  it('should color only code brackets and rebuild on doc changes', () => {
    const doc = Text.of([
      'const value = { a: [1, 2, { b: true }] };',
      '// comment with { ignored }',
      'const text = "{ not a bracket }";',
      '/* block { ignored } */',
      'const tpl = `template { ignored }`;',
    ]);
    const state = EditorState.create({
      doc,
      extensions: [rainbowBracketsField],
    });

    const spans = collectDecorations(state.field(rainbowBracketsField), doc);
    expect(spans).toHaveLength(6);
    expect(
      spans.some((span) =>
        span.className?.includes('cm-rtd-rainbow-bracket-0'),
      ),
    ).toBe(true);

    const nextState = state.update({
      changes: { from: 0, insert: '()' },
    }).state;
    expect(
      collectDecorations(nextState.field(rainbowBracketsField), nextState.doc)
        .length,
    ).toBeGreaterThan(0);
  });
});
