/**
 * 生成命令
 * @description 根据配置文件生成类型文档
 */

import fs from 'fs';
import path from 'path';
import { Project } from 'ts-morph';
import { findComponentProps } from '../core/componentParser';
import {
  clearTypeCache,
  getTypeCacheSnapshot,
  initParseOptions,
} from '../core/parser';
import { resolveType } from '../core/typeResolver';
import { createPathResolver } from '../shared/pathResolver';
import type {
  OutputResult,
  ReactTypeDocConfig,
  RegistryItem,
  TypeInfo,
} from '../shared/types';
import { expandScanDirs } from './scanDir';

/** 单个类型的解析结果 */
interface ParseResult {
  key: string;
  typeInfo: TypeInfo | null;
  error?: string;
}

// ============================================================
// IO 函数（副作用隔离）
// ============================================================

/**
 * 确保目录存在（IO 操作）
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 写入 JSON 文件（IO 操作）
 */
function writeJsonFile(filePath: string, data: unknown): void {
  ensureDirectoryExists(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 检查文件是否存在（IO 操作）
 */
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// ============================================================
// 日志函数（副作用隔离）
// ============================================================

/**
 * 打印解析结果
 */
function logParseResult(result: ParseResult): void {
  if (result.error) {
    console.log(`⚠️  ${result.key}: ${result.error}`);
    return;
  }

  if (result.typeInfo) {
    let propCount = 0;
    if ('properties' in result.typeInfo && result.typeInfo.properties) {
      propCount = Object.keys(result.typeInfo.properties).length;
    }
    console.log(`✅ ${result.key}: ${propCount} 个属性`);
  }
}

/**
 * 打印统计摘要
 */
function logSummary(
  successCount: number,
  failCount: number,
  duration: string,
  outputPath: string,
  cacheSize: number,
  projectRoot: string,
): void {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 统计: 成功 ${successCount}, 失败 ${failCount}`);
  console.log(`🗄️  类型缓存: ${cacheSize} 个类型`);
  console.log(`⏱️  耗时: ${duration}s`);
  console.log(`📁 输出: ${path.relative(projectRoot, outputPath)}`);
  console.log('');
}

// ============================================================
// 纯函数
// ============================================================

/**
 * 解析单个注册项
 */
function parseRegistryItem(
  project: Project,
  key: string,
  item: RegistryItem,
  pathResolver: ReturnType<typeof createPathResolver>,
): ParseResult {
  const fullPath = pathResolver.resolve(item.sourcePath);

  if (!fileExists(fullPath)) {
    return {
      key,
      typeInfo: null,
      error: `文件不存在 (${item.sourcePath})`,
    };
  }

  try {
    const sourceFile = project.getSourceFile(fullPath);
    if (!sourceFile) {
      return {
        key,
        typeInfo: null,
        error: `无法加载源文件 (${item.sourcePath})`,
      };
    }

    let typeInfo: TypeInfo | null = null;

    if (item.typeName) {
      // 类型模式：直接查找指定类型
      typeInfo = resolveType(sourceFile, item.typeName);
      if (!typeInfo) {
        return {
          key,
          typeInfo: null,
          error: `无法找到类型 ${item.typeName}`,
        };
      }
    } else {
      // 组件模式：提取 React 组件的 Props
      const componentName = item.exportName || key;
      typeInfo = findComponentProps(sourceFile, componentName);
      if (!typeInfo) {
        return {
          key,
          typeInfo: null,
          error: `无法找到组件 ${componentName}`,
        };
      }
    }

    return { key, typeInfo };
  } catch (error) {
    return {
      key,
      typeInfo: null,
      error: (error as Error).message,
    };
  }
}

/**
 * 构建输出结果（纯函数）
 */
function buildOutputResult(
  keys: Record<string, TypeInfo>,
  typeRegistry: Record<string, TypeInfo>,
): OutputResult {
  return {
    generatedAt: new Date().toISOString(),
    keys,
    typeRegistry,
  };
}

/**
 * 计算耗时（纯函数）
 */
function calculateDuration(startTime: number): string {
  return ((Date.now() - startTime) / 1000).toFixed(2);
}

// ============================================================
// 配置加载
// ============================================================

/**
 * 加载配置文件
 */
async function loadConfig(projectRoot: string): Promise<ReactTypeDocConfig> {
  const configPath = path.resolve(projectRoot, 'reactTypeDoc.config.ts');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      '配置文件不存在。请先运行 "npx react-type-doc init" 初始化配置文件。',
    );
  }

  // 动态导入 TypeScript 配置文件
  const configModule = await import(configPath);
  const config = configModule.default || configModule;

  return config;
}

// ============================================================
// 主函数（组合纯函数与 IO）
// ============================================================

/**
 * 执行生成命令
 */
export async function runGenerate(): Promise<void> {
  console.log('\n📚 React 类型文档生成工具\n');
  console.log('='.repeat(60));

  const startTime = Date.now();
  const projectRoot = process.cwd();

  try {
    // 加载配置
    const config = await loadConfig(projectRoot);

    // 初始化解析选项（合并配置与默认值）
    initParseOptions(config.options);

    // 创建路径解析器
    const pathResolver = createPathResolver(projectRoot, config.tsConfigPath);

    // 解析 tsconfig 路径
    const tsConfigPath = pathResolver.resolve(config.tsConfigPath);

    const project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: false,
    });

    console.log(
      `📝 已加载 tsconfig 中的 ${project.getSourceFiles().length} 个文件\n`,
    );

    // 展开 scanDirs 配置并与手动 registry 合并（手动 registry 优先）
    const manualRegistry = config.registry ?? {};
    let mergedRegistry: Record<string, RegistryItem> = { ...manualRegistry };

    if (config.scanDirs && config.scanDirs.length > 0) {
      const scanResult = expandScanDirs(config.scanDirs, project, pathResolver);
      mergedRegistry = { ...scanResult, ...manualRegistry };
      console.log('');
    }

    const registryEntries = Object.entries(mergedRegistry);
    console.log(`📋 注册表中有 ${registryEntries.length} 个类型需要解析\n`);

    // 清空全局类型缓存，准备解析
    clearTypeCache();

    // 解析结果
    const keys: Record<string, TypeInfo> = {};
    let successCount = 0;
    let failCount = 0;

    // 逐个解析类型
    for (const [key, item] of registryEntries) {
      const result = parseRegistryItem(project, key, item, pathResolver);
      logParseResult(result);

      if (result.typeInfo) {
        keys[key] = result.typeInfo;
        successCount++;
      } else {
        failCount++;
      }
    }

    // 从全局缓存收集类型注册表
    const typeRegistry = getTypeCacheSnapshot();
    console.log(`\n📋 类型注册表: ${Object.keys(typeRegistry).length} 个类型`);

    // 构建输出（纯函数）
    const output = buildOutputResult(keys, typeRegistry);

    // 解析输出路径
    const outputPath = pathResolver.resolve(config.outputPath);

    // 写入文件（IO）
    writeJsonFile(outputPath, output);

    // 打印摘要（IO）
    const duration = calculateDuration(startTime);
    logSummary(
      successCount,
      failCount,
      duration,
      outputPath,
      Object.keys(typeRegistry).length,
      projectRoot,
    );
  } catch (error) {
    console.error('\n❌ 生成失败:', (error as Error).message);
    process.exit(1);
  }
}
