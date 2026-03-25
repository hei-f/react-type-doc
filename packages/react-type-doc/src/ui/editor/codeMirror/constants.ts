/**
 * CodeMirror 编辑器面板 UI 常量（可点击类型、彩虹括号、滚动条、括号配对等）
 */

import type { CSSProperties } from 'react';
import { EditorView } from '@codemirror/view';
import {
  EDITOR_BREADCRUMB_LINK,
  PANEL_THEME_CLICKABLE_LINK_COLOR,
  PANEL_THEME_JS_DOC_TAG_COLOR,
  PANEL_THEME_JS_DOC_URL_COLOR,
  PANEL_THEME_LINK_HOVER_COLOR,
  PANEL_THEME_TYPE_NAME_COLOR,
} from '../../shared/panelThemeColors';

/** 语义范围类型（与 typeToCode 输出的元数据一一对应） */
export const CODE_MIRROR_SEMANTIC_RANGE_KIND = {
  TypeName: 'type-name',
  NamespaceName: 'namespace-name',
  PropertyName: 'property-name',
  FunctionPropertyName: 'function-property-name',
  BaseType: 'base-type',
  PropertyType: 'property-type',
} as const;

/** 归为基础类型语义色的文本关键词 */
export const CODE_MIRROR_BASE_TYPE_KEYWORDS = [
  'any',
  'bigint',
  'boolean',
  'never',
  'null',
  'number',
  'string',
  'symbol',
  'undefined',
  'unknown',
  'void',
] as const;

/** 语义范围类名：类型名 */
export const CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME =
  'cm-rtd-semantic-type-name';

/** 语义范围类名：命名空间前缀 */
export const CODE_MIRROR_SEMANTIC_NAMESPACE_NAME_CLASS_NAME =
  'cm-rtd-semantic-namespace-name';

/** 语义范围类名：属性名 */
export const CODE_MIRROR_SEMANTIC_PROPERTY_NAME_CLASS_NAME =
  'cm-rtd-semantic-property-name';

/** 语义范围类名：函数属性名 */
export const CODE_MIRROR_SEMANTIC_FUNCTION_PROPERTY_NAME_CLASS_NAME =
  'cm-rtd-semantic-function-property-name';

/** 语义范围类名：基础类型 */
export const CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME =
  'cm-rtd-semantic-base-type';

/** 语义范围类名：属性类型 */
export const CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME =
  'cm-rtd-semantic-property-type';

/** CodeMirror 彩虹括号色板：避免外层括号和类型名同色 */
export const CODE_MIRROR_RAINBOW_BRACKET_COLORS = [
  PANEL_THEME_JS_DOC_TAG_COLOR,
  PANEL_THEME_JS_DOC_URL_COLOR,
  '#98c379',
  PANEL_THEME_TYPE_NAME_COLOR,
] as const;

/** 编辑器正文字号（px），与经典面板可读性接近 */
export const CODE_MIRROR_BASE_FONT_SIZE_PX = 14;

/** 外层 flex 容器：占满剩余高度，避免 .cm-scroller 仅随内容增高 */
export const CODE_MIRROR_OUTER_WRAPPER_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  width: '100%',
};

/** @uiw/react-codemirror 根节点：在 flex 列内拉伸 */
export const CODE_MIRROR_COMPONENT_ROOT_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  width: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

/** 等同经典 JsDocTag（@param、@see、@default 等块级标签） */
export const CODE_MIRROR_JSDOC_TAG_CLASS_NAME = 'cm-rtd-jsdoc-tag';

/** 等同经典 JsDocLink（URL、https 裸链） */
export const CODE_MIRROR_JSDOC_URL_CLASS_NAME = 'cm-rtd-jsdoc-url';

/** 等同经典 ClickableTypeName（可解析的 {@link Type}） */
export const CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME = 'cm-rtd-jsdoc-type-link';

/** 等同经典 JsDocTypeRef（不可解析的 {@link} 文本） */
export const CODE_MIRROR_JSDOC_TYPE_REF_CLASS_NAME = 'cm-rtd-jsdoc-type-ref';

/**
 * JSDoc 在注释内的主题（与 TypeDocPanel 的 JsDocTag / JsDocLink / ClickableTypeName / JsDocTypeRef 一致）
 */
/** 语法高亮会在装饰 span 内再包一层 token span（如 ͼw），子元素颜色会盖过外层，需同时命中后代 */
const jsdocDecoAndDescendants = (className: string) =>
  `.cm-content span.${className}, .cm-content span.${className} *`;

