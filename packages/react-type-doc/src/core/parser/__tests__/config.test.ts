import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseTypeInfo,
  clearTypeCache,
  getTypeCacheSize,
  initParseOptions,
  getTypeCacheSnapshot,
  createEmptyTypeInfo,
} from '..';
import {
  createTestProject,
  createTestFile,
  getExportedType,
} from '../../../__tests__/helpers/testUtils';
import type { Project } from 'ts-morph';

describe('配置和缓存管理', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    clearTypeCache();
  });

  describe('initParseOptions', () => {
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
  });

  describe('clearTypeCache', () => {
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
  });

  describe('getTypeCacheSize', () => {
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
  });

  describe('getTypeCacheSnapshot', () => {
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
});
