/**
 * 循环引用类型定义
 * 测试相互引用、自引用等循环依赖场景
 */

/** 自引用类型 */
export interface TreeNode {
  value: string;
  children?: TreeNode[];
  parent?: TreeNode;
}

export interface LinkedListNode {
  value: number;
  next?: LinkedListNode;
  prev?: LinkedListNode;
}

/** 相互引用类型 */
export interface Author {
  id: string;
  name: string;
  posts: Post[];
  profile: AuthorProfile;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  author: Author;
  post: Post;
  replies?: Comment[];
}

export interface AuthorProfile {
  bio: string;
  avatar: string;
  author: Author;
}

/** 复杂循环引用 */
export interface Department {
  id: string;
  name: string;
  manager: Employee;
  employees: Employee[];
  parentDepartment?: Department;
  subDepartments: Department[];
}

export interface Employee {
  id: string;
  name: string;
  department: Department;
  manager?: Employee;
  subordinates: Employee[];
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  lead: Employee;
  members: Employee[];
  department: Department;
  dependencies: Project[];
}

/** 图结构 */
export interface GraphNode {
  id: string;
  value: unknown;
  edges: GraphEdge[];
}

export interface GraphEdge {
  from: GraphNode;
  to: GraphNode;
  weight?: number;
}

/** 状态机 */
export interface State {
  name: string;
  transitions: Transition[];
  onEnter?: (context: StateContext) => void;
  onExit?: (context: StateContext) => void;
}

export interface Transition {
  event: string;
  from: State;
  to: State;
  guard?: (context: StateContext) => boolean;
}

export interface StateContext {
  currentState: State;
  previousState?: State;
  data: Record<string, unknown>;
}

/** 组件树 */
export interface Component {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children: Component[];
  parent?: Component;
  ref?: ComponentRef;
}

export interface ComponentRef {
  current: Component | null;
}