/** 语义装饰同样会被 token span 包裹，需要同时命中后代 */
const semanticDecoAndDescendants = (className: string) =>
  `.cm-content span.${className}, .cm-content span.${className} *`;

export const CODE_MIRROR_JSDOC_LINK_THEME = EditorView.theme({
  [jsdocDecoAndDescendants(CODE_MIRROR_JSDOC_TAG_CLASS_NAME)]: {
    color: `${PANEL_THEME_JS_DOC_TAG_COLOR} !important`,
    fontStyle: 'normal',
  },
  [jsdocDecoAndDescendants(CODE_MIRROR_JSDOC_URL_CLASS_NAME)]: {
    color: `${PANEL_THEME_JS_DOC_URL_COLOR} !important`,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    cursor: 'pointer',
  },
  [`.cm-content span.${CODE_MIRROR_JSDOC_URL_CLASS_NAME}:hover, .cm-content span.${CODE_MIRROR_JSDOC_URL_CLASS_NAME}:hover *`]:
    {
      color: `${PANEL_THEME_LINK_HOVER_COLOR} !important`,
    },
  [jsdocDecoAndDescendants(CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME)]: {
    color: `${PANEL_THEME_CLICKABLE_LINK_COLOR} !important`,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    cursor: 'pointer',
  },
  [`.cm-content span.${CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME}:hover, .cm-content span.${CODE_MIRROR_JSDOC_TYPE_LINK_CLASS_NAME}:hover *`]:
    {
      color: `${PANEL_THEME_LINK_HOVER_COLOR} !important`,
    },
  [jsdocDecoAndDescendants(CODE_MIRROR_JSDOC_TYPE_REF_CLASS_NAME)]: {
    color: `${PANEL_THEME_TYPE_NAME_COLOR} !important`,
    fontStyle: 'normal',
  },
});

export const CODE_MIRROR_SEMANTIC_THEME = EditorView.theme({
  [semanticDecoAndDescendants(
    CODE_MIRROR_SEMANTIC_NAMESPACE_NAME_CLASS_NAME,
  )]: {
    color: `${EDITOR_BREADCRUMB_LINK} !important`,
    fontStyle: 'normal',
  },
  [semanticDecoAndDescendants(CODE_MIRROR_SEMANTIC_TYPE_NAME_CLASS_NAME)]: {
    color: `${PANEL_THEME_TYPE_NAME_COLOR} !important`,
    fontStyle: 'normal',
  },
  [semanticDecoAndDescendants(CODE_MIRROR_SEMANTIC_PROPERTY_NAME_CLASS_NAME)]: {
    color: '#e06c75 !important',
    fontStyle: 'normal',
  },
  [semanticDecoAndDescendants(
    CODE_MIRROR_SEMANTIC_FUNCTION_PROPERTY_NAME_CLASS_NAME,
  )]: {
    color: `${PANEL_THEME_JS_DOC_URL_COLOR} !important`,
    fontStyle: 'normal',
  },
  [semanticDecoAndDescendants(CODE_MIRROR_SEMANTIC_BASE_TYPE_CLASS_NAME)]: {
    color: `${PANEL_THEME_JS_DOC_TAG_COLOR} !important`,
    fontStyle: 'normal',
  },
  [semanticDecoAndDescendants(CODE_MIRROR_SEMANTIC_PROPERTY_TYPE_CLASS_NAME)]: {
    color: `${PANEL_THEME_TYPE_NAME_COLOR} !important`,
    fontStyle: 'normal',
  },
});

/** 可点击类型标记的 DOM class（Decoration.mark） */
export const CODE_MIRROR_CLICKABLE_TYPE_CLASS_NAME = 'cm-rtd-clickable-type';

/** 可点击类型：柔和底纹（与面包屑青灰系一致） */
export const CODE_MIRROR_CLICKABLE_TYPE_BACKGROUND = 'rgba(126, 189, 203, 0.1)';

/** 可点击类型悬停 */
export const CODE_MIRROR_CLICKABLE_TYPE_BACKGROUND_HOVER =
  'rgba(126, 189, 203, 0.18)';

/** 可点击类型底边（细线，避免厚重虚线） */
export const CODE_MIRROR_CLICKABLE_TYPE_BORDER_BOTTOM =
  '1px solid rgba(126, 189, 203, 0.42)';

/** 滚动条轨道（与经典 CodeContainer 一致） */
export const CODE_MIRROR_SCROLLBAR_TRACK_BG = '#282c34';

