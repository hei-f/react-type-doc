/**
 * helpers 工具函数单元测试
 * 测试 extractLiteralValue 和 getLiteralTypeCategory 函数
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractLiteralValue,
  getLiteralTypeCategory,
  removeUndefinedFromText,
} from '../helpers';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../../__tests__/helpers/testUtils';
import type { Project } from 'ts-morph';

describe('helpers - extractLiteralValue', () => {
  it('应该从双引号字符串字面量中提取值', () => {
    expect(extractLiteralValue('"hello"')).toBe('hello');
    expect(extractLiteralValue('"BasicInfoConfirm"')).toBe('BasicInfoConfirm');
    expect(extractLiteralValue('"123"')).toBe('123');
  });

  it('应该从单引号字符串字面量中提取值', () => {
    expect(extractLiteralValue("'world'")).toBe('world');
    expect(extractLiteralValue("'test'")).toBe('test');
  });

  it('应该处理空字符串字面量', () => {
    expect(extractLiteralValue('""')).toBe('');
    expect(extractLiteralValue("''")).toBe('');
  });

  it('应该直接返回数字字面量（无引号）', () => {
    expect(extractLiteralValue('42')).toBe('42');
    expect(extractLiteralValue('-100')).toBe('-100');
    expect(extractLiteralValue('3.14')).toBe('3.14');
  });

  it('应该直接返回布尔字面量（无引号）', () => {
    expect(extractLiteralValue('true')).toBe('true');
    expect(extractLiteralValue('false')).toBe('false');
  });

  it('应该处理包含特殊字符的字符串', () => {
    expect(extractLiteralValue('"hello world"')).toBe('hello world');
    expect(extractLiteralValue('"a-b-c"')).toBe('a-b-c');
    expect(extractLiteralValue('"test_value"')).toBe('test_value');
  });

  it('应该处理包含转义字符的字符串', () => {
    // 注意：这里测试的是 typeText，不是 JavaScript 字符串的转义
    expect(extractLiteralValue('"Hello \\"World\\""')).toBe(
      'Hello \\"World\\"',
    );
  });

  it('应该处理不匹配的引号（不移除）', () => {
    expect(extractLiteralValue('"hello\'')).toBe('"hello\'');
    expect(extractLiteralValue('\'world"')).toBe('\'world"');
  });
});

describe('helpers - getLiteralTypeCategory', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
  });

  it('应该识别字符串字面量类型', () => {
    createTestFile(project, 'test.ts', `export type StringLiteral = "hello";`);

    const type = getExportedType(project, 'test.ts', 'StringLiteral');
    expect(type).toBeDefined();

    const category = getLiteralTypeCategory(type!);
    expect(category).toBe('string');
  });

  it('应该识别数字字面量类型', () => {
    createTestFile(project, 'test.ts', `export type NumberLiteral = 42;`);

    const type = getExportedType(project, 'test.ts', 'NumberLiteral');
    expect(type).toBeDefined();

    const category = getLiteralTypeCategory(type!);
    expect(category).toBe('number');
  });

  it('应该识别布尔字面量类型 true', () => {
    createTestFile(project, 'test.ts', `export type TrueLiteral = true;`);

    const type = getExportedType(project, 'test.ts', 'TrueLiteral');
    expect(type).toBeDefined();

    const category = getLiteralTypeCategory(type!);
    expect(category).toBe('boolean');
  });

  it('应该识别布尔字面量类型 false', () => {
    createTestFile(project, 'test.ts', `export type FalseLiteral = false;`);

    const type = getExportedType(project, 'test.ts', 'FalseLiteral');
    expect(type).toBeDefined();

    const category = getLiteralTypeCategory(type!);
    expect(category).toBe('boolean');
  });

  it('应该对非字面量类型返回 null', () => {
    createTestFile(
      project,
      'test.ts',
      `
      export type StringType = string;
      export type NumberType = number;
      export type ObjectType = { a: string };
      `,
    );

    const stringType = getExportedType(project, 'test.ts', 'StringType');
    const numberType = getExportedType(project, 'test.ts', 'NumberType');
    const objectType = getExportedType(project, 'test.ts', 'ObjectType');

    expect(getLiteralTypeCategory(stringType!)).toBeNull();
    expect(getLiteralTypeCategory(numberType!)).toBeNull();
    expect(getLiteralTypeCategory(objectType!)).toBeNull();
  });

  it('应该识别负数字面量', () => {
    createTestFile(project, 'test.ts', `export type NegativeLiteral = -100;`);

    const type = getExportedType(project, 'test.ts', 'NegativeLiteral');
    expect(type).toBeDefined();

    const category = getLiteralTypeCategory(type!);
    expect(category).toBe('number');
  });

  it('应该识别浮点数字面量', () => {
    createTestFile(project, 'test.ts', `export type FloatLiteral = 3.14;`);

    const type = getExportedType(project, 'test.ts', 'FloatLiteral');
    expect(type).toBeDefined();

    const category = getLiteralTypeCategory(type!);
    expect(category).toBe('number');
  });

  it('应该处理单引号字符串字面量', () => {
    createTestFile(
      project,
      'test.ts',
      `export type SingleQuoteLiteral = 'world';`,
    );

    const type = getExportedType(project, 'test.ts', 'SingleQuoteLiteral');
    expect(type).toBeDefined();

    const category = getLiteralTypeCategory(type!);
    expect(category).toBe('string');
  });
});

describe('helpers - 集成测试', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
  });

  it('extractLiteralValue 和 getLiteralTypeCategory 应该协同工作', () => {
    createTestFile(project, 'test.ts', `export type TestLiteral = "MyValue";`);

    const type = getExportedType(project, 'test.ts', 'TestLiteral');
    expect(type).toBeDefined();

    const category = getLiteralTypeCategory(type!);
    const typeText = type!.getText();
    const value = extractLiteralValue(typeText);

    expect(category).toBe('string');
    expect(value).toBe('MyValue');
  });
});

describe('removeUndefinedFromText', () => {
  it('应该移除类型文本末尾的 | undefined', () => {
    const result = removeUndefinedFromText('string | undefined');
    expect(result).toBe('string');
  });

  it('应该移除类型文本开头的 undefined |', () => {
    const result = removeUndefinedFromText('undefined | string');
    expect(result).toBe('string');
  });

  it('应该移除类型文本中间的 | undefined |', () => {
    const result = removeUndefinedFromText('a | undefined | b');
    expect(result).toBe('a | b');
  });

  it('应该保留单独的 undefined', () => {
    const result = removeUndefinedFromText('undefined');
    expect(result).toBe('undefined');
  });

  it('应该保持不包含 undefined 的文本不变', () => {
    const result = removeUndefinedFromText('string');
    expect(result).toBe('string');
  });

  it('应该处理嵌套对象中的 undefined', () => {
    // removeUndefinedFromText 只处理顶层的类型文本，不递归处理嵌套结构
    // 对于 '{ a?: string | undefined }'，它不会改变内部的 '| undefined'
    // 实际的嵌套处理由 parser 在解析时完成
    const result = removeUndefinedFromText('{ a?: string | undefined }');
    expect(result).toBe('{ a?: string | undefined }');

    // 但对于顶层的 undefined，应该能正确移除
    const topLevel = removeUndefinedFromText('{ a: string } | undefined');
    expect(topLevel).toBe('{ a: string }');
  });

  it('应该正确清理多余空格', () => {
    const result = removeUndefinedFromText('string  |  undefined');
    expect(result).toBe('string');
  });

  it('应该处理复杂联合类型', () => {
    const result = removeUndefinedFromText(
      '"customer" | "privacy" | "cloud" | undefined',
    );
    expect(result).toBe('"customer" | "privacy" | "cloud"');
  });

  it('应该处理多个undefined的情况', () => {
    const result = removeUndefinedFromText('undefined | string | undefined');
    expect(result).toBe('string');
  });

  it('应该处理带空格的undefined', () => {
    const result = removeUndefinedFromText('  undefined  |  string  ');
    expect(result).toBe('string');
  });
});
