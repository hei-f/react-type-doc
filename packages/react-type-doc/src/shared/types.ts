/**
 * React 类型文档生成工具 - 类型定义
 */

/**
 * 类型的本质特征（基于 TypeScript 类型系统）
 * 描述类型的结构和语义，而非展示策略
 */
export type TypeCategory =
  // 值类型（不可展开的简单类型）
  | 'primitive' // 基础类型：string, number, boolean, null, undefined, symbol, bigint
  | 'literal' // 字面量类型：'hello', 42, true

  // 结构类型（可展开的复杂类型）
  | 'object' // 对象类型：{ a: string }
  | 'function' // 函数类型：() => void
  | 'array' // 数组类型：string[]
  | 'tuple' // 元组类型：[string, number]
  | 'union' // 联合类型：string | number
  | 'intersection' // 交叉类型：A & B

  // 特殊类型
  | 'enum' // 枚举类型或字面量联合：'a' | 'b' | 'c'
  | 'unknown'; // 无法识别的类型

/**
 * TypeCategory 枚举常量（运行时使用，避免魔法字符串）
 */
export const TYPE_CATEGORY = {
  Primitive: 'primitive',
  Literal: 'literal',
  Object: 'object',
  Function: 'function',
  Array: 'array',
  Tuple: 'tuple',
  Union: 'union',
  Intersection: 'intersection',
  Enum: 'enum',
  Unknown: 'unknown',
} satisfies Record<string, TypeCategory>;

/**
 * 类型的展示策略（可选，仅在需要特殊处理时设置）
 * 用于指导 UI 层如何渲染和交互
 */
export type RenderHint =
  // 不展开策略
  | 'builtin' // TypeScript 内置类型（String, Promise, Map 等）- 不展开内部结构
  | 'external' // 外部库类型（React.ComponentType 等）- 不展开内部结构
  | 'index-access' // 索引访问类型（T["id"]）- 因类型擦除无法展开

  // 状态标记
  | 'circular' // 循环引用 - 避免无限递归
  | 'truncated' // 深度限制 - 超过最大深度

  // 提示标记
  | 'generic'; // 包含未实例化的泛型参数 - 提示用户需要传入具体类型

/**
 * RenderHint 枚举常量（运行时使用，避免魔法字符串）
 */
export const RENDER_HINT = {
  Builtin: 'builtin',
  External: 'external',
  IndexAccess: 'index-access',
  Circular: 'circular',
  Truncated: 'truncated',
  Generic: 'generic',
} satisfies Record<string, RenderHint>;

/** 泛型参数信息（声明级） */
export interface GenericParameterInfo {
  /** 类型参数名称 */
  name: string;
  /** 约束类型（extends） */
  constraint?: string;
  /** 默认类型（=） */
  default?: string;
}

/** 函数参数信息 */
export interface FunctionParameter {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: TypeInfo;
  /** 是否可选参数 */
  optional?: boolean;
  /** 是否为剩余参数 */
  rest?: boolean;
}

/** 函数签名信息 */
export interface FunctionSignature {
  /** 参数列表 */
  parameters: FunctionParameter[];
  /** 返回类型 */
  returnType: TypeInfo;
  /** 签名的类型参数（泛型），例如 ['T', 'K'] 表示 <T, K>。当函数没有泛型参数时该字段不存在 */
  typeParameters?: string[];
  /** 结构化泛型参数（声明级）；优先于 typeParameters 用于展示和代码生成 */
  genericParameters?: GenericParameterInfo[];
}

/** 完整类型信息结构 */
export interface FullTypeInfo {
  /** 类型名称（当与 text 相同时省略，读取时使用 name ?? text） */
  name?: string;

  /**
   * 类型的本质特征（基于 TypeScript 类型系统）
   * 描述类型"是什么"，而非"如何展示"
   */
  kind: TypeCategory;

  /**
   * 展示策略提示（可选）
   * 用于指导 UI 层如何渲染：
   * - 未设置：按 kind 默认展示
   * - builtin/external/index-access：不展开，显示类型名
   * - circular：循环引用标记
   * - truncated：深度限制标记
   * - generic：泛型提示（已通过 isGeneric 字段表示，此值保留用于未来扩展）
   */
  renderHint?: RenderHint;

  /** 类型文本表示 */
  text: string;

  /** 类型描述（从 JSDoc 提取） */
  description?: string;

  /** 声明级结构化泛型参数 */
  genericParameters?: GenericParameterInfo[];

  /** 是否必填（仅在属性上下文中使用） */
  required?: boolean;

  /** 源文件路径 */
  sourceFile?: string;

  /** 源码行号 */
  sourceLine?: number;

