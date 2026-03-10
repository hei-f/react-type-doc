import { describe, it, expect, beforeEach } from 'vitest';
import { clearTypeCache, getTypeKind } from '..';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../__tests__/helpers/testUtils';
import type { Project } from 'ts-morph';

describe('getTypeKind', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    clearTypeCache();
  });

  it('应该正确识别基础类型', () => {
    createTestFile(
      project,
      'test.ts',
      `export type StringType = string; export type NumberType = number; export type BooleanType = boolean;`,
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
    createTestFile(project, 'test.ts', `export type ArrayType = string[];`);
    const arrayType = getExportedType(project, 'test.ts', 'ArrayType');
    expect(arrayType).toBeDefined();
    expect(getTypeKind(arrayType!)).toBe('array');
  });

  it('应该正确识别联合类型', () => {
    createTestFile(
      project,
      'test.ts',
      `export type UnionType = string | number;`,
    );
    const unionType = getExportedType(project, 'test.ts', 'UnionType');
    expect(unionType).toBeDefined();
    expect(getTypeKind(unionType!)).toBe('union');
  });

  it('应该正确识别枚举类型（字面量联合）', () => {
    createTestFile(
      project,
      'test.ts',
      `export type EnumType = 'a' | 'b' | 'c';`,
    );
    const enumType = getExportedType(project, 'test.ts', 'EnumType');
    expect(enumType).toBeDefined();
    expect(getTypeKind(enumType!)).toBe('enum');
  });

  it('应该正确识别对象类型', () => {
    createTestFile(
      project,
      'test.ts',
      `export type ObjectType = { a: string; b: number };`,
    );
    const objectType = getExportedType(project, 'test.ts', 'ObjectType');
    expect(objectType).toBeDefined();
    expect(getTypeKind(objectType!)).toBe('object');
  });

  it('应该正确识别函数类型', () => {
    createTestFile(
      project,
      'test.ts',
      `export type FunctionType = () => void;`,
    );
    const functionType = getExportedType(project, 'test.ts', 'FunctionType');
    expect(functionType).toBeDefined();
    expect(getTypeKind(functionType!)).toBe('function');
  });
});
