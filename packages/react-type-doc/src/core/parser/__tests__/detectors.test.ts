import { describe, it, expect, beforeEach } from 'vitest';
import { parseTypeInfo, clearTypeCache } from '..';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../__tests__/helpers/testUtils';
import type { Project } from 'ts-morph';

describe('类型检测', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    clearTypeCache();
  });

  describe('特殊类型', () => {
    it('Partial', () => {
      createTestFile(
        project,
        'test.ts',
        `export type Original = { a: string; b: number }; export type PartialType = Partial<Original>;`,
      );
      const type = getExportedType(project, 'test.ts', 'PartialType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
    });

    it('Required', () => {
      createTestFile(
        project,
        'test.ts',
        `export type Original = { a?: string; b?: number }; export type RequiredType = Required<Original>;`,
      );
      const type = getExportedType(project, 'test.ts', 'RequiredType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
    });

    it('Pick', () => {
      createTestFile(
        project,
        'test.ts',
        `export type Original = { a: string; b: number; c: boolean }; export type PickedType = Pick<Original, 'a' | 'b'>;`,
      );
      const type = getExportedType(project, 'test.ts', 'PickedType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
    });

    it('Omit', () => {
      createTestFile(
        project,
        'test.ts',
        `export type Original = { a: string; b: number; c: boolean }; export type OmittedType = Omit<Original, 'c'>;`,
      );
      const type = getExportedType(project, 'test.ts', 'OmittedType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
    });

    it('Record', () => {
      createTestFile(
        project,
        'test.ts',
        `export type RecordType = Record<string, number>;`,
      );
      const type = getExportedType(project, 'test.ts', 'RecordType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
    });

    it('Exclude', () => {
      createTestFile(
        project,
        'test.ts',
        `export type ExcludedType = Exclude<'a' | 'b' | 'c', 'c'>;`,
      );
      const type = getExportedType(project, 'test.ts', 'ExcludedType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
    });

    it('Extract', () => {
      createTestFile(
        project,
        'test.ts',
        `export type ExtractedType = Extract<'a' | 'b' | 'c', 'a' | 'b'>;`,
      );
      const type = getExportedType(project, 'test.ts', 'ExtractedType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
    });
  });

  describe('内置类型识别', () => {
    it('Array<string>', () => {
      createTestFile(
        project,
        'test.ts',
        `export type ArrayType = Array<string>;`,
      );
      const type = getExportedType(project, 'test.ts', 'ArrayType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('kind' in result && result.kind).toBe('array');
      expect('elementType' in result && result.elementType).toBeDefined();
    });

    it('Array<对象>', () => {
      createTestFile(
        project,
        'test.ts',
        `export type ArrayType = Array<{ id: string; name: string }>;`,
      );
      const type = getExportedType(project, 'test.ts', 'ArrayType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('kind' in result && result.kind).toBe('array');
      expect('elementType' in result && result.elementType).toBeDefined();
      const element = 'elementType' in result ? result.elementType : null;
      expect(element).toBeDefined();
      expect(element && 'kind' in element && element.kind).toBe('object');
    });

    it('Map', () => {
      createTestFile(
        project,
        'test.ts',
        `export type MapType = Map<string, number>;`,
      );
      const type = getExportedType(project, 'test.ts', 'MapType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('renderHint' in result && result.renderHint).toBe('builtin');
    });

    it('Set', () => {
      createTestFile(project, 'test.ts', `export type SetType = Set<string>;`);
      const type = getExportedType(project, 'test.ts', 'SetType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('renderHint' in result && result.renderHint).toBe('builtin');
    });

    it('Date', () => {
      createTestFile(project, 'test.ts', `export type DateType = Date;`);
      const type = getExportedType(project, 'test.ts', 'DateType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('renderHint' in result && result.renderHint).toBe('builtin');
    });

    it('RegExp', () => {
      createTestFile(project, 'test.ts', `export type RegExpType = RegExp;`);
      const type = getExportedType(project, 'test.ts', 'RegExpType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('renderHint' in result && result.renderHint).toBe('builtin');
    });

    it('Error', () => {
      createTestFile(project, 'test.ts', `export type ErrorType = Error;`);
      const type = getExportedType(project, 'test.ts', 'ErrorType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('renderHint' in result && result.renderHint).toBe('builtin');
    });
  });

  describe('React 特定类型', () => {
    it('React.FC', () => {
      createTestFile(
        project,
        'test.tsx',
        `import React from 'react'; export type ComponentType = React.FC<{ name: string }>;`,
      );
      const type = getExportedType(project, 'test.tsx', 'ComponentType');
      if (type) {
        const result = parseTypeInfo(type);
        expect(result).toBeDefined();
      }
    });
  });

  describe('泛型类型属性排除', () => {
    it('含未实例化泛型参数的 Partial<T> 不应输出 properties', () => {
      createTestFile(
        project,
        'test.ts',
        `export interface Wrapper<T> { partial: Partial<T>; }`,
      );
      const type = getExportedType(project, 'test.ts', 'Wrapper');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('properties' in result && result.properties).toBeDefined();
      const props = 'properties' in result ? result.properties : undefined;
      const partial = props?.partial;
      expect(partial).toBeDefined();
      expect(partial && 'kind' in partial && partial.kind).toBe('object');
      expect(partial && 'isGeneric' in partial && partial.isGeneric).toBe(true);
      expect(partial && 'properties' in partial).toBeDefined();
      expect(
        partial && 'properties' in partial ? partial.properties : undefined,
      ).toBeUndefined();
    });

    it('已实例化的 Partial<User> 应保留 properties', () => {
      createTestFile(
        project,
        'test.ts',
        `interface User { id: number; name: string; } export type PartialUser = Partial<User>;`,
      );
      const type = getExportedType(project, 'test.ts', 'PartialUser');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect(
        'isGeneric' in result ? result.isGeneric : undefined,
      ).toBeUndefined();
      expect('properties' in result && result.properties).toBeDefined();
    });
  });

  describe('自定义泛型类型保留属性', () => {
    it('Box<T> 应保留 value 属性', () => {
      createTestFile(
        project,
        'test.ts',
        `export interface Box<T> { value: T; }`,
      );
      const type = getExportedType(project, 'test.ts', 'Box');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect('isGeneric' in result && result.isGeneric).toBe(true);
      expect('properties' in result && result.properties).toBeDefined();
      const props = 'properties' in result ? result.properties : undefined;
      expect(props?.value).toBeDefined();
    });
  });

  describe('外部库类型别名保留', () => {
    it('node_modules 中定义的复杂类型别名应标记为 external', () => {
      const extProject = createTestProject();
      clearTypeCache();
      createTestFile(
        extProject,
        '/node_modules/mylib/index.d.ts',
        `export type ExternalConfig = { host: string; port: number; ssl: boolean }; export interface Wrapper { config: ExternalConfig; }`,
      );
      const sourceFile = extProject.getSourceFile(
        '/node_modules/mylib/index.d.ts',
      );
      expect(sourceFile).toBeDefined();
      const wrapperInterface = sourceFile!.getInterface('Wrapper');
      expect(wrapperInterface).toBeDefined();
      const wrapperType = wrapperInterface!.getType();
      const configProp = wrapperType.getProperty('config');
      expect(configProp).toBeDefined();
      const configDecl = configProp!.getDeclarations()[0];
      const configType = configProp!.getTypeAtLocation(configDecl!);
      const aliasSymbol = configType.getAliasSymbol();
      if (aliasSymbol) {
        const parsed = parseTypeInfo(configType);
        expect(parsed).toBeDefined();
        expect('renderHint' in parsed && parsed.renderHint).toBe('external');
        expect('text' in parsed && parsed.text).toBe('ExternalConfig');
      }
    });

    it('non node_modules', () => {
      createTestFile(
        project,
        'test.ts',
        `export type LocalType = string | number;`,
      );
      const type = getExportedType(project, 'test.ts', 'LocalType');
      expect(type).toBeDefined();
      const result = parseTypeInfo(type!);
      expect(result).toBeDefined();
      expect(
        'renderHint' in result ? result.renderHint : undefined,
      ).toBeUndefined();
    });
  });
});
