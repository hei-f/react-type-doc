/**
 * 运行时工具函数
 * @description 从 reader.ts 中提取的纯函数，供前端使用
 */

import type { FullTypeInfo, TypeInfo, TypeRef } from '../shared/types';

/** 原始类型集合 */
const PRIMITIVE_TYPES = new Set([
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
]);

/**
 * 判断类型信息是否为引用类型
 */
export function isTypeRef(typeInfo: TypeInfo): typeInfo is TypeRef {
  return '$ref' in typeInfo;
}

/**
 * 判断是否为原始类型
 */
export function isPrimitiveType(text: string): boolean {
  return PRIMITIVE_TYPES.has(text);
}

/**
 * 获取类型的显示名称
 * 当 name 省略时（name === text），使用 text 作为名称
 */
export function getTypeName(typeInfo: FullTypeInfo): string {
  return typeInfo.name ?? typeInfo.text;
}
