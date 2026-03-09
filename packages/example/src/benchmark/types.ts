/**
 * 对比测试类型定义
 */

/** 功能支持情况 */
export interface FeatureSupport {
  /** 支持基础类型 */
  basicTypes: boolean;
  /** 支持泛型 */
  generics: boolean;
  /** 支持联合类型 */
  unionTypes: boolean;
  /** 支持交叉类型 */
  intersectionTypes: boolean;
  /** 支持工具类型 */
  utilityTypes: boolean;
  /** 支持命名空间 */
  namespaces: boolean;
  /** 支持循环引用 */
  circularReferences: boolean;
  /** 支持外部类型 */
  externalTypes: boolean;
  /** 支持类型推断 */
  typeInference: boolean;
  /** 支持条件类型 */
  conditionalTypes: boolean;
  /** 支持模板字面量 */
  templateLiterals: boolean;
  /** 支持映射类型 */
  mappedTypes: boolean;
}

/** 性能指标 */
export interface PerformanceMetrics {
  /** 执行时间（毫秒） */
  duration: number;
}

/** 输出信息 */
export interface OutputInfo {
  /** 输出文件路径 */
  filePath: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 文件大小（可读格式） */
  fileSizeReadable: string;
  /** 输出格式 */
  format: string;
}

/** 测试结果 */
export interface BenchmarkResult {
  /** 工具名称 */
  tool: string;
  /** 是否成功 */
  success: boolean;
  /** 性能指标 */
  performance: PerformanceMetrics;
  /** 输出信息 */
  output: OutputInfo;
  /** 功能支持 */
  features: FeatureSupport;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

/** 对比报告 */
export interface BenchmarkReport {
  /** 生成时间 */
  generatedAt: string;
  /** 测试结果列表 */
  results: BenchmarkResult[];
  /** 总结 */
  summary: {
    /** 最快的工具 */
    fastest: string;
    /** 输出最小的工具 */
    smallest: string;
    /** 功能最全的工具 */
    mostFeatures: string;
  };
}

/** 工具适配器接口 */
export interface ToolAdapter {
  /** 工具名称 */
  name: string;
  /** 执行测试 */
  run: () => Promise<BenchmarkResult>;
}
