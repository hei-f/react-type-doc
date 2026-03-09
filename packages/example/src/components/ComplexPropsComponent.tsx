/**
 * 复杂属性组件
 * 使用复合类型、工具类型等复杂场景
 */

import type { ReactNode, CSSProperties } from 'react';
import type {
  NestedObject,
  ApiResponse,
  DocumentNode,
} from '../types/composite';
import type { User, UserUpdateDTO } from '../types/utility';

export interface ComplexPropsComponentProps {
  /** 嵌套对象 */
  config: NestedObject;
  /** API 响应 */
  apiResponse: ApiResponse<User>;
  /** 文档节点 */
  document: DocumentNode[];
  /** 用户更新数据 */
  updateData?: UserUpdateDTO;
  /** 样式 */
  style?: CSSProperties;
  /** 子元素 */
  children?: ReactNode;
  /** 更新回调 */
  onUpdate?: (data: UserUpdateDTO) => Promise<void>;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

export const ComplexPropsComponent = (props: ComplexPropsComponentProps) => {
  return (
    <div style={props.style}>
      <h2>User: {props.config.user.profile.name}</h2>
      <p>Theme: {props.config.user.profile.settings.theme}</p>
      {props.apiResponse.status === 'success' && (
        <div>
          <p>User ID: {props.apiResponse.data.id}</p>
          <p>Email: {props.apiResponse.data.email}</p>
        </div>
      )}
      {props.apiResponse.status === 'error' && (
        <p>Error: {props.apiResponse.error.message}</p>
      )}
      <div>{props.children}</div>
    </div>
  );
};
