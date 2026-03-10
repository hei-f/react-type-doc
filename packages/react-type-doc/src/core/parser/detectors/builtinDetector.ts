/**
 * 内置类型检测器
 * @description 检测 TypeScript 内置类型和跳过深度解析的类型
 */

import type { Type } from 'ts-morph';
import { BUILTIN_TYPES } from '../../../shared/constants';
import { getParseConfig } from '../config';

/**
 * 通过 TypeScript 元数据检测是否为内置类型（主方案）
 * @description 检查 hasNoDefaultLib 标志和文件名特征
 */
function isBuiltinTypeByMetadata(type: Type): boolean {
  const symbol = type.getSymbol();
  if (!symbol) return false;

  const declarations = symbol.getDeclarations();
  if (declarations.length === 0) return false;

  const sourceFile = declarations[0]?.getSourceFile();
  if (!sourceFile) return false;

  // 方法1：检查是否是 TypeScript 标准库文件
  // hasNoDefaultLib 为 true 表示这是 TypeScript 标准库文件
  if (sourceFile.compilerNode.hasNoDefaultLib === true) {
    return true;
  }

  // 方法2：检查文件名是否是 lib.*.d.ts（作为后备检测）
  const fileName = sourceFile.getBaseName();
  if (fileName.startsWith('lib.') && fileName.endsWith('.d.ts')) {
    return true;
  }

  return false;
}

/**
 * 通过完全限定名（FQN）检测是否为内置类型（备选方案）
 * @description 检查类型的完全限定名是否匹配内置类型列表
 */
function isBuiltinTypeByFQN(type: Type): boolean {
  const symbol = type.getSymbol() || type.getAliasSymbol();
  if (!symbol) return false;

  const fqn = symbol.getFullyQualifiedName();

  // 精确匹配或以 "TypeName." 开头（如 String.prototype.toLowerCase）
  return BUILTIN_TYPES.some(
    (builtin) => fqn === builtin || fqn.startsWith(`${builtin}.`),
  );
}

/**
 * 检测是否为内置类型（组合方案）
 * @description 优先使用元数据检测，失败则使用 FQN 检测作为备选
 */
export function isBuiltinType(type: Type): boolean {
  if (isBuiltinTypeByMetadata(type)) {
    return true;
  }

  if (isBuiltinTypeByFQN(type)) {
    return true;
  }

  return false;
}

/**
 * 检查类型是否在跳过深度解析的黑名单中
 * 支持精确匹配和前缀匹配两种模式
 * 注意：交叉类型和联合类型不会被跳过（即使其中包含内置类型）
 */
export function shouldSkipDeepParse(type: Type): boolean {
  // 交叉类型和联合类型不跳过（需要解析其成员）
  if (type.isIntersection() || type.isUnion()) {
    return false;
  }

  // 数组类型不跳过（需要解析元素类型）
  if (type.isArray()) {
    return false;
  }

  const config = getParseConfig();
  const symbol = type.getSymbol() || type.getAliasSymbol();

  // 检查符号名
  if (symbol) {
    const name = symbol.getName();

    // 精确匹配
    if (config.skipDeepParseTypes.has(name)) {
      return true;
    }

    // 前缀匹配（用于带泛型参数的类型和命名空间类型）
    const fullName = symbol.getFullyQualifiedName();
    for (const prefix of config.skipDeepParsePrefixes) {
      if (name.startsWith(prefix) || fullName.startsWith(prefix)) {
        return true;
      }
    }
  }

  // 没有 symbol 或 symbol 检查未命中，检查类型基础类型（如 string）
  // 这会捕获像 T["id"] 这样被推导为 string 的索引访问类型
  const baseTypes = type.getBaseTypes();
  if (baseTypes && baseTypes.length > 0) {
    for (const baseType of baseTypes) {
      const baseSymbol = baseType.getSymbol();
      if (baseSymbol) {
        const baseName = baseSymbol.getName();
        if (config.skipDeepParseTypes.has(baseName)) {
          return true;
        }
      }
    }
  }

  return false;
}
