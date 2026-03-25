/**
 * 类型文档面板与 CodeMirror 编辑器共用的主题色（避免魔法字符串、与经典面板对齐）
 */

/** 括号层级配色（与经典 TypeDocPanel 的 BRACKET_COLORS 一致，4 色循环） */
export const BRACKET_PAIR_HIGHLIGHT_COLORS = [
  '#e5c07b',
  '#c678dd',
  '#61afef',
  '#98c379',
] as const;

/** 编辑器面包屑可点击链接（柔和青灰，避免高饱和蓝） */
export const EDITOR_BREADCRUMB_LINK = '#7ebdcb';

/** 面包屑链接悬停 */
export const EDITOR_BREADCRUMB_LINK_HOVER = '#a8d6e3';

/** 面包屑链接底边（低对比） */
export const EDITOR_BREADCRUMB_LINK_UNDERLINE = 'rgba(126, 189, 203, 0.4)';

/** 面包屑链接悬停背景 */
export const EDITOR_BREADCRUMB_LINK_HOVER_BG = 'rgba(255, 255, 255, 0.05)';

/** 与 styled THEME 一致：JSDoc 块标签 @param、@see（JsDocTag） */
export const PANEL_THEME_JS_DOC_TAG_COLOR = '#c678dd';

/** JSDoc 内联 URL、裸链接（JsDocLink） */
export const PANEL_THEME_JS_DOC_URL_COLOR = '#61afef';

/** 类型名 / 不可解析 {@link} 展示（TypeName、JsDocTypeRef） */
export const PANEL_THEME_TYPE_NAME_COLOR = '#e5c07b';

/** 可点击类型链接（ClickableTypeName、可解析 {@link}） */
export const PANEL_THEME_CLICKABLE_LINK_COLOR = '#39c5bb';

/** 链接悬停（ClickableTypeName:hover、JsDocLink:hover） */
export const PANEL_THEME_LINK_HOVER_COLOR = '#e5c07b';
