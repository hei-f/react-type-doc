# react-type-doc

从 TypeScript/React 源码**生成**结构化类型文档 JSON（`OutputResult`），供运行时 **`PropsDocReader`** 或可选 **内置 UI** 消费；目标是在应用里展开工具类型、处理循环引用与 `$ref` 去重，而不是只展示类型名字符串。

## 子路径与职责

| 子路径 | 内容 | 适用场景 |
|--------|------|----------|
| `react-type-doc` | `defineConfig`、`PropsDocReader`、完整类型与解析相关导出、`npx react-type-doc` CLI | 配置文件、Node 侧生成、需要完整类型定义时 |
| `react-type-doc/runtime` | `PropsDocReader` 及消费 JSON 所需的类型/工具（**无** `defineConfig` / 完整 `ParseOptions` 等） | 浏览器 bundle 只读已生成数据时 |
| `react-type-doc/ui` | `TypeDocPanel`、`TypeDocEditorPanel`、`TypeDocEditorPanelLazy`、`en` / `zhCN`、面板相关类型 | 需要开箱 UI 时 |

## 数据流与耦合

1. **生成**：`reactTypeDoc.config.ts`（`defineConfig`）→ CLI 解析工程 → 输出 JSON（`keys` + `typeRegistry`，条目间 `$ref`）。
2. **消费**：应用加载该 JSON → `PropsDocReader.getInstance(data)` 做查询/解析，**或**将同一 `data` 传入 `TypeDocPanel` / `TypeDocEditorPanel` 的 `data`，并用 `typeKey` 对齐 `keys`。
3. **边界**：UI 与 Reader **只依赖生成结果**；不反向依赖 CLI。切换展示类型只改 `typeKey` 或 reader 查询，不重新跑 CLI（除非源码或配置变了）。

## 安装

```bash
npm install react-type-doc
```

## 命令行

```bash
npx react-type-doc init   # 生成 reactTypeDoc.config.ts
npx react-type-doc        # 按配置写出 JSON
```

配置项（`registry` / `scanDirs`、`ParseOptions` 等）以仓库根目录文档为准。

## peerDependencies（使用 UI 时必读）

- **`react`、`react-dom`、`styled-components`**：使用 `react-type-doc/ui` 时须在**应用**中安装，与 `package.json` 中 peer 版本范围一致。
- **CodeMirror 相关**（`@uiw/react-codemirror`、`@codemirror/*`、`@replit/codemirror-indentation-markers`）：列为 **optional** peer；**仅在使用 `TypeDocEditorPanel` / `TypeDocEditorPanelLazy` 时需要**，由应用安装，库**不打包**进本包产物，以免重复与版本冲突。
- **`TypeDocEditorPanelLazy`**：适合与 `Suspense` 搭配，推迟加载编辑器依赖。

## 文档

- 特性说明、配置详解、JSON 结构、UI 示例：仓库根目录 [README.md](../../README.md)。

## 许可证

MIT
