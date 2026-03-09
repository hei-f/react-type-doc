/**
 * 对比测试报告生成器
 */

import fs from 'fs';
import path from 'path';
import type { BenchmarkResult, BenchmarkReport } from './types';
import { getOutputDir } from './utils';

/** 生成对比报告 */
export function generateReport(results: BenchmarkResult[]): BenchmarkReport {
  const report: BenchmarkReport = {
    generatedAt: new Date().toISOString(),
    results,
    summary: {
      fastest: findFastest(results),
      smallest: findSmallest(results),
      mostFeatures: findMostFeatures(results),
    },
  };

  // 保存 JSON 报告
  const outputDir = getOutputDir();
  fs.writeFileSync(
    path.join(outputDir, 'report.json'),
    JSON.stringify(report, null, 2),
    'utf-8',
  );

  // 生成 Markdown 报告
  const markdown = generateMarkdown(report);
  fs.writeFileSync(path.join(outputDir, 'BENCHMARK.md'), markdown, 'utf-8');

  return report;
}

/** 找到最快的工具 */
function findFastest(results: BenchmarkResult[]): string {
  const successful = results.filter((r) => r.success);
  if (successful.length === 0) return 'N/A';

  const fastest = successful.reduce((prev, curr) =>
    curr.performance.duration < prev.performance.duration ? curr : prev,
  );

  return fastest.tool;
}

/** 找到输出最小的工具 */
function findSmallest(results: BenchmarkResult[]): string {
  const successful = results.filter((r) => r.success);
  if (successful.length === 0) return 'N/A';

  const smallest = successful.reduce((prev, curr) =>
    curr.output.fileSize < prev.output.fileSize ? curr : prev,
  );

  return smallest.tool;
}

/** 找到功能最全的工具 */
function findMostFeatures(results: BenchmarkResult[]): string {
  const successful = results.filter((r) => r.success);
  if (successful.length === 0) return 'N/A';

  const mostFeatures = successful.reduce((prev, curr) => {
    const prevCount = Object.values(prev.features).filter(Boolean).length;
    const currCount = Object.values(curr.features).filter(Boolean).length;
    return currCount > prevCount ? curr : prev;
  });

  return mostFeatures.tool;
}

/** 生成 Markdown 报告 */
function generateMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [];

  lines.push('# TypeScript 类型文档生成工具对比测试报告');
  lines.push('');
  lines.push(
    `生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}`,
  );
  lines.push('');

  // 总结
  lines.push('## 📊 总结');
  lines.push('');
  lines.push(`- **最快**: ${report.summary.fastest}`);
  lines.push(`- **输出最小**: ${report.summary.smallest}`);
  lines.push(`- **功能最全**: ${report.summary.mostFeatures}`);
  lines.push('');

  // 性能对比
  lines.push('## ⚡ 性能对比');
  lines.push('');
  lines.push('| 工具 | 执行时间 | 状态 |');
  lines.push('|------|----------|------|');

  for (const result of report.results) {
    const status = result.success ? '✅' : '❌';
    const duration = result.success
      ? `${result.performance.duration.toFixed(2)}ms`
      : 'N/A';

    lines.push(`| ${result.tool} | ${duration} | ${status} |`);
  }
  lines.push('');

  // 输出文件大小对比
  lines.push('## 📦 输出文件大小');
  lines.push('');
  lines.push('| 工具 | 文件大小 | 格式 |');
  lines.push('|------|----------|------|');

  for (const result of report.results) {
    const size = result.success ? result.output.fileSizeReadable : 'N/A';
    lines.push(`| ${result.tool} | ${size} | ${result.output.format} |`);
  }
  lines.push('');

  // 功能支持对比
  lines.push('## 🎯 功能支持');
  lines.push('');
  lines.push(
    '| 功能 | ' + report.results.map((r) => r.tool).join(' | ') + ' |',
  );
  lines.push('|------|' + report.results.map(() => '------').join('|') + '|');

  const featureNames = {
    basicTypes: '基础类型',
    generics: '泛型',
    unionTypes: '联合类型',
    intersectionTypes: '交叉类型',
    utilityTypes: '工具类型',
    namespaces: '命名空间',
    circularReferences: '循环引用',
    externalTypes: '外部类型',
    typeInference: '类型推断',
    conditionalTypes: '条件类型',
    templateLiterals: '模板字面量',
    mappedTypes: '映射类型',
  };

  for (const [key, label] of Object.entries(featureNames)) {
    const featureKey = key as keyof typeof featureNames;
    const support = report.results
      .map((r) => (r.features[featureKey] ? '✅' : '❌'))
      .join(' | ');
    lines.push(`| ${label} | ${support} |`);
  }
  lines.push('');

  // 错误和警告
  lines.push('## ⚠️ 错误和警告');
  lines.push('');

  for (const result of report.results) {
    if (result.errors.length > 0 || result.warnings.length > 0) {
      lines.push(`### ${result.tool}`);
      lines.push('');

      if (result.errors.length > 0) {
        lines.push('**错误:**');
        lines.push('');
        for (const error of result.errors) {
          lines.push(`- ${error}`);
        }
        lines.push('');
      }

      if (result.warnings.length > 0) {
        lines.push('**警告:**');
        lines.push('');
        for (const warning of result.warnings) {
          lines.push(`- ${warning}`);
        }
        lines.push('');
      }
    }
  }

  // 易用程度评价
  lines.push('## 📝 易用程度评价');
  lines.push('');
  lines.push('### react-type-doc');
  lines.push('');
  lines.push('- **配置复杂度**: ⭐⭐ (简单)');
  lines.push('- **上手难度**: ⭐⭐ (容易)');
  lines.push('- **文档质量**: ⭐⭐⭐ (良好)');
  lines.push(
    '- **特点**: 专为 React 组件设计，配置简单，输出结构清晰，性能优秀',
  );
  lines.push('');

  lines.push('### react-docgen-typescript');
  lines.push('');
  lines.push('- **配置复杂度**: ⭐⭐⭐ (中等)');
  lines.push('- **上手难度**: ⭐⭐⭐ (中等)');
  lines.push('- **文档质量**: ⭐⭐⭐⭐ (优秀)');
  lines.push(
    '- **特点**: 功能强大，社区活跃，适合复杂的 React + TypeScript 项目',
  );
  lines.push('');

  lines.push('### react-docgen');
  lines.push('');
  lines.push('- **配置复杂度**: ⭐⭐ (简单)');
  lines.push('- **上手难度**: ⭐⭐ (容易)');
  lines.push('- **文档质量**: ⭐⭐⭐⭐ (优秀)');
  lines.push(
    '- **特点**: Facebook 官方工具，稳定可靠，但对 TypeScript 高级特性支持有限',
  );
  lines.push('');

  return lines.join('\n');
}
