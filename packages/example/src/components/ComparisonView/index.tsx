import React, { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import type { OutputResult, TypeInfo } from 'react-type-doc';
import type { ComponentDoc } from 'react-docgen-typescript';
import {
  ComparisonContainer,
  ComparisonGrid,
  ToolColumn,
  ToolHeader,
  ToolName,
  FileSize,
  EditorContainer,
  EmptyState,
  HighlightLabel,
} from './styled';

interface ComparisonViewProps {
  /** 当前选中的类型 key */
  typeKey: string;
  /** react-type-doc 数据 */
  reactTypeDocData: OutputResult;
  /** react-docgen-typescript 数据 */
  reactDocgenTsData: ComponentDoc[];
}

/**
 * 从 react-type-doc 数据中提取指定类型的数据
 */
function extractReactTypeDocData(data: OutputResult, typeKey: string) {
  const typeInfo = data.keys[typeKey];
  if (!typeInfo) return null;

  // 递归收集相关类型
  const relatedTypes: Record<string, TypeInfo> = {};
  const visited = new Set<string>();

  function collectRelatedTypes(typeData: TypeInfo): void {
    if (!typeData || typeof typeData !== 'object') return;

    // 处理类型引用
    if ('ref' in typeData && typeof typeData.ref === 'string') {
      if (!visited.has(typeData.ref)) {
        visited.add(typeData.ref);
        const refType = data.typeRegistry[typeData.ref];
        if (refType) {
          relatedTypes[typeData.ref] = refType;
          collectRelatedTypes(refType);
        }
      }
      return; // TypeRef 只有 ref 字段，无需继续处理其他属性
    }

    // 以下属性只在 FullTypeInfo 中存在
    if ('properties' in typeData && typeData.properties) {
      Object.values(typeData.properties).forEach((prop) =>
        collectRelatedTypes(prop),
      );
    }

    if ('unionTypes' in typeData && typeData.unionTypes) {
      typeData.unionTypes.forEach((type: TypeInfo) =>
        collectRelatedTypes(type),
      );
    }

    if ('elementType' in typeData && typeData.elementType) {
      collectRelatedTypes(typeData.elementType);
    }
  }

  collectRelatedTypes(typeInfo);

  return {
    mainType: typeInfo,
    relatedTypes:
      Object.keys(relatedTypes).length > 0 ? relatedTypes : undefined,
  };
}

/**
 * 从 react-docgen-typescript 数据中提取指定类型的数据
 */
function extractReactDocgenTsData(
  data: ComponentDoc[],
  typeKey: string,
): ComponentDoc | null {
  if (!data || !Array.isArray(data)) return null;

  const component = data.find(
    (item) => item.displayName === typeKey || item.displayName === typeKey,
  );

  return component || null;
}

/**
 * 计算 JSON 字符串的大小
 */
function getDataSize(data: unknown): string {
  if (!data) return '0 B';
  const str = JSON.stringify(data, null, 2);
  const bytes = new Blob([str]).size;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ComparisonView: React.FC<ComparisonViewProps> = (props) => {
  const { typeKey, reactTypeDocData, reactDocgenTsData } = props;

  const comparisonData = useMemo(() => {
    const rtdData = extractReactTypeDocData(reactTypeDocData, typeKey);
    const rdtData = extractReactDocgenTsData(reactDocgenTsData, typeKey);

    return {
      reactTypeDoc: {
        data: rtdData,
        size: getDataSize(rtdData),
        available: !!rtdData,
      },
      reactDocgenTs: {
        data: rdtData,
        size: getDataSize(rdtData),
        available: !!rdtData,
      },
    };
  }, [typeKey, reactTypeDocData, reactDocgenTsData]);

  return (
    <ComparisonContainer>
      <ComparisonGrid>
        {/* react-type-doc */}
        <ToolColumn>
          <ToolHeader>
            <ToolName $highlight>
              react-type-doc
              <HighlightLabel>✨ 本工具</HighlightLabel>
            </ToolName>
            <FileSize>{comparisonData.reactTypeDoc.size}</FileSize>
          </ToolHeader>
          {comparisonData.reactTypeDoc.available ? (
            <EditorContainer>
              <Editor
                height="600px"
                defaultLanguage="json"
                value={JSON.stringify(
                  comparisonData.reactTypeDoc.data,
                  null,
                  2,
                )}
                theme="vs-light"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 16,
                  wordWrap: 'on',
                  wrappingIndent: 'indent',
                  automaticLayout: true,
                  lineNumbers: 'on',
                  folding: true,
                  glyphMargin: false,
                }}
                loading={
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#57606a',
                    }}
                  >
                    加载编辑器中...
                  </div>
                }
              />
            </EditorContainer>
          ) : (
            <EmptyState>该类型无数据</EmptyState>
          )}
        </ToolColumn>

        {/* react-docgen-typescript */}
        <ToolColumn>
          <ToolHeader>
            <ToolName>react-docgen-typescript</ToolName>
            <FileSize>{comparisonData.reactDocgenTs.size}</FileSize>
          </ToolHeader>
          {comparisonData.reactDocgenTs.available ? (
            <EditorContainer>
              <Editor
                height="600px"
                defaultLanguage="json"
                value={JSON.stringify(
                  comparisonData.reactDocgenTs.data,
                  null,
                  2,
                )}
                theme="vs-light"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 16,
                  wordWrap: 'on',
                  wrappingIndent: 'indent',
                  automaticLayout: true,
                  lineNumbers: 'on',
                  folding: true,
                  glyphMargin: false,
                }}
                loading={
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#57606a',
                    }}
                  >
                    加载编辑器中...
                  </div>
                }
              />
            </EditorContainer>
          ) : (
            <EmptyState>该类型无数据（仅支持组件 Props）</EmptyState>
          )}
        </ToolColumn>
      </ComparisonGrid>
    </ComparisonContainer>
  );
};

export default ComparisonView;
