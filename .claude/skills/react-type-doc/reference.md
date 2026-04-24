# 类型定义参考

## TypeInfo

核心类型，表示一个类型的完整信息或引用：

```typescript
type TypeInfo = FullTypeInfo | TypeRef;
```

判断方式：`'$ref' in typeInfo` 为 true 则为 TypeRef，否则为 FullTypeInfo。运行时工具函数 `isTypeRef(typeInfo)` 提供类型守卫。

### FullTypeInfo

| 字段 | 类型 | 说明 |
|------|------|------|
| `kind` | `TypeCategory` | 类型的本质特征（必填） |
| `text` | `string` | 类型文本表示（必填） |
| `name` | `string?` | 类型名称（与 text 相同时省略，读取时用 `name ?? text`） |
| `renderHint` | `RenderHint?` | 展示策略提示 |
| `description` | `string?` | JSDoc 描述 |
| `required` | `boolean?` | 是否必填（仅在属性上下文中） |
| `properties` | `Record<string, TypeInfo>?` | 对象属性（kind=object） |
| `elementType` | `TypeInfo?` | 数组元素类型（kind=array） |
| `tupleElements` | `TypeInfo[]?` | 元组元素列表（kind=tuple） |
| `enumValues` | `string[]?` | 枚举值列表（kind=enum） |
| `unionTypes` | `TypeInfo[]?` | 联合成员（kind=union） |
| `signatures` | `FunctionSignature[]?` | 函数签名列表（kind=function，支持重载） |
| `isGeneric` | `boolean?` | 是否含未实例化泛型参数 |
| `sourceFile` | `string?` | 源文件路径（需开启 enableSourceLocation） |
| `sourceLine` | `number?` | 源码行号 |
| `descriptionLinks` | `Record<string, string>?` | JSDoc `{@link}` 引用映射（key: 引用文本, value: typeRegistry key） |

### TypeRef

引用结构，完整定义从 `typeRegistry` 获取：

| 字段 | 类型 | 说明 |
|------|------|------|
| `$ref` | `string` | 指向 typeRegistry 的 key（必填） |
| `description` | `string?` | 位置相关的描述（优先于被引用类型） |
| `required` | `boolean?` | 位置相关的必填信息（优先于被引用类型） |
| `descriptionLinks` | `Record<string, string>?` | JSDoc `{@link}` 引用映射 |

### FunctionSignature

| 字段 | 类型 | 说明 |
|------|------|------|
| `parameters` | `FunctionParameter[]` | 参数列表 |
| `returnType` | `TypeInfo` | 返回类型 |
| `typeParameters` | `string[]?` | 泛型参数（如 `['T', 'K']`） |

### FunctionParameter

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 参数名称 |
| `type` | `TypeInfo` | 参数类型 |
| `optional` | `boolean?` | 是否可选 |
| `rest` | `boolean?` | 是否为剩余参数 |

## TypeCategory（10 种）

描述类型的结构和语义（kind 字段的取值）：

| 值 | 常量 | 说明 |
|----|------|------|
| `primitive` | `TYPE_CATEGORY.Primitive` | 基础类型：string, number, boolean, null, undefined, symbol, bigint |
| `literal` | `TYPE_CATEGORY.Literal` | 字面量类型：`'hello'`, `42`, `true` |
| `object` | `TYPE_CATEGORY.Object` | 对象类型：`{ a: string }` |
| `function` | `TYPE_CATEGORY.Function` | 函数类型：`() => void` |
| `array` | `TYPE_CATEGORY.Array` | 数组类型：`string[]` |
| `tuple` | `TYPE_CATEGORY.Tuple` | 元组类型：`[string, number]` |
| `union` | `TYPE_CATEGORY.Union` | 联合类型：`string \| number` |
| `intersection` | `TYPE_CATEGORY.Intersection` | 交叉类型：`A & B` |
| `enum` | `TYPE_CATEGORY.Enum` | 枚举或纯字面量联合：`'a' \| 'b' \| 'c'` |
| `unknown` | `TYPE_CATEGORY.Unknown` | 无法识别的类型 |

## RenderHint（6 种）

展示策略提示（renderHint 字段的取值），指导 UI 层如何渲染和交互：

| 值 | 常量 | 说明 | UI 行为 |
|----|------|------|---------|
| `builtin` | `RENDER_HINT.Builtin` | TS 内置类型（String, Promise, Map 等） | 不展开，显示类型名 |
| `external` | `RENDER_HINT.External` | 外部库类型（React.ComponentType 等） | 不展开，显示类型名 |
| `index-access` | `RENDER_HINT.IndexAccess` | 索引访问类型（T["id"]） | 不展开（类型擦除） |
| `circular` | `RENDER_HINT.Circular` | 循环引用 | 显示标记，避免无限递归 |
| `truncated` | `RENDER_HINT.Truncated` | 超过最大深度 | 显示类型名，不展开 |
| `generic` | `RENDER_HINT.Generic` | 含未实例化泛型参数 | 不影响渲染，按 kind 继续 |

## OutputResult（JSON 顶层结构）

| 字段 | 类型 | 说明 |
|------|------|------|
| `generatedAt` | `string` | ISO 时间戳 |
| `keys` | `Record<string, TypeInfo>` | 类型映射（key 为 registry 注册名） |
| `typeRegistry` | `Record<string, TypeInfo>` | 去重的类型定义池 |

## 特殊属性键名

对象的 `properties` 中可能包含索引签名，使用以下特殊键名：

| 键名 | 含义 |
|------|------|
| `[key: string]` | 字符串索引签名 |
| `[index: number]` | 数字索引签名 |

## 解析器行为说明

- **工具类型展开**：Partial、Omit、Pick、Record 等 TypeScript Utility Types 会被完全展开为具体属性
- **循环引用检测**：基于路径追踪，检测到循环时标记 `renderHint: 'circular'`
- **深度限制**：超过 `maxDepth` 时标记 `renderHint: 'truncated'`（基础类型和纯字面量联合不受深度限制）
- **联合类型简化**：可选属性的 `T | undefined` 自动简化为 `T`，`false | true` 合并为 `boolean`
- **类型去重**：相同类型只在 `typeRegistry` 中存储一次，其他位置使用 `$ref` 引用
