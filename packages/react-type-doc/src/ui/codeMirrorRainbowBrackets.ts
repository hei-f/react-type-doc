/**
 * CodeMirror 彩虹括号：与经典 TypeDocPanel 相同四色循环，仅处理 {} () []（忽略 <> 避免泛型/运算符歧义）
 */

import { StateField, RangeSetBuilder, type Text } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import { BRACKET_PAIR_HIGHLIGHT_COLORS } from './panelThemeColors';

const OPEN_BRACKETS = new Set(['{', '(', '[']);
const CLOSE_BRACKETS = new Set(['}', ')', ']']);

/**
 * 扫描文档，为括号字符生成按嵌套深度配色的装饰（跳过 //、/* *\/、字符串、` 模板字符串）
 */
function buildRainbowBracketDecorations(doc: Text): DecorationSet {
  const text = doc.toString();
  const builder = new RangeSetBuilder<Decoration>();
  const depthStack: number[] = [];

  type ScanState =
    | 'code'
    | 'lineComment'
    | 'blockComment'
    | 'strD'
    | 'strS'
    | 'strB';
  let state: ScanState = 'code';
  let i = 0;

  while (i < text.length) {
    const c = text[i]!;

    if (state === 'lineComment') {
      if (c === '\n') {
        state = 'code';
      }
      i += 1;
      continue;
    }

    if (state === 'blockComment') {
      if (c === '*' && text[i + 1] === '/') {
        i += 2;
        state = 'code';
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'strD') {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === '"') {
        i += 1;
        state = 'code';
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'strS') {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === "'") {
        i += 1;
        state = 'code';
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'strB') {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === '`') {
        i += 1;
        state = 'code';
        continue;
      }
      i += 1;
      continue;
    }

    if (c === '/' && text[i + 1] === '/') {
      i += 2;
      state = 'lineComment';
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i += 2;
      state = 'blockComment';
      continue;
    }
    if (c === '"') {
      i += 1;
      state = 'strD';
      continue;
    }
    if (c === "'") {
      i += 1;
      state = 'strS';
      continue;
    }
    if (c === '`') {
      i += 1;
      state = 'strB';
      continue;
    }

    if (OPEN_BRACKETS.has(c)) {
      const depth = depthStack.length;
      depthStack.push(depth);
      const tone = depth % BRACKET_PAIR_HIGHLIGHT_COLORS.length;
      builder.add(
        i,
        i + 1,
        Decoration.mark({
          class: `cm-rtd-rainbow-bracket cm-rtd-rainbow-bracket-${tone}`,
        }),
      );
      i += 1;
      continue;
    }

    if (CLOSE_BRACKETS.has(c)) {
      if (depthStack.length > 0) {
        const depth = depthStack.pop()!;
        const tone = depth % BRACKET_PAIR_HIGHLIGHT_COLORS.length;
        builder.add(
          i,
          i + 1,
          Decoration.mark({
            class: `cm-rtd-rainbow-bracket cm-rtd-rainbow-bracket-${tone}`,
          }),
        );
      }
      i += 1;
      continue;
    }

    i += 1;
  }

  return builder.finish();
}

export const rainbowBracketsField = StateField.define<DecorationSet>({
  create(state) {
    return buildRainbowBracketDecorations(state.doc);
  },
  update(value, tr) {
    if (tr.docChanged) {
      return buildRainbowBracketDecorations(tr.state.doc);
    }
    return value;
  },
  provide: (field) => EditorView.decorations.from(field),
});
