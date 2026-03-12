# 配置指南

## 配置文件

`reactTypeDoc.config.ts` 位于项目根目录，使用 `defineConfig` 获取类型提示：

```typescript
import { defineConfig } from 'react-type-doc';

export default defineConfig({
  tsConfigPath: './tsconfig.json',
  outputPath: './type-docs.json',
  options: { /* ParseOptions */ },
  registry: { /* 手动注册 */ },
  scanDirs: [ /* 目录扫描 */ ],
});
```

`registry` 和 `scanDirs` 可共存，`registry` 中的同名 key 优先覆盖 `scanDirs` 扫描结果。

## 手动注册（registry）

```typescript
registry: {
  // 组件模式：自动提取 React 组件第一个参数的类型（Props）
  Button: {
    sourcePath: './src/components/Button.tsx',
  },

  // 组件模式 + exportName：导出名与 key 不一致时使用
  MyBtn: {
    sourcePath: './src/components/Button.tsx',
    exportName: 'Button',
  },

  // 类型模式：直接查找指定的 interface / type alias / enum
  UserInfo: {
    sourcePath: './src/types/user.ts',
    typeName: 'UserInfo',
  },

  // 类型模式：支持命名空间（点分格式，如 API.UserInfo、Models.User.Entity）
  'API.UserInfo': {
    sourcePath: './src/types/api.ts',
    typeName: 'API.UserInfo',
  },
}
```

**RegistryItem 字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sourcePath` | `string` | 是 | 源文件路径（支持 tsconfig 路径别名，如 `@/pages/...`） |
| `typeName` | `string` | 否 | 类型名称。不写 → 组件模式；写了 → 类型模式 |
| `exportName` | `string` | 否 | 组件导出名（组件模式下导出名与 key 不一致时使用） |

## 目录扫描（scanDirs）

自动扫描目录下的子文件夹，按约定提取组件和类型：

```typescript
scanDirs: [
  {
    path: './src/components',       // 扫描目录（支持 tsconfig 路径别名）
    componentEntry: 'index.tsx',    // 组件入口文件名（默认 'index.tsx'）
    typesEntry: 'doc.types.ts',     // 类型定义文件名（默认 'doc.types.ts'）
  },
]
```

**扫描规则：**
- 每个子文件夹的 `componentEntry` → 提取组件 Props，registry key 为文件夹名
- 每个子文件夹的 `typesEntry` → 提取所有导出的 interface/type/enum/`as const` 对象，registry key 为 `文件夹名/类型名`

**ScanDirItem 字段：**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `path` | `string` | 是 | — | 扫描目录路径 |
| `componentEntry` | `string` | 否 | `'index.tsx'` | 组件入口文件名 |
| `typesEntry` | `string` | 否 | `'doc.types.ts'` | 类型定义文件名 |

## 解析选项（ParseOptions）

```typescript
options: {
  maxDepth: 5,                     // 最大递归深度（默认 5）
  maxTypeTextLength: 100,          // 类型文本最大显示长度
  enableSourceLocation: false,     // 是否记录源码位置（默认 false，开启会增大输出）
  extraSkipTypes: [],              // 额外跳过的类型（精确匹配，如 'HTMLElement'）
  extraSkipPrefixes: [],           // 额外跳过的类型前缀（如 'Internal'）
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxDepth` | `number` | `5` | 最大递归深度，超过后标记 `renderHint: 'truncated'` |
| `maxTypeTextLength` | `number` | — | 类型文本最大显示长度 |
| `maxDetailedTypeTextLength` | `number` | — | 详细类型文本最大长度 |
| `cacheMaxTypeTextLength` | `number` | `200` | 缓存键最大文本长度（超过则内联） |
| `extraSkipTypes` | `string[]` | `[]` | 额外跳过深度解析的类型（精确匹配） |
| `extraSkipPrefixes` | `string[]` | `[]` | 额外跳过深度解析的类型前缀 |
| `enableSourceLocation` | `boolean` | `false` | 是否在输出中记录源文件路径和行号 |

## 输出优化

减小生成的 JSON 文件大小：

```typescript
options: {
  maxDepth: 3,                                          // 降低递归深度
  maxTypeTextLength: 50,                                // 限制类型文本长度
  enableSourceLocation: false,                          // 关闭源码位置
  extraSkipTypes: ['HTMLElement', 'CSSStyleDeclaration'], // 跳过 DOM 类型
  extraSkipPrefixes: ['Internal', 'Private'],           // 跳过内部类型
}
```

**已内置跳过的类型**（无需手动配置）：
- 基础类型包装对象：`String`, `Number`, `Boolean`, `BigInt`, `Symbol`
- 内置对象类型：`Date`, `RegExp`, `Promise`, `Map`, `Set`, `WeakMap`, `WeakSet`, `Error` 等
- TypeScript 工具类型（`Partial`, `Omit`, `Pick` 等）会被展开为具体属性，而非标记为外部类型

## CLI 命令

| 命令 | 说明 |
|------|------|
| `npx react-type-doc` | 执行生成（读取 `reactTypeDoc.config.ts`，输出 JSON） |
| `npx react-type-doc init` | 初始化配置文件（已存在则跳过） |
| `npx react-type-doc -v` | 显示版本号 |
| `npx react-type-doc -h` | 显示帮助 |
