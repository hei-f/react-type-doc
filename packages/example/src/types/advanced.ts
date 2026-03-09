/**
 * 高级类型定义
 * 测试模板字面量类型、映射类型、infer 推断等高级特性
 */

/** 模板字面量类型 */
export type EventName = 'click' | 'focus' | 'blur';
export type EventHandler = `on${Capitalize<EventName>}`;

export type HTTPMethod = 'get' | 'post' | 'put' | 'delete';
export type APIEndpoint = `/${string}`;
export type APIRoute = `${HTTPMethod}:${APIEndpoint}`;

/** 递归模板字面量 */
export type Path = string;
export type NestedPath<T extends string> = T | `${T}.${string}`;

/** 字符串操作工具类型 */
export type Uppercase<S extends string> = Uppercase<S>;
export type Lowercase<S extends string> = Lowercase<S>;
export type Capitalize<S extends string> = Capitalize<S>;
export type Uncapitalize<S extends string> = Uncapitalize<S>;

/** 复杂模板字面量 */
export type CSSProperty = 'color' | 'background' | 'border';
export type CSSValue = string | number;
export type CSSRule = `${CSSProperty}: ${string}`;

/** infer 类型推断 */
export type GetReturnType<T> = T extends (...args: unknown[]) => infer R
  ? R
  : never;
export type GetFirstArg<T> = T extends (
  first: infer F,
  ...args: unknown[]
) => unknown
  ? F
  : never;
export type GetArrayElement<T> = T extends (infer E)[] ? E : never;
export type GetPromiseValue<T> = T extends Promise<infer V> ? V : never;

/** 复杂 infer 推断 */
export type UnwrapArray<T> =
  T extends Array<infer U> ? (U extends Array<infer V> ? V : U) : T;

export type DeepUnwrap<T> =
  T extends Promise<infer U>
    ? DeepUnwrap<U>
    : T extends Array<infer V>
      ? DeepUnwrap<V>
      : T;

/** 递归映射类型 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/** 键值转换 */
export type KeysToValues<T> = {
  [K in keyof T]: K;
};

export type ValuesToKeys<T extends Record<string, string>> = {
  [K in T[keyof T]]: {
    [P in keyof T]: T[P] extends K ? P : never;
  }[keyof T];
};

/** 条件分发 */
export type ToArray<T> = T extends unknown ? T[] : never;
export type ToPromise<T> = T extends unknown ? Promise<T> : never;

/** 复杂类型体操 */
export type Diff<T, U> = T extends U ? never : T;
export type Filter<T, U> = T extends U ? T : never;
export type NonUndefined<T> = T extends undefined ? never : T;

/** 函数重载类型 */
export interface Overloaded {
  (x: string): string;
  (x: number): number;
  (x: boolean): boolean;
}

/** 可变元组类型 */
export type Prepend<T, U extends unknown[]> = [T, ...U];
export type Append<T extends unknown[], U> = [...T, U];
export type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];

/** 对象路径类型 */
export type PathKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${PathKeys<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/** 根据路径获取值类型 */
export type PathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? PathValue<T[K], R>
      : never
    : never;

/** 函数组合类型 */
export type Fn = (arg: unknown) => unknown;
export type Compose<F extends Fn, G extends Fn> = (
  arg: Parameters<G>[0],
) => ReturnType<F>;

/** 类型守卫辅助 */
export type TypeGuard<T> = (value: unknown) => value is T;
export type AssertType<T> = (value: unknown) => asserts value is T;
