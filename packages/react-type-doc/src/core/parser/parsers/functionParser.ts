/**
 * 函数类型解析器
 * @description 解析函数类型、签名和参数
 */

import type { Type, Symbol as TsSymbol, Signature } from 'ts-morph';
import { Node as TsMorphNode } from 'ts-morph';
import type {
  TypeInfo,
  TypeCategory,
  FunctionSignature,
} from '../../../shared/types';
import type { RecursiveParser } from '../utils/helpers';
import { buildNameField, getTypeDisplayName } from '../utils/helpers';
import { extractSymbolSourceLocation } from '../utils/extractors';
import { getParseConfig } from '../config';

/**
 * 解析函数参数
 */
function parseFunctionParameter(
  param: TsSymbol,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): { name: string; type: TypeInfo; optional?: boolean; rest?: boolean } {
  const paramName = param.getName();
  const paramDecl = param.getValueDeclaration();

  let paramType: TypeInfo = {
    kind: 'unknown' as TypeCategory,
    text: 'unknown',
  };
  let optional = false;
  let rest = false;

  if (paramDecl && TsMorphNode.isNode(paramDecl)) {
    // 使用 getTypeAtLocation 获取实例化后的类型
    // 这确保了泛型参数（如 T）会被替换为实际的类型（如 string）
    const declType = param.getTypeAtLocation(paramDecl);
    paramType = recurse(declType, visited, depth + 1);

    // 检查是否为可选参数
    if (TsMorphNode.isParameterDeclaration(paramDecl)) {
      optional = paramDecl.isOptional();
      rest = paramDecl.isRestParameter();
    }
  }

  return {
    name: paramName,
    type: paramType,
    ...(optional ? { optional } : {}),
    ...(rest ? { rest } : {}),
  };
}

/**
 * 解析函数签名
 */
function parseFunctionSignature(
  signature: Signature,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): FunctionSignature {
  const parameters = signature
    .getParameters()
    .map((param) => parseFunctionParameter(param, visited, depth, recurse));

  const returnType = recurse(signature.getReturnType(), visited, depth + 1);

  // 获取泛型参数（如果有）
  const typeParameters = signature
    .getTypeParameters()
    .map((tp, index) => {
      const symbol = tp.getSymbol();
      // 如果获取不到符号名，使用索引作为 fallback（T0, T1, T2...）
      return symbol ? symbol.getName() : `T${index}`;
    })
    .filter((name) => name && name !== 'unknown');

  const typeParams = typeParameters.length > 0 ? { typeParameters } : {};

  return {
    parameters,
    returnType,
    ...typeParams,
  } as FunctionSignature;
}

/**
 * 解析函数类型
 */
export function parseFunctionType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  const callSignatures = type.getCallSignatures();
  const signatures = callSignatures.map((sig) =>
    parseFunctionSignature(sig, visited, depth, recurse),
  );

  const config = getParseConfig();
  const symbol = type.getSymbol() || type.getAliasSymbol();
  const symbolLocation = config.enableSourceLocation
    ? extractSymbolSourceLocation(symbol)
    : {};
  const displayName = getTypeDisplayName(type, typeText);

  return {
    ...buildNameField(displayName, typeText),
    kind: 'function' as TypeCategory,
    text: typeText,
    signatures,
    ...symbolLocation,
  };
}
