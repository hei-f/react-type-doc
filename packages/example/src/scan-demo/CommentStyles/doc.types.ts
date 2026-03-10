/**
 * 注释风格测试 - 类型定义
 * 用于验证 react-type-doc 对类型级别 JSDoc 注释的提取效果
 */

/** 单行 JSDoc 描述的接口 */
export interface SingleLineDocInterface {
  /** 名称 */
  name: string;
  /** 年龄 */
  age: number;
}

/**
 * 多行 JSDoc 描述的接口
 *
 * 第二段：详细说明这个接口的设计意图和使用场景。
 * 当接口需要较多上下文信息时，多段落描述非常有用。
 */
export interface MultiLineDocInterface {
  /** 标题 */
  title: string;
  /**
   * 状态
   * @default 'draft'
   */
  status: 'draft' | 'published' | 'archived';
}

/**
 * 使用 type alias 定义的类型（测试 type 与 interface 注释提取一致性）
 */
export type AliasWithDoc = {
  /** 主键 */
  id: string;
  /** 创建时间 */
  createdAt: Date;
};

/**
 * 联合类型的注释
 * 展示联合类型的描述是否能正确提取
 */
export type DocumentedUnion = 'pending' | 'active' | 'inactive' | 'deleted';

/**
 * 权限级别常量
 * @description 用于测试 const 对象的注释是否被正确处理
 */
export const Permission = {
  /** 只读权限 */
  Read: 'READ',
  /** 读写权限 */
  Write: 'WRITE',
  /** 管理员权限 */
  Admin: 'ADMIN',
} as const;

/** 权限级别类型 */
export type Permission = (typeof Permission)[keyof typeof Permission];

/**
 * 复杂属性注释测试
 * 包含函数类型属性、可选属性、嵌套对象等场景的注释提取
 */
export interface ComplexCommentProps {
  /**
   * 数据变更回调
   * @param key - 变更的字段名
   * @param value - 新的值
   */
  onChange: (key: string, value: unknown) => void;

  /**
   * 异步提交处理器
   * @returns 提交是否成功
   */
  onSubmit: () => Promise<boolean>;

  /**
   * 嵌套配置对象
   * 每个子属性都有独立的注释
   */
  config: {
    /** API 基础地址 */
    baseUrl: string;
    /** 请求超时时间（毫秒） */
    timeout: number;
    /** 重试配置 */
    retry: {
      /** 最大重试次数 */
      maxRetries: number;
      /** 重试间隔（毫秒） */
      delay: number;
    };
  };
}
