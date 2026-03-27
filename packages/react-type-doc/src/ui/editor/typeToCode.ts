/**
 * 类型信息转 TypeScript 代码字符串
 * @description 将 TypeInfo 转换为格式化的 TypeScript 代码，供 CodeMirror / 只读代码面板渲染
 */

import type {
  FunctionSignature,
  TypeInfo,
  FullTypeInfo,
} from '../../shared/types';
import type { PropsDocReader } from '../../runtime/reader';
import { RENDER_TYPE } from '../../runtime/renderTypes';
import type { TypeRenderInfo } from '../../runtime/renderTypes';
import {
  CODE_MIRROR_BASE_TYPE_KEYWORDS,
  CODE_MIRROR_SEMANTIC_RANGE_KIND,
} from './codeMirror/constants';
import {
  formatGenericParameterList,
} from '../shared/generic';

/** 供 CodeMirror JSDoc 装饰定位：与 pushJSDocComment 写入格式一一对应 */
export type JSDocBlockMeta =
  | {
      kind: 'single';
      line: number;
      indent: string;
      description: string;
      descriptionLinks?: Record<string, string>;
    }
  | {
      kind: 'multi';
      firstContentLine: number;
      lastContentLine: number;
      indent: string;
      description: string;
      descriptionLinks?: Record<string, string>;
    };

export type SemanticRangeKind =
  (typeof CODE_MIRROR_SEMANTIC_RANGE_KIND)[keyof typeof CODE_MIRROR_SEMANTIC_RANGE_KIND];

