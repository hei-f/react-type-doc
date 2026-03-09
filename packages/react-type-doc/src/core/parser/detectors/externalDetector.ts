/**
 * 外部类型检测器
 * @description 检测外部库类型、TypeScript 工具类型和用户定义的类型别名
 */

import type { Type } from 'ts-morph';
import { TYPESCRIPT_UTILITY_TYPES } from '../../../shared/constants';
import {
  cleanTypeText,
  getExternalSymbolName,
  TS_ANONYMOUS_TYPE,
} from '../utils/helpers';

/**
 * TypeScript Utility Types Set
 * 用于快速查找，从 constants.ts 导入的数组生成
 */
const TS_UTILITY_TYPES = new Set(TYPESCRIPT_UTILITY_TYPES);

/**
 * 从类型文本中提取类型名称（去掉泛型参数）
 * @param typeText 类型文本，如 "Omit<T, 'id'>" 或 "NS.Type<T>"
 * @returns 类型名称，如 "Omit" 或 "Type"；如果不是泛型类型返回 null
 * @example
 * extractTypeName("Omit<T, 'id'>") // "Omit"
 * extractTypeName("NS.Type<T>") // "Type"
 * extractTypeName("string") // null
 */
function extractTypeName(typeText: string): string | null {
  const ltIndex = typeText.indexOf('<');
  if (ltIndex === -1) return null;

  const fullName = typeText.substring(0, ltIndex).trim();

  // 处理命名空间：取最后一个点号后的部分
  const lastDot = fullName.lastIndexOf('.');
  return lastDot === -1 ? fullName : fullName.substring(lastDot + 1);
}

/**
 * 检测类型名称是否为 TypeScript Utility Type
 * @param typeNameOrText 类型名称（如 "Omit"）或完整类型文本（如 "Omit<T, 'id'>"）
 * @returns 是否为 utility type
 */
export function isTypeScriptUtilityType(typeNameOrText: string): boolean {
  // 如果包含 '<'，说明是完整类型文本，需要提取类型名
  const typeName = typeNameOrText.includes('<')
    ? extractTypeName(typeNameOrText)
    : typeNameOrText;

  if (!typeName) return false;
  return TS_UTILITY_TYPES.has(
    typeName as (typeof TYPESCRIPT_UTILITY_TYPES)[number],
  );
}

/**
 * 检测类型是否为外部库（node_modules）的类型
 * 支持 type alias（通过 aliasSymbol）和 interface/class（通过 symbol）
 * @param type 要检查的类型
 * @returns 类型名称（如 "ReactNode"、"CSSProperties"），不是外部库类型时返回 null
 */
export function getExternalLibAliasName(type: Type): string | null {
  // 优先检查别名符号（type alias）
  const aliasSymbol = type.getAliasSymbol();
  if (aliasSymbol) {
    return getExternalSymbolName(aliasSymbol);
  }

  // 后备：检查类型符号（interface / class）
  const symbol = type.getSymbol();
  if (symbol) {
    return getExternalSymbolName(symbol);
  }

  return null;
}

/**
 * 获取用户定义的类型别名文本
 * 当类型有来自用户代码的别名（非 node_modules、非 TS 标准库、非 TS utility type）时，
 * 返回带泛型参数的别名文本（如 "ApiResponse<User>"）
 * @param type 要检查的类型
 * @returns 别名文本，或 null（非用户别名时）
 */
export function getUserDefinedAliasText(type: Type): string | null {
  const aliasSymbol = type.getAliasSymbol();
  if (!aliasSymbol) {
    return null;
  }

  const aliasName = aliasSymbol.getName();
  if (!aliasName || aliasName === TS_ANONYMOUS_TYPE) {
    return null;
  }

  if (isTypeScriptUtilityType(aliasName)) {
    return null;
  }

  const declarations = aliasSymbol.getDeclarations();
  if (declarations.length === 0) {
    return null;
  }

  const sourceFile = declarations[0]?.getSourceFile();
  if (!sourceFile) {
    return null;
  }

  // 排除 node_modules（由 getExternalLibAliasName 处理）
  const filePath = sourceFile.getFilePath();
  if (filePath.includes('/node_modules/')) {
    return null;
  }

  // 排除 TypeScript 标准库文件
  if (sourceFile.compilerNode.hasNoDefaultLib === true) {
    return null;
  }
  const fileName = sourceFile.getBaseName();
  if (fileName.startsWith('lib.') && fileName.endsWith('.d.ts')) {
    return null;
  }

  // 构建带泛型参数的别名文本
  const typeArgs = type.getAliasTypeArguments();
  if (typeArgs.length > 0) {
    const argTexts = typeArgs.map((arg) => cleanTypeText(arg.getText()));
    return `${aliasName}<${argTexts.join(', ')}>`;
  }

  return aliasName;
}
