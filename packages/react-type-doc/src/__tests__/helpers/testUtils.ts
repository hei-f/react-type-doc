/**
 * 测试辅助工具
 */

import { Project } from 'ts-morph';
import type { Type } from 'ts-morph';

/**
 * 创建测试用的 TypeScript 项目
 */
export function createTestProject(options?: {
  compilerOptions?: Record<string, unknown>;
}): Project {
  return new Project({
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
      moduleResolution: 2, // Node
      esModuleInterop: true,
      skipLibCheck: true,
      jsx: 2, // React
      strict: true,
      ...options?.compilerOptions,
    },
    useInMemoryFileSystem: true,
    skipFileDependencyResolution: true,
  });
}

/**
 * 在项目中创建测试文件并获取类型
 */
export function createTestFile(
  project: Project,
  fileName: string,
  content: string,
): void {
  project.createSourceFile(fileName, content, { overwrite: true });
}

/**
 * 从测试文件中获取导出的类型
 */
export function getExportedType(
  project: Project,
  fileName: string,
  typeName: string,
): Type | undefined {
  const sourceFile = project.getSourceFile(fileName);
  if (!sourceFile) {
    throw new Error(`Source file ${fileName} not found`);
  }

  // 尝试从类型别名获取
  const typeAlias = sourceFile.getTypeAlias(typeName);
  if (typeAlias) {
    return typeAlias.getType();
  }

  // 尝试从接口获取
  const interfaceDecl = sourceFile.getInterface(typeName);
  if (interfaceDecl) {
    return interfaceDecl.getType();
  }

  // 尝试从导出的变量获取
  const variableDecl = sourceFile.getVariableDeclaration(typeName);
  if (variableDecl) {
    return variableDecl.getType();
  }

  return undefined;
}

/**
 * 从测试文件中获取函数参数类型
 */
export function getFunctionParamType(
  project: Project,
  fileName: string,
  functionName: string,
  paramIndex: number = 0,
): Type | undefined {
  const sourceFile = project.getSourceFile(fileName);
  if (!sourceFile) {
    throw new Error(`Source file ${fileName} not found`);
  }

  const functionDecl = sourceFile.getFunction(functionName);
  if (!functionDecl) {
    return undefined;
  }

  const params = functionDecl.getParameters();
  if (paramIndex >= params.length) {
    return undefined;
  }

  const param = params[paramIndex];
  return param ? param.getType() : undefined;
}

/**
 * 断言类型信息包含指定字段
 */
export function expectTypeInfoToHaveProperty(
  typeInfo: Record<string, unknown>,
  propertyPath: string,
): void {
  const paths = propertyPath.split('.');
  let current: unknown = typeInfo;

  for (const path of paths) {
    if (current === null || current === undefined || typeof current !== 'object') {
      throw new Error(
        `Expected type info to have property '${propertyPath}', but got ${String(current)} at '${path}'`,
      );
    }
    if (!(path in current)) {
      throw new Error(
        `Expected type info to have property '${propertyPath}', but '${path}' not found`,
      );
    }
    current = (current as Record<string, unknown>)[path];
  }
}

/**
 * 从 fixture 文件加载测试类型代码
 */
export function loadFixture(_fixtureName: string): string {
  // 在实际测试中，这个函数会从文件系统读取
  // 这里提供一个占位实现
  return '';
}

/**
 * 清理测试项目
 */
export function cleanupTestProject(project: Project): void {
  project.getSourceFiles().forEach((file) => {
    file.delete();
  });
}

/**
 * 断言类型文本匹配（忽略空格差异）
 */
export function expectTypeTextMatch(actual: string, expected: string): void {
  const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
  const normalizedActual = normalize(actual);
  const normalizedExpected = normalize(expected);

  if (normalizedActual !== normalizedExpected) {
    throw new Error(
      `Type text mismatch:\nExpected: ${normalizedExpected}\nActual: ${normalizedActual}`,
    );
  }
}
