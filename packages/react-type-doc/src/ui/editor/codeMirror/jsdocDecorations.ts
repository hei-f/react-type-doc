/**
 * CodeMirror 中 JSDoc 的 @ 标签样式与 {@link} / 裸 URL 点击（对齐经典面板的 renderDescription 逻辑）
 */

import {
  StateEffect,
  StateField,
  RangeSetBuilder,
  type Text,
} from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import type { TypeInfo } from '../../../shared/types';
import type { PropsDocReader } from '../../../runtime/reader';
import {
  JSDOC_INLINE_LINK_PATTERN,
  resolveJSDocTypeLink,
} from '../../shared/renderDescription';
import type { JSDocBlockMeta } from '../typeToCode';
import { clickableRangeToOffsets } from './clickableDecorations';
import {
  CODE_MIRROR_JSDOC_TAG_CLASS_NAME,
  CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME,
  CODE_MIRROR_JSDOC_TYPE_REF_CLASS_NAME,
  CODE_MIRROR_JSDOC_URL_CLASS_NAME,
} from './constants';

export const requestJSDocDecorationsRebuildEffect = StateEffect.define<null>();

export interface JSDocClickTarget {
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  kind: 'url' | 'type';
  href?: string;
  typeInfo?: TypeInfo;
  typeName?: string;
}

interface RawDecoSpan {
  lineNumber: number;
  startColumn: number;
  endColumn: number;
  className: string;
  title?: string;
}

/**
 * 与 parseDescriptionLine 一致：块级 @tag + 行内 {@link} / URL
 */
function collectSpansForDescriptionFragment(
  fragment: string,
  lineNumber: number,
  columnStart1Based: number,
  reader: PropsDocReader,
  descriptionLinks: Record<string, string> | undefined,
  getTypeLinkTitle: (name: string) => string,
  decos: RawDecoSpan[],
  clicks: JSDocClickTarget[],
): void {
  let remaining = fragment;
  let col = columnStart1Based;

  // 多行 JSDoc 的 description 行常在 @tag 前带对齐空格，必须用 \s* 才能匹配并正确算列
  const blockTagMatch = remaining.match(/^\s*(@\w+)/);
  if (blockTagMatch?.[1]) {
    const tag = blockTagMatch[1];
    const matched = blockTagMatch[0];
    const leadingWhitespaceLength = matched.length - tag.length;
    const tagStartCol = col + leadingWhitespaceLength;
    decos.push({
      lineNumber,
      startColumn: tagStartCol,
      endColumn: tagStartCol + tag.length,
      className: CODE_MIRROR_JSDOC_TAG_CLASS_NAME,
    });
    remaining = remaining.slice(matched.length);
    col += matched.length;
  }

  const regex = new RegExp(JSDOC_INLINE_LINK_PATTERN.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(remaining)) !== null) {
    if (match[1] !== undefined) {
      const linkContent = match[1].trim();
      const pipeIdx = linkContent.indexOf('|');
      const target =
        pipeIdx >= 0 ? linkContent.slice(0, pipeIdx).trim() : linkContent;
      const isUrl = /^https?:\/\//.test(target);

      const startCol = col + match.index;
      const endCol = startCol + match[0].length;
      const linkClassName = isUrl
        ? CODE_MIRROR_JSDOC_URL_CLASS_NAME
        : CODE_MIRROR_JSDOC_TYPE_REF_CLASS_NAME;
      decos.push({
        lineNumber,
        startColumn: startCol,
        endColumn: endCol,
        className: linkClassName,
      });

      if (isUrl) {
        clicks.push({
          range: {
            startLine: lineNumber,
            startColumn: startCol,
            endLine: lineNumber,
            endColumn: endCol,
          },
          kind: 'url',
          href: target,
        });
      } else {
        const found = resolveJSDocTypeLink(target, reader, descriptionLinks);
        const deco = decos[decos.length - 1];
        if (found && deco) {
          deco.className = CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME;
          clicks.push({
            range: {
              startLine: lineNumber,
              startColumn: startCol,
              endLine: lineNumber,
              endColumn: endCol,
            },
            kind: 'type',
            typeInfo: found.typeInfo,
            typeName: found.typeName,
          });
          deco.title = getTypeLinkTitle(found.typeName);
        }
      }
    } else if (match[2]) {
      const url = match[2];
      const startCol = col + match.index;
      const endCol = startCol + match[0].length;
      decos.push({
        lineNumber,
        startColumn: startCol,
        endColumn: endCol,
        className: CODE_MIRROR_JSDOC_URL_CLASS_NAME,
      });
      clicks.push({
        range: {
          startLine: lineNumber,
          startColumn: startCol,
          endLine: lineNumber,
          endColumn: endCol,
        },
        kind: 'url',
        href: url,
      });
    }
  }
}

