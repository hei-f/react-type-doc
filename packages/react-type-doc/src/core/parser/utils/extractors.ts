/**
 * 信息提取器
 * @description 从 ts-morph 节点提取 JSDoc、源码位置等信息
 */

import type {
  Node,
  Symbol as TsSymbol,
  Type,
  JSDocableNode,
  ParameterDeclaration,
  SourceFile,
} from 'ts-morph';
import { getCacheKey } from '../cache';
import { cleanTypeText } from './helpers';

// ============================================================
// 类型保护
// ============================================================

/**
 * 检查节点是否支持 JSDoc（类型保护）
 */
function isJSDocableNode(node: Node): node is Node & JSDocableNode {
  return 'getJsDocs' in node && typeof node.getJsDocs === 'function';
}

// ============================================================
// JSDoc 提取
// ============================================================

/**
 * 从 JSDoc 标签节点提取完整的标签文本
 * 处理 @param、@returns、@default 等标签的格式化输出
 */
function formatJSDocTag(tag: {
  getTagName: () => string;
  getText: () => string;
}): string {
  const tagName = tag.getTagName();
  const rawText = tag.getText();

  // 清理 JSDoc 续行标记（ * 前缀），保留原始换行（对 @example 等标签至关重要）
  const cleaned = rawText
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();

  if (cleaned) {
    return cleaned;
  }

  return `@${tagName}`;
}

/**
 * 从声明节点提取 JSDoc 描述（纯函数）
 * 包含完整的 JSDoc 标签信息（@param、@returns、@default 等）
 */
export function extractDescription(declaration: Node | undefined): string {
  if (!declaration) {
    return '';
  }

  // 优先从 JSDoc 提取
  if (isJSDocableNode(declaration)) {
    const jsDocs = declaration.getJsDocs();
    if (jsDocs.length > 0) {
      // 使用最后一个 JSDoc（最接近声明的注释）
      // 避免文件级 JSDoc 被错误关联到首个声明
      const lastDoc = jsDocs[jsDocs.length - 1];
      if (lastDoc) {
        const desc = lastDoc.getDescription().trim();
        const tags = lastDoc.getTags();

        const parts: string[] = [];
        if (desc) {
          parts.push(desc);
        }

        for (const tag of tags) {
          const tagName = tag.getTagName();
          // @description 内容合并到主描述中
          if (tagName === 'description') {
            const tagText = formatJSDocTag(tag);
            const descContent = tagText.replace(/^@description\s*/, '').trim();
            if (descContent) {
              parts.push(descContent);
            }
          } else {
            parts.push(formatJSDocTag(tag));
          }
        }

        const result = parts.join('\n');
        if (result) {
          return result;
        }
      }
    }
  }

  // 回退：从前导注释中提取
  const leadingComments = declaration.getLeadingCommentRanges();
  if (leadingComments.length === 0) {
    return '';
  }

  const lastComment = leadingComments[leadingComments.length - 1];
  if (!lastComment) {
    return '';
  }

  const commentText = lastComment.getText();
  // 仅匹配 JSDoc 注释（/** ... */），不匹配普通块注释（/* ... */）
  const match = commentText.match(/\/\*\*\s*([\s\S]*?)\s*\*\//);
  const extracted = match?.[1]?.replace(/^\s*\*\s*/gm, '').trim();
  return extracted || '';
}

// ============================================================
// 源码位置提取
// ============================================================

/**
 * 从声明节点提取源码位置
 * @param declaration 声明节点
 * @returns 包含 sourceFile 和 sourceLine 的对象，或空对象
 */
export function extractSourceLocation(
  declaration?: Node,
): { sourceFile?: string; sourceLine?: number } | Record<string, never> {
  if (!declaration) {
    return {};
  }

  try {
    const sourceFile = declaration.getSourceFile();
    const filePath = sourceFile.getFilePath();
    const startLine = declaration.getStartLineNumber();

    return {
      sourceFile: filePath,
      sourceLine: startLine,
    };
  } catch {
    return {};
  }
}

/**
 * 从符号提取源码位置
 * @param symbol 类型符号
 * @returns 包含 sourceFile 和 sourceLine 的对象，或空对象
 */
export function extractSymbolSourceLocation(
  symbol?: TsSymbol,
): { sourceFile?: string; sourceLine?: number } | Record<string, never> {
  if (!symbol) {
    return {};
  }

  try {
    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) {
      return {};
    }

    const declaration = declarations[0];
    if (!declaration) {
      return {};
    }
    const sourceFile = declaration.getSourceFile();
    const filePath = sourceFile.getFilePath();
    const startLine = declaration.getStartLineNumber();

    return {
      sourceFile: filePath,
      sourceLine: startLine,
    };
  } catch {
    return {};
  }
}

// ============================================================
// 属性类型提取
// ============================================================

