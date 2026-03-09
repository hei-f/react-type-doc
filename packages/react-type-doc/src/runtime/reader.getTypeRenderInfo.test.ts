/**
 * getTypeRenderInfo 完整测试
 * 测试运行时类型渲染信息生成的所有分支
 */

import { describe, it, expect } from 'vitest';
import { PropsDocReader, RENDER_TYPE } from './reader';
import type { OutputResult, TypeInfo, TypeCategory } from '../shared/types';

describe('PropsDocReader - getTypeRenderInfo', () => {
  describe('renderHint 优先处理', () => {
    it('应该处理 external renderHint', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        name: 'Promise',
        kind: 'object',
        text: 'Promise<T>',
        renderHint: 'external',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.EXTERNAL);
      if (renderInfo.type === RENDER_TYPE.EXTERNAL) {
        expect(renderInfo.name).toBe('Promise');
      }
    });

    it('应该处理 builtin renderHint', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        name: 'String',
        kind: 'object',
        text: 'String',
        renderHint: 'builtin',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.EXTERNAL);
      if (renderInfo.type === RENDER_TYPE.EXTERNAL) {
        expect(renderInfo.name).toBe('String');
      }
    });

    it('应该处理 index-access renderHint', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'object',
        text: 'User["id"]',
        renderHint: 'index-access',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.EXTERNAL);
    });

    it('应该处理 circular renderHint（有源码位置）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        name: 'TreeNode',
        kind: 'object',
        text: 'TreeNode',
        renderHint: 'circular',
        sourceFile: 'src/types.ts',
        sourceLine: 10,
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.CIRCULAR);
      if (renderInfo.type === RENDER_TYPE.CIRCULAR) {
        expect(renderInfo.name).toBe('TreeNode');
        expect(renderInfo.sourceHint).toBe('src/types.ts:10');
        expect(renderInfo.resolved).toBeDefined();
      }
    });

    it('应该处理 circular renderHint（无源码行号）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        name: 'TreeNode',
        kind: 'object',
        text: 'TreeNode',
        renderHint: 'circular',
        sourceFile: 'src/types.ts',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.CIRCULAR);
      if (renderInfo.type === RENDER_TYPE.CIRCULAR) {
        expect(renderInfo.sourceHint).toBe('src/types.ts');
      }
    });

    it('应该处理 circular renderHint（无源码位置）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        name: 'TreeNode',
        kind: 'object',
        text: 'TreeNode',
        renderHint: 'circular',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.CIRCULAR);
      if (renderInfo.type === RENDER_TYPE.CIRCULAR) {
        expect(renderInfo.sourceHint).toBeUndefined();
      }
    });

    it('应该处理 truncated renderHint', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        name: 'DeepType',
        kind: 'object',
        text: '{ ... }',
        renderHint: 'truncated',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.DEFAULT);
      if (renderInfo.type === RENDER_TYPE.DEFAULT) {
        expect(renderInfo.text).toBe('DeepType');
      }
    });

    it('generic renderHint 应该继续按 kind 处理', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'object',
        text: 'Omit<T, "id">',
        renderHint: 'generic',
        isGeneric: true,
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      // generic 不影响渲染，应该按 object 类型处理
      expect(renderInfo.type).toBe(RENDER_TYPE.OBJECT);
    });
  });

  describe('kind 分类处理', () => {
    it('应该处理 enum 类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'enum',
        text: '"a" | "b" | "c"',
        enumValues: ['a', 'b', 'c'],
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.ENUM);
      if (renderInfo.type === RENDER_TYPE.ENUM) {
        expect(renderInfo.values).toEqual(['a', 'b', 'c']);
      }
    });

    it('应该处理空 enum 类型（fallback）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'enum',
        text: 'EmptyEnum',
        enumValues: [],
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      // 空 enum 应该 fallback 到 DEFAULT
      expect(renderInfo.type).toBe(RENDER_TYPE.DEFAULT);
    });

    it('应该处理 function 类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'function',
        text: '(a: string) => void',
        signatures: [
          {
            parameters: [
              { name: 'a', type: { kind: 'primitive', text: 'string' } },
            ],
            returnType: { kind: 'primitive', text: 'void' },
          },
        ],
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.FUNCTION);
      if (renderInfo.type === RENDER_TYPE.FUNCTION) {
        expect(renderInfo.signatures).toHaveLength(1);
        expect(renderInfo.text).toBe('(a: string) => void');
      }
    });

    it('应该处理空 function 类型（fallback）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'function',
        text: 'Function',
        signatures: [],
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      // 空 signatures 应该 fallback
      expect(renderInfo.type).toBe(RENDER_TYPE.DEFAULT);
    });

    it('应该处理 union 类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'union',
        text: 'string | number',
        unionTypes: [
          { kind: 'primitive', text: 'string' },
          { kind: 'primitive', text: 'number' },
        ],
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.UNION);
      if (renderInfo.type === RENDER_TYPE.UNION) {
        expect(renderInfo.types).toHaveLength(2);
      }
    });

    it('应该处理空 union 类型（fallback）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'union',
        text: 'never',
        unionTypes: [],
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.DEFAULT);
    });

    it('应该处理 array 类型（简单元素）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'array',
        text: 'string[]',
        elementType: { kind: 'primitive', text: 'string' },
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.ARRAY);
      if (renderInfo.type === RENDER_TYPE.ARRAY) {
        expect(renderInfo.elementType).toBeDefined();
        expect(renderInfo.needsParens).toBe(false); // primitive 不需要括号
      }
    });

    it('应该处理 array 类型（复杂元素需要括号）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'array',
        text: '(string | number)[]',
        elementType: {
          kind: 'union',
          text: 'string | number',
          unionTypes: [],
        },
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.ARRAY);
      if (renderInfo.type === RENDER_TYPE.ARRAY) {
        expect(renderInfo.needsParens).toBe(true); // union 需要括号
      }
    });

    it('应该处理无 elementType 的 array（fallback）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'array',
        text: 'Array',
        elementType: null,
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.DEFAULT);
    });

    it('应该处理 object 类型（可展开）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        name: 'User',
        kind: 'object',
        text: 'User',
        properties: {
          id: { kind: 'primitive', text: 'number' },
          name: { kind: 'primitive', text: 'string' },
        },
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.OBJECT);
      if (renderInfo.type === RENDER_TYPE.OBJECT) {
        expect(renderInfo.name).toBe('User');
        expect(renderInfo.expandable).toBe(true);
        expect(renderInfo.resolved).toBeDefined();
      }
    });

    it('应该处理 object 类型（不可展开）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        name: 'EmptyObject',
        kind: 'object',
        text: '{}',
        properties: {},
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.OBJECT);
      if (renderInfo.type === RENDER_TYPE.OBJECT) {
        expect(renderInfo.expandable).toBe(false);
      }
    });

    it('应该处理 tuple 类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'tuple' as TypeCategory,
        text: '[x: number, y: number, z: number]',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.TUPLE);
      if (renderInfo.type === RENDER_TYPE.TUPLE) {
        expect(renderInfo.text).toBe('[x: number, y: number, z: number]');
      }
    });

    it('元组类型应该标记为不可展开', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'tuple' as TypeCategory,
        text: '[string, number]',
      };

      expect(reader.isExpandable(typeInfo)).toBe(false);
    });

    it('应该处理 primitive 类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'primitive',
        text: 'string',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.PRIMITIVE);
      if (renderInfo.type === RENDER_TYPE.PRIMITIVE) {
        expect(renderInfo.text).toBe('string');
      }
    });

    it('应该处理 literal 类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'literal',
        text: '"hello"',
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.PRIMITIVE);
      if (renderInfo.type === RENDER_TYPE.PRIMITIVE) {
        expect(renderInfo.text).toBe('"hello"');
      }
    });
  });

  describe('兜底处理', () => {
    it('未知 kind 的不可展开类型应该返回 DEFAULT', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'mapped' as TypeCategory,
        text: 'SomeType',
        // 没有 properties，不可展开
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.DEFAULT);
      if (renderInfo.type === RENDER_TYPE.DEFAULT) {
        expect(renderInfo.text).toBe('SomeType');
      }
    });

    it('未知 kind 且无法提取类型名应该返回 DEFAULT', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo: TypeInfo = {
        kind: 'mapped' as TypeCategory,
        text: 'string', // 基础类型无法提取自定义类型名
        properties: {
          value: { kind: 'primitive', text: 'string' },
        },
      };

      const renderInfo = reader.getTypeRenderInfo(typeInfo);

      expect(renderInfo.type).toBe(RENDER_TYPE.DEFAULT);
    });
  });
});