export interface SemanticRangeMeta {
  kind: SemanticRangeKind;
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

interface SemanticOffsetRange {
  kind: SemanticRangeKind;
  start: number;
  end: number;
}

export interface TypeCodeWithMeta {
  code: string;
  jsdocBlocks: JSDocBlockMeta[];
  semanticRanges: SemanticRangeMeta[];
}

/**
 * TypeScript 常把元组可选成员展成 (T | undefined)?；与源码 T? 语义等价，展示为更短的 T?。
 */
export function simplifyOptionalTupleMemberSyntax(tupleText: string): string {
  let t = tupleText;
  t = t.replace(
    /\(\s*([^|()]+?)\s*\|\s*undefined\s*\)\?/g,
    (full, inner: string) => {
      const x = String(inner).trim();
      if (x.includes('|')) {
        return full;
      }
      return `${x}?`;
    },
  );
  t = t.replace(
    /\(\s*undefined\s*\|\s*([^|()]+?)\s*\)\?/g,
    (full, inner: string) => {
      const x = String(inner).trim();
      if (x.includes('|')) {
        return full;
      }
      return `${x}?`;
    },
  );
  return t;
}

function withLinks(links: Record<string, string> | undefined): {
  descriptionLinks?: Record<string, string>;
} {
  if (links && Object.keys(links).length > 0) {
    return { descriptionLinks: links };
  }
  return {};
}

/**
 * 在代码行数组中追加 JSDoc 块
 * @param indent 每行前置空格（接口属性一般为两个空格）
 */
function pushJSDocComment(
  lines: string[],
  description: string | undefined,
  indent: string = '',
  jsdocBlocks?: JSDocBlockMeta[],
  descriptionLinks?: Record<string, string>,
): void {
  if (!description) return;
  const startLineBefore = lines.length;
  const descLines = description.split('\n');
  const linkPart = withLinks(descriptionLinks);
  if (descLines.length === 1) {
    lines.push(`${indent}/** ${description} */`);
    jsdocBlocks?.push({
      kind: 'single',
      line: startLineBefore + 1,
      indent,
      description,
      ...linkPart,
    });
    return;
  }
  lines.push(`${indent}/**`);
  descLines.forEach((line) => {
    lines.push(`${indent} * ${line}`);
  });
  lines.push(`${indent} */`);
  jsdocBlocks?.push({
    kind: 'multi',
    firstContentLine: startLineBefore + 2,
    lastContentLine: startLineBefore + 1 + descLines.length,
    indent,
    description,
    ...linkPart,
  });
}

/**
 * 命名联合类型别名展开为「type Alias = | …」形式（对齐 renderUnionTypeView）
 */
function renderNamedUnionTypeAliasCode(
  typeAliasDisplayName: string,
  resolvedUnion: FullTypeInfo,
  reader: PropsDocReader,
  jsdocBlocks?: JSDocBlockMeta[],
): string {
  const lines: string[] = [];
  pushJSDocComment(
    lines,
    resolvedUnion.description,
    '',
    jsdocBlocks,
    resolvedUnion.descriptionLinks,
  );
  lines.push(`type ${typeAliasDisplayName} =`);
  const members = resolvedUnion.unionTypes ?? [];
  members.forEach((member) => {
    const memberCode = renderTypeTextCode(member, reader, 1);
    lines.push(`  | ${memberCode}`);
  });
  lines.push('');
  return lines.join('\n');
}

/** 可点击类型的范围信息 */
export interface ClickableRange {
  /** 位置范围（行号、列号从 1 开始；endColumn 为末字符后一列，与 Monaco IRange 一致） */
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  /** 类型名称 */
  typeName: string;
  /** 类型信息 */
  typeInfo: TypeInfo;
  /** 所属字段名（用于匿名对象） */
  fieldName?: string;
}

interface ClickableOffsetRange {
  start: number;
  end: number;
  typeName: string;
  typeInfo: TypeInfo;
  fieldName?: string;
}

function formatTypeHeaderName(
  displayName: string,
  resolved: FullTypeInfo,
  renderInfo: TypeRenderInfo,
): string {
  const trimmed = displayName.trim();
  if (trimmed.includes('<')) {
    return trimmed;
  }

  const genericParameters = resolved.genericParameters;
  if (!genericParameters || genericParameters.length === 0) {
    return trimmed;
  }

  const shouldShowGenericParameters =
    resolved.isGeneric === true ||
    resolved.renderHint === 'generic' ||
    renderInfo.type === RENDER_TYPE.FUNCTION;

  if (!shouldShowGenericParameters) {
    return trimmed;
  }

  const genericParametersText = formatGenericParameterList(genericParameters);
  return genericParametersText ? `${trimmed}<${genericParametersText}>` : trimmed;
}

/**
 * 将 TypeInfo 转换为 TypeScript 代码字符串
 * @param typeInfo 类型信息
 * @param reader PropsDocReader 实例
 * @param displayName 类型显示名称
 * @param isNested 是否为嵌套类型（默认为 false，即根级别类型）
 * @returns TypeScript 代码字符串
 */
export function typeInfoToCodeWithMeta(
  typeInfo: TypeInfo,
  reader: PropsDocReader,
  displayName: string,
  isNested: boolean = false,
): TypeCodeWithMeta {
  const jsdocBlocks: JSDocBlockMeta[] = [];
  const resolved = reader.resolveRef(typeInfo);
  const renderInfo = reader.getTypeRenderInfo(resolved);
  const typeHeaderName = formatTypeHeaderName(displayName, resolved, renderInfo);
  let code = '';

  if (renderInfo.type === RENDER_TYPE.CUSTOM_EXPANDABLE) {
    const inner = renderInfo.resolved;
    if (
      inner.kind === 'union' &&
      inner.unionTypes &&
      inner.unionTypes.length > 0
    ) {
      code = renderNamedUnionTypeAliasCode(
        typeHeaderName,
        inner,
        reader,
        jsdocBlocks,
      );
    } else {
      code = `type ${typeHeaderName} = ${renderTypeTextCode(resolved, reader, 0)};`;
    }
  } else if (!isNested && renderInfo.type === RENDER_TYPE.UNION) {
    code = renderUnionTypeCode(
      typeHeaderName,
      renderInfo.types,
      reader,
      resolved.description,
      jsdocBlocks,
      resolved.descriptionLinks,
    );
  } else if (
    renderInfo.type === RENDER_TYPE.OBJECT ||
    renderInfo.type === RENDER_TYPE.INLINE_OBJECT
  ) {
    code = renderObjectTypeCode(
      typeHeaderName,
      resolved,
      reader,
      jsdocBlocks,
    );
  } else {
    code = `type ${typeHeaderName} = ${renderTypeTextCode(resolved, reader, 0)};`;
  }

  const semanticRanges = buildSemanticRanges(
    code,
    typeInfo,
    reader,
    typeHeaderName,
  );

  return { code, jsdocBlocks, semanticRanges };
}

export function typeInfoToCode(
  typeInfo: TypeInfo,
  reader: PropsDocReader,
  displayName: string,
  isNested: boolean = false,
): string {
  return typeInfoToCodeWithMeta(typeInfo, reader, displayName, isNested).code;
}

/**
 * 渲染联合类型的代码
 */
function renderUnionTypeCode(
  typeName: string,
  members: TypeInfo[],
  reader: PropsDocReader,
  topDescription: string | undefined,
  jsdocBlocks: JSDocBlockMeta[] | undefined,
  topDescriptionLinks?: Record<string, string>,
): string {
  const lines: string[] = [];
  pushJSDocComment(lines, topDescription, '', jsdocBlocks, topDescriptionLinks);
  lines.push(`type ${typeName} =`);

  members.forEach((member) => {
    const memberCode = renderTypeTextCode(member, reader, 1);
    const prefix = '  | ';
    lines.push(`${prefix}${memberCode}`);
  });

  lines.push('');

  return lines.join('\n');
}

/**
 * 渲染对象类型的代码
 */
function renderObjectTypeCode(
  typeName: string,
  typeInfo: FullTypeInfo,
  reader: PropsDocReader,
  jsdocBlocks?: JSDocBlockMeta[],
): string {
  const lines: string[] = [];
  const propEntries = reader.getPropertyEntries(typeInfo);

  lines.push(`interface ${typeName} {`);

  if (propEntries.length === 0) {
    lines.push('  // No properties');
  } else {
    propEntries.forEach(([propName, propInfo]) => {
      const resolved = reader.resolveRef(propInfo);

      pushJSDocComment(
        lines,
        resolved.description,
        '  ',
        jsdocBlocks,
        resolved.descriptionLinks,
      );

      const optionalMark = resolved.required ? '' : '?';
      const propTypeCode = renderTypeTextCode(propInfo, reader, 1);
      lines.push(`  ${propName}${optionalMark}: ${propTypeCode};`);
    });
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * 保守格式化结构化类型文本。
 * 仅在能稳定识别泛型包裹或匿名对象时展开，其余保持原样。
 */
function formatStructuredTypeText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  const genericStart = trimmed.indexOf('<');
  if (genericStart > 0) {
    const genericEnd = findMatchingDelimiter(trimmed, genericStart, '<', '>');
    if (genericEnd === trimmed.length - 1) {
      const baseName = trimmed.slice(0, genericStart).trimEnd();
      const argsText = trimmed.slice(genericStart + 1, genericEnd);
      const args = splitTopLevelSegments(argsText, [',']);
      const formattedArgs = args.map((arg) =>
        formatStructuredTypeText(arg.text),
      );

      if (formattedArgs.every((arg) => !arg.includes('\n'))) {
        return `${baseName}<${formattedArgs.join(', ')}>`;
      }

      const lines: string[] = [`${baseName}<`];
      formattedArgs.forEach((arg, index) => {
        const argLines = arg.split('\n');
        const lastArgLineIndex = argLines.length - 1;
        argLines.forEach((line, lineIndex) => {
          const isLastLine =
            index === formattedArgs.length - 1 &&
            lineIndex === lastArgLineIndex;
          const suffix =
            lineIndex === lastArgLineIndex && !isLastLine ? ',' : '';
          lines.push(`  ${line}${suffix}`);
        });
      });
      lines.push('>');
      return lines.join('\n');
    }
  }

  const objectEnd = findMatchingDelimiter(trimmed, 0, '{', '}');
  if (trimmed.startsWith('{') && objectEnd === trimmed.length - 1) {
    const inner = trimmed.slice(1, -1);
    const entries = splitTopLevelSegments(inner, [';', ',']);
    const renderedEntries: Array<{
      name: string;
      optionalMark: string;
      typeText: string;
    }> = [];

    for (const entry of entries) {
      const entryText = entry.text.trim();
      if (!entryText) {
        continue;
      }

      const propertyMatch = entryText.match(
        /^(?:readonly\s+)?([A-Za-z_$][\w$]*)(\?)?\s*:\s*([\s\S]+)$/,
      );
      if (!propertyMatch) {
        return trimmed;
      }

      renderedEntries.push({
        name: propertyMatch[1]!,
        optionalMark: propertyMatch[2] ?? '',
        typeText: propertyMatch[3]!,
      });
    }

    if (renderedEntries.length === 0) {
      return '{}';
    }

    const lines: string[] = ['{'];
    renderedEntries.forEach((entry, index) => {
      const formattedType = formatStructuredTypeText(entry.typeText);
      const typeLines = formattedType.split('\n');
      const semicolon = index === renderedEntries.length - 1 ? '' : ';';

      if (typeLines.length === 1) {
        lines.push(
          `  ${entry.name}${entry.optionalMark}: ${typeLines[0]}${semicolon}`,
        );
        return;
      }

      lines.push(`  ${entry.name}${entry.optionalMark}: ${typeLines[0]}`);
      for (let i = 1; i < typeLines.length; i += 1) {
        const lineSuffix = i === typeLines.length - 1 ? semicolon : '';
        lines.push(`  ${typeLines[i]}${lineSuffix}`);
      }
    });
    lines.push('}');
    return lines.join('\n');
  }

  return trimmed;
}

/**
 * 给多行类型文本的续行补齐外层缩进。
 * 首行通常会被拼接到更高一层的前缀后面，因此这里只处理后续行。
 */
function indentFollowingLines(text: string, indent: string): string {
  if (!text.includes('\n') || !indent) {
    return text;
  }

  return text
    .split('\n')
    .map((line, index) => (index === 0 ? line : `${indent}${line}`))
    .join('\n');
}

/**
 * 渲染函数类型的代码
 * 仅在单签名且参数或返回值里出现多行结构时展开，避免把简单函数也强制改成多行。
 */
function renderFunctionTypeCode(
  signatures: FunctionSignature[],
  reader: PropsDocReader,
  indentLevel: number,
  fallbackText: string,
): string {
  if (signatures.length !== 1) {
    return fallbackText;
  }

  const signature = signatures[0]!;
  const genericParametersText =
    formatGenericParameterList(signature.genericParameters) ||
    signature.typeParameters?.join(', ') ||
    '';
  const typeParametersText = genericParametersText
    ? `<${genericParametersText}>`
    : '';
  const contentIndent = '  '.repeat(indentLevel + 1);
  const closingIndent = '  '.repeat(indentLevel);

  const parameters = signature.parameters.map((parameter) => {
    const parameterPrefix = `${parameter.rest ? '...' : ''}${parameter.name}${parameter.optional ? '?' : ''}: `;
    const parameterTypeCode = indentFollowingLines(
      formatStructuredTypeText(
        renderTypeTextCode(parameter.type, reader, indentLevel + 1),
      ),
      contentIndent,
    );

    return {
      prefix: parameterPrefix,
      typeCode: parameterTypeCode,
    };
  });

  const returnTypeCode = indentFollowingLines(
    formatStructuredTypeText(
      renderTypeTextCode(signature.returnType, reader, indentLevel + 1),
    ),
    closingIndent,
  );
  const shouldExpandSignature =
    parameters.some(({ typeCode }) => typeCode.includes('\n')) ||
    returnTypeCode.includes('\n');

  if (!shouldExpandSignature) {
    const inlineParameters = parameters
      .map(({ prefix, typeCode }) => `${prefix}${typeCode}`)
      .join(', ');
    return `${typeParametersText}(${inlineParameters}) => ${returnTypeCode}`;
  }

  if (parameters.length === 0) {
    return `${typeParametersText}() => ${returnTypeCode}`;
  }

  const lines: string[] = [`${typeParametersText}(`];
  parameters.forEach(({ prefix, typeCode }, index) => {
    const comma = index === parameters.length - 1 ? '' : ',';
    lines.push(`${contentIndent}${prefix}${typeCode}${comma}`);
  });
  lines.push(`${closingIndent}) => ${returnTypeCode}`);

  return lines.join('\n');
}

/**
 * 渲染类型文本（递归）
 */
function renderTypeTextCode(
  typeInfo: TypeInfo,
  reader: PropsDocReader,
  indentLevel: number,
): string {
  const resolved = reader.resolveRef(typeInfo);
  const renderInfo = reader.getTypeRenderInfo(resolved);
  const indent = '  '.repeat(indentLevel);

  switch (renderInfo.type) {
    case RENDER_TYPE.EXTERNAL:
    case RENDER_TYPE.CIRCULAR:
      return renderInfo.name;

    case RENDER_TYPE.ENUM:
      return renderInfo.values.join(' | ');

    case RENDER_TYPE.UNION:
      return renderInfo.types
        .map((t) => renderTypeTextCode(t, reader, indentLevel))
        .join(' | ');

    case RENDER_TYPE.ARRAY: {
      const elementCode = renderTypeTextCode(
        renderInfo.elementType,
        reader,
        indentLevel,
      );
      return renderInfo.needsParens ? `(${elementCode})[]` : `${elementCode}[]`;
    }

    case RENDER_TYPE.TUPLE:
      return simplifyOptionalTupleMemberSyntax(renderInfo.text);

    case RENDER_TYPE.OBJECT:
      return renderInfo.name;

    case RENDER_TYPE.INLINE_OBJECT: {
      const propEntries = reader.getPropertyEntries(renderInfo.resolved);

      if (propEntries.length === 0) {
        return '{}';
      }

      const hasIndexSignature =
        renderInfo.resolved.text?.includes('[key:') ||
        renderInfo.resolved.text?.includes('[key :');

      if (hasIndexSignature) {
        return renderInfo.resolved.text || '{}';
      }

      const lines: string[] = ['{'];
      propEntries.forEach(([propName, propInfo], index) => {
        const propResolved = reader.resolveRef(propInfo);
        const optionalMark = propResolved.required ? '' : '?';
        const propTypeCode = renderTypeTextCode(
          propInfo,
          reader,
          indentLevel + 1,
        );
        const isLast = index === propEntries.length - 1;
        const semicolon = isLast ? '' : ';';
        lines.push(
          `${indent}  ${propName}${optionalMark}: ${propTypeCode}${semicolon}`,
        );
      });
      lines.push(`${indent}}`);

      return lines.join('\n');
    }

    case RENDER_TYPE.CUSTOM_EXPANDABLE:
      return renderInfo.name;

    case RENDER_TYPE.FUNCTION:
      return renderFunctionTypeCode(
        renderInfo.signatures,
        reader,
        indentLevel,
        renderInfo.text,
      );

    case RENDER_TYPE.PRIMITIVE:
    case RENDER_TYPE.DEFAULT:
      return renderInfo.text;

    default:
      return resolved.text || 'unknown';
  }
}

/**
 * 获取代码中所有可点击类型的范围
 * @param code TypeScript 代码字符串
 * @param typeInfo 根类型信息
 * @param reader PropsDocReader 实例
 * @returns 可点击范围数组
 */
export function getClickableRanges(
  code: string,
  typeInfo: TypeInfo,
  reader: PropsDocReader,
): ClickableRange[] {
  const offsetRanges: ClickableOffsetRange[] = [];
  const resolved = reader.resolveRef(typeInfo);
  const renderInfo = reader.getTypeRenderInfo(resolved);

  if (renderInfo.type === RENDER_TYPE.CUSTOM_EXPANDABLE) {
    const inner = renderInfo.resolved;
    if (
      inner.kind === 'union' &&
      inner.unionTypes &&
      inner.unionTypes.length > 0
    ) {
      extractUnionClickableRanges(
        code,
        inner.unionTypes,
        reader,
        offsetRanges,
        0,
        1,
      );
      return convertClickableOffsetRanges(code, offsetRanges);
    }
  }

  if (renderInfo.type === RENDER_TYPE.UNION) {
    extractUnionClickableRanges(
      code,
      renderInfo.types,
      reader,
      offsetRanges,
      0,
      1,
    );
  } else if (
    renderInfo.type === RENDER_TYPE.OBJECT ||
    renderInfo.type === RENDER_TYPE.INLINE_OBJECT
  ) {
    extractObjectClickableRanges(code, resolved, reader, offsetRanges, 0, 0);
  }

  return convertClickableOffsetRanges(code, offsetRanges);
}

/**
 * 将偏移范围转换为 CodeMirror 可点击范围
 */
function convertClickableOffsetRanges(
  code: string,
  offsetRanges: ClickableOffsetRange[],
): ClickableRange[] {
  if (offsetRanges.length === 0) {
    return [];
  }

  const lineStarts = buildLineStarts(code);
  return offsetRanges.map((range) => {
    const start = offsetToPosition(lineStarts, range.start);
    const end = offsetToPosition(lineStarts, range.end);

    return {
      range: {
        startLine: start.line,
        startColumn: start.column,
        endLine: end.line,
        endColumn: end.column,
      },
      typeName: range.typeName,
      typeInfo: range.typeInfo,
      ...(range.fieldName ? { fieldName: range.fieldName } : {}),
    };
  });
}

function addClickableOffsetRange(
  ranges: ClickableOffsetRange[],
  start: number,
  end: number,
  typeName: string,
  typeInfo: TypeInfo,
  fieldName?: string,
): void {
  if (start >= end) {
    return;
  }

  ranges.push({
    start,
    end,
    typeName,
    typeInfo,
    ...(fieldName ? { fieldName } : {}),
  });
}

function collectDirectClickableRange(
  code: string,
  searchText: string,
  typeInfo: TypeInfo,
  reader: PropsDocReader,
  ranges: ClickableOffsetRange[],
  baseOffset: number,
  fieldName?: string,
): void {
  if (!searchText) {
    return;
  }

  const target = reader.getNavigationTarget(
    typeInfo,
    reader.resolveRef(typeInfo).text || '',
  );
  if (!target) {
    return;
  }

  const startIndex = code.indexOf(searchText);
  if (startIndex < 0) {
    return;
  }

  addClickableOffsetRange(
    ranges,
    baseOffset + startIndex,
    baseOffset + startIndex + searchText.length,
    target.name,
    target.typeInfo,
    fieldName,
  );
}

function collectClickableRangesFromTypeSegment(
  code: string,
  typeInfo: TypeInfo,
  reader: PropsDocReader,
  ranges: ClickableOffsetRange[],
  baseOffset: number,
  indentLevel: number,
  allowDirectClick: boolean,
  fieldName?: string,
): void {
  const resolved = reader.resolveRef(typeInfo);
  const renderInfo = reader.getTypeRenderInfo(resolved);

  switch (renderInfo.type) {
    case RENDER_TYPE.OBJECT:
      if (allowDirectClick) {
        collectDirectClickableRange(
          code,
          renderInfo.name,
          typeInfo,
          reader,
          ranges,
          baseOffset,
          fieldName,
        );
      }
      return;
    case RENDER_TYPE.CUSTOM_EXPANDABLE: {
      const inner = renderInfo.resolved;
      if (
        inner.kind === 'union' &&
        inner.unionTypes &&
        inner.unionTypes.length > 0
      ) {
        if (code.includes('|')) {
          extractUnionClickableRanges(
            code,
            inner.unionTypes,
            reader,
            ranges,
            baseOffset,
            1,
          );
          return;
        }
      }

      if (allowDirectClick) {
        collectDirectClickableRange(
          code,
          renderInfo.name,
          typeInfo,
          reader,
          ranges,
          baseOffset,
          fieldName,
        );
      }
      return;
    }
    case RENDER_TYPE.UNION:
      extractUnionClickableRanges(
        code,
        renderInfo.types,
        reader,
        ranges,
        baseOffset,
        indentLevel,
      );
      return;
    case RENDER_TYPE.ARRAY: {
      if (!renderInfo.elementType) {
        return;
      }

      const elementCode = renderTypeTextCode(
        renderInfo.elementType,
        reader,
        indentLevel,
      );
      const elementIndex = code.indexOf(elementCode);
      if (elementIndex < 0) {
        return;
      }

      collectClickableRangesFromTypeSegment(
        code.slice(elementIndex, elementIndex + elementCode.length),
        renderInfo.elementType,
        reader,
        ranges,
        baseOffset + elementIndex,
        indentLevel,
        true,
        fieldName,
      );
      return;
    }
    case RENDER_TYPE.TUPLE: {
      const elements = renderInfo.elements ?? [];
      let searchCursor = 0;

      for (const element of elements) {
        const elementCode = renderTypeTextCode(element, reader, indentLevel);
        const elementIndex = code.indexOf(elementCode, searchCursor);
        if (elementIndex < 0) {
          continue;
        }

        collectClickableRangesFromTypeSegment(
          code.slice(elementIndex, elementIndex + elementCode.length),
          element,
          reader,
          ranges,
          baseOffset + elementIndex,
          indentLevel,
          true,
          fieldName,
        );
        searchCursor = elementIndex + elementCode.length;
      }
      return;
    }
    case RENDER_TYPE.FUNCTION: {
      const signatures = renderInfo.signatures ?? [];
      let searchCursor = 0;

      for (const signature of signatures) {
        for (const parameter of signature.parameters) {
          const parameterCode = indentFollowingLines(
            formatStructuredTypeText(
              renderTypeTextCode(parameter.type, reader, indentLevel + 1),
            ),
            '  '.repeat(indentLevel + 1),
          );
          const parameterIndex = code.indexOf(parameterCode, searchCursor);
          if (parameterIndex < 0) {
            continue;
          }

          collectClickableRangesFromTypeSegment(
            code.slice(parameterIndex, parameterIndex + parameterCode.length),
            parameter.type,
            reader,
            ranges,
            baseOffset + parameterIndex,
            indentLevel + 1,
            true,
            parameter.name,
          );
          searchCursor = parameterIndex + parameterCode.length;
        }

        const returnCode = indentFollowingLines(
          formatStructuredTypeText(
            renderTypeTextCode(signature.returnType, reader, indentLevel + 1),
          ),
          '  '.repeat(indentLevel),
        );
        const returnIndex = code.indexOf(returnCode, searchCursor);
        if (returnIndex < 0) {
          continue;
        }

        collectClickableRangesFromTypeSegment(
          code.slice(returnIndex, returnIndex + returnCode.length),
          signature.returnType,
          reader,
          ranges,
          baseOffset + returnIndex,
          indentLevel + 1,
          true,
          fieldName,
        );
        searchCursor = returnIndex + returnCode.length;
      }
      return;
    }
    case RENDER_TYPE.INLINE_OBJECT:
      extractObjectClickableRanges(
        code,
        resolved,
        reader,
        ranges,
        baseOffset,
        indentLevel,
      );
      return;
    default:
      return;
  }
}

/**
 * 从联合类型代码中提取可点击范围
 */
function extractUnionClickableRanges(
  code: string,
  members: TypeInfo[],
  reader: PropsDocReader,
  ranges: ClickableOffsetRange[],
  baseOffset: number,
  indentLevel: number,
): void {
  let searchCursor = 0;

  for (const member of members) {
    const memberCode = renderTypeTextCode(member, reader, indentLevel);
    const memberIndex = code.indexOf(memberCode, searchCursor);
    if (memberIndex < 0) {
      continue;
    }

    collectClickableRangesFromTypeSegment(
      code.slice(memberIndex, memberIndex + memberCode.length),
      member,
      reader,
      ranges,
      baseOffset + memberIndex,
      indentLevel,
      true,
    );
    searchCursor = memberIndex + memberCode.length;
  }
}

/**
 * 从对象类型代码中提取可点击范围
 */
function extractObjectClickableRanges(
  code: string,
  typeInfo: FullTypeInfo,
  reader: PropsDocReader,
  ranges: ClickableOffsetRange[],
  baseOffset: number,
  indentLevel: number,
): void {
  const lines = code.split('\n');
  const propEntries = reader.getPropertyEntries(typeInfo);

  propEntries.forEach(([propName, propInfo]) => {
    const propTypeCode = renderTypeTextCode(propInfo, reader, indentLevel + 1);

    let lineOffset = 0;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex]!;

      if (!line.includes(`${propName}:`) && !line.includes(`${propName}?:`)) {
        lineOffset += line.length + 1;
        continue;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        lineOffset += line.length + 1;
        continue;
      }

      const afterColon = line.substring(colonIndex + 1);
      const typeStartInAfterColon = afterColon.search(/\S/);
      if (typeStartInAfterColon === -1) {
        lineOffset += line.length + 1;
        continue;
      }

      const segmentStart = lineOffset + colonIndex + 1 + typeStartInAfterColon;
      const segmentEnd = segmentStart + propTypeCode.length;
      if (segmentEnd > code.length) {
        lineOffset += line.length + 1;
        continue;
      }

      if (code.slice(segmentStart, segmentEnd) !== propTypeCode) {
        lineOffset += line.length + 1;
        continue;
      }

      collectClickableRangesFromTypeSegment(
        code.slice(segmentStart, segmentEnd),
        propInfo,
        reader,
        ranges,
        baseOffset + segmentStart,
        indentLevel + 1,
        true,
        propName,
      );
      break;
    }
  });
}