/**
 * 从父类型上下文获取属性的实例化类型（纯函数）
 * @param parentType 父类型（已实例化的类型）
 * @param propName 属性名称
 * @param propSymbol 属性符号（可选，如果已经有符号可以直接传入）
 * @returns 实例化后的属性类型
 */
export function getPropertyTypeFromParent(
  parentType: Type,
  propName: string,
  propSymbol?: TsSymbol,
): Type | undefined {
  try {
    // 通过父类型的 getProperty 获取符号
    const symbol = propSymbol || parentType.getProperty(propName);
    if (!symbol) {
      return undefined;
    }

    const declarations = symbol.getDeclarations();
    if (declarations && declarations.length > 0 && declarations[0]) {
      // 使用 getTypeAtLocation 获取实例化后的类型
      return symbol.getTypeAtLocation(declarations[0]);
    }

    // 回退：尝试从 valueDeclaration 获取
    const valueDeclaration =
      symbol.getValueDeclaration() as ParameterDeclaration;
    if (valueDeclaration) {
      return symbol.getTypeAtLocation(valueDeclaration);
    }

    return undefined;
  } catch {
    return undefined;
  }
}

// ============================================================
// 泛型参数检测
// ============================================================

/**
 * 检查类型中是否包含未实例化的泛型参数
 * 使用 ts-morph API 递归检查类型及其类型参数
 * @param type 要检查的类型
 * @param visited 已访问的类型集合（防止循环引用）
 * @returns 是否包含未实例化的泛型参数
 */
