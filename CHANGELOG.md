# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-03-23

### Added

- `TypeDocEditorPanel` / `TypeDocEditorPanelLazy`：基于 CodeMirror 的只读类型文档视图（语法高亮、折叠等），与 `TypeDocPanel` 共用 `data` + `typeKey` 与导航语义
- CodeMirror 相关依赖以 optional `peerDependencies` 声明，由使用编辑器面板的应用安装

### Fixed

- 匿名对象内联展开与数组导航相关展示/导航问题
- 联合类型文本中 `undefined` 的清理与展示

### Changed

- 示例项目更新以展示编辑面板
- 文档与 Cursor skill：补充 UI 子路径、peer 依赖说明

## [1.1.3] - 2026-03-19

### Fixed

- 修复 `unionParser` 中对包含冒号的字符串字面量的处理逻辑
- 将缓存键解析从 `split(':')` 改为基于第一个冒号分割，避免值中包含冒号时被错误截断
- 确保 URL、时间等格式的字符串字面量（如 `"https://example.com"`, `"12:30:45"`）能够正确解析

## [1.1.2] - 2026-03-19

### Added

- 为字面量类型（字符串/数字/布尔）生成专用的缓存 Key 格式，避免引号进入缓存键
- 新增 `extractLiteralValue` 工具函数，从类型文本中提取纯净的字面量值
- 新增 `getLiteralTypeCategory` 工具函数，识别字面量类型分类

### Fixed

- 修复 unionParser 中对新字面量缓存 Key 格式的兼容性，确保布尔字面量和联合类型简化逻辑正确工作

### Changed

- 优化字面量类型的缓存命中率，提升类型解析性能

## [1.1.1] - 2026-03-18

### Fixed

- 修复泛型实例化后函数属性的参数类型解析错误，现在能正确将泛型参数（如 `T`）替换为实际类型（如 `string`）

## [1.1.0] - 2026-03-16

### Added

- 匿名对象显示紧凑属性摘要（如 `{ id, name, email }`），替代统一的 `[匿名对象]` 文本
- type alias 引用泛型类型时保留来源名称（如 `Box<string>` 而非展开后的结构）

### Fixed

- 修复 CLI 执行 `npx react-type-doc` 时报错 `Unknown file extension ".ts"` 的问题
- 修复超长匿名类型名导致面板标题和面包屑导航无法点击的布局问题

## [1.0.1] - 2026-03-12

### Changed

- 校对精简 README，移除冗余段落和无效占位链接
- 补充内置 UI 组件（`react-type-doc/ui`）使用文档
- 修复 `getPropertyEntries` 示例中多余的 `Object.entries` 包裹

## [1.0.0] - 2026-03-12

### Added

- TypeScript 类型深度解析引擎，支持展开 Partial、Pick、Omit、Record 等工具类型
- 条件类型、映射类型、模板字面量类型解析
- 泛型约束与泛型实例化解析
- 自引用与循环引用类型的安全处理
- 运行时类型信息读取 API（reader）
- UI 组件入口，提供可嵌入的类型文档渲染组件
- CLI 工具，支持命令行生成类型文档
- JSDoc 注释解析与属性文档提取
- 类型缓存机制，优化重复解析性能
- 索引签名、元组、重载函数签名等高级类型支持
- ESM / CommonJS 双格式输出

[1.2.0]: https://github.com/hei-f/react-type-doc/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/hei-f/react-type-doc/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/hei-f/react-type-doc/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/hei-f/react-type-doc/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/hei-f/react-type-doc/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/hei-f/react-type-doc/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/hei-f/react-type-doc/releases/tag/v1.0.0
