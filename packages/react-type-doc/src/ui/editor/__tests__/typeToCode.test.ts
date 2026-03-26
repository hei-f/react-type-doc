/**
 * typeToCode 函数单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  typeInfoToCode,
  typeInfoToCodeWithMeta,
  getClickableRanges,
  simplifyOptionalTupleMemberSyntax,
} from '../typeToCode';
import { PropsDocReader } from '../../../runtime/reader';
import type { OutputResult, TypeInfo } from '../../../shared/types';

describe('typeInfoToCode', () => {
  it('should convert simple object type to interface code', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Button: {
          kind: 'object',
          text: 'Button',
          properties: {
            size: {
              kind: 'union',
              text: '"small" | "large"',
              unionTypes: [
                { kind: 'primitive', text: '"small"' },
                { kind: 'primitive', text: '"large"' },
              ],
              required: true,
            },
            disabled: {
              kind: 'primitive',
              text: 'boolean',
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Button')!;
    const code = typeInfoToCode(typeInfo, reader, 'Button');

    expect(code).toContain('interface Button {');
    expect(code).toContain('size:');
    expect(code).toContain('disabled: boolean;');
    expect(code).toContain('}');
  });

  it('should render structured generic parameters on object declarations', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        UserResponse: {
          kind: 'object',
          text: 'Response<{ id: string }, { code: number }>',
          name: 'Response< { id: string }, { code: number } >',
          genericParameters: [
            { name: 'T', default: 'unknown' },
            { name: 'E', default: 'Error' },
          ],
          properties: {
            data: {
              kind: 'object',
              text: '{ id: string }',
              required: true,
              properties: {
                id: {
                  kind: 'primitive',
                  text: 'string',
                  required: true,
                },
              },
            },
            error: {
              kind: 'object',
              text: '{ code: number }',
              required: true,
              properties: {
                code: {
                  kind: 'primitive',
                  text: 'number',
                  required: true,
                },
              },
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('UserResponse')!;
    const code = typeInfoToCode(
      typeInfo,
      reader,
      reader.getDisplayName(typeInfo, 'UserResponse'),
    );

    expect(code).toContain('interface Response<T = unknown, E = Error> {');
    expect(code).toContain('data:');
    expect(code).toContain('error:');
  });

  it('should handle optional properties with ? mark', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            required: {
              kind: 'primitive',
              text: 'string',
              required: true,
            },
            optional: {
              kind: 'primitive',
              text: 'number',
              required: false,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('required: string;');
    expect(code).toContain('optional?: number;');
  });

  it('should handle union types at root level', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Status: {
          kind: 'union',
          text: '"success" | "error" | "loading"',
          unionTypes: [
            { kind: 'primitive', text: '"success"' },
            { kind: 'primitive', text: '"error"' },
            { kind: 'primitive', text: '"loading"' },
          ],
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Status')!;
    const code = typeInfoToCode(typeInfo, reader, 'Status');

    expect(code).toContain('type Status =');
    expect(code).toContain('|');
    expect(code).toContain('"success"');
    expect(code).toContain('"error"');
    expect(code).toContain('"loading"');
  });

  it('should handle array types', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            items: {
              kind: 'array',
              text: 'string[]',
              elementType: {
                kind: 'primitive',
                text: 'string',
              },
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('items:');
    expect(code).toContain('[]');
  });

  it('should keep function signature generics off declaration heads', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        GenericFunc: {
          kind: 'function',
          text: '<T>(value: T) => T',
          signatures: [
            {
              parameters: [
                {
                  name: 'value',
                  type: { kind: 'primitive', text: 'T' },
                },
              ],
              returnType: { kind: 'primitive', text: 'T' },
              genericParameters: [{ name: 'T' }],
              typeParameters: ['T'],
            },
          ],
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('GenericFunc')!;
    const code = typeInfoToCode(typeInfo, reader, 'GenericFunc');

    expect(code).toContain('type GenericFunc = <T>(value: T) => T;');
  });

  it('should render generic function declaration heads from root metadata', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        GenericAlias: {
          kind: 'function',
          text: '(value: T) => T',
          genericParameters: [{ name: 'T' }],
          signatures: [
            {
              parameters: [
                {
                  name: 'value',
                  type: { kind: 'primitive', text: 'T' },
                },
              ],
              returnType: { kind: 'primitive', text: 'T' },
            },
          ],
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('GenericAlias')!;
    const code = typeInfoToCode(typeInfo, reader, 'GenericAlias');

    expect(code).toContain('type GenericAlias<T> = (value: T) => T;');
  });

  it('should handle inline anonymous objects', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            config: {
              kind: 'object',
              text: '{ id: string; name: string }',
              name: '{ id, name }',
              properties: {
                id: { kind: 'primitive', text: 'string', required: true },
                name: { kind: 'primitive', text: 'string', required: true },
              },
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('config:');
    expect(code).toContain('{');
    expect(code).toContain('id:');
    expect(code).toContain('name:');
    expect(code).toContain('}');
  });

  it('should pretty print function types with anonymous object parameters', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        LongAnonymousTypes: {
          kind: 'object',
          text: 'LongAnonymousTypes',
          properties: {
            onFormSubmit: {
              kind: 'function',
              text: '(formData: FormData, options: SubmitOptions) => void',
              signatures: [
                {
                  parameters: [
                    {
                      name: 'formData',
                      type: {
                        kind: 'object',
                        text: '{ firstName: string; lastName: string }',
                        properties: {
                          firstName: {
                            kind: 'primitive',
                            text: 'string',
                            required: true,
                          },
                          lastName: {
                            kind: 'primitive',
                            text: 'string',
                            required: true,
                          },
                        },
                      },
                    },
                    {
                      name: 'options',
                      type: {
                        kind: 'object',
                        text: '{ validateEmail: boolean; sendConfirmation: boolean }',
                        properties: {
                          validateEmail: {
                            kind: 'primitive',
                            text: 'boolean',
                            required: true,
                          },
                          sendConfirmation: {
                            kind: 'primitive',
                            text: 'boolean',
                            required: true,
                          },
                        },
                      },
                    },
                  ],
                  returnType: {
                    kind: 'object',
                    text: 'Promise<{ success: boolean; userId: string; accessToken: string; refreshToken: string; expiresIn: number }>',
                    properties: {},
                  },
                },
              ],
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('LongAnonymousTypes')!;
    const code = typeInfoToCode(typeInfo, reader, 'LongAnonymousTypes');

    expect(code).toContain('onFormSubmit: (');
    expect(code).toContain(
      '    formData: {\n      firstName: string;\n      lastName: string\n    },',
    );
    expect(code).toContain(
      '    options: {\n      validateEmail: boolean;\n      sendConfirmation: boolean\n    }\n  ) => Promise<',
    );
    expect(code).toContain(
      '      success: boolean;\n      userId: string;\n      accessToken: string;\n      refreshToken: string;\n      expiresIn: number\n    }\n  >;',
    );
  });

  it('should keep simple function types inline', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            loadUser: {
              kind: 'function',
              text: '() => Promise<User>',
              signatures: [
                {
                  parameters: [],
                  returnType: { kind: 'primitive', text: 'Promise<User>' },
                },
              ],
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('loadUser: () => Promise<User>;');
  });

  it('should preserve JSDoc comments', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            name: {
              kind: 'primitive',
              text: 'string',
              description: 'The name of the component',
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');

    expect(code).toContain('/**');
    expect(code).toContain('The name of the component');
    expect(code).toContain('*/');
    expect(code).toContain('name:');
  });

  it('should handle empty objects', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        EmptyProps: {
          kind: 'object',
          text: 'EmptyProps',
          properties: {},
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('EmptyProps')!;
    const code = typeInfoToCode(typeInfo, reader, 'EmptyProps');

    expect(code).toContain('interface EmptyProps {');
    expect(code).toContain('// No properties');
    expect(code).toContain('}');
  });
});

