/**
 * 共享常量定义
 * @description 集中管理项目中使用的常量，避免魔法值和重复定义
 */

/**
 * 基础类型列表
 *
 * 这些是 TypeScript 的基本类型，不需要深度解析。
 */
export const PRIMITIVE_TYPE_NAMES = [
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'void',
  'never',
  'any',
  'unknown',
  'bigint',
  'symbol',
] as const;

/**
 * TypeScript 工具类型列表
 *
 * 这些是 TypeScript 内置的工具类型，应该尝试展开解析（如果包含泛型参数）
 * 而不是标记为外部类型。
 *
 * @example
 * - Partial<T>: 将 T 的所有属性变为可选
 * - Omit<T, K>: 从 T 中排除 K 指定的属性
 * - Pick<T, K>: 从 T 中选择 K 指定的属性
 */
export const TYPESCRIPT_UTILITY_TYPES = [
  'Partial',
  'Required',
  'Readonly',
  'Pick',
  'Omit',
  'Record',
  'Exclude',
  'Extract',
  'NonNullable',
  'Parameters',
  'ConstructorParameters',
  'ReturnType',
  'InstanceType',
  'ThisParameterType',
  'OmitThisParameter',
  'ThisType',
  'Uppercase',
  'Lowercase',
  'Capitalize',
  'Uncapitalize',
  'Awaited',
] as const;

/**
 * TypeScript/JavaScript 内置类型列表
 *
 * 这些类型通常在 TypeScript 标准库中定义，
 * 应该跳过深度解析以避免展开其原型方法。
 *
 * @example
 * - String: 字符串包装对象
 * - Promise: 异步操作对象
 * - Array: 数组对象
 */
export const BUILTIN_TYPES = [
  'String',
  'Number',
  'Boolean',
  'Array',
  'Object',
  'Function',
  'Symbol',
  'BigInt',
  'Date',
  'RegExp',
  'Promise',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Error',
  'Math',
  'JSON',
] as const;

/**
 * 默认跳过深度解析的类型集合
 *
 * 这些是基础类型的包装对象，解析它们的详细结构没有意义，
 * 因为它们会展开为原型方法（如 String.prototype.toLowerCase）。
 *
 * 用户可以在配置中通过 `skipDeepParseTypes` 扩展此列表。
 */
export const DEFAULT_SKIP_DEEP_PARSE_TYPES = new Set([
  'String',
  'Number',
  'Boolean',
  'BigInt',
  'Symbol',
]);

/**
 * 索引签名的属性键名
 *
 * 用于将 TypeScript 索引签名表示为 properties 中的特殊条目。
 * 使用 TypeScript 标准语法作为键名，不会与合法的属性名冲突。
 *
 * @example
 * interface Dictionary<T> { [key: string]: T }  → 属性键为 "[key: string]"
 * interface NumberMap { [index: number]: string } → 属性键为 "[index: number]"
 */
export const INDEX_SIGNATURE_STRING_KEY = '[key: string]';
export const INDEX_SIGNATURE_NUMBER_KEY = '[index: number]';

// ============================================================
// scanDirs 目录扫描约定文件名
// ============================================================

/** scanDirs 模式下的默认组件入口文件名 */
export const DEFAULT_SCAN_DIR_COMPONENT_ENTRY = 'index.tsx';

/** scanDirs 模式下的默认类型定义文件名 */
export const DEFAULT_SCAN_DIR_TYPES_ENTRY = 'doc.types.ts';

/**
 * 默认解析配置
 *
 * 提供合理的默认值，确保在没有用户配置时也能正常工作
 */
export const DEFAULT_PARSE_OPTIONS = {
  /** 最大递归深度，防止无限递归 */
  maxDepth: 5,
  /** 缓存键的最大文本长度 */
  cacheMaxTypeTextLength: 200,
  /** 是否启用源码位置信息 */
  enableSourceLocation: false,
  /** 跳过深度解析的类型集合 */
  skipDeepParseTypes: DEFAULT_SKIP_DEEP_PARSE_TYPES,
  /** 跳过深度解析的类型名前缀列表 */
  skipDeepParsePrefixes: [] as string[],
} as const;
