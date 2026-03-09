/**
 * react-type-doc 配置文件
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

  // 类型注册表
  registry: {
    // 基础组件
    BasicComponent: {
      sourcePath: './src/components/BasicComponent.tsx',
    },

    // 泛型组件
    GenericComponent: {
      sourcePath: './src/components/GenericComponent.tsx',
    },

    // 复杂属性组件
    ComplexPropsComponent: {
      sourcePath: './src/components/ComplexPropsComponent.tsx',
    },

    // 命名空间组件
    NamespacedComponent: {
      sourcePath: './src/components/NamespacedComponent.tsx',
    },

    // 类型定义
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

    Box: {
      sourcePath: './src/types/generics.ts',
      typeName: 'Box',
    },

    Repository: {
      sourcePath: './src/types/generics.ts',
      typeName: 'Repository',
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
});
