import type {
  FunctionParameter,
  FunctionSignature,
  OutputResult,
  TypeInfo,
  RenderHint,
} from 'react-type-doc';
import { RENDER_HINT } from 'react-type-doc';
import { PropsDocReader, RENDER_TYPE } from 'react-type-doc/runtime';
import type { TypeRenderInfo } from 'react-type-doc/runtime';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BreadcrumbContainer,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbWrapper,
  ClickableTypeName,
  CodeContainer,
  CodeContent,
  CodeLine,
  Comment,
  EmptyState,
  Indent,
  Keyword,
  OptionalMark,
  PanelHeader,
  PanelTitle,
  PropertyName,
  TypeDocPanelContainer,
  Punctuation,
  SourceLocation,
  StringLiteral,
  TypeName,
} from './styled';

/**
 * RenderHint 到 Tooltip 标题的映射关系
 */
const RENDER_HINT_TITLES: Record<RenderHint, string> = {
  [RENDER_HINT.Builtin]: 'TypeScript 内置类型',
  [RENDER_HINT.IndexAccess]: '索引访问类型，因类型擦除无法在定义时展开',
  [RENDER_HINT.External]: '外部库类型，不展开详情',
  [RENDER_HINT.Circular]: '循环引用',
  [RENDER_HINT.Truncated]: '已达到最大解析深度',
  [RENDER_HINT.Generic]: '包含未实例化的泛型参数',
};

interface TypeDocPanelProps {
  /** 类型 key（对应 JSON 中的 keys） */
  typeKey: string;
  /** 标题前缀（可选，会显示在类型名称前） */
  titlePrefix?: string;
  /** 类型文档数据 */
  typeDocData: OutputResult | null;
}

/** 历史栈项 */
interface HistoryItem {
  typeInfo: TypeInfo;
  title: string;
}

/** 类型渲染上下文 */
interface TypeRenderContext {
  onTypeClick: (
    typeInfo: TypeInfo,
    typeName: string,
    fieldName?: string,
  ) => void;
  reader: PropsDocReader;
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

  // 如果有多个签名（函数重载），渲染所有签名
  if (signatures.length > 1) {
    return signatures.map((sig: FunctionSignature, idx: number) => (
      <React.Fragment key={idx}>
        {idx > 0 && <Punctuation> & </Punctuation>}
        {renderFunctionSignature(sig, context)}
      </React.Fragment>
    ));
  }

  // 单个签名
  return renderFunctionSignature(signatures[0], context);
}

/**
 * 渲染类型文本
 */
