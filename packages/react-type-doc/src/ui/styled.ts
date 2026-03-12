import styled from 'styled-components';

/** 代码编辑器配色 (One Dark Pro) */
const THEME = {
  /** 面板整体背景色 (TypeDocPanelContainer) */
  bg: '#282c34',
  /** 行号区域背景色 */
  lineNumberBg: '#282c34',
  /** 行号文字颜色 */
  lineNumber: '#495162',
  /** 默认文本颜色 (CodeContent, TypeTooltip) */
  text: '#abb2bf',
  /** 关键字颜色，如 interface、type (Keyword) */
  keyword: '#c678dd',
  /** 类型名颜色，如 string、number、boolean (TypeName, JsDocTypeRef) */
  type: '#e5c07b',
  /** 属性名颜色 (PropertyName) */
  property: '#e06c75',
  /** 函数类型属性名颜色 (FunctionPropertyName) */
  functionName: '#61afef',
  /** 字符串字面量颜色 (StringLiteral) */
  string: '#98c379',
  /** 数字字面量颜色 (NumberLiteral) */
  number: '#d19a66',
  /** 标点符号颜色，如 { } ; : (Punctuation) */
  punctuation: '#abb2bf',
  /** 注释文字颜色 (Comment, EmptyState) */
  comment: '#5c6370',
  /** 可点击类型链接颜色 (ClickableTypeName) */
  link: '#39c5bb',
  /** 链接悬停时颜色 (ClickableTypeName:hover, JsDocLink:hover) */
  linkHover: '#e5c07b',
  /** 可选标记 ? 的颜色 (OptionalMark) */
  optional: '#abb2bf',
  /** 泛型参数颜色，如 <T = unknown> (GenericParams) */
  generic: '#e5c07b',
  /** JSDoc 标签颜色，如 @param、@returns (JsDocTag) */
  jsDocTag: '#c678dd',
  /** JSDoc 内联链接 URL 颜色 (JsDocLink) */
  jsDocLink: '#61afef',
};

/** 类型文档面板容器 */
export const TypeDocPanelContainer = styled.div`
  background: ${THEME.bg};
  border-radius: 8px;
  overflow: hidden;
  max-height: 800px;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

/** 面板标题栏 */
export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #21252b;
  border-bottom: 1px solid #181a1f;
`;

/** 标题文本 */
export const PanelTitle = styled.span`
  color: #abb2bf;
  font-size: 13px;
  font-weight: 500;
`;

/** 代码区域容器 */
export const CodeContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Consolas', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #282c34;
  }

  &::-webkit-scrollbar-thumb {
    background: #4e5666;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #5a6375;
  }
`;

/** 代码内容 */
export const CodeContent = styled.pre`
  margin: 0;
  padding: 12px 16px;
  color: ${THEME.text};
  max-width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
`;

/** 代码行 */
export const CodeLine = styled.div`
  min-height: 21px;
  margin: 0 -16px;
  padding: 0 16px;

  &:hover {
    background: #2c313c;
  }
`;

/** 缩进 */
export const Indent = styled.span<{ $level: number }>`
  display: inline-block;
  width: ${(props) => props.$level * 20}px;
`;

/** 关键字 (interface, type) */
export const Keyword = styled.span`
  color: ${THEME.keyword};
`;

/** 类型名 (string, number, boolean) */
export const TypeName = styled.span`
  color: ${THEME.type};
`;

/** 泛型参数部分 (如 <T = unknown>) */
export const GenericParams = styled.span`
  color: ${THEME.generic};
`;

/** 属性名 */
export const PropertyName = styled.span`
  color: ${THEME.property};
`;

/** 函数类型的属性名 */
export const FunctionPropertyName = styled.span`
  color: ${THEME.functionName};
`;

/** 可点击的类型（自定义类型） */
export const ClickableTypeName = styled.span`
  color: ${THEME.link};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${THEME.linkHover};
  }
`;

/** 字符串字面量 */
export const StringLiteral = styled.span`
  color: ${THEME.string};
`;

/** 数字字面量 */
export const NumberLiteral = styled.span`
  color: ${THEME.number};
`;

/** 标点符号 */
export const Punctuation = styled.span`
  color: ${THEME.punctuation};
`;

/** 注释 */
export const Comment = styled.span`
  color: ${THEME.comment};
  font-style: italic;
  display: inline-block;
  text-indent: -3ch;
  padding-left: 3ch;
`;

/** 可选标记 (?) */
export const OptionalMark = styled.span`
  color: ${THEME.optional};
`;

/** 空状态 */
export const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${THEME.comment};
`;

/** 类型提示气泡 */
export const TypeTooltip = styled.div`
  position: absolute;
  background: #21252b;
  border: 1px solid #3b4048;
  border-radius: 4px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 100;
  max-width: 400px;
  font-size: 12px;
  line-height: 1.5;
  color: ${THEME.text};
`;

/** 面包屑外层包装器（用于动画） */
export const BreadcrumbWrapper = styled.div<{ $visible: boolean }>`
  max-height: ${(props) => (props.$visible ? '40px' : '0')};
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  overflow: hidden;
  transition:
    max-height 0.25s ease-in-out,
    opacity 0.2s ease-in-out;
  min-width: 0;
  width: 100%;
`;

/** 面包屑容器 */
export const BreadcrumbContainer = styled.div`
  background: #21252b;
  padding: 8px 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid #181a1f;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  width: 100%;
  min-width: 0;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #282c34;
  }

  &::-webkit-scrollbar-thumb {
    background: #4e5666;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #5a6375;
  }
`;

/** 面包屑项 */
export const BreadcrumbItem = styled.span<{ $clickable?: boolean }>`
  color: ${(props) => (props.$clickable ? '#61afef' : '#abb2bf')};
  cursor: ${(props) => (props.$clickable ? 'pointer' : 'default')};
  flex-shrink: 0;

  &:hover {
    text-decoration: ${(props) => (props.$clickable ? 'underline' : 'none')};
  }
`;

/** 面包屑分隔符 */
export const BreadcrumbSeparator = styled.span`
  color: #495162;
  margin: 0 4px;
  flex-shrink: 0;
`;

/** JSDoc 标签名（@param, @default, @returns 等） */
export const JsDocTag = styled.span`
  color: ${THEME.jsDocTag};
  font-style: normal;
`;

/** JSDoc 内联链接（URL） */
export const JsDocLink = styled.a`
  color: ${THEME.jsDocLink};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${THEME.linkHover};
  }
`;

/** JSDoc 类型引用（{@link TypeName}） */
export const JsDocTypeRef = styled.span`
  color: ${THEME.type};
  font-style: normal;
`;

/** 源码位置 */
export const SourceLocation = styled.div`
  font-size: 11px;
  color: #495162;
  padding: 8px 16px;
  background: #21252b;
  border-top: 1px solid #181a1f;
`;
