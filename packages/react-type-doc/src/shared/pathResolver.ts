/**
 * 路径别名解析器
 * @description 从 tsconfig.json 中读取路径别名配置，解析配置文件中的路径
 */

import fs from 'fs';
import path from 'path';

/** 路径映射配置 */
interface PathMapping {
  /** 别名前缀（如 @/） */
  alias: string;
  /** 对应的实际路径 */
  resolvedPath: string;
}

/** tsconfig.json 的类型定义 */
interface TsConfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

/** 路径解析器类 */
export class PathResolver {
  private projectRoot: string;
  private pathMappings: PathMapping[] = [];

  constructor(projectRoot: string, tsConfigPath: string) {
    this.projectRoot = projectRoot;
    this.loadPathMappings(tsConfigPath);
  }

  /**
   * 从 tsconfig.json 加载路径映射配置
   */
  private loadPathMappings(tsConfigPath: string): void {
    const fullTsConfigPath = this.resolveFromProjectRoot(tsConfigPath);

    if (!fs.existsSync(fullTsConfigPath)) {
      throw new Error(
        `tsconfig 文件不存在: ${fullTsConfigPath}\n请检查配置文件中的 tsConfigPath 是否正确。`,
      );
    }

    let tsConfig: TsConfig;
    try {
      const tsConfigContent = fs.readFileSync(fullTsConfigPath, 'utf-8');

      try {
        // 尝试直接解析（如果是合法的 JSON）
        tsConfig = JSON.parse(tsConfigContent) as TsConfig;
      } catch {
        // 如果失败，移除注释和尾随逗号后再解析
        const jsonContent = tsConfigContent
          .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
          .replace(/\/\/.*/g, '') // 移除行注释
          .replace(/,(\s*[}\]])/g, '$1'); // 移除尾随逗号
        tsConfig = JSON.parse(jsonContent) as TsConfig;
      }
    } catch (error) {
      throw new Error(
        `tsconfig.json 解析失败: ${
          (error as Error).message
        }\n文件路径: ${fullTsConfigPath}\n请检查 tsconfig.json 格式是否正确。`,
      );
    }

    const { baseUrl, paths } = tsConfig.compilerOptions || {};

    if (!paths) {
      // paths 不存在不算致命错误，只是无法使用路径别名
      return;
    }

    try {
      // 解析 baseUrl（相对于 tsconfig.json 所在目录）
      // 如果没有 baseUrl，默认使用 tsconfig.json 所在目录
      const tsConfigDir = path.dirname(fullTsConfigPath);
      const resolvedBaseUrl = baseUrl
        ? path.resolve(tsConfigDir, baseUrl)
        : tsConfigDir;

      // 解析 paths 配置
      for (const [alias, targetPaths] of Object.entries(paths)) {
        if (!Array.isArray(targetPaths) || targetPaths.length === 0) {
          continue;
        }

        const firstPath = targetPaths[0];
        if (!firstPath) {
          continue;
        }

        // 移除通配符 *
        const cleanAlias = alias.replace(/\/\*$/, '/');
        const cleanTarget = firstPath.replace(/\/\*$/, '/');

        // 解析目标路径
        const resolvedPath = path.resolve(resolvedBaseUrl, cleanTarget);

        this.pathMappings.push({
          alias: cleanAlias,
          resolvedPath,
        });
      }
    } catch (error) {
      throw new Error(
        `解析 tsconfig paths 配置失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 解析路径（支持别名和相对路径）
   * @param inputPath 输入路径（可能包含别名，如 @/pages/...）
   * @returns 解析后的绝对路径
   */
  resolve(inputPath: string): string {
    // 移除前导的 ./
    const cleanPath = inputPath.replace(/^\.\//, '');

    // 尝试匹配路径别名
    for (const mapping of this.pathMappings) {
      if (cleanPath.startsWith(mapping.alias)) {
        const relativePath = cleanPath.slice(mapping.alias.length);
        return path.join(mapping.resolvedPath, relativePath);
      }
    }

    // 如果没有匹配的别名，作为相对路径处理
    return this.resolveFromProjectRoot(cleanPath);
  }

  /**
   * 从项目根目录解析相对路径
   */
  private resolveFromProjectRoot(relativePath: string): string {
    const cleanPath = relativePath.replace(/^\.\//, '');
    return path.resolve(this.projectRoot, cleanPath);
  }

  /**
   * 获取所有路径映射（用于调试）
   */
  getMappings(): PathMapping[] {
    return [...this.pathMappings];
  }
}

/**
 * 创建路径解析器实例
 */
export function createPathResolver(
  projectRoot: string,
  tsConfigPath: string,
): PathResolver {
  return new PathResolver(projectRoot, tsConfigPath);
}
