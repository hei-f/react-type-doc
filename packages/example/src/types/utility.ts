/**
 * 工具类型定义
 * 测试 TypeScript 内置工具类型和自定义工具类型
 */

/** 基础接口用于测试工具类型 */
export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
  updatedAt: Date;
  profile?: {
    avatar: string;
    bio: string;
  };
}

/** Pick 工具类型 */
export type UserBasicInfo = Pick<User, 'id' | 'name' | 'email'>;

/** Omit 工具类型 */
export type UserWithoutTimestamps = Omit<User, 'createdAt' | 'updatedAt'>;

/** Partial 工具类型 */
export type PartialUser = Partial<User>;

/** Required 工具类型 */
export type RequiredUser = Required<User>;

/** Readonly 工具类型 */
export type ReadonlyUser = Readonly<User>;

/** Record 工具类型 */
export type UserMap = Record<string, User>;
export type RolePermissions = Record<User['role'], string[]>;

/** Extract 工具类型 */
export type AdminOrUser = Extract<User['role'], 'admin' | 'user'>;

/** Exclude 工具类型 */
export type NonGuestRole = Exclude<User['role'], 'guest'>;

/** ReturnType 工具类型 */
export function getUser(): User {
  return {} as User;
}
export type GetUserReturnType = ReturnType<typeof getUser>;

/** Parameters 工具类型 */
export function updateUser(_id: string, _data: Partial<User>): Promise<User> {
  return Promise.resolve({} as User);
}
export type UpdateUserParams = Parameters<typeof updateUser>;

/** ConstructorParameters 工具类型 */
export class UserService {
  constructor(
    private apiUrl: string,
    private timeout: number,
  ) {}
}
export type UserServiceParams = ConstructorParameters<typeof UserService>;

/** InstanceType 工具类型 */
export type UserServiceInstance = InstanceType<typeof UserService>;

/** 自定义工具类型 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

export type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

/** 复杂工具类型组合 */
export type UserUpdateDTO = Partial<
  Omit<User, 'id' | 'createdAt' | 'updatedAt'>
>;

export type UserCreateDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

export type ReadonlyUserBasicInfo = Readonly<
  Pick<User, 'id' | 'name' | 'email'>
>;

/** 条件工具类型 */
export type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

export type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P,
    never
  >;
}[keyof T];

export type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >;
}[keyof T];
