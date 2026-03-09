# react-type-doc

> 开箱即用的 TypeScript 类型定义文档生成器，专为 React 组件设计

## 安装

```bash
npm install react-type-doc
```

## 使用

### CLI 模式

```bash
# 初始化配置
npx react-type-doc init

# 生成文档
npx react-type-doc
```

### 配置文件

创建 `reactTypeDoc.config.ts`：

```typescript
import { defineConfig } from 'react-type-doc';

export default defineConfig({
  tsConfigPath: './tsconfig.json',
  outputPath: './type-docs.json',
  registry: {
    Button: {
      sourcePath: './src/components/Button.tsx',
    },
  },
});
```

### 运行时 API

```typescript
import { PropsDocReader } from 'react-type-doc/runtime';
import typeDocsData from './type-docs.json';

const reader = PropsDocReader.getInstance(typeDocsData);
const props = reader.resolve('Button');
```

## 文档

查看项目根目录的 [README.md](../../README.md) 获取完整文档。

## 许可证

MIT

