/**
 * 命名空间组件
 * 使用命名空间类型作为 Props
 */

import type { Models, Services, AppContext } from '../types/namespace';

export interface NamespacedComponentProps {
  /** 用户实体 */
  user: Models.User.Entity;
  /** 文章列表 */
  posts: Models.Post.Entity[];
  /** 用户服务 */
  userService: Services.IUserService;
  /** 文章服务 */
  postService: Services.IPostService;
  /** 应用上下文 */
  appContext: AppContext;
  /** 创建文章回调 */
  onCreatePost?: (data: Models.Post.CreateDTO) => Promise<void>;
  /** 更新用户回调 */
  onUpdateUser?: (data: Partial<Models.User.Entity>) => Promise<void>;
}

export const NamespacedComponent = (props: NamespacedComponentProps) => {
  return (
    <div>
      <div>
        <h2>{props.user.username}</h2>
        <img src={props.user.profile.avatar} alt={props.user.username} />
        <p>{props.user.profile.bio}</p>
      </div>
      <div>
        <h3>Posts</h3>
        {props.posts.map((post) => (
          <div key={post.id}>
            <h4>{post.title}</h4>
            <p>{post.content}</p>
            <p>By: {post.author.username}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
