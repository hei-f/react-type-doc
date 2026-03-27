# react-type-doc

> 完整类型信息生成器 - 专为运行时类型展示设计

[![npm version](https://img.shields.io/npm/v/react-type-doc.svg)](https://www.npmjs.com/package/react-type-doc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

在线演示: [GitHub Pages](https://hei-f.github.io/react-type-doc/)

## 🎯 为什么选择 react-type-doc？

**react-type-doc** 不是又一个文档生成器，而是专门为**在应用中动态展示类型信息**而设计的工具。

### 与其他工具的核心差异

```typescript
// 假设你有这样的类型
type UserUpdateDTO = Partial<Omit<User, 'id' | 'password'>>;

interface Props {
  onUpdate: (data: UserUpdateDTO) => void;
}
```

**其他工具**（如 react-docgen-typescript）显示：
```
onUpdate: (data: Partial<Omit<User, 'id' | 'password'>>) => void
```
用户需要自己理解这个类型表达式 🤔

**react-type-doc** 显示：
```typescript
onUpdate 接受一个对象，包含以下可选属性：
  - name?: string
  - email?: string
  - age?: number
```
用户直接看到可用的属性 ✅

---

## ✨ 核心特性

### 1. 完整的类型解析

**完全展开工具类型**：
- ✅ `Partial<T>` → 显示所有可选属性
- ✅ `Pick<T, K>` → 显示选中的属性
- ✅ `Omit<T, K>` → 显示排除后的属性
- ✅ `Record<K, V>` → 显示键值对结构

**其他工具**：只显示类型名称，不展开内容

```typescript
// 示例：复杂的工具类型组合
type FormData = Required<Pick<User, 'name' | 'email'>> & {
  password: string;
};

// react-type-doc 输出
{
  "name": { "type": "string", "required": true },
  "email": { "type": "string", "required": true },
  "password": { "type": "string", "required": true }
}

// 其他工具输出
{
  "type": "Required<Pick<User, 'name' | 'email'>> & { password: string }"
}
```

---

### 2. 智能处理循环引用

**自动检测并标记循环引用**：

```typescript
interface TreeNode {
  value: string;
  children?: TreeNode[];  // 循环引用
  parent?: TreeNode;      // 循环引用
}
```

```json
{
  "value": { "type": "string" },
  "children": {
    "type": "array",
    "element": { "kind": "circular", "ref": "TreeNode" }
  },
  "parent": { "kind": "circular", "ref": "TreeNode" }
}
```

**为什么重要**？
- ✅ UI 可以安全地递归渲染（检测到 circular 时停止）
- ✅ 避免栈溢出
- ✅ 提供更好的用户体验

**其他工具**：需要你自己实现循环检测逻辑

---

### 3. 类型去重机制

**引用 + 注册表设计**：

```json
{
  "keys": {
    "Button": { "$ref": "CommonProps" },
    "Input": { "$ref": "CommonProps" },
    "Select": { "$ref": "CommonProps" }
  },
  "typeRegistry": {
    "CommonProps": {
      "properties": { /* 只存储一次 */ }
    }
  }
}
```

**优势**：
- ✅ 共享类型只存储一次
- ✅ 保持数据一致性
- ✅ 优化文件大小

**其他工具**：相同的类型在每个组件中都重复存储

---

### 4. 内置运行时 API

**开箱即用的工具函数**：

```typescript
import { PropsDocReader } from 'react-type-doc/runtime';
import typeData from './type-docs.json';

// 创建读取器
const reader = PropsDocReader.getInstance(typeData);

// 获取类型信息（自动解析引用）
const buttonProps = reader.resolve('Button');

// 判断类型是否可展开
const expandable = reader.isExpandable(buttonProps);

// 获取渲染建议（针对不同类型返回不同的渲染策略）
const renderInfo = reader.getTypeRenderInfo(buttonProps);

switch (renderInfo.type) {
  case 'object':
    // 渲染对象类型
    break;
  case 'union':
    // 渲染联合类型
    break;
  case 'circular':
    // 处理循环引用
    break;
}
```

**其他工具**：需要你自己解析 JSON，自己实现工具函数

---

### 5. JSDoc 注释提取

**完整提取 JSDoc 注释信息**，不仅限于组件 Props，支持所有类型声明：

```typescript
/**
 * 异步提交处理器
 * @param key - 变更的字段名
 * @param value - 新的值
 * @returns 提交是否成功
 */
onSubmit: (key: string, value: unknown) => Promise<boolean>;
```

```json
{
  "description": "异步提交处理器\n@param key - 变更的字段名\n@param value - 新的值\n@returns 提交是否成功",
  "kind": "function",
  "text": "(key: string, value: unknown) => Promise<boolean>"
}
```

**支持的注释场景**：
- ✅ `interface` / `type alias` / `enum` 上的类型级注释
- ✅ 属性级 JSDoc（`@param`、`@returns`、`@default`、`@description`）
- ✅ `as const` 对象及其成员的注释
- ✅ 多行描述和多段落注释
- ✅ `{@link TypeName}` 内联链接解析

**其他工具**：仅提取组件 Props 的简单描述，不支持 `@param`/`@returns` 等标签

---

### 6. 完整的 TypeScript 支持

| 特性 | react-type-doc | react-docgen-typescript |
|------|----------------|------------------------|
| 基础类型 | ✅ | ✅ |
| 泛型（完整结构） | ✅ | ⚠️ 仅名称 |
| 联合/交叉类型 | ✅ | ⚠️ 简化 |
| **工具类型（展开）** | ✅ | ❌ |
| **命名空间** | ✅ | ❌ |
| **循环引用** | ✅ | ❌ |
| **条件类型** | ✅ | ❌ |
| **映射类型** | ✅ | ❌ |
| **模板字面量** | ✅ | ❌ |
| **JSDoc 多标签** | ✅ | ⚠️ 仅描述 |
| **`as const` 对象** | ✅ | ❌ |

**泛型声明展示说明**：
- 当生成结果里携带 `genericParameters` 时，UI 和 CodeMirror 会优先渲染完整声明头，例如 `interface Response<T = unknown, E = Error> {}`。
- 如果数据已经是实例化后的别名，且没有保留 `genericParameters`，标题行只会显示当前别名名；默认类型参数会体现在成员类型里，而不会从实例化结果自动反推回声明泛型。

---

## 🤖 Cursor Skill

如果你使用 [Cursor IDE](https://cursor.sh/)，推荐安装配套的 AI Skill，让 AI 助手能正确辅助你配置、生成和集成类型文档。

### 使用 Skills CLI 安装（推荐）

```bash
# 安装 react-type-doc skill
npx skills add hei-f/react-type-doc --skill react-type-doc

# 安装到全局（所有项目可用）
npx skills add hei-f/react-type-doc --skill react-type-doc --global
```

### 手动安装

从本仓库的 [`.cursor/skills/react-type-doc/`](.cursor/skills/react-type-doc/) 目录复制到你的项目中：

```bash
# 复制到项目（仅当前项目可用）
cp -r <repo-path>/.cursor/skills/react-type-doc <your-project>/.cursor/skills/

# 或复制到个人目录（所有项目可用）
cp -r <repo-path>/.cursor/skills/react-type-doc ~/.cursor/skills/
```

安装后，Cursor 会在你使用 react-type-doc 相关功能时自动应用该 Skill。

---

## 🚀 快速开始

### 安装

```bash
npm install react-type-doc
# 或
yarn add react-type-doc
# 或
pnpm add react-type-doc
# 或
bun add react-type-doc
```

### 1. 初始化配置

```bash
npx react-type-doc init
```

这会在项目根目录创建 `reactTypeDoc.config.ts`：

```typescript
import { defineConfig } from 'react-type-doc';

export default defineConfig({
  // tsconfig 路径
  tsConfigPath: './tsconfig.json',
  
  // 输出文件路径
  outputPath: './type-docs.json',
  
  // 类型注册表
  registry: {
    // 组件模式：自动提取 Props 类型
    Button: {
      sourcePath: './src/components/Button.tsx',
    },
    
    // 类型模式：指定具体类型名
    UserInfo: {
      sourcePath: './src/types/user.ts',
      typeName: 'UserInfo',
    },
  },

  // 目录扫描模式（可与 registry 混合使用）
  // 约定：子文件夹/index.tsx → 组件，子文件夹/doc.types.ts → 类型
  scanDirs: [
    { path: './src/components' },
  ],
});
```

### 2. 生成类型文档

```bash
npx react-type-doc
```

生成的 JSON 文件结构：

```json
{
  "generatedAt": "2026-01-08T15:00:00.000Z",
  "keys": {
    "Button": { "$ref": "ButtonProps" }
  },
  "typeRegistry": {
    "ButtonProps": {
      "kind": "object",
      "properties": {
        "size": {
          "kind": "union",
          "text": "\"small\" | \"large\"",
          "description": "按钮尺寸",
          "required": false
        },
        "onClick": {
          "kind": "function",
          "text": "() => void",
          "description": "点击回调",
          "required": false
        }
      }
    }
  }
}
```

### 3. 在应用中使用

#### 内置 UI 组件

提供 **`TypeDocPanel`**（结构化 DOM）与 **`TypeDocEditorPanel`** / **`TypeDocEditorPanelLazy`**（只读 CodeMirror）；共用同一 `data` + `typeKey` 与导航语义。导出 `en`、`zhCN` 等 locale，编辑器所需的运行时依赖会随 `react-type-doc` 一起安装。

```tsx
import { TypeDocPanel, zhCN } from 'react-type-doc/ui';
import typeData from './type-docs.json';

function App() {
  return (
    <TypeDocPanel
      typeKey="Button"
      data={typeData}
      locale={zhCN}
    />
  );
}
```

**依赖**：`react`、`react-dom`、`styled-components` 为 peer，须在应用中安装。`CodeMirror` 面板所需的 `@uiw/react-codemirror` 与各 `@codemirror/*` 运行时包会随 `react-type-doc` 一起安装，无需单独处理。详情见 [`packages/react-type-doc/README.md`](packages/react-type-doc/README.md)。

#### 自定义渲染

也可以使用运行时 API 完全自定义类型信息的展示方式：

```typescript
import { PropsDocReader } from 'react-type-doc/runtime';
import typeData from './type-docs.json';

function TypeDocViewer({ typeName }: { typeName: string }) {
  const reader = PropsDocReader.getInstance(typeData);
  const typeInfo = reader.resolve(typeName);
  
  if (!typeInfo) return <div>类型不存在</div>;
  
  return (
    <div>
      <h2>{typeName}</h2>
      {reader.getPropertyEntries(typeInfo).map(([name, prop]) => {
        const resolved = reader.resolveRef(prop);
        return (
          <div key={name}>
            <strong>{name}</strong>
            {resolved.required && <span>*</span>}
            : {resolved.text}
            {resolved.description && <p>{resolved.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
```

---

## 🔧 高级配置

### 解析选项

```typescript
export default defineConfig({
  tsConfigPath: './tsconfig.json',
  outputPath: './type-docs.json',
  
  options: {
    // 最大递归深度（默认: 5）
    maxDepth: 10,
    
    // 类型文本最大长度（默认: 100）
    maxTypeTextLength: 150,
    
    // 是否记录源码位置（默认: false）
    enableSourceLocation: true,
    
    // 额外跳过的类型
    extraSkipTypes: ['HTMLElement', 'CSSProperties'],
    
    // 额外跳过的类型前缀
    extraSkipPrefixes: ['Internal'],
  },
  
  registry: {
    // ...
  },
});
```

### 减小输出文件大小

如果输出文件太大，可以：

```typescript
options: {
  maxDepth: 3,                  // 降低递归深度
  maxTypeTextLength: 50,        // 限制类型文本长度
  enableSourceLocation: false,  // 关闭源码位置（默认）
  extraSkipTypes: [             // 跳过不需要的类型
    'HTMLElement',
    'CSSStyleDeclaration',
  ],
}
```

---

## 📚 文档

- **[更新日志](./CHANGELOG.md)** - 版本更新历史
- **[示例项目](./packages/example/)** - 包含完整的交互式类型文档面板组件

---

## 📄 许可证

MIT
