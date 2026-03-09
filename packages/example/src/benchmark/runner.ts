/**
 * 对比测试执行器
 */

import { reactTypeDocAdapter } from './adapters/react-type-doc';
import { reactDocgenTypescriptAdapter } from './adapters/react-docgen-typescript';
import { reactDocgenAdapter } from './adapters/react-docgen';
import { generateReport } from './reporter';
import { cleanOutputDir, getOutputDir } from './utils';
import type { BenchmarkResult } from './types';

/** 所有适配器 */
const adapters = [
  reactTypeDocAdapter,
  reactDocgenTypescriptAdapter,
  reactDocgenAdapter,
];

/** 主函数 */
async function main() {
  console.log('🚀 开始对比测试...\n');

  // 清理输出目录
  const outputDir = getOutputDir();
  cleanOutputDir(outputDir);
  console.log(`📁 输出目录: ${outputDir}\n`);

  const results: BenchmarkResult[] = [];

  // 依次执行每个工具的测试
  for (const adapter of adapters) {
    console.log(`\n⏳ 测试 ${adapter.name}...`);
    try {
      const result = await adapter.run();
      results.push(result);

      if (result.success) {
        console.log(`✅ ${adapter.name} 测试成功`);
        console.log(`   耗时: ${result.performance.duration.toFixed(2)}ms`);
        console.log(`   输出: ${result.output.fileSizeReadable}`);
      } else {
        console.log(`❌ ${adapter.name} 测试失败`);
        console.log(`   错误: ${result.errors.join(', ')}`);
      }

      if (result.warnings.length > 0) {
        console.log(`⚠️  警告: ${result.warnings.length} 个`);
      }
    } catch (error) {
      console.error(`❌ ${adapter.name} 执行异常:`, error);
    }
  }

  // 生成报告
  console.log('\n\n📊 生成对比报告...');
  const report = generateReport(results);

  console.log('\n' + '='.repeat(80));
  console.log('📈 测试完成！');
  console.log('='.repeat(80));
  console.log(`\n总结:`);
  console.log(`  最快: ${report.summary.fastest}`);
  console.log(`  输出最小: ${report.summary.smallest}`);
  console.log(`  功能最全: ${report.summary.mostFeatures}`);
  console.log(`\n详细报告已保存到: ${outputDir}/report.json`);
  console.log(`Markdown 报告: ${outputDir}/BENCHMARK.md\n`);
}

// 执行主函数
main().catch((error) => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
