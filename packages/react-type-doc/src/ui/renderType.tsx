import type {
  FunctionParameter,
  FunctionSignature,
  TypeInfo,
} from '../shared/types';
import { RENDER_TYPE } from '../runtime/renderTypes';
import type { TypeRenderInfo } from '../runtime/renderTypes';
import React from 'react';
import {
  ClickableTypeName,
  GenericParams,
  OptionalMark,
  PropertyName,
  Punctuation,
  StringLiteral,
  TypeName,
} from './styled';
import type { TypeRenderContext } from './types';

/**
 * 将类型名拆分为基础名和泛型参数部分，分别用不同样式渲染。
 * 例如 "Dictionary<T = unknown>" → TypeName("Dictionary") + GenericParams("<T = unknown>")
 */
export function renderTypeNameWithGenerics(name: string): React.ReactNode {
  const angleIdx = name.indexOf('<');
  if (angleIdx === -1) {
    return <TypeName>{` ${name} `}</TypeName>;
  }

  const baseName = name.slice(0, angleIdx);
  const genericPart = name.slice(angleIdx);
  return (
    <>
      <TypeName>{` ${baseName}`}</TypeName>
      <GenericParams>{`${genericPart} `}</GenericParams>
    </>
  );
}

/**
 * 从类型名中提取不含泛型参数的基础名。
 * 例如 "Dictionary<T = unknown>" → "Dictionary"
 */
export function getBaseName(name: string): string {
  const angleIdx = name.indexOf('<');
  return angleIdx === -1 ? name : name.slice(0, angleIdx);
}

/**
 * 渲染函数签名
 */
function renderFunctionSignature(
  signature: FunctionSignature,
  context: TypeRenderContext,
): React.ReactNode {
  const { parameters, returnType, typeParameters } = signature;

  return (
    <>
      {/* 泛型参数 */}
      {typeParameters && typeParameters.length > 0 && (
        <>
          <Punctuation>{'<'}</Punctuation>
          {typeParameters.map((tp: string, idx: number) => (
            <React.Fragment key={idx}>
              {idx > 0 && <Punctuation>, </Punctuation>}
              <TypeName>{tp}</TypeName>
            </React.Fragment>
          ))}
          <Punctuation>{'>'}</Punctuation>
        </>
      )}

      {/* 参数列表 */}
      <Punctuation>(</Punctuation>
      {parameters.map((param: FunctionParameter, idx: number) => (
        <React.Fragment key={idx}>
          {idx > 0 && <Punctuation>, </Punctuation>}
          {param.rest && <Punctuation>...</Punctuation>}
          <PropertyName>{param.name}</PropertyName>
          {param.optional && <OptionalMark>?</OptionalMark>}
          <Punctuation>: </Punctuation>
          {renderTypeText(param.type, context)}
        </React.Fragment>
      ))}
      <Punctuation>) {'=> '}</Punctuation>

      {/* 返回类型 */}
      {renderTypeText(returnType, context)}
    </>
  );
}

/**
 * 渲染函数类型
 */
function renderFunctionType(
  renderInfo: Extract<TypeRenderInfo, { type: 'function' }>,
  context: TypeRenderContext,
): React.ReactNode {
  const { signatures } = renderInfo;

  if (signatures.length > 1) {
    return signatures.map((sig: FunctionSignature, idx: number) => (
      <React.Fragment key={idx}>
        {idx > 0 && <Punctuation> & </Punctuation>}
        {renderFunctionSignature(sig, context)}
      </React.Fragment>
    ));
  }

  const firstSignature = signatures[0];
  if (!firstSignature) return null;
  return renderFunctionSignature(firstSignature, context);
}

/**
 * 渲染类型文本
 */
export function renderTypeText(
  typeInfo: TypeInfo,
  context: TypeRenderContext,
): React.ReactNode {
  const { reader, locale } = context;
  const renderInfo = reader.getTypeRenderInfo(typeInfo);

  switch (renderInfo.type) {
    case RENDER_TYPE.EXTERNAL: {
      const resolved = reader.resolveRef(typeInfo);
      const title = resolved.renderHint
        ? locale.renderHintTitles[resolved.renderHint]
        : locale.externalTypeDefault;

      return <TypeName title={title}>{renderInfo.name}</TypeName>;
    }

    case RENDER_TYPE.CIRCULAR:
      return (
        <ClickableTypeName
          onClick={() =>
            context.onTypeClick(renderInfo.resolved, renderInfo.name)
          }
          title={locale.circularRef(renderInfo.name, renderInfo.sourceHint)}
        >
          {renderInfo.name}
        </ClickableTypeName>
      );

    case RENDER_TYPE.ENUM:
      return renderInfo.values.map((val: string, idx: number) => (
        <React.Fragment key={idx}>
          {idx > 0 && <Punctuation> | </Punctuation>}
          <StringLiteral>{val}</StringLiteral>
        </React.Fragment>
      ));

    case RENDER_TYPE.FUNCTION:
      return renderFunctionType(renderInfo, context);

    case RENDER_TYPE.UNION:
      return renderInfo.types.map((ut: TypeInfo, idx: number) => (
        <React.Fragment key={idx}>
          {idx > 0 && <Punctuation> | </Punctuation>}
          {renderTypeText(ut, context)}
        </React.Fragment>
      ));

    case RENDER_TYPE.ARRAY:
      return (
        <>
          {renderInfo.needsParens ? <Punctuation>(</Punctuation> : null}
          {renderTypeText(renderInfo.elementType, context)}
          {renderInfo.needsParens ? <Punctuation>)</Punctuation> : null}
          <Punctuation>[]</Punctuation>
        </>
      );

    case RENDER_TYPE.TUPLE: {
      if (
        renderInfo.type === RENDER_TYPE.TUPLE &&
        renderInfo.elements &&
        renderInfo.elements.length > 0
      ) {
        return (
          <>
            <Punctuation>[</Punctuation>
            {renderInfo.elements.map((element: TypeInfo, idx: number) => (
              <React.Fragment key={idx}>
                {idx > 0 && <Punctuation>, </Punctuation>}
                {renderTypeText(element, context)}
              </React.Fragment>
            ))}
            <Punctuation>]</Punctuation>
          </>
        );
      }
      return <TypeName>{renderInfo.text}</TypeName>;
    }

    case RENDER_TYPE.OBJECT: {
      const isExpandable = renderInfo.expandable;
      const isGeneric = reader.isGenericType(typeInfo);

      if (isExpandable) {
        return (
          <ClickableTypeName
            onClick={() =>
              context.onTypeClick(renderInfo.resolved, renderInfo.name)
            }
            title={
              isGeneric
                ? locale.genericExpandable(renderInfo.name)
                : locale.clickToViewType
            }
          >
            {renderInfo.name}
          </ClickableTypeName>
        );
      }

      if (isGeneric) {
        return (
          <TypeName title={locale.genericCannotExpand(renderInfo.name)}>
            {renderInfo.name}
          </TypeName>
        );
      }

      return <TypeName>{renderInfo.name}</TypeName>;
    }

    case RENDER_TYPE.CUSTOM_EXPANDABLE:
      return (
        <ClickableTypeName
          onClick={() =>
            context.onTypeClick(renderInfo.resolved, renderInfo.name)
          }
          title={locale.clickToViewType}
        >
          {renderInfo.text}
        </ClickableTypeName>
      );

    case RENDER_TYPE.PRIMITIVE:
      return <TypeName>{renderInfo.text}</TypeName>;

    case RENDER_TYPE.DEFAULT:
      return <TypeName>{renderInfo.text}</TypeName>;
  }
}
