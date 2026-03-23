/**
 * 类型信息转 TypeScript 代码字符串
 * @description 将 TypeInfo 转换为格式化的 TypeScript 代码，供 CodeMirror / 只读代码面板渲染
 */

import type { TypeInfo, FullTypeInfo } from '../shared/types';
import type { PropsDocReader } from '../runtime/reader';
import { RENDER_TYPE } from '../runtime/renderTypes';

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
): { code: string; jsdocBlocks: JSDocBlockMeta[] } {
  const jsdocBlocks: JSDocBlockMeta[] = [];
  const resolved = reader.resolveRef(typeInfo);
  const renderInfo = reader.getTypeRenderInfo(resolved);

  if (renderInfo.type === RENDER_TYPE.CUSTOM_EXPANDABLE) {
    const inner = renderInfo.resolved;
    if (
      inner.kind === 'union' &&
      inner.unionTypes &&
      inner.unionTypes.length > 0
    ) {
      return {
        code: renderNamedUnionTypeAliasCode(
          displayName,
          inner,
          reader,
          jsdocBlocks,
        ),
        jsdocBlocks,
      };
    }
  }

  if (!isNested && renderInfo.type === RENDER_TYPE.UNION) {
    return {
      code: renderUnionTypeCode(
        displayName,
        renderInfo.types,
        reader,
        resolved.description,
        jsdocBlocks,
        resolved.descriptionLinks,
      ),
      jsdocBlocks,
    };
  }

  if (
    renderInfo.type === RENDER_TYPE.OBJECT ||
    renderInfo.type === RENDER_TYPE.INLINE_OBJECT
  ) {
    return {
      code: renderObjectTypeCode(displayName, resolved, reader, jsdocBlocks),
      jsdocBlocks,
    };
  }

  const code = `type ${displayName} = ${renderTypeTextCode(resolved, reader, 0)};`;
  return { code, jsdocBlocks };
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
      return renderInfo.text;

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
  const ranges: ClickableRange[] = [];
  const resolved = reader.resolveRef(typeInfo);
  const renderInfo = reader.getTypeRenderInfo(resolved);

  if (renderInfo.type === RENDER_TYPE.CUSTOM_EXPANDABLE) {
    const inner = renderInfo.resolved;
    if (
      inner.kind === 'union' &&
      inner.unionTypes &&
      inner.unionTypes.length > 0
    ) {
      extractUnionClickableRanges(code, inner.unionTypes, reader, ranges);
      return ranges;
    }
  }

  if (renderInfo.type === RENDER_TYPE.UNION) {
    extractUnionClickableRanges(code, renderInfo.types, reader, ranges);
  } else if (
    renderInfo.type === RENDER_TYPE.OBJECT ||
    renderInfo.type === RENDER_TYPE.INLINE_OBJECT
  ) {
    extractObjectClickableRanges(code, resolved, reader, ranges);
  }

  return ranges;
}

/**
 * 从联合类型代码中提取可点击范围
 */
function extractUnionClickableRanges(
  code: string,
  members: TypeInfo[],
  reader: PropsDocReader,
  ranges: ClickableRange[],
): void {
  const lines = code.split('\n');

  lines.forEach((line, lineIndex) => {
    if (!line.includes('|')) return;

    members.forEach((member) => {
      const resolved = reader.resolveRef(member);
      const target = reader.getNavigationTarget(member, resolved.text || '');
      if (!target) return;

      const renderInfo = reader.getTypeRenderInfo(resolved);

      let searchText = '';
      if (renderInfo.type === RENDER_TYPE.INLINE_OBJECT) {
        searchText = '{';
      } else if (
        renderInfo.type === RENDER_TYPE.OBJECT ||
        renderInfo.type === RENDER_TYPE.CUSTOM_EXPANDABLE
      ) {
        searchText = renderInfo.name;
      }

      if (!searchText || !line.includes(searchText)) return;

      const startColumn = line.indexOf(searchText) + 1;
      const endColumn = startColumn + searchText.length;

      ranges.push({
        range: {
          startLine: lineIndex + 1,
          startColumn,
          endLine: lineIndex + 1,
          endColumn,
        },
        typeName: target.name,
        typeInfo: target.typeInfo,
      });
    });
  });
}

/**
 * 从对象类型代码中提取可点击范围
 */
function extractObjectClickableRanges(
  code: string,
  typeInfo: FullTypeInfo,
  reader: PropsDocReader,
  ranges: ClickableRange[],
): void {
  const lines = code.split('\n');
  const propEntries = reader.getPropertyEntries(typeInfo);

  propEntries.forEach(([propName, propInfo]) => {
    const resolved = reader.resolveRef(propInfo);
    const target = reader.getNavigationTarget(propInfo, resolved.text || '');
    if (!target) return;

    const renderInfo = reader.getTypeRenderInfo(resolved);

    let searchText = '';
    if (
      renderInfo.type === RENDER_TYPE.OBJECT ||
      renderInfo.type === RENDER_TYPE.CUSTOM_EXPANDABLE
    ) {
      searchText = renderInfo.name;
    } else if (renderInfo.type === RENDER_TYPE.ARRAY) {
      const elem = renderInfo.elementType;
      if (!reader.isExpandable(elem)) {
        return;
      }
      const elemResolved = reader.resolveRef(elem);
      const elemRenderInfo = reader.getTypeRenderInfo(elemResolved);
      if (
        elemRenderInfo.type === RENDER_TYPE.OBJECT ||
        elemRenderInfo.type === RENDER_TYPE.CUSTOM_EXPANDABLE
      ) {
        searchText = elemRenderInfo.name;
      } else if (elemRenderInfo.type === RENDER_TYPE.UNION) {
        searchText = reader.getDisplayName(
          elemResolved,
          elemResolved.text ?? '',
        );
      } else if (elemRenderInfo.type === RENDER_TYPE.INLINE_OBJECT) {
        return;
      } else {
        return;
      }
    } else if (renderInfo.type === RENDER_TYPE.INLINE_OBJECT) {
      return;
    }

    if (!searchText) return;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      if (!line.includes(`${propName}:`) && !line.includes(`${propName}?:`))
        continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const afterColon = line.substring(colonIndex + 1);
      const typeStartInAfterColon = afterColon.search(/\S/);
      if (typeStartInAfterColon === -1) continue;

      const startColumn = colonIndex + 1 + typeStartInAfterColon + 1;

      const afterTypeStart = afterColon.slice(typeStartInAfterColon);
      if (!afterTypeStart.startsWith(searchText)) continue;

      const endColumn = startColumn + searchText.length;

      ranges.push({
        range: {
          startLine: lineIndex + 1,
          startColumn,
          endLine: lineIndex + 1,
          endColumn,
        },
        typeName: target.name,
        typeInfo: target.typeInfo,
        fieldName: propName,
      });

      break;
    }
  });
}
