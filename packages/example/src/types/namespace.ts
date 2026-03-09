/**
 * 命名空间类型定义
 * 测试命名空间、模块声明等场景
 */

/** 基础命名空间 */
export namespace API {
  export interface Request {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: unknown;
  }

  export interface Response<T = unknown> {
    status: number;
    data: T;
    message?: string;
  }

  export interface Error {
    code: string;
    message: string;
    details?: unknown;
  }
}

/** 嵌套命名空间 */
export namespace Models {
  export namespace User {
    export interface Profile {
      avatar: string;
      bio: string;
      website?: string;
    }

    export interface Settings {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
    }

    export interface Entity {
      id: string;
      username: string;
      email: string;
      profile: Profile;
      settings: Settings;
      createdAt: Date;
    }
  }

  export namespace Post {
    export interface Entity {
      id: string;
      title: string;
      content: string;
      author: User.Entity;
      tags: string[];
      publishedAt: Date;
    }

    export interface CreateDTO {
      title: string;
      content: string;
      tags?: string[];
    }

    export interface UpdateDTO {
      title?: string;
      content?: string;
      tags?: string[];
    }
  }
}

/** 命名空间与类型别名组合 */
export namespace Services {
  export type ServiceConfig = {
    baseUrl: string;
    timeout: number;
    retries: number;
  };

  export interface IUserService {
    getUser(id: string): Promise<Models.User.Entity>;
    updateUser(
      id: string,
      data: Partial<Models.User.Entity>,
    ): Promise<Models.User.Entity>;
    deleteUser(id: string): Promise<void>;
  }

  export interface IPostService {
    getPost(id: string): Promise<Models.Post.Entity>;
    createPost(data: Models.Post.CreateDTO): Promise<Models.Post.Entity>;
    updatePost(
      id: string,
      data: Models.Post.UpdateDTO,
    ): Promise<Models.Post.Entity>;
    deletePost(id: string): Promise<void>;
  }
}

/** 命名空间合并 */
export namespace App {
  export interface Config {
    apiUrl: string;
    version: string;
  }
}

export namespace App {
  export interface State {
    user: Models.User.Entity | null;
    isAuthenticated: boolean;
  }
}

export namespace App {
  export interface Actions {
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<Models.User.Profile>) => Promise<void>;
  }
}

/** 全局命名空间扩展 */
declare global {
  namespace GlobalTypes {
    interface Window {
      APP_CONFIG: App.Config;
    }
  }
}

/** 导出组合类型 */
export type UserService = Services.IUserService;
export type PostService = Services.IPostService;
export type AppContext = App.Config & App.State & App.Actions;