function buildSemanticRanges(
  code: string,
  typeInfo: TypeInfo,
  reader: PropsDocReader,
  displayName: string,
): SemanticRangeMeta[] {
  const offsetRanges: SemanticOffsetRange[] = [];
  collectSemanticOffsetRanges(
    code,
    typeInfo,
    reader,
    displayName,
    offsetRanges,
    0,
  );

  if (offsetRanges.length === 0) {
    return [];
  }

  const lineStarts = buildLineStarts(code);
  return offsetRanges.map((range) => {
    const start = offsetToPosition(lineStarts, range.start);
    const end = offsetToPosition(lineStarts, range.end);

    return {
      kind: range.kind,
      range: {
        startLine: start.line,
        startColumn: start.column,
        endLine: end.line,
        endColumn: end.column,
      },
    };
  });
}

function buildLineStarts(code: string): number[] {
  const starts: number[] = [0];
  for (let index = 0; index < code.length; index += 1) {
    if (code[index] === '\n') {
      starts.push(index + 1);
    }
  }
  return starts;
}

function offsetToPosition(
  lineStarts: number[],
  offset: number,
): { line: number; column: number } {
  let lineIndex = 0;
  for (let index = 1; index < lineStarts.length; index += 1) {
    const lineStart = lineStarts[index]!;
    if (lineStart <= offset) {
      lineIndex = index;
      continue;
    }
    break;
  }

  const currentLineStart = lineStarts[lineIndex]!;
  return {
    line: lineIndex + 1,
    column: offset - currentLineStart + 1,
  };
}

