/**
 * 类型解析器
 * @description 使用 ts-morph 解析 TypeScript 类型信息
 */

import { createHash } from 'crypto';
import type {
  Node,
  Symbol as TsSymbol,
  Type,
  JSDocableNode,
  Signature,
} from 'ts-morph';
import { Node as TsMorphNode } from 'ts-morph';
import type {
  TypeInfo,
  TypeCategory,
  RenderHint,
  FunctionSignature,
} from '../shared/types';
import {
  TYPESCRIPT_UTILITY_TYPES,
  BUILTIN_TYPES,
  PRIMITIVE_TYPE_NAMES,
} from '../shared/constants';

// ============================================================
// 常量定义
// ============================================================

/**
 * 基础类型集合（用于快速查找，从 constants.ts 导入的数组生成）
 */
const PRIMITIVE_TYPES = new Set(PRIMITIVE_TYPE_NAMES);

/** 缓存 key 前缀 */
const CACHE_PREFIX_PRIMITIVE = 'primitive:';
const CACHE_PREFIX_TEXT = 'text:';
const CACHE_PREFIX_HASH = 'hash:';
const CACHE_PREFIX_ARRAY = 'array:';
const CACHE_PREFIX_ANON = 'anon:';

/** 显示文本常量 */
const DISPLAY_ANONYMOUS_OBJECT = '[匿名对象]';
const DISPLAY_MAX_DEPTH_REACHED = '[达到最大深度]';
const TS_ANONYMOUS_TYPE = '__type';

/** Symbol 属性前缀 */
const SYMBOL_PROPERTY_PREFIX = '[Symbol.';

/** 跳过深度解析的内置属性 */
const SKIP_BUILTIN_PROPERTIES = new Set([
  'prototype',
  'constructor',
  '__proto__',
]);

/** 缓存文本长度限制 */
const CACHE_MAX_TEXT_KEY_CONTENT_LENGTH = 100;

// ============================================================
// 配置访问器
// ============================================================

let currentOptions: {
  maxDepth?: number;
  cacheMaxTypeTextLength?: number;
  enableSourceLocation?: boolean;
  skipDeepParseTypes?: Set<string>;
  skipDeepParsePrefixes?: string[];
} = {};

function getMaxDepth(): number {
  return currentOptions.maxDepth ?? 5;
}

function getCacheMaxTypeTextLength(): number {
  return currentOptions.cacheMaxTypeTextLength ?? 200;
}

function getEnableSourceLocation(): boolean {
  return currentOptions.enableSourceLocation ?? false;
}

function getSkipDeepParseTypes(): Set<string> {
  return currentOptions.skipDeepParseTypes ?? new Set();
}

function getSkipDeepParsePrefixes(): string[] {
  return currentOptions.skipDeepParsePrefixes ?? [];
}

/**
 * 初始化解析选项
 * @param options 解析选项
 */
export function initParseOptions(options?: {
  maxDepth?: number;
  cacheMaxTypeTextLength?: number;
  enableSourceLocation?: boolean;
  skipDeepParseTypes?: Set<string>;
  skipDeepParsePrefixes?: string[];
}): void {
  currentOptions = options || {};
  // 更新解析配置缓存
  parseConfig = {
    maxDepth: getMaxDepth(),
    cacheMaxTypeTextLength: getCacheMaxTypeTextLength(),
    enableSourceLocation: getEnableSourceLocation(),
    skipDeepParseTypes: getSkipDeepParseTypes(),
    skipDeepParsePrefixes: getSkipDeepParsePrefixes(),
  };
}

/**
 * 对文本生成短 hash key
 * 使用 md5 取前 16 位，碰撞概率极低
 */
function hashText(text: string): string {
  return createHash('md5').update(text).digest('hex').slice(0, 16);
}

/**
 * 构建 name 字段，当 name == text 时返回空对象以省略 name 字段
 * @param name 类型名称
 * @param text 类型文本
 * @returns 包含 name 字段的对象，或空对象
 */
function buildNameField(
  name: string,
  text: string,
): { name: string } | Record<string, never> {
  return name === text ? {} : { name };
}

// ============================================================
// 类型缓存（全局级别，用于跨组件类型去重）
// ============================================================

/** 全局类型缓存，用于复用已解析的类型（包括基础类型、命名类型和匿名类型） */
let typeCache = new Map<string, TypeInfo>();

/** 解析配置缓存（在解析过程中保持不变，避免频繁函数调用） */
let parseConfig = {
  maxDepth: 0,
  cacheMaxTypeTextLength: 0,
  enableSourceLocation: false,
  skipDeepParseTypes: new Set<string>(),
  skipDeepParsePrefixes: [] as string[],
};

/**
 * 清空类型缓存（整个解析流程开始前调用一次）
 * 同时更新解析配置缓存，避免递归过程中频繁调用配置访问器
 */
export function clearTypeCache(): void {
  typeCache = new Map<string, TypeInfo>();

  // 缓存解析配置，避免递归过程中频繁的函数调用
  parseConfig = {
    maxDepth: getMaxDepth(),
    cacheMaxTypeTextLength: getCacheMaxTypeTextLength(),
    enableSourceLocation: getEnableSourceLocation(),
    skipDeepParseTypes: getSkipDeepParseTypes(),
    skipDeepParsePrefixes: getSkipDeepParsePrefixes(),
  };
}

/**
 * 获取当前缓存大小
 * @returns 缓存中的类型数量
 */
export function getTypeCacheSize(): number {
  return typeCache.size;
}

/**
 * 获取类型缓存快照（用于构建 typeRegistry）
 * @returns 缓存中所有类型的副本
 */
export function getTypeCacheSnapshot(): Record<string, TypeInfo> {
  const snapshot: Record<string, TypeInfo> = {};
  typeCache.forEach((value, key) => {
    snapshot[key] = value;
  });
  return snapshot;
}

// ============================================================
// 内置类型检测（基于 TypeScript 元数据，不依赖路径）
// ============================================================

/**
 * 通过 TypeScript 元数据检测是否为内置类型（主方案）
 * @description 检查 hasNoDefaultLib 标志和文件名特征
 */
function isBuiltinTypeByMetadata(type: Type): boolean {
  const symbol = type.getSymbol();
  if (!symbol) return false;

  const declarations = symbol.getDeclarations();
  if (declarations.length === 0) return false;

  const sourceFile = declarations[0]?.getSourceFile();
  if (!sourceFile) return false;

  // 方法1：检查是否是 TypeScript 标准库文件
  // hasNoDefaultLib 为 true 表示这是 TypeScript 标准库文件
  if (sourceFile.compilerNode.hasNoDefaultLib === true) {
    return true;
  }

  // 方法2：检查文件名是否是 lib.*.d.ts（作为后备检测）
  const fileName = sourceFile.getBaseName();
  if (fileName.startsWith('lib.') && fileName.endsWith('.d.ts')) {
    return true;
  }

  return false;
}

