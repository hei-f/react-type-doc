import React, { useMemo } from 'react';
import type { ComponentDoc } from 'react-docgen-typescript';
import {
  TypeDocPanelContainer,
  PanelHeader,
  PanelTitle,
  CodeContainer,
  CodeContent,
  CodeLine,
  Comment,
  EmptyState,
  Indent,
  Keyword,
  PropertyName,
  Punctuation,
  TypeName,
  OptionalMark,
} from '../TypeDocPanel/styled';

interface ReactDocgenTsViewerProps {
  /** 类型 key（对应组件名称） */
  typeKey: string;
  /** 标题前缀（可选） */
  titlePrefix?: string;
  /** react-docgen-typescript 数据 */
  data: ComponentDoc[];
}

interface PropInfo {
  name: string;
  required: boolean;
  type: { name: string; raw?: string };
  description?: string;
  defaultValue?: { value: string };
}

/**
 * React Docgen TypeScript 查看器
 * 展示 react-docgen-typescript 生成的类型信息
 */
const ReactDocgenTsViewer: React.FC<ReactDocgenTsViewerProps> = (props) => {
  const { typeKey, titlePrefix, data } = props;

  const componentInfo = useMemo(() => {
    if (!data || !Array.isArray(data)) return null;

    return data.find(
      (item) => item.displayName === typeKey || item.displayName === typeKey,
    );
  }, [data, typeKey]);

  const rootTitle = titlePrefix ? `${titlePrefix} - ${typeKey}` : typeKey;

  if (!data || !Array.isArray(data)) {
    return (
      <TypeDocPanelContainer>
        <PanelHeader>
          <PanelTitle>{rootTitle}</PanelTitle>
        </PanelHeader>
        <EmptyState>react-docgen-typescript 数据未加载</EmptyState>
      </TypeDocPanelContainer>
    );
  }

  if (!componentInfo) {
    return (
      <TypeDocPanelContainer>
        <PanelHeader>
          <PanelTitle>{rootTitle}</PanelTitle>
        </PanelHeader>
        <EmptyState>未找到组件 {typeKey} 的文档（仅支持组件 Props）</EmptyState>
      </TypeDocPanelContainer>
    );
  }

  const componentProps = componentInfo.props || {};
  const propEntries = Object.entries(componentProps) as [string, PropInfo][];

  if (propEntries.length === 0) {
    return (
      <TypeDocPanelContainer>
        <PanelHeader>
          <PanelTitle>{rootTitle} — 0 properties</PanelTitle>
        </PanelHeader>
        <EmptyState>该组件没有 Props 定义</EmptyState>
      </TypeDocPanelContainer>
    );
  }

  return (
    <TypeDocPanelContainer>
      <PanelHeader>
        <PanelTitle>
          {rootTitle} — {propEntries.length} properties
        </PanelTitle>
      </PanelHeader>

      <CodeContainer>
        <CodeContent>
          <CodeLine>
            <Keyword>interface</Keyword>
            <TypeName> {typeKey} </TypeName>
            <Punctuation>{'{'}</Punctuation>
          </CodeLine>

          {propEntries.map(([propName, propInfo]) => {
            const isOptional = !propInfo.required;
            const hasDescription = Boolean(propInfo.description);
            const typeName =
              propInfo.type?.raw || propInfo.type?.name || 'unknown';

            return (
              <CodeLine key={propName}>
                <Indent $level={1} />
                {hasDescription && (
                  <>
                    <Comment>{`/** ${propInfo.description} */`}</Comment>
                    <br />
                    <Indent $level={1} />
                  </>
                )}
                <PropertyName>{propName}</PropertyName>
                {isOptional && <OptionalMark>?</OptionalMark>}
                <Punctuation>: </Punctuation>
                <TypeName>{typeName}</TypeName>
                <Punctuation>;</Punctuation>
              </CodeLine>
            );
          })}

          <CodeLine>
            <Punctuation>{'}'}</Punctuation>
          </CodeLine>
        </CodeContent>
      </CodeContainer>
    </TypeDocPanelContainer>
  );
};

export default ReactDocgenTsViewer;
