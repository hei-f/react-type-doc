# UI 组件

用同一份生成结果（`OutputResult`）做**交互式类型文档**。依赖 **`react` + `styled-components`**（peer）。提供两种展示形态：**经典面板**（结构化 DOM）与 **CodeMirror 编辑器面板**（只读代码视图）；导航、点击展开、面包屑逻辑一致。

## 选哪种面板

| 组件 | 依赖 | 适合场景 |
|------|------|----------|
| `TypeDocPanel` | 仅 UI 基座 peer | 体量小、不引入编辑器 |
| `TypeDocEditorPanel` | 另需 CodeMirror 相关 peer（见下） | 要语法高亮、折叠、编辑器式阅读/复制 |

首屏不想打大包时，用 **`TypeDocEditorPanelLazy`**（`React.lazy`）+ `Suspense`。

## 共有 Props（`TypeDocPanelProps`）

两面板 API 相同。

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `typeKey` | `string` | 是 | — | 对应 JSON `keys` 的 key |
| `data` | `OutputResult \| null` | 是 | — | 生成的类型文档数据 |
| `locale` | `TypeDocLocale` | 否 | `en` | 文案 |
| `titlePrefix` | `string` | 否 | — | 标题前缀（`前缀 - 类型名`） |

## TypeDocPanel（经典）

```tsx
import { TypeDocPanel, zhCN } from 'react-type-doc/ui';
import typeData from './type-docs.json';

export function ClassicDoc() {
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

## TypeDocEditorPanel（CodeMirror）

这些包是 **`react-type-doc` 的 optional peerDependencies**：不会打进库包，只用经典面板时不必装；用编辑器面板时须在你**应用**的 `package.json` 里声明为依赖（或由包管理器按 peer 提示安装），版本与库的 peer 范围一致即可，避免重复打包、版本冲突，并缩小未用 CodeMirror 时的安装体积。

涉及：`@uiw/react-codemirror`、`@codemirror/lang-javascript`、`@codemirror/language`、`@codemirror/state`、`@codemirror/view`、`@codemirror/theme-one-dark`、`@replit/codemirror-indentation-markers`。

```tsx
import { Suspense } from 'react';
import { TypeDocEditorPanelLazy, zhCN } from 'react-type-doc/ui';
import typeData from './type-docs.json';

export function EditorStyleDoc() {
  return (
    <Suspense fallback={null}>
      <TypeDocEditorPanelLazy
        typeKey="Button"
        data={typeData}
        locale={zhCN}
        titlePrefix="组件"
      />
    </Suspense>
  );
}
```

也可直接 `import { TypeDocEditorPanel } from 'react-type-doc/ui'`（不经 `lazy`，首包更大）。

## 行为与渲染（两面板一致）

**交互**

- 可展开类型可点击，原地进入详情；面包屑回退任意层级  
- 循环引用、泛型未实例化、外部/内置类型等与运行时渲染规则一致（见 [runtime-api.md](runtime-api.md)）  
- JSDoc 中可解析的 `{@link Type}` 行为类似「可点击类型」

**结构模式**

- 根为联合类型 → 联合视图（无 `interface` 包裹）  
- 根为对象 → `interface` 风格 + 属性列表  
- 嵌套联合 / 嵌套对象 → 对应视图或 `interface` 块  
- 无属性 → 空状态  

## 内置 Locale

| 名称 | 导入 | 说明 |
|------|------|------|
| `en` | `import { en } from 'react-type-doc/ui'` | 默认英文 |
| `zhCN` | `import { zhCN } from 'react-type-doc/ui'` | 简体中文 |

## 自定义 Locale

实现 `TypeDocLocale` 全部字段。示例骨架：

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

### TypeDocLocale 字段表

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
| `clickToViewType` | `string` | 通用「点击查看」tooltip |
| `genericCannotExpand` | `(name) => string` | 泛型不可展开 tooltip |
| `clickToViewDetails` | `string` | 联合成员「查看详情」 |
| `clickToView` | `(typeName) => string` | `{@link}` 等「点击查看」 |
| `anonymousObject` | `string` | 匿名对象名 |
| `anonymousObjectField` | `(fieldName) => string` | 字段内匿名对象名 |
| `unionMember` | `(index) => string` | 联合成员名 |
| `propertiesCount` | `(count) => string` | 属性数量标题 |
