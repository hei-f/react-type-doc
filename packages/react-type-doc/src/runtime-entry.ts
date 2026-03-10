/**
 * React 类型文档生成工具 - 运行时入口
 * @description 仅导出运行时 API，用于在应用中读取类型文档
 */

// 运行时 API
export { PropsDocReader } from './runtime/reader';
export { RENDER_TYPE } from './runtime/renderTypes';
export type { RenderType, TypeRenderInfo } from './runtime/renderTypes';
export { getTypeName, isPrimitiveType, isTypeRef } from './runtime/utils';

// 类型定义
export type {
  FullTypeInfo,
  FunctionParameter,
  FunctionSignature,
  OutputResult,
  TypeInfo,
  TypeRef,
} from './shared/types';
