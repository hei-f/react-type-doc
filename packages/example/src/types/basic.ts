/**
 * 基础类型定义
 * 测试原始类型、字面量类型等基础场景
 */

/** 原始类型 */
export interface PrimitiveTypes {
  /** 字符串类型 */
  text: string;
  /** 数字类型 */
  count: number;
  /** 布尔类型 */
  isActive: boolean;
  /** 可选字符串 */
  optionalText?: string;
  /** 可为 null 的数字 */
  nullableCount: number | null;
  /** undefined 联合类型 */
  maybeValue: string | undefined;
}

/** 字面量类型 */
export interface LiteralTypes {
  /** 字符串字面量 */
  status: 'pending' | 'success' | 'error';
  /** 数字字面量 */
  priority: 1 | 2 | 3 | 4 | 5;
  /** 布尔字面量 */
  isTrue: true;
  /** 混合字面量 */
  mixed: 'auto' | 0 | false;
}

/** 数组类型 */
export interface ArrayTypes {
  /** 字符串数组 */
  tags: string[];
  /** 数字数组 */
  scores: number[];
  /** 对象数组 */
  items: Array<{ id: string; name: string }>;
  /** 只读数组 */
  readonly readonlyList: readonly string[];
  /** 嵌套数组 */
  matrix: number[][];
}

/** 用户信息（用于元组示例） */
export interface UserInfo {
  id: number;
  name: string;
}

/** 帖子信息（用于元组示例） */
export interface PostInfo {
  title: string;
  content: string;
}

/** 元组类型 */
export interface TupleTypes {
  /** 固定长度元组 */
  coordinate: [number, number];
  /** 带标签的元组 */
  namedTuple: [x: number, y: number, z: number];
  /** 可选元素元组 */
  optionalTuple: [string, number?];
  /** 剩余元素元组 */
  restTuple: [string, ...number[]];
  /** 包含对象类型的元组（元素应该可以点击展开） */
  objectTuple: [UserInfo, PostInfo];
}

/** 自定义错误类型（用于函数示例） */
export interface CustomError {
  code: number;
  message: string;
  details?: Record<string, unknown>;
}

/** 函数类型 */
export interface FunctionTypes {
  /** 简单函数 */
  onClick: () => void;
  /** 带参数的函数 */
  onChange: (value: string) => void;
  /** 带返回值的函数 */
  onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
  /** 可选函数（内置Error类型，不可点击） */
  onError?: (error: Error) => void;
  /** 自定义错误处理函数（CustomError可点击） */
  onCustomError?: (error: CustomError) => void;
}
