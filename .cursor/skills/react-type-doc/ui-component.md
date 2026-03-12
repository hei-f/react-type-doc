# UI 组件

内置的交互式类型文档面板，支持类型点击展开、面包屑导航、循环引用处理。依赖 `styled-components`（peerDependency）。

## TypeDocPanel

```tsx
import { TypeDocPanel, zhCN } from 'react-type-doc/ui';
import typeData from './type-docs.json';

function App() {
  return (
    <TypeDocPanel
      typeKey="Button"
      data={typeData}
      locale={zhCN}
      titlePrefix="组件"
    />
  );
}
```

### Props

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `typeKey` | `string` | 是 | — | 类型 key（对应生成 JSON 中 `keys` 的 key） |
| `data` | `OutputResult \| null` | 是 | — | 生成的类型文档 JSON 数据 |
| `locale` | `TypeDocLocale` | 否 | `en` | 国际化 locale |
| `titlePrefix` | `string` | 否 | — | 标题前缀（显示为 `前缀 - 类型名`） |

### 交互行为

- 对象类型属性中的复杂类型可点击，点击后原地展开详情
- 面包屑导航显示在顶部，支持快速回退到任意层级
- 循环引用类型显示标记
- 泛型类型标注未实例化参数
- 外部/内置类型仅显示名称，不可展开

### 渲染模式

- 根级联合类型 → 直接渲染联合类型视图（无 interface 包裹）
- 根级对象类型 → interface 风格代码块，显示属性列表
- 嵌套联合类型 → 联合类型视图
- 嵌套对象类型 → interface 风格代码块
- 无属性 → 显示空状态

## 内置 Locale

| 名称 | 导入 | 说明 |
|------|------|------|
| `en` | `import { en } from 'react-type-doc/ui'` | 英文（默认） |
| `zhCN` | `import { zhCN } from 'react-type-doc/ui'` | 简体中文 |

## 自定义 Locale

实现 `TypeDocLocale` 接口的所有字段：

```typescript
import type { TypeDocLocale } from 'react-type-doc/ui';

const myLocale: TypeDocLocale = {
  renderHintTitles: {
    builtin: 'TypeScript built-in type',
    'index-access': 'Index access type, cannot expand',
    external: 'External library type',
    circular: 'Circular reference',
    truncated: 'Max parse depth reached',
    generic: 'Contains uninstantiated generic parameters',
  },

  dataNotLoaded: 'Data not loaded',
  typeNotFound: (key) => `Type "${key}" not found`,
  noProperties: 'No properties',
  noExpandableProperties: 'No expandable properties',

  externalTypeDefault: 'External type',
  circularRef: (name, hint) => `Circular: ${name}${hint ? ` (${hint})` : ''}`,
  genericExpandable: (name) => `${name} — click to view`,
  clickToViewType: 'Click to view',
  genericCannotExpand: (name) => `${name} cannot expand`,
  clickToViewDetails: 'View details',
  clickToView: (name) => `View ${name}`,

  anonymousObject: '[Anonymous]',
  anonymousObjectField: (field) => `.${field}[Anonymous]`,
  unionMember: (i) => `Member ${i}`,

  propertiesCount: (n) => `${n} properties`,
};
```

### TypeDocLocale 完整字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `renderHintTitles` | `Record<RenderHint, string>` | 6 种 RenderHint 的 tooltip |
| `dataNotLoaded` | `string` | 数据未加载 |
| `typeNotFound` | `(key: string) => string` | key 未找到 |
| `noProperties` | `string` | 无属性 |
| `noExpandableProperties` | `string` | 无可展开属性（内联注释） |
| `externalTypeDefault` | `string` | 外部类型默认 tooltip |
| `circularRef` | `(name, sourceHint?) => string` | 循环引用 tooltip |
| `genericExpandable` | `(name) => string` | 泛型可展开 tooltip |
| `clickToViewType` | `string` | 通用"点击查看"tooltip |
| `genericCannotExpand` | `(name) => string` | 泛型不可展开 tooltip |
| `clickToViewDetails` | `string` | 联合成员"查看详情" |
| `clickToView` | `(typeName) => string` | @link "点击查看" |
| `anonymousObject` | `string` | 匿名对象名 |
| `anonymousObjectField` | `(fieldName) => string` | 字段内匿名对象名 |
| `unionMember` | `(index) => string` | 联合成员名 |
| `propertiesCount` | `(count) => string` | 属性数量标题 |
