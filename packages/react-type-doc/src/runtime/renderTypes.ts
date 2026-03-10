/**
 * 渲染类型定义
 * @description 类型渲染信息的常量和类型定义
 */

import type {
  FullTypeInfo,
  FunctionSignature,
  TypeInfo,
} from '../shared/types';

/** 渲染类型常量 */
export const RENDER_TYPE = {
  /** 外部库类型 */
  EXTERNAL: 'external',
  /** 循环引用类型 */
  CIRCULAR: 'circular',
  /** 枚举类型 */
  ENUM: 'enum',
  /** 联合类型 */
  UNION: 'union',
  /** 数组类型 */
  ARRAY: 'array',
  /** 元组类型 */
  TUPLE: 'tuple',
  /** 对象类型 */
  OBJECT: 'object',
  /** 可展开的自定义类型 */
  CUSTOM_EXPANDABLE: 'customExpandable',
  /** 函数类型 */
  FUNCTION: 'function',
  /** 原始类型 */
  PRIMITIVE: 'primitive',
  /** 默认类型 */
  DEFAULT: 'default',
} as const;

export type RenderType = (typeof RENDER_TYPE)[keyof typeof RENDER_TYPE];

/** 渲染信息类型定义 */
export type TypeRenderInfo =
  | {
      type: typeof RENDER_TYPE.EXTERNAL;
      name: string;
    }
  | {
      type: typeof RENDER_TYPE.CIRCULAR;
      name: string;
      sourceHint?: string;
      resolved: FullTypeInfo;
    }
  | {
      type: typeof RENDER_TYPE.ENUM;
      values: string[];
    }
  | {
      type: typeof RENDER_TYPE.UNION;
      types: TypeInfo[];
    }
  | {
      type: typeof RENDER_TYPE.ARRAY;
      elementType: TypeInfo;
      needsParens: boolean;
    }
  | {
      type: typeof RENDER_TYPE.TUPLE;
      text: string;
      elements?: TypeInfo[];
    }
  | {
      type: typeof RENDER_TYPE.OBJECT;
      name: string;
      expandable: boolean;
      resolved: FullTypeInfo;
    }
  | {
      type: typeof RENDER_TYPE.CUSTOM_EXPANDABLE;
      name: string;
      text: string;
      resolved: FullTypeInfo;
    }
  | {
      type: typeof RENDER_TYPE.FUNCTION;
      signatures: FunctionSignature[];
      text: string;
    }
  | {
      type: typeof RENDER_TYPE.PRIMITIVE;
      text: string;
    }
  | {
      type: typeof RENDER_TYPE.DEFAULT;
      text: string;
    };