/**
 * TypeScript Utility Types Set
 * 用于快速查找，从 constants.ts 导入的数组生成
 */
const TS_UTILITY_TYPES = new Set(TYPESCRIPT_UTILITY_TYPES);

/**
 * 从类型文本中提取类型名称（去掉泛型参数）
 * @param typeText 类型文本，如 "Omit<T, 'id'>" 或 "NS.Type<T>"
 * @returns 类型名称，如 "Omit" 或 "Type"；如果不是泛型类型返回 null
 * @example
 * extractTypeName("Omit<T, 'id'>") // "Omit"
 * extractTypeName("NS.Type<T>") // "Type"
 * extractTypeName("string") // null
 */
function extractTypeName(typeText: string): string | null {
  const ltIndex = typeText.indexOf('<');
  if (ltIndex === -1) return null;

  const fullName = typeText.substring(0, ltIndex).trim();

  // 处理命名空间：取最后一个点号后的部分
  const lastDot = fullName.lastIndexOf('.');
  return lastDot === -1 ? fullName : fullName.substring(lastDot + 1);
}

/**
 * 检测类型名称是否为 TypeScript Utility Type
 * @param typeNameOrText 类型名称（如 "Omit"）或完整类型文本（如 "Omit<T, 'id'>"）
 * @returns 是否为 utility type
 */
function isTypeScriptUtilityType(typeNameOrText: string): boolean {
  // 如果包含 '<'，说明是完整类型文本，需要提取类型名
  const typeName = typeNameOrText.includes('<')
    ? extractTypeName(typeNameOrText)
    : typeNameOrText;

  if (!typeName) return false;
  return TS_UTILITY_TYPES.has(
    typeName as (typeof TYPESCRIPT_UTILITY_TYPES)[number],
  );
}

/**
 * 通过完全限定名（FQN）检测是否为内置类型（备选方案）
 * @description 检查类型的完全限定名是否匹配内置类型列表
 */
function isBuiltinTypeByFQN(type: Type): boolean {
  const symbol = type.getSymbol() || type.getAliasSymbol();
  if (!symbol) return false;

  const fqn = symbol.getFullyQualifiedName();

  // 精确匹配或以 "TypeName." 开头（如 String.prototype.toLowerCase）
  return BUILTIN_TYPES.some(
    (builtin) => fqn === builtin || fqn.startsWith(`${builtin}.`),
  );
}

/**
 * 检测是否为内置类型（组合方案）
 * @description 优先使用元数据检测，失败则使用 FQN 检测作为备选
 */
function isBuiltinType(type: Type): boolean {
  // 主方案：基于 TypeScript 元数据
  if (isBuiltinTypeByMetadata(type)) {
    return true;
  }

  // 备选方案：基于完全限定名
  if (isBuiltinTypeByFQN(type)) {
    return true;
  }

  return false;
}

/**
 * 检查符号是否来自 node_modules（排除 TypeScript 标准库）
 * TypeScript 标准库类型（Date/RegExp/Error 等）虽然也在 node_modules 下，
 * 但应由 isBuiltinType 标记为 builtin，而非 external
 * @param symbol 要检查的符号
 * @returns 符号名称（来自 node_modules 的第三方库时），否则返回 null
 */
function getExternalSymbolName(symbol: TsSymbol): string | null {
  const declarations = symbol.getDeclarations();
  if (declarations.length === 0) {
    return null;
  }

  const sourceFile = declarations[0]?.getSourceFile();
  if (!sourceFile) {
    return null;
  }

  const filePath = sourceFile.getFilePath();
  if (!filePath.includes('/node_modules/')) {
    return null;
  }

  // 排除 TypeScript 标准库文件（由 isBuiltinType 处理，标记为 builtin）
  if (sourceFile.compilerNode.hasNoDefaultLib === true) {
    return null;
  }
  const fileName = sourceFile.getBaseName();
  if (fileName.startsWith('lib.') && fileName.endsWith('.d.ts')) {
    return null;
  }

  const name = symbol.getName();
  if (!name || name === TS_ANONYMOUS_TYPE) {
    return null;
  }

  return name;
}

/**
 * 检测类型是否为外部库（node_modules）的类型
 * 支持 type alias（通过 aliasSymbol）和 interface/class（通过 symbol）
 * @param type 要检查的类型
 * @returns 类型名称（如 "ReactNode"、"CSSProperties"），不是外部库类型时返回 null
 */
function getExternalLibAliasName(type: Type): string | null {
  // 优先检查别名符号（type alias）
  const aliasSymbol = type.getAliasSymbol();
  if (aliasSymbol) {
    return getExternalSymbolName(aliasSymbol);
  }

  // 后备：检查类型符号（interface / class）
  const symbol = type.getSymbol();
  if (symbol) {
    return getExternalSymbolName(symbol);
  }

  return null;
}

/**
 * 获取用户定义的类型别名文本
 * 当类型有来自用户代码的别名（非 node_modules、非 TS 标准库、非 TS utility type）时，
 * 返回带泛型参数的别名文本（如 "ApiResponse<User>"）
 * @param type 要检查的类型
 * @returns 别名文本，或 null（非用户别名时）
 */
function getUserDefinedAliasText(type: Type): string | null {
  const aliasSymbol = type.getAliasSymbol();
  if (!aliasSymbol) {
    return null;
  }

  const aliasName = aliasSymbol.getName();
  if (!aliasName || aliasName === TS_ANONYMOUS_TYPE) {
    return null;
  }

  if (isTypeScriptUtilityType(aliasName)) {
    return null;
  }

  const declarations = aliasSymbol.getDeclarations();
  if (declarations.length === 0) {
    return null;
  }

  const sourceFile = declarations[0]?.getSourceFile();
  if (!sourceFile) {
    return null;
  }

  // 排除 node_modules（由 getExternalLibAliasName 处理）
  const filePath = sourceFile.getFilePath();
  if (filePath.includes('/node_modules/')) {
    return null;
  }

  // 排除 TypeScript 标准库文件
  if (sourceFile.compilerNode.hasNoDefaultLib === true) {
    return null;
  }
  const fileName = sourceFile.getBaseName();
  if (fileName.startsWith('lib.') && fileName.endsWith('.d.ts')) {
    return null;
  }

  // 构建带泛型参数的别名文本
  const typeArgs = type.getAliasTypeArguments();
  if (typeArgs.length > 0) {
    const argTexts = typeArgs.map((arg) => cleanTypeText(arg.getText()));
    return `${aliasName}<${argTexts.join(', ')}>`;
  }

  return aliasName;
}

