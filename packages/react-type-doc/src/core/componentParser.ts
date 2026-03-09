/**
 * 组件解析器
 * @description 查找并解析 React 组件的 Props 类型
 */

import type {
  Expression,
  ParameterDeclaration,
  SourceFile,
  Type,
  VariableStatement,
} from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import type { TypeInfo } from '../shared/types';
import { parseTypeInfo } from './typeParser';

/** 组件查找结果 */
interface ComponentFindResult {
  /** 是否找到组件 */
  found: boolean;
  /** Props 类型（组件没有参数时为 null） */
  propsType: Type | null;
}

/** 未找到组件的结果 */
const NOT_FOUND: ComponentFindResult = { found: false, propsType: null };

// ============================================================
// 纯函数：类型提取
// ============================================================

/**
 * 从初始化器中提取 Props 类型（纯函数）
 * @returns 组件查找结果
 */
function extractPropsTypeFromInitializer(
  initializer: Expression,
): ComponentFindResult {
  const kind = initializer.getKind();
  const isArrowFunction = kind === SyntaxKind.ArrowFunction;
  const isFunctionExpression = kind === SyntaxKind.FunctionExpression;

  if (!isArrowFunction && !isFunctionExpression) {
    return NOT_FOUND;
  }

  // 类型断言为函数表达式类型以获取参数
  const funcExpr = initializer as Expression & {
    getParameters: () => ParameterDeclaration[];
  };
  const params = funcExpr.getParameters();

  return {
    found: true,
    propsType: params.length > 0 ? (params[0]?.getType() ?? null) : null,
  };
}

/**
 * 从参数列表中提取第一个参数类型（纯函数）
 */
function extractFirstParamType(params: ParameterDeclaration[]): Type | null {
  return params.length > 0 ? (params[0]?.getType() ?? null) : null;
}

// ============================================================
// 纯函数：组件查找
// ============================================================

/**
 * 在变量声明语句中查找目标组件（纯函数）
 */
function findInVariableStatement(
  statement: VariableStatement,
  targetName: string,
): ComponentFindResult {
  const matchedDeclaration = statement
    .getDeclarations()
    .find((decl) => decl.getName() === targetName);

  if (!matchedDeclaration) {
    return NOT_FOUND;
  }

  const initializer = matchedDeclaration.getInitializer();
  if (!initializer) {
    return NOT_FOUND;
  }

  return extractPropsTypeFromInitializer(initializer);
}

/**
 * 从变量声明中查找组件
 */
function findComponentInVariables(
  sourceFile: SourceFile,
  targetName: string,
): ComponentFindResult {
  const statements = sourceFile.getVariableStatements();

  for (const stmt of statements) {
    const result = findInVariableStatement(stmt, targetName);
    if (result.found) {
      return result;
    }
  }

  return NOT_FOUND;
}

/**
 * 从函数声明中查找组件
 */
function findComponentInFunctions(
  sourceFile: SourceFile,
  targetName: string,
): ComponentFindResult {
  const func = sourceFile
    .getFunctions()
    .find((f) => f.getName() === targetName);

  if (!func) {
    return NOT_FOUND;
  }

  return {
    found: true,
    propsType: extractFirstParamType(func.getParameters()),
  };
}

// ============================================================
// 公共接口
// ============================================================

/**
 * 创建空的类型信息（用于无 props 的组件）
 */
function createEmptyTypeInfo(): TypeInfo {
  return {
    name: 'EmptyProps',
    kind: 'object',
    text: '{}',
  };
}

/**
 * 查找并解析文件中 React 组件的 Props 类型
 * @param sourceFile 源文件
 * @param targetComponentName 目标组件名称
 * @returns Props 类型信息，找不到组件时返回 null
 */
export function findComponentProps(
  sourceFile: SourceFile,
  targetComponentName: string,
): TypeInfo | null {
  // 尝试从变量声明和函数声明中查找
  const result = findComponentInVariables(sourceFile, targetComponentName).found
    ? findComponentInVariables(sourceFile, targetComponentName)
    : findComponentInFunctions(sourceFile, targetComponentName);

  if (!result.found) {
    return null;
  }

  // 组件没有参数时返回空类型
  if (!result.propsType) {
    return createEmptyTypeInfo();
  }

  return parseTypeInfo(result.propsType);
}
