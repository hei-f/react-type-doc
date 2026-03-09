/**
 * react-docgen 适配器
 */

import { parse } from 'react-docgen';
import fs from 'fs';
import path from 'path';
import type { BenchmarkResult, ToolAdapter } from '../types';
import {
  getProjectRoot,
  getOutputDir,
  getFileSize,
  formatFileSize,
  measurePerformance,
  writeJsonFile,
} from '../utils';

export const reactDocgenAdapter: ToolAdapter = {
  name: 'react-docgen',

  async run(): Promise<BenchmarkResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const outputDir = getOutputDir();
    const outputPath = path.join(outputDir, 'react-docgen.json');

    try {
      const { result, duration } = await measurePerformance(async () => {
        try {
          const componentsDir = path.join(getProjectRoot(), 'src/components');
          const componentFiles = fs
            .readdirSync(componentsDir)
            .filter((file) => file.endsWith('.tsx'))
            .map((file) => path.join(componentsDir, file));

          const docs = componentFiles
            .map((file) => {
              try {
                const source = fs.readFileSync(file, 'utf-8');
                return parse(source);
              } catch (error) {
                warnings.push(`解析 ${file} 失败: ${(error as Error).message}`);
                return null;
              }
            })
            .filter((doc) => doc !== null);

          return docs;
        } catch (error) {
          errors.push((error as Error).message);
          throw error;
        }
      });

      // 写入输出文件
      writeJsonFile(outputPath, result);

      const fileSize = getFileSize(outputPath);

      return {
        tool: 'react-docgen',
        success: errors.length === 0,
        performance: {
          duration,
        },
        output: {
          filePath: outputPath,
          fileSize,
          fileSizeReadable: formatFileSize(fileSize),
          format: 'JSON',
        },
        features: {
          basicTypes: true,
          generics: false,
          unionTypes: true,
          intersectionTypes: false,
          utilityTypes: false,
          namespaces: false,
          circularReferences: false,
          externalTypes: false,
          typeInference: false,
          conditionalTypes: false,
          templateLiterals: false,
          mappedTypes: false,
        },
        errors,
        warnings,
      };
    } catch (error) {
      errors.push((error as Error).message);

      return {
        tool: 'react-docgen',
        success: false,
        performance: {
          duration: 0,
        },
        output: {
          filePath: outputPath,
          fileSize: 0,
          fileSizeReadable: '0 B',
          format: 'JSON',
        },
        features: {
          basicTypes: false,
          generics: false,
          unionTypes: false,
          intersectionTypes: false,
          utilityTypes: false,
          namespaces: false,
          circularReferences: false,
          externalTypes: false,
          typeInference: false,
          conditionalTypes: false,
          templateLiterals: false,
          mappedTypes: false,
        },
        errors,
        warnings,
      };
    }
  },
};
