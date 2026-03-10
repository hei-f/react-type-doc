# components — UI 组件

演示应用的 UI 组件，分为两类：展示组件（用于 Demo 界面）和测试组件（用于类型解析测试）。

## 展示组件

### TypeDocPanel/

交互式类型文档查看器，演示 `react-type-doc/runtime` API 的完整用法。

以 VS Code 风格的代码编辑器形式渲染类型信息，支持：
- 点击类型名称展开嵌套类型定义
- 面包屑导航（历史栈）支持返回上一级
- JSDoc 注释展示、源码位置标记
- 循环引用和外部类型的视觉提示

核心依赖 `PropsDocReader.getTypeRenderInfo()` 做渲染决策，通过 `RENDER_TYPE` 判别联合类型分发到不同的渲染分支。

样式文件 `styled.ts` 使用 styled-components，被 `ReactDocgenTsViewer` 复用。

### ComparisonView/

原始 JSON 数据对比视图，使用 Monaco Editor 并排展示 `react-type-doc` 和 `react-docgen-typescript` 对同一类型的输出数据，附带数据大小统计。

### ReactDocgenTsViewer/

`react-docgen-typescript` 输出的类型查看器，复用 `TypeDocPanel/styled.ts` 的样式组件，以相同的代码编辑器风格展示 Props 信息，便于与 `TypeDocPanel` 进行视觉对比。

## 测试组件

以下组件作为类型解析的测试用例，供 benchmark 和 Demo 使用：

| 组件 | 测试场景 |
|------|----------|
| `BasicComponent.tsx` | 基础 Props（string、number、boolean、可选属性） |
| `ComplexPropsComponent.tsx` | 复杂 Props（嵌套对象、联合类型、函数签名） |
| `GenericComponent.tsx` | 泛型组件 Props |
| `NamespacedComponent.tsx` | 使用命名空间类型的组件 Props |
