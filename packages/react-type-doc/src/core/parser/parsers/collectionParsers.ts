/**
 * 集合类型解析器
 * @description 解析数组类型和元组类型
 */

import type { Type } from 'ts-morph';
import type { TypeInfo, TypeCategory } from '../../../shared/types';
import type { RecursiveParser } from '../utils/helpers';
import { getUserDefinedAliasText } from '../detectors/externalDetector';

/**
 * 解析数组类型
 */
export function parseArrayType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  // 优先使用 getArrayElementType()
  let elementType = type.getArrayElementType();

  // 如果 getArrayElementType() 返回 undefined，可能是 Array<T> 泛型语法
  // 尝试从类型参数中获取元素类型
  if (!elementType) {
    const typeArgs = type.getTypeArguments();
    if (typeArgs && typeArgs.length > 0) {
      elementType = typeArgs[0];
    }
  }

  // 如果元素类型有用户定义的别名，用别名构建数组的显示文本
  let displayText = typeText;
  if (elementType) {
    const elementAliasText = getUserDefinedAliasText(elementType);
    if (elementAliasText) {
      displayText = `${elementAliasText}[]`;
    }
  }

  return {
    kind: 'array' as TypeCategory,
    text: displayText,
    elementType: elementType ? recurse(elementType, visited, depth + 1) : null,
  };
}

/**
 * 解析元组类型
 * 元组与数组的区别：
 * - 固定长度，每个位置可以有不同的类型
 * - 不应该展开为包含数组方法的对象
 * - 保持类型文本的字面形式（如 [x: number, y: number, z: number]）
 * - 解析每个元素的类型，支持元素类型的嵌套展开
 */
export function parseTupleType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  // 尝试从类型别名声明中提取实际的元组文本
  let actualTupleText = typeText;
  const aliasSymbol = type.getAliasSymbol();
  if (aliasSymbol) {
    const declarations = aliasSymbol.getDeclarations();
    if (declarations.length > 0 && declarations[0]) {
      const declText = declarations[0].getText();
      // 提取 = 后面的元组部分
      const match = declText.match(/=\s*(\[.*?\]);?\s*$/s);
      if (match && match[1]) {
        actualTupleText = match[1];
      }
    }
  }

  // 解析元组元素类型
  // 元组类型通过 getTypeArguments() 获取每个位置的类型
  const tupleElements: TypeInfo[] = [];
  const typeArgs = type.getTypeArguments();

  if (typeArgs && typeArgs.length > 0) {
    for (const elementType of typeArgs) {
      tupleElements.push(recurse(elementType, visited, depth + 1));
    }
  }

  return {
    kind: 'tuple' as TypeCategory,
    text: actualTupleText,
    ...(tupleElements.length > 0 ? { tupleElements } : {}),
  };
}
