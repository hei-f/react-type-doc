/**
 * 目录扫描器
 * @description 扫描指定目录下的子文件夹，按约定提取组件和类型，展开为 RegistryItem
 */

import fs from 'fs';
import path from 'path';
import { Node } from 'ts-morph';
import type { Project, SourceFile } from 'ts-morph';
import {
  DEFAULT_SCAN_DIR_COMPONENT_ENTRY,
  DEFAULT_SCAN_DIR_TYPES_ENTRY,
} from '../shared/constants';
import type { PathResolver } from '../shared/pathResolver';
import type { RegistryItem, ScanDirItem } from '../shared/types';

// ============================================================
// 纯函数：文件系统查询
// ============================================================

/**
 * 获取目录下的直接子文件夹名列表
 */
function getSubDirectories(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath).filter((name) => {
    const fullPath = path.join(dirPath, name);
    return fs.statSync(fullPath).isDirectory();
  });
}

// ============================================================
// 纯函数：类型提取
// ============================================================

/**
 * 从源文件中提取所有导出的类型名称
 * 支持 interface、type alias、enum 和 as const 对象变量声明
 * 使用 Set 去重，防止同名的 type alias 和 const 变量重复注册
 */
function extractExportedTypeNames(sourceFile: SourceFile): string[] {
  const nameSet = new Set<string>();

  for (const decl of sourceFile.getInterfaces()) {
    if (decl.isExported()) {
      nameSet.add(decl.getName());
    }
  }

  for (const decl of sourceFile.getTypeAliases()) {
    if (decl.isExported()) {
      nameSet.add(decl.getName());
    }
  }

  for (const decl of sourceFile.getEnums()) {
    if (decl.isExported()) {
      nameSet.add(decl.getName());
    }
  }

  // 扫描导出的 as const 对象变量声明
  for (const statement of sourceFile.getVariableStatements()) {
    if (!statement.isExported()) {
      continue;
    }

    for (const decl of statement.getDeclarations()) {
      const initializer = decl.getInitializer();
      if (!initializer) {
        continue;
      }

      // 检测 { ... } as const 模式
      if (Node.isAsExpression(initializer)) {
        const typeNode = initializer.getTypeNode();
        if (typeNode?.getText() === 'const') {
          const innerExpr = initializer.getExpression();
          if (Node.isObjectLiteralExpression(innerExpr)) {
            nameSet.add(decl.getName());
          }
        }
      }
    }
  }

  return Array.from(nameSet);
}

// ============================================================
// 纯函数：子目录扫描
// ============================================================

/**
 * 从 ts-morph Project 中获取源文件，如果文件不在 Project 中则添加
 */
function getOrAddSourceFile(
  project: Project,
  filePath: string,
): SourceFile | null {
  const existing = project.getSourceFile(filePath);
  if (existing) {
    return existing;
  }

  try {
    return project.addSourceFileAtPath(filePath);
  } catch (error) {
    console.error(
      `  ⚠️  无法加载源文件: ${filePath}`,
      (error as Error).message,
    );
    return null;
  }
}

/**
 * 扫描单个子目录，生成 RegistryItem 条目
 * @param project ts-morph Project 实例
 * @param resolvedDirPath 子目录的绝对路径
 * @param folderName 子文件夹名称
 * @param originalScanPath 配置中的原始扫描路径（保留别名格式）
 * @param componentEntry 组件入口文件名
 * @param typesEntry 类型定义文件名
 * @returns [registryKey, registryItem] 条目数组
 */
function scanSubDirectory(
  project: Project,
  resolvedDirPath: string,
  folderName: string,
  originalScanPath: string,
  componentEntry: string,
  typesEntry: string,
): [string, RegistryItem][] {
  const entries: [string, RegistryItem][] = [];

  const componentFilePath = path.join(resolvedDirPath, componentEntry);
  if (fs.existsSync(componentFilePath)) {
    entries.push([
      folderName,
      {
        sourcePath: `${originalScanPath}/${folderName}/${componentEntry}`,
      },
    ]);
  }

  const typesFilePath = path.join(resolvedDirPath, typesEntry);
  if (fs.existsSync(typesFilePath)) {
    const sourceFile = getOrAddSourceFile(project, typesFilePath);
    if (sourceFile) {
      const typeNames = extractExportedTypeNames(sourceFile);
      for (const typeName of typeNames) {
        entries.push([
          `${folderName}/${typeName}`,
          {
            sourcePath: `${originalScanPath}/${folderName}/${typesEntry}`,
            typeName,
          },
        ]);
      }
    }
  }

  return entries;
}

// ============================================================
// 日志函数（副作用隔离）
// ============================================================

/** 单个目录的扫描统计 */
interface ScanStats {
  /** 扫描到的子目录数 */
  totalDirs: number;
  /** 发现的组件数 */
  componentCount: number;
  /** 发现的类型数 */
  typeCount: number;
}

/**
 * 打印扫描统计信息
 */
function logScanStats(scanPath: string, stats: ScanStats): void {
  console.log(
    `📂 扫描目录: ${scanPath} (${stats.totalDirs} 个子目录, ` +
      `${stats.componentCount} 个组件, ${stats.typeCount} 个类型)`,
  );
}

// ============================================================
// 公共接口
// ============================================================

/**
 * 展开 scanDirs 配置为 RegistryItem 映射
 * @param scanDirs 目录扫描配置列表
 * @param project ts-morph Project 实例
 * @param pathResolver 路径解析器
 * @returns 展开后的 RegistryItem 映射（可与手动 registry 合并）
 */
export function expandScanDirs(
  scanDirs: ScanDirItem[],
  project: Project,
  pathResolver: PathResolver,
): Record<string, RegistryItem> {
  const result: Record<string, RegistryItem> = {};

  for (const scanDir of scanDirs) {
    const resolvedPath = pathResolver.resolve(scanDir.path);
    const subDirs = getSubDirectories(resolvedPath);
    const componentEntry =
      scanDir.componentEntry ?? DEFAULT_SCAN_DIR_COMPONENT_ENTRY;
    const typesEntry = scanDir.typesEntry ?? DEFAULT_SCAN_DIR_TYPES_ENTRY;

    const stats: ScanStats = {
      totalDirs: subDirs.length,
      componentCount: 0,
      typeCount: 0,
    };

    for (const folderName of subDirs) {
      const subDirPath = path.join(resolvedPath, folderName);
      const entries = scanSubDirectory(
        project,
        subDirPath,
        folderName,
        scanDir.path,
        componentEntry,
        typesEntry,
      );

      for (const [key, item] of entries) {
        if (item.typeName) {
          stats.typeCount++;
        } else {
          stats.componentCount++;
        }
        result[key] = item;
      }
    }

    logScanStats(scanDir.path, stats);
  }

  return result;
}
