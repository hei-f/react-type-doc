/**
 * 对比测试工具函数
 */

import fs from 'fs';
import path from 'path';

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** 获取文件大小 */
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/** 确保目录存在 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/** 清理输出目录 */
export function cleanOutputDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  ensureDir(dirPath);
}

/** 测量执行时间 */
export async function measurePerformance<T>(fn: () => Promise<T>): Promise<{
  result: T;
  duration: number;
}> {
  const startTime = performance.now();

  const result = await fn();
  const endTime = performance.now();

  return {
    result,
    duration: endTime - startTime,
  };
}

/** 读取 JSON 文件 */
export function readJsonFile<T = unknown>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/** 写入 JSON 文件 */
export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/** 获取项目根目录 */
export function getProjectRoot(): string {
  // ESM 模块中使用 import.meta.url 替代 __dirname
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  return path.resolve(currentDir, '../..');
}

/** 获取输出目录 */
export function getOutputDir(): string {
  return path.join(getProjectRoot(), 'benchmark-output');
}
