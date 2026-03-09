import styled from 'styled-components';

export const ComparisonContainer = styled.div`
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
`;

export const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const ToolColumn = styled.div`
  background: #f6f8fa;
  border-radius: 8px;
  border: 1px solid #d0d7de;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const ToolHeader = styled.div`
  background: #ffffff;
  padding: 12px 16px;
  border-bottom: 1px solid #d0d7de;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ToolName = styled.div<{ $highlight?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.$highlight ? '#0969da' : '#24292f')};
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const HighlightLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  background: linear-gradient(135deg, #0969da 0%, #54aeff 100%);
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
`;

export const FileSize = styled.div`
  font-size: 12px;
  color: #57606a;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
`;

export const EditorContainer = styled.div`
  flex: 1;
  overflow: hidden;
  background: #ffffff;

  .monaco-editor {
    padding: 8px 0;
  }

  .monaco-editor .overflow-guard {
    border-radius: 0 0 8px 8px;
  }
`;

export const EmptyState = styled.div`
  padding: 48px 16px;
  text-align: center;
  color: #57606a;
  font-size: 14px;
  background: #ffffff;
`;
