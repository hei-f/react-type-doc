/**
 * 泛型参数格式化工具
 * @description 统一处理声明头中的泛型参数展示和回退解析
 */

import type { GenericParameterInfo } from '../../shared/types';

/** 去掉声明名末尾的泛型片段，仅保留基础名称 */
export function getBaseName(name: string): string {
  const angleIdx = name.indexOf('<');
  return angleIdx === -1 ? name.trimEnd() : name.slice(0, angleIdx).trimEnd();
}

/** 将单个泛型参数格式化为字符串 */
export function formatGenericParameter(
  parameter: GenericParameterInfo,
): string {
  let text = parameter.name;
  if (parameter.constraint) {
    text += ` extends ${parameter.constraint}`;
  }
  if (parameter.default) {
    text += ` = ${parameter.default}`;
  }
  return text;
}

/** 将泛型参数列表格式化为逗号分隔的字符串 */
export function formatGenericParameterList(
  genericParameters?: GenericParameterInfo[] | null,
): string {
  if (!genericParameters || genericParameters.length === 0) {
    return '';
  }

  return genericParameters.map(formatGenericParameter).join(', ');
}

/** 拆分类型名和泛型参数文本 */
export function splitTypeNameAndGenericParameters(
  name: string,
  genericParameters?: GenericParameterInfo[] | null,
): {
  baseName: string;
  genericParametersText: string;
} {
  const baseName = getBaseName(name);
  const structuredParametersText =
    formatGenericParameterList(genericParameters);
  if (structuredParametersText) {
    return {
      baseName,
      genericParametersText: structuredParametersText,
    };
  }

  const genericStart = name.indexOf('<');
  const genericEnd = name.lastIndexOf('>');
  if (genericStart >= 0 && genericEnd > genericStart) {
    return {
      baseName,
      genericParametersText: name.slice(genericStart + 1, genericEnd).trim(),
    };
  }

  return {
    baseName: name.trimEnd(),
    genericParametersText: '',
  };
}

/** 将类型名格式化为声明头文本 */
export function formatTypeDeclarationName(
  name: string,
  genericParameters?: GenericParameterInfo[] | null,
): string {
  const baseName = getBaseName(name);
  const genericParametersText = formatGenericParameterList(genericParameters);
  if (!genericParametersText) {
    return name.trimEnd();
  }

  return `${baseName}<${genericParametersText}>`;
}
