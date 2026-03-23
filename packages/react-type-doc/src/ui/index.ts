/**
 * React Type Doc - UI Components
 * @description Out-of-the-box type documentation display components
 */

import React from 'react';

export { default as TypeDocPanel } from './TypeDocPanel';
export type { TypeDocPanelProps } from './TypeDocPanel';
export { TypeDocEditorPanel } from './TypeDocEditorPanel';
export { en, zhCN } from './locale';
export type { TypeDocLocale } from './locale';

/** CodeMirror 版本的类型文档面板（动态导入） */
export const TypeDocEditorPanelLazy = React.lazy(() =>
  import('./TypeDocEditorPanel').then((m) => ({
    default: m.TypeDocEditorPanel,
  })),
);
