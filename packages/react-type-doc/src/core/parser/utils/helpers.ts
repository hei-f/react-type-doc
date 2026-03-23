/**
 * 类型解析器 - 纯工具函数与常量
 * @description 无状态的辅助函数和常量定义
 */

import { createHash } from 'crypto';
import type { Type, Symbol as TsSymbol } from 'ts-morph';
import type { TypeInfo } from '../../../shared/types';
import { PRIMITIVE_TYPE_NAMES } from '../../../shared/constants';

// ============================================================
// 常量定义
// ============================================================

/**
 * 基础类型集合（用于快速查找，从 constants.ts 导入的数组生成）
 */
export const PRIMITIVE_TYPES = new Set(PRIMITIVE_TYPE_NAMES);

/** 缓存 key 前缀 */
export const CACHE_PREFIX_PRIMITIVE = 'primitive:';
export const CACHE_PREFIX_TEXT = 'text:';
export const CACHE_PREFIX_HASH = 'hash:';
export const CACHE_PREFIX_ARRAY = 'array:';
export const CACHE_PREFIX_ANON = 'anon:';
export const CACHE_PREFIX_LITERAL = 'literal:';

/** 显示文本常量 */
export const DISPLAY_ANONYMOUS_OBJECT = '[匿名对象]';
export const DISPLAY_MAX_DEPTH_REACHED = '[达到最大深度]';

/** 匿名对象紧凑摘要中最多显示的属性数 */
const ANONYMOUS_OBJECT_PREVIEW_MAX_PROPS = 3;
export const TS_ANONYMOUS_TYPE = '__type';

/** Symbol 属性前缀 */
export const SYMBOL_PROPERTY_PREFIX = '[Symbol.';

/** 跳过深度解析的内置属性 */
export const SKIP_BUILTIN_PROPERTIES = new Set([
  'prototype',
  'constructor',
  '__proto__',
]);

/** 缓存文本长度限制 */
export const CACHE_MAX_TEXT_KEY_CONTENT_LENGTH = 100;

// ============================================================
// 类型定义
// ============================================================

/** 递归解析器类型 */
export type RecursiveParser = (
  type: Type,
  visited: Set<string>,
  depth: number,
) => TypeInfo;

// ============================================================
// 纯工具函数
// ============================================================

/**
 * 对文本生成短 hash key
 * 使用 md5 取前 16 位，碰撞概率极低
 */
export function hashText(text: string): string {
  return createHash('md5').update(text).digest('hex').slice(0, 16);
}

/**
 * 清理类型文本，移除 import 路径（纯函数）
 */
export function cleanTypeText(text: string): string {
  return text.replace(/import\([^)]+\)\./g, '');
}

/**
 * 从类型文本中移除 undefined
 * @param text 原始类型文本
 * @returns 移除 undefined 后的类型文本
 * @example
 * removeUndefinedFromText('string | undefined') // => 'string'
 * removeUndefinedFromText('undefined | string') // => 'string'
 * removeUndefinedFromText('a | undefined | b') // => 'a | b'
 * removeUndefinedFromText('undefined') // => 'undefined' (保持不变)
 */
export function removeUndefinedFromText(text: string): string {
  const trimmed = text.trim();

  // 如果整个类型就是 undefined，保持不变
  if (trimmed === 'undefined') {
    return trimmed;
  }

  // 移除 | undefined 和 undefined | 的各种情况
  const result = trimmed
    // 先移除开头的 undefined |（带空格）
    .replace(/^undefined\s*\|\s*/g, '')
    // 移除末尾的 | undefined（带空格）
    .replace(/\s*\|\s*undefined$/g, '')
    // 移除中间的 | undefined |（带空格），注意保留 | 连接符
    .replace(/\s*\|\s*undefined\s*\|/g, ' |')
    // 清理多余空格，但保留 | 两侧的空格
    .replace(/\s+/g, ' ')
    .trim();

  // 如果清理后为空（理论上不应该发生，但保险起见）
  if (!result) {
    return 'undefined';
  }

  return result;
}

/**
 * 构建 name 字段，当 name == text 时返回空对象以省略 name 字段
 * @param name 类型名称
 * @param text 类型文本
 * @returns 包含 name 字段的对象，或空对象
 */
export function buildNameField(
  name: string,
  text: string,
): { name: string } | Record<string, never> {
  return name === text ? {} : { name };
}

/**
 * 获取类型的显示名称，处理 __type 等匿名类型情况
 * 优先使用 typeText（保留命名空间前缀如 API.xxx）
 * @param type 类型对象
 * @param typeText 类型文本
 * @returns 类型显示名称
 */
export function getTypeDisplayName(type: Type, typeText: string): string {
  // 如果 typeText 是有效的类型名称（非匿名对象），直接使用
  // 这样可以保留命名空间前缀（如 API.FrequencyConf）
  if (!typeText.startsWith('{') && !typeText.startsWith('(')) {
    return typeText;
  }

  // 匿名对象类型：生成紧凑属性摘要使不同匿名对象可区分
  if (typeText.startsWith('{')) {
    return getCompactObjectSummary(type);
  }

  const symbol = type.getSymbol();
  const aliasSymbol = type.getAliasSymbol();

  // 尝试使用别名符号
  if (aliasSymbol) {
    const aliasName = aliasSymbol.getName();
    if (aliasName && aliasName !== '__type') {
      return aliasName;
    }
  }

  // 尝试使用类型符号
  if (symbol) {
    const symbolName = symbol.getName();
    if (symbolName && symbolName !== '__type') {
      return symbolName;
    }
  }

  // 回退到 Object
  return 'Object';
}