/**
 * 获取类型的缓存 key
 * 支持三种类型的缓存：
 * 1. 基础类型：使用固定 key（如 $primitive:string）
 * 2. 命名类型：使用完整限定名
 * 3. 匿名类型：基于类型文本生成 key（如 $text:{ a: string }）
 * @param type 要获取缓存 key 的类型
 * @param typeText 清理后的类型文本
 * @returns 缓存 key，无法缓存时返回 null
 */
function getCacheKey(type: Type, typeText: string): string | null {
  // 1. 基础类型使用固定 key
  if (PRIMITIVE_TYPES.has(typeText as (typeof PRIMITIVE_TYPE_NAMES)[number])) {
    return `${CACHE_PREFIX_PRIMITIVE}${typeText}`;
  }

  // 2. 数组类型不缓存（元素类型会单独缓存）
  if (type.isArray()) {
    return null;
  }

  // 3. 超长类型文本不缓存（内联更省空间，这些类型通常出现频率低）
  if (typeText.length > parseConfig.cacheMaxTypeTextLength) {
    return null;
  }

  // 4. 短 key 直接使用文本，长 key 使用 hash 缩短
  // key 只需要保证唯一性，不需要可读性
  // 当 typeText > 16 字符时，$text:xxx 长于 $hash:xxx，用 hash 更短
  if (typeText.length <= CACHE_MAX_TEXT_KEY_CONTENT_LENGTH) {
    return `${CACHE_PREFIX_TEXT}${typeText}`;
  }
  return `${CACHE_PREFIX_HASH}${hashText(typeText)}`;
}

/** 递归解析器类型 */
type RecursiveParser = (
  type: Type,
  visited: Set<string>,
  depth: number,
) => TypeInfo;

// ============================================================
// 纯工具函数（无依赖）
// ============================================================

/**
 * 获取类型的种类（纯函数）
 */
export function getTypeKind(type: Type): string {
  if (
    type.isString() ||
    type.isNumber() ||
    type.isBoolean() ||
    type.isNull() ||
    type.isUndefined()
  ) {
    return 'primitive';
  }

  // 检查元组类型（必须在数组类型检查之前）
  // 元组类型特征：
  // 1. isObject() 返回 true（元组在 TS 中是对象类型）
  // 2. 有固定数量的数字索引属性（0, 1, 2...）
  // 3. 不是 Array 类型（type.isArray() 为 false）
  // 4. 有 length 属性
  if (type.isObject() && !type.isArray()) {
    const props = type.getProperties();
    const propNames = props.map((p) => p.getName());
    // 检查是否有数字索引属性和 length 属性
    const hasNumberProps = propNames.some((name) => /^\d+$/.test(name));
    const hasLength = propNames.includes('length');
    // 同时有数字属性和 length 属性，且不是普通数组，很可能是元组
    if (hasNumberProps && hasLength) {
      // 进一步检查：如果有 push、pop 等数组方法，且类型文本包含 [，则是元组
      const typeText = cleanTypeText(type.getText());
      if (typeText.includes('[')) {
        return 'tuple';
      }

      // 对于类型别名，检查声明文本
      const aliasSymbol = type.getAliasSymbol();
      if (aliasSymbol) {
        const declarations = aliasSymbol.getDeclarations();
        if (declarations.length > 0 && declarations[0]) {
          const declText = declarations[0].getText();
          // 如果声明文本包含 = [，说明是元组
          if (declText.includes('= [')) {
            return 'tuple';
          }
        }
      }
    }
  }

  // 检查数组类型：支持 T[] 和 Array<T> 两种语法
  if (type.isArray()) {
    return 'array';
  }

  // Array<T> 泛型语法特殊处理
  // 检查类型引用是否为 Array
  const typeArgs = type.getTypeArguments();
  if (typeArgs && typeArgs.length > 0) {
    const symbol = type.getSymbol() || type.getAliasSymbol();
    if (symbol) {
      const name = symbol.getName();
      const escapedName = symbol.getEscapedName();
      // 检查符号名或完整限定名是否为 Array
      if (name === 'Array' || escapedName === 'Array') {
        return 'array';
      }
    }
  }

  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    // 如果联合类型包含 undefined，归类为 union 以便后续简化
    const hasUndefined = unionTypes.some((t) => t.isUndefined());
    if (hasUndefined) {
      return 'union';
    }
    // 只有纯字面量联合（不含 undefined）才归类为 enum
    const isLiteralUnion = unionTypes.every((t) => t.isLiteral());
    return isLiteralUnion ? 'enum' : 'union';
  }
  if (type.isEnum()) {
    return 'enum';
  }
  if (type.isLiteral()) {
    return 'literal';
  }
  // 函数类型判断（在对象类型之前）
  const callSignatures = type.getCallSignatures();
  if (callSignatures.length > 0) {
    return 'function';
  }
  if (
    type.getProperties().length > 0 ||
    type.isObject() ||
    type.isInterface()
  ) {
    return 'object';
  }
  return 'unknown';
}

/**
 * 清理类型文本，移除 import 路径（纯函数）
 */
function cleanTypeText(text: string): string {
  return text.replace(/import\([^)]+\)\./g, '');
}

/**
 * 获取类型的唯一标识符（用于循环引用检测）
 * @param type 要获取标识符的类型
 * @returns 类型唯一标识符
 */
function getTypeUniqueId(type: Type): string {
  // 对于数组类型，使用类型文本的 hash 作为唯一 ID
  // 避免 API.FrequencyConf[] 和 API.UserLimitDimensionEnum[] 使用相同的 Array ID
  if (type.isArray()) {
    return `${CACHE_PREFIX_ARRAY}${hashText(cleanTypeText(type.getText()))}`;
  }

  const symbol = type.getSymbol();
  const aliasSymbol = type.getAliasSymbol();

  // 优先使用 aliasSymbol
  if (aliasSymbol) {
    const qualifiedName = aliasSymbol.getFullyQualifiedName();
    if (qualifiedName && qualifiedName !== TS_ANONYMOUS_TYPE) {
      return qualifiedName;
    }
  }

  // 然后使用 symbol
  if (symbol) {
    const qualifiedName = symbol.getFullyQualifiedName();
    // 排除内置类型名（如 Array、Object），使用类型文本代替
    if (
      qualifiedName &&
      qualifiedName !== TS_ANONYMOUS_TYPE &&
      !parseConfig.skipDeepParseTypes.has(qualifiedName)
    ) {
      return qualifiedName;
    }
  }

  // 对于匿名类型、无 symbol 或内置类型的情况，使用类型文本的 hash
  return `${CACHE_PREFIX_ANON}${hashText(cleanTypeText(type.getText()))}`;
}

