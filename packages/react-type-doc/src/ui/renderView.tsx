import type { TypeInfo } from '../shared/types';
import { TYPE_CATEGORY } from '../shared/types';
import React from 'react';
import {
  ClickableTypeName,
  CodeContainer,
  CodeContent,
  CodeLine,
  FunctionPropertyName,
  Indent,
  Keyword,
  OptionalMark,
  PropertyName,
  Punctuation,
  TypeName,
} from './styled';
import type { TypeRenderContext } from './types';
import { renderTypeText } from './renderType';
import { renderDescription } from './renderDescription';

/**
 * 渲染联合类型视图
 */
export function renderUnionTypeView(
  typeName: string,
  typeInfo: TypeInfo,
  context: TypeRenderContext,
): React.ReactNode {
  const resolved = context.reader.resolveRef(typeInfo);
  const unionTypes = resolved.unionTypes ?? [];

  return (
    <CodeContainer>
      <CodeContent>
        {resolved.description && (
          <CodeLine>
            {renderDescription(
              resolved.description,
              0,
              context,
              resolved.descriptionLinks,
            )}
          </CodeLine>
        )}
        <CodeLine>
          <Keyword>type</Keyword>
          <TypeName> {typeName} </TypeName>
          <Punctuation>= </Punctuation>
        </CodeLine>

        {unionTypes.map((unionMember: TypeInfo, idx: number) => {
          const resolvedMember = context.reader.resolveRef(unionMember);
          const displayName = context.reader.getDisplayName(
            resolvedMember,
            context.locale.unionMember(idx + 1),
          );
          const isExpandable = context.reader.isExpandable(unionMember);

          return (
            <CodeLine key={idx}>
              <Indent $level={1} />
              <Punctuation>| </Punctuation>
              {isExpandable ? (
                <ClickableTypeName
                  onClick={() => context.onTypeClick(unionMember, displayName)}
                  title={context.locale.clickToViewDetails}
                >
                  {displayName}
                </ClickableTypeName>
              ) : (
                <TypeName>{displayName}</TypeName>
              )}
              <Punctuation>;</Punctuation>
            </CodeLine>
          );
        })}
      </CodeContent>
    </CodeContainer>
  );
}

/**
 * 渲染属性行
 */
export function renderPropertyLine(
  propName: string,
  propInfo: TypeInfo,
  context: TypeRenderContext,
  indentLevel: number = 1,
): React.ReactNode {
  const resolved = context.reader.resolveRef(propInfo);

  const isOptional = !resolved.required;
  const hasDescription = Boolean(resolved.description);

  const contextWithField: TypeRenderContext = {
    ...context,
    onTypeClick: (typeInfo, typeName) =>
      context.onTypeClick(typeInfo, typeName, propName),
  };

  return (
    <CodeLine key={propName}>
      <Indent $level={indentLevel} />
      {hasDescription && (
        <>
          {renderDescription(
            resolved.description!,
            indentLevel,
            context,
            resolved.descriptionLinks,
          )}
          <br />
          <Indent $level={indentLevel} />
        </>
      )}
      {resolved.kind === TYPE_CATEGORY.Function ? (
        <FunctionPropertyName>{propName}</FunctionPropertyName>
      ) : (
        <PropertyName>{propName}</PropertyName>
      )}
      {isOptional && <OptionalMark>?</OptionalMark>}
      <Punctuation>: </Punctuation>
      {renderTypeText(propInfo, contextWithField)}
      <Punctuation>;</Punctuation>
    </CodeLine>
  );
}
