/**
 * CodeMirror decoration helper tests
 */

import { javascript } from '@codemirror/lang-javascript';
import { EditorState, Text } from '@codemirror/state';
import { type DecorationSet } from '@codemirror/view';
import { describe, expect, it } from 'vitest';
import type { OutputResult, TypeInfo } from '../../../../shared/types';
import { PropsDocReader } from '../../../../runtime/reader';
import {
  buildClickableDecorationsSet,
  clickableRangeToOffsets,
  createClickableDecorationsField,
  requestClickableDecorationsRebuildEffect,
} from '../clickableDecorations';
import {
  buildJSDocClickTargetsFromCode,
  createJSDocDecorationsField,
  requestJSDocDecorationsRebuildEffect,
} from '../jsdocDecorations';
import {
  CODE_MIRROR_CLICKABLE_TYPE_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_NAMESPACE_NAME_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_FUNCTION_PROPERTY_NAME_CLASS_NAME,
  CODE_MIRROR_JSDOC_TAG_CLASS_NAME,
  CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME,
  CODE_MIRROR_JSDOC_URL_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_PROPERTY_NAME_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME,
} from '../constants';
import {
  createSemanticDecorationsField,
  requestSemanticDecorationsRebuildEffect,
} from '../semanticDecorations';
import type { ClickableRange, JSDocBlockMeta } from '../../typeToCode';
import { typeInfoToCodeWithMeta } from '../../typeToCode';
import { rainbowBracketsField } from '../rainbowBrackets';

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

