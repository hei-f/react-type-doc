/**
 * 基础类型测试 fixtures
 * 用于测试 typeParser 对各种基础 TypeScript 类型的解析能力
 */

/** 基础类型 */
export type PrimitiveTypes = {
  str: string;
  num: number;
  bool: boolean;
  nul: null;
  undef: undefined;
};

/** 字面量类型 */
export type LiteralTypes = {
  stringLit: 'hello';
  numberLit: 42;
  boolLit: true;
};

/** 数组类型 */
export type ArrayTypes = {
  stringArray: string[];
  numberArray: number[];
  nestedArray: string[][];
};

/** 元组类型 */
export type TupleTypes = {
  pair: [string, number];
  triple: [string, number, boolean];
  optionalTuple: [string, number?];
};

/** 函数类型 */
export type FunctionTypes = {
  simple: () => void;
  withParams: (a: string, b: number) => boolean;
  withOptional: (a: string, b?: number) => void;
  withRest: (...args: string[]) => void;
  generic: <T>(value: T) => T;
};

/** 联合类型 */
export type UnionTypes = {
  stringOrNumber: string | number;
  multiUnion: string | number | boolean;
  literalUnion: 'a' | 'b' | 'c';
};

/** 交叉类型 */
export type IntersectionTypes = {
  combined: { a: string } & { b: number };
  multi: { a: string } & { b: number } & { c: boolean };
};

/** 枚举类型 */
export enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
}

export type EnumType = {
  color: Color;
};

/** 可选属性 */
export type OptionalProps = {
  required: string;
  optional?: number;
  nullable: string | null;
  undefinable: string | undefined;
};

/** 索引签名 */
export type IndexSignature = {
  [key: string]: number;
};

/** 嵌套对象 */
export type NestedObject = {
  level1: {
    level2: {
      level3: string;
    };
  };
};

/** 泛型类型 */
export type GenericType<T> = {
  value: T;
  array: T[];
};

/** 条件类型 */
export type ConditionalType<T> = T extends string ? 'string' : 'other';

/** 映射类型 */
export type MappedType<T> = {
  [K in keyof T]: T[K];
};

/** 工具类型 - Partial */
export interface User {
  id: number;
  name: string;
  email: string;
}

export type PartialUser = Partial<User>;

/** 工具类型 - Pick */
export type UserBasic = Pick<User, 'id' | 'name'>;

/** 工具类型 - Omit */
export type UserWithoutEmail = Omit<User, 'email'>;

/** 循环引用 */
export type TreeNode = {
  value: string;
  children?: TreeNode[];
};

/** 相互循环引用 */
export type NodeA = {
  value: string;
  nodeB?: NodeB;
};

export type NodeB = {
  value: number;
  nodeA?: NodeA;
};
