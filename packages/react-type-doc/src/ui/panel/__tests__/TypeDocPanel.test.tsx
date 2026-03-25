/**
 * TypeDocPanel 组件集成测试
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OutputResult } from '../../../shared/types';
import TypeDocPanel from '../TypeDocPanel';

const mockData: OutputResult = {
  generatedAt: '2026-03-23T00:00:00.000Z',
  keys: {
    Result: {
      kind: 'union',
      text: 'Result',
      description: '@param value Root summary\nSee https://example.com',
      unionTypes: [{ $ref: 'Success' }, { $ref: 'Error' }],
    },
  },
  typeRegistry: {
    Success: {
      kind: 'object',
      text: 'Success',
      description: 'Success details',
      properties: {
        owner: {
          $ref: 'User',
          description: 'Owner reference',
        },
        config: {
          kind: 'object',
          text: '{ id: string; label: string }',
          name: '{ id, label }',
          description: 'Inline config',
          required: true,
          properties: {
            id: { kind: 'primitive', text: 'string', required: true },
            label: { kind: 'primitive', text: 'string', required: true },
          },
        },
        items: {
          kind: 'array',
          text: 'string[]',
          description: 'List of items',
          required: true,
          elementType: {
            kind: 'primitive',
            text: 'string',
          },
        },
      },
    },
    Error: {
      kind: 'object',
      text: 'Error',
      properties: {
        message: {
          kind: 'primitive',
          text: 'string',
          required: true,
        },
      },
    },
    User: {
      kind: 'object',
      text: 'User',
      properties: {
        name: {
          kind: 'primitive',
          text: 'string',
          required: true,
        },
      },
    },
  },
};

const genericMockData: OutputResult = {
  generatedAt: '2026-03-23T00:00:00.000Z',
  keys: {
    Response: {
      kind: 'object',
      text: 'Response<{ id: string }, { code: number }>',
      genericParameters: [
        { name: 'T', default: 'unknown' },
        { name: 'E', default: 'Error' },
      ],
      properties: {
        data: {
          kind: 'object',
          text: '{ id: string }',
          properties: {
            id: { kind: 'primitive', text: 'string', required: true },
          },
        },
        error: {
          kind: 'object',
          text: '{ code: number }',
          properties: {
            code: { kind: 'primitive', text: 'number', required: true },
          },
        },
      },
    },
  },
  typeRegistry: {},
};

describe('TypeDocPanel', () => {
  it('should render union view and nested object details', () => {
    render(<TypeDocPanel typeKey="Result" data={mockData} />);

    expect(screen.getByText('@param')).toBeTruthy();
    expect(screen.getByText(/Root summary/)).toBeTruthy();
    expect(screen.getByText(/https:\/\/example\.com/)).toBeTruthy();
    expect(screen.getByText('Success')).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();

    fireEvent.click(screen.getByText('Success'));

    expect(
      screen.getByText(
        (_, element) => element?.textContent?.trim() === 'interface Success {',
      ),
    ).toBeTruthy();
    expect(screen.getByText(/Owner reference/)).toBeTruthy();
    expect(screen.getByText(/Inline config/)).toBeTruthy();
    expect(screen.getByText(/List of items/)).toBeTruthy();
    expect(screen.getByText('User')).toBeTruthy();

    fireEvent.click(screen.getByText('User'));

    expect(
      screen.getByText(
        (_, element) => element?.textContent?.trim() === 'interface User {',
      ),
    ).toBeTruthy();
    expect(screen.getByText(/name/)).toBeTruthy();
  });

  it('should render structured generic declaration heads', () => {
    render(<TypeDocPanel typeKey="Response" data={genericMockData} />);

    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent?.trim() ===
          'interface Response<T = unknown, E = Error> {',
      ),
    ).toBeTruthy();
  });
});
