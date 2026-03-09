import styled from 'styled-components';

/** 代码编辑器配色 */
const THEME = {
  bg: '#1e1e1e',
  lineNumberBg: '#252526',
  lineNumber: '#858585',
  text: '#d4d4d4',
  keyword: '#569cd6',
  type: '#4ec9b0',
  property: '#9cdcfe',
  string: '#ce9178',
  number: '#b5cea8',
  punctuation: '#d4d4d4',
  comment: '#6a9955',
  link: '#dcdcaa',
  linkHover: '#ffcc00',
  optional: '#ffffff',
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
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
`;

/** 标题文本 */
export const PanelTitle = styled.span`
  color: #cccccc;
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
    background: #1e1e1e;
  }

  &::-webkit-scrollbar-thumb {
    background: #424242;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #4f4f4f;
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
    background: rgba(255, 255, 255, 0.04);
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

/** 属性名 */
export const PropertyName = styled.span`
  color: ${THEME.property};
`;

/** 可点击的类型（自定义类型） */
export const ClickableTypeName = styled.span`
  color: ${THEME.link};
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;

  &:hover {
    color: ${THEME.linkHover};
    text-decoration-style: solid;
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
  background: #252526;
  border: 1px solid #454545;
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
  background: #252526;
  padding: 8px 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid #3c3c3c;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  width: 100%;
  min-width: 0;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1e1e1e;
  }

  &::-webkit-scrollbar-thumb {
    background: #424242;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #4f4f4f;
  }
`;

/** 面包屑项 */
export const BreadcrumbItem = styled.span<{ $clickable?: boolean }>`
  color: ${(props) => (props.$clickable ? '#4fc3f7' : '#cccccc')};
  cursor: ${(props) => (props.$clickable ? 'pointer' : 'default')};
  flex-shrink: 0;

  &:hover {
    text-decoration: ${(props) => (props.$clickable ? 'underline' : 'none')};
  }
`;

/** 面包屑分隔符 */
export const BreadcrumbSeparator = styled.span`
  color: #666;
  margin: 0 4px;
  flex-shrink: 0;
`;

/** 源码位置 */
export const SourceLocation = styled.div`
  font-size: 11px;
  color: #666;
  padding: 8px 16px;
  background: #252526;
  border-top: 1px solid #3c3c3c;
`;
