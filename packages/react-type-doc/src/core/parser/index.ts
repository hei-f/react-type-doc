/**
 * 类型解析器
 * @description 使用 ts-morph 解析 TypeScript 类型信息
 *
 * 公共 API 和主递归解析逻辑
 */

import type { Type } from 'ts-morph';
import type { TypeInfo, TypeCategory, RenderHint } from '../../shared/types';
import type { PRIMITIVE_TYPE_NAMES } from '../../shared/constants';

// 配置
import { getParseConfig } from './config';

// 缓存
import { getCacheKey, hasInCache, setInCache } from './cache';

// 工具
import {
  PRIMITIVE_TYPES,
  DISPLAY_MAX_DEPTH_REACHED,
  cleanTypeText,
  getTypeDisplayName,
  getTypeUniqueId,
  isTypeRef,
} from './utils/helpers';
import { getTypeKind } from './utils/typeKind';
import { extractSymbolSourceLocation } from './utils/extractors';

// 检测器
import {
  isBuiltinType,
  shouldSkipDeepParse,
} from './detectors/builtinDetector';
import {
  isTypeScriptUtilityType,
  getExternalLibAliasName,
  getUserDefinedAliasText,
} from './detectors/externalDetector';

// 解析器
import { parsePrimitiveType, parseEnumType } from './parsers/valueTypeParsers';
import { parseArrayType, parseTupleType } from './parsers/collectionParsers';
import {
  parseUnionType,
  containsUndefined,
  simplifyOptionalUnion,
} from './parsers/unionParser';
import { parseFunctionType } from './parsers/functionParser';
import { parseObjectType } from './parsers/objectParser';

// ============================================================
// 主递归解析函数
// ============================================================

/**
 * 递归解析类型信息（核心递归函数）
 * 实现了循环引用检测和组件级类型缓存
 * 注意：此函数使用模块级缓存变量，存在受控的副作用
 */
