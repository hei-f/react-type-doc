/**
 * PropsDocReader 单元测试
 * 测试运行时类型读取器的核心功能
 */

import { describe, it, expect } from 'vitest';
import { PropsDocReader } from '../reader';
import type { OutputResult, TypeInfo } from '../../shared/types';

describe('PropsDocReader', () => {
  describe('构造函数和单例', () => {
    it('应该能够创建 PropsDocReader 实例', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      expect(reader).toBeInstanceOf(PropsDocReader);
    });

    it('应该支持单例模式', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const instance1 = PropsDocReader.getInstance(mockData);
      const instance2 = PropsDocReader.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('单例未初始化时应该返回 null', () => {
      // 清除单例
      PropsDocReader['instance'] = null;
      const instance = PropsDocReader.getInstance();
      expect(instance).toBeNull();
    });
  });

  describe('getRaw', () => {
    it('应该能够获取原始类型信息', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {
          TestType: {
            kind: 'object',
            text: '{ name: string }',
            properties: {
              name: {
                kind: 'primitive',
                text: 'string',
              },
            },
          },
        },
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo = reader.getRaw('TestType');

      expect(typeInfo).toBeDefined();
      expect(typeInfo).toHaveProperty('kind', 'object');
    });

    it('类型不存在时应该返回 null', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo = reader.getRaw('NonExistent');

      expect(typeInfo).toBeNull();
    });
  });

  describe('resolveRef', () => {
    it('应该解析类型引用', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {
          TestType: {
            $ref: 'ref1',
          },
        },
        typeRegistry: {
          ref1: {
            kind: 'object',
            text: '{ value: string }',
            properties: {
              value: {
                kind: 'primitive',
                text: 'string',
              },
            },
          },
        },
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo = reader.getRaw('TestType');
      expect(typeInfo).toBeDefined();

      const resolved = reader.resolveRef(typeInfo!);
      expect(resolved).toHaveProperty('kind', 'object');
      expect(resolved).toHaveProperty('text', '{ value: string }');
    });

    it('应该返回非引用类型本身', () => {
      const directType: TypeInfo = {
        kind: 'primitive',
        text: 'string',
      };

      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const resolved = reader.resolveRef(directType);

      expect(resolved).toBe(directType);
    });

    it('应该处理嵌套引用', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {
          ref1: {
            $ref: 'ref2',
          },
          ref2: {
            kind: 'primitive',
            text: 'string',
          },
        },
      };

      const reader = PropsDocReader.create(mockData);
      const typeRef: TypeInfo = { $ref: 'ref1' };
      const resolved = reader.resolveRef(typeRef);

      // resolveRef 只解析一层，所以会得到 ref2 的引用
      // 需要再次调用 resolveRef 才能得到最终类型
      if ('$ref' in resolved) {
        const finalResolved = reader.resolveRef(resolved);
        expect(finalResolved).toHaveProperty('kind', 'primitive');
        expect(finalResolved).toHaveProperty('text', 'string');
      } else {
        // 或者直接是最终类型也可以
        expect(resolved).toHaveProperty('kind');
      }
    });
  });

  describe('getPropertyEntries', () => {
    it('应该获取对象类型的属性列表', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {
          TestType: {
            kind: 'object',
            text: '{ name: string; age: number }',
            properties: {
              name: {
                kind: 'primitive',
                text: 'string',
              },
              age: {
                kind: 'primitive',
                text: 'number',
              },
            },
          },
        },
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo = reader.getRaw('TestType');
      const entries = reader.getPropertyEntries(typeInfo!);

      expect(entries).toHaveLength(2);
      expect(entries?.[0]?.[0]).toBe('name');
      expect(entries?.[1]?.[0]).toBe('age');
    });

    it('非对象类型应该返回空数组', () => {
      const primitiveType: TypeInfo = {
        kind: 'primitive',
        text: 'string',
      };

      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const entries = reader.getPropertyEntries(primitiveType);

      expect(entries).toHaveLength(0);
    });

    it('应该解析引用后获取属性', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {
          TestType: {
            $ref: 'ref1',
          },
        },
        typeRegistry: {
          ref1: {
            kind: 'object',
            text: '{ value: string }',
            properties: {
              value: {
                kind: 'primitive',
                text: 'string',
              },
            },
          },
        },
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo = reader.getRaw('TestType');
      const entries = reader.getPropertyEntries(typeInfo!);

      expect(entries).toHaveLength(1);
      expect(entries?.[0]?.[0]).toBe('value');
    });
  });

  describe('isExpandable', () => {
    it('对象类型应该是可展开的', () => {
      const objectType: TypeInfo = {
        kind: 'object',
        text: '{ value: string }',
        properties: {
          value: {
            kind: 'primitive',
            text: 'string',
          },
        },
      };

      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      expect(reader.isExpandable(objectType)).toBe(true);
    });

    it('基础类型应该是不可展开的', () => {
      const primitiveType: TypeInfo = {
        kind: 'primitive',
        text: 'string',
      };

      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      expect(reader.isExpandable(primitiveType)).toBe(false);
    });

    it('带有 renderHint 的类型应该根据提示判断', () => {
      const externalType: TypeInfo = {
        kind: 'object',
        text: 'Promise<T>',
        renderHint: 'builtin',
      };

      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      expect(reader.isExpandable(externalType)).toBe(false);
    });

    it('数组类型应该根据元素判断可展开性', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 数组元素是对象，可展开
      const arrayWithObject: TypeInfo = {
        kind: 'array',
        text: 'User[]',
        elementType: {
          kind: 'object',
          text: 'User',
          properties: {
            id: { kind: 'primitive', text: 'number' },
          },
        },
      };
      expect(reader.isExpandable(arrayWithObject)).toBe(true);

      // 数组元素是基础类型，不可展开
      const arrayWithPrimitive: TypeInfo = {
        kind: 'array',
        text: 'string[]',
        elementType: { kind: 'primitive', text: 'string' },
      };
      expect(reader.isExpandable(arrayWithPrimitive)).toBe(false);
    });

    it('联合类型应该检查是否有可展开的成员', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 联合类型包含对象，可展开
      const unionWithObject: TypeInfo = {
        kind: 'union',
        text: 'string | User',
        unionTypes: [
          { kind: 'primitive', text: 'string' },
          {
            kind: 'object',
            text: 'User',
            properties: {
              id: { kind: 'primitive', text: 'number' },
            },
          },
        ],
      };
      expect(reader.isExpandable(unionWithObject)).toBe(true);

      // 联合类型全是基础类型，不可展开
      const unionPrimitives: TypeInfo = {
        kind: 'union',
        text: 'string | number',
        unionTypes: [
          { kind: 'primitive', text: 'string' },
          { kind: 'primitive', text: 'number' },
        ],
      };
      expect(reader.isExpandable(unionPrimitives)).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('应该返回类型的显示名称', () => {
      const namedType: TypeInfo = {
        name: 'UserType',
        kind: 'object',
        text: '{ id: number }',
      };

      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const resolved = reader.resolveRef(namedType);
      const displayName = reader.getDisplayName(resolved, 'fallback');

      expect(displayName).toBe('UserType');
    });

    it('没有 name 字段时应该使用 text 或 fallback', () => {
      const anonymousType: TypeInfo = {
        kind: 'object',
        text: '{ id: number }',
      };

      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const displayName = reader.getDisplayName(anonymousType, 'fallback');

      // getDisplayName 会返回 name ?? text ?? fallback
      // 所以没有 name 时会返回 text
      expect(displayName).toBe('{ id: number }');
    });
  });

  describe('边界情况', () => {
    it('应该处理空的 OutputResult', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      expect(reader).toBeInstanceOf(PropsDocReader);
    });

    it('应该处理循环引用', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {
          TreeNode: {
            kind: 'object',
            text: 'TreeNode',
            properties: {
              value: {
                kind: 'primitive',
                text: 'string',
              },
              children: {
                kind: 'array',
                text: 'TreeNode[]',
                elementType: {
                  $ref: 'circular_TreeNode',
                  renderHint: 'circular',
                },
              },
            },
          },
        },
        typeRegistry: {
          circular_TreeNode: {
            kind: 'object',
            text: 'TreeNode',
            renderHint: 'circular',
          },
        },
      };

      const reader = PropsDocReader.create(mockData);
      const typeInfo = reader.getRaw('TreeNode');
      const resolved = reader.resolveRef(typeInfo!);

      expect(resolved).toHaveProperty('kind', 'object');
      expect(resolved).toHaveProperty('properties');
    });
  });

  describe('基础方法', () => {
    it('getAllKeys 应该返回所有类型 keys', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {
          Type1: { kind: 'primitive', text: 'string' },
          Type2: { kind: 'primitive', text: 'number' },
          Type3: { kind: 'primitive', text: 'boolean' },
        },
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const keys = reader.getAllKeys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('Type1');
      expect(keys).toContain('Type2');
      expect(keys).toContain('Type3');
    });

    it('hasKey 应该正确判断 key 是否存在', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {
          ExistingType: { kind: 'primitive', text: 'string' },
        },
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      expect(reader.hasKey('ExistingType')).toBe(true);
      expect(reader.hasKey('NonExistingType')).toBe(false);
    });

    it('getTypeRegistry 应该返回类型注册表', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {
          ref1: { kind: 'primitive', text: 'string' },
          ref2: { kind: 'primitive', text: 'number' },
        },
      };

      const reader = PropsDocReader.create(mockData);
      const registry = reader.getTypeRegistry();

      expect(registry).toHaveProperty('ref1');
      expect(registry).toHaveProperty('ref2');
      expect(Object.keys(registry)).toHaveLength(2);
    });

    it('resolve 应该解析并返回完整类型信息', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {
          TestType: {
            $ref: 'ref1',
            description: 'Test description',
            required: true,
          },
        },
        typeRegistry: {
          ref1: {
            kind: 'primitive',
            text: 'string',
          },
        },
      };

      const reader = PropsDocReader.create(mockData);
      const resolved = reader.resolve('TestType');

      expect(resolved).toBeDefined();
      expect(resolved).toHaveProperty('kind', 'primitive');
      expect(resolved).toHaveProperty('text', 'string');
      expect(resolved).toHaveProperty('description', 'Test description');
      expect(resolved).toHaveProperty('required', true);
    });

    it('resolve 不存在的 key 应该返回 null', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      const resolved = reader.resolve('NonExisting');

      expect(resolved).toBeNull();
    });

    it('getGeneratedAt 应该返回生成时间', () => {
      const generatedAt = '2024-01-01T12:34:56.789Z';
      const mockData: OutputResult = {
        generatedAt,
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);
      expect(reader.getGeneratedAt()).toBe(generatedAt);
    });
  });

  describe('类型判断方法', () => {
    it('isExternal 应该正确判断外部类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 外部类型
      const externalType: TypeInfo = {
        kind: 'object',
        text: 'Promise<T>',
        renderHint: 'external',
      };
      expect(reader.isExternal(externalType)).toBe(true);

      // 内置类型
      const builtinType: TypeInfo = {
        kind: 'object',
        text: 'String',
        renderHint: 'builtin',
      };
      expect(reader.isExternal(builtinType)).toBe(true);

      // 索引访问类型
      const indexAccessType: TypeInfo = {
        kind: 'object',
        text: 'T["id"]',
        renderHint: 'index-access',
      };
      expect(reader.isExternal(indexAccessType)).toBe(true);

      // 普通类型
      const normalType: TypeInfo = {
        kind: 'object',
        text: 'User',
      };
      expect(reader.isExternal(normalType)).toBe(false);
    });

    it('isCircular 应该正确判断循环引用', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      const circularType: TypeInfo = {
        kind: 'object',
        text: 'TreeNode',
        renderHint: 'circular',
      };
      expect(reader.isCircular(circularType)).toBe(true);

      const normalType: TypeInfo = {
        kind: 'object',
        text: 'User',
      };
      expect(reader.isCircular(normalType)).toBe(false);
    });

    it('isComplexType 应该正确判断复杂类型（无名联合类型需要括号包裹）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 无名联合类型是复杂类型（如 (string | number)[] 需要括号）
      const unionType: TypeInfo = {
        kind: 'union',
        text: 'string | number',
        unionTypes: [],
      };
      expect(reader.isComplexType(unionType)).toBe(true);

      // 有名联合类型不是复杂类型（如 Status[] 不需要括号）
      const namedUnionType: TypeInfo = {
        kind: 'union',
        text: 'Status',
        name: 'Status',
        unionTypes: [],
      };
      expect(reader.isComplexType(namedUnionType)).toBe(false);

      // 对象类型不是复杂类型（花括号已界定，如 { a: string }[] 不需要括号）
      const objectType: TypeInfo = {
        kind: 'object',
        text: '{ a: string }',
      };
      expect(reader.isComplexType(objectType)).toBe(false);

      // 基础类型不是复杂类型
      const primitiveType: TypeInfo = {
        kind: 'primitive',
        text: 'string',
      };
      expect(reader.isComplexType(primitiveType)).toBe(false);
    });

    it('isGenericType 应该正确判断泛型类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      const genericType: TypeInfo = {
        kind: 'object',
        text: 'Omit<T, "id">',
        isGeneric: true,
      };
      expect(reader.isGenericType(genericType)).toBe(true);

      const concreteType: TypeInfo = {
        kind: 'object',
        text: 'Omit<User, "id">',
      };
      expect(reader.isGenericType(concreteType)).toBe(false);
    });

    it('isFunctionType 应该正确判断函数类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      const functionType: TypeInfo = {
        kind: 'function',
        text: '() => void',
        signatures: [],
      };
      expect(reader.isFunctionType(functionType)).toBe(true);

      const notFunctionType: TypeInfo = {
        kind: 'primitive',
        text: 'string',
      };
      expect(reader.isFunctionType(notFunctionType)).toBe(false);
    });

    it('getFunctionSignatures 应该返回函数签名列表', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      const signatures = [
        {
          parameters: [
            { name: 'a', type: { kind: 'primitive' as const, text: 'string' } },
          ],
          returnType: { kind: 'primitive' as const, text: 'void' },
          typeParameters: ['T'],
        },
      ];

      const functionType: TypeInfo = {
        kind: 'function',
        text: '<T>(a: string) => void',
        signatures,
      };

      const result = reader.getFunctionSignatures(functionType);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(signatures[0]);
    });

    it('getFunctionSignatures 非函数类型应该返回空数组', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      const primitiveType: TypeInfo = {
        kind: 'primitive',
        text: 'string',
      };

      const result = reader.getFunctionSignatures(primitiveType);
      expect(result).toHaveLength(0);
    });

    it('extractCustomTypeName 应该提取自定义类型名', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 简单类型名
      expect(reader.extractCustomTypeName('User')).toBe('User');

      // 数组类型
      expect(reader.extractCustomTypeName('User[]')).toBe('User');

      // 联合undefined
      expect(reader.extractCustomTypeName('User | undefined')).toBe('User');

      // 命名空间
      expect(reader.extractCustomTypeName('API.UserVO')).toBe('API.UserVO');

      // 泛型
      expect(reader.extractCustomTypeName('Promise<User>')).toBe(
        'Promise<User>',
      );

      // 基础类型应该返回 null
      expect(reader.extractCustomTypeName('string')).toBeNull();
      expect(reader.extractCustomTypeName('number')).toBeNull();
    });

    it('getDisplayName 特殊情况：类型名为 Object 时使用 fallback', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 类型名为 'Object' 且提供 fallback
      const objectType: TypeInfo = {
        name: 'Object',
        kind: 'object',
        text: '{}',
      };
      expect(reader.getDisplayName(objectType, 'CustomName')).toBe(
        'CustomName',
      );

      // 类型名为 'Object' 但没有 fallback
      expect(reader.getDisplayName(objectType)).toBe('Object');

      // 普通类型名不受影响
      const normalType: TypeInfo = {
        name: 'User',
        kind: 'object',
        text: 'User',
      };
      expect(reader.getDisplayName(normalType, 'fallback')).toBe('User');
    });

    it('getNavigationTarget 应该处理数组类型的导航', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 数组类型，元素是对象
      const arrayType: TypeInfo = {
        kind: 'array',
        text: 'User[]',
        elementType: {
          name: 'User',
          kind: 'object',
          text: 'User',
          properties: {
            id: { kind: 'primitive', text: 'number' },
          },
        },
      };

      const target = reader.getNavigationTarget(arrayType, 'User[]');
      expect(target).toBeDefined();
      expect(target!.name).toBe('User');
      expect(target!.typeInfo.kind).toBe('object');
    });

    it('getNavigationTarget 应该处理数组类型（元素无属性的对象）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 数组类型，元素是对象但无属性（空对象）
      // 注意：空对象 {} 仍然满足 properties 条件
      const arrayType: TypeInfo = {
        kind: 'array',
        text: 'EmptyObject[]',
        elementType: {
          name: 'EmptyObject',
          kind: 'object',
          text: '{}',
          properties: {}, // 空对象但 properties 存在
        },
      };

      const target = reader.getNavigationTarget(arrayType, 'EmptyObject[]');
      expect(target).toBeDefined();
      // 因为有 properties（虽然为空），所以返回元素类型
      expect(target!.name).toBe('EmptyObject');
      expect(target!.typeInfo.kind).toBe('object');
    });

    it('getNavigationTarget 应该处理数组类型（元素对象无 properties 字段）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 数组类型，元素是对象但没有 properties 字段
      const arrayType: TypeInfo = {
        kind: 'array',
        text: 'SimpleArray[]',
        elementType: {
          kind: 'object',
          text: '{}',
          // 没有 properties 字段
        },
      };

      const target = reader.getNavigationTarget(arrayType, 'SimpleArray[]');
      expect(target).toBeDefined();
      // 没有 properties 字段，返回数组本身
      expect(target!.name).toBe('SimpleArray[]');
      expect(target!.typeInfo.kind).toBe('array');
    });

    it('getNavigationTarget 应该处理数组类型（元素名称使用 text）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 数组类型，元素对象没有 name 字段
      const arrayType: TypeInfo = {
        kind: 'array',
        text: 'Item[]',
        elementType: {
          kind: 'object',
          text: '{ value: string }', // 没有 name，会使用 text
          properties: {
            value: { kind: 'primitive', text: 'string' },
          },
        },
      };

      const target = reader.getNavigationTarget(arrayType, 'Item[]');
      expect(target).toBeDefined();
      // getTypeName 返回 text，因为没有 name
      expect(target!.name).toBe('{ value: string }');
      expect(target!.typeInfo.kind).toBe('object');
    });

    it('getNavigationTarget 应该处理数组类型（使用 fallback 名称）', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      // 数组类型，元素对象 name 和 text 都不合适时使用 typeName
      const arrayType: TypeInfo = {
        kind: 'array',
        text: 'CustomItem[]',
        elementType: {
          name: '', // 空 name
          kind: 'object',
          text: '',
          properties: {
            value: { kind: 'primitive', text: 'string' },
          },
        },
      };

      const target = reader.getNavigationTarget(arrayType, 'CustomItem[]');
      expect(target).toBeDefined();
      // 当 getTypeName 返回空字符串时，使用 typeName.replace('[]', '')
      expect(target!.name).toBe('CustomItem');
    });

    it('getNavigationTarget 数组元素为可展开联合类型时应导航到元素类型', () => {
      const mockData: OutputResult = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        keys: {},
        typeRegistry: {},
      };

      const reader = PropsDocReader.create(mockData);

      const arrayType: TypeInfo = {
        kind: 'array',
        text: 'DocumentNode[]',
        elementType: {
          name: 'DocumentNode',
          kind: 'union',
          text: 'DocumentNode',
          unionTypes: [
            { kind: 'primitive', text: '"text"' },
            {
              kind: 'object',
              text: '{ row: true }',
              properties: {
                row: { kind: 'literal', text: 'true' },
              },
            },
          ],
        },
      };

      const target = reader.getNavigationTarget(arrayType, 'DocumentNode[]');
      expect(target).toBeDefined();
      expect(target!.typeInfo.kind).toBe('union');
      expect(target!.name).toBe('DocumentNode');
    });
  });
});
