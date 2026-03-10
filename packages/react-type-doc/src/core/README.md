# core — 类型解析核心

构建阶段的核心逻辑层，负责将 TypeScript 类型系统中的类型信息解析为结构化的 `TypeInfo` 数据。

## 模块说明

### parser/

递归类型解析器，整个工具链的核心引擎。详细说明见 [parser/README.md](parser/README.md)。

**职责：** 接收 ts-morph 的 `Type` 对象，递归解析为 `TypeInfo` 树形结构。

**公共 API：**

| 函数 | 作用 |
|------|------|
| `parseTypeInfo(type)` | 入口函数，启动递归解析 |
| `initParseOptions(options)` | 初始化解析配置（maxDepth、skipTypes 等） |
| `clearTypeCache()` | 清空全局缓存，每次完整解析流程前调用 |
| `getTypeCacheSnapshot()` | 导出缓存为 `Record`，用于构建 `typeRegistry` |
| `getTypeCacheSize()` | 获取当前缓存大小 |
| `getTypeKind(type)` | 获取类型的种类字符串 |

### componentParser.ts

React 组件 Props 提取器。

**职责：** 在源文件中查找指定名称的 React 组件，提取其第一个参数（Props）的类型并调用 `parseTypeInfo` 解析。

**查找策略：** 先搜索变量声明（箭头函数 / 函数表达式），再搜索函数声明。组件无参数时返回空类型 `{}`。

**公共 API：** `findComponentProps(sourceFile, targetComponentName)` → `TypeInfo | null`

### typeResolver.ts

直接类型解析器。

**职责：** 在源文件中按名称查找 interface、type alias、enum 声明并解析。与 `componentParser` 的区别在于不假设目标是 React 组件，而是直接查找类型声明。

**命名空间支持：** 支持 `API.UserInfo`、`Models.User.Entity` 等多层嵌套命名空间的点分格式查找。

**公共 API：** `resolveType(sourceFile, typeName)` → `TypeInfo | null`

## 数据流

```
源文件 (SourceFile)
    │
    ├── componentParser ──→ 提取 Props Type ──→ parser.parseTypeInfo()
    │                                                    │
    ├── typeResolver ─────→ 查找命名类型 ────→ parser.parseTypeInfo()
    │                                                    │
    │                                          递归解析 TypeInfo 树
    │                                          写入全局 typeCache
    │                                                    │
    └────────────────────────────────────→ getTypeCacheSnapshot()
                                                → typeRegistry
```

## 注意事项

- `parser` 的全局缓存是模块级状态。每次完整解析流程（处理所有 registry 项）前必须调用 `clearTypeCache()`，否则会携带上次解析的残留数据
- `componentParser` 和 `typeResolver` 是两种互斥的入口策略：配置项有 `typeName` 时走 `typeResolver`，否则走 `componentParser`。调度逻辑在 `cli/generate.ts` 中
- 解析过程中 `visited` 集合按路径传递（每条路径独立拷贝），而 `typeCache` 是全局共享的。这意味着同一类型在不同路径上首次遇到时会正常解析，再次遇到时从缓存返回引用