describe('getClickableRanges', () => {
  it('should identify clickable type names in object properties', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            user: {
              $ref: 'User',
            },
          },
        },
      },
      typeRegistry: {
        User: {
          kind: 'object',
          text: 'User',
          properties: {
            id: { kind: 'primitive', text: 'string' },
          },
        },
      },
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');
    const ranges = getClickableRanges(code, typeInfo, reader);

    expect(ranges).toHaveLength(1);
    const firstRange = ranges[0]!;
    expect(firstRange.typeName).toBe('User');
    expect(firstRange.fieldName).toBe('user');
    expect(firstRange.range.startLine).toBeGreaterThan(0);
    expect(firstRange.range.startColumn).toBeGreaterThan(0);
  });

  it('should identify clickable type names in union types', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Result: {
          kind: 'union',
          text: 'Success | Error',
          unionTypes: [{ $ref: 'Success' }, { $ref: 'Error' }],
        },
      },
      typeRegistry: {
        Success: {
          kind: 'object',
          text: 'Success',
          properties: {
            data: { kind: 'primitive', text: 'any' },
          },
        },
        Error: {
          kind: 'object',
          text: 'Error',
          properties: {
            message: { kind: 'primitive', text: 'string' },
          },
        },
      },
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Result')!;
    const code = typeInfoToCode(typeInfo, reader, 'Result');
    const ranges = getClickableRanges(code, typeInfo, reader);

    expect(ranges.length).toBeGreaterThanOrEqual(1);
    const typeNames = ranges.map((r) => r.typeName);
    expect(typeNames.length).toBeGreaterThan(0);
  });

  it('should identify clickable nested type names in function parameters', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        FunctionTypes: {
          kind: 'object',
          text: 'FunctionTypes',
          properties: {
            onCustomError: {
              kind: 'function',
              text: '(error: CustomError) => void',
              signatures: [
                {
                  parameters: [
                    {
                      name: 'error',
                      type: {
                        kind: 'object',
                        text: 'CustomError',
                        properties: {
                          code: {
                            kind: 'primitive',
                            text: 'number',
                            required: true,
                          },
                        },
                      },
                    },
                  ],
                  returnType: { kind: 'primitive', text: 'void' },
                },
              ],
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('FunctionTypes')!;
    const code = typeInfoToCode(typeInfo, reader, 'FunctionTypes');
    const ranges = getClickableRanges(code, typeInfo, reader);

    expect(code).toContain('CustomError');
    expect(ranges.map((range) => range.typeName)).toContain('CustomError');
  });

  it('should identify clickable tuple element type names', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        TupleTypes: {
          kind: 'object',
          text: 'TupleTypes',
          properties: {
            objectTuple: {
              kind: 'tuple',
              text: '[UserInfo, PostInfo]',
              tupleElements: [
                {
                  kind: 'object',
                  text: 'UserInfo',
                  properties: {
                    id: {
                      kind: 'primitive',
                      text: 'number',
                      required: true,
                    },
                  },
                },
                {
                  kind: 'object',
                  text: 'PostInfo',
                  properties: {
                    title: {
                      kind: 'primitive',
                      text: 'string',
                      required: true,
                    },
                  },
                },
              ],
              required: true,
            },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('TupleTypes')!;
    const code = typeInfoToCode(typeInfo, reader, 'TupleTypes');
    const ranges = getClickableRanges(code, typeInfo, reader);
    const typeNames = ranges.map((range) => range.typeName);

    expect(code).toContain('UserInfo');
    expect(code).toContain('PostInfo');
    expect(typeNames).toContain('UserInfo');
    expect(typeNames).toContain('PostInfo');
  });

  it('should return empty array for primitive types', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        Props: {
          kind: 'object',
          text: 'Props',
          properties: {
            name: { kind: 'primitive', text: 'string' },
            age: { kind: 'primitive', text: 'number' },
          },
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('Props')!;
    const code = typeInfoToCode(typeInfo, reader, 'Props');
    const ranges = getClickableRanges(code, typeInfo, reader);

    expect(ranges).toHaveLength(0);
  });

  it('should skip inline object roots and inline array elements', () => {
    const inlineObject: TypeInfo = {
      kind: 'object',
      text: '{ id: string; label: string }',
      properties: {
        id: { kind: 'primitive', text: 'string', required: true },
        label: { kind: 'primitive', text: 'string', required: true },
      },
    };
    const inlineUnion: TypeInfo = {
      kind: 'union',
      text: 'InlineUnion',
      unionTypes: [inlineObject],
    };
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        InlineRoot: inlineObject,
        InlineList: {
          kind: 'object',
          text: 'InlineList',
          properties: {
            items: {
              kind: 'array',
              text: '{ id: string; label: string }[]',
              elementType: inlineObject,
              required: true,
            },
          },
        },
        InlineUnion: inlineUnion,
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);

    const inlineRoot = reader.getRaw('InlineRoot')!;
    const inlineRootCode = typeInfoToCode(inlineRoot, reader, 'InlineRoot');
    const inlineRootRanges = getClickableRanges(
      inlineRootCode,
      inlineRoot,
      reader,
    );
    expect(inlineRootCode).toContain('interface InlineRoot {');
    expect(inlineRootRanges).toHaveLength(0);

    const inlineList = reader.getRaw('InlineList')!;
    const inlineListCode = typeInfoToCode(inlineList, reader, 'InlineList');
    const inlineListRanges = getClickableRanges(
      inlineListCode,
      inlineList,
      reader,
    );
    expect(inlineListCode).toContain('items:');
    expect(inlineListRanges).toHaveLength(0);

    const inlineUnionType = reader.getRaw('InlineUnion')!;
    const inlineUnionCode = typeInfoToCode(
      inlineUnionType,
      reader,
      'InlineUnion',
    );
    const inlineUnionRanges = getClickableRanges(
      inlineUnionCode,
      inlineUnionType,
      reader,
    );
    expect(inlineUnionCode).toContain('| {');
    expect(inlineUnionRanges).toHaveLength(0);
  });

  it('should render named union aliases with meta info', () => {
    const mockData: OutputResult = {
      generatedAt: '2026-03-23T00:00:00.000Z',
      keys: {
        ApiResponse: {
          kind: 'union',
          text: 'ApiResponse',
          name: 'ApiResponse',
          description: 'Shared response alias',
          unionTypes: [
            { kind: 'primitive', text: '"ok"' },
            { kind: 'primitive', text: '"error"' },
          ],
        },
      },
      typeRegistry: {},
    };

    const reader = PropsDocReader.create(mockData);
    const typeInfo = reader.getRaw('ApiResponse')!;
    const { code, jsdocBlocks } = typeInfoToCodeWithMeta(
      typeInfo,
      reader,
      'ApiResponse',
    );

    expect(code).toContain('type ApiResponse =');
    expect(code).toContain('| "ok"');
    expect(code).toContain('| "error"');
    expect(jsdocBlocks).toHaveLength(1);
  });

  it('should simplify tuple optional member syntax', () => {
    expect(simplifyOptionalTupleMemberSyntax('[(string | undefined)?]')).toBe(
      '[string?]',
    );
    expect(simplifyOptionalTupleMemberSyntax('[(undefined | number)?]')).toBe(
      '[number?]',
    );
  });
});
