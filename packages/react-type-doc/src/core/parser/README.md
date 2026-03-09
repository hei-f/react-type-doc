# parser — 递归类型解析器

整个工具链的核心引擎，接收 ts-morph 的 `Type` 对象，递归解析为 `TypeInfo` 树形结构。

## 目录结构

```
parser/
├── index.ts              # 主入口：递归解析逻辑 + 公共 API 导出
├── config.ts             # 解析配置管理（maxDepth、skipTypes 等）
├── cache.ts              # 全局类型缓存（跨组件去重）
├── utils/
│   ├── helpers.ts        # 纯工具函数和常量（hash、文本清理、类型显示名等）
│   ├── typeKind.ts       # 类型分类（Type → TypeCategory 映射）
│   └── extractors.ts     # 元数据提取（JSDoc、源码位置、属性类型等）
├── detectors/
│   ├── builtinDetector.ts   # 内置类型检测（hasNoDefaultLib、文件路径特征）
│   └── externalDetector.ts  # 外部类型检测（node_modules、Utility Types、别名）
└── parsers/
    ├── valueTypeParsers.ts   # 原始类型和枚举解析
    ├── collectionParsers.ts  # 数组和元组解析
    ├── unionParser.ts        # 联合类型解析（含 T | undefined 简化）
    ├── functionParser.ts     # 函数签名解析（含重载和泛型）
    └── objectParser.ts       # 对象类型解析（含 Mapped Type 和属性继承）
```

## 关键机制

**类型分类（`typeKind.ts`）：** 将 TypeScript 类型映射到 10 种 `TypeCategory`。元组判定必须在数组判定之前执行，因为元组在 TypeScript 中同时满足 `isObject()` 条件。

**全局缓存（`cache.ts`）：** 模块级 `Map`，跨组件去重。已解析的类型以 `$ref` 引用形式复用，最终输出为 `typeRegistry`。缓存 key 三种策略：基础类型用固定前缀、短文本直接作 key、长文本使用 MD5 hash。

**循环引用检测：** 基于路径追踪的 `visited` 集合，检测到循环时标记 `renderHint: 'circular'`。

**深度限制：** 超过 `maxDepth` 时标记 `renderHint: 'truncated'`，但基础类型和纯字面量联合类型不受深度限制。

**外部类型识别（`detectors/`）：** 通过 `hasNoDefaultLib` 标志和 `node_modules` 路径检测内置类型和外部库类型，标记为 `renderHint: 'builtin'` 或 `'external'`，阻止展开。

**工具类型展开：** Partial、Omit、Pick 等 TypeScript Utility Types 会被完全展开为具体属性，而非保留类型表达式。

**泛型感知（`extractors.ts`）：** 通过 `containsGenericTypeParameter` 递归检测未实例化的泛型参数，未实例化时标记 `isGeneric: true`，工具类型在泛型未实例化时排除属性。

**联合类型简化（`unionParser.ts`）：** 可选属性的 `T | undefined` 自动简化为 `T`，`false | true` 合并为 `boolean`。

## 注意事项

- 全局缓存是模块级状态。每次完整解析流程前必须调用 `clearTypeCache()`，否则会携带上次解析的残留数据
- 解析过程中 `visited` 集合按路径传递（每条路径独立拷贝），而 `typeCache` 是全局共享的。同一类型在不同路径上首次遇到时正常解析，再次遇到时从缓存返回引用
- 各 `parsers/` 子模块通过接收 `RecursiveParser` 回调实现与主入口的解耦，避免循环依赖
