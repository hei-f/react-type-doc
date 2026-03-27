# react-type-doc

`react-type-doc` 用于把 TypeScript / React 源码解析成结构化类型文档 JSON，并提供只读运行时与开箱即用的 UI 面板。它解决的问题不是“打印类型字符串”，而是把属性、联合、泛型、循环引用和 `$ref` 组织成可在应用中稳定浏览的数据。

## 主要入口

| 子路径 | 作用 | 适用场景 |
|--------|------|----------|
| `react-type-doc` | `defineConfig`、完整解析导出、`PropsDocReader`、`npx react-type-doc` CLI | 构建期生成 JSON、Node 侧解析、需要完整类型能力时 |
| `react-type-doc/runtime` | 只读运行时 API，包含 `PropsDocReader` 及消费 JSON 所需的工具 | 浏览器或前端 bundle 只读取已生成数据时 |
| `react-type-doc/ui` | `TypeDocPanel`、`TypeDocEditorPanel`、`TypeDocEditorPanelLazy`、`en` / `zhCN` | 需要直接渲染类型文档界面时 |

## 安装

```bash
npm install react-type-doc
```

## 使用方式

1. 用 CLI 生成 JSON。

```bash
npx react-type-doc init
npx react-type-doc
```

2. 在运行时读取同一份 JSON。

```tsx
import typeData from './react-type-doc.json';
import { PropsDocReader } from 'react-type-doc/runtime';
import { TypeDocPanel } from 'react-type-doc/ui';

const reader = PropsDocReader.create(typeData);
```

3. 在 UI 中展示目标类型。

```tsx
<TypeDocPanel typeKey="Button" data={typeData} />
```

`TypeDocEditorPanel` 与 `TypeDocEditorPanelLazy` 适合 CodeMirror 风格的代码面板；`TypeDocEditorPanelLazy` 可与 `Suspense` 搭配按需加载，相关运行时依赖会随 `react-type-doc` 一起安装。

## 关键注意事项

- `data` 必须是 CLI 生成的 JSON；`PropsDocReader` 和 UI 都只消费生成结果，不直接解析源码。
- `typeKey` 必须与 JSON 里的 `keys` 对齐，否则面板找不到目标类型。
- `PropsDocReader.create(data)` 适合多份数据并存；`PropsDocReader.getInstance(data)` 适合全局共享一份数据。
- 使用 `react-type-doc/ui` 时，应用需要自行安装 `react`、`react-dom`、`styled-components`。
- 使用 `TypeDocEditorPanel` / `TypeDocEditorPanelLazy` 时，不需要额外安装 CodeMirror 相关依赖；它们会随 `react-type-doc` 一起提供。
- 泛型展示依赖结构化元数据 `genericParameters`。当这份信息存在时，声明头会渲染完整泛型，例如 `interface Response<T = unknown, E = Error> {}`；如果只有旧的 `name` / `text`，则回退到兼容显示，不会从实例化结果自动反推原始泛型声明。

## 文档

- 更完整的功能、配置和 JSON 结构说明见仓库根目录 [README.md](../../README.md)。
- 分层说明：
  - [src/core/README.md](src/core/README.md)
  - [src/runtime/README.md](src/runtime/README.md)
  - [src/ui/README.md](src/ui/README.md)
  - [src/cli/README.md](src/cli/README.md)
  - [src/shared/README.md](src/shared/README.md)

## 许可证

MIT
