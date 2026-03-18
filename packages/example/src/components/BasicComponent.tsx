/**
 * 基础组件
 * 使用基础类型作为 Props
 */

import type { PrimitiveTypes, LiteralTypes, ArrayTypes } from '../types/basic';

export interface BasicComponentProps extends PrimitiveTypes, LiteralTypes {
  /**
   * 文本内容字段
   *
   * 用于显示组件的主要文本信息，支持任意长度的字符串。
   * 这是一个必填属性，组件渲染时会将其作为标题展示。
   *
   * @example
   * ```tsx
   * <BasicComponent text="欢迎使用 React Type Doc" />
   * ```
   */
  text: string;

  /**
   * 计数器数值
   *
   * 第二段：用于记录组件相关的数值统计信息，例如访问次数、点击次数等。
   * 支持正整数、负整数和小数。
   *
   * 第三段：该属性在组件内部会进行格式化展示。
   *
   * @default 0
   */
  count: number;

  /**
   * 激活状态标志
   * @deprecated 请使用新的 status 属性来管理组件状态，此属性将在下一个主版本中移除
   */
  isActive: boolean;

  /**
   * 可选文本说明
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
   */
  optionalText?: string;

  /**
   * 可空的计数值
   *
   * 该属性可以存储数字或 null 值。关于类型系统的更多信息，
   * 可参考 {@link PrimitiveTypes} 类型定义。
   */
  nullableCount: number | null;

  /**
   * 可能为 undefined 的值
   *
   * 综合标签测试：这个属性展示了多个 JSDoc 标签的组合使用。
   *
   * @default undefined
   * @see https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
   * @example
   * ```tsx
   * // 可以传递字符串
   * <BasicComponent maybeValue="some value" />
   * // 也可以不传递（默认 undefined）
   * <BasicComponent />
   * ```
   */
  maybeValue?: string | undefined;

  /**
   * 状态字面量
   *
   * @example
   * ```tsx
   * <BasicComponent status="pending" />
   * <BasicComponent status="success" />
   * <BasicComponent status="error" />
   * ```
   */
  status: 'pending' | 'success' | 'error';

  /**
   * 优先级等级
   *
   * 第一段：表示任务或事项的优先级，数值越大优先级越高。
   *
   * 第二段：1 表示最低优先级，5 表示最高优先级。
   * 优先级会影响组件的视觉展示效果。
   */
  priority: 1 | 2 | 3 | 4 | 5;

  /**
   * 布尔字面量（固定为 true）
   */
  isTrue: true;

  /**
   * 混合字面量类型
   *
   * 包含字符串、数字和布尔类型的字面量联合。
   * 参考 {@link LiteralTypes} 了解更多字面量类型的用法。
   */
  mixed: 'auto' | 0 | false;

  /** 标签列表 */
  tags: ArrayTypes['tags'];

  /**
   * 数据更新回调函数
   *
   * 当组件内部数据发生变化时会触发此回调。
   *
   * @param data - 更新后的基础类型数据对象
   */
  onUpdate?: (data: PrimitiveTypes) => void;
}

export const BasicComponent = (props: BasicComponentProps) => {
  return (
    <div>
      <h2>{props.text}</h2>
      <p>Count: {props.count}</p>
      <p>Status: {props.status}</p>
      <p>Priority: {props.priority}</p>
      <div>
        {props.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
};
