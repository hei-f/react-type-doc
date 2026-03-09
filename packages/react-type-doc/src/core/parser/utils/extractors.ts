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
} from 'ts-morph';

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
 * 从声明节点提取 JSDoc 描述（纯函数）
 */
export function extractDescription(declaration: Node | undefined): string {
  if (!declaration) {
    return '';
  }

  // 优先从 JSDoc 提取
  if (isJSDocableNode(declaration)) {
    const jsDocs = declaration.getJsDocs();
    if (jsDocs.length > 0) {
      const firstDoc = jsDocs[0];
      if (firstDoc) {
        const desc = firstDoc.getDescription().trim();
        if (desc) {
          return desc;
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
  const match = commentText.match(/\/\*\*?\s*([\s\S]*?)\s*\*\//);
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
