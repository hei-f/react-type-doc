/**
 * 对象类型解析器
 * @description 解析对象类型及其属性
 */

import type { Type } from 'ts-morph';
import type { TypeInfo, TypeCategory, RenderHint } from '../../../shared/types';
import type { RecursiveParser } from '../utils/helpers';
import {
  buildNameField,
  getTypeDisplayName,
  SKIP_BUILTIN_PROPERTIES,
  SYMBOL_PROPERTY_PREFIX,
} from '../utils/helpers';
import {
  INDEX_SIGNATURE_STRING_KEY,
  INDEX_SIGNATURE_NUMBER_KEY,
} from '../../../shared/constants';
import {
  extractDescription,
  extractGenericParametersFromDeclaration,
  resolveDescriptionLinks,
  extractSourceLocation,
  extractSymbolSourceLocation,
  getPropertyTypeFromParent,
  containsGenericTypeParameter,
  getMappedTypeValueType,
  buildGenericDisplayName,
} from '../utils/extractors';
import { isTypeScriptUtilityType } from '../detectors/externalDetector';
import { containsUndefined, simplifyOptionalUnion } from './unionParser';
import { getParseConfig } from '../config';

/**
 * 解析对象类型的属性
 * @param type 父类型（已实例化的类型）
 */
function parseObjectProperties(
  type: Type,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): Record<string, TypeInfo> {
  const properties: Record<string, TypeInfo> = {};
  const config = getParseConfig();

  // 预先尝试获取映射类型的值类型（用于 Record<K, V>、Partial<T> 等情况）
  const mappedValueType = getMappedTypeValueType(type);

  for (const prop of type.getProperties()) {
    const propName = prop.getName();

    // 跳过内置属性（如数组方法 push/pop/map 等）
    if (SKIP_BUILTIN_PROPERTIES.has(propName)) {
      continue;
    }

    // 跳过 Symbol 属性（如 __@iterator@xxx、__@unscopables@xxx）
    if (propName.startsWith(SYMBOL_PROPERTY_PREFIX)) {
      continue;
    }

    const declaration = prop.getDeclarations()[0];
    let isOptional = prop.isOptional();
    // 使用父类型上下文获取实例化后的属性类型
    let propType = getPropertyTypeFromParent(type, propName, prop);

    // 对于映射类型（如 Record<K, V>），属性可能没有声明节点
    // 使用预先获取的映射类型值类型作为回退
    if (!propType && mappedValueType) {
      propType = mappedValueType;
    }

    let parsedPropType = propType
      ? recurse(propType, visited, depth + 1)
      : { kind: 'unknown' as TypeCategory, text: 'unknown' };

    // 语义等价规范化：必填但类型包含 undefined 等价于可选
    // 例如：name: string | undefined (必填) ≡ name?: string (可选)
    if (!isOptional && containsUndefined(parsedPropType)) {
      isOptional = true;
    }

    // 对可选属性简化 undefined 冗余
    if (isOptional) {
      parsedPropType = simplifyOptionalUnion(parsedPropType);
    }

    const description = extractDescription(declaration);
    const descriptionLinks = resolveDescriptionLinks(description, declaration);
    const required = !isOptional;

    // 构建属性信息，使用默认值策略减少冗余字段：
    // - description 默认为空字符串，有值时才输出
    // - required 默认为 false，为 true 时才输出
    properties[propName] = {
      ...parsedPropType,
      ...(description ? { description } : {}),
      ...(descriptionLinks ? { descriptionLinks } : {}),
      ...(required ? { required } : {}),
      ...(config.enableSourceLocation
        ? extractSourceLocation(declaration)
        : {}),
    };
  }

  // 解析索引签名（如 [key: string]: T、[index: number]: V）
  // 索引签名是类型定义的固有部分，标记为 required
  const stringIndexType = type.getStringIndexType();
  if (stringIndexType) {
    const parsed = recurse(stringIndexType, visited, depth + 1);
    properties[INDEX_SIGNATURE_STRING_KEY] = { ...parsed, required: true };
  }

  const numberIndexType = type.getNumberIndexType();
  if (numberIndexType) {
    const parsed = recurse(numberIndexType, visited, depth + 1);
    properties[INDEX_SIGNATURE_NUMBER_KEY] = { ...parsed, required: true };
  }

  return properties;
}

/**
 * 解析对象类型
 */
export function parseObjectType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  const properties = parseObjectProperties(type, visited, depth, recurse);
  const config = getParseConfig();
  const symbol = type.getSymbol() || type.getAliasSymbol();
  const genericParameters = extractGenericParametersFromDeclaration(
    symbol?.getDeclarations()?.[0],
  );
  const symbolLocation = config.enableSourceLocation
    ? extractSymbolSourceLocation(symbol)
    : {};
  const displayName = getTypeDisplayName(type, typeText);
  const hasProperties = Object.keys(properties).length > 0;

  // 特殊情况：索引访问类型（如 T["id"]）解析后如果所有属性都是内置类型方法，
  // 说明这实际上是一个内置类型的包装，应该标记为 external
  if ((typeText.includes('["') || typeText.includes("['")) && hasProperties) {
    const allPropsAreBuiltin = Object.values(properties).every((prop) => {
      if ('$ref' in prop) return false;
      if (!('kind' in prop)) return false;
      return 'renderHint' in prop && prop.renderHint === 'external';
    });
    if (allPropsAreBuiltin) {
      return {
        kind: 'object' as TypeCategory,
        renderHint: 'index-access' as RenderHint,
        text: typeText,
      };
    }
  }

  // 检测类型中是否包含未实例化的泛型参数（使用 ts-morph API）
  const hasGenericParam = containsGenericTypeParameter(type);

  // TypeScript 工具类型（Partial、Omit 等）在泛型参数未实例化时，
  // 属性是从约束推导的不完整信息，排除以避免误导
  // 自定义泛型类型（如 Box<T>）保留属性，因为属性是直接声明的
  const isUtilityWithGeneric =
    hasGenericParam && isTypeScriptUtilityType(typeText);

  // 对含泛型参数的类型，尝试构建完整的泛型显示名称
  // 例如：Dictionary<T> → Dictionary<T>，Dictionary<T = unknown> → Dictionary<T = unknown>
  const genericDisplayName =
    genericParameters.length > 0 ? buildGenericDisplayName(type) : null;
  const finalDisplayName = genericDisplayName ?? displayName;

  return {
    ...buildNameField(finalDisplayName, typeText),
    kind: 'object' as TypeCategory,
    text: typeText,
    ...(genericParameters.length > 0 ? { genericParameters } : {}),
    ...(hasProperties && !isUtilityWithGeneric ? { properties } : {}),
    ...(hasGenericParam ? { isGeneric: true } : {}),
    ...symbolLocation,
  };
}