function addSemanticOffsetRange(
  ranges: SemanticOffsetRange[],
  kind: SemanticRangeKind,
  start: number,
  end: number,
): void {
  if (start >= end) {
    return;
  }
  ranges.push({ kind, start, end });
}

/** 数组尾缀保留给原始语法高亮，语义色只覆盖核心类型名。 */
const SIMPLE_SEMANTIC_TYPE_TEXT_PATTERN =
  /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;

function normalizeSemanticTypeText(text: string): string {
  let normalized = text.trim();
  while (normalized.startsWith('readonly ')) {
    normalized = normalized.slice('readonly '.length).trimStart();
  }
  while (normalized.endsWith('[]')) {
    normalized = normalized.slice(0, -2).trimEnd();
  }
  return normalized;
}

function isSimpleSemanticTypeText(text: string): boolean {
  const normalized = normalizeSemanticTypeText(text);
  if (!normalized) {
    return false;
  }
  return SIMPLE_SEMANTIC_TYPE_TEXT_PATTERN.test(normalized);
}

function isBaseSemanticTypeText(text: string): boolean {
  const normalized = normalizeSemanticTypeText(text);
  return CODE_MIRROR_BASE_TYPE_KEYWORDS.includes(
    normalized as (typeof CODE_MIRROR_BASE_TYPE_KEYWORDS)[number],
  );
}

