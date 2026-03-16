/**
 * react-type-doc 配置文件
 *
 * 演示三种配置方式：
 * 1. registry（手动注册）：逐一指定组件或类型
 * 2. scanDirs（目录扫描）：按约定自动扫描子文件夹
 * 3. 两者混合使用，手动 registry 优先级高于 scanDirs
 */

import { defineConfig } from 'react-type-doc';

export default defineConfig({
  // tsconfig 路径
  tsConfigPath: './tsconfig.app.json',

  // 输出文件路径
  outputPath: './benchmark-output/react-type-doc.json',

  // 解析选项
  options: {
    maxDepth: 10,
    enableSourceLocation: false,
    // 跳过内置类型的深度解析，避免展开 String/Number/Boolean 的原型方法
    skipDeepParseTypes: new Set([
      'String',
      'Number',
      'Boolean',
      'BigInt',
      'Symbol',
    ]),
  },

  // ============================================================
  // 方式一：手动注册（适合扁平文件结构或需要精确控制的场景）
  // ============================================================
  registry: {
    // --- 组件注册（只指定 sourcePath，自动提取 Props） ---
    BasicComponent: {
      sourcePath: './src/components/BasicComponent.tsx',
    },

    GenericComponent: {
      sourcePath: './src/components/GenericComponent.tsx',
    },

    ComplexPropsComponent: {
      sourcePath: './src/components/ComplexPropsComponent.tsx',
    },

    NamespacedComponent: {
      sourcePath: './src/components/NamespacedComponent.tsx',
    },

    // --- 类型注册（指定 sourcePath + typeName） ---
    PrimitiveTypes: {
      sourcePath: './src/types/basic.ts',
      typeName: 'PrimitiveTypes',
    },

    LiteralTypes: {
      sourcePath: './src/types/basic.ts',
      typeName: 'LiteralTypes',
    },

    ArrayTypes: {
      sourcePath: './src/types/basic.ts',
      typeName: 'ArrayTypes',
    },

    TupleTypes: {
      sourcePath: './src/types/basic.ts',
      typeName: 'TupleTypes',
    },

    FunctionTypes: {
      sourcePath: './src/types/basic.ts',
      typeName: 'FunctionTypes',
    },

    NestedObject: {
      sourcePath: './src/types/composite.ts',
      typeName: 'NestedObject',
    },

    FullEntity: {
      sourcePath: './src/types/composite.ts',
      typeName: 'FullEntity',
    },

    Dictionary: {
      sourcePath: './src/types/composite.ts',
      typeName: 'Dictionary',
    },

    DocumentNode: {
      sourcePath: './src/types/composite.ts',
      typeName: 'DocumentNode',
    },

    ApiResponse: {
      sourcePath: './src/types/composite.ts',
      typeName: 'ApiResponse',
    },

    LongAnonymousTypes: {
      sourcePath: './src/types/composite.ts',
      typeName: 'LongAnonymousTypes',
    },

    Box: {
      sourcePath: './src/types/generics.ts',
      typeName: 'Box',
    },

    Repository: {
      sourcePath: './src/types/generics.ts',
      typeName: 'Repository',
    },

    StringBox: {
      sourcePath: './src/types/generics.ts',
      typeName: 'StringBox',
    },

    StringNumberPair: {
      sourcePath: './src/types/generics.ts',
      typeName: 'StringNumberPair',
    },

    DefaultResponse: {
      sourcePath: './src/types/generics.ts',
      typeName: 'DefaultResponse',
    },

    UserResponse: {
      sourcePath: './src/types/generics.ts',
      typeName: 'UserResponse',
    },

    StringArrayWithLength: {
      sourcePath: './src/types/generics.ts',
      typeName: 'StringArrayWithLength',
    },

    User: {
      sourcePath: './src/types/utility.ts',
      typeName: 'User',
    },

    UserUpdateDTO: {
      sourcePath: './src/types/utility.ts',
      typeName: 'UserUpdateDTO',
    },

    'Models.User.Entity': {
      sourcePath: './src/types/namespace.ts',
      typeName: 'Models.User.Entity',
    },

    'Models.Post.Entity': {
      sourcePath: './src/types/namespace.ts',
      typeName: 'Models.Post.Entity',
    },

    TreeNode: {
      sourcePath: './src/types/circular.ts',
      typeName: 'TreeNode',
    },

    Department: {
      sourcePath: './src/types/circular.ts',
      typeName: 'Department',
    },

    ReactComponentProps: {
      sourcePath: './src/types/external.ts',
      typeName: 'ReactComponentProps',
    },
  },

  // ============================================================
  // 方式二：目录扫描（适合文件夹式组件结构）
  // 约定：子文件夹/index.tsx → 组件，子文件夹/doc.types.ts → 类型
  // ============================================================
  scanDirs: [
    {
      path: './src/scan-demo',
      // 以下为默认值，可按项目约定自定义：
      // componentEntry: 'index.tsx',
      // typesEntry: 'doc.types.ts',
    },
  ],
});