function collectAllJSDocDecosAndClicks(
  code: string,
  blocks: JSDocBlockMeta[],
  reader: PropsDocReader,
  getTypeLinkTitle: (name: string) => string,
): { decos: RawDecoSpan[]; clicks: JSDocClickTarget[] } {
  const lines = code.split('\n');
  const decos: RawDecoSpan[] = [];
  const clicks: JSDocClickTarget[] = [];

  for (const block of blocks) {
    const links = block.descriptionLinks;
    if (block.kind === 'single') {
      const innerStartCol = block.indent.length + 5;
      collectSpansForDescriptionFragment(
        block.description,
        block.line,
        innerStartCol,
        reader,
        links,
        getTypeLinkTitle,
        decos,
        clicks,
      );
    } else {
      const descLines = block.description.split('\n');
      const prefixLen = block.indent.length + 3;
      for (let i = 0; i < descLines.length; i++) {
        const lineNo = block.firstContentLine + i;
        if (!lines[lineNo - 1]) {
          continue;
        }
        collectSpansForDescriptionFragment(
          descLines[i]!,
          lineNo,
          prefixLen + 1,
          reader,
          links,
          getTypeLinkTitle,
          decos,
          clicks,
        );
      }
    }
  }

  return { decos, clicks };
}

export function buildJSDocClickTargetsFromCode(
  code: string,
  blocks: JSDocBlockMeta[],
  reader: PropsDocReader,
  getTypeLinkTitle: (name: string) => string,
): JSDocClickTarget[] {
  return collectAllJSDocDecosAndClicks(code, blocks, reader, getTypeLinkTitle)
    .clicks;
}

function buildJSDocDecorationSet(
  doc: Text,
  code: string,
  blocks: JSDocBlockMeta[],
  reader: PropsDocReader,
  getTypeLinkTitle: (name: string) => string,
): DecorationSet {
  if (!reader || blocks.length === 0) {
    return Decoration.none;
  }
  const { decos } = collectAllJSDocDecosAndClicks(
    code,
    blocks,
    reader,
    getTypeLinkTitle,
  );

  decos.sort((a, b) => {
    if (a.lineNumber !== b.lineNumber) {
      return a.lineNumber - b.lineNumber;
    }
    return a.startColumn - b.startColumn;
  });

  const builder = new RangeSetBuilder<Decoration>();
  for (const d of decos) {
    const range = {
      startLine: d.lineNumber,
      startColumn: d.startColumn,
      endLine: d.lineNumber,
      endColumn: d.endColumn,
    };
    const o = clickableRangeToOffsets(doc, range);
    if (!o) {
      continue;
    }
    builder.add(
      o.from,
      o.to,
      Decoration.mark({
        class: d.className,
        ...(d.title ? { attributes: { title: d.title } } : {}),
      }),
    );
  }
  return builder.finish();
}

export function createJSDocDecorationsField(
  getCode: () => string,
  getBlocks: () => JSDocBlockMeta[],
  getReader: () => PropsDocReader,
  getTypeLinkTitle: () => (name: string) => string,
) {
  return StateField.define<DecorationSet>({
    create(state) {
      return buildJSDocDecorationSet(
        state.doc,
        getCode(),
        getBlocks(),
        getReader(),
        getTypeLinkTitle(),
      );
    },
    update(deco, tr) {
      const needsRebuild =
        tr.docChanged ||
        tr.effects.some((e) => e.is(requestJSDocDecorationsRebuildEffect));
      if (needsRebuild) {
        return buildJSDocDecorationSet(
          tr.state.doc,
          getCode(),
          getBlocks(),
          getReader(),
          getTypeLinkTitle(),
        );
      }
      return deco;
    },
    provide: (field) => EditorView.decorations.from(field),
  });
}
