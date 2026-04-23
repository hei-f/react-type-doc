import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OutputResult } from '../../../../shared/types';
import { en } from '../../../shared/locale';
import { useTypeNavigation } from '../useTypeNavigation';

const baseData: OutputResult = {
  generatedAt: '2026-03-23T00:00:00.000Z',
  keys: {
    Parent: {
      kind: 'object',
      text: 'Parent',
      properties: {
        child: {
          kind: 'object',
          text: '{ id: string }',
          name: '{ id }',
          required: true,
          properties: {
            grandchild: {
              kind: 'object',
              text: '{ value: number }',
              name: '{ value }',
              required: true,
              properties: {
                value: {
                  kind: 'primitive',
                  text: 'number',
                  required: true,
                },
              },
            },
          },
        },
      },
    },
  },
  typeRegistry: {},
};

describe('useTypeNavigation', () => {
  it('should reset nested history and render anonymous object titles', () => {
    const { result, rerender } = renderHook(
      ({ typeKey, data }) => useTypeNavigation(typeKey, 'Component', data, en),
      {
        initialProps: {
          typeKey: 'Parent',
          data: baseData,
        },
      },
    );

    expect(result.current.currentTitle).toBe('Component - Parent');

    const parentType = result.current.reader?.getRaw('Parent');
    const childType =
      parentType && 'properties' in parentType
        ? parentType.properties?.child
        : undefined;
    if (!childType) {
      throw new Error('Expected child type to exist');
    }

    act(() => {
      result.current.handleTypeClick(childType, '{ id }', 'child');
    });

    expect(result.current.historyStack).toHaveLength(1);
    expect(result.current.currentTitle).toBe('.child { id }');

    act(() => {
      const rawParent = result.current.reader?.getRaw('Parent');
      const childFrame =
        rawParent && 'properties' in rawParent
          ? rawParent.properties?.child
          : undefined;
      const grandchildType =
        childFrame && 'properties' in childFrame
          ? childFrame.properties?.grandchild
          : undefined;
      if (!grandchildType) {
        throw new Error('Expected grandchild type to exist');
      }

      result.current.handleTypeClick(grandchildType, '{ value }', 'grandchild');
    });

    expect(result.current.historyStack).toHaveLength(2);
    expect(result.current.currentTitle).toBe('.grandchild { value }');

    act(() => {
      result.current.navigateToLevel(0);
    });

    expect(result.current.historyStack).toHaveLength(1);
    expect(result.current.currentTitle).toBe('.child { id }');

    const nextData: OutputResult = {
      ...baseData,
      generatedAt: '2026-03-24T00:00:00.000Z',
    };

    act(() => {
      rerender({
        typeKey: 'Parent',
        data: nextData,
      });
    });

    expect(result.current.historyStack).toHaveLength(0);
    expect(result.current.currentTitle).toBe('Component - Parent');
  });
});
