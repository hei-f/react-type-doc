/**
 * 测试包含冒号的字符串字面量处理
 * 验证 unionParser 能否正确处理值中包含冒号的字符串字面量
 */

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
import type { TypeInfo } from '../../../shared/types';

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
    expect(typeInfo.kind).toBe('literal');
    expect(typeInfo.text).toBe('"https://example.com"');
  });

  it('应该正确处理包含多个冒号的字符串字面量', () => {
    createTestFile(project, 'test.ts', `export type TimeLiteral = "12:30:45";`);

    const type = getExportedType(project, 'test.ts', 'TimeLiteral');
    expect(type).toBeDefined();

    const typeInfo = parseTypeInfo(type!);
    expect(typeInfo.kind).toBe('literal');
    expect(typeInfo.text).toBe('"12:30:45"');
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
    expect(typeInfo.kind).toBe('literal');
    expect(typeInfo.text).toBe('"key:value:extra"');
  });

  it('simplifyOptionalUnion 应该正确处理包含冒号的字面量缓存引用', () => {
    // 模拟包含字面量缓存引用的联合类型
    const mockUnionWithColonLiteral: TypeInfo = {
      kind: 'union',
      text: '"https://example.com" | "http://test.com"',
      types: [
        { $ref: 'literal:string:https://example.com' },
        { $ref: 'literal:string:http://test.com' },
      ],
    };

    const result = simplifyOptionalUnion(mockUnionWithColonLiteral);

    // 验证文本格式正确提取了包含冒号的值
    expect(result.text).toContain('https://example.com');
    expect(result.text).toContain('http://test.com');
    // 确保冒号没有被错误截断
    expect(result.text).not.toContain('literal:string:');
  });

  it('simplifyOptionalUnion 应该正确处理包含多个冒号的字面量', () => {
    const mockUnionWithMultipleColons: TypeInfo = {
      kind: 'union',
      text: '"12:30:45" | "23:59:59"',
      types: [
        { $ref: 'literal:string:12:30:45' },
        { $ref: 'literal:string:23:59:59' },
      ],
    };

    const result = simplifyOptionalUnion(mockUnionWithMultipleColons);

    expect(result.text).toContain('12:30:45');
    expect(result.text).toContain('23:59:59');
  });
});
