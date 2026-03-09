# types — 测试类型定义

覆盖各种 TypeScript 类型场景的测试用例集合，作为 `react-type-doc` 和竞品工具的解析输入。

这些类型同时被 benchmark 测试和 Demo 界面使用，通过 `reactTypeDoc.config.ts` 的 `registry` 注册。

## 文件清单

| 文件 | 覆盖场景 |
|------|----------|
| `basic.ts` | 原始类型、字面量类型、数组、元组（含标签/可选/剩余元素）、函数签名 |
| `composite.ts` | 联合类型、交叉类型、索引签名、嵌套对象、可辨识联合（`ApiResponse`）、递归联合（`DocumentNode`） |
| `generics.ts` | 泛型约束、条件类型、递归泛型 |
| `utility.ts` | Partial、Omit、Pick、Record 等工具类型的组合 |
| `namespace.ts` | 嵌套命名空间（`Models.User.Entity`）、命名空间合并 |
| `advanced.ts` | 模板字面量类型、映射类型、infer 推断 |
| `circular.ts` | 自引用（`TreeNode`）、相互引用（`Department`） |
| `external.ts` | React 类型引用（`React.ReactNode`、`React.ComponentType`） |
