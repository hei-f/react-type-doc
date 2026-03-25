import type { TypeInfo } from '../shared/types';
import type { PropsDocReader } from '../runtime/reader';
import React from 'react';
import {
  ClickableTypeName,
  Comment,
  Indent,
  JsDocLink,
  JsDocTag,
  JsDocTypeRef,
} from './styled';
import type { TypeRenderContext } from './types';

/**
 * 匹配 {@link content} 内联标签和裸 URL
 * 捕获组1: {@link} 内容，捕获组2: 裸 URL
 */
export const JSDOC_INLINE_LINK_PATTERN =
  /\{@link\s+([^}]+)\}|(https?:\/\/\S+)/g;

/**
 * 在 reader 的注册数据中查找 {@link} 引用的类型
 * 支持 TypeName 和 TypeName.property 格式
 */
function findTypeByLinkRef(
  reader: PropsDocReader,
  refText: string,
): { typeInfo: TypeInfo; typeName: string } | null {
  const dotIdx = refText.indexOf('.');
  const typeName = dotIdx >= 0 ? refText.slice(0, dotIdx) : refText;

  for (const key of reader.getAllKeys()) {
    const raw = reader.getRaw(key);
    if (!raw) continue;
    const resolved = reader.resolveRef(raw);
    if (resolved.text === typeName || resolved.name === typeName) {
      return { typeInfo: raw, typeName };
    }
  }

  const registry = reader.getTypeRegistry();
  const registryKey = `text:${typeName}`;
  const registryEntry = registry[registryKey];
  if (registryEntry) {
    return { typeInfo: registryEntry, typeName };
  }

  return null;
}

/**
 * 使用预解析的 descriptionLinks 查找 {@link} 引用的类型
 * 优先通过解析阶段 ts-morph 预计算的 registry key 直接查找（O(1)）
 * 找不到时回退到运行时遍历搜索
 */
export function resolveJSDocTypeLink(
  target: string,
  reader: PropsDocReader,
  descriptionLinks?: Record<string, string>,
): { typeInfo: TypeInfo; typeName: string } | null {
  if (descriptionLinks && target in descriptionLinks) {
    const registryKey = descriptionLinks[target];
    if (registryKey) {
      const registry = reader.getTypeRegistry();
      const registryEntry = registry[registryKey];
      if (registryEntry) {
        const dotIdx = target.indexOf('.');
        const baseName = dotIdx >= 0 ? target.slice(0, dotIdx) : target;
        return { typeInfo: registryEntry, typeName: baseName };
      }
    }
  }

  return findTypeByLinkRef(reader, target);
}

/**
 * 解析描述行中的 @tag 标签和 {@link} 链接，返回带样式的 React 节点
 */
export function parseDescriptionLine(
  line: string,
  context?: TypeRenderContext,
  descriptionLinks?: Record<string, string>,
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let keyIdx = 0;

  const blockTagMatch = remaining.match(/^(@\w+)/);
  if (blockTagMatch?.[1]) {
    parts.push(<JsDocTag key={`tag-${keyIdx++}`}>{blockTagMatch[1]}</JsDocTag>);
    remaining = remaining.slice(blockTagMatch[1].length);
  }

  const regex = new RegExp(JSDOC_INLINE_LINK_PATTERN.source, 'g');
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIdx) {
      parts.push(remaining.slice(lastIdx, match.index));
    }

    if (match[1] !== undefined) {
      const linkContent = match[1].trim();
      const pipeIdx = linkContent.indexOf('|');
      const target =
        pipeIdx >= 0 ? linkContent.slice(0, pipeIdx).trim() : linkContent;
      const display =
        pipeIdx >= 0 ? linkContent.slice(pipeIdx + 1).trim() : linkContent;
      const isUrl = /^https?:\/\//.test(target);

      if (isUrl) {
        parts.push(
          <JsDocLink
            key={`link-${keyIdx++}`}
            href={target}
            target="_blank"
            rel="noopener noreferrer"
          >
            {display}
          </JsDocLink>,
        );
      } else if (context) {
        const found = resolveJSDocTypeLink(
          target,
          context.reader,
          descriptionLinks,
        );
        if (found) {
          parts.push(
            <ClickableTypeName
              key={`ref-${keyIdx++}`}
              onClick={() =>
                context.onTypeClick(found.typeInfo, found.typeName)
              }
              title={context.locale.clickToView(found.typeName)}
            >
              {display}
            </ClickableTypeName>,
          );
        } else {
          parts.push(
            <JsDocTypeRef key={`ref-${keyIdx++}`}>{display}</JsDocTypeRef>,
          );
        }
      } else {
        parts.push(
          <JsDocTypeRef key={`ref-${keyIdx++}`}>{display}</JsDocTypeRef>,
        );
      }
    } else if (match[2]) {
      parts.push(
        <JsDocLink
          key={`url-${keyIdx++}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[2]}
        </JsDocLink>,
      );
    }

    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < remaining.length) {
    parts.push(remaining.slice(lastIdx));
  }

  return <>{parts}</>;
}

/**
 * 渲染 JSDoc 描述（支持多行，含 @param、@default 等标签和 {@link} 链接）
 */
export function renderDescription(
  description: string,
  indentLevel: number,
  context?: TypeRenderContext,
  descriptionLinks?: Record<string, string>,
): React.ReactNode {
  if (!description.includes('\n')) {
    return (
      <Comment>
        {'/** '}
        {parseDescriptionLine(description, context, descriptionLinks)}
        {' */'}
      </Comment>
    );
  }

  const lines = description.split('\n');
  return (
    <>
      <Comment>{'/**'}</Comment>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          <br />
          <Indent $level={indentLevel} />
          <Comment>
            {' * '}
            {parseDescriptionLine(line, context, descriptionLinks)}
          </Comment>
        </React.Fragment>
      ))}
      <br />
      <Indent $level={indentLevel} />
      <Comment>{' */'}</Comment>
    </>
  );
}
