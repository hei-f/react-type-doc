/**
 * 泛型类型定义
 * 测试泛型、泛型约束、条件类型等高级场景
 */

/** 基础泛型 */
export interface Box<T> {
  value: T;
}

export interface Pair<K, V> {
  key: K;
  value: V;
}

/** 泛型约束 */
export interface Lengthwise {
  length: number;
}

export interface WithLength<T extends Lengthwise> {
  item: T;
  length: number;
}

/** 泛型默认值 */
export interface Response<T = unknown, E = Error> {
  data?: T;
  error?: E;
  loading: boolean;
}

/** 条件类型 */
export type IsString<T> = T extends string ? true : false;
export type IsArray<T> = T extends Array<unknown> ? true : false;
export type Unwrap<T> = T extends Promise<infer U> ? U : T;
export type Flatten<T> = T extends Array<infer U> ? U : T;

/** 复杂条件类型 */
export type NonNullable<T> = T extends null | undefined ? never : T;
export type ExtractString<T> = T extends string ? T : never;
export type ExcludeNull<T> = T extends null ? never : T;

/** 映射类型 */
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/** 复杂映射类型 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/** 泛型函数类型 */
export interface GenericFunctions<T> {
  get: (id: string) => Promise<T>;
  set: (id: string, value: T) => Promise<void>;
  update: (id: string, updater: (prev: T) => T) => Promise<T>;
  delete: (id: string) => Promise<boolean>;
}

/** 高级泛型组合 */
export interface Repository<T extends { id: string }> {
  findById: (id: string) => Promise<T | null>;
  findAll: () => Promise<T[]>;
  create: (data: Omit<T, 'id'>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

/** 递归泛型 */
export interface TreeNode<T> {
  value: T;
  children?: TreeNode<T>[];
}

export interface LinkedListNode<T> {
  value: T;
  next?: LinkedListNode<T>;
}

/** 泛型约束组合 */
export interface Comparable {
  compareTo(other: unknown): number;
}

export interface Serializable {
  toJSON(): string;
}

export interface Entity<T extends Comparable & Serializable> {
  data: T;
  compare: (other: T) => number;
  serialize: () => string;
}
