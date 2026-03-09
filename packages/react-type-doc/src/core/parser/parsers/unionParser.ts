/**
 * 联合类型解析器
 * @description 解析联合类型并处理可选属性的 undefined 简化
 */

import type { Type } from 'ts-morph';
import type { TypeInfo, TypeCategory } from '../../../shared/types';
import type { RecursiveParser } from '../utils/helpers';
import {
  isTypeRef,
  CACHE_PREFIX_PRIMITIVE,
  CACHE_PREFIX_TEXT,
} from '../utils/helpers';

/**
 * 解析联合类型
 */
export function parseUnionType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  const unionTypes = type.getUnionTypes();
  return {
    kind: 'union' as TypeCategory,
    text: typeText,
    unionTypes: unionTypes.map((t) => recurse(t, visited, depth + 1)),
  };
}

/**
 * 检查类型是否包含 undefined
 * @param typeInfo 类型信息
 * @returns 是否包含 undefined
 */
export function containsUndefined(typeInfo: TypeInfo): boolean {
  if (isTypeRef(typeInfo)) {
    // 引用类型检查 $ref 是否指向 undefined
    return typeInfo.$ref === `${CACHE_PREFIX_PRIMITIVE}undefined`;
  }

  // 直接是 undefined（通过 text 判断，name 省略时等于 text）
  if (typeInfo.text === 'undefined') {
    return true;
  }

  // 联合类型检查是否包含 undefined
  if (typeInfo.kind === 'union' && typeInfo.unionTypes) {
    return typeInfo.unionTypes.some(containsUndefined);
  }

  return false;
}

/**
 * 简化联合类型，移除 undefined
 * @param typeInfo 原始类型信息
 * @returns 简化后的类型信息
 */
export function simplifyOptionalUnion(typeInfo: TypeInfo): TypeInfo {
  // 如果是引用类型，直接返回（不简化）
  if (isTypeRef(typeInfo)) {
    return typeInfo;
  }

  if (typeInfo.kind !== 'union' || !typeInfo.unionTypes) {
    return typeInfo;
  }

  // 过滤掉 undefined（需要检查是否为完整类型）
  const filtered = typeInfo.unionTypes.filter((t) => {
    if (isTypeRef(t)) {
      // 引用类型检查是否指向 undefined
      return t.$ref !== `${CACHE_PREFIX_PRIMITIVE}undefined`;
    }
    // 检查是否为 undefined（通过 text 判断，name 省略时等于 text）
    return t.text !== 'undefined';
  });

  // 如果全是 undefined，保持不变
  if (filtered.length === 0) {
    return typeInfo;
  }

  // 如果只剩一个类型，直接返回该类型
  if (filtered.length === 1 && filtered[0]) {
    return filtered[0];
  }

  // 如果过滤后数量没变，说明原本就没有 undefined，直接返回
  if (filtered.length === typeInfo.unionTypes.length) {
    return typeInfo;
  }

  // 特殊处理：false | true => boolean（包括截断情况和引用类型）
  const isBooleanLiteral = (t: TypeInfo): boolean => {
    if (isTypeRef(t)) {
      return (
        t.$ref === `${CACHE_PREFIX_TEXT}false` ||
        t.$ref === `${CACHE_PREFIX_TEXT}true` ||
        t.$ref === `${CACHE_PREFIX_PRIMITIVE}false` ||
        t.$ref === `${CACHE_PREFIX_PRIMITIVE}true`
      );
    }
    return t.text === 'false' || t.text === 'true';
  };

  // 检查是否包含 true 和 false
  const hasTrue = filtered.some((t) => {
    if (isTypeRef(t)) {
      return (
        t.$ref === `${CACHE_PREFIX_TEXT}true` ||
        t.$ref === `${CACHE_PREFIX_PRIMITIVE}true`
      );
    }
    return t.text === 'true';
  });
  const hasFalse = filtered.some((t) => {
    if (isTypeRef(t)) {
      return (
        t.$ref === `${CACHE_PREFIX_TEXT}false` ||
        t.$ref === `${CACHE_PREFIX_PRIMITIVE}false`
      );
    }
    return t.text === 'false';
  });

  if (
    filtered.length === 2 &&
    hasTrue &&
    hasFalse &&
    filtered.every(isBooleanLiteral)
  ) {
    return {
      kind: 'primitive' as TypeCategory,
      text: 'boolean',
    };
  }

  // 还有多个类型，返回简化后的联合类型
  const newText = filtered
    .map((t) => {
      if (isTypeRef(t)) {
        const ref = t.$ref;
        if (ref.startsWith(CACHE_PREFIX_TEXT)) {
          return ref.slice(CACHE_PREFIX_TEXT.length);
        }
        if (ref.startsWith(CACHE_PREFIX_PRIMITIVE)) {
          return ref.slice(CACHE_PREFIX_PRIMITIVE.length);
        }
        return ref;
      }
      return t.text;
    })
    .join(' | ');
  return {
    ...typeInfo,
    text: newText,
    unionTypes: filtered,
  };
}