  /** 对象类型的属性（kind === 'object' 时使用） */
  properties?: Record<string, TypeInfo>;

  /** 数组的元素类型（kind === 'array' 时使用） */
  elementType?: TypeInfo | null;

  /** 元组的元素类型列表（kind === 'tuple' 时使用，每个位置可以是不同的类型） */
  tupleElements?: TypeInfo[];

  /** 枚举值列表（kind === 'enum' 时使用） */
  enumValues?: string[];

  /** 联合类型的成员（kind === 'union' 时使用） */
  unionTypes?: TypeInfo[];

  /** 函数签名列表（kind === 'function' 时使用，支持函数重载） */
  signatures?: FunctionSignature[];

  /**
   * 是否包含未实例化的泛型参数
   * @default undefined - 仅当值为 true 时显式设置
   * @example Omit<T, "id"> 中的 T 未实例化，isGeneric = true
   */
  isGeneric?: boolean;

  /**
   * JSDoc 中 {@link} 引用的预解析映射
   * 在解析阶段通过 ts-morph 的类型系统完成解析（与 IDE 使用相同的作用域解析机制）
   * key: 引用文本（如 "ComplexCommentProps"）, value: typeRegistry 中的 key
   */
  descriptionLinks?: Record<string, string>;
}

/** 类型引用结构（只包含引用，完整定义从 typeRegistry 获取） */
export interface TypeRef {
  /** 类型引用，指向 typeRegistry 中的类型定义 */
  $ref: string;
  /** 位置相关的描述信息 */
  description?: string;
  /** 位置相关的必填信息 */
  required?: boolean;
  /** JSDoc 中 {@link} 引用的预解析映射 */
  descriptionLinks?: Record<string, string>;
}

/** 类型信息：可以是完整定义或引用 */
export type TypeInfo = FullTypeInfo | TypeRef;

/** 注册表项 */
export interface RegistryItem {
  /** 源文件路径（支持 tsconfig 路径别名，如 @/pages/...） */
  sourcePath: string;
  /** 类型名称（可选，不写则使用组件模式，提取 React 组件的 Props） */
  typeName?: string;
  /** 导出名称（组件模式下，当导出名与 key 不一致时使用） */
  exportName?: string;
}

/** 解析选项（可在配置中覆盖默认值） */
export interface ParseOptions {
  /** 最大递归深度 */
  maxDepth?: number;
  /** 类型文本最大显示长度 */
  maxTypeTextLength?: number;
  /** 详细类型文本最大显示长度 */
  maxDetailedTypeTextLength?: number;
  /** 类型文本最大缓存长度（超过此长度不缓存，内联更省空间） */
  cacheMaxTypeTextLength?: number;
  /** 额外跳过深度解析的类型（精确匹配） */
  extraSkipTypes?: string[];
  /** 额外跳过深度解析的类型前缀 */
  extraSkipPrefixes?: string[];
  /** 是否记录源码位置信息（默认 false，开启会增大输出文件大小） */
  enableSourceLocation?: boolean;
}

/** 目录扫描配置项 */
export interface ScanDirItem {
  /** 扫描目录路径（支持相对路径和 tsconfig 路径别名，如 @/components） */
  path: string;
  /** 组件入口文件名（默认 'index.tsx'） */
  componentEntry?: string;
  /** 类型定义文件名（默认 'doc.types.ts'） */
  typesEntry?: string;
}

/** 配置文件结构 */
export interface ReactTypeDocConfig {
  /** tsconfig 路径（相对于项目根目录，支持路径别名） */
  tsConfigPath: string;
  /** 输出文件路径（支持 tsconfig 路径别名，如 @/pages/...） */
  outputPath: string;
  /** 解析选项 */
  options?: ParseOptions;
  /** 类型注册表（手动注册） */
  registry?: Record<string, RegistryItem>;
  /**
   * 目录扫描配置
   * 自动扫描指定目录下的子文件夹，按约定提取组件和类型：
   * - 组件：子文件夹/index.tsx
   * - 类型：子文件夹/doc.types.ts 中导出的 type/interface/enum
   */
  scanDirs?: ScanDirItem[];
}

/** 输出结果结构（脚本生成） */
export interface OutputResult {
  generatedAt: string;
  /** 类型映射，key 为注册表中的 key，value 为类型信息 */
  keys: Record<string, TypeInfo>;
  /** 类型注册表，存储去重后的类型定义 */
  typeRegistry: Record<string, TypeInfo>;
}

/** defineConfig 辅助函数类型 */
export type DefineConfig = (config: ReactTypeDocConfig) => ReactTypeDocConfig;