function isLiteralBooleanText(text: string): boolean {
  return text === 'true' || text === 'false';
}

function shouldColorAsBaseType(
  typeInfo: TypeInfo,
  reader: PropsDocReader,
): boolean {
  const resolved = reader.resolveRef(typeInfo);

  if (resolved.kind === 'primitive') {
    return true;
  }

  return false;
}

function getSemanticRangeKindForTypeInfo(
  typeInfo: TypeInfo,
  reader: PropsDocReader,
): SemanticRangeKind {
  const resolved = reader.resolveRef(typeInfo);
  if (resolved.kind === 'literal' && isLiteralBooleanText(resolved.text)) {
    return CODE_MIRROR_SEMANTIC_RANGE_KIND.PropertyType;
  }
  const renderInfo = reader.getTypeRenderInfo(resolved);

  switch (renderInfo.type) {
    case RENDER_TYPE.PRIMITIVE:
      return CODE_MIRROR_SEMANTIC_RANGE_KIND.BaseType;
    case RENDER_TYPE.DEFAULT:
      return isBaseSemanticTypeText(renderInfo.text)
        ? CODE_MIRROR_SEMANTIC_RANGE_KIND.BaseType
        : CODE_MIRROR_SEMANTIC_RANGE_KIND.PropertyType;
    case RENDER_TYPE.ARRAY:
      return getSemanticRangeKindForTypeInfo(renderInfo.elementType, reader);
    default:
      return CODE_MIRROR_SEMANTIC_RANGE_KIND.PropertyType;
  }
}

function collectBaseTypeSemanticOffsetRanges(
  code: string,
  typeInfo: TypeInfo,
  reader: PropsDocReader,
  ranges: SemanticOffsetRange[],
  baseOffset: number,
  indentLevel: number,
): void {
  if (shouldColorAsBaseType(typeInfo, reader)) {
    addSemanticTypeTextRanges(
      ranges,
      CODE_MIRROR_SEMANTIC_RANGE_KIND.BaseType,
      reader.resolveRef(typeInfo).text,
      code,
      baseOffset,
    );
    return;
  }

  const resolved = reader.resolveRef(typeInfo);
  const renderInfo = reader.getTypeRenderInfo(resolved);

  switch (renderInfo.type) {
    case RENDER_TYPE.OBJECT:
    case RENDER_TYPE.CUSTOM_EXPANDABLE:
      collectDisplayNameSemanticRanges(
        ranges,
        renderInfo.name,
        code,
        baseOffset,
      );
      return;
    case RENDER_TYPE.UNION: {
      let searchCursor = 0;

      for (const member of renderInfo.types) {
        const memberCode = renderTypeTextCode(member, reader, indentLevel);
        const memberIndex = code.indexOf(memberCode, searchCursor);
        if (memberIndex < 0) {
          continue;
        }

        collectBaseTypeSemanticOffsetRanges(
          code.slice(memberIndex, memberIndex + memberCode.length),
          member,
          reader,
          ranges,
          baseOffset + memberIndex,
          indentLevel,
        );
        searchCursor = memberIndex + memberCode.length;
      }

      return;
    }
    case RENDER_TYPE.ARRAY: {
      if (!renderInfo.elementType) {
        return;
      }

      const elementCode = renderTypeTextCode(
        renderInfo.elementType,
        reader,
        indentLevel,
      );
      const elementIndex = code.indexOf(elementCode);
      if (elementIndex < 0) {
        return;
      }

      collectBaseTypeSemanticOffsetRanges(
        code.slice(elementIndex, elementIndex + elementCode.length),
        renderInfo.elementType,
        reader,
        ranges,
        baseOffset + elementIndex,
        indentLevel,
      );
      return;
    }
    case RENDER_TYPE.TUPLE: {
      const elements = renderInfo.elements ?? [];
      let searchCursor = 0;

      for (const element of elements) {
        const elementCode = renderTypeTextCode(element, reader, indentLevel);
        const elementIndex = code.indexOf(elementCode, searchCursor);
        if (elementIndex < 0) {
          continue;
        }

        collectBaseTypeSemanticOffsetRanges(
          code.slice(elementIndex, elementIndex + elementCode.length),
          element,
          reader,
          ranges,
          baseOffset + elementIndex,
          indentLevel,
        );
        searchCursor = elementIndex + elementCode.length;
      }

      return;
    }
    case RENDER_TYPE.FUNCTION: {
      const signatures = renderInfo.signatures ?? [];
      let searchCursor = 0;

      for (const signature of signatures) {
        for (const parameter of signature.parameters) {
          const parameterCode = indentFollowingLines(
            formatStructuredTypeText(
              renderTypeTextCode(parameter.type, reader, indentLevel + 1),
            ),
            '  '.repeat(indentLevel + 1),
          );
          const parameterIndex = code.indexOf(parameterCode, searchCursor);
          if (parameterIndex < 0) {
            continue;
          }

          collectBaseTypeSemanticOffsetRanges(
            code.slice(parameterIndex, parameterIndex + parameterCode.length),
            parameter.type,
            reader,
            ranges,
            baseOffset + parameterIndex,
            indentLevel,
          );
          searchCursor = parameterIndex + parameterCode.length;
        }

        const returnCode = indentFollowingLines(
          formatStructuredTypeText(
            renderTypeTextCode(signature.returnType, reader, indentLevel + 1),
          ),
          '  '.repeat(indentLevel),
        );
        const returnIndex = code.indexOf(returnCode, searchCursor);
        if (returnIndex < 0) {
          continue;
        }

        collectBaseTypeSemanticOffsetRanges(
          code.slice(returnIndex, returnIndex + returnCode.length),
          signature.returnType,
          reader,
          ranges,
          baseOffset + returnIndex,
          indentLevel,
        );
        searchCursor = returnIndex + returnCode.length;
      }

      return;
    }
    case RENDER_TYPE.INLINE_OBJECT: {
      const propEntries = reader.getPropertyEntries(resolved);
      let searchCursor = 0;

      for (const [propName, propInfo] of propEntries) {
        const propResolved = reader.resolveRef(propInfo);
        const optionalMark = propResolved.required ? '' : '?';
        const propMarker = `${propName}${optionalMark}:`;
        const markerIndex = code.indexOf(propMarker, searchCursor);
        if (markerIndex < 0) {
          continue;
        }

        const propTypeCode = renderTypeTextCode(
          propInfo,
          reader,
          indentLevel + 1,
        );
        const typeStart = code.indexOf(
          propTypeCode,
          markerIndex + propMarker.length,
        );
        if (typeStart >= 0) {
          collectBaseTypeSemanticOffsetRanges(
            code.slice(typeStart, typeStart + propTypeCode.length),
            propInfo,
            reader,
            ranges,
            baseOffset + typeStart,
            indentLevel + 1,
          );
        }

        searchCursor = markerIndex + propMarker.length;
      }

      return;
    }
    default:
      return;
  }
}

