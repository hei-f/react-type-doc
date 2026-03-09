/**
 * 解析配置管理
 * @description 管理类型解析器的运行时配置
 */

/** 解析选项 */
interface ParseOptionsInput {
  maxDepth?: number;
  cacheMaxTypeTextLength?: number;
  enableSourceLocation?: boolean;
  skipDeepParseTypes?: Set<string>;
  skipDeepParsePrefixes?: string[];
}

/** 解析配置（缓存后的配置值，避免递归过程中频繁函数调用） */
export interface ParseConfig {
  maxDepth: number;
  cacheMaxTypeTextLength: number;
  enableSourceLocation: boolean;
  skipDeepParseTypes: Set<string>;
  skipDeepParsePrefixes: string[];
}

/** 默认配置值 */
const DEFAULT_MAX_DEPTH = 5;
const DEFAULT_CACHE_MAX_TYPE_TEXT_LENGTH = 200;

let currentOptions: ParseOptionsInput = {};

let parseConfig: ParseConfig = {
  maxDepth: DEFAULT_MAX_DEPTH,
  cacheMaxTypeTextLength: DEFAULT_CACHE_MAX_TYPE_TEXT_LENGTH,
  enableSourceLocation: false,
  skipDeepParseTypes: new Set<string>(),
  skipDeepParsePrefixes: [],
};

function getMaxDepth(): number {
  return currentOptions.maxDepth ?? DEFAULT_MAX_DEPTH;
}

function getCacheMaxTypeTextLength(): number {
  return (
    currentOptions.cacheMaxTypeTextLength ?? DEFAULT_CACHE_MAX_TYPE_TEXT_LENGTH
  );
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
 * 刷新解析配置缓存
 * 从当前选项重新计算配置值
 */
export function refreshParseConfig(): void {
  parseConfig = {
    maxDepth: getMaxDepth(),
    cacheMaxTypeTextLength: getCacheMaxTypeTextLength(),
    enableSourceLocation: getEnableSourceLocation(),
    skipDeepParseTypes: getSkipDeepParseTypes(),
    skipDeepParsePrefixes: getSkipDeepParsePrefixes(),
  };
}

/**
 * 获取当前解析配置
 */
export function getParseConfig(): ParseConfig {
  return parseConfig;
}

/**
 * 初始化解析选项
 * @param options 解析选项
 */
export function initParseOptions(options?: ParseOptionsInput): void {
  currentOptions = options || {};
  refreshParseConfig();
}