export function containsGenericTypeParameter(
  type: Type,
  visited: Set<Type> = new Set(),
): boolean {
  // 防止循环引用
  if (visited.has(type)) {
    return false;
  }
  visited.add(type);

  // 1. 检查类型本身是否是类型参数（如 T, K, V）
  if (type.isTypeParameter()) {
    return true;
  }

  // 2. 检查类型的类型参数（如 Array<T> 中的 T）
  const typeArguments = type.getTypeArguments();
  for (const arg of typeArguments) {
    if (containsGenericTypeParameter(arg, visited)) {
      return true;
    }
  }

  // 3. 检查别名类型参数（如 Omit<T, "id"> 中的 T）
  const aliasTypeArguments = type.getAliasTypeArguments();
  for (const arg of aliasTypeArguments) {
    if (containsGenericTypeParameter(arg, visited)) {
      return true;
    }
  }

  // 4. 检查联合类型的成员
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    for (const unionType of unionTypes) {
      if (containsGenericTypeParameter(unionType, visited)) {
        return true;
      }
    }
  }

  // 5. 检查交叉类型的成员
  if (type.isIntersection()) {
    const intersectionTypes = type.getIntersectionTypes();
    for (const intersectionType of intersectionTypes) {
      if (containsGenericTypeParameter(intersectionType, visited)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 从声明中提取完整的泛型签名（含默认值和约束）
 *
 * ts-morph 的 type.getText() 只返回类型参数名（如 Dictionary<T>），
 * 不包含默认值（= unknown）和约束（extends object）。
 * 此函数从声明节点提取完整签名，用于 UI 展示。
 *
 * @param type 要提取泛型签名的类型
 * @returns 完整的泛型显示名称（如 Dictionary<T = unknown>），无泛型参数时返回 null
 */
export function buildGenericDisplayName(type: Type): string | null {
  const symbol = type.getSymbol() || type.getAliasSymbol();
  if (!symbol) return null;

  const declarations = symbol.getDeclarations();
  if (!declarations || declarations.length === 0) return null;

  const decl = declarations[0];
  if (!decl || !('getTypeParameters' in decl)) return null;

  type TypeParamDecl = {
    getName: () => string;
    getDefault?: () => { getText: () => string } | undefined;
    getConstraint?: () => { getText: () => string } | undefined;
  };

  const getTypeParams = (decl as Record<string, unknown>).getTypeParameters as
    | (() => TypeParamDecl[])
    | undefined;
  if (typeof getTypeParams !== 'function') return null;

  const typeParams = getTypeParams.call(decl) as TypeParamDecl[];
  if (!typeParams || typeParams.length === 0) return null;

  const hasAnyDefault = typeParams.some(
    (param) => param.getDefault?.() != null,
  );
  if (!hasAnyDefault) return null;

  const paramStrings = typeParams.map((param) => {
    const name = param.getName();
    const constraint = param.getConstraint?.();
    const defaultType = param.getDefault?.();

    let str = name;
    if (constraint) {
      str += ` extends ${constraint.getText()}`;
    }
    if (defaultType) {
      str += ` = ${defaultType.getText()}`;
    }
    return str;
  });

  return `${symbol.getName()}<${paramStrings.join(', ')}>`;
}

// ============================================================
// 映射类型检测
// ============================================================

// ============================================================
// {@link} 引用解析
// ============================================================

/** 匹配 JSDoc 描述中的 {@link content} 内联标签 */
const JSDOC_LINK_PATTERN = /\{@link\s+([^}]+)\}/g;

/**
 * 在源文件中查找本地类型定义（interface、type alias、enum）
 */
function findLocalType(sourceFile: SourceFile, typeName: string): Type | null {
  const iface = sourceFile.getInterface(typeName);
  if (iface) return iface.getType();

  const typeAlias = sourceFile.getTypeAlias(typeName);
  if (typeAlias) return typeAlias.getType();

  const enumDecl = sourceFile.getEnum(typeName);
  if (enumDecl) return enumDecl.getType();

  return null;
}

/**
 * 通过 import 声明查找导入的类型
 * 跟随 import 路径到源模块，与 IDE 使用相同的模块解析机制
 */
function findImportedType(
  sourceFile: SourceFile,
  typeName: string,
): Type | null {
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const namedImport = importDecl
      .getNamedImports()
      .find((n) => n.getName() === typeName);
    if (!namedImport) continue;

    const moduleFile = importDecl.getModuleSpecifierSourceFile();
    if (!moduleFile) continue;

    const localType = findLocalType(moduleFile, typeName);
    if (localType) return localType;

    try {
      const exportedDecls = moduleFile.getExportedDeclarations();
      const decls = exportedDecls.get(typeName);
      if (decls && decls.length > 0 && decls[0]) {
        return decls[0].getType();
      }
    } catch {
      console.warn(`[react-type-doc] 解析导入类型 ${typeName} 时出错`);
    }
  }

  return null;
}

/**
 * 解析描述文本中 {@link} 引用的类型
 * 使用 ts-morph 的类型系统解析，与 IDE 使用相同的作用域解析机制：
 * 1. 先查找源文件本地定义（interface、type alias、enum）
 * 2. 再查找 import 导入的类型（跟随模块路径解析）
 *
 * @param description 已提取的 JSDoc 描述文本
 * @param declaration 描述所在的声明节点（用于获取源文件作用域）
 * @returns 引用文本到 typeRegistry key 的映射，无链接时返回 undefined
 */
export function resolveDescriptionLinks(
  description: string,
  declaration: Node | undefined,
): Record<string, string> | undefined {
  if (!description || !declaration) return undefined;
  if (!description.includes('{@link')) return undefined;

  const sourceFile = declaration.getSourceFile();
  const links: Record<string, string> = {};
  const regex = new RegExp(JSDOC_LINK_PATTERN.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(description)) !== null) {
    const rawRef = match[1]?.trim();
    if (!rawRef) continue;

    const pipeIdx = rawRef.indexOf('|');
    const target = pipeIdx >= 0 ? rawRef.slice(0, pipeIdx).trim() : rawRef;

    if (/^https?:\/\//.test(target)) continue;

    const dotIdx = target.indexOf('.');
    const typeName = dotIdx >= 0 ? target.slice(0, dotIdx) : target;

    let tsType = findLocalType(sourceFile, typeName);
    if (!tsType) {
      tsType = findImportedType(sourceFile, typeName);
    }
    if (!tsType) continue;

    const typeText = cleanTypeText(tsType.getText());
    const cacheKey = getCacheKey(tsType, typeText);

    if (cacheKey) {
      links[target] = cacheKey;
    }
  }

  return Object.keys(links).length > 0 ? links : undefined;
}

// ============================================================
// 映射类型检测
// ============================================================

/**
 * 尝试从映射类型（如 Record<K, V>、Partial<T>）获取值类型
 * @param type 要检查的类型
 * @returns 映射类型的值类型，如果不是映射类型则返回 undefined
 */
export function getMappedTypeValueType(type: Type): Type | undefined {
  try {
    // 使用 getAliasTypeArguments() 获取类型别名的类型参数
    // getTypeArguments() 对于某些类型别名会返回空数组
    const typeArgs = type.getAliasTypeArguments();
    const aliasSymbol = type.getAliasSymbol();
    const aliasName = aliasSymbol?.getName();

    // 对于 Record<K, V>，第二个类型参数是值类型
    if (aliasName === 'Record' && typeArgs.length >= 2) {
      return typeArgs[1];
    }

    // 对于 Partial<T>、Required<T>、Readonly<T>、Pick<T, K>、Omit<T, K>，递归检查 T
    if (
      (aliasName === 'Partial' ||
        aliasName === 'Required' ||
        aliasName === 'Readonly' ||
        aliasName === 'Pick' ||
        aliasName === 'Omit') &&
      typeArgs.length >= 1 &&
      typeArgs[0]
    ) {
      // 递归获取内层类型的值类型（如 Partial<Record<K, V>> -> V）
      const innerValueType = getMappedTypeValueType(typeArgs[0]);
      if (innerValueType) {
        return innerValueType;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}