function renderTypeText(
  typeInfo: TypeInfo,
  context: TypeRenderContext,
): React.ReactNode {
  const { reader } = context;
  const renderInfo = reader.getTypeRenderInfo(typeInfo);

  switch (renderInfo.type) {
    case RENDER_TYPE.EXTERNAL: {
      // 使用映射常量获取 tooltip
      const resolved = reader.resolveRef(typeInfo);
      const title = resolved.renderHint
        ? RENDER_HINT_TITLES[resolved.renderHint]
        : '外部库类型，不展开详情';

      return <TypeName title={title}>{renderInfo.name}</TypeName>;
    }

    case RENDER_TYPE.CIRCULAR:
      return (
        <ClickableTypeName
          onClick={() =>
            context.onTypeClick(renderInfo.resolved, renderInfo.name)
          }
          title={`循环引用: ${renderInfo.name}${
            renderInfo.sourceHint ? ` (${renderInfo.sourceHint})` : ''
          }`}
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
          {renderInfo.needsParens && <Punctuation>(</Punctuation>}
          {renderTypeText(renderInfo.elementType, context)}
          {renderInfo.needsParens && <Punctuation>)</Punctuation>}
          <Punctuation>[]</Punctuation>
        </>
      );

    case RENDER_TYPE.TUPLE: {
      // 如果元组有元素类型，渲染每个元素（类似联合类型）
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
      // 没有元素类型信息时，显示文本
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
                ? `${renderInfo.name} 包含未实例化的类型参数 - 点击查看结构`
                : '点击查看类型定义'
            }
          >
            {renderInfo.name}
          </ClickableTypeName>
        );
      }

      if (isGeneric) {
        return (
          <TypeName
            title={`${renderInfo.name} 包含未实例化的类型参数，无法在定义时展开`}
          >
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
          title="点击查看类型定义"
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

/**
 * 渲染联合类型视图
 */
function renderUnionTypeView(
  typeName: string,
  typeInfo: TypeInfo,
  context: TypeRenderContext,
): React.ReactNode {
  const resolved = context.reader.resolveRef(typeInfo);
  const unionTypes = resolved.unionTypes ?? [];

  return (
    <CodeContainer>
      <CodeContent>
        <CodeLine>
          <Keyword>type</Keyword>
          <TypeName> {typeName} </TypeName>
          <Punctuation>= </Punctuation>
        </CodeLine>

        {unionTypes.map((unionMember: TypeInfo, idx: number) => {
          const resolvedMember = context.reader.resolveRef(unionMember);
          const displayName = context.reader.getDisplayName(
            resolvedMember,
            `成员${idx + 1}`,
          );
          const isExpandable = context.reader.isExpandable(unionMember);

          return (
            <CodeLine key={idx}>
              <Indent $level={1} />
              <Punctuation>| </Punctuation>
              {isExpandable ? (
                <ClickableTypeName
                  onClick={() => context.onTypeClick(unionMember, displayName)}
                  title="点击查看详情"
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
function renderPropertyLine(
  propName: string,
  propInfo: TypeInfo,
  context: TypeRenderContext,
  indentLevel: number = 1,
): React.ReactNode {
  const resolved = context.reader.resolveRef(propInfo);

  const isOptional = !resolved.required;
  const hasDescription = Boolean(resolved.description);

  // 创建带字段名上下文的新 context
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
          <Comment>{`/** ${resolved.description} */`}</Comment>
          <br />
          <Indent $level={indentLevel} />
        </>
      )}
      <PropertyName>{propName}</PropertyName>
      {isOptional && <OptionalMark>?</OptionalMark>}
      <Punctuation>: </Punctuation>
      {renderTypeText(propInfo, contextWithField)}
      <Punctuation>;</Punctuation>
    </CodeLine>
  );
}

/**
 * 类型文档展示面板（代码编辑器风格）
 * 支持点击类型原地展开详情，通过面包屑导航返回
 */
const TypeDocPanel: React.FC<TypeDocPanelProps> = (props) => {
  const { typeKey, titlePrefix, typeDocData } = props;

  /** 导航历史栈 */
  const [historyStack, setHistoryStack] = useState<HistoryItem[]>([]);

  /** 当 typeKey 或数据源变化时重置历史栈 */
  useEffect(() => {
    setHistoryStack([]);
  }, [typeKey, typeDocData]);

  /** 获取 reader 实例 */
  const reader = useMemo(() => {
    // 优先使用单例，如果单例不存在且有数据则初始化单例
    return PropsDocReader.getInstance(typeDocData ?? undefined);
  }, [typeDocData]);

  /** 根类型标题 */
  const rootTitle = titlePrefix ? `${titlePrefix} - ${typeKey}` : typeKey;

  /** 当前显示的类型信息 */
  const currentTypeInfo = useMemo(() => {
    if (historyStack.length > 0) {
      return historyStack[historyStack.length - 1].typeInfo;
    }
    return null;
  }, [historyStack]);

  /** 当前标题 */
  const currentTitle = useMemo(() => {
    if (historyStack.length > 0) {
      return historyStack[historyStack.length - 1].title;
    }
    return rootTitle;
  }, [historyStack, rootTitle]);

  /** 是否处于嵌套类型查看状态 */
  const isInNestedView = historyStack.length > 0;

  /** 处理类型点击 - 导航到子类型 */
  const handleTypeClick = useCallback(
    (typeInfo: TypeInfo, typeName: string, fieldName?: string) => {
      if (!reader) return;

      const target = reader.getNavigationTarget(typeInfo, typeName);
      if (target) {
        let displayTitle = target.name;

        // 如果是匿名对象且有字段名，添加字段名前缀
        if (target.name === '[匿名对象]' && fieldName) {
          displayTitle = `.${fieldName}[匿名对象]`;
        }

        setHistoryStack((prev) => [
          ...prev,
          { typeInfo: target.typeInfo, title: displayTitle },
        ]);
      }
    },
    [reader],
  );

  /** 导航到指定层级 */
  const navigateToLevel = useCallback((level: number) => {
    if (level < 0) {
      // 返回根节点
      setHistoryStack([]);
    } else {
      // 截断到指定层级
      setHistoryStack((prev) => prev.slice(0, level + 1));
    }
  }, []);

  if (!typeDocData || !reader) {
    return (
      <TypeDocPanelContainer>
        <EmptyState>类型文档数据未加载</EmptyState>
      </TypeDocPanelContainer>
    );
  }

  const typeInfo = reader.getRaw(typeKey);

  if (!typeInfo) {
    return (
      <TypeDocPanelContainer>
        <EmptyState>未找到类型 {typeKey} 的文档</EmptyState>
      </TypeDocPanelContainer>
    );
  }

  const resolved = reader.resolveRef(typeInfo);

  const context: TypeRenderContext = {
    onTypeClick: handleTypeClick,
    reader,
  };

  // 检测是否为联合类型（仅在根视图）
  if (resolved.kind === 'union' && !isInNestedView) {
    return (
      <TypeDocPanelContainer>
        <PanelHeader>
          <PanelTitle>{rootTitle}</PanelTitle>
        </PanelHeader>
        {renderUnionTypeView(typeKey, typeInfo, context)}
      </TypeDocPanelContainer>
    );
  }

  // 解析当前显示的类型（需要在空状态检查之前，以判断嵌套联合类型）
  const resolvedCurrentType = currentTypeInfo
    ? reader.resolveRef(currentTypeInfo)
    : null;
  const isNestedUnion =
    isInNestedView && resolvedCurrentType?.kind === 'union';

  const propEntries = reader.getPropertyEntries(
    isInNestedView ? currentTypeInfo! : typeInfo,
  );

  if (propEntries.length === 0 && resolved.kind !== 'union' && !isNestedUnion) {
    return (
      <TypeDocPanelContainer>
        <PanelHeader>
          <PanelTitle>{rootTitle} — 0 properties</PanelTitle>
        </PanelHeader>
        <EmptyState>该类型没有属性定义</EmptyState>
      </TypeDocPanelContainer>
    );
  }

  const currentPropEntries = currentTypeInfo
    ? reader.getPropertyEntries(currentTypeInfo)
    : [];

  const displayTypeName = resolvedCurrentType
    ? reader.getDisplayName(resolvedCurrentType, currentTitle)
    : currentTitle;

  return (
    <TypeDocPanelContainer>
      <PanelHeader>
        <PanelTitle>
          {isInNestedView
            ? isNestedUnion
              ? displayTypeName
              : `${displayTypeName} — ${currentPropEntries.length} properties`
            : `${rootTitle} — ${propEntries.length} properties`}
        </PanelTitle>
      </PanelHeader>

      {/* 面包屑导航区域 */}
      <BreadcrumbWrapper $visible={isInNestedView}>
        <BreadcrumbContainer>
          <BreadcrumbItem $clickable onClick={() => navigateToLevel(-1)}>
            {rootTitle}
          </BreadcrumbItem>
          {historyStack.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbSeparator>›</BreadcrumbSeparator>
              <BreadcrumbItem
                $clickable={index < historyStack.length - 1}
                onClick={() => {
                  if (index < historyStack.length - 1) {
                    navigateToLevel(index);
                  }
                }}
              >
                {item.title}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbContainer>
      </BreadcrumbWrapper>

      <CodeContainer>
        <CodeContent>
          {isInNestedView ? (
            isNestedUnion ? (
              renderUnionTypeView(
                displayTypeName,
                currentTypeInfo!,
                context,
              )
            ) : (
              <>
                <CodeLine>
                  <Keyword>interface</Keyword>
                  <TypeName> {displayTypeName} </TypeName>
                  <Punctuation>{'{'}</Punctuation>
                </CodeLine>

                {currentPropEntries.length > 0 ? (
                  currentPropEntries.map(([propName, propInfo]: [string, TypeInfo]) =>
                    renderPropertyLine(propName, propInfo, context),
                  )
                ) : (
                  <CodeLine>
                    <Indent $level={1} />
                    <Comment>{'// 该类型没有可展开的属性'}</Comment>
                  </CodeLine>
                )}

                <CodeLine>
                  <Punctuation>{'}'}</Punctuation>
                </CodeLine>
              </>
            )
          ) : (
            // 根类型视图
            <>
              <CodeLine>
                <Keyword>interface</Keyword>
                <TypeName> {typeKey} </TypeName>
                <Punctuation>{'{'}</Punctuation>
              </CodeLine>

              {propEntries.map(([propName, propInfo]: [string, TypeInfo]) =>
                renderPropertyLine(propName, propInfo, context),
              )}

              <CodeLine>
                <Punctuation>{'}'}</Punctuation>
              </CodeLine>
            </>
          )}
        </CodeContent>

        {/* 源码位置 */}
        {isInNestedView && resolvedCurrentType?.sourceFile && (
          <SourceLocation>
            📍 {resolvedCurrentType.sourceFile}
            {resolvedCurrentType.sourceLine
              ? `:${resolvedCurrentType.sourceLine}`
              : ''}
          </SourceLocation>
        )}
      </CodeContainer>
    </TypeDocPanelContainer>
  );
};

export default TypeDocPanel;
