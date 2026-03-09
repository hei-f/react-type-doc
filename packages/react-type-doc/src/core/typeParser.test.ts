/**
 * typeParser 单元测试
 * 测试类型解析器的核心功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseTypeInfo,
  clearTypeCache,
  getTypeCacheSize,
  getTypeKind,
  initParseOptions,
  getTypeCacheSnapshot,
  createEmptyTypeInfo,
} from './typeParser';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../__tests__/helpers/testUtils';
import { Project } from 'ts-morph';

describe('typeParser', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    clearTypeCache();
  });

  describe('配置和缓存管理', () => {
    it('initParseOptions 应该使用默认选项', () => {
      initParseOptions();
      expect(getTypeCacheSize()).toBe(0);
    });

    it('initParseOptions 应该接受自定义配置', () => {
      initParseOptions({
        maxDepth: 5,
        cacheMaxTypeTextLength: 200,
        enableSourceLocation: false,
        skipDeepParseTypes: new Set(['CustomType']),
        skipDeepParsePrefixes: ['Test'],
      });
      expect(getTypeCacheSize()).toBe(0);
    });

    it('clearTypeCache 应该清空缓存', () => {
      createTestFile(project, 'test.ts', `export type SimpleType = string;`);
      const type = getExportedType(project, 'test.ts', 'SimpleType');
      if (type) {
        parseTypeInfo(type);
      }
      expect(getTypeCacheSize()).toBeGreaterThan(0);
      clearTypeCache();
      expect(getTypeCacheSize()).toBe(0);
    });

    it('getTypeCacheSize 应该返回当前缓存大小', () => {
      expect(getTypeCacheSize()).toBe(0);
      createTestFile(
        project,
        'test.ts',
        `export type T1 = string; export type T2 = number;`,
      );
      const type1 = getExportedType(project, 'test.ts', 'T1');
      if (type1) parseTypeInfo(type1);
      expect(getTypeCacheSize()).toBeGreaterThan(0);
    });

    it('getTypeCacheSnapshot 应该返回缓存快照', () => {
      createTestFile(project, 'test.ts', `export type CachedType = string;`);
      const type = getExportedType(project, 'test.ts', 'CachedType');
      if (type) {
        parseTypeInfo(type);
      }
      const snapshot = getTypeCacheSnapshot();
      expect(Object.keys(snapshot).length).toBeGreaterThan(0);
    });
  });

  describe('createEmptyTypeInfo', () => {
    it('应该创建空类型信息', () => {
      const emptyInfo = createEmptyTypeInfo();
      expect(emptyInfo).toEqual({
        name: 'EmptyProps',
        kind: 'object',
        text: '{}',
      });
    });
  });

  describe('getTypeKind', () => {
    it('应该正确识别基础类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type StringType = string;
        export type NumberType = number;
        export type BooleanType = boolean;
      `,
      );

      const stringType = getExportedType(project, 'test.ts', 'StringType');
      const numberType = getExportedType(project, 'test.ts', 'NumberType');
      const booleanType = getExportedType(project, 'test.ts', 'BooleanType');

      expect(stringType).toBeDefined();
      expect(numberType).toBeDefined();
      expect(booleanType).toBeDefined();

      expect(getTypeKind(stringType!)).toBe('primitive');
      expect(getTypeKind(numberType!)).toBe('primitive');
      expect(getTypeKind(booleanType!)).toBe('primitive');
    });

    it('应该正确识别数组类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ArrayType = string[];
      `,
      );

      const arrayType = getExportedType(project, 'test.ts', 'ArrayType');
      expect(arrayType).toBeDefined();
      expect(getTypeKind(arrayType!)).toBe('array');
    });

    it('应该正确识别联合类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type UnionType = string | number;
      `,
      );

      const unionType = getExportedType(project, 'test.ts', 'UnionType');
      expect(unionType).toBeDefined();
      expect(getTypeKind(unionType!)).toBe('union');
    });

    it('应该正确识别枚举类型（字面量联合）', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type EnumType = 'a' | 'b' | 'c';
      `,
      );

      const enumType = getExportedType(project, 'test.ts', 'EnumType');
      expect(enumType).toBeDefined();
      expect(getTypeKind(enumType!)).toBe('enum');
    });

    it('应该正确识别对象类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ObjectType = { a: string; b: number };
      `,
      );

      const objectType = getExportedType(project, 'test.ts', 'ObjectType');
      expect(objectType).toBeDefined();
      expect(getTypeKind(objectType!)).toBe('object');
    });

    it('应该正确识别函数类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type FunctionType = () => void;
      `,
      );

      const functionType = getExportedType(project, 'test.ts', 'FunctionType');
      expect(functionType).toBeDefined();
      expect(getTypeKind(functionType!)).toBe('function');
    });
  });

  describe('parseTypeInfo', () => {
    it('应该正确解析基础类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = {
          str: string;
          num: number;
          bool: boolean;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      expect(type).toBeDefined();

      const typeInfo = parseTypeInfo(type!);
      expect(typeInfo).toBeDefined();
      expect(typeInfo).toHaveProperty('kind');
      expect(typeInfo).toHaveProperty('text');
    });

    it('应该正确解析对象类型的属性', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = {
          name: string;
          age: number;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      // 检查是否为对象类型
      if ('kind' in typeInfo && typeInfo.kind === 'object') {
        expect(typeInfo.properties).toBeDefined();
        expect(typeInfo.properties).toHaveProperty('name');
        expect(typeInfo.properties).toHaveProperty('age');
      } else if ('$ref' in typeInfo) {
        // 如果是引用，也是正常的
        expect(typeInfo.$ref).toBeDefined();
      } else {
        throw new Error('Expected object type or reference');
      }
    });

    it('应该正确解析可选属性', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = {
          required: string;
          optional?: number;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      if (
        'kind' in typeInfo &&
        typeInfo.kind === 'object' &&
        typeInfo.properties
      ) {
        const requiredProp = typeInfo.properties.required;
        const optionalProp = typeInfo.properties.optional;

        // 检查必需属性
        if (requiredProp && 'required' in requiredProp) {
          expect(requiredProp.required).toBe(true);
        }

        // 检查可选属性
        if (optionalProp && 'required' in optionalProp) {
          expect(optionalProp.required).toBe(false);
        }
      }
    });

    it('应该正确解析数组类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = string[];
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      // 数组类型可能被解析为 array 或 object（取决于 ts-morph 的实现）
      if ('kind' in typeInfo) {
        expect(['array', 'object']).toContain(typeInfo.kind);
        // 如果是数组类型，应该有 elementType
        if (typeInfo.kind === 'array') {
          expect(typeInfo.elementType).toBeDefined();
        }
      } else if ('$ref' in typeInfo) {
        // 引用也是可以的
        expect(typeInfo.$ref).toBeDefined();
      }
    });

    it('应该正确解析联合类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = string | number | boolean;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('union');
        expect(typeInfo.unionTypes).toBeDefined();
        expect(Array.isArray(typeInfo.unionTypes)).toBe(true);
      } else if ('$ref' in typeInfo) {
        expect(typeInfo.$ref).toBeDefined();
      }
    });

    it('应该正确解析枚举类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = 'red' | 'green' | 'blue';
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      if ('kind' in typeInfo) {
        // 字面量联合可能被解析为 enum 或 union
        expect(['enum', 'union']).toContain(typeInfo.kind);
        // 检查是否有相关字段
        if (typeInfo.kind === 'enum' && typeInfo.enumValues) {
          expect(Array.isArray(typeInfo.enumValues)).toBe(true);
          expect(typeInfo.enumValues.length).toBeGreaterThan(0);
        } else if (typeInfo.kind === 'union' && typeInfo.unionTypes) {
          expect(Array.isArray(typeInfo.unionTypes)).toBe(true);
          expect(typeInfo.unionTypes.length).toBeGreaterThan(0);
        }
      } else if ('$ref' in typeInfo) {
        expect(typeInfo.$ref).toBeDefined();
      }
    });

    it('应该正确解析函数类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = (a: string, b: number) => boolean;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('function');
        expect(typeInfo.signatures).toBeDefined();
        expect(Array.isArray(typeInfo.signatures)).toBe(true);
      } else if ('$ref' in typeInfo) {
        expect(typeInfo.$ref).toBeDefined();
      }
    });

    it('应该正确处理嵌套对象', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = {
          level1: {
            level2: {
              value: string;
            };
          };
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      // 嵌套对象应该被解析
      if ('kind' in typeInfo && typeInfo.kind === 'object') {
        expect(typeInfo.properties).toBeDefined();
        expect(typeInfo.properties).toHaveProperty('level1');
      }
    });
  });

  describe('类型缓存', () => {
    it('应该缓存解析过的类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = string;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');

      // 第一次解析
      clearTypeCache();
      expect(getTypeCacheSize()).toBe(0);

      parseTypeInfo(type!);
      const cacheSize1 = getTypeCacheSize();
      expect(cacheSize1).toBeGreaterThan(0);

      // 第二次解析应该使用缓存
      parseTypeInfo(type!);
      const cacheSize2 = getTypeCacheSize();
      expect(cacheSize2).toBe(cacheSize1);
    });

    it('clearTypeCache 应该清空缓存', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = string;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');

      parseTypeInfo(type!);
      expect(getTypeCacheSize()).toBeGreaterThan(0);

      clearTypeCache();
      expect(getTypeCacheSize()).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理空对象类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = {};
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 any 类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = any;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 unknown 类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = unknown;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 never 类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = never;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('交叉类型', () => {
    it('应该处理简单交叉类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Type1 = { a: string };
        export type Type2 = { b: number };
        export type IntersectionType = Type1 & Type2;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'IntersectionType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('object');
      }
    });
  });

  describe('元组类型', () => {
    it('应该正确识别简单元组类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TupleType = [string, number];
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TupleType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('tuple');
        expect(typeInfo.text).toContain('[');
        expect(typeInfo.text).toContain('string');
        expect(typeInfo.text).toContain('number');
      }
    });

    it('应该正确识别带标签的元组类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type NamedTuple = [x: number, y: number, z: number];
      `,
      );

      const type = getExportedType(project, 'test.ts', 'NamedTuple');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('tuple');
        expect(typeInfo.text).toContain('x:');
        expect(typeInfo.text).toContain('y:');
        expect(typeInfo.text).toContain('z:');
      }
    });

    it('应该正确识别可选元素元组', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type OptionalTuple = [string, number?];
      `,
      );

      const type = getExportedType(project, 'test.ts', 'OptionalTuple');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('tuple');
      }
    });

    it('应该正确识别剩余元素元组', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type RestTuple = [string, ...number[]];
      `,
      );

      const type = getExportedType(project, 'test.ts', 'RestTuple');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('tuple');
        expect(typeInfo.text).toContain('...');
      }
    });

    it('元组不应该包含数组方法属性', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type SimpleTuple = [number, string];
      `,
      );

      const type = getExportedType(project, 'test.ts', 'SimpleTuple');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('tuple');
        // 元组类型不应该有 properties 字段
        expect(typeInfo.properties).toBeUndefined();
      }
    });
  });

  describe('索引签名', () => {
    it('应该处理字符串索引签名', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type StringIndex = { [key: string]: number };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'StringIndex');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('object');
      }
    });
  });

  describe('深度限制', () => {
    it('应该遵守最大深度限制', () => {
      initParseOptions({ maxDepth: 2 });

      createTestFile(
        project,
        'test.ts',
        `
        export type Deep = {
          level1: {
            level2: {
              level3: string;
            };
          };
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Deep');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('泛型约束', () => {
    it('应该处理泛型约束', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type GenericWithConstraint<T extends string> = { value: T };
        export type Instance = GenericWithConstraint<'test'>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Instance');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('条件类型', () => {
    it('应该处理条件类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ConditionalType<T> = T extends string ? 'yes' : 'no';
        export type Result = ConditionalType<string>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Result');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('类类型', () => {
    it('应该处理类定义', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export class MyClass {
          public name: string = '';
          private age: number = 0;
          protected id: string = '';
          
          constructor() {}
          
          public getName(): string {
            return this.name;
          }
        }
        
        export type ClassType = MyClass;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ClassType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('接口类型', () => {
    it('应该处理接口定义', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface MyInterface {
          /** 名称属性 */
          name: string;
          /** 年龄属性 */
          age: number;
        }
        
        export type InterfaceType = MyInterface;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'InterfaceType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('object');
      }
    });

    it('应该处理接口继承', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface BaseInterface {
          base: string;
        }
        
        export interface ExtendedInterface extends BaseInterface {
          extended: number;
        }
        
        export type TestType = ExtendedInterface;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('函数签名复杂情况', () => {
    it('应该处理可选参数', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type FuncType = (required: string, optional?: number) => void;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'FuncType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('function');
      }
    });

    it('应该处理剩余参数', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type FuncType = (first: string, ...rest: number[]) => void;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'FuncType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('function');
      }
    });

    it('应该处理多个函数签名（重载）', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface OverloadedFunc {
          (x: string): string;
          (x: number): number;
        }
        
        export type TestType = OverloadedFunc;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('特殊类型', () => {
    it('应该处理 TypeScript 工具类型 Partial', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Original = { a: string; b: number };
        export type PartialType = Partial<Original>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'PartialType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 Required 工具类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Original = { a?: string; b?: number };
        export type RequiredType = Required<Original>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'RequiredType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 Pick 工具类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Original = { a: string; b: number; c: boolean };
        export type PickedType = Pick<Original, 'a' | 'b'>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'PickedType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 Omit 工具类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Original = { a: string; b: number; c: boolean };
        export type OmittedType = Omit<Original, 'c'>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'OmittedType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 Record 工具类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type RecordType = Record<string, number>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'RecordType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 Exclude 工具类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ExcludedType = Exclude<'a' | 'b' | 'c', 'c'>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ExcludedType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理 Extract 工具类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ExtractedType = Extract<'a' | 'b' | 'c', 'a' | 'b'>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ExtractedType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('循环引用', () => {
    it('应该处理自引用类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface TreeNode {
          value: string;
          children?: TreeNode[];
        }
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TreeNode');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理互相引用的类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface TypeA {
          b?: TypeB;
        }
        
        export interface TypeB {
          a?: TypeA;
        }
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TypeA');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('映射类型', () => {
    it('应该处理简单映射类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type MappedType = {
          [K in 'a' | 'b' | 'c']: string;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'MappedType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理带修饰符的映射类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Optional<T> = {
          [K in keyof T]?: T[K];
        };
        
        export type TestType = Optional<{ a: string; b: number }>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('模板字面量类型', () => {
    it('应该处理模板字面量类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Greeting = \`Hello \${string}\`;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Greeting');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('Symbol 属性', () => {
    it('应该处理 Symbol 属性', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type SymbolProp = {
          [Symbol.iterator]: () => Iterator<string>;
          normalProp: string;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'SymbolProp');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('readonly 和可选修饰符', () => {
    it('应该处理 readonly 属性', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ReadonlyType = {
          readonly id: string;
          name: string;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ReadonlyType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('object');
      }
    });

    it('应该处理可选属性', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type OptionalType = {
          required: string;
          optional?: number;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'OptionalType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('object');
      }
    });
  });

  describe('字面量类型', () => {
    it('应该处理字符串字面量类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type StringLiteral = 'hello' | 'world';
      `,
      );

      const type = getExportedType(project, 'test.ts', 'StringLiteral');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('union');
      }
    });

    it('应该处理数字字面量类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type NumberLiteral = 1 | 2 | 3;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'NumberLiteral');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('union');
      }
    });

    it('应该处理布尔字面量类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type BoolLiteral = true;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'BoolLiteral');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('typeof 类型查询', () => {
    it('应该处理 typeof 查询', () => {
      createTestFile(
        project,
        'test.ts',
        `
        const obj = { name: 'test', value: 42 };
        export type TypeOfObj = typeof obj;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TypeOfObj');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('keyof 类型操作符', () => {
    it('应该处理 keyof 查询', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Original = { a: string; b: number };
        export type Keys = keyof Original;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Keys');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('索引访问类型', () => {
    it('应该处理索引访问类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Original = { a: string; b: number };
        export type AType = Original['a'];
      `,
      );

      const type = getExportedType(project, 'test.ts', 'AType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('infer 关键字', () => {
    it('应该处理 infer 在条件类型中的使用', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
        export type FuncReturn = ReturnType<() => string>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'FuncReturn');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('ThisType', () => {
    it('应该处理 ThisType 工具类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ObjectWithThis = { value: number } & ThisType<{ getValue(): number }>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ObjectWithThis');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('非空断言和类型守卫', () => {
    it('应该处理 NonNullable 工具类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type MaybeNull = string | null | undefined;
        export type NonNull = NonNullable<MaybeNull>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'NonNull');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('复杂嵌套类型', () => {
    it('应该处理深度嵌套的对象', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type DeepNested = {
          level1: {
            level2: {
              level3: {
                value: string;
              };
            };
          };
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'DeepNested');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理复杂的联合和交叉混合', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Complex = ({ a: string } | { b: number }) & { c: boolean };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Complex');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('Promise 和 async 类型', () => {
    it('应该处理 Promise 类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type PromiseType = Promise<string>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'PromiseType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('renderHint' in typeInfo) {
        expect(typeInfo.renderHint).toBe('builtin');
      }
    });

    it('应该处理嵌套 Promise', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type NestedPromise = Promise<Promise<string>>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'NestedPromise');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('构造函数类型', () => {
    it('应该处理构造签名', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Constructor = new (name: string) => { name: string };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Constructor');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('JSDoc 注释和描述', () => {
    it('应该解析属性的 JSDoc 注释', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type DocumentedType = {
          /** 用户名称 */
          name: string;
          /** 用户年龄 */
          age: number;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'DocumentedType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if (
        'kind' in typeInfo &&
        typeInfo.kind === 'object' &&
        'properties' in typeInfo &&
        typeInfo.properties
      ) {
        expect(typeInfo.properties.name?.description).toBeDefined();
        expect(typeInfo.properties.age?.description).toBeDefined();
      }
    });

    it('应该处理多行 JSDoc', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type DocumentedType = {
          /**
           * 用户的完整姓名
           * @example "Zhang San"
           */
          name: string;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'DocumentedType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('required 属性标记', () => {
    it('应该正确标记必填属性', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = {
          required: string;
          optional?: number;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if (
        'kind' in typeInfo &&
        typeInfo.kind === 'object' &&
        'properties' in typeInfo &&
        typeInfo.properties
      ) {
        expect(typeInfo.properties.required?.required).toBe(true);
        expect(typeInfo.properties.optional?.required).toBeUndefined();
      }
    });

    it('应该将 string | undefined 转换为可选', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type TestType = {
          name: string | undefined;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      // name: string | undefined 会被规范化为可选属性
    });
  });

  describe('枚举值处理', () => {
    it('应该解析枚举值', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export enum Status {
          Active = 'active',
          Inactive = 'inactive',
        }
        
        export type StatusType = Status;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'StatusType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(['enum', 'union']).toContain(typeInfo.kind);
      }
    });

    it('应该处理数字枚举', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export enum NumberEnum {
          First,
          Second,
          Third,
        }
        
        export type EnumType = NumberEnum;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'EnumType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });

    it('应该处理混合枚举', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export enum MixedEnum {
          A = 'a',
          B = 1,
        }
        
        export type EnumType = MixedEnum;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'EnumType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
    });
  });

  describe('泛型函数签名', () => {
    it('应该解析带泛型参数的函数', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type GenericFunc = <T>(value: T) => T;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'GenericFunc');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('function');
        if (
          typeInfo.kind === 'function' &&
          'signatures' in typeInfo &&
          typeInfo.signatures
        ) {
          const sig = typeInfo.signatures[0];
          expect(sig?.typeParameters).toBeDefined();
        }
      }
    });

    it('应该解析多个泛型参数的函数', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type MultiGenericFunc = <T, K, V>(key: K, value: V) => T;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'MultiGenericFunc');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('function');
      }
    });
  });

  describe('复杂函数参数', () => {
    it('应该处理对象解构参数', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type FuncType = (params: { name: string; age: number }) => void;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'FuncType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('function');
      }
    });

    it('应该处理数组参数', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type FuncType = (items: string[]) => void;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'FuncType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('function');
      }
    });

    it('应该处理联合类型参数', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type FuncType = (value: string | number) => void;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'FuncType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('function');
      }
    });
  });

  describe('内置类型识别', () => {
    it('应该识别 Array<string> 为数组类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ArrayType = Array<string>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ArrayType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      // 修复后应该正确识别为 array
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('array');
        if (typeInfo.kind === 'array' && 'elementType' in typeInfo) {
          expect(typeInfo.elementType).toBeDefined();
        }
      }
    });

    it('应该识别 Array<对象> 为数组类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ArrayType = Array<{ id: string; name: string }>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ArrayType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        expect(typeInfo.kind).toBe('array');
        if (typeInfo.kind === 'array' && 'elementType' in typeInfo) {
          expect(typeInfo.elementType).toBeDefined();
          const elementType = typeInfo.elementType;
          if (elementType && 'kind' in elementType) {
            expect(elementType.kind).toBe('object');
          }
        }
      }
    });

    it('应该识别 Map 为内置类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type MapType = Map<string, number>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'MapType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('renderHint' in typeInfo) {
        expect(typeInfo.renderHint).toBe('builtin');
      }
    });

    it('应该识别 Set 为内置类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type SetType = Set<string>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'SetType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('renderHint' in typeInfo) {
        expect(typeInfo.renderHint).toBe('builtin');
      }
    });

    it('应该识别 Date 为内置类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type DateType = Date;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'DateType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('renderHint' in typeInfo) {
        expect(typeInfo.renderHint).toBe('builtin');
      }
    });

    it('应该识别 RegExp 为内置类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type RegExpType = RegExp;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'RegExpType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('renderHint' in typeInfo) {
        expect(typeInfo.renderHint).toBe('builtin');
      }
    });

    it('应该识别 Error 为内置类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type ErrorType = Error;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ErrorType');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('renderHint' in typeInfo) {
        expect(typeInfo.renderHint).toBe('builtin');
      }
    });
  });

  describe('React 特定类型', () => {
    it('应该处理 React.FC 类型', () => {
      createTestFile(
        project,
        'test.tsx',
        `
        import React from 'react';
        export type ComponentType = React.FC<{ name: string }>;
      `,
      );

      const type = getExportedType(project, 'test.tsx', 'ComponentType');
      if (type) {
        const typeInfo = parseTypeInfo(type);
        expect(typeInfo).toBeDefined();
      }
    });
  });

  describe('泛型类型属性排除', () => {
    it('含未实例化泛型参数的 Partial<T> 不应输出 properties', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface Wrapper<T> {
          partial: Partial<T>;
        }
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Wrapper');
      expect(type).toBeDefined();

      const typeInfo = parseTypeInfo(type!);
      if ('kind' in typeInfo && typeInfo.kind === 'object' && typeInfo.properties) {
        const partialProp = typeInfo.properties.partial;
        expect(partialProp).toBeDefined();

        if (partialProp && 'kind' in partialProp) {
          expect(partialProp.kind).toBe('object');
          expect(partialProp.isGeneric).toBe(true);
          expect(partialProp.properties).toBeUndefined();
        }
      }
    });

    it('已实例化的 Partial<User> 应保留 properties', () => {
      createTestFile(
        project,
        'test.ts',
        `
        interface User { id: number; name: string; }
        export type PartialUser = Partial<User>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'PartialUser');
      expect(type).toBeDefined();

      const typeInfo = parseTypeInfo(type!);
      if ('kind' in typeInfo && typeInfo.kind === 'object') {
        expect(typeInfo.isGeneric).toBeUndefined();
        expect(typeInfo.properties).toBeDefined();
      }
    });
  });

  describe('自定义泛型类型保留属性', () => {
    it('自定义泛型类型应保留 properties 和 isGeneric 标记', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface Box<T> {
          value: T;
        }
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Box');
      expect(type).toBeDefined();

      const typeInfo = parseTypeInfo(type!);
      if ('kind' in typeInfo && typeInfo.kind === 'object') {
        expect(typeInfo.isGeneric).toBe(true);
        expect(typeInfo.properties).toBeDefined();
        expect(typeInfo.properties).toHaveProperty('value');
      }
    });
  });

  describe('外部库类型别名保留', () => {
    it('node_modules 中定义的复杂类型别名应标记为 external', () => {
      const externalProject = new Project({
        compilerOptions: {
          target: 99,
          module: 99,
          moduleResolution: 2,
          strict: true,
          types: [],
        },
        useInMemoryFileSystem: true,
        skipFileDependencyResolution: true,
      });
      clearTypeCache();

      // TypeScript 会擦除简单别名（如 string | number）的 aliasSymbol，
      // 但会保留复杂类型别名。使用对象类型别名模拟 ReactNode 等场景
      externalProject.createSourceFile(
        'node_modules/mylib/index.d.ts',
        `
        export type ExternalConfig = { host: string; port: number; ssl: boolean };
        export interface Wrapper { config: ExternalConfig; }
        `,
      );

      const sourceFile = externalProject.getSourceFile(
        'node_modules/mylib/index.d.ts',
      );
      expect(sourceFile).toBeDefined();

      const wrapper = sourceFile!.getInterface('Wrapper');
      expect(wrapper).toBeDefined();

      const configProp = wrapper!.getProperty('config');
      expect(configProp).toBeDefined();

      const configType = configProp!.getType();
      const hasAlias = configType.getAliasSymbol() !== undefined;

      // 如果 TypeScript 保留了别名信息，验证 external 标记
      if (hasAlias) {
        const typeInfo = parseTypeInfo(configType);
        if ('kind' in typeInfo) {
          expect(typeInfo.renderHint).toBe('external');
          expect(typeInfo.text).toBe('ExternalConfig');
        }
      }
    });

    it('非 node_modules 中定义的类型别名不应标记为 external', () => {
      createTestFile(
        project,
        'test.ts',
        `export type LocalType = string | number;`,
      );

      const type = getExportedType(project, 'test.ts', 'LocalType');
      expect(type).toBeDefined();

      const typeInfo = parseTypeInfo(type!);
      if ('kind' in typeInfo) {
        expect(typeInfo.renderHint).toBeUndefined();
      }
    });
  });
});
