/**
 * 基础组件
 * 使用基础类型作为 Props
 */

import type { PrimitiveTypes, LiteralTypes, ArrayTypes } from '../types/basic';

export interface BasicComponentProps extends PrimitiveTypes, LiteralTypes {
  /** 标签列表 */
  tags: ArrayTypes['tags'];
  /** 回调函数 */
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
