/**
 * 注释风格测试组件
 * 用于验证 react-type-doc 对各种 JSDoc 注释格式的提取效果
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ComplexCommentProps } from './doc.types';

export interface CommentStylesProps {
  /** 单行 JSDoc 注释 */
  singleLineDoc: string;

  /**
   * 多行 JSDoc 注释
   * 这是第二行描述，用于测试换行是否保留
   */
  multiLineDoc: string;

  /**
   * 包含 @deprecated 标签的属性
   * @deprecated 请使用 newApiVersion 代替
   */
  deprecatedProp?: string;

  /**
   * 包含 @example 标签的属性
   * @example
   * ```tsx
   * <CommentStyles withExample="hello" />
   * ```
   */
  withExample: string;

  /**
   * 包含 @default 标签的属性
   * @default 'light'
   */
  withDefault?: 'light' | 'dark';

  /**
   * 包含 @see 标签的属性
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
   */
  withSee?: string;

  /**
   * 包含内联 {@link URL} 引用的属性
   * 可参考 {@link ComplexCommentProps} 了解复杂属性注释的用法
   */
  withInlineLink?: string;

  // 普通单行注释（不应被 JSDoc 解析器提取）
  plainComment: number;

  /* 普通块注释（不应被 JSDoc 解析器提取） */
  blockComment: boolean;

  noComment: string;

  /**
   * 多段落描述
   *
   * 第二段：这个属性用于测试较长的描述文本是否能正确显示。
   * 包含了多个句子来验证段落分隔的效果。
   *
   * 第三段：还可以包含更多说明。
   */
  multiParagraph: string;

  /**
   * 综合标签测试
   * @description 这是通过 @description 标签提供的描述
   * @default 42
   * @example count={100}
   * @see https://example.com
   */
  combinedTags?: number;
}

export const CommentStyles = (props: CommentStylesProps) => {
  return (
    <div>
      <h2>Comment Styles Test</h2>
      <p>{props.singleLineDoc}</p>
      <p>{props.multiLineDoc}</p>
      <p>{props.noComment}</p>
      <p>{props.multiParagraph}</p>
    </div>
  );
};
