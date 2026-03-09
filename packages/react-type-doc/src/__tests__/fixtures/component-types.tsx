/**
 * React 组件测试 fixtures
 * 用于测试 componentParser 解析 React 组件 Props 的能力
 */

import type { ReactNode } from 'react';

/** 基础组件 Props */
export interface BasicProps {
  /** 标题 */
  title: string;
  /** 是否可见 */
  visible?: boolean;
  /** 点击回调 */
  onClick?: () => void;
}

/** 泛型组件 Props */
export interface GenericProps<T> {
  /** 数据 */
  data: T;
  /** 渲染函数 */
  render: (item: T) => ReactNode;
}

/** 复杂 Props */
export interface ComplexProps {
  /** 基础属性 */
  id: number;
  name: string;

  /** 嵌套对象 */
  config: {
    theme: 'light' | 'dark';
    size: 'small' | 'medium' | 'large';
  };

  /** 联合类型 */
  status: 'loading' | 'success' | 'error';

  /** 函数属性 */
  onChange: (value: string) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;

  /** 数组属性 */
  items: Array<{
    id: string;
    label: string;
  }>;

  /** 可选嵌套 */
  meta?: {
    author?: string;
    tags?: string[];
  };

  /** children */
  children?: ReactNode;
}

/** 继承 Props */
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface ExtendedProps extends BaseProps {
  title: string;
  content: string;
}

/** 交叉类型 Props */
export type MixedProps = BaseProps & {
  label: string;
  value: number;
};
