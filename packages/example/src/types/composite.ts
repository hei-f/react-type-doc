/**
 * 复合类型定义
 * 测试联合类型、交叉类型、索引类型等
 */

/** 联合类型 */
export type StringOrNumber = string | number;
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type MixedUnion = string | number | boolean | null | undefined;

/** 交叉类型 */
export interface HasId {
  id: string;
}

export interface HasTimestamp {
  createdAt: Date;
  updatedAt: Date;
}

export type EntityWithTimestamp = HasId & HasTimestamp;

/** 复杂交叉类型 */
export interface HasName {
  name: string;
}

export interface HasDescription {
  description?: string;
}

export type FullEntity = HasId & HasName & HasDescription & HasTimestamp;

/** 索引签名类型 */
export interface Dictionary<T = unknown> {
  [key: string]: T;
}

export interface NumberDictionary {
  [index: number]: string;
}

export interface MixedIndex {
  [key: string]: string | number;
  length: number;
  name: string;
}

/** 嵌套对象类型 */
export interface NestedObject {
  user: {
    profile: {
      name: string;
      avatar?: string;
      settings: {
        theme: 'light' | 'dark';
        language: string;
      };
    };
    permissions: {
      read: boolean;
      write: boolean;
      admin: boolean;
    };
  };
  metadata: {
    version: string;
    tags: string[];
  };
}

/** 可辨识联合类型 */
export type ApiResponse<T = unknown> =
  | {
      status: 'success';
      data: T;
    }
  | {
      status: 'error';
      error: {
        code: string;
        message: string;
      };
    }
  | {
      status: 'loading';
    };

/** 包含超长匿名对象和函数类型的接口（测试 UI 标题/面包屑截断） */
export interface LongAnonymousTypes {
  /** 超长匿名对象：数据库连接配置 */
  databaseConfig: {
    host: string;
    port: number;
    databaseName: string;
    username: string;
    password: string;
    maxConnections: number;
    connectionTimeout: number;
    retryAttempts: number;
    enableSSL: boolean;
    sslCertificatePath: string;
    poolSize: number;
    idleTimeout: number;
  };
  /** 超长匿名函数：复杂表单提交回调 */
  onFormSubmit: (
    formData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
      phoneNumber: string;
      address: string;
      city: string;
      zipCode: string;
      country: string;
    },
    options: {
      validateEmail: boolean;
      sendConfirmation: boolean;
      redirectUrl: string;
      enableTwoFactor: boolean;
    },
  ) => Promise<{
    success: boolean;
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>;
  /** 超长匿名联合类型 */
  response:
    | {
        type: 'success';
        data: {
          id: string;
          name: string;
          email: string;
          role: string;
          permissions: string[];
        };
      }
    | {
        type: 'validationError';
        fields: {
          fieldName: string;
          errorMessage: string;
          errorCode: number;
        }[];
      }
    | {
        type: 'serverError';
        statusCode: number;
        message: string;
        traceId: string;
        timestamp: string;
      };
}

/** 复杂联合类型 */
export interface TextNode {
  type: 'text';
  content: string;
}

export interface ImageNode {
  type: 'image';
  src: string;
  alt?: string;
}

export interface ContainerNode {
  type: 'container';
  children: DocumentNode[];
}

export type DocumentNode = TextNode | ImageNode | ContainerNode;