/**
 * 生成匿名对象类型的紧凑属性名摘要
 * 如 `{ id, name, email }` 或 `{ id, name, ... }`
 * @returns 紧凑摘要文本，无属性时回退为 DISPLAY_ANONYMOUS_OBJECT
 */
function getCompactObjectSummary(type: Type): string {
  const properties = type.getProperties();
  if (properties.length === 0) {
    return DISPLAY_ANONYMOUS_OBJECT;
  }

  const displayProps = properties.slice(0, ANONYMOUS_OBJECT_PREVIEW_MAX_PROPS);
  const propNames = displayProps.map((p) => p.getName());
  const hasMore = properties.length > ANONYMOUS_OBJECT_PREVIEW_MAX_PROPS;

  return `{ ${propNames.join(', ')}${hasMore ? ', ...' : ''} }`;
}

/**
 * 从字面量类型文本中提取纯净的值（移除引号）
 * @param typeText 字面量类型的文本表示
 * @returns 纯净的字面量值
 * @example
 * extractLiteralValue('"hello"') // => 'hello'
 * extractLiteralValue("'world'") // => 'world'
 * extractLiteralValue('42') // => '42'
 */
export function extractLiteralValue(typeText: string): string {
  // 检查首尾是否为引号（单引号或双引号）
  if (
    (typeText.startsWith('"') && typeText.endsWith('"')) ||
    (typeText.startsWith("'") && typeText.endsWith("'"))
  ) {
    // 移除首尾引号
    return typeText.slice(1, -1);
  }
  // 数字和布尔字面量没有引号，直接返回
  return typeText;
}

/**
 * 获取字面量类型的分类
 * @param type ts-morph Type 对象
 * @returns 字面量类型分类，非字面量返回 null
 */
export function getLiteralTypeCategory(
  type: Type,
): 'string' | 'number' | 'boolean' | null {
  if (type.isStringLiteral()) {
    return 'string';
  }
  if (type.isNumberLiteral()) {
    return 'number';
  }
  if (type.isBooleanLiteral()) {
    return 'boolean';
  }
  return null;
}

/**
 * 获取类型的唯一标识符（用于循环引用检测）
 * @param type 要获取标识符的类型
 * @param skipDeepParseTypes 跳过深度解析的类型集合
 * @returns 类型唯一标识符
 */
export function getTypeUniqueId(
  type: Type,
  skipDeepParseTypes: Set<string>,
): string {
  // 对于数组类型，使用类型文本的 hash 作为唯一 ID
  // 避免 API.FrequencyConf[] 和 API.UserLimitDimensionEnum[] 使用相同的 Array ID
  if (type.isArray()) {
    return `${CACHE_PREFIX_ARRAY}${hashText(cleanTypeText(type.getText()))}`;
  }

  const symbol = type.getSymbol();
  const aliasSymbol = type.getAliasSymbol();

  // 优先使用 aliasSymbol
  if (aliasSymbol) {
    const qualifiedName = aliasSymbol.getFullyQualifiedName();
    if (qualifiedName && qualifiedName !== TS_ANONYMOUS_TYPE) {
      return qualifiedName;
    }
  }

  // 然后使用 symbol
  if (symbol) {
    const qualifiedName = symbol.getFullyQualifiedName();
    // 排除内置类型名（如 Array、Object），使用类型文本代替
    if (
      qualifiedName &&
      qualifiedName !== TS_ANONYMOUS_TYPE &&
      !skipDeepParseTypes.has(qualifiedName)
    ) {
      return qualifiedName;
    }
  }

  // 对于匿名类型、无 symbol 或内置类型的情况，使用类型文本的 hash
  return `${CACHE_PREFIX_ANON}${hashText(cleanTypeText(type.getText()))}`;
}

/**
 * 判断类型信息是否为引用类型
 */
export function isTypeRef(
  typeInfo: TypeInfo,
): typeInfo is { $ref: string; description?: string; required?: boolean } {
  return '$ref' in typeInfo;
}

/**
 * 检查符号是否来自 node_modules（排除 TypeScript 标准库）
 * TypeScript 标准库类型（Date/RegExp/Error 等）虽然也在 node_modules 下，
 * 但应由 isBuiltinType 标记为 builtin，而非 external
 * @param symbol 要检查的符号
 * @returns 符号名称（来自 node_modules 的第三方库时），否则返回 null
 */
export function getExternalSymbolName(symbol: TsSymbol): string | null {
  const declarations = symbol.getDeclarations();
  if (declarations.length === 0) {
    return null;
  }

  const sourceFile = declarations[0]?.getSourceFile();
  if (!sourceFile) {
    return null;
  }

  const filePath = sourceFile.getFilePath();
  if (!filePath.includes('/node_modules/')) {
    return null;
  }

  // 排除 TypeScript 标准库文件（由 isBuiltinType 处理，标记为 builtin）
  if (sourceFile.compilerNode.hasNoDefaultLib === true) {
    return null;
  }
  const fileName = sourceFile.getBaseName();
  if (fileName.startsWith('lib.') && fileName.endsWith('.d.ts')) {
    return null;
  }

  const name = symbol.getName();
  if (!name || name === TS_ANONYMOUS_TYPE) {
    return null;
  }

  return name;
}