function addSemanticTypeTextRanges(
  ranges: SemanticOffsetRange[],
  kind: SemanticRangeKind,
  text: string,
  code: string,
  baseOffset: number,
): void {
  const normalized = normalizeSemanticTypeText(text);
  if (!SIMPLE_SEMANTIC_TYPE_TEXT_PATTERN.test(normalized)) {
    return;
  }

  const textIndex = code.indexOf(normalized);
  if (textIndex < 0) {
    return;
  }

  const namespaceSeparatorIndex = normalized.lastIndexOf('.');
  if (
    namespaceSeparatorIndex > 0 &&
    namespaceSeparatorIndex < normalized.length - 1
  ) {
    addSemanticOffsetRange(
      ranges,
      CODE_MIRROR_SEMANTIC_RANGE_KIND.NamespaceName,
      baseOffset + textIndex,
      baseOffset + textIndex + namespaceSeparatorIndex + 1,
    );
    addSemanticOffsetRange(
      ranges,
      kind,
      baseOffset + textIndex + namespaceSeparatorIndex + 1,
      baseOffset + textIndex + normalized.length,
    );
    return;
  }

  addSemanticOffsetRange(
    ranges,
    kind,
    baseOffset + textIndex,
    baseOffset + textIndex + normalized.length,
  );
}

function collectSemanticOffsetRanges(
  code: string,
  typeInfo: TypeInfo,
  reader: PropsDocReader,
  displayName: string,
  ranges: SemanticOffsetRange[],
  baseOffset: number,
): void {
  const resolved = reader.resolveRef(typeInfo);
  const renderInfo = reader.getTypeRenderInfo(resolved);

  if (
    renderInfo.type === RENDER_TYPE.OBJECT ||
    renderInfo.type === RENDER_TYPE.INLINE_OBJECT
  ) {
    collectObjectSemanticOffsetRanges(
      code,
      resolved,
      reader,
      displayName,
      ranges,
      baseOffset,
    );
    return;
  }

  if (renderInfo.type === RENDER_TYPE.UNION) {
    collectDisplayNameSemanticRanges(ranges, displayName, code, baseOffset);

    collectUnionSemanticOffsetRanges(
      code,
      renderInfo.types,
      reader,
      ranges,
      baseOffset,
    );
    return;
  }

  if (renderInfo.type === RENDER_TYPE.CUSTOM_EXPANDABLE) {
    const inner = renderInfo.resolved;
    if (
      inner.kind === 'union' &&
      inner.unionTypes &&
      inner.unionTypes.length > 0
    ) {
      collectDisplayNameSemanticRanges(ranges, displayName, code, baseOffset);
      collectUnionSemanticOffsetRanges(
        code,
        inner.unionTypes,
        reader,
        ranges,
        baseOffset,
      );
      return;
    }
  }

  addSemanticTypeTextRanges(
    ranges,
    CODE_MIRROR_SEMANTIC_RANGE_KIND.TypeName,
    displayName,
    code,
    baseOffset,
  );

  const renderedText = renderTypeTextCode(resolved, reader, 0);
  if (
    normalizeSemanticTypeText(renderedText) !==
    normalizeSemanticTypeText(displayName)
  ) {
    addSemanticTypeTextRanges(
      ranges,
      getSemanticRangeKindForTypeInfo(resolved, reader),
      renderedText,
      code,
      baseOffset,
    );
  }
}

function collectObjectSemanticOffsetRanges(
  code: string,
  typeInfo: FullTypeInfo,
  reader: PropsDocReader,
  displayName: string,
  ranges: SemanticOffsetRange[],
  baseOffset: number,
): void {
  collectDisplayNameSemanticRanges(ranges, displayName, code, baseOffset);

  const propEntries = reader.getPropertyEntries(typeInfo);
  let searchCursor = 0;

  for (const [propName, propInfo] of propEntries) {
    const resolved = reader.resolveRef(propInfo);
    const optionalMark = resolved.required ? '' : '?';
    const propMarker = `${propName}${optionalMark}:`;
    const markerIndex = code.indexOf(propMarker, searchCursor);
    if (markerIndex < 0) {
      continue;
    }

    addSemanticOffsetRange(
      ranges,
      resolved.kind === 'function'
        ? CODE_MIRROR_SEMANTIC_RANGE_KIND.FunctionPropertyName
        : CODE_MIRROR_SEMANTIC_RANGE_KIND.PropertyName,
      baseOffset + markerIndex,
      baseOffset + markerIndex + propName.length,
    );

    const propTypeCode = renderTypeTextCode(propInfo, reader, 1);
    const typeStart = code.indexOf(
      propTypeCode,
      markerIndex + propMarker.length,
    );
    const propRangeKind = getSemanticRangeKindForTypeInfo(propInfo, reader);

    if (typeStart >= 0 && isSimpleSemanticTypeText(propTypeCode)) {
      addSemanticTypeTextRanges(
        ranges,
        propRangeKind,
        propTypeCode,
        code.slice(typeStart, typeStart + propTypeCode.length),
        baseOffset + typeStart,
      );
    }

    if (typeStart >= 0 && !isSimpleSemanticTypeText(propTypeCode)) {
      collectBaseTypeSemanticOffsetRanges(
        propTypeCode,
        propInfo,
        reader,
        ranges,
        baseOffset + typeStart,
        1,
      );
    }

    searchCursor = markerIndex + propMarker.length;
  }
}

function collectUnionSemanticOffsetRanges(
  code: string,
  members: TypeInfo[],
  reader: PropsDocReader,
  ranges: SemanticOffsetRange[],
  baseOffset: number,
): void {
  let searchCursor = 0;

  for (const member of members) {
    const memberCode = renderTypeTextCode(member, reader, 1);
    const memberIndex = code.indexOf(memberCode, searchCursor);
    if (memberIndex < 0) {
      continue;
    }

    if (isSimpleSemanticTypeText(memberCode)) {
      addSemanticTypeTextRanges(
        ranges,
        getSemanticRangeKindForTypeInfo(member, reader),
        memberCode,
        code.slice(memberIndex, memberIndex + memberCode.length),
        baseOffset + memberIndex,
      );
    } else {
      collectBaseTypeSemanticOffsetRanges(
        code.slice(memberIndex, memberIndex + memberCode.length),
        member,
        reader,
        ranges,
        baseOffset + memberIndex,
        1,
      );
    }

    searchCursor = memberIndex + memberCode.length;
  }
}

interface TextSegment {
  start: number;
  end: number;
  text: string;
}

function trimTextRange(
  text: string,
  start: number,
  end: number,
): TextSegment | null {
  let nextStart = start;
  let nextEnd = end;

  while (nextStart < nextEnd && /\s/.test(text[nextStart]!)) {
    nextStart += 1;
  }

  while (nextEnd > nextStart && /\s/.test(text[nextEnd - 1]!)) {
    nextEnd -= 1;
  }

  if (nextStart >= nextEnd) {
    return null;
  }

  return {
    start: nextStart,
    end: nextEnd,
    text: text.slice(nextStart, nextEnd),
  };
}

