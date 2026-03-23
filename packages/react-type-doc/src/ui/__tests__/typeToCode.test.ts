/**
 * typeToCode 函数单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  typeInfoToCode,
  typeInfoToCodeWithMeta,
  getClickableRanges,
  simplifyOptionalTupleMemberSyntax,
} from '../typeToCode';
import { PropsDocReader } from '../../runtime/reader';
import type { OutputResult, TypeInfo } from '../../shared/types';

describe('typeInfoToCode', () => {
  it('should convert simple object type to interface code', () => {
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
              unionTypes: [
                { kind: 'primitive', text: '"small"' },
                { kind: 'primitive', text: '"large"' },
              ],
              required: true,
            },
            disabled: {
              kind: 'primitive',
              text: 'boolean',
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Button')!;
    const code = typeInfoToCode(typeInfo, reader, 'Button');

    expect(code).toContain('interface Button {');
    expect(code).toContain('size:');
    expect(code).toContain('disabled: boolean;');
    expect(code).toContain('}');
  });

  it('should handle optional properties with ? mark', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            required: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
            optional: {
              kind: 'primitive',
              text: 'number',
              required: false,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('required: string;');
    expect(code).toContain('optional?: number;');
  });

  it('should handle union types at root level', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Status: {
          kind: 'union',
          text: '"success" | "error" | "loading"',
          unionTypes: [
            { kind: 'primitive', text: '"success"' },
            { kind: 'primitive', text: '"error"' },
            { kind: 'primitive', text: '"loading"' },
          ],
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Status')!;
    const code = typeInfoToCode(typeInfo, reader, 'Status');

    expect(code).toContain('type Status =');
    expect(code).toContain('|');
    expect(code).toContain('"success"');
    expect(code).toContain('"error"');
    expect(code).toContain('"loading"');
  });

  it('should handle array types', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            items: {
              kind: 'array',
              text: 'string[]',
              elementType: {
                kind: 'primitive',
                text: 'string',
              },
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('items:');
    expect(code).toContain('[]');
  });

  it('should handle inline anonymous objects', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            config: {
              kind: 'object',
              text: '{ id: string; name: string }',
              name: '{ id, name }',
              properties: {
                id: { kind: 'primitive', text: 'string', required: true },
                name: { kind: 'primitive', text: 'string', required: true },
              },
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('config:');
    expect(code).toContain('{');
    expect(code).toContain('id:');
    expect(code).toContain('name:');
    expect(code).toContain('}');
  });

  it('should preserve JSDoc comments', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            name: {
              kind: 'primitive',
              text: 'string',
              description: 'The name of the component',
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('/**');
    expect(code).toContain('The name of the component');
    expect(code).toContain('*/');
    expect(code).toContain('name:');
  });

  it('should handle empty objects', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        EmptyProps: {
          kind: 'object',
          text: 'EmptyProps',
          properties: {},
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('EmptyProps')!;
    const code = typeInfoToCode(typeInfo, reader, 'EmptyProps');

    expect(code).toContain('interface EmptyProps {');
    expect(code).toContain('// No properties');
    expect(code).toContain('}');
  });
});

describe('getClickableRanges', () => {
  it('should identify clickable type names in object properties', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            user: {
              $ref: 'User',
            },
          },
        },
      },
      typeRegistry: {
        User: {
          kind: 'object',
          text: 'User',
          properties: {
            id: { kind: 'primitive', text: 'string' },
          },
        },
      },
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');
    const ranges = getClickableRanges(code, typeInfo, reader);

    expect(ranges).toHaveLength(1);
    expect(ranges[0].typeName).toBe('User');
    expect(ranges[0].fieldName).toBe('user');
    expect(ranges[0].range.startLine).toBeGreaterThan(0);
    expect(ranges[0].range.startColumn).toBeGreaterThan(0);
  });

  it('should identify clickable type names in union types', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Result: {
          kind: 'union',
          text: 'Success | Error',
          unionTypes: [{ $ref: 'Success' }, { $ref: 'Error' }],
        },
      },
      typeRegistry: {
        Success: {
          kind: 'object',
          text: 'Success',
          properties: {
            data: { kind: 'primitive', text: 'any' },
          },
        },
        Error: {
          kind: 'object',
          text: 'Error',
          properties: {
            message: { kind: 'primitive', text: 'string' },
          },
        },
      },
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Result')!;
    const code = typeInfoToCode(typeInfo, reader, 'Result');
    const ranges = getClickableRanges(code, typeInfo, reader);

    expect(ranges.length).toBeGreaterThanOrEqual(1);
    const typeNames = ranges.map((r) => r.typeName);
    expect(typeNames.length).toBeGreaterThan(0);
  });

  it('should return empty array for primitive types', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            name: { kind: 'primitive', text: 'string' },
            age: { kind: 'primitive', text: 'number' },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');
    const ranges = getClickableRanges(code, typeInfo, reader);

    expect(ranges).toHaveLength(0);
  });

  it('should skip inline object roots and inline array elements', () => {
    const inlineObject: TypeInfo = {
      kind: 'object',
      text: '{ id: string; label: string }',
      properties: {
        id: { kind: 'primitive', text: 'string', required: true },
        label: { kind: 'primitive', text: 'string', required: true },
      },
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        InlineRoot: inlineObject,
        InlineList: {
          kind: 'object',
          text: 'InlineList',
          properties: {
            items: {
              kind: 'array',
              text: '{ id: string; label: string }[]',
              elementType: inlineObject,
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);

    const inlineRoot = reader.getRaw('InlineRoot')!;
    const inlineRootCode = typeInfoToCode(inlineRoot, reader, 'InlineRoot');
    const inlineRootRanges = getClickableRanges(
      inlineRootCode,
      inlineRoot,
      reader,
    );
    expect(inlineRootCode).toContain('interface InlineRoot {');
    expect(inlineRootRanges).toHaveLength(0);

    const inlineList = reader.getRaw('InlineList')!;
    const inlineListCode = typeInfoToCode(inlineList, reader, 'InlineList');
    const inlineListRanges = getClickableRanges(
      inlineListCode,
      inlineList,
      reader,
    );
    expect(inlineListCode).toContain('items:');
    expect(inlineListRanges).toHaveLength(0);
  });

  it('should render named union aliases with meta info', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        ApiResponse: {
          kind: 'union',
          text: 'ApiResponse',
          name: 'ApiResponse',
          description: 'Shared response alias',
          unionTypes: [
            { kind: 'primitive', text: '"ok"' },
            { kind: 'primitive', text: '"error"' },
          ],
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('ApiResponse')!;
    const { code, jsdocBlocks } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'ApiResponse',
    );

    expect(code).toContain('type ApiResponse =');
    expect(code).toContain('| "ok"');
    expect(code).toContain('| "error"');
    expect(jsdocBlocks).toHaveLength(1);
  });

  it('should simplify tuple optional member syntax', () => {
    expect(simplifyOptionalTupleMemberSyntax('[(string | undefined)?]')).toBe(
      '[string?]',
    );
    expect(simplifyOptionalTupleMemberSyntax('[(undefined | number)?]')).toBe(
      '[number?]',
    );
  });
});
