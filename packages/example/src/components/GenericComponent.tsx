/**
 * 泛型组件
 * 使用泛型类型作为 Props
 */

import type { ReactNode } from 'react';
import type {
  Box,
  Response,
  Repository,
  Pair,
  WithLength,
} from '../types/generics';

export interface GenericComponentProps<T> {
  /** 数据容器 */
  data: Box<T>;
  /** 响应状态 */
  response: Response<T>;
  /** 数据仓库 */
  repository?: Repository<T & { id: string }>;
  /** 渲染函数 */
  renderItem: (item: T) => ReactNode;
  /** 加载回调 */
  onLoad?: () => Promise<T>;
}

export const GenericComponent = <T,>(props: GenericComponentProps<T>) => {
  return (
    <div>
      <div>{props.renderItem(props.data.value)}</div>
      {props.response.loading && <p>Loading...</p>}
      {props.response.error && <p>Error: {props.response.error.message}</p>}
    </div>
  );
};

// ============================================================
// 泛型实例化组件（用实际类型替换类型参数）
// ============================================================

/**
 * 字符串类型的泛型组件
 *
 * 将 GenericComponentProps 的类型参数 T 实例化为 string，
 * 此时所有涉及 T 的属性都会变成具体的 string 类型。
 * 这个组件可以被 react-docgen-typescript 解析，用于对比测试。
 *
 * @example
 * ```tsx
 * <StringGenericComponent
 *   data={{ value: "hello" }}
 *   response={{ loading: false }}
 *   renderItem={(item) => <span>{item.toUpperCase()}</span>}
 * />
 * ```
 */
export const StringGenericComponent = (
  props: GenericComponentProps<string>,
) => {
  return <GenericComponent {...props} />;
};

// ============================================================
// 其他泛型实例化组件示例
// ============================================================

/**
 * Box<string> 实例化组件
 *
 * 使用 Box<string> 作为 Props，测试简单泛型实例化的解析。
 * Box 是最基础的泛型容器类型，只有一个 value 属性。
 */
export interface StringBoxComponentProps {
  /** 字符串容器 */
  data: Box<string>;
  /** 处理函数 */
  onProcess?: (value: string) => void;
}

export const StringBoxComponent = (props: StringBoxComponentProps) => {
  return <div>{props.data.value}</div>;
};

/**
 * Pair<string, number> 实例化组件
 *
 * 使用 Pair<string, number> 作为 Props，测试多类型参数泛型的实例化。
 * Pair 有两个类型参数 K 和 V，分别代表键和值的类型。
 */
export interface StringNumberPairComponentProps {
  /** 键值对数据 */
  pair: Pair<string, number>;
  /** 格式化函数 */
  formatter?: (key: string, value: number) => string;
}

export const StringNumberPairComponent = (
  props: StringNumberPairComponentProps,
) => {
  return (
    <div>
      {props.pair.key}: {props.pair.value}
    </div>
  );
};

/**
 * Response (默认类型参数) 实例化组件
 *
 * 使用 Response（不传类型参数）作为 Props，测试默认类型参数的解析。
 * Response 的默认类型参数是 Response<unknown, Error>。
 */
export interface DefaultResponseComponentProps {
  /** 响应数据（使用默认类型参数 unknown 和 Error） */
  response: Response;
  /** 重试函数 */
  onRetry?: () => void;
}

export const DefaultResponseComponent = (
  props: DefaultResponseComponentProps,
) => {
  return (
    <div>
      {props.response.loading && <p>Loading...</p>}
      {props.response.error && <p>Error occurred</p>}
    </div>
  );
};

/**
 * Response<User, CustomError> 实例化组件
 *
 * 使用 Response 并覆盖默认类型参数，测试复杂对象类型的泛型实例化。
 * 第一个类型参数是用户对象类型，第二个是自定义错误类型。
 */
interface User {
  id: string;
  name: string;
  email: string;
}

interface CustomError {
  code: number;
  message: string;
}

export interface UserResponseComponentProps {
  /** 用户响应数据 */
  response: Response<User, CustomError>;
  /** 刷新函数 */
  onRefresh?: () => void;
}

export const UserResponseComponent = (props: UserResponseComponentProps) => {
  return (
    <div>
      {props.response.data && <p>User: {props.response.data.name}</p>}
      {props.response.error && <p>Error {props.response.error.code}</p>}
    </div>
  );
};

/**
 * WithLength<string[]> 实例化组件
 *
 * 使用 WithLength<string[]> 作为 Props，测试泛型约束的实例化。
 * WithLength 要求类型参数必须有 length 属性，string[] 满足此约束。
 */
export interface StringArrayWithLengthComponentProps {
  /** 带长度信息的字符串数组 */
  data: WithLength<string[]>;
  /** 过滤函数 */
  onFilter?: (item: string[]) => string[];
}

export const StringArrayWithLengthComponent = (
  props: StringArrayWithLengthComponentProps,
) => {
  return (
    <div>
      <p>Length: {props.data.length}</p>
      <ul>
        {props.data.item.map((str, i) => (
          <li key={i}>{str}</li>
        ))}
      </ul>
    </div>
  );
};
