/**
 * 类型分类器
 * @description 判断 TypeScript 类型的种类（纯函数）
 */

import type { Type } from 'ts-morph';
import { cleanTypeText } from './helpers';

/**
 * 获取类型的种类（纯函数）
 */
export function getTypeKind(type: Type): string {
  if (
    type.isString() ||
    type.isNumber() ||
    type.isBoolean() ||
    type.isNull() ||
    type.isUndefined()
  ) {
    return 'primitive';
  }

  // 检查元组类型（必须在数组类型检查之前）
  // 元组类型特征：
  // 1. isObject() 返回 true（元组在 TS 中是对象类型）
  // 2. 有固定数量的数字索引属性（0, 1, 2...）
  // 3. 不是 Array 类型（type.isArray() 为 false）
  // 4. 有 length 属性
  if (type.isObject() && !type.isArray()) {
    const props = type.getProperties();
    const propNames = props.map((p) => p.getName());
    // 检查是否有数字索引属性和 length 属性
    const hasNumberProps = propNames.some((name) => /^\d+$/.test(name));
    const hasLength = propNames.includes('length');
    // 同时有数字属性和 length 属性，且不是普通数组，很可能是元组
    if (hasNumberProps && hasLength) {
      // 进一步检查：如果有 push、pop 等数组方法，且类型文本包含 [，则是元组
      const typeText = cleanTypeText(type.getText());
      if (typeText.includes('[')) {
        return 'tuple';
      }

      // 对于类型别名，检查声明文本
      const aliasSymbol = type.getAliasSymbol();
      if (aliasSymbol) {
        const declarations = aliasSymbol.getDeclarations();
        if (declarations.length > 0 && declarations[0]) {
          const declText = declarations[0].getText();
          // 如果声明文本包含 = [，说明是元组
          if (declText.includes('= [')) {
            return 'tuple';
          }
        }
      }
    }
  }

  // 检查数组类型：支持 T[] 和 Array<T> 两种语法
  if (type.isArray()) {
    return 'array';
  }

  // Array<T> 泛型语法特殊处理
  // 检查类型引用是否为 Array
  const typeArgs = type.getTypeArguments();
  if (typeArgs && typeArgs.length > 0) {
    const symbol = type.getSymbol() || type.getAliasSymbol();
    if (symbol) {
      const name = symbol.getName();
      const escapedName = symbol.getEscapedName();
      // 检查符号名或完整限定名是否为 Array
      if (name === 'Array' || escapedName === 'Array') {
        return 'array';
      }
    }
  }

  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    // 如果联合类型包含 undefined，归类为 union 以便后续简化
    const hasUndefined = unionTypes.some((t) => t.isUndefined());
    if (hasUndefined) {
      return 'union';
    }
    // 只有纯字面量联合（不含 undefined）才归类为 enum
    const isLiteralUnion = unionTypes.every((t) => t.isLiteral());
    return isLiteralUnion ? 'enum' : 'union';
  }
  if (type.isEnum()) {
    return 'enum';
  }
  if (type.isLiteral()) {
    return 'literal';
  }
  // 函数类型判断（在对象类型之前）
  const callSignatures = type.getCallSignatures();
  if (callSignatures.length > 0) {
    return 'function';
  }
  if (
    type.getProperties().length > 0 ||
    type.isObject() ||
    type.isInterface()
  ) {
    return 'object';
  }
  return 'unknown';
}
