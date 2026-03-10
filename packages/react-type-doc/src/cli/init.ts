/**
 * 初始化命令
 * @description 生成 reactTypeDoc.config.ts 配置文件模板
 */

import fs from 'fs';
import path from 'path';

/** 配置文件模板 */
const CONFIG_TEMPLATE = `import { defineConfig } from './scripts/reactTypeDoc';

export default defineConfig({
  /** tsconfig 路径（相对于项目根目录） */
  tsConfigPath: './tsconfig.json',

  /** 输出文件路径（支持 tsconfig 路径别名，如 @/pages/...） */
  outputPath: '@/pages/generated/propsDocData.json',

  /** 解析选项（可选） */
  options: {
    maxDepth: 10,
    maxTypeTextLength: 80,
    // enableSourceLocation: false, // 启用源码位置记录（会增大输出文件）
  },

  /** 目录扫描（自动批量注册） */
  // scanDirs: [
  //   {
  //     // 扫描目录路径，自动发现子文件夹中的组件和类型
  //     // 默认约定：子文件夹/index.tsx → 组件，子文件夹/doc.types.ts → 类型
  //     path: '@/components',
  //     // componentEntry: 'index.tsx',   // 可自定义组件入口文件名
  //     // typesEntry: 'doc.types.ts',    // 可自定义类型定义文件名
  //   },
  // ],

  /** 类型注册表（手动注册） */
  registry: {
    // 示例：解析 React 组件的 Props
    // ExampleComponent: {
    //   sourcePath: '@/components/ExampleComponent.tsx',
    // },

    // 示例：解析指定的类型定义
    // ExampleType: {
    //   sourcePath: '@/types/example.ts',
    //   typeName: 'ExampleType',
    // },
  },
});
`;

/**
 * 初始化配置文件
 * @param projectRoot 项目根目录
 * @returns 是否成功
 */
export function initConfig(projectRoot: string): boolean {
  const configPath = path.resolve(projectRoot, 'reactTypeDoc.config.ts');

  // 检查配置文件是否已存在
  if (fs.existsSync(configPath)) {
    console.log('⚠️  配置文件已存在: reactTypeDoc.config.ts');
    console.log('如需重新生成，请先删除现有配置文件。');
    return false;
  }

  try {
    // 写入配置文件
    fs.writeFileSync(configPath, CONFIG_TEMPLATE, 'utf-8');
    console.log('✅ 成功生成配置文件: reactTypeDoc.config.ts');
    console.log('');
    console.log('请编辑配置文件，添加需要解析的组件和类型。');
    console.log('配置完成后，运行以下命令生成类型文档：');
    console.log('  bun run type-doc');
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ 生成配置文件失败:', (error as Error).message);
    return false;
  }
}

/**
 * 执行初始化命令
 */
export function runInit(): void {
  console.log('\n📚 React 类型文档生成工具 - 初始化\n');
  console.log('='.repeat(60));

  const projectRoot = process.cwd();
  initConfig(projectRoot);
}
