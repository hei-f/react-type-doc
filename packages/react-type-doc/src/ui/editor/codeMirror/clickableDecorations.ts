/**
 * CodeMirror 可点击类型装饰：与 typeToCode 产出的 1-based 行列范围对齐
 */

import {
  StateEffect,
  StateField,
  RangeSetBuilder,
  type Text,
} from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import type { ClickableRange } from '../typeToCode';
import { CODE_MIRROR_CLICKABLE_TYPE_CLASS_NAME } from './constants';

/** 请求按当前 ref 中的 ranges 重建装饰（文档变更或 ranges 变更时 dispatch） */
export const requestClickableDecorationsRebuildEffect =
  StateEffect.define<null>();

/**
 * 将 1-based 行列转为 CodeMirror 的 [from, to) 偏移。
 * endColumn 与 typeToCode / Monaco IRange 一致：为「末字符后一列」（独占）。
 */
export function clickableRangeToOffsets(
  doc: Text,
  range: ClickableRange['range'],
): { from: number; to: number } | null {
  if (range.startLine < 1 || range.endLine < 1) {
    return null;
  }
  if (range.startLine > doc.lines || range.endLine > doc.lines) {
    return null;
  }
  const startLine = doc.line(range.startLine);
  const endLine = doc.line(range.endLine);
  const from = startLine.from + Math.max(0, range.startColumn - 1);
  const to = endLine.from + Math.max(0, range.endColumn - 1);
  if (from >= to || from < 0 || to > doc.length) {
    return null;
  }
  return { from, to };
}

export function buildClickableDecorationsSet(
  doc: Text,
  ranges: ClickableRange[],
  hoverTitle: string,
): DecorationSet {
  const sorted = [...ranges].sort((a, b) => {
    const pa = clickableRangeToOffsets(doc, a.range);
    const pb = clickableRangeToOffsets(doc, b.range);
    return (pa?.from ?? 0) - (pb?.from ?? 0);
  });
  const builder = new RangeSetBuilder<Decoration>();
  for (const r of sorted) {
    const o = clickableRangeToOffsets(doc, r.range);
    if (!o) {
      continue;
    }
    builder.add(
      o.from,
      o.to,
      Decoration.mark({
        class: CODE_MIRROR_CLICKABLE_TYPE_CLASS_NAME,
        attributes: { title: hoverTitle },
      }),
    );
  }
  return builder.finish();
}

/**
 * 通过 getter 读取最新 ranges / 提示文案，避免闭包陈旧；ranges 变化时 dispatch rebuild effect
 */
export function createClickableDecorationsField(
  getRanges: () => ClickableRange[],
  getHoverTitle: () => string,
) {
  return StateField.define<DecorationSet>({
    create(state) {
      return buildClickableDecorationsSet(
        state.doc,
        getRanges(),
        getHoverTitle(),
      );
    },
    update(value, tr) {
      const needsRebuild =
        tr.docChanged ||
        tr.effects.some((e) => e.is(requestClickableDecorationsRebuildEffect));
      if (needsRebuild) {
        return buildClickableDecorationsSet(
          tr.state.doc,
          getRanges(),
          getHoverTitle(),
        );
      }
      return value;
    },
    provide: (field) => EditorView.decorations.from(field),
  });
}