function splitTopLevelSegments(
  text: string,
  separators: readonly string[],
): TextSegment[] {
  const segments: TextSegment[] = [];
  let start = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index]!;

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (current === '\\') {
        escaped = true;
        continue;
      }
      if (current === quote) {
        quote = null;
      }
      continue;
    }

    if (current === "'" || current === '"' || current === '`') {
      quote = current;
      continue;
    }

    if (current === '(') {
      parenDepth += 1;
      continue;
    }
    if (current === ')') {
      if (parenDepth > 0) {
        parenDepth -= 1;
      }
      continue;
    }
    if (current === '[') {
      bracketDepth += 1;
      continue;
    }
    if (current === ']') {
      if (bracketDepth > 0) {
        bracketDepth -= 1;
      }
      continue;
    }
    if (current === '{') {
      braceDepth += 1;
      continue;
    }
    if (current === '}') {
      if (braceDepth > 0) {
        braceDepth -= 1;
      }
      continue;
    }
    if (current === '<') {
      angleDepth += 1;
      continue;
    }
    if (current === '>') {
      if (text[index - 1] !== '=' && angleDepth > 0) {
        angleDepth -= 1;
      }
      continue;
    }

    if (
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0 &&
      separators.includes(current)
    ) {
      const segment = trimTextRange(text, start, index);
      if (segment) {
        segments.push(segment);
      }
      start = index + 1;
    }
  }

  const tail = trimTextRange(text, start, text.length);
  if (tail) {
    segments.push(tail);
  }

  return segments;
}

function findMatchingDelimiter(
  text: string,
  openIndex: number,
  openChar: '(' | '[' | '{' | '<',
  closeChar: ')' | ']' | '}' | '>',
): number {
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;

  for (let index = openIndex; index < text.length; index += 1) {
    const current = text[index]!;

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (current === '\\') {
        escaped = true;
        continue;
      }
      if (current === quote) {
        quote = null;
      }
      continue;
    }

    if (current === "'" || current === '"' || current === '`') {
      quote = current;
      continue;
    }

    if (current === openChar) {
      if (openChar === '(') {
        parenDepth += 1;
      } else if (openChar === '[') {
        bracketDepth += 1;
      } else if (openChar === '{') {
        braceDepth += 1;
      } else {
        angleDepth += 1;
      }
      continue;
    }

    if (current === closeChar) {
      if (closeChar === ')' && parenDepth > 0) {
        parenDepth -= 1;
        if (parenDepth === 0 && openChar === '(' && index > openIndex) {
          return index;
        }
      } else if (closeChar === ']' && bracketDepth > 0) {
        bracketDepth -= 1;
        if (bracketDepth === 0 && openChar === '[' && index > openIndex) {
          return index;
        }
      } else if (closeChar === '}' && braceDepth > 0) {
        braceDepth -= 1;
        if (braceDepth === 0 && openChar === '{' && index > openIndex) {
          return index;
        }
      } else if (
        closeChar === '>' &&
        angleDepth > 0 &&
        text[index - 1] !== '='
      ) {
        angleDepth -= 1;
        if (angleDepth === 0 && openChar === '<' && index > openIndex) {
          return index;
        }
      }
    }
  }

  return -1;
}

function findTopLevelArrowIndex(text: string): number {
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;

  for (let index = 0; index < text.length - 1; index += 1) {
    const current = text[index]!;
    const next = text[index + 1]!;

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (current === '\\') {
        escaped = true;
        continue;
      }
      if (current === quote) {
        quote = null;
      }
      continue;
    }

    if (current === "'" || current === '"' || current === '`') {
      quote = current;
      continue;
    }

    if (current === '(') {
      parenDepth += 1;
      continue;
    }
    if (current === ')') {
      if (parenDepth > 0) {
        parenDepth -= 1;
      }
      continue;
    }
    if (current === '[') {
      bracketDepth += 1;
      continue;
    }
    if (current === ']') {
      if (bracketDepth > 0) {
        bracketDepth -= 1;
      }
      continue;
    }
    if (current === '{') {
      braceDepth += 1;
      continue;
    }
    if (current === '}') {
      if (braceDepth > 0) {
        braceDepth -= 1;
      }
      continue;
    }
    if (current === '<') {
      angleDepth += 1;
      continue;
    }
    if (current === '>') {
      if (text[index - 1] !== '=' && angleDepth > 0) {
        angleDepth -= 1;
      }
      continue;
    }

    if (
      current === '=' &&
      next === '>' &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0
    ) {
      return index;
    }
  }

  return -1;
}

function findTopLevelEqualsIndex(text: string): number {
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index]!;

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (current === '\\') {
        escaped = true;
        continue;
      }
      if (current === quote) {
        quote = null;
      }
      continue;
    }

    if (current === "'" || current === '"' || current === '`') {
      quote = current;
      continue;
    }

    if (current === '(') {
      parenDepth += 1;
      continue;
    }
    if (current === ')') {
      if (parenDepth > 0) {
        parenDepth -= 1;
      }
      continue;
    }
    if (current === '[') {
      bracketDepth += 1;
      continue;
    }
    if (current === ']') {
      if (bracketDepth > 0) {
        bracketDepth -= 1;
      }
      continue;
    }
    if (current === '{') {
      braceDepth += 1;
      continue;
    }
    if (current === '}') {
      if (braceDepth > 0) {
        braceDepth -= 1;
      }
      continue;
    }
    if (current === '<') {
      angleDepth += 1;
      continue;
    }
    if (current === '>') {
      if (text[index - 1] !== '=' && angleDepth > 0) {
        angleDepth -= 1;
      }
      continue;
    }

    if (
      current === '=' &&
      text[index + 1] !== '>' &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0
    ) {
      return index;
    }
  }

  return -1;
}

