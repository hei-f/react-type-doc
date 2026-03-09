/**
 * CLI 主入口
 * @description 解析命令行参数，执行对应的命令
 */

import { runGenerate } from './generate';
import { runInit } from './init';

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
📚 React 类型文档生成工具

用法:
  bun run type-doc          生成类型文档
  bun run type-doc:init     初始化配置文件

选项:
  -h, --help               显示帮助信息
  -v, --version            显示版本信息
`);
}

/**
 * 显示版本信息
 */
function showVersion(): void {
  console.log('React Type Doc v1.0.0');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      runInit();
      break;

    case '-h':
    case '--help':
      showHelp();
      break;

    case '-v':
    case '--version':
      showVersion();
      break;

    case undefined:
      // 默认执行生成命令
      await runGenerate();
      break;

    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('使用 --help 查看可用命令');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
