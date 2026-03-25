/**
 * TypeDocEditorPanel 组件单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { OutputResult } from '../../../shared/types';
import { en } from '../../shared/locale';

vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value }: { value?: string }) => (
    <div data-testid="codemirror-editor">
      <pre>{value}</pre>
    </div>
  ),
}));

vi.mock('../../panel/TypeDocPanel', () => ({
  default: () => null,
}));

const mockData: OutputResult = {
  generatedAt: '2026-03-23T00:00:00.000Z',
  keys: {
    Button: {
      kind: 'object',
      text: 'Button',
      properties: {
        size: {
          kind: 'union',
          text: '"small" | "large"',
        },
        disabled: {
          kind: 'primitive',
          text: 'boolean',
        },
      },
    },
  },
  typeRegistry: {},
};

const genericMockData: OutputResult = {
  generatedAt: '2026-03-23T00:00:00.000Z',
  keys: {
    Response: {
      kind: 'object',
      text: 'Response<T, Error>',
      name: 'Response<T = unknown, E = Error>',
      isGeneric: true,
      properties: {
        data: {
          kind: 'object',
          text: '{ id: string }',
          properties: {
            id: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
          },
        },
        error: {
          kind: 'object',
          text: '{ code: number }',
          properties: {
            code: {
              kind: 'primitive',
              text: 'number',
              required: true,
            },
          },
        },
      },
    },
  },
  typeRegistry: {},
};

describe('TypeDocEditorPanel', () => {
  it('should render empty state when data is null', async () => {
    const { TypeDocEditorPanel } = await import('../TypeDocEditorPanel');

    const { getByText } = render(
      <TypeDocEditorPanel typeKey="Button" data={null} />,
    );

    expect(getByText(en.dataNotLoaded)).toBeTruthy();
  });

  it('should render empty state when typeKey not found', async () => {
    const { TypeDocEditorPanel } = await import('../TypeDocEditorPanel');

    const { getByText } = render(
      <TypeDocEditorPanel typeKey="NonExistent" data={mockData} />,
    );

    expect(getByText(en.typeNotFound('NonExistent'))).toBeTruthy();
  });

  it('should render CodeMirror editor with correct code', async () => {
    const { TypeDocEditorPanel } = await import('../TypeDocEditorPanel');

    const { getByTestId } = render(
      <TypeDocEditorPanel typeKey="Button" data={mockData} />,
    );

    const editor = getByTestId('codemirror-editor');
    expect(editor).toBeTruthy();

    const codeContent = editor.textContent || '';
    expect(codeContent).toContain('interface Button');
    expect(codeContent).toContain('size');
    expect(codeContent).toContain('disabled');
  });

  it('should render legacy generic declaration heads in editor code', async () => {
    const { TypeDocEditorPanel } = await import('../TypeDocEditorPanel');

    const { getByTestId } = render(
      <TypeDocEditorPanel typeKey="Response" data={genericMockData} />,
    );

    const editor = getByTestId('codemirror-editor');
    const codeContent = editor.textContent || '';

    expect(codeContent).toContain(
      'interface Response<T = unknown, E = Error> {',
    );
  });

  it('should display panel title with type name', async () => {
    const { TypeDocEditorPanel } = await import('../TypeDocEditorPanel');

    const { getByText } = render(
      <TypeDocEditorPanel
        typeKey="Button"
        titlePrefix="Component"
        data={mockData}
      />,
    );

    expect(
      getByText(`Component - Button — ${en.propertiesCount(2)}`),
    ).toBeTruthy();
  });

  it('should not display breadcrumbs at root level', async () => {
    const { TypeDocEditorPanel } = await import('../TypeDocEditorPanel');

    const { queryByText } = render(
      <TypeDocEditorPanel typeKey="Button" data={mockData} />,
    );

    const breadcrumbSeparator = queryByText('›');
    expect(breadcrumbSeparator).toBeNull();
  });
});
