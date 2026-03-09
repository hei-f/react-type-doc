# react-type-doc

> 完整类型信息生成器 - 专为运行时类型展示设计

[![npm version](https://img.shields.io/npm/v/react-type-doc.svg)](https://www.npmjs.com/package/react-type-doc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

### 1. 完整的类型解析 ⭐⭐⭐⭐⭐

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

### 2. 智能处理循环引用 ⭐⭐⭐⭐⭐

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

### 3. 类型去重机制 ⭐⭐⭐⭐

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

### 4. 内置运行时 API ⭐⭐⭐⭐⭐

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

### 5. 完整的 TypeScript 支持

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

**[查看详细对比 →](./DETAILED_COMPARISON.md)**

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
      {Object.entries(reader.getPropertyEntries(typeInfo)).map(([name, prop]) => {
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

## 📖 使用场景

### ✅ 最适合的场景

1. **自建组件文档系统**
   ```typescript
   // 在你的文档应用中动态展示组件 Props
   <ComponentDoc name="Button" data={typeData} />
   ```

2. **API 文档生成**
   ```typescript
   // 展示 API 请求/响应的类型定义
   <APIDoc endpoint="/api/users" types={typeData} />
   ```

3. **类型安全的表单生成**
   ```typescript
   // 根据类型定义自动生成表单
   <DynamicForm schema={reader.resolve('UserCreateDTO')} />
   ```

4. **GraphQL Schema 文档**
   ```typescript
   // 展示 GraphQL 类型定义
   <GraphQLTypeDocs types={typeData} />
   ```

### ⚠️ 不适合的场景

1. 只需要简单的 PropTypes 文档（用 react-docgen）
2. 已经在用 Storybook 且满足需求（用 react-docgen-typescript）
3. 需要生成静态文档站点（用 TypeDoc）

---

## 🎯 核心优势

### vs react-docgen-typescript

| 维度 | react-type-doc | react-docgen-typescript |
|------|----------------|------------------------|
| **设计目标** | 完整类型信息 + 运行时展示 | Storybook 文档生成 |
| **工具类型** | ✅ 完全展开 | ❌ 保持原样 |
| **循环引用** | ✅ 智能检测 | ❌ 简单引用 |
| **运行时 API** | ✅ 内置完整 | ❌ 需自建 |
| **类型去重** | ✅ 引用机制 | ❌ 重复存储 |
| **性能** | ✅ 2.2倍更快 | - |
| **输出大小** | 103KB | 18KB |
| **功能支持** | 12/12 | 7/12 |
| **易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**[查看详细对比文档 →](./DETAILED_COMPARISON.md)**

---

## 📊 性能数据

基于 18 个组件/类型的实测数据：

| 工具 | 执行时间 | 输出大小 | 功能支持 |
|------|----------|---------|---------|
| **react-type-doc** | 2.5s | 103KB | 12/12 ✅ |
| react-docgen-typescript | 5.5s | 18KB | 7/12 |
| react-docgen | 0.1s | 9KB | 3/12 |

**结论**：
- 🏆 **功能最全**：react-type-doc（唯一支持所有 12 项特性）
- ⚡ **性能优秀**：比 react-docgen-typescript 快 2.2 倍
- 📦 **合理权衡**：用稍大的文件换取完整的类型信息

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

## 🎓 进阶用法

### 完整的类型文档面板组件

`react-type-doc` 的运行时 API 设计用于构建交互式的类型文档 UI。以下是一个完整的生产级组件示例，展示了所有核心 API 的使用：

**📦 完整代码**: [`packages/example/src/components/TypeDocPanel/`](./packages/example/src/components/TypeDocPanel/)

**✨ 功能特性**:
- 🎨 VS Code 风格的代码编辑器主题
- 🔍 点击类型名称展开嵌套类型定义
- 🧭 面包屑导航支持返回上一级
- 📝 自动展示 JSDoc 注释
- 📍 显示类型的源码位置
- ♻️ 智能处理循环引用
- 🌐 外部类型提示

**使用示例**:

```tsx
import TypeDocPanel from './components/TypeDocPanel';
import typeData from './type-docs.json';

function App() {
  return (
    <TypeDocPanel
      typeKey="ButtonProps"
      titlePrefix="组件 Props"
      typeDocData={typeData}
    />
  );
}
```

**核心实现片段**:

```tsx
// 组件主体使用了所有关键的运行时 API
const reader = useMemo(() => {
  return PropsDocReader.getInstance(propsDocData ?? undefined);
}, [propsDocData]);

// 获取类型渲染信息 - 自动识别类型类别
const renderInfo = reader.getTypeRenderInfo(typeInfo);

switch (renderInfo.type) {
  case RENDER_TYPE.EXTERNAL:
    // 外部库类型（如 React.ReactNode）
    return <TypeName>{renderInfo.name}</TypeName>;
    
  case RENDER_TYPE.CIRCULAR:
    // 循环引用类型 - 可点击导航
    return (
      <ClickableTypeName onClick={() => navigate(renderInfo.resolved)}>
        {renderInfo.name}
      </ClickableTypeName>
    );
    
  case RENDER_TYPE.UNION:
    // 联合类型 - 递归渲染每个分支
    return renderInfo.types.map(type => renderTypeText(type));
    
  case RENDER_TYPE.OBJECT:
    // 对象类型 - 可展开属性
    if (renderInfo.expandable) {
      return <ClickableTypeName onClick={expand}>{renderInfo.name}</ClickableTypeName>;
    }
    return <TypeName>{renderInfo.name}</TypeName>;
}

// 获取所有属性 - 返回 [name, typeInfo] 数组
const properties = reader.getPropertyEntries(typeInfo);

// 解析类型引用 - 处理 TypeRef
const resolved = reader.resolveRef(propInfo);

// 获取导航目标 - 用于类型跳转
const target = reader.getNavigationTarget(typeInfo, typeName);
```

**完整源码**: 查看 [`TypeDocPanel/index.tsx`](./packages/example/src/components/TypeDocPanel/index.tsx) 了解完整实现细节。

---

## 📚 文档

- **[快速开始指南](./GETTING_STARTED.md)** - 项目改造完整说明
- **[详细对比文档](./DETAILED_COMPARISON.md)** - 与 react-docgen-typescript 的详细对比
- **[竞品分析](./COMPETITOR_ANALYSIS.md)** - 所有工具的定位和选择建议
- **[为什么不对比 TypeDoc](./WHY_NOT_TYPEDOC.md)** - 工具定位说明
- **[测试指南](./TEST_GUIDE.md)** - 如何运行对比测试
- **[使用指南](./USAGE.md)** - 完整的使用文档

---

## 🤝 适用场景决策树

```
需要类型文档？
├─ 是否使用 Storybook？
│  ├─ 是 → react-docgen-typescript ✅
│  └─ 否 → 继续
│
├─ 是否需要生成静态文档站点？
│  ├─ 是 → TypeDoc ✅
│  └─ 否 → 继续
│
├─ 是否需要完整的类型信息？
│  ├─ 是 → react-type-doc ✅
│  └─ 否 → 继续
│
├─ 是否使用 TypeScript？
│  ├─ 是 → react-type-doc ✅
│  └─ 否 → react-docgen ✅
```

---
## 🔄 版本历史

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

---

## 📄 许可证

MIT © [Your Name]

---

## 🙏 致谢

感谢以下开源项目：
- [ts-morph](https://github.com/dsherret/ts-morph) - TypeScript 编译器 API 封装

---

## 🔗 相关链接

- [GitHub Repository](https://github.com/yourusername/react-type-doc)
- [NPM Package](https://www.npmjs.com/package/react-type-doc)
- [Issue Tracker](https://github.com/yourusername/react-type-doc/issues)
- [在线演示](https://your-demo-site.com)

---

## 🎯 核心理念

**react-type-doc** 的设计理念：

> 类型信息不应该只是给开发者看的注释，  
> 而应该是可以在运行时使用的结构化数据。

我们相信：
- ✅ 完整性 > 简洁性（当需要完整信息时）
- ✅ 运行时 > 构建时（当需要动态展示时）
- ✅ 结构化 > 字符串化（当需要程序处理时）
- ✅ 专注 > 全能（只做类型数据生成这一件事）

---

**开始使用 react-type-doc，让类型信息真正"活"起来！** 🚀
