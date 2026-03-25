/**
 * React Type Doc - UI Components
 * @description Out-of-the-box type documentation display components
 */

import React from 'react';

export { default as TypeDocPanel } from './panel/TypeDocPanel';
export type { TypeDocPanelProps } from './panel/TypeDocPanel';
export { TypeDocEditorPanel } from './editor/TypeDocEditorPanel';
export { en, zhCN } from './shared/locale';
export type { TypeDocLocale } from './shared/locale';

/** CodeMirror 版本的类型文档面板（动态导入） */
export const TypeDocEditorPanelLazy = React.lazy(() =>
  import('./editor/TypeDocEditorPanel').then((m) => ({
    default: m.TypeDocEditorPanel,
  })),
);
