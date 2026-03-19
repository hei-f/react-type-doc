/**
 * 类型缓存管理
 * @description 全局级别的类型缓存，用于跨组件类型去重
 */

import type { Type } from 'ts-morph';
import type { TypeInfo } from '../../shared/types';
import type { PRIMITIVE_TYPE_NAMES } from '../../shared/constants';
import {
  CACHE_PREFIX_PRIMITIVE,
  CACHE_PREFIX_TEXT,
  CACHE_PREFIX_HASH,
  CACHE_PREFIX_LITERAL,
  CACHE_MAX_TEXT_KEY_CONTENT_LENGTH,
  PRIMITIVE_TYPES,
  hashText,
  extractLiteralValue,
  getLiteralTypeCategory,
} from './utils/helpers';
import { getParseConfig, refreshParseConfig } from './config';

/** 全局类型缓存，用于复用已解析的类型（包括基础类型、命名类型和匿名类型） */
let typeCache = new Map<string, TypeInfo>();

/**
 * 清空类型缓存（整个解析流程开始前调用一次）
 * 同时刷新解析配置缓存
 */
export function clearTypeCache(): void {
  typeCache = new Map<string, TypeInfo>();
  refreshParseConfig();
}

/**
 * 获取当前缓存大小
 * @returns 缓存中的类型数量
 */
export function getTypeCacheSize(): number {
  return typeCache.size;
}

/**
 * 获取类型缓存快照（用于构建 typeRegistry）
 * @returns 缓存中所有类型的副本
 */
export function getTypeCacheSnapshot(): Record<string, TypeInfo> {
  const snapshot: Record<string, TypeInfo> = {};
  typeCache.forEach((value, key) => {
    snapshot[key] = value;
  });
  return snapshot;
}

/**
 * 从缓存中获取类型
 */
export function getFromCache(key: string): TypeInfo | undefined {
  return typeCache.get(key);
}

/**
 * 检查缓存中是否存在指定 key
 */
export function hasInCache(key: string): boolean {
  return typeCache.has(key);
}

/**
 * 将类型存入缓存
 */
export function setInCache(key: string, value: TypeInfo): void {
  typeCache.set(key, value);
}

/**
 * 获取类型的缓存 key
 * 支持三种类型的缓存：
 * 1. 基础类型：使用固定 key（如 $primitive:string）
 * 2. 命名类型：使用完整限定名
 * 3. 匿名类型：基于类型文本生成 key（如 $text:{ a: string }）
 * @param type 要获取缓存 key 的类型
 * @param typeText 清理后的类型文本
 * @returns 缓存 key，无法缓存时返回 null
 */
export function getCacheKey(type: Type, typeText: string): string | null {
  // 1. 基础类型使用固定 key
  if (PRIMITIVE_TYPES.has(typeText as (typeof PRIMITIVE_TYPE_NAMES)[number])) {
    return `${CACHE_PREFIX_PRIMITIVE}${typeText}`;
  }

  // 1.5. 字面量类型使用专用前缀（避免引号进入 key）
  const literalCategory = getLiteralTypeCategory(type);
  if (literalCategory !== null) {
    const literalValue = extractLiteralValue(typeText);
    return `${CACHE_PREFIX_LITERAL}${literalCategory}:${literalValue}`;
  }

  // 2. 数组类型不缓存（元素类型会单独缓存）
  if (type.isArray()) {
    return null;
  }

  const config = getParseConfig();

  // 3. 超长类型文本不缓存（内联更省空间，这些类型通常出现频率低）
  if (typeText.length > config.cacheMaxTypeTextLength) {
    return null;
  }

  // 4. 短 key 直接使用文本，长 key 使用 hash 缩短
  // key 只需要保证唯一性，不需要可读性
  if (typeText.length <= CACHE_MAX_TEXT_KEY_CONTENT_LENGTH) {
    return `${CACHE_PREFIX_TEXT}${typeText}`;
  }
  return `${CACHE_PREFIX_HASH}${hashText(typeText)}`;
}