/** 滚动条滑块 */
export const CODE_MIRROR_SCROLLBAR_THUMB_BG = '#4e5666';

/** 滚动条滑块悬停 */
export const CODE_MIRROR_SCROLLBAR_THUMB_HOVER_BG = '#5a6375';

/** 折叠槽图标（与经典面板注释色一致） */
export const CODE_MIRROR_FOLD_GUTTER_ICON = '#5c6370';

/** 折叠槽图标悬停 */
export const CODE_MIRROR_FOLD_GUTTER_ICON_HOVER = '#abb2bf';

/**
 * 可点击类型：低调 pill + 细底边，悬停略提亮
 */
export const CODE_MIRROR_CLICKABLE_TYPE_THEME = EditorView.theme({
  [`.${CODE_MIRROR_CLICKABLE_TYPE_CLASS_NAME}`]: {
    backgroundColor: CODE_MIRROR_CLICKABLE_TYPE_BACKGROUND,
    borderBottom: CODE_MIRROR_CLICKABLE_TYPE_BORDER_BOTTOM,
    cursor: 'pointer',
    borderRadius: '3px',
    padding: '0 1px',
  },
  [`.${CODE_MIRROR_CLICKABLE_TYPE_CLASS_NAME}:hover`]: {
    backgroundColor: CODE_MIRROR_CLICKABLE_TYPE_BACKGROUND_HOVER,
    borderBottomColor: 'rgba(168, 214, 227, 0.55)',
  },
});

/** 彩虹括号：提高选择器优先级以压过语法高亮标点色 */
export const CODE_MIRROR_RAINBOW_BRACKET_THEME = EditorView.theme({
  '.cm-content span.cm-rtd-rainbow-bracket-0': {
    color: CODE_MIRROR_RAINBOW_BRACKET_COLORS[0],
    fontWeight: '600',
  },
  '.cm-content span.cm-rtd-rainbow-bracket-1': {
    color: CODE_MIRROR_RAINBOW_BRACKET_COLORS[1],
    fontWeight: '600',
  },
  '.cm-content span.cm-rtd-rainbow-bracket-2': {
    color: CODE_MIRROR_RAINBOW_BRACKET_COLORS[2],
    fontWeight: '600',
  },
  '.cm-content span.cm-rtd-rainbow-bracket-3': {
    color: CODE_MIRROR_RAINBOW_BRACKET_COLORS[3],
    fontWeight: '600',
  },
});

/** 光标处括号配对高亮（@codemirror/language bracketMatching） */
export const CODE_MIRROR_MATCHING_BRACKET_THEME = EditorView.theme({
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'rgba(97, 175, 239, 0.22)',
    outline: '1px solid rgba(97, 175, 239, 0.55)',
  },
  '&.cm-focused .cm-nonmatchingBracket': {
    backgroundColor: 'rgba(224, 108, 117, 0.2)',
  },
});

/**
 * 编辑器布局 + 暗色滚动条（贴在可视区域底部，与面板风格一致）
 */
export const CODE_MIRROR_LAYOUT_AND_SCROLLBAR_THEME = EditorView.theme({
  '&': {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: '0',
    fontSize: `${CODE_MIRROR_BASE_FONT_SIZE_PX}px`,
  },
  '.cm-editor': {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: '0',
  },
  '.cm-scroller': {
    flex: '1 1 0%',
    minHeight: '0',
    overflow: 'auto',
    fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
    scrollbarWidth: 'thin',
    scrollbarColor: `${CODE_MIRROR_SCROLLBAR_THUMB_BG} ${CODE_MIRROR_SCROLLBAR_TRACK_BG}`,
  },
  '.cm-scroller::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '.cm-scroller::-webkit-scrollbar-track': {
    background: CODE_MIRROR_SCROLLBAR_TRACK_BG,
  },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: CODE_MIRROR_SCROLLBAR_THUMB_BG,
    borderRadius: '4px',
  },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: CODE_MIRROR_SCROLLBAR_THUMB_HOVER_BG,
  },
  '.cm-gutters': {
    backgroundColor: '#282c34',
    borderRight: '1px solid #181a1f',
  },
  '.cm-foldGutter .cm-gutterElement': {
    color: CODE_MIRROR_FOLD_GUTTER_ICON,
  },
  '.cm-foldGutter .cm-gutterElement:hover': {
    color: CODE_MIRROR_FOLD_GUTTER_ICON_HOVER,
    cursor: 'pointer',
  },
});
