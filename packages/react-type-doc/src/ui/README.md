# ui — 类型文档 UI

`react-type-doc/ui` 负责把 CLI 生成的 `OutputResult` 渲染成可交互的只读文档界面。它不解析源码，只消费运行时层已经解析好的数据。

## 对外入口

### index.ts

UI 层的公共入口，集中导出：

- `TypeDocPanel`
- `TypeDocEditorPanel`
- `TypeDocEditorPanelLazy`
- `en` / `zhCN`
- `TypeDocLocale`

## 目录职责

### panel/

经典类型文档面板，使用分层渲染和面包屑导航展示类型树。

- `TypeDocPanel.tsx` 负责整体布局、标题和导航状态接入
- `renderType.tsx` / `renderView.tsx` 负责对象、联合、函数和内联对象的递归渲染
- `hooks/useTypeNavigation.ts` 负责点击展开、历史栈和回退

### editor/

CodeMirror 风格的只读代码面板，用代码形式展示类型结构。

- `TypeDocEditorPanel.tsx` 负责装配编辑器、装饰和点击交互
- `typeToCode.ts` 负责把 `TypeInfo` 转成代码文本、JSDoc 元数据和 semantic decorations
- `codeMirror/` 负责可点击装饰、语义高亮、JSDoc 链接和编辑器主题常量

### shared/

UI 层共享的渲染辅助。

- `locale.ts`：本地化文案
- `types.ts`：渲染上下文与历史栈类型
- `renderDescription.tsx`：JSDoc 描述渲染
- `generic.ts`：泛型名称格式化
- `styled.ts`：面板样式和语义色

## 使用方式

1. 先通过 CLI 生成 JSON。
2. 把同一份 `data` 传给 `TypeDocPanel` 或 `TypeDocEditorPanel`。
3. 用 `typeKey` 对齐 JSON 的 `keys`，再通过面板内部导航展开子类型。
4. 如果需要按需加载编辑器面板，使用 `TypeDocEditorPanelLazy`。

## 关键注意事项

- UI 只消费生成结果，不解析源码。
- `TypeDocPanel` 和 `TypeDocEditorPanel` 依赖同一份 `OutputResult` 和 `PropsDocReader`，显示规则应保持一致。
- `typeKey` 必须与 JSON 的 `keys` 一致，否则面板无法定位目标类型。
- 使用 `TypeDocEditorPanel` / `TypeDocEditorPanelLazy` 时，不需要额外安装 CodeMirror 相关依赖；它们会随 `react-type-doc` 一起提供。
- 泛型展示优先使用结构化 `genericParameters`；如果数据里没有这份元数据，则回退到已有的 `name` / `text`，保持旧 JSON 兼容。

## 相关文档

- 运行时读取逻辑见 [src/runtime/README.md](../runtime/README.md)
- 解析阶段的泛型与类型输出见 [src/core/parser/README.md](../core/parser/README.md)
