# core — 类型解析核心

构建阶段的核心逻辑层，负责将 TypeScript 类型系统中的类型信息解析为结构化的 `TypeInfo` 数据。

## 模块说明

### typeParser.ts

递归类型解析器，整个工具链的核心引擎。

**职责：** 接收 ts-morph 的 `Type` 对象，递归解析为 `TypeInfo` 树形结构。

**关键机制：**

- **类型分类（`getTypeKind`）：** 将 TypeScript 类型映射到 10 种 `TypeCategory`（primitive、object、function、array、tuple、union、enum 等）。元组判定必须在数组判定之前执行，因为元组在 TypeScript 中同时满足 `isObject()` 条件
- **全局类型缓存（`typeCache`）：** 模块级 `Map`，跨组件去重。已解析的类型以 `$ref` 引用形式复用，最终输出为 `typeRegistry`。缓存 key 有三种策略：基础类型用固定前缀、短文本直接作 key、长文本使用 MD5 hash
- **循环引用检测：** 基于路径追踪的 `visited` 集合，检测到循环时标记 `renderHint: 'circular'`
- **深度限制：** 超过 `maxDepth` 时标记 `renderHint: 'truncated'`，但基础类型和纯字面量联合类型不受深度限制
- **外部类型识别：** 通过 `hasNoDefaultLib` 标志和 `node_modules` 路径检测内置类型和外部库类型，标记为 `renderHint: 'builtin'` 或 `'external'`，阻止展开
- **工具类型展开：** Partial、Omit、Pick 等 TypeScript Utility Types 会被完全展开为具体属性，而非保留类型表达式
- **泛型感知：** 通过 `containsGenericTypeParameter` 递归检测未实例化的泛型参数，未实例化时标记 `isGeneric: true`，工具类型在泛型未实例化时排除属性以避免误导
- **联合类型简化：** 可选属性的 `T | undefined` 自动简化为 `T`，`false | true` 合并为 `boolean`

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
    ├── componentParser ──→ 提取 Props Type ──→ typeParser.parseTypeInfo()
    │                                                    │
    ├── typeResolver ─────→ 查找命名类型 ────→ typeParser.parseTypeInfo()
    │                                                    │
    │                                          递归解析 TypeInfo 树
    │                                          写入全局 typeCache
    │                                                    │
    └────────────────────────────────────→ getTypeCacheSnapshot()
                                                → typeRegistry
```

## 注意事项

- `typeParser` 的全局缓存是模块级状态。每次完整解析流程（处理所有 registry 项）前必须调用 `clearTypeCache()`，否则会携带上次解析的残留数据
- `componentParser` 和 `typeResolver` 是两种互斥的入口策略：配置项有 `typeName` 时走 `typeResolver`，否则走 `componentParser`。调度逻辑在 `cli/generate.ts` 中
- 解析过程中 `visited` 集合按路径传递（每条路径独立拷贝），而 `typeCache` 是全局共享的。这意味着同一类型在不同路径上首次遇到时会正常解析，再次遇到时从缓存返回引用