// ============================================================
// 类型保护函数
// ============================================================

/**
 * 检查节点是否支持 JSDoc（类型保护）
 */
function isJSDocableNode(node: Node): node is Node & JSDocableNode {
  return 'getJsDocs' in node && typeof node.getJsDocs === 'function';
}

// ============================================================
// 信息提取函数（纯函数）
// ============================================================

/**
 * 从声明节点提取 JSDoc 描述（纯函数）
 */
function extractDescription(declaration: Node | undefined): string {
  if (!declaration) {
    return '';
  }

  // 优先从 JSDoc 提取
  if (isJSDocableNode(declaration)) {
    const jsDocs = declaration.getJsDocs();
    if (jsDocs.length > 0) {
      const firstDoc = jsDocs[0];
      if (firstDoc) {
        const desc = firstDoc.getDescription().trim();
        if (desc) {
          return desc;
        }
      }
    }
  }

  // 回退：从前导注释中提取
  const leadingComments = declaration.getLeadingCommentRanges();
  if (leadingComments.length === 0) {
    return '';
  }

  const lastComment = leadingComments[leadingComments.length - 1];
  if (!lastComment) {
    return '';
  }

  const commentText = lastComment.getText();
  const match = commentText.match(/\/\*\*?\s*([\s\S]*?)\s*\*\//);
  const extracted = match?.[1]?.replace(/^\s*\*\s*/gm, '').trim();
  return extracted || '';
}

/**
 * 从声明节点提取源码位置
 * @param declaration 声明节点
 * @returns 包含 sourceFile 和 sourceLine 的对象，或空对象
 */
function extractSourceLocation(
  declaration?: Node,
): { sourceFile?: string; sourceLine?: number } | Record<string, never> {
  if (!declaration) {
    return {};
  }

  try {
    const sourceFile = declaration.getSourceFile();
    const filePath = sourceFile.getFilePath();
    const startLine = declaration.getStartLineNumber();

    return {
      sourceFile: filePath,
      sourceLine: startLine,
    };
  } catch {
    return {};
  }
}

/**
 * 从符号提取源码位置
 * @param symbol 类型符号
 * @returns 包含 sourceFile 和 sourceLine 的对象，或空对象
 */
function extractSymbolSourceLocation(
  symbol?: TsSymbol,
): { sourceFile?: string; sourceLine?: number } | Record<string, never> {
  if (!symbol) {
    return {};
  }

  try {
    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) {
      return {};
    }

    const declaration = declarations[0];
    if (!declaration) {
      return {};
    }
    const sourceFile = declaration.getSourceFile();
    const filePath = sourceFile.getFilePath();
    const startLine = declaration.getStartLineNumber();

    return {
      sourceFile: filePath,
      sourceLine: startLine,
    };
  } catch {
    return {};
  }
}

/**
 * 从父类型上下文获取属性的实例化类型（纯函数）
 * @param parentType 父类型（已实例化的类型）
 * @param propName 属性名称
 * @param propSymbol 属性符号（可选，如果已经有符号可以直接传入）
 * @returns 实例化后的属性类型
 */
