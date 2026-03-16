/**
 * 类型解析器
 * @description 直接查找并解析指定的类型（interface、type alias、enum、as const 变量等）
 */

import { Node } from 'ts-morph';
import type {
  SourceFile,
  VariableDeclaration,
  TypeAliasDeclaration,
} from 'ts-morph';
import type { TypeInfo } from '../shared/types';
import { parseTypeInfo } from './parser';
import { cleanTypeText } from './parser/utils/helpers';
import {
  extractDescription,
  resolveDescriptionLinks,
} from './parser/utils/extractors';

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
      const result = parseTypeInfo(type);
      return attachDescription(result, interfaceDecl);
    }

    // 尝试查找 type alias
    const typeAlias = module.getTypeAlias(typeName);
    if (typeAlias) {
      const type = typeAlias.getType();
      const result = applyGenericOriginName(typeAlias, parseTypeInfo(type));
      return attachDescription(result, typeAlias);
    }

    // 尝试查找 enum
    const enumDecl = module.getEnum(typeName);
    if (enumDecl) {
      const type = enumDecl.getType();
      const result = parseTypeInfo(type);
      return attachDescription(result, enumDecl);
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
    const result = parseTypeInfo(type);
    return attachDescription(result, interfaceDecl);
  }

  // 尝试查找 type alias
  const typeAlias = namespace.getTypeAlias(typeName);
  if (typeAlias) {
    const type = typeAlias.getType();
    const result = applyGenericOriginName(typeAlias, parseTypeInfo(type));
    return attachDescription(result, typeAlias);
  }

  // 尝试查找 enum
  const enumDecl = namespace.getEnum(typeName);
  if (enumDecl) {
    const type = enumDecl.getType();
    const result = parseTypeInfo(type);
    return attachDescription(result, enumDecl);
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
 * 判断变量声明是否为 as const 对象
 * 匹配 `export const X = { ... } as const` 模式
 */
function isAsConstObjectDeclaration(
  variableDecl: VariableDeclaration,
): boolean {
  const initializer = variableDecl.getInitializer();
  if (!initializer) {
    return false;
  }

  if (Node.isAsExpression(initializer)) {
    const typeNode = initializer.getTypeNode();
    if (typeNode?.getText() === 'const') {
      const innerExpr = initializer.getExpression();
      return Node.isObjectLiteralExpression(innerExpr);
    }
  }

  return false;
}

/**
 * 从变量声明获取 JSDoc 所在的 VariableStatement 节点
 * JSDoc 注释挂在 VariableStatement 上，而非 VariableDeclaration
 */
function getVariableStatementNode(
  variableDecl: VariableDeclaration,
): Node | undefined {
  const parent = variableDecl.getParent();
  const grandparent = parent?.getParent();
  if (grandparent && Node.isVariableStatement(grandparent)) {
    return grandparent;
  }
  return undefined;
}

/**
 * 将声明上的 JSDoc 描述附加到解析结果
 * 对 $ref 和 FullTypeInfo 两种情况均可安全附加
 */
function attachDescription(
  result: TypeInfo,
  declaration: Node | undefined,
): TypeInfo {
  const description = extractDescription(declaration);
  if (!description) {
    return result;
  }

  const descriptionLinks = resolveDescriptionLinks(description, declaration);
  return {
    ...result,
    description,
    ...(descriptionLinks ? { descriptionLinks } : {}),
  };
}

/**
 * 当类型别名引用了泛型类型（如 type X = Generic<Args>）时，
 * 从 AST 节点提取泛型来源文本设为 name 字段。
 * typeAlias.getType() 返回完全展开的结构类型时 aliasSymbol 可能丢失，
 * 通过读取声明节点的右侧类型文本来弥补这一信息缺失。
 */
function applyGenericOriginName(
  typeAlias: TypeAliasDeclaration,
  result: TypeInfo,
): TypeInfo {
  if ('$ref' in result) {
    return result;
  }

  const typeNode = typeAlias.getTypeNode();
  if (!typeNode) {
    return result;
  }

  const rawText = typeNode.getText();
  if (!rawText.includes('<')) {
    return result;
  }

  const normalizedName = cleanTypeText(rawText).replace(/\s+/g, ' ').trim();
  return { ...result, name: normalizedName };
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
    const result = parseTypeInfo(type);
    return attachDescription(result, interfaceDecl);
  }

  // 尝试查找 as const 变量声明（优先于 type alias）
  // 当 const X = {...} as const 和 type X = ... 同名时，优先使用 const 对象形式
  const variableDecl = sourceFile.getVariableDeclaration(typeName);
  if (variableDecl && isAsConstObjectDeclaration(variableDecl)) {
    const type = variableDecl.getType();
    const result = parseTypeInfo(type);
    const statementNode = getVariableStatementNode(variableDecl);
    return attachDescription(result, statementNode);
  }

  // 尝试查找 type alias
  const typeAlias = sourceFile.getTypeAlias(typeName);
  if (typeAlias) {
    const type = typeAlias.getType();
    const result = applyGenericOriginName(typeAlias, parseTypeInfo(type));
    return attachDescription(result, typeAlias);
  }

  // 尝试查找 enum
  const enumDecl = sourceFile.getEnum(typeName);
  if (enumDecl) {
    const type = enumDecl.getType();
    const result = parseTypeInfo(type);
    return attachDescription(result, enumDecl);
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
