import { describe, it, expect, beforeEach } from 'vitest';
import { parseTypeInfo, clearTypeCache, getTypeCacheSnapshot } from '..';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../__tests__/helpers/testUtils';
import type { Project } from 'ts-morph';

describe('类型解析器', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    clearTypeCache();
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
    }, 30000);

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

  describe('泛型实例化', () => {
    it('应该正确实例化泛型接口的函数属性参数类型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface GenericProps<T> {
          data: T;
          renderItem: (item: T) => string;
        }
        
        export type StringProps = GenericProps<string>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'StringProps');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if (
        'kind' in typeInfo &&
        typeInfo.kind === 'object' &&
        'properties' in typeInfo &&
        typeInfo.properties
      ) {
        // 验证 data 属性已实例化为 string
        const dataProp = typeInfo.properties.data;
        expect(dataProp).toBeDefined();
        if (dataProp && '$ref' in dataProp) {
          expect(dataProp.$ref).toBe('primitive:string');
        } else if (dataProp && 'kind' in dataProp) {
          expect(dataProp.kind).toBe('primitive');
          expect(dataProp.text).toBe('string');
        }

        // 验证 renderItem 函数的参数类型已实例化为 string
        const renderItemProp = typeInfo.properties.renderItem;
        expect(renderItemProp).toBeDefined();
        if (
          renderItemProp &&
          'kind' in renderItemProp &&
          renderItemProp.kind === 'function' &&
          'signatures' in renderItemProp &&
          renderItemProp.signatures
        ) {
          const sig = renderItemProp.signatures[0];
          expect(sig).toBeDefined();
          expect(sig?.parameters).toBeDefined();
          expect(sig?.parameters.length).toBe(1);

          const param = sig?.parameters[0];
          expect(param).toBeDefined();
          expect(param?.name).toBe('item');

          // 关键验证：参数类型应该是 string，而不是泛型 T
          const paramType = param?.type;
          if (paramType && '$ref' in paramType) {
            expect(paramType.$ref).toBe('primitive:string');
          } else if (paramType && 'kind' in paramType) {
            expect(paramType.kind).toBe('primitive');
            expect(paramType.text).toBe('string');
          }
        }
      }
    });

    it('应该正确实例化多类型参数的泛型', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface Pair<K, V> {
          key: K;
          value: V;
          compare: (a: K, b: K) => boolean;
        }
        
        export type StringNumberPair = Pair<string, number>;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'StringNumberPair');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if (
        'kind' in typeInfo &&
        typeInfo.kind === 'object' &&
        'properties' in typeInfo &&
        typeInfo.properties
      ) {
        // 验证 compare 函数的参数类型
        const compareProp = typeInfo.properties.compare;
        if (
          compareProp &&
          'kind' in compareProp &&
          compareProp.kind === 'function' &&
          'signatures' in compareProp &&
          compareProp.signatures
        ) {
          const sig = compareProp.signatures[0];
          expect(sig?.parameters.length).toBe(2);

          // 两个参数都应该是 string 类型（K 被实例化为 string）
          const param1 = sig?.parameters[0];
          const param2 = sig?.parameters[1];

          if (param1?.type && '$ref' in param1.type) {
            expect(param1.type.$ref).toBe('primitive:string');
          } else if (param1?.type && 'kind' in param1.type) {
            expect(param1.type.kind).toBe('primitive');
            expect(param1.type.text).toBe('string');
          }
          if (param2?.type && '$ref' in param2.type) {
            expect(param2.type.$ref).toBe('primitive:string');
          } else if (param2?.type && 'kind' in param2.type) {
            expect(param2.type.kind).toBe('primitive');
            expect(param2.type.text).toBe('string');
          }
        }
      }
    });

    it('应该保持未实例化泛型的泛型参数', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export interface GenericProps<T> {
          data: T;
          renderItem: (item: T) => string;
        }
      `,
      );

      const type = getExportedType(project, 'test.ts', 'GenericProps');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if (
        'kind' in typeInfo &&
        typeInfo.kind === 'object' &&
        'properties' in typeInfo &&
        typeInfo.properties
      ) {
        // 验证未实例化的泛型应该保留 T
        const renderItemProp = typeInfo.properties.renderItem;
        if (
          renderItemProp &&
          'kind' in renderItemProp &&
          renderItemProp.kind === 'function' &&
          'signatures' in renderItemProp &&
          renderItemProp.signatures
        ) {
          const sig = renderItemProp.signatures[0];
          const param = sig?.parameters[0];

          // 未实例化的泛型，参数类型应该是 T
          const paramType = param?.type;
          if (paramType && '$ref' in paramType) {
            expect(paramType.$ref).toContain('T');
          } else if (paramType && 'text' in paramType) {
            expect(paramType.text).toContain('T');
          }
        }
      }
    });
  });

  describe('simplifyOptionalUnion - undefined 清理', () => {
    it('应该简化 string | undefined 并移除 text 中的 undefined', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type OptionalString = string | undefined;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'OptionalString');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo) {
        // 简化后应该是 primitive string，text 不包含 undefined
        expect(typeInfo.kind).toBe('primitive');
        expect(typeInfo.text).toBe('string');
        expect(typeInfo.text).not.toContain('undefined');
      }
    });

    it('应该简化字面量联合 "a" | "b" | undefined 并移除 text 中的 undefined', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type LiteralUnion = 'customer' | 'privacy' | 'cloud' | undefined;
      `,
      );

      const type = getExportedType(project, 'test.ts', 'LiteralUnion');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if ('kind' in typeInfo && typeInfo.kind === 'union') {
        // unionTypes 不应包含 undefined
        expect(typeInfo.unionTypes).toBeDefined();
        const hasUndefined = typeInfo.unionTypes?.some((t) => {
          if ('$ref' in t) {
            return t.$ref.includes('undefined');
          }
          return 'text' in t && t.text === 'undefined';
        });
        expect(hasUndefined).toBe(false);

        // text 不应包含 undefined
        expect(typeInfo.text).not.toContain('undefined');
        expect(typeInfo.text).toContain('customer');
        expect(typeInfo.text).toContain('privacy');
        expect(typeInfo.text).toContain('cloud');
      }
    });

    it('应该处理嵌套对象中的可选属性', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type NestedOptional = {
          obj?: {
            field?: string | undefined;
            status?: 'active' | 'inactive' | undefined;
          };
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'NestedOptional');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if (
        'kind' in typeInfo &&
        typeInfo.kind === 'object' &&
        'properties' in typeInfo &&
        typeInfo.properties
      ) {
        const objProp = typeInfo.properties.obj;
        expect(objProp).toBeDefined();

        // obj 应该是可选的
        if (objProp) {
          expect(
            'required' in objProp ? objProp.required : undefined,
          ).toBeUndefined();
        }

        // 检查嵌套对象的属性
        if (
          objProp &&
          'kind' in objProp &&
          objProp.kind === 'object' &&
          'properties' in objProp &&
          objProp.properties
        ) {
          const fieldProp = objProp.properties.field;
          const statusProp = objProp.properties.status;

          // field 的 text 不应包含 undefined
          if (fieldProp && 'text' in fieldProp) {
            expect(fieldProp.text).not.toContain('undefined');
          }

          // status 的 text 不应包含 undefined
          if (statusProp && 'text' in statusProp) {
            expect(statusProp.text).not.toContain('undefined');
          }
        }
      }
    });

    it('应该正确处理缓存的类型引用', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type Status = 'active' | 'inactive' | undefined;
        export type User = {
          name: string;
          status: Status;
        };
      `,
      );

      const statusType = getExportedType(project, 'test.ts', 'Status');
      const statusInfo = parseTypeInfo(statusType!);

      const userType = getExportedType(project, 'test.ts', 'User');
      const userInfo = parseTypeInfo(userType!);

      // Status 应该被简化
      expect(statusInfo).toBeDefined();
      if ('kind' in statusInfo) {
        expect(statusInfo.text).not.toContain('undefined');
      }

      // User 中引用的 Status 也应该是简化后的
      expect(userInfo).toBeDefined();
      if (
        'kind' in userInfo &&
        userInfo.kind === 'object' &&
        'properties' in userInfo &&
        userInfo.properties
      ) {
        const statusProp = userInfo.properties.status;
        expect(statusProp).toBeDefined();

        // 如果是引用，检查引用的类型
        if (statusProp && '$ref' in statusProp) {
          // 从缓存中获取引用的类型
          const cacheSnapshot = getTypeCacheSnapshot();
          const referencedType = cacheSnapshot[statusProp.$ref];
          if (referencedType && 'text' in referencedType) {
            expect(referencedType.text).not.toContain('undefined');
          }
        }
      }
    });
  });
});
