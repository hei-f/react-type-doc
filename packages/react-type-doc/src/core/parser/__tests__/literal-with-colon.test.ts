/**
 * 测试包含冒号的字符串字面量处理
 * 验证 unionParser 能否正确处理值中包含冒号的字符串字面量
 */
// @vitest-environment node

import { describe, it, expect, beforeEach } from 'vitest';
import { parseTypeInfo } from '../index';
import { simplifyOptionalUnion } from '../parsers/unionParser';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../__tests__/helpers/testUtils';
import type { Project } from 'ts-morph';
import { clearTypeCache } from '../cache';
import type { FullTypeInfo } from '../../../shared/types';

describe('字符串字面量包含冒号', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    clearTypeCache();
  });

  it('应该正确处理包含冒号的字符串字面量', () => {
    createTestFile(
      project,
      'test.ts',
      `export type UrlLiteral = "https://example.com";`,
    );

    const type = getExportedType(project, 'test.ts', 'UrlLiteral');
    expect(type).toBeDefined();

    const typeInfo = parseTypeInfo(type!);
    expect(typeInfo).toMatchObject({
      kind: 'literal',
      text: '"https://example.com"',
    });
  });

  it('应该正确处理包含多个冒号的字符串字面量', () => {
    createTestFile(project, 'test.ts', `export type TimeLiteral = "12:30:45";`);

    const type = getExportedType(project, 'test.ts', 'TimeLiteral');
    expect(type).toBeDefined();

    const typeInfo = parseTypeInfo(type!);
    expect(typeInfo).toMatchObject({
      kind: 'literal',
      text: '"12:30:45"',
    });
  });

  it('应该正确处理键值对格式的字符串字面量', () => {
    createTestFile(
      project,
      'test.ts',
      `export type KeyValueLiteral = "key:value:extra";`,
    );

    const type = getExportedType(project, 'test.ts', 'KeyValueLiteral');
    expect(type).toBeDefined();

    const typeInfo = parseTypeInfo(type!);
    expect(typeInfo).toMatchObject({
      kind: 'literal',
      text: '"key:value:extra"',
    });
  });

  it('simplifyOptionalUnion 应该正确处理包含冒号的字面量缓存引用', () => {
    // 模拟包含字面量缓存引用的联合类型
    const mockUnionWithColonLiteral: FullTypeInfo = {
      kind: 'union',
      text: '"https://example.com" | "http://test.com"',
      unionTypes: [
        { $ref: 'literal:string:https://example.com' },
        { $ref: 'literal:string:http://test.com' },
      ],
    };

    const result = simplifyOptionalUnion(
      mockUnionWithColonLiteral,
    ) as FullTypeInfo;

    // 验证文本格式正确提取了包含冒号的值
    expect(result).toMatchObject({
      text: expect.stringContaining('https://example.com'),
    });
    expect(result).toMatchObject({
      text: expect.stringContaining('http://test.com'),
    });
    // 确保冒号没有被错误截断
    expect(result).toMatchObject({
      text: expect.not.stringContaining('literal:string:'),
    });
  });

  it('simplifyOptionalUnion 应该正确处理包含多个冒号的字面量', () => {
    const mockUnionWithMultipleColons: FullTypeInfo = {
      kind: 'union',
      text: '"12:30:45" | "23:59:59"',
      unionTypes: [
        { $ref: 'literal:string:12:30:45' },
        { $ref: 'literal:string:23:59:59' },
      ],
    };

    const result = simplifyOptionalUnion(
      mockUnionWithMultipleColons,
    ) as FullTypeInfo;

    expect(result).toMatchObject({
      text: expect.stringContaining('12:30:45'),
    });
    expect(result).toMatchObject({
      text: expect.stringContaining('23:59:59'),
    });
  });
});
