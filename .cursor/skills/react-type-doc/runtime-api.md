# 运行时 API

通过 `react-type-doc/runtime` 导入，不依赖 ts-morph，可安全打包到前端 bundle。

## PropsDocReader

核心读取器类，封装类型数据的读取、引用解析和渲染决策逻辑。

### 创建实例

```typescript
import { PropsDocReader } from 'react-type-doc/runtime';
import typeData from './type-docs.json';

const reader = PropsDocReader.getInstance(typeData); // 单例（适用于全局共享一份数据）
const reader = PropsDocReader.create(typeData);      // 独立实例（多份数据并存）
```

### 方法速查

| 方法 | 返回值 | 用途 |
|------|--------|------|
| `resolve(key)` | `FullTypeInfo \| null` | 根据 key 获取完整类型信息（自动解析 `$ref` 引用） |
| `resolveRef(typeInfo)` | `FullTypeInfo` | 解析单个 TypeInfo 的引用，合并位置相关的 description/required |
| `getTypeRenderInfo(typeInfo)` | `TypeRenderInfo` | 获取渲染决策（判别联合类型，按 `type` 字段分支） |
| `isExpandable(typeInfo)` | `boolean` | 是否可展开（对象有属性、数组元素可展开、联合有可展开分支） |
| `getPropertyEntries(typeInfo)` | `[string, TypeInfo][]` | 获取对象属性条目列表 |
| `getNavigationTarget(typeInfo, name)` | `{ typeInfo, name } \| null` | 点击导航目标（数组类型穿透到元素类型） |
| `getDisplayName(typeInfo, fallback?)` | `string` | 获取显示名称（Object 类型使用 fallback） |
| `isExternal(typeInfo)` | `boolean` | 是否为外部/内置类型（builtin、external、index-access） |
| `isCircular(typeInfo)` | `boolean` | 是否为循环引用 |
| `isGenericType(typeInfo)` | `boolean` | 是否含未实例化的泛型参数 |
| `isFunctionType(typeInfo)` | `boolean` | 是否为函数类型 |
| `isComplexType(typeInfo)` | `boolean` | 是否为复杂类型（无名联合，数组场景需括号包裹） |
| `getFunctionSignatures(typeInfo)` | `FunctionSignature[]` | 获取函数签名列表（支持重载） |
| `extractCustomTypeName(text)` | `string \| null` | 从类型文本提取自定义类型名（支持命名空间） |
| `getAllKeys()` | `string[]` | 获取所有可用的类型 key |
| `hasKey(key)` | `boolean` | 检查 key 是否存在 |
| `getRaw(key)` | `TypeInfo \| null` | 获取原始类型信息（不解析引用） |
| `getTypeRegistry()` | `Record<string, TypeInfo>` | 获取类型注册表 |
| `getGeneratedAt()` | `string` | 获取生成时间 |

### resolveRef 默认值规则

- `description` 默认为空字符串 `''`
- `required` 默认为 `false`
- TypeRef 自身的 `description`/`required` 优先于被引用类型上的值
- `descriptionLinks` 跟随 `description` 的来源

## 渲染决策（TypeRenderInfo）

`getTypeRenderInfo` 返回判别联合类型，按 `type` 字段分支：

```typescript
import { RENDER_TYPE } from 'react-type-doc/runtime';

const renderInfo = reader.getTypeRenderInfo(typeInfo);

switch (renderInfo.type) {
  case RENDER_TYPE.EXTERNAL:
    // name: string — 不可展开，仅显示类型名
    break;

  case RENDER_TYPE.CIRCULAR:
    // name: string, sourceHint?: string, resolved: FullTypeInfo
    // 循环引用，显示名称可跳转
    break;

  case RENDER_TYPE.ENUM:
    // values: string[] — 枚举值列表
    break;

  case RENDER_TYPE.UNION:
    // types: TypeInfo[] — 递归渲染每个分支
    break;

  case RENDER_TYPE.ARRAY:
    // elementType: TypeInfo, needsParens: boolean
    // needsParens 为 true 时元素是无名联合，需括号：(A | B)[]
    break;

  case RENDER_TYPE.TUPLE:
    // text: string, elements?: TypeInfo[]
    break;

  case RENDER_TYPE.OBJECT:
    // name: string, expandable: boolean, resolved: FullTypeInfo
    break;

  case RENDER_TYPE.CUSTOM_EXPANDABLE:
    // name: string, text: string, resolved: FullTypeInfo
    // 有别名的可展开类型（如命名联合 ApiResponse<User>）
    break;

  case RENDER_TYPE.FUNCTION:
    // signatures: FunctionSignature[], text: string
    break;

  case RENDER_TYPE.PRIMITIVE:
  case RENDER_TYPE.DEFAULT:
    // text: string — 直接显示
    break;
}
```

**判定优先级**：`renderHint` 优先于 `kind`。唯一例外：`renderHint: 'generic'` 不影响渲染，继续按 `kind` 处理。

**联合类型特殊处理**：有 `name` 的联合类型（用户定义的类型别名）返回 `CUSTOM_EXPANDABLE` 而非 `UNION`，先展示可点击的别名名称。

## 自定义渲染示例

```tsx
import { PropsDocReader, RENDER_TYPE, type TypeInfo } from 'react-type-doc/runtime';
import typeData from './type-docs.json';

function TypeViewer({ typeKey }: { typeKey: string }) {
  const reader = PropsDocReader.getInstance(typeData);
  if (!reader) return null;

  const typeInfo = reader.resolve(typeKey);
  if (!typeInfo) return <div>类型不存在</div>;

  return (
    <div>
      <h2>{typeKey}</h2>
      {reader.getPropertyEntries(typeInfo).map(([name, prop]) => {
        const resolved = reader.resolveRef(prop);
        const renderInfo = reader.getTypeRenderInfo(resolved);

        return (
          <div key={name}>
            <strong>{name}</strong>
            {resolved.required && <span>*</span>}
            {': '}
            <TypeDisplay renderInfo={renderInfo} reader={reader} />
            {resolved.description && <p>{resolved.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
```

## 工具函数

| 函数 | 用途 |
|------|------|
| `isTypeRef(typeInfo)` | 类型守卫：判断是完整定义还是 `$ref` 引用 |
| `isPrimitiveType(text)` | 判断类型文本是否为基础类型 |
| `getTypeName(typeInfo)` | 获取显示名称（`name ?? text`） |
