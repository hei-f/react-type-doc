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
