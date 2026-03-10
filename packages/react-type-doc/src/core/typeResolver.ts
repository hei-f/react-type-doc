/**
 * 类型解析器
 * @description 直接查找并解析指定的类型（interface、type alias、enum 等）
 */

import type { SourceFile } from 'ts-morph';
import type { TypeInfo } from '../shared/types';
import { parseTypeInfo } from './parser';

/**
 * 在模块/命名空间中递归查找类型
 */
function resolveNamespacedTypeInModule(
  module: ReturnType<SourceFile['getModule']>,
  parts: string[],
): TypeInfo | null {
  if (!module || parts.length === 0) {
    return null;
  }

  if (parts.length === 1) {
    const typeName = parts[0];
    if (!typeName) {
      return null;
    }

    // 尝试查找 interface
    const interfaceDecl = module.getInterface(typeName);
    if (interfaceDecl) {
      const type = interfaceDecl.getType();
      return parseTypeInfo(type);
    }

    // 尝试查找 type alias
    const typeAlias = module.getTypeAlias(typeName);
    if (typeAlias) {
      const type = typeAlias.getType();
      return parseTypeInfo(type);
    }

    // 尝试查找 enum
    const enumDecl = module.getEnum(typeName);
    if (enumDecl) {
      const type = enumDecl.getType();
      return parseTypeInfo(type);
    }

    return null;
  }

  // 继续向下查找嵌套命名空间
  const [nextName, ...rest] = parts;
  if (!nextName) {
    return null;
  }
  const nestedModule = module.getModule(nextName);
  if (nestedModule) {
    return resolveNamespacedTypeInModule(nestedModule, rest);
  }

  return null;
}

/**
 * 解析命名空间类型（如 API.UserInfo）
 */
function resolveNamespacedType(
  sourceFile: SourceFile,
  parts: string[],
): TypeInfo | null {
  const [namespaceName, ...rest] = parts;
  if (!namespaceName) {
    return null;
  }
  const typeName = rest.join('.');

  // 查找命名空间
  const namespace = sourceFile.getModule(namespaceName);
  if (!namespace) {
    return null;
  }

  // 在命名空间中查找类型
  // 尝试查找 interface
  const interfaceDecl = namespace.getInterface(typeName);
  if (interfaceDecl) {
    const type = interfaceDecl.getType();
    return parseTypeInfo(type);
  }

  // 尝试查找 type alias
  const typeAlias = namespace.getTypeAlias(typeName);
  if (typeAlias) {
    const type = typeAlias.getType();
    return parseTypeInfo(type);
  }

  // 尝试查找 enum
  const enumDecl = namespace.getEnum(typeName);
  if (enumDecl) {
    const type = enumDecl.getType();
    return parseTypeInfo(type);
  }

  // 如果还有更深的嵌套（如 API.User.Info），递归处理
  if (rest.length > 1 && rest[0]) {
    const nestedNamespace = namespace.getModule(rest[0]);
    if (nestedNamespace) {
      const nestedParts = rest;
      return resolveNamespacedTypeInModule(namespace, nestedParts);
    }
  }

  return null;
}

/**
 * 解析简单类型（非命名空间）
 */
function resolveSimpleType(
  sourceFile: SourceFile,
  typeName: string,
): TypeInfo | null {
  // 尝试查找 interface
  const interfaceDecl = sourceFile.getInterface(typeName);
  if (interfaceDecl) {
    const type = interfaceDecl.getType();
    return parseTypeInfo(type);
  }

  // 尝试查找 type alias
  const typeAlias = sourceFile.getTypeAlias(typeName);
  if (typeAlias) {
    const type = typeAlias.getType();
    return parseTypeInfo(type);
  }

  // 尝试查找 enum
  const enumDecl = sourceFile.getEnum(typeName);
  if (enumDecl) {
    const type = enumDecl.getType();
    return parseTypeInfo(type);
  }

  return null;
}

/**
 * 在源文件中查找并解析指定的类型
 * 支持命名空间格式（如 API.UserInfo）
 * @param sourceFile 源文件
 * @param typeName 类型名称
 * @returns 类型信息，找不到时返回 null
 */
export function resolveType(
  sourceFile: SourceFile,
  typeName: string,
): TypeInfo | null {
  // 处理命名空间格式（如 API.UserInfo）
  const parts = typeName.split('.');

  if (parts.length === 1) {
    // 简单类型名（如 UserInfo）
    return resolveSimpleType(sourceFile, typeName);
  }

  // 命名空间类型（如 API.UserInfo）
  return resolveNamespacedType(sourceFile, parts);
}
