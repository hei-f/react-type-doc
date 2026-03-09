# react-type-doc 使用指南

## 快速开始

### 1. 安装

```bash
npm install react-type-doc
# 或
bun add react-type-doc
```

### 2. 初始化配置

```bash
npx react-type-doc init
```

这会在项目根目录创建 `reactTypeDoc.config.ts` 配置文件。

### 3. 配置类型注册表

编辑 `reactTypeDoc.config.ts`：

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
    
    // 类型模式：指定类型名
    UserInfo: {
      sourcePath: './src/types/user.ts',
      typeName: 'UserInfo',
    },
  },
});
```

### 4. 生成文档

```bash
npx react-type-doc
```

## 配置详解

### 组件模式 vs 类型模式

**组件模式**（不指定 `typeName`）：
- 自动查找组件的 Props 类型
- 适用于 React 组件

```typescript
Button: {
  sourcePath: './src/components/Button.tsx',
  // 默认查找 Button 组件的 Props
}
```

**类型模式**（指定 `typeName`）：
- 直接提取指定的类型定义
- 适用于任何 TypeScript 类型

```typescript
UserInfo: {
  sourcePath: './src/types/user.ts',
  typeName: 'UserInfo',
}
```

### 解析选项

```typescript
export default defineConfig({
  // ...
  options: {
    // 最大递归深度（默认: 5）
    maxDepth: 10,
    
    // 类型文本最大长度（默认: 100）
    maxTypeTextLength: 150,
    
    // 是否记录源码位置（默认: false）
    enableSourceLocation: true,
    
    // 额外跳过的类型
    extraSkipTypes: ['InternalType'],
  },
});
```

## 运行时使用

### 基础用法

```typescript
import { PropsDocReader } from 'react-type-doc/runtime';
import typeDocsData from './type-docs.json';

// 创建读取器实例（单例模式）
const reader = PropsDocReader.getInstance(typeDocsData);

// 获取类型信息
const buttonProps = reader.resolve('Button');

console.log(buttonProps);
// {
//   kind: 'object',
//   text: 'ButtonProps',
//   properties: {
//     label: { kind: 'string', text: 'string', required: true },
//     onClick: { kind: 'function', text: '() => void', required: false },
//     // ...
//   }
// }
```

### 高级用法

```typescript
// 获取所有可用的类型 key
const allKeys = reader.getAllKeys();

// 检查类型是否存在
if (reader.hasKey('Button')) {
  // ...
}

// 获取类型渲染信息（用于 UI 展示）
const renderInfo = reader.getTypeRenderInfo(buttonProps);

switch (renderInfo.type) {
  case 'object':
    // 渲染对象类型
    break;
  case 'union':
    // 渲染联合类型
    break;
  // ...
}

// 检查类型是否可展开
const isExpandable = reader.isExpandable(buttonProps);

// 获取属性列表
const properties = reader.getPropertyEntries(buttonProps);
```

### 创建独立实例

如果需要多个独立的读取器实例：

```typescript
const reader1 = PropsDocReader.create(data1);
const reader2 = PropsDocReader.create(data2);
```

## 输出格式

生成的 JSON 文件结构：

```json
{
  "generatedAt": "2026-01-08T15:00:00.000Z",
  "keys": {
    "Button": {
      "$ref": "ButtonProps"
    }
  },
  "typeRegistry": {
    "ButtonProps": {
      "kind": "object",
      "text": "ButtonProps",
      "properties": {
        "label": {
          "kind": "string",
          "text": "string",
          "required": true
        }
      }
    }
  }
}
```

## 常见问题

### Q: 如何处理路径别名？

A: 确保 `tsconfig.json` 中配置了 `paths`，react-type-doc 会自动解析。

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Q: 如何处理循环引用？

A: react-type-doc 会自动检测循环引用，并标记为 `circular` 类型。

### Q: 支持哪些 TypeScript 特性？

A: 支持大部分 TypeScript 特性，包括：
- 基础类型、字面量类型
- 联合类型、交叉类型
- 泛型、条件类型
- 工具类型（Pick、Omit 等）
- 命名空间
- 映射类型
- 模板字面量类型

### Q: 如何优化输出文件大小？

A: 可以通过以下方式优化：
1. 减小 `maxDepth` 值
2. 减小 `maxTypeTextLength` 值
3. 不启用 `enableSourceLocation`
4. 添加 `extraSkipTypes` 跳过不需要的类型

## 最佳实践

1. **按需注册**：只注册需要的类型，避免注册过多类型
2. **合理配置深度**：根据实际需求调整 `maxDepth`
3. **使用类型模式**：对于复杂类型，使用类型模式更精确
4. **版本控制**：将生成的文档文件加入版本控制
5. **CI/CD 集成**：在构建流程中自动生成文档

## 示例项目

查看 [packages/example](../../packages/example) 获取完整示例。

