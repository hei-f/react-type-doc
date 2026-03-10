/**
 * 值类型解析器
 * @description 解析基础类型、字面量类型和枚举类型
 */

import type { Type } from 'ts-morph';
import type { TypeInfo, TypeCategory } from '../../../shared/types';

/**
 * 解析基础类型（纯函数）
 */
export function parsePrimitiveType(typeText: string, kind: string): TypeInfo {
  return { kind: kind as TypeCategory, text: typeText };
}

/**
 * 解析枚举类型（纯函数）
 */
export function parseEnumType(type: Type, typeText: string): TypeInfo {
  const unionTypes = type.getUnionTypes();
  return {
    kind: 'enum' as TypeCategory,
    text: typeText,
    enumValues: unionTypes.filter((t) => t.isLiteral()).map((t) => t.getText()),
  };
}