function collectStructuredTypeSemanticRanges(
  text: string,
  ranges: SemanticOffsetRange[],
  baseOffset: number,
): void {
  const trimmed = trimTextRange(text, 0, text.length);
  if (!trimmed) {
    return;
  }

  const segmentText = trimmed.text;
  const segmentOffset = baseOffset + trimmed.start;

  const readonlyMatch = segmentText.match(/^readonly\s+/);
  if (readonlyMatch) {
    const shift = readonlyMatch[0].length;
    collectStructuredTypeSemanticRanges(
      segmentText.slice(shift),
      ranges,
      segmentOffset + shift,
    );
    return;
  }

  const extendsMatch = segmentText.match(
    /^([A-Za-z_$][\w$]*)\s+extends\s+(.+)$/,
  );
  if (extendsMatch) {
    const typeName = extendsMatch[1]!;
    const remainder = extendsMatch[2]!;
    addSemanticTypeTextRanges(
      ranges,
      CODE_MIRROR_SEMANTIC_RANGE_KIND.TypeName,
      typeName,
      typeName,
      segmentOffset,
    );
    const remainderStart = segmentText.indexOf(remainder, typeName.length);
    if (remainderStart >= 0) {
      collectStructuredTypeSemanticRanges(
        remainder,
        ranges,
        segmentOffset + remainderStart,
      );
    }
    return;
  }

  const equalsIndex = findTopLevelEqualsIndex(segmentText);
  if (equalsIndex > 0) {
    const left = trimTextRange(segmentText, 0, equalsIndex);
    const right = trimTextRange(
      segmentText,
      equalsIndex + 1,
      segmentText.length,
    );
    if (left) {
      collectStructuredTypeSemanticRanges(
        left.text,
        ranges,
        segmentOffset + left.start,
      );
    }
    if (right) {
      collectStructuredTypeSemanticRanges(
        right.text,
        ranges,
        segmentOffset + right.start,
      );
    }
    return;
  }

  const arraySuffixMatch = segmentText.match(/^(.*?)(\[\])+$/);
  if (arraySuffixMatch && arraySuffixMatch[1]) {
    const inner = arraySuffixMatch[1];
    const innerIndex = segmentText.lastIndexOf(inner);
    collectStructuredTypeSemanticRanges(
      inner,
      ranges,
      segmentOffset + innerIndex,
    );
    return;
  }

  const outerParensEnd = findMatchingDelimiter(segmentText, 0, '(', ')');
  if (
    segmentText.startsWith('(') &&
    outerParensEnd === segmentText.length - 1
  ) {
    collectStructuredTypeSemanticRanges(
      segmentText.slice(1, -1),
      ranges,
      segmentOffset + 1,
    );
    return;
  }

  const functionArrowIndex = findTopLevelArrowIndex(segmentText);
  if (functionArrowIndex >= 0) {
    const paramsPart = trimTextRange(segmentText, 0, functionArrowIndex);
    const returnPart = trimTextRange(
      segmentText,
      functionArrowIndex + 2,
      segmentText.length,
    );

    if (paramsPart && paramsPart.text.startsWith('(')) {
      const paramsEnd = findMatchingDelimiter(paramsPart.text, 0, '(', ')');
      if (paramsEnd === paramsPart.text.length - 1) {
        const paramsInner = paramsPart.text.slice(1, -1);
        const params = splitTopLevelSegments(paramsInner, [',']);
        for (const param of params) {
          const colonIndex = param.text.indexOf(':');
          if (colonIndex < 0) {
            continue;
          }

          const typeText = trimTextRange(
            param.text,
            colonIndex + 1,
            param.text.length,
          );
          if (!typeText) {
            continue;
          }

          collectStructuredTypeSemanticRanges(
            typeText.text,
            ranges,
            segmentOffset + paramsPart.start + 1 + param.start + typeText.start,
          );
        }
      }
    }

    if (returnPart) {
      collectStructuredTypeSemanticRanges(
        returnPart.text,
        ranges,
        segmentOffset + returnPart.start,
      );
    }

    return;
  }

  const objectEnd = findMatchingDelimiter(segmentText, 0, '{', '}');
  if (segmentText.startsWith('{') && objectEnd === segmentText.length - 1) {
    const inner = segmentText.slice(1, -1);
    const entries = splitTopLevelSegments(inner, [';', ',']);
    for (const entry of entries) {
      const entryText = entry.text;
      if (!entryText) {
        continue;
      }

      const propertyMatch = entryText.match(
        /^(?:readonly\s+)?([A-Za-z_$][\w$]*)(\?)?\s*:\s*(.+)$/,
      );
      if (!propertyMatch) {
        continue;
      }

      const propertyName = propertyMatch[1]!;
      const propertyNameIndex = entryText.indexOf(propertyName);
      if (propertyNameIndex < 0) {
        continue;
      }

      const colonIndex = entryText.indexOf(
        ':',
        propertyNameIndex + propertyName.length,
      );
      if (colonIndex < 0) {
        continue;
      }

      addSemanticOffsetRange(
        ranges,
        findTopLevelArrowIndex(propertyMatch[3]!) >= 0
          ? CODE_MIRROR_SEMANTIC_RANGE_KIND.FunctionPropertyName
          : CODE_MIRROR_SEMANTIC_RANGE_KIND.PropertyName,
        segmentOffset + 1 + entry.start + propertyNameIndex,
        segmentOffset +
          1 +
          entry.start +
          propertyNameIndex +
          propertyName.length,
      );

      const typeText = trimTextRange(
        entryText,
        colonIndex + 1,
        entryText.length,
      );
      if (!typeText) {
        continue;
      }

      collectStructuredTypeSemanticRanges(
        typeText.text,
        ranges,
        segmentOffset + 1 + entry.start + typeText.start,
      );
    }
    return;
  }

  const tupleEnd = findMatchingDelimiter(segmentText, 0, '[', ']');
  if (segmentText.startsWith('[') && tupleEnd === segmentText.length - 1) {
    const inner = segmentText.slice(1, -1);
    const elements = splitTopLevelSegments(inner, [',']);
    for (const element of elements) {
      collectStructuredTypeSemanticRanges(
        element.text,
        ranges,
        segmentOffset + 1 + element.start,
      );
    }
    return;
  }

  const unionSegments = splitTopLevelSegments(segmentText, ['|']);
  if (unionSegments.length > 1) {
    for (const part of unionSegments) {
      collectStructuredTypeSemanticRanges(
        part.text,
        ranges,
        segmentOffset + part.start,
      );
    }
    return;
  }

  const intersectionSegments = splitTopLevelSegments(segmentText, ['&']);
  if (intersectionSegments.length > 1) {
    for (const part of intersectionSegments) {
      collectStructuredTypeSemanticRanges(
        part.text,
        ranges,
        segmentOffset + part.start,
      );
    }
    return;
  }

  const genericStart = segmentText.indexOf('<');
  if (genericStart > 0) {
    const genericEnd = findMatchingDelimiter(
      segmentText,
      genericStart,
      '<',
      '>',
    );
    if (genericEnd === segmentText.length - 1) {
      const baseName = segmentText.slice(0, genericStart).trimEnd();
      if (baseName) {
        addSemanticTypeTextRanges(
          ranges,
          CODE_MIRROR_SEMANTIC_RANGE_KIND.TypeName,
          baseName,
          baseName,
          segmentOffset,
        );
      }

      const argsText = segmentText.slice(genericStart + 1, genericEnd);
      const args = splitTopLevelSegments(argsText, [',']);
      for (const arg of args) {
        collectStructuredTypeSemanticRanges(
          arg.text,
          ranges,
          segmentOffset + genericStart + 1 + arg.start,
        );
      }
      return;
    }
  }

  if (isSimpleSemanticTypeText(segmentText)) {
    addSemanticTypeTextRanges(
      ranges,
      isBaseSemanticTypeText(segmentText)
        ? CODE_MIRROR_SEMANTIC_RANGE_KIND.BaseType
        : CODE_MIRROR_SEMANTIC_RANGE_KIND.TypeName,
      segmentText,
      segmentText,
      segmentOffset,
    );
  }
}

function collectDisplayNameSemanticRanges(
  ranges: SemanticOffsetRange[],
  displayName: string,
  code: string,
  baseOffset: number,
): void {
  const displayNameIndex = code.indexOf(displayName);
  if (displayNameIndex < 0) {
    return;
  }

  const displayNameOffset = baseOffset + displayNameIndex;
  const genericStart = displayName.indexOf('<');

  if (genericStart < 0) {
    if (isSimpleSemanticTypeText(displayName)) {
      addSemanticTypeTextRanges(
        ranges,
        CODE_MIRROR_SEMANTIC_RANGE_KIND.TypeName,
        displayName,
        displayName,
        displayNameOffset,
      );
    }
    return;
  }

  const genericEnd = findMatchingDelimiter(displayName, genericStart, '<', '>');
  if (genericEnd < 0) {
    const baseName = displayName.slice(0, genericStart).trimEnd();
    if (baseName && isSimpleSemanticTypeText(baseName)) {
      addSemanticTypeTextRanges(
        ranges,
        CODE_MIRROR_SEMANTIC_RANGE_KIND.TypeName,
        baseName,
        baseName,
        displayNameOffset,
      );
    }
    return;
  }

  const baseName = displayName.slice(0, genericStart).trimEnd();
  if (baseName && isSimpleSemanticTypeText(baseName)) {
    addSemanticTypeTextRanges(
      ranges,
      CODE_MIRROR_SEMANTIC_RANGE_KIND.TypeName,
      baseName,
      baseName,
      displayNameOffset,
    );
  }

  const argsText = displayName.slice(genericStart + 1, genericEnd);
  const args = splitTopLevelSegments(argsText, [',']);
  for (const arg of args) {
    collectStructuredTypeSemanticRanges(
      arg.text,
      ranges,
      displayNameOffset + genericStart + 1 + arg.start,
    );
  }
}
