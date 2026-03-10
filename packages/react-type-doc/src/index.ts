/**
 * React 类型文档生成工具 - 包入口
 * @description 统一导出运行时 API
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
  ParseOptions,
  ReactTypeDocConfig,
  RegistryItem,
  TypeInfo,
  TypeRef,
  TypeCategory,
  RenderHint,
} from './shared/types';

// 枚举常量对象（运行时使用，避免魔法字符串）
export { TYPE_CATEGORY, RENDER_HINT } from './shared/types';

// 常量定义
export {
  PRIMITIVE_TYPE_NAMES,
  TYPESCRIPT_UTILITY_TYPES,
  BUILTIN_TYPES,
  DEFAULT_SKIP_DEEP_PARSE_TYPES,
  DEFAULT_PARSE_OPTIONS,
} from './shared/constants';

// 导入 ReactTypeDocConfig 类型用于 defineConfig
import type { ReactTypeDocConfig } from './shared/types';

/**
 * defineConfig 辅助函数
 * @description 提供类型提示，无运行时逻辑
 */
export function defineConfig(config: ReactTypeDocConfig): ReactTypeDocConfig {
  return config;
}