function collectDecorations(set: DecorationSet, doc: Text) {
  const decorations: Array<{
    from: number;
    to: number;
    className?: string;
    title?: string;
  }> = [];

  set.between(
    0,
    doc.length,
    (
      from: number,
      to: number,
      value: { spec?: { class?: string; attributes?: { title?: string } } },
    ) => {
      decorations.push({
        from,
        to,
        className: value.spec?.class,
        title: value.spec?.attributes?.title,
      });
    },
  );

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
    let ranges: ClickableRange[] = [
      {
        range: {
          startLine: 2,
          startColumn: 5,
          endLine: 2,
          endColumn: 12,
        },
        typeName: 'Success',
        typeInfo: { kind: 'primitive', text: 'Success' } as TypeInfo,
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

describe('semantic decorations', () => {
  it('should keep namespaced object semantic colors stable', () => {
    const namespacedEntity: TypeInfo = {
      kind: 'object',
      text: 'Models.User.Entity',
      properties: {
        id: {
          kind: 'primitive',
          text: 'string',
          required: true,
        },
        profile: {
          $ref: 'Models.User.Profile',
        },
        settings: {
          $ref: 'Models.User.Settings',
        },
        posts: {
          kind: 'array',
          text: 'Models.Post.Entity[]',
          elementType: {
            $ref: 'Models.Post.Entity',
          },
          required: true,
        },
      },
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        'Models.User.Entity': namespacedEntity,
      },
      typeRegistry: {
        'Models.User.Profile': {
          kind: 'object',
          text: 'Models.User.Profile',
          properties: {
            avatar: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
          },
        },
        'Models.User.Settings': {
          kind: 'object',
          text: 'Models.User.Settings',
          properties: {
            theme: {
              kind: 'union',
              text: '"light" | "dark"',
              unionTypes: [
                { kind: 'primitive', text: '"light"' },
                { kind: 'primitive', text: '"dark"' },
              ],
              required: true,
            },
          },
        },
        'Models.Post.Entity': {
          kind: 'object',
          text: 'Models.Post.Entity',
          properties: {
            title: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
          },
        },
      },
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Models.User.Entity')!;
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'Models.User.Entity',
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_NAMESPACE_NAME_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'Models.User.',
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'Entity',
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_NAMESPACE_NAME_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'Models.Post.',
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'Entity',
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME,
      ),
    ).toBe(true);

    const rebuiltState = state.update({
      effects: requestSemanticDecorationsRebuildEffect.of(null),
    }).state;
    expect(
      collectDecorations(rebuiltState.field(field), doc).length,
    ).toBeGreaterThan(0);
  });

  it('should not paint complex object expressions as property types', () => {
    const functionType: TypeInfo = {
      kind: 'function',
      text: '(error: Error) => void',
      signatures: [
        {
          parameters: [
            {
              name: 'error',
              type: { kind: 'object', text: 'Error', properties: {} },
            },
          ],
          returnType: { kind: 'primitive', text: 'void' },
        },
      ],
    };
    const genericWrapperType: TypeInfo = {
      kind: 'object',
      text: 'Partial<Omit<User, "id" | "createdAt" | "updatedAt">>',
      renderHint: 'generic',
      isGeneric: true,
    };
    const complexInlineObject: TypeInfo = {
      kind: 'object',
      text: '{ callback: (error: Error) => void; settings: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>; }',
      properties: {
        callback: functionType,
        settings: genericWrapperType,
      },
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            details: complexInlineObject,
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'Props',
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME,
      ),
    ).toBe(false);
  });

  it('should not paint anonymous union object members as property types', () => {
    const functionType: TypeInfo = {
      kind: 'function',
      text: '(error: Error) => void',
      signatures: [
        {
          parameters: [
            {
              name: 'error',
              type: { kind: 'object', text: 'Error', properties: {} },
            },
          ],
          returnType: { kind: 'primitive', text: 'void' },
        },
      ],
    };
    const genericWrapperType: TypeInfo = {
      kind: 'object',
      text: 'Partial<Omit<User, "id" | "createdAt" | "updatedAt">>',
      renderHint: 'generic',
      isGeneric: true,
    };
    const anonymousUnionMember: TypeInfo = {
      kind: 'object',
      text: '{ callback: (error: Error) => void; settings: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>; }',
      properties: {
        callback: functionType,
        settings: genericWrapperType,
      },
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Result: {
          kind: 'union',
          text: 'Result',
          unionTypes: [anonymousUnionMember],
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Result')!;
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'Result',
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME,
      ),
    ).toBe(false);
  });

  it('should keep primitive object semantic colors stable', () => {
    const primitiveTypes: TypeInfo = {
      kind: 'object',
      text: 'PrimitiveTypes',
      properties: {
        text: {
          kind: 'primitive',
          text: 'string',
          required: true,
        },
        count: {
          kind: 'primitive',
          text: 'number',
          required: true,
        },
        isActive: {
          kind: 'primitive',
          text: 'boolean',
          required: true,
        },
        optionalText: {
          kind: 'primitive',
          text: 'string',
          required: false,
        },
        nullableCount: {
          kind: 'union',
          text: 'null | number',
          unionTypes: [
            { kind: 'primitive', text: 'null' },
            { kind: 'primitive', text: 'number' },
          ],
          required: true,
        },
        maybeValue: {
          kind: 'primitive',
          text: 'string',
          required: true,
        },
      },
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        PrimitiveTypes: primitiveTypes,
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('PrimitiveTypes')!;
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'PrimitiveTypes',
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(
      spans.some(
        (span) => span.className === CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME,
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_PROPERTY_NAME_CLASS_NAME,
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME &&
          ['string', 'number', 'boolean'].includes(
            doc.sliceString(span.from, span.to),
          ),
      ),
    ).toBe(true);
    const nullableCountNumberIndex = code.indexOf(
      'number',
      code.indexOf('nullableCount') + 'nullableCount'.length,
    );
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME &&
          span.from === nullableCountNumberIndex &&
          span.to === nullableCountNumberIndex + 'number'.length,
      ),
    ).toBe(true);
  });

  it('should color primitive root aliases as base types', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        PrimitiveAlias: {
          kind: 'primitive',
          text: 'string',
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('PrimitiveAlias')!;
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'PrimitiveAlias',
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'PrimitiveAlias',
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'string',
      ),
    ).toBe(true);
  });

  it('should color primitive array aliases as base types', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        StringList: {
          kind: 'array',
          text: 'string[]',
          elementType: { kind: 'primitive', text: 'string' },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('StringList')!;
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'StringList',
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'StringList',
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'string',
      ),
    ).toBe(true);
  });

  it('should color base types inside structured expressions', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        PrimitiveTypes: {
          kind: 'object',
          text: 'PrimitiveTypes',
          properties: {
            nullableCount: {
              kind: 'union',
              text: 'number | null',
              unionTypes: [
                { kind: 'primitive', text: 'number' },
                { kind: 'primitive', text: 'null' },
              ],
              required: true,
            },
          },
        },
        LiteralTypes: {
          kind: 'object',
          text: 'LiteralTypes',
          properties: {
            isTrue: {
              kind: 'literal',
              text: 'true',
              required: true,
            },
            mixed: {
              kind: 'union',
              text: "'auto' | 0 | false",
              unionTypes: [
                { kind: 'literal', text: "'auto'" },
                { kind: 'literal', text: '0' },
                { kind: 'literal', text: 'false' },
              ],
              required: true,
            },
          },
        },
        ArrayTypes: {
          kind: 'object',
          text: 'ArrayTypes',
          properties: {
            items: {
              kind: 'array',
              text: 'Array<{ id: string; name: string }>',
              elementType: {
                kind: 'object',
                text: '{ id: string; name: string }',
                properties: {
                  id: {
                    kind: 'primitive',
                    text: 'string',
                    required: true,
                  },
                  name: {
                    kind: 'primitive',
                    text: 'string',
                    required: true,
                  },
                },
              },
              required: true,
            },
            readonlyList: {
              kind: 'array',
              text: 'readonly string[]',
              elementType: { kind: 'primitive', text: 'string' },
              required: true,
            },
          },
        },
        TupleTypes: {
          kind: 'object',
          text: 'TupleTypes',
          properties: {
            coordinate: {
              kind: 'tuple',
              text: '[number, number]',
              tupleElements: [
                { kind: 'primitive', text: 'number' },
                { kind: 'primitive', text: 'number' },
              ],
              required: true,
            },
          },
        },
        FunctionTypes: {
          kind: 'object',
          text: 'FunctionTypes',
          properties: {
            simple: {
              kind: 'function',
              text: '() => void',
              signatures: [
                {
                  parameters: [],
                  returnType: { kind: 'primitive', text: 'void' },
                },
              ],
              required: true,
            },
            withParams: {
              kind: 'function',
              text: '(a: string, b: number) => boolean',
              signatures: [
                {
                  parameters: [
                    {
                      name: 'a',
                      type: { kind: 'primitive', text: 'string' },
                    },
                    {
                      name: 'b',
                      type: { kind: 'primitive', text: 'number' },
                    },
                  ],
                  returnType: { kind: 'primitive', text: 'boolean' },
                },
              ],
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);

    const expectSemanticToken = (
      className: string,
      key: string,
      displayName: string,
      anchor: string,
      token: string,
      nonBaseTypeTokens: string[] = [],
    ): void => {
      const typeInfo = reader.getRaw(key)!;
      const { code, semanticRanges } = typeInfoToCodeWithMeta(
        typeInfo,
        reader,
        displayName,
      );
      const field = createSemanticDecorationsField(() => semanticRanges);
      const doc = Text.of(code.split('\n'));
      const state = EditorState.create({
        doc,
        extensions: [field],
      });

      const spans = collectDecorations(state.field(field), doc);
      const tokenIndex = code.indexOf(
        token,
        code.indexOf(anchor) + anchor.length,
      );

      expect(tokenIndex).toBeGreaterThan(-1);
      expect(
        spans.some(
          (span) =>
            span.className === className &&
            span.from === tokenIndex &&
            span.to === tokenIndex + token.length,
        ),
      ).toBe(true);

      for (const nonBaseTypeToken of nonBaseTypeTokens) {
        expect(
          spans.some(
            (span) =>
              span.className === CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME &&
              doc.sliceString(span.from, span.to) === nonBaseTypeToken,
          ),
        ).toBe(false);
      }
    };

    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
      'PrimitiveTypes',
      'PrimitiveTypes',
      'nullableCount',
      'number',
    );
    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME,
      'LiteralTypes',
      'LiteralTypes',
      'isTrue',
      'true',
      ['true', 'false'],
    );
    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
      'ArrayTypes',
      'ArrayTypes',
      'items',
      'string',
    );
    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
      'ArrayTypes',
      'ArrayTypes',
      'readonlyList',
      'string',
    );
    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
      'TupleTypes',
      'TupleTypes',
      'coordinate',
      'number',
    );
    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
      'FunctionTypes',
      'FunctionTypes',
      'simple',
      'void',
    );
    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
      'FunctionTypes',
      'FunctionTypes',
      'withParams',
      'string',
    );
    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
      'FunctionTypes',
      'FunctionTypes',
      'withParams',
      'number',
    );
    expectSemanticToken(
      CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
      'FunctionTypes',
      'FunctionTypes',
      'withParams',
      'boolean',
    );
  });

  it('should render legacy generic object roots with declaration heads', () => {
    const userResponse: TypeInfo = {
      kind: 'object',
      text: 'Response<T, Error>',
      name: 'Response<T = unknown, E = Error>',
      isGeneric: true,
      properties: {
        data: {
          kind: 'object',
          text: '{ id: string; name: string; email: string }',
          properties: {
            id: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
            name: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
            email: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
          },
        },
        error: {
          kind: 'object',
          text: '{ code: number; message: string }',
          properties: {
            code: {
              kind: 'primitive',
              text: 'number',
              required: true,
            },
            message: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
          },
        },
        loading: {
          kind: 'primitive',
          text: 'boolean',
          required: true,
        },
      },
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        UserResponse: userResponse,
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('UserResponse')!;
    const displayName = reader.getDisplayName(typeInfo, 'UserResponse');
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      displayName,
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(code).toContain('interface Response<T = unknown, E = Error> {');

    const expectSemanticToken = (className: string, token: string): void => {
      expect(
        spans.some(
          (span) =>
            span.className === className &&
            doc.sliceString(span.from, span.to) === token,
        ),
      ).toBe(true);
    };

    expectSemanticToken(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME, 'Response');
    expectSemanticToken(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME, 'T');
    expectSemanticToken(CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME, 'unknown');
    expectSemanticToken(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME, 'E');
    expectSemanticToken(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME, 'Error');

    const parser = javascript({ typescript: true }).language.parser;
    const tree = parser.parse(code);

    const expectPropertyDefinition = (token: string): void => {
      let searchStart = 0;
      while (true) {
        const tokenIndex = code.indexOf(token, searchStart);
        if (tokenIndex < 0) {
          break;
        }

        const node = tree.resolveInner(tokenIndex + 1, -1);
        expect(node.type.name).toBe('PropertyDefinition');

        searchStart = tokenIndex + token.length;
      }
    };

    expectPropertyDefinition('name');
    expectPropertyDefinition('email');
    expectPropertyDefinition('code');
    expectPropertyDefinition('message');
  });

  it('should color generic display names inside field types', () => {
    const responseType: TypeInfo = {
      kind: 'object',
      text: 'Response<T = unknown, E = Error>',
      name: 'Response<T = unknown, E = Error>',
      properties: {},
    };
    const container: TypeInfo = {
      kind: 'object',
      text: 'Container',
      properties: {
        response: responseType,
      },
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Container: container,
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Container')!;
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'Container',
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);

    const expectToken = (className: string, token: string): void => {
      expect(
        spans.some(
          (span) =>
            span.className === className &&
            doc.sliceString(span.from, span.to) === token,
        ),
      ).toBe(true);
    };

    expectToken(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME, 'Response');
    expectToken(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME, 'T');
    expectToken(CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME, 'unknown');
    expectToken(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME, 'E');
    expectToken(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME, 'Error');
  });

  it('should paint function property names in function color', () => {
    const serviceProps: TypeInfo = {
      kind: 'object',
      text: 'UserService',
      properties: {
        loadUser: {
          kind: 'function',
          text: '() => Promise<User>',
          signatures: [
            {
              parameters: [],
              returnType: { kind: 'primitive', text: 'Promise<User>' },
            },
          ],
          required: true,
        },
        saveUser: {
          kind: 'function',
          text: '(user: User) => void',
          signatures: [
            {
              parameters: [
                {
                  name: 'user',
                  type: { kind: 'object', text: 'User', properties: {} },
                },
              ],
              returnType: { kind: 'primitive', text: 'void' },
            },
          ],
          required: true,
        },
        enabled: {
          kind: 'primitive',
          text: 'boolean',
          required: true,
        },
      },
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        UserService: serviceProps,
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('UserService')!;
    const { code, semanticRanges } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'UserService',
    );
    const field = createSemanticDecorationsField(() => semanticRanges);
    const doc = Text.of(code.split('\n'));
    const state = EditorState.create({
      doc,
      extensions: [field],
    });

    const spans = collectDecorations(state.field(field), doc);
    expect(
      spans.some(
        (span) =>
          span.className ===
            CODE_MIRROR_SEMANTIC_FUNCTION_PROPERTY_NAME_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'loadUser',
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className ===
            CODE_MIRROR_SEMANTIC_FUNCTION_PROPERTY_NAME_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'saveUser',
      ),
    ).toBe(true);
    expect(
      spans.some(
        (span) =>
          span.className === CODE_MIRROR_SEMANTIC_PROPERTY_NAME_CLASS_NAME &&
          doc.sliceString(span.from, span.to) === 'enabled',
      ),
    ).toBe(true);
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
