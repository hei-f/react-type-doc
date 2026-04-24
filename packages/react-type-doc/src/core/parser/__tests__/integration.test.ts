import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseTypeInfo,
  clearTypeCache,
  initParseOptions,
  getTypeCacheSnapshot,
} from '..';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../__tests__/helpers/testUtils';
import { Project } from 'ts-morph';

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

  describe('深度限制 -1 解除限制', () => {
    it('maxDepth 为 -1 时不应截断深层嵌套类型', () => {
      initParseOptions({ maxDepth: -1 });

      createTestFile(
        project,
        'test.ts',
        `
        export type Deep = {
          l1: {
            l2: {
              l3: {
                l4: {
                  l5: {
                    l6: {
                      l7: {
                        value: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'Deep');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      expect('$ref' in typeInfo).toBe(false);
      if (!('$ref' in typeInfo)) {
        expect(typeInfo.renderHint).not.toBe('truncated');
      }

      // 验证深层属性未被截断
      function findTruncated(info: any): boolean {
        if (info?.renderHint === 'truncated') return true;
        if (info?.properties) {
          return Object.values(info.properties).some((p: any) =>
            findTruncated(p),
          );
        }
        return false;
      }
      expect(findTruncated(typeInfo)).toBe(false);
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

  describe('真实场景 - CrowdSelectionCard Props', () => {
    it('应该正确解析可选对象属性，text 不包含 undefined', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type CrowdSelectionCardDidDrawerProps = {
          initialSubTabProps?: {
            activeKey?: 'customer' | 'privacy' | 'cloud';
            instMorseId?: string;
          };
        };
      `,
      );

      const type = getExportedType(
        project,
        'test.ts',
        'CrowdSelectionCardDidDrawerProps',
      );
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();

      // 递归检查所有 TypeInfo 的 text 字段
      function checkNoUndefinedInText(info: any, path: string = 'root'): void {
        if (!info) return;

        // 检查当前层级的 text
        if ('text' in info && typeof info.text === 'string') {
          expect(info.text).not.toContain('| undefined');
          expect(info.text).not.toContain('undefined |');
        }

        // 递归检查 properties
        if ('properties' in info && info.properties) {
          Object.entries(info.properties).forEach(([key, value]) => {
            checkNoUndefinedInText(value, `${path}.properties.${key}`);
          });
        }

        // 递归检查 unionTypes
        if ('unionTypes' in info && Array.isArray(info.unionTypes)) {
          info.unionTypes.forEach((t: any, index: number) => {
            checkNoUndefinedInText(t, `${path}.unionTypes[${index}]`);
          });
        }

        // 递归检查 elementType
        if ('elementType' in info && info.elementType) {
          checkNoUndefinedInText(info.elementType, `${path}.elementType`);
        }
      }

      checkNoUndefinedInText(typeInfo);
    });

    it('应该为可选属性设置 required: false 或不设置 required 字段', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type TestProps = {
          optional?: string;
          required: string;
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'TestProps');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();
      if (
        'kind' in typeInfo &&
        typeInfo.kind === 'object' &&
        'properties' in typeInfo &&
        typeInfo.properties
      ) {
        const optionalProp = typeInfo.properties.optional;
        const requiredProp = typeInfo.properties.required;

        // 可选属性不应该有 required: true
        if (optionalProp && 'required' in optionalProp) {
          expect(optionalProp.required).not.toBe(true);
        }

        // 必填属性应该有 required: true
        expect(requiredProp).toBeDefined();
        if (requiredProp && 'required' in requiredProp) {
          expect(requiredProp.required).toBe(true);
        }
      }
    });

    it('应该生成不包含 undefined 的缓存 key', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type Status = 'active' | 'inactive' | undefined;
        export type Config = {
          status: Status;
        };
      `,
      );

      const statusType = getExportedType(project, 'test.ts', 'Status');
      parseTypeInfo(statusType!);

      const configType = getExportedType(project, 'test.ts', 'Config');
      parseTypeInfo(configType!);

      const cacheSnapshot = getTypeCacheSnapshot();
      const cacheKeys = Object.keys(cacheSnapshot);

      // 检查所有缓存 key 是否包含 undefined
      cacheKeys.forEach((key) => {
        // 允许 primitive:undefined 这样的 key（这是正常的 undefined 类型）
        if (key === 'primitive:undefined') {
          return;
        }

        // 其他 key 不应该包含 | undefined 模式
        expect(key).not.toMatch(/\|\s*undefined/);
        expect(key).not.toMatch(/undefined\s*\|/);
      });
    });

    it('应该确保 $ref 引用的类型 text 不包含 undefined', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type OptionalField = string | undefined;
        export type Container = {
          field: OptionalField;
        };
      `,
      );

      const containerType = getExportedType(project, 'test.ts', 'Container');
      const containerInfo = parseTypeInfo(containerType!);

      expect(containerInfo).toBeDefined();
      if (
        'kind' in containerInfo &&
        containerInfo.kind === 'object' &&
        'properties' in containerInfo &&
        containerInfo.properties
      ) {
        const fieldProp = containerInfo.properties.field;
        expect(fieldProp).toBeDefined();

        // 如果是引用，检查引用的类型
        if (fieldProp && '$ref' in fieldProp) {
          const cacheSnapshot = getTypeCacheSnapshot();
          const referencedType = cacheSnapshot[fieldProp.$ref];

          expect(referencedType).toBeDefined();
          if (referencedType && 'text' in referencedType) {
            expect(referencedType.text).not.toContain('undefined');
            expect(referencedType.text).toBe('string');
          }
        } else if (fieldProp && 'text' in fieldProp) {
          // 如果是内联类型，直接检查 text
          expect(fieldProp.text).not.toContain('undefined');
        }
      }
    });

    it('应该处理复杂嵌套结构中的 undefined', () => {
      clearTypeCache();
      createTestFile(
        project,
        'test.ts',
        `
        export type ComplexNested = {
          level1?: {
            level2?: {
              status?: 'active' | 'inactive' | undefined;
              values?: (string | undefined)[];
            } | undefined;
          };
        };
      `,
      );

      const type = getExportedType(project, 'test.ts', 'ComplexNested');
      const typeInfo = parseTypeInfo(type!);

      expect(typeInfo).toBeDefined();

      // 递归检查所有层级的联合类型
      function recursiveCheckUnionTypes(
        info: any,
        path: string = 'root',
      ): void {
        if (!info) return;

        // 对于联合类型，检查其 text 字段
        if ('kind' in info && info.kind === 'union' && 'text' in info) {
          // 联合类型的 text 不应包含 | undefined
          if (typeof info.text === 'string') {
            expect(info.text).not.toMatch(/\|\s*undefined/);
            expect(info.text).not.toMatch(/undefined\s*\|/);
          }
        }

        // 递归检查 properties
        if ('properties' in info && info.properties) {
          Object.entries(info.properties).forEach(([key, value]) => {
            recursiveCheckUnionTypes(value, `${path}.properties.${key}`);
          });
        }

        // 递归检查 unionTypes
        if ('unionTypes' in info && Array.isArray(info.unionTypes)) {
          info.unionTypes.forEach((t: any, index: number) => {
            recursiveCheckUnionTypes(t, `${path}.unionTypes[${index}]`);
          });
        }

        // 递归检查 elementType
        if ('elementType' in info && info.elementType) {
          recursiveCheckUnionTypes(info.elementType, `${path}.elementType`);
        }
      }

      recursiveCheckUnionTypes(typeInfo);
    });
  });

  describe('外部包类型与本地类型组成 union 数组', () => {
    it('(ExternalType | string)[] 应保留 union 结构，而非退化为 any[]', () => {
      const externalProject = new Project({
        compilerOptions: {
          target: 99,
          module: 99,
          moduleResolution: 2, // Node10
          strict: true,
          types: [],
        },
        useInMemoryFileSystem: true,
        skipFileDependencyResolution: true,
      });
      clearTypeCache();

      externalProject.createSourceFile(
        'node_modules/fake-external-pkg/index.d.ts',
        `
        export interface ExternalWidget {
          id?: number | string;
          name?: string;
          type?: 'field' | 'container';
          componentProps?: { [key: string]: any };
          children?: ExternalWidget[];
        }
        `,
      );

      externalProject.createSourceFile(
        'test.ts',
        `
        import type { ExternalWidget } from 'fake-external-pkg';
        export type TestProps = {
          /** union 数组：外部类型 + 本地 string */
          widgets?: (ExternalWidget | string)[];
          /** 对照组：纯本地类型 */
          labels?: string[];
        };
        `,
      );

      const sourceFile = externalProject.getSourceFile('test.ts');
      expect(sourceFile).toBeDefined();

      const testType = sourceFile!.getTypeAlias('TestProps');
      expect(testType).toBeDefined();

      const type = testType!.getType();
      const typeInfo = parseTypeInfo(type);

      expect(typeInfo).toBeDefined();
      expect('properties' in typeInfo && typeInfo.kind).toBe('object');

      if (!('properties' in typeInfo) || !typeInfo.properties) return;

      // widgets 应解析为 array，而非 any[]
      const widgets = typeInfo.properties.widgets;
      expect(widgets).toBeDefined();
      if (!widgets || !('kind' in widgets)) return;

      expect(widgets.kind).toBe('array');
      expect(widgets.text).not.toBe('any[]');
      expect(widgets.text).not.toContain('any');

      // elementType 应为 union，包含 string 和 ExternalWidget
      const elementType = (widgets as any).elementType;
      expect(elementType).toBeDefined();
      expect(elementType.kind).not.toBe('primitive');
      expect(elementType.text).not.toBe('any');

      // 对照组：labels 仍然正确解析
      const labels = typeInfo.properties.labels;
      expect(labels).toBeDefined();
      if (labels && 'kind' in labels) {
        expect(labels.kind).toBe('array');
        const labelsElem = (labels as any).elementType;
        // elementType 可能是 $ref（缓存引用）或内联类型
        if (labelsElem && '$ref' in labelsElem) {
          expect(labelsElem.$ref).toContain('string');
        } else if (labelsElem) {
          expect(labelsElem.text).toBe('string');
        }
      }
    });

    it('外部 interface 与 string 的 union 数组元素类型应为 union 而非 primitive', () => {
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

      externalProject.createSourceFile(
        'node_modules/ext-lib/index.d.ts',
        `
        export interface ExtItem {
          id: string;
          value: number;
        }
        `,
      );

      externalProject.createSourceFile(
        'test.ts',
        `
        import type { ExtItem } from 'ext-lib';
        export type ListProps = {
          items: (ExtItem | string | number)[];
        };
        `,
      );

      const sourceFile = externalProject.getSourceFile('test.ts');
      const listType = sourceFile!.getTypeAlias('ListProps')!.getType();
      const typeInfo = parseTypeInfo(listType);

      if (!('properties' in typeInfo) || !typeInfo.properties) return;

      const items = typeInfo.properties.items;
      expect(items).toBeDefined();
      if (!items || !('kind' in items)) return;

      expect(items.kind).toBe('array');

      const elementType = (items as any).elementType;
      expect(elementType).toBeDefined();
      expect(elementType.kind).toBe('union');
      expect(elementType.text).not.toBe('any');

      // union 中应包含 ExtItem（标记为 external）和基本类型
      const unionTypes = elementType.unionTypes as any[];
      expect(unionTypes.length).toBeGreaterThanOrEqual(2);

      const hasExternal = unionTypes.some(
        (t: any) =>
          ('renderHint' in t && t.renderHint === 'external') ||
          ('$ref' in t),
      );
      const hasString = unionTypes.some(
        (t: any) => ('text' in t && t.text === 'string') || '$ref' in t,
      );
      expect(hasExternal).toBe(true);
      expect(hasString).toBe(true);
    });
  });
});
