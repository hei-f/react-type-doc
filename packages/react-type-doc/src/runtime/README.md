# runtime — 运行时 API

在用户应用中使用的轻量级运行时模块，用于读取和解析 `generate` 命令生成的 JSON 数据。不依赖 ts-morph，可安全打包到前端 bundle 中。

通过 `react-type-doc/runtime` 子路径导入。

## 模块说明

### reader.ts

`PropsDocReader` 类 —— 运行时的核心 API，封装了类型数据的读取、引用解析和渲染决策逻辑。

**实例化方式：**

- `PropsDocReader.getInstance(data)` — 单例模式，适用于全局共享一份类型数据的场景
- `PropsDocReader.create(data)` — 创建独立实例，适用于需要多份数据并存的场景

**关键方法：**

| 方法 | 作用 |
|------|------|
| `resolve(key)` | 根据 key 获取完整类型信息（自动解析 `$ref` 引用） |
| `resolveRef(typeInfo)` | 解析单个 TypeInfo 的引用，合并位置相关的 description 和 required |
| `getTypeRenderInfo(typeInfo)` | **核心方法** — 返回 `TypeRenderInfo` 判别联合类型，UI 层据此决定渲染策略 |
| `isExpandable(typeInfo)` | 判断类型是否可展开（有嵌套属性） |
| `getPropertyEntries(typeInfo)` | 获取对象类型的属性条目 `[name, TypeInfo][]` |
| `getNavigationTarget(typeInfo, name)` | 获取点击导航目标，数组类型会穿透到元素类型 |
| `isExternal(typeInfo)` | 是否为外部/内置类型 |
| `isCircular(typeInfo)` | 是否为循环引用 |
| `isGenericType(typeInfo)` | 是否包含未实例化的泛型参数 |
| `getFunctionSignatures(typeInfo)` | 获取函数签名列表（支持重载） |

**`getTypeRenderInfo` 返回的渲染类型（`RENDER_TYPE`）：**

| 渲染类型 | 含义 | 典型 UI 行为 |
|----------|------|-------------|
| `EXTERNAL` | 外部/内置/索引访问类型 | 仅显示类型名，不可展开 |
| `CIRCULAR` | 循环引用 | 显示类型名，可点击跳转 |
| `ENUM` | 枚举/字面量联合 | 展示枚举值列表 |
| `UNION` | 联合类型 | 递归渲染每个分支 |
| `ARRAY` | 数组类型 | 显示元素类型，附加 `[]` |
| `TUPLE` | 元组类型 | 显示固定位置类型列表 |
| `OBJECT` | 对象类型 | 可展开的属性表 |
| `CUSTOM_EXPANDABLE` | 可展开的自定义类型 | 兜底：有嵌套属性的非标准类型 |
| `FUNCTION` | 函数类型 | 显示参数列表和返回类型 |
| `PRIMITIVE` | 基础/字面量类型 | 直接显示文本 |
| `DEFAULT` | 兜底 | 直接显示文本 |

### renderTypes.ts

渲染类型常量和判别联合类型定义。

| 导出 | 作用 |
|------|------|
| `RENDER_TYPE` | 渲染类型常量对象，定义所有渲染分支标识 |
| `RenderType` | 渲染类型的字面量联合类型 |
| `TypeRenderInfo` | 判别联合类型，UI 层根据 `type` 字段匹配到具体的渲染数据结构 |

### utils.ts

三个纯工具函数，供 `reader.ts` 和外部使用：

| 函数 | 作用 |
|------|------|
| `isTypeRef(typeInfo)` | 类型守卫：判断 TypeInfo 是完整定义还是 `$ref` 引用 |
| `isPrimitiveType(text)` | 判断类型文本是否为基础类型 |
| `getTypeName(typeInfo)` | 获取显示名称（`name ?? text`） |

## 注意事项

- `resolveRef` 在合并引用时有默认值规则：`description` 默认空字符串、`required` 默认 `false`。引用自身的 description/required 优先于被引用类型上的值
- `getTypeRenderInfo` 的判定顺序是 `renderHint` 优先于 `kind`，即先看展示策略标记，再看类型本质。唯一例外是 `renderHint: 'generic'` 不影响渲染，会继续按 `kind` 处理
- `TypeInfo.genericParameters` 和 `FunctionSignature.genericParameters` 保存的是声明级泛型签名；UI 层可以优先用它渲染 `interface` / `type` / 函数头，旧数据则回退到 `name` / `text`
