/**
 * 缓存管理单元测试
 * 测试 getCacheKey 函数对字面量类型的处理
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getCacheKey, clearTypeCache } from '../cache';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../__tests__/helpers/testUtils';
import type { Project } from 'ts-morph';

describe('cache - getCacheKey', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    clearTypeCache();
  });

  describe('字面量类型 Key 生成', () => {
    it('应该为字符串字面量生成正确的 key', () => {
      createTestFile(
        project,
        'test.ts',
        `export type StringLiteral = "BasicInfoConfirm";`,
      );

      const type = getExportedType(project, 'test.ts', 'StringLiteral');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toBe('literal:string:BasicInfoConfirm');
    });

    it('应该为数字字面量生成正确的 key', () => {
      createTestFile(project, 'test.ts', `export type NumberLiteral = 42;`);

      const type = getExportedType(project, 'test.ts', 'NumberLiteral');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toBe('literal:number:42');
    });

    it('应该为布尔字面量 true 生成正确的 key', () => {
      createTestFile(project, 'test.ts', `export type TrueLiteral = true;`);

      const type = getExportedType(project, 'test.ts', 'TrueLiteral');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toBe('literal:boolean:true');
    });

    it('应该为布尔字面量 false 生成正确的 key', () => {
      createTestFile(project, 'test.ts', `export type FalseLiteral = false;`);

      const type = getExportedType(project, 'test.ts', 'FalseLiteral');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toBe('literal:boolean:false');
    });

    it('应该为带单引号的字符串字面量生成正确的 key', () => {
      createTestFile(
        project,
        'test.ts',
        `export type SingleQuoteLiteral = 'hello';`,
      );

      const type = getExportedType(project, 'test.ts', 'SingleQuoteLiteral');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toBe('literal:string:hello');
    });

    it('应该为负数字面量生成正确的 key', () => {
      createTestFile(project, 'test.ts', `export type NegativeLiteral = -100;`);

      const type = getExportedType(project, 'test.ts', 'NegativeLiteral');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toBe('literal:number:-100');
    });
  });

  describe('其他类型不受影响', () => {
    it('基础类型应该使用 primitive: 前缀', () => {
      createTestFile(project, 'test.ts', `export type StringType = string;`);

      const type = getExportedType(project, 'test.ts', 'StringType');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toBe('primitive:string');
    });

    it('对象类型应该使用 text: 前缀', () => {
      createTestFile(
        project,
        'test.ts',
        `export type ObjectType = { a: string };`,
      );

      const type = getExportedType(project, 'test.ts', 'ObjectType');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toMatch(/^text:/);
    });

    it('数组类型应该返回 null（不缓存）', () => {
      createTestFile(project, 'test.ts', `export type ArrayType = string[];`);

      const type = getExportedType(project, 'test.ts', 'ArrayType');
      expect(type).toBeDefined();

      const typeText = type!.getText();
      const key = getCacheKey(type!, typeText);

      expect(key).toBeNull();
    });
  });

  describe('联合类型中的字面量', () => {
    it('应该为联合类型中的每个字面量生成独立的 key', () => {
      createTestFile(
        project,
        'test.ts',
        `export type UnionLiteral = "a" | "b" | "c";`,
      );

      const type = getExportedType(project, 'test.ts', 'UnionLiteral');
      expect(type).toBeDefined();

      // 联合类型本身不会被缓存为字面量，但其成员会
      const unionTypes = type!.getUnionTypes();
      expect(unionTypes.length).toBe(3);

      unionTypes.forEach((memberType) => {
        const memberText = memberType.getText();
        const memberKey = getCacheKey(memberType, memberText);
        expect(memberKey).toMatch(/^literal:string:/);
      });
    });
  });

  describe('缓存一致性', () => {
    it('相同的字面量类型应该生成相同的 key', () => {
      createTestFile(
        project,
        'test.ts',
        `
        export type Literal1 = "test";
        export type Literal2 = "test";
        `,
      );

      const type1 = getExportedType(project, 'test.ts', 'Literal1');
      const type2 = getExportedType(project, 'test.ts', 'Literal2');

      expect(type1).toBeDefined();
      expect(type2).toBeDefined();

      const key1 = getCacheKey(type1!, type1!.getText());
      const key2 = getCacheKey(type2!, type2!.getText());

      expect(key1).toBe(key2);
      expect(key1).toBe('literal:string:test');
    });
  });
});
