/**
 * 外部类型定义
 * 测试引用第三方库类型的场景
 */

import type { ReactNode, CSSProperties, MouseEvent, ChangeEvent } from 'react';

/** 使用 React 类型 */
export interface ReactComponentProps {
  /** React 子节点 */
  children?: ReactNode;
  /** CSS 样式 */
  style?: CSSProperties;
  /** 类名 */
  className?: string;
  /** 点击事件 */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** 变化事件 */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** 组合 React 类型和自定义类型 */
export interface CustomButtonProps {
  /** 按钮文本 */
  label: string;
  /** 按钮变体 */
  variant: 'primary' | 'secondary' | 'danger';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 图标 */
  icon?: ReactNode;
  /** 点击回调 */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 子元素 */
  children?: ReactNode;
}

/** 表单组件属性 */
export interface FormFieldProps {
  /** 字段名称 */
  name: string;
  /** 字段标签 */
  label: string;
  /** 字段值 */
  value: string;
  /** 错误信息 */
  error?: string;
  /** 是否必填 */
  required?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 变化回调 */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** 失焦回调 */
  onBlur?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** 自定义样式 */
  style?: CSSProperties;
}

/** 使用内置类型 */
export interface DataWithBuiltins {
  /** Date 对象 */
  timestamp: Date;
  /** Error 对象 */
  error?: Error;
  /** Promise 类型 */
  asyncData: Promise<string>;
  /** Map 类型 */
  dataMap: Map<string, unknown>;
  /** Set 类型 */
  uniqueItems: Set<number>;
  /** RegExp 类型 */
  pattern: RegExp;
}

/** 混合外部和自定义类型 */
export interface ComplexComponentProps {
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 数据列表 */
  data: Array<{
    id: string;
    label: string;
    value: unknown;
  }>;
  /** 渲染函数 */
  renderItem?: (item: unknown, index: number) => ReactNode;
  /** 加载状态 */
  loading?: boolean;
  /** 错误对象 */
  error?: Error;
  /** 样式 */
  style?: CSSProperties;
  /** 类名 */
  className?: string;
  /** 子元素 */
  children?: ReactNode;
  /** 事件处理 */
  onItemClick?: (item: unknown, event: MouseEvent) => void;
}
