/**
 * react-docgen-typescript 适配器
 */

import { withDefaultConfig } from 'react-docgen-typescript';
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

export const reactDocgenTypescriptAdapter: ToolAdapter = {
  name: 'react-docgen-typescript',

  async run(): Promise<BenchmarkResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const outputDir = getOutputDir();
    const outputPath = path.join(outputDir, 'react-docgen-typescript.json');

    try {
      const { result, duration } = await measurePerformance(async () => {
        try {
          const parser = withDefaultConfig({
            savePropValueAsString: true,
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
          });

          const componentsDir = path.join(getProjectRoot(), 'src/components');
          const componentFiles = fs
            .readdirSync(componentsDir)
            .filter((file) => file.endsWith('.tsx'))
            .map((file) => path.join(componentsDir, file));

          const docs = componentFiles.flatMap((file) => {
            try {
              return parser.parse(file);
            } catch (error) {
              warnings.push(`解析 ${file} 失败: ${(error as Error).message}`);
              return [];
            }
          });

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
        tool: 'react-docgen-typescript',
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
          generics: true,
          unionTypes: true,
          intersectionTypes: true,
          utilityTypes: true,
          namespaces: false,
          circularReferences: false,
          externalTypes: true,
          typeInference: true,
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
        tool: 'react-docgen-typescript',
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
