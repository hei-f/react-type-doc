/**
 * CodeMirror 语义范围装饰：统一类型名、属性名、属性类型的视觉语义
 */

import {
  StateEffect,
  StateField,
  RangeSetBuilder,
  type Text,
} from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import type { SemanticRangeMeta } from '../typeToCode';
import { clickableRangeToOffsets } from './clickableDecorations';
import {
  CODE_MIRROR_SEMANTIC_RANGE_KIND,
  CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_NAMESPACE_NAME_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_FUNCTION_PROPERTY_NAME_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_PROPERTY_NAME_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME,
  CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME,
} from './constants';

export const requestSemanticDecorationsRebuildEffect =
  StateEffect.define<null>();

function semanticRangeKindToClassName(kind: SemanticRangeMeta['kind']): string {
  switch (kind) {
    case CODE_MIRROR_SEMANTIC_RANGE_KIND.NamespaceName:
      return CODE_MIRROR_SEMANTIC_NAMESPACE_NAME_CLASS_NAME;
    case CODE_MIRROR_SEMANTIC_RANGE_KIND.TypeName:
      return CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME;
    case CODE_MIRROR_SEMANTIC_RANGE_KIND.PropertyName:
      return CODE_MIRROR_SEMANTIC_PROPERTY_NAME_CLASS_NAME;
    case CODE_MIRROR_SEMANTIC_RANGE_KIND.FunctionPropertyName:
      return CODE_MIRROR_SEMANTIC_FUNCTION_PROPERTY_NAME_CLASS_NAME;
    case CODE_MIRROR_SEMANTIC_RANGE_KIND.BaseType:
      return CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME;
    case CODE_MIRROR_SEMANTIC_RANGE_KIND.PropertyType:
      return CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME;
    default:
      return CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME;
  }
}

export function buildSemanticDecorationsSet(
  doc: Text,
  ranges: SemanticRangeMeta[],
): DecorationSet {
  if (ranges.length === 0) {
    return Decoration.none;
  }

  const sorted = [...ranges].sort((a, b) => {
    const pa = clickableRangeToOffsets(doc, a.range);
    const pb = clickableRangeToOffsets(doc, b.range);
    return (pa?.from ?? 0) - (pb?.from ?? 0);
  });

  const builder = new RangeSetBuilder<Decoration>();
  for (const range of sorted) {
    const offsets = clickableRangeToOffsets(doc, range.range);
    if (!offsets) {
      continue;
    }

    builder.add(
      offsets.from,
      offsets.to,
      Decoration.mark({
        class: semanticRangeKindToClassName(range.kind),
      }),
    );
  }

  return builder.finish();
}

export function createSemanticDecorationsField(
  getRanges: () => SemanticRangeMeta[],
) {
  return StateField.define<DecorationSet>({
    create(state) {
      return buildSemanticDecorationsSet(state.doc, getRanges());
    },
    update(value, tr) {
      const needsRebuild =
        tr.docChanged ||
        tr.effects.some((effect) =>
          effect.is(requestSemanticDecorationsRebuildEffect),
        );
      if (needsRebuild) {
        return buildSemanticDecorationsSet(tr.state.doc, getRanges());
      }
      return value;
    },
    provide: (field) => EditorView.decorations.from(field),
  });
}