function parseTypeInfoRecursive(
  type: Type,
  visited: Set<string>,
  depth: number,
): TypeInfo {
  const typeText = cleanTypeText(type.getText());
  const cacheKey = getCacheKey(type, typeText);

  // 1. 缓存检查（优先于深度检查，确保已解析的类型不会被截断）
  if (cacheKey && hasInCache(cacheKey)) {
    return {
      $ref: cacheKey,
    };
  }

  // 2. 基础类型不受深度限制（它们不需要递归展开）
  if (PRIMITIVE_TYPES.has(typeText as (typeof PRIMITIVE_TYPE_NAMES)[number])) {
    const result: TypeInfo = {
      kind: 'primitive' as TypeCategory,
      text: typeText,
    };
    if (cacheKey) {
      setInCache(cacheKey, result);
    }
    return result;
  }

  // 3. 简单联合类型不受深度限制（只包含基础类型和 undefined）
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    const allPrimitive = unionTypes.every((t) => {
      const text = cleanTypeText(t.getText());
      return (
        PRIMITIVE_TYPES.has(text as (typeof PRIMITIVE_TYPE_NAMES)[number]) ||
        t.isLiteral()
      );
    });
    if (allPrimitive) {
      // 使用无深度限制的解析（传入 depth=0 重置深度）
      const result = parseUnionType(
        type,
        typeText,
        new Set(),
        0,
        parseTypeInfoRecursive,
      );
      // 对联合类型进行简化（移除 undefined）
      const simplified = simplifyOptionalUnion(result);
      if (isTypeRef(simplified)) {
        return simplified;
      }
      const simplifiedKey = getCacheKey(type, simplified.text);
      if (simplifiedKey) {
        if (hasInCache(simplifiedKey)) {
          return { $ref: simplifiedKey };
        }
        setInCache(simplifiedKey, simplified);
      }
      return simplified;
    }
  }

  const config = getParseConfig();

  // 4. 深度限制检查（对于复杂类型）
  if (depth > config.maxDepth) {
    return {
      name: type.getText(),
      kind: 'unknown' as TypeCategory,
      renderHint: 'truncated' as RenderHint,
      text: DISPLAY_MAX_DEPTH_REACHED,
    };
  }

  const typeId = getTypeUniqueId(type, config.skipDeepParseTypes);
  const typeName = getTypeDisplayName(type, typeText);

  // 5. 外部库类型别名保留
  // 当类型是 node_modules 中定义的类型（如 ReactNode、CSSProperties）时，
  // 保留类型名称不展开，避免将其解析为实际的联合类型或内部结构
  const externalAliasName = getExternalLibAliasName(type);
  if (externalAliasName && !isTypeScriptUtilityType(externalAliasName)) {
    return {
      kind: 'object' as TypeCategory,
      renderHint: 'external' as RenderHint,
      text: externalAliasName,
    };
  }

  // 5.5 用户定义的类型别名检测
  const userAliasText = getUserDefinedAliasText(type);

  // 6. 索引访问类型特殊处理
  // 问题：T["xxx"] 在 TypeScript 中会被解析为目标类型的对象形式
  // 解决：标记 renderHint='index-access'，保留索引访问表达式的字面形式
  if (typeText.includes('["') || typeText.includes("['")) {
    const kind = getTypeKind(type);
    if (kind === 'object') {
      return {
        kind: 'object' as TypeCategory,
        renderHint: 'index-access' as RenderHint,
        text: typeText,
      };
    }
  }

  // 7. 内置类型检查
  if (
    isBuiltinType(type) &&
    !isTypeScriptUtilityType(typeText) &&
    !type.isArray()
  ) {
    return {
      kind: 'object' as TypeCategory,
      renderHint: 'builtin' as RenderHint,
      text: typeName,
    };
  }

  // 8. 黑名单类型检查
  if (shouldSkipDeepParse(type)) {
    return {
      kind: 'object' as TypeCategory,
      renderHint: 'external' as RenderHint,
      text: typeName,
    };
  }

  // 9. 循环引用检查（基于路径追踪，仅检测真正的嵌套循环）
  if (visited.has(typeId)) {
    const symbol = type.getSymbol() || type.getAliasSymbol();
    const symbolLocation = config.enableSourceLocation
      ? extractSymbolSourceLocation(symbol)
      : {};
    return {
      kind: 'object' as TypeCategory,
      renderHint: 'circular' as RenderHint,
      text: typeName,
      ...symbolLocation,
    };
  }

  // 10. 执行解析（未命中缓存且非循环引用时）
  const newVisited = new Set(visited);
  newVisited.add(typeId);

  const kind = getTypeKind(type);

  let result: TypeInfo;
  switch (kind) {
    case 'primitive':
    case 'literal':
      result = parsePrimitiveType(typeText, kind);
      break;
    case 'array':
      result = parseArrayType(
        type,
        typeText,
        newVisited,
        depth,
        parseTypeInfoRecursive,
      );
      break;
    case 'tuple':
      result = parseTupleType(
        type,
        typeText,
        newVisited,
        depth,
        parseTypeInfoRecursive,
      );
      break;
    case 'enum':
      result = parseEnumType(type, typeText);
      break;
    case 'union':
      result = parseUnionType(
        type,
        typeText,
        newVisited,
        depth,
        parseTypeInfoRecursive,
      );
      break;
    case 'function':
      result = parseFunctionType(
        type,
        typeText,
        newVisited,
        depth,
        parseTypeInfoRecursive,
      );
      break;
    case 'object':
      result = parseObjectType(
        type,
        typeText,
        newVisited,
        depth,
        parseTypeInfoRecursive,
      );
      break;
    default:
      result = {
        kind: 'unknown' as TypeCategory,
        text: typeText,
      };
  }

  // 11. 应用用户定义的别名文本
  if (userAliasText && !isTypeRef(result)) {
    result = { ...result, name: userAliasText };
  }

  // 12. 对联合类型进行规范化：X | undefined 简化为 X
  if (kind === 'union' && containsUndefined(result)) {
    const simplified = simplifyOptionalUnion(result);
    if (isTypeRef(simplified)) {
      return simplified;
    }
    const simplifiedKey = getCacheKey(type, simplified.text);
    if (simplifiedKey) {
      if (hasInCache(simplifiedKey)) {
        return { $ref: simplifiedKey };
      }
      setInCache(simplifiedKey, simplified);
      return simplified;
    }
    result = simplified;
  }

  // 13. 写入缓存
  if (cacheKey && !hasInCache(cacheKey)) {
    setInCache(cacheKey, result);
  }

  return result;
}

// ============================================================
// 公共 API
// ============================================================

/**
 * 解析类型信息（公共接口）
 * 注意：此函数使用模块级缓存，建议在解析每个组件前调用 clearTypeCache()
 * @param type 要解析的类型
 * @returns 解析后的类型信息
 */
export function parseTypeInfo(type: Type): TypeInfo {
  return parseTypeInfoRecursive(type, new Set(), 0);
}

/**
 * 创建空的类型信息（用于无 props 的组件）
 */
export function createEmptyTypeInfo(): TypeInfo {
  return {
    name: 'EmptyProps',
    kind: 'object' as TypeCategory,
    text: '{}',
  };
}

// 重新导出供外部使用的 API
export { initParseOptions } from './config';
export {
  clearTypeCache,
  getTypeCacheSize,
  getTypeCacheSnapshot,
} from './cache';
export { getTypeKind } from './utils/typeKind';
