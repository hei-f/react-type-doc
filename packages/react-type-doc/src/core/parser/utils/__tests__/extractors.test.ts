/**
 * extractors 工具函数单元测试
 */

import { describe, expect, it } from 'vitest';
import type { Type } from 'ts-morph';
import {
  buildGenericDisplayName,
  extractGenericParametersFromDeclaration,
  extractGenericParametersFromTypeParameters,
  getMappedTypeValueType,
  resolveDescriptionLinks,
} from '../extractors';
import {
  createTestProject,
  createTestFile,
  getFunctionParamType,
} from '../../../../__tests__/helpers/testUtils';

describe('extractGenericParametersFromTypeParameters', () => {
  it('应该保留名称、约束和默认值', () => {
    const typeParameters = [
      {
        getText: () => 'T',
        getStructure: () => ({ name: 'T' }),
        getConstraint: () => ({ getText: () => 'object' }),
        getDefault: () => ({ getText: () => 'unknown' }),
      },
      {
        getText: () => 'E',
        getConstraint: () => ({ getText: () => 'Error' }),
        getDefault: () => ({ getText: () => 'Error' }),
      },
    ] as Parameters<typeof extractGenericParametersFromTypeParameters>[0];

    expect(extractGenericParametersFromTypeParameters(typeParameters)).toEqual([
      {
        name: 'T',
        constraint: 'object',
        default: 'unknown',
      },
      {
        name: 'E',
        constraint: 'Error',
        default: 'Error',
      },
    ]);
  });
});

describe('extractGenericParametersFromDeclaration', () => {
  it('应该从声明节点提取结构化泛型参数', () => {
    const project = createTestProject();
    createTestFile(
      project,
      'test.ts',
      `
      export interface Response<T = unknown, E extends Error = Error> {}
    `,
    );

    const declaration = project
      .getSourceFileOrThrow('test.ts')
      .getInterfaceOrThrow('Response');

    expect(extractGenericParametersFromDeclaration(declaration)).toEqual([
      {
        name: 'T',
        default: 'unknown',
      },
      {
        name: 'E',
        constraint: 'Error',
        default: 'Error',
      },
    ]);

    expect(buildGenericDisplayName(declaration.getType())).toBe(
      'Response<T = unknown, E extends Error = Error>',
    );
  });
});

describe('resolveDescriptionLinks', () => {
  it('应该解析本地和导入的类型链接，并忽略普通文本', () => {
    const project = createTestProject();
    createTestFile(
      project,
      'button.ts',
      `
      export interface Button {
        label: string;
      }
    `,
    );
    createTestFile(
      project,
      'props.ts',
      `
      import type { Button } from './button';

      /**
       * See {@link Button}
       */
      export interface Props {}
    `,
    );

    const declaration = project
      .getSourceFileOrThrow('props.ts')
      .getInterfaceOrThrow('Props');

    expect(resolveDescriptionLinks('See {@link Button}', declaration)).toEqual({
      Button: expect.any(String),
    });
    expect(
      resolveDescriptionLinks('Plain text only', declaration),
    ).toBeUndefined();
  });

  it('应该在找不到引用时返回 undefined', () => {
    const project = createTestProject();
    createTestFile(
      project,
      'props.ts',
      `
      export interface Props {}
    `,
    );

    const declaration = project
      .getSourceFileOrThrow('props.ts')
      .getInterfaceOrThrow('Props');

    expect(
      resolveDescriptionLinks('See {@link Missing}', declaration),
    ).toBeUndefined();
  });
});

describe('getMappedTypeValueType', () => {
  it('应该提取 Record 和嵌套 Partial<Record> 的值类型', () => {
    const project = createTestProject();
    createTestFile(
      project,
      'test.ts',
      `
      export function takeDirectRecord(value: Record<string, number>) {
        return value;
      }

      export function takeNestedRecord(
        value: Partial<Record<string, number>>,
      ) {
        return value;
      }

      export function takePlainObject(value: { name: string }) {
        return value;
      }
    `,
    );

    const directRecord = getFunctionParamType(
      project,
      'test.ts',
      'takeDirectRecord',
    );
    const nestedRecord = getFunctionParamType(
      project,
      'test.ts',
      'takeNestedRecord',
    );
    const plainObject = getFunctionParamType(
      project,
      'test.ts',
      'takePlainObject',
    );

    expect(directRecord).toBeDefined();
    expect(nestedRecord).toBeDefined();
    expect(plainObject).toBeDefined();

    if (!directRecord || !nestedRecord || !plainObject) {
      throw new Error('Expected parameter types to be defined');
    }

    expect(getMappedTypeValueType(directRecord)?.getText()).toBe('number');
    expect(getMappedTypeValueType(nestedRecord)?.getText()).toBe('number');
    expect(getMappedTypeValueType(plainObject)).toBeUndefined();
  });

  it('应该在类型访问异常时返回 undefined', () => {
    const brokenType = {
      getAliasTypeArguments: () => {
        throw new Error('broken alias');
      },
      getAliasSymbol: () => ({ getName: () => 'Broken' }),
    } as unknown as Type;

    expect(getMappedTypeValueType(brokenType)).toBeUndefined();
  });
});