function getPropertyTypeFromParent(
  parentType: Type,
  propName: string,
  propSymbol?: TsSymbol,
): Type | undefined {
  try {
    // 通过父类型的 getProperty 获取符号
    const symbol = propSymbol || parentType.getProperty(propName);
    if (!symbol) {
      return undefined;
    }

    const declarations = symbol.getDeclarations();
    if (declarations && declarations.length > 0 && declarations[0]) {
      // 使用 getTypeAtLocation 获取实例化后的类型
      return symbol.getTypeAtLocation(declarations[0]);
    }

    // 回退：尝试从 valueDeclaration 获取
    const valueDeclaration = symbol.getValueDeclaration();
    if (valueDeclaration) {
      return symbol.getTypeAtLocation(valueDeclaration);
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * 检查类型中是否包含未实例化的泛型参数
 * 使用 ts-morph API 递归检查类型及其类型参数
 * @param type 要检查的类型
 * @param visited 已访问的类型集合（防止循环引用）
 * @returns 是否包含未实例化的泛型参数
 */
function containsGenericTypeParameter(
  type: Type,
  visited: Set<Type> = new Set(),
): boolean {
  // 防止循环引用
  if (visited.has(type)) {
    return false;
  }
  visited.add(type);

  // 1. 检查类型本身是否是类型参数（如 T, K, V）
  if (type.isTypeParameter()) {
    return true;
  }

  // 2. 检查类型的类型参数（如 Array<T> 中的 T）
  const typeArguments = type.getTypeArguments();
  for (const arg of typeArguments) {
    if (containsGenericTypeParameter(arg, visited)) {
      return true;
    }
  }

  // 3. 检查别名类型参数（如 Omit<T, "id"> 中的 T）
  const aliasTypeArguments = type.getAliasTypeArguments();
  for (const arg of aliasTypeArguments) {
    if (containsGenericTypeParameter(arg, visited)) {
      return true;
    }
  }

  // 4. 检查联合类型的成员
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    for (const unionType of unionTypes) {
      if (containsGenericTypeParameter(unionType, visited)) {
        return true;
      }
    }
  }

  // 5. 检查交叉类型的成员
  if (type.isIntersection()) {
    const intersectionTypes = type.getIntersectionTypes();
    for (const intersectionType of intersectionTypes) {
      if (containsGenericTypeParameter(intersectionType, visited)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 尝试从映射类型（如 Record<K, V>、Partial<T>）获取值类型
 * @param type 要检查的类型
 * @returns 映射类型的值类型，如果不是映射类型则返回 undefined
 */
function getMappedTypeValueType(type: Type): Type | undefined {
  try {
    // 使用 getAliasTypeArguments() 获取类型别名的类型参数
    // getTypeArguments() 对于某些类型别名会返回空数组
    const typeArgs = type.getAliasTypeArguments();
    const aliasSymbol = type.getAliasSymbol();
    const aliasName = aliasSymbol?.getName();

    // 对于 Record<K, V>，第二个类型参数是值类型
    if (aliasName === 'Record' && typeArgs.length >= 2) {
      return typeArgs[1];
    }

    // 对于 Partial<T>、Required<T>、Readonly<T>、Pick<T, K>、Omit<T, K>，递归检查 T
    if (
      (aliasName === 'Partial' ||
        aliasName === 'Required' ||
        aliasName === 'Readonly' ||
        aliasName === 'Pick' ||
        aliasName === 'Omit') &&
      typeArgs.length >= 1 &&
      typeArgs[0]
    ) {
      // 递归获取内层类型的值类型（如 Partial<Record<K, V>> -> V）
      const innerValueType = getMappedTypeValueType(typeArgs[0]);
      if (innerValueType) {
        return innerValueType;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

// ============================================================
// 类型解析函数
// ============================================================

/**
 * 解析基础类型（纯函数）
 */
function parsePrimitiveType(typeText: string, kind: string): TypeInfo {
  return { kind: kind as TypeCategory, text: typeText };
}

/**
 * 解析数组类型
 */
function parseArrayType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  // 优先使用 getArrayElementType()
  let elementType = type.getArrayElementType();

  // 如果 getArrayElementType() 返回 undefined，可能是 Array<T> 泛型语法
  // 尝试从类型参数中获取元素类型
  if (!elementType) {
    const typeArgs = type.getTypeArguments();
    if (typeArgs && typeArgs.length > 0) {
      elementType = typeArgs[0];
    }
  }

  // 如果元素类型有用户定义的别名，用别名构建数组的显示文本
  let displayText = typeText;
  if (elementType) {
    const elementAliasText = getUserDefinedAliasText(elementType);
    if (elementAliasText) {
      displayText = `${elementAliasText}[]`;
    }
  }

  return {
    kind: 'array' as TypeCategory,
    text: displayText,
    elementType: elementType ? recurse(elementType, visited, depth + 1) : null,
  };
}

/**
 * 解析元组类型
 * 元组与数组的区别：
 * - 固定长度，每个位置可以有不同的类型
 * - 不应该展开为包含数组方法的对象
 * - 保持类型文本的字面形式（如 [x: number, y: number, z: number]）
 * - 解析每个元素的类型，支持元素类型的嵌套展开
 */
function parseTupleType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  // 尝试从类型别名声明中提取实际的元组文本
  let actualTupleText = typeText;
  const aliasSymbol = type.getAliasSymbol();
  if (aliasSymbol) {
    const declarations = aliasSymbol.getDeclarations();
    if (declarations.length > 0 && declarations[0]) {
      const declText = declarations[0].getText();
      // 提取 = 后面的元组部分
      const match = declText.match(/=\s*(\[.*?\]);?\s*$/s);
      if (match && match[1]) {
        actualTupleText = match[1];
      }
    }
  }

  // 解析元组元素类型
  // 元组类型通过 getTypeArguments() 获取每个位置的类型
  const tupleElements: TypeInfo[] = [];
  const typeArgs = type.getTypeArguments();

  if (typeArgs && typeArgs.length > 0) {
    for (const elementType of typeArgs) {
      tupleElements.push(recurse(elementType, visited, depth + 1));
    }
  }

  return {
    kind: 'tuple' as TypeCategory,
    text: actualTupleText,
    ...(tupleElements.length > 0 ? { tupleElements } : {}),
  };
}

/**
 * 解析枚举类型（纯函数）
 */
function parseEnumType(type: Type, typeText: string): TypeInfo {
  const unionTypes = type.getUnionTypes();
  return {
    kind: 'enum' as TypeCategory,
    text: typeText,
    enumValues: unionTypes.filter((t) => t.isLiteral()).map((t) => t.getText()),
  };
}

/**
 * 解析联合类型
 */
function parseUnionType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  const unionTypes = type.getUnionTypes();
  return {
    kind: 'union' as TypeCategory,
    text: typeText,
    unionTypes: unionTypes.map((t) => recurse(t, visited, depth + 1)),
  };
}

/**
 * 判断类型信息是否为引用类型
 */
function isTypeRef(
  typeInfo: TypeInfo,
): typeInfo is { $ref: string; description?: string; required?: boolean } {
  return '$ref' in typeInfo;
}

/**
 * 检查类型是否包含 undefined
 * @param typeInfo 类型信息
 * @returns 是否包含 undefined
 */
function containsUndefined(typeInfo: TypeInfo): boolean {
  if (isTypeRef(typeInfo)) {
    // 引用类型检查 $ref 是否指向 undefined
    return typeInfo.$ref === `${CACHE_PREFIX_PRIMITIVE}undefined`;
  }

  // 直接是 undefined（通过 text 判断，name 省略时等于 text）
  if (typeInfo.text === 'undefined') {
    return true;
  }

  // 联合类型检查是否包含 undefined
  if (typeInfo.kind === 'union' && typeInfo.unionTypes) {
    return typeInfo.unionTypes.some(containsUndefined);
  }

  return false;
}

/**
 * 简化联合类型，移除 undefined
 * @param typeInfo 原始类型信息
 * @returns 简化后的类型信息
 */
function simplifyOptionalUnion(typeInfo: TypeInfo): TypeInfo {
  // 如果是引用类型，直接返回（不简化）
  if (isTypeRef(typeInfo)) {
    return typeInfo;
  }

  if (typeInfo.kind !== 'union' || !typeInfo.unionTypes) {
    return typeInfo;
  }

  // 过滤掉 undefined（需要检查是否为完整类型）
  const filtered = typeInfo.unionTypes.filter((t) => {
    if (isTypeRef(t)) {
      // 引用类型检查是否指向 undefined
      return t.$ref !== `${CACHE_PREFIX_PRIMITIVE}undefined`;
    }
    // 检查是否为 undefined（通过 text 判断，name 省略时等于 text）
    return t.text !== 'undefined';
  });

  // 如果全是 undefined，保持不变
  if (filtered.length === 0) {
    return typeInfo;
  }

  // 如果只剩一个类型，直接返回该类型
  if (filtered.length === 1 && filtered[0]) {
    return filtered[0];
  }

  // 如果过滤后数量没变，说明原本就没有 undefined，直接返回
  if (filtered.length === typeInfo.unionTypes.length) {
    return typeInfo;
  }

  // 特殊处理：false | true => boolean（包括截断情况和引用类型）
  const isBooleanLiteral = (t: TypeInfo): boolean => {
    if (isTypeRef(t)) {
      // 检查引用是否指向 false 或 true
      return (
        t.$ref === `${CACHE_PREFIX_TEXT}false` ||
        t.$ref === `${CACHE_PREFIX_TEXT}true` ||
        t.$ref === `${CACHE_PREFIX_PRIMITIVE}false` ||
        t.$ref === `${CACHE_PREFIX_PRIMITIVE}true`
      );
    }
    return t.text === 'false' || t.text === 'true';
  };

  // 检查是否包含 true 和 false（通过 text 判断，name 省略时等于 text）
  const hasTrue = filtered.some((t) => {
    if (isTypeRef(t)) {
      return (
        t.$ref === `${CACHE_PREFIX_TEXT}true` ||
        t.$ref === `${CACHE_PREFIX_PRIMITIVE}true`
      );
    }
    return t.text === 'true';
  });
  const hasFalse = filtered.some((t) => {
    if (isTypeRef(t)) {
      return (
        t.$ref === `${CACHE_PREFIX_TEXT}false` ||
        t.$ref === `${CACHE_PREFIX_PRIMITIVE}false`
      );
    }
    return t.text === 'false';
  });

  if (
    filtered.length === 2 &&
    hasTrue &&
    hasFalse &&
    filtered.every(isBooleanLiteral)
  ) {
    return {
      kind: 'primitive' as TypeCategory,
      text: 'boolean',
    };
  }

  // 还有多个类型，返回简化后的联合类型
  const newText = filtered
    .map((t) => {
      if (isTypeRef(t)) {
        // 从 $ref 中提取原始类型名称（去掉前缀）
        const ref = t.$ref;
        if (ref.startsWith(CACHE_PREFIX_TEXT)) {
          return ref.slice(CACHE_PREFIX_TEXT.length);
        }
        if (ref.startsWith(CACHE_PREFIX_PRIMITIVE)) {
          return ref.slice(CACHE_PREFIX_PRIMITIVE.length);
        }
        return ref;
      }
      return t.text;
    })
    .join(' | ');
  return {
    ...typeInfo,
    text: newText,
    unionTypes: filtered,
  };
}

/**
 * 解析对象类型的属性
 * @param type 父类型（已实例化的类型）
 */
function parseObjectProperties(
  type: Type,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): Record<string, TypeInfo> {
  const properties: Record<string, TypeInfo> = {};

  // 预先尝试获取映射类型的值类型（用于 Record<K, V>、Partial<T> 等情况）
  const mappedValueType = getMappedTypeValueType(type);

  for (const prop of type.getProperties()) {
    const propName = prop.getName();

    // 跳过内置属性（如数组方法 push/pop/map 等）
    if (SKIP_BUILTIN_PROPERTIES.has(propName)) {
      continue;
    }

    // 跳过 Symbol 属性（如 __@iterator@xxx、__@unscopables@xxx）
    if (propName.startsWith(SYMBOL_PROPERTY_PREFIX)) {
      continue;
    }

    const declaration = prop.getDeclarations()[0];
    let isOptional = prop.isOptional();
    // 使用父类型上下文获取实例化后的属性类型
    let propType = getPropertyTypeFromParent(type, propName, prop);

    // 对于映射类型（如 Record<K, V>），属性可能没有声明节点
    // 使用预先获取的映射类型值类型作为回退
    if (!propType && mappedValueType) {
      propType = mappedValueType;
    }

    let parsedPropType = propType
      ? recurse(propType, visited, depth + 1)
      : { kind: 'unknown' as TypeCategory, text: 'unknown' };

    // 语义等价规范化：必填但类型包含 undefined 等价于可选
    // 例如：name: string | undefined (必填) ≡ name?: string (可选)
    if (!isOptional && containsUndefined(parsedPropType)) {
      isOptional = true;
    }

    // 对可选属性简化 undefined 冗余
    if (isOptional) {
      parsedPropType = simplifyOptionalUnion(parsedPropType);
    }

    const description = extractDescription(declaration);
    const required = !isOptional;

    // 构建属性信息，使用默认值策略减少冗余字段：
    // - description 默认为空字符串，有值时才输出
    // - required 默认为 false，为 true 时才输出
    properties[propName] = {
      ...parsedPropType,
      ...(description ? { description } : {}),
      ...(required ? { required } : {}),
      ...(parseConfig.enableSourceLocation
        ? extractSourceLocation(declaration)
        : {}),
    };
  }

  return properties;
}

/**
 * 获取类型的显示名称，处理 __type 等匿名类型情况
 * 优先使用 typeText（保留命名空间前缀如 API.xxx）
 * @param type 类型对象
 * @param typeText 类型文本
 * @returns 类型显示名称
 */
function getTypeDisplayName(type: Type, typeText: string): string {
  // 如果 typeText 是有效的类型名称（非匿名对象），直接使用
  // 这样可以保留命名空间前缀（如 API.FrequencyConf）
  if (!typeText.startsWith('{') && !typeText.startsWith('(')) {
    return typeText;
  }

  // 匿名对象类型
  if (typeText.startsWith('{')) {
    return DISPLAY_ANONYMOUS_OBJECT;
  }

  const symbol = type.getSymbol();
  const aliasSymbol = type.getAliasSymbol();

  // 尝试使用别名符号
  if (aliasSymbol) {
    const aliasName = aliasSymbol.getName();
    if (aliasName && aliasName !== '__type') {
      return aliasName;
    }
  }

  // 尝试使用类型符号
  if (symbol) {
    const symbolName = symbol.getName();
    if (symbolName && symbolName !== '__type') {
      return symbolName;
    }
  }

  // 回退到 Object
  return 'Object';
}

/**
 * 解析函数参数
 */
function parseFunctionParameter(
  param: TsSymbol,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): { name: string; type: TypeInfo; optional?: boolean; rest?: boolean } {
  const paramName = param.getName();
  const paramDecl = param.getValueDeclaration();

  let paramType: TypeInfo = {
    kind: 'unknown' as TypeCategory,
    text: 'unknown',
  };
  let optional = false;
  let rest = false;

  if (paramDecl && TsMorphNode.isNode(paramDecl)) {
    const declType = paramDecl.getType();
    paramType = recurse(declType, visited, depth + 1);

    // 检查是否为可选参数
    if (TsMorphNode.isParameterDeclaration(paramDecl)) {
      optional = paramDecl.isOptional();
      rest = paramDecl.isRestParameter();
    }
  }

  return {
    name: paramName,
    type: paramType,
    ...(optional ? { optional } : {}),
    ...(rest ? { rest } : {}),
  };
}

/**
 * 解析函数签名
 */
function parseFunctionSignature(
  signature: Signature,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): FunctionSignature {
  const parameters = signature
    .getParameters()
    .map((param) => parseFunctionParameter(param, visited, depth, recurse));

  const returnType = recurse(signature.getReturnType(), visited, depth + 1);

  // 获取泛型参数（如果有）
  const typeParameters = signature
    .getTypeParameters()
    .map((tp, index) => {
      const symbol = tp.getSymbol();
      // 如果获取不到符号名，使用索引作为 fallback（T0, T1, T2...）
      // 这样可以保持类型参数的完整性，避免信息丢失
      return symbol ? symbol.getName() : `T${index}`;
    })
    .filter((name) => name && name !== 'unknown');

  const typeParams = typeParameters.length > 0 ? { typeParameters } : {};

  return {
    parameters,
    returnType,
    ...typeParams,
  } as FunctionSignature;
}

/**
 * 解析函数类型
 */
function parseFunctionType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  const callSignatures = type.getCallSignatures();
  const signatures = callSignatures.map((sig) =>
    parseFunctionSignature(sig, visited, depth, recurse),
  );

  const symbol = type.getSymbol() || type.getAliasSymbol();
  const symbolLocation = parseConfig.enableSourceLocation
    ? extractSymbolSourceLocation(symbol)
    : {};
  const displayName = getTypeDisplayName(type, typeText);

  return {
    ...buildNameField(displayName, typeText),
    kind: 'function' as TypeCategory,
    text: typeText,
    signatures,
    ...symbolLocation,
  };
}

/**
 * 解析对象类型
 */
function parseObjectType(
  type: Type,
  typeText: string,
  visited: Set<string>,
  depth: number,
  recurse: RecursiveParser,
): TypeInfo {
  const properties = parseObjectProperties(type, visited, depth, recurse);
  const symbol = type.getSymbol() || type.getAliasSymbol();
  const symbolLocation = parseConfig.enableSourceLocation
    ? extractSymbolSourceLocation(symbol)
    : {};
  const displayName = getTypeDisplayName(type, typeText);
  const hasProperties = Object.keys(properties).length > 0;

  // 特殊情况：索引访问类型（如 T["id"]）解析后如果所有属性都是内置类型方法，
  // 说明这实际上是一个内置类型的包装，应该标记为 external
  if ((typeText.includes('["') || typeText.includes("['")) && hasProperties) {
    const allPropsAreBuiltin = Object.values(properties).every((prop) => {
      if ('$ref' in prop) return false;
      if (!('kind' in prop)) return false;
      return 'renderHint' in prop && prop.renderHint === 'external';
    });
    if (allPropsAreBuiltin) {
      return {
        kind: 'object' as TypeCategory,
        renderHint: 'index-access' as RenderHint,
        text: typeText,
      };
    }
  }

  // 检测类型中是否包含未实例化的泛型参数（使用 ts-morph API）
  const hasGenericParam = containsGenericTypeParameter(type);

  // TypeScript 工具类型（Partial、Omit 等）在泛型参数未实例化时，
  // 属性是从约束推导的不完整信息，排除以避免误导
  // 自定义泛型类型（如 Box<T>）保留属性，因为属性是直接声明的
  const isUtilityWithGeneric =
    hasGenericParam && isTypeScriptUtilityType(typeText);

  return {
    ...buildNameField(displayName, typeText),
    kind: 'object' as TypeCategory,
    text: typeText,
    ...(hasProperties && !isUtilityWithGeneric ? { properties } : {}),
    ...(hasGenericParam ? { isGeneric: true } : {}),
    ...symbolLocation,
  };
}

// ============================================================
// 主解析函数
// ============================================================

/**
 * 检查类型是否在跳过深度解析的黑名单中
 * 支持精确匹配和前缀匹配两种模式
 * 注意：交叉类型和联合类型不会被跳过（即使其中包含内置类型）
 */
function shouldSkipDeepParse(type: Type): boolean {
  // 交叉类型和联合类型不跳过（需要解析其成员）
  if (type.isIntersection() || type.isUnion()) {
    return false;
  }

  // 数组类型不跳过（需要解析元素类型）
  if (type.isArray()) {
    return false;
  }

  const symbol = type.getSymbol() || type.getAliasSymbol();

  // 检查符号名
  if (symbol) {
    const name = symbol.getName();

    // 精确匹配
    if (parseConfig.skipDeepParseTypes.has(name)) {
      return true;
    }

    // 前缀匹配（用于带泛型参数的类型和命名空间类型）
    const fullName = symbol.getFullyQualifiedName();
    for (const prefix of parseConfig.skipDeepParsePrefixes) {
      if (name.startsWith(prefix) || fullName.startsWith(prefix)) {
        return true;
      }
    }
  }

  // 没有 symbol 或 symbol 检查未命中，检查类型基础类型（如 string）
  // 这会捕获像 T["id"] 这样被推导为 string 的索引访问类型
  const baseTypes = type.getBaseTypes();
  if (baseTypes && baseTypes.length > 0) {
    // 如果基础类型是 String/Number/Boolean 等，跳过
    for (const baseType of baseTypes) {
      const baseSymbol = baseType.getSymbol();
      if (baseSymbol) {
        const baseName = baseSymbol.getName();
        if (parseConfig.skipDeepParseTypes.has(baseName)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * 递归解析类型信息（核心递归函数）
 * 实现了循环引用检测和组件级类型缓存
 * 注意：此函数使用模块级缓存变量，存在受控的副作用
 */
function parseTypeInfoRecursive(
  type: Type,
  visited: Set<string>,
  depth: number,
): TypeInfo {
  const typeText = cleanTypeText(type.getText());
  const cacheKey = getCacheKey(type, typeText);

  // 1. 缓存检查（优先于深度检查，确保已解析的类型不会被截断）
  if (cacheKey && typeCache.has(cacheKey)) {
    return {
      $ref: cacheKey,
    };
  }

  // 2. 基础类型不受深度限制（它们不需要递归展开）
  if (PRIMITIVE_TYPES.has(typeText as (typeof PRIMITIVE_TYPE_NAMES)[number])) {
    const result: TypeInfo = {
      kind: 'primitive' as TypeCategory,
      text: typeText,
    };
    if (cacheKey) {
      typeCache.set(cacheKey, result);
    }
    return result;
  }

  // 3. 简单联合类型不受深度限制（只包含基础类型和 undefined）
  // 例如：boolean | undefined, string | null | undefined
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    const allPrimitive = unionTypes.every((t) => {
      const text = cleanTypeText(t.getText());
      return (
        PRIMITIVE_TYPES.has(text as (typeof PRIMITIVE_TYPE_NAMES)[number]) ||
        t.isLiteral()
      );
    });
    if (allPrimitive) {
      // 使用无深度限制的解析（传入 depth=0 重置深度）
      const result = parseUnionType(
        type,
        typeText,
        new Set(),
        0,
        parseTypeInfoRecursive,
      );
      // 对联合类型进行简化（移除 undefined）
      const simplified = simplifyOptionalUnion(result);
      if (isTypeRef(simplified)) {
        return simplified;
      }
      const simplifiedKey = getCacheKey(type, simplified.text);
      if (simplifiedKey) {
        if (typeCache.has(simplifiedKey)) {
          return { $ref: simplifiedKey };
        }
        typeCache.set(simplifiedKey, simplified);
      }
      return simplified;
    }
  }

  // 4. 深度限制检查（对于复杂类型）
  if (depth > parseConfig.maxDepth) {
    return {
      name: type.getText(),
      kind: 'unknown' as TypeCategory,
      renderHint: 'truncated' as RenderHint,
      text: DISPLAY_MAX_DEPTH_REACHED,
    };
  }

  const typeId = getTypeUniqueId(type);
  const typeName = getTypeDisplayName(type, typeText);

  // 4. 外部库类型别名保留
  // 当类型是 node_modules 中定义的类型（如 ReactNode、CSSProperties）时，
  // 保留类型名称不展开，避免将其解析为实际的联合类型或内部结构
  const externalAliasName = getExternalLibAliasName(type);
  if (externalAliasName && !isTypeScriptUtilityType(externalAliasName)) {
    return {
      kind: 'object' as TypeCategory,
      renderHint: 'external' as RenderHint,
      text: externalAliasName,
    };
  }

  // 4.5 用户定义的类型别名检测
  // 对于来自用户代码的类型别名（如 ApiResponse<User>、DocumentNode），
  // 保留别名名称用于显示，底层结构仍会被解析
  const userAliasText = getUserDefinedAliasText(type);

  // 5. 索引访问类型特殊处理
  // 问题：T["xxx"] 在 TypeScript 中会被解析为目标类型的对象形式（如 String 对象，包含所有原型方法）
  // 原因：TypeScript 的类型擦除机制，无法在编译时获取泛型约束的实际类型
  // 解决：标记 renderHint='index-access'，保留索引访问表达式的字面形式
  if (typeText.includes('["') || typeText.includes("['")) {
    const kind = getTypeKind(type);
    // 如果是对象类型（说明被展开了），标记为不可展开
    if (kind === 'object') {
      return {
        kind: 'object' as TypeCategory,
        renderHint: 'index-access' as RenderHint,
        text: typeText,
      };
    }
  }

  // 5. 内置类型检查
  // 检测 TypeScript 内置类型（String, Number, Boolean 等）
  // 这些类型定义在 TypeScript 标准库（lib.*.d.ts）中，标记 renderHint='builtin'
  // 特别排除：TypeScript Utility Types（Omit, Partial, Pick 等）和数组类型
  // 原因：utility types 虽然也定义在 lib 中，但包含泛型参数时应该展开以显示结构
  //      数组类型需要解析其元素类型
  if (
    isBuiltinType(type) &&
    !isTypeScriptUtilityType(typeText) &&
    !type.isArray()
  ) {
    return {
      kind: 'object' as TypeCategory,
      renderHint: 'builtin' as RenderHint,
      text: typeName,
    };
  }

  // 6. 黑名单类型检查
  // 外部大型类型（如 React.ComponentType）标记 renderHint='external'
  if (shouldSkipDeepParse(type)) {
    return {
      kind: 'object' as TypeCategory,
      renderHint: 'external' as RenderHint,
      text: typeName,
    };
  }

  // 7. 循环引用检查（基于路径追踪，仅检测真正的嵌套循环）
  if (visited.has(typeId)) {
    const symbol = type.getSymbol() || type.getAliasSymbol();
    const symbolLocation = parseConfig.enableSourceLocation
      ? extractSymbolSourceLocation(symbol)
      : {};
    return {
      kind: 'object' as TypeCategory,
      renderHint: 'circular' as RenderHint,
      text: typeName,
      ...symbolLocation,
    };
  }

  // 7. 执行解析（未命中缓存且非循环引用时）
  const newVisited = new Set(visited);
  newVisited.add(typeId);

  const kind = getTypeKind(type);
  const recurse: RecursiveParser = parseTypeInfoRecursive;

  let result: TypeInfo;
  switch (kind) {
    case 'primitive':
    case 'literal':
      result = parsePrimitiveType(typeText, kind);
      break;
    case 'array':
      result = parseArrayType(type, typeText, newVisited, depth, recurse);
      break;
    case 'tuple':
      result = parseTupleType(type, typeText, newVisited, depth, recurse);
      break;
    case 'enum':
      result = parseEnumType(type, typeText);
      break;
    case 'union':
      result = parseUnionType(type, typeText, newVisited, depth, recurse);
      break;
    case 'function':
      result = parseFunctionType(type, typeText, newVisited, depth, recurse);
      break;
    case 'object':
      result = parseObjectType(type, typeText, newVisited, depth, recurse);
      break;
    default:
      result = {
        kind: 'unknown' as TypeCategory,
        text: typeText,
      };
  }

  // 6. 应用用户定义的别名文本
  // 将别名名称写入 name 字段，使 UI 层能展示类型别名（如 ApiResponse<User>）
  // text 保留底层结构表示，name 作为显示名称（UI 通过 name ?? text 获取显示名）
  if (userAliasText && !isTypeRef(result)) {
    result = { ...result, name: userAliasText };
  }

  // 7. 对联合类型进行规范化：X | undefined 简化为 X
  // 这样可以复用已有的类型缓存，减少重复
  if (kind === 'union' && containsUndefined(result)) {
    const simplified = simplifyOptionalUnion(result);
    // 如果简化后的结果是引用类型，直接返回该引用（不再重复存入缓存）
    if (isTypeRef(simplified)) {
      return simplified;
    }
    // 如果简化后的结果不是引用类型，尝试使用简化后的缓存 key
    const simplifiedKey = getCacheKey(type, simplified.text);
    if (simplifiedKey) {
      // 如果简化后的 key 已在缓存中，直接返回引用
      if (typeCache.has(simplifiedKey)) {
        return { $ref: simplifiedKey };
      }
      // 否则将简化后的结果存入简化后的 key，不使用原始 key
      typeCache.set(simplifiedKey, simplified);
      return simplified;
    }
    // 如果无法获取简化后的 key，使用简化后的结果但用原始 key 缓存
    result = simplified;
  }

  // 7. 写入缓存（仅命名类型，且上面没有已经处理过缓存的情况）
  if (cacheKey && !typeCache.has(cacheKey)) {
    typeCache.set(cacheKey, result);
  }

  return result;
}

/**
 * 解析类型信息（公共接口）
 * 注意：此函数使用模块级缓存，建议在解析每个组件前调用 clearTypeCache()
 * @param type 要解析的类型
 * @returns 解析后的类型信息
 */
export function parseTypeInfo(type: Type): TypeInfo {
  return parseTypeInfoRecursive(type, new Set(), 0);
}

/**
 * 创建空的类型信息（用于无 props 的组件）
 */
export function createEmptyTypeInfo(): TypeInfo {
  return {
    name: 'EmptyProps',
    kind: 'object' as TypeCategory,
    text: '{}',
  };
}
