/**
 * React Type Doc - UI Components
 * @description Out-of-the-box type documentation display components
 */

import React from 'react';
import type { TypeDocPanelProps } from './panel/TypeDocPanel';

export { default as TypeDocPanel } from './panel/TypeDocPanel';
export type { TypeDocPanelProps } from './panel/TypeDocPanel';
export { en, zhCN } from './shared/locale';
export type { TypeDocLocale } from './shared/locale';

// 延迟加载编辑器面板，避免经典 UI 入口在导入阶段就解析 CodeMirror 依赖。
export const TypeDocEditorPanelLazy = React.lazy(() =>
  import('./editor/TypeDocEditorPanel').then((m) => ({
    default: m.TypeDocEditorPanel,
  })),
);

export function TypeDocEditorPanel(props: TypeDocPanelProps) {
  return React.createElement(
    React.Suspense,
    { fallback: null },
    React.createElement(TypeDocEditorPanelLazy, props),
  );
}
