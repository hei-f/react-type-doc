import { describe, it, expect, beforeEach } from 'vitest';
import { parseTypeInfo, clearTypeCache, initParseOptions } from '..';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../__tests__/helpers/testUtils';
import type { Project } from 'ts-morph';

describe('集成测试', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    clearTypeCache();
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
});
