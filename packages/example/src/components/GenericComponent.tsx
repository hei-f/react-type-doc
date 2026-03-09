/**
 * 泛型组件
 * 使用泛型类型作为 Props
 */

import type { ReactNode } from 'react';
import type { Box, Response, Repository } from '../types/generics';

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
