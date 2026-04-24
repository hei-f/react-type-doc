# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.7] - 2026-04-24

### Fixed

- 修复 tsconfig 通过 extends 继承 moduleResolution 时检测失败的问题

### Changed

- 默认解析深度改为不限制（maxDepth: -1），完整解析深层嵌套类型

## [1.3.6] - 2026-04-23

### Fixed

- 回滚 CodeMirror 相关依赖升级，修复编辑器面板布局异常

## [1.3.5] - 2026-04-23

### Changed

- 升级 ts-morph 至 v28.0.0（内置 TypeScript 6.0.2 编译器）
- 升级 TypeScript 至 v6.0.3
- 升级 @types/node 至 v25、jsdom 至 v29、vitest 至 v4.1.5 等开发依赖
- tsconfig 移除已废弃的 `downlevelIteration`，lib 升级至 ES2022

### Fixed

- 修复测试代码中 `TypeInfo` 联合类型缺少类型收窄导致的类型错误

## [1.3.4] - 2026-04-23

### Fixed

- 修复当 tsconfig.json 未显式设置 `moduleResolution` 时，TypeScript 5.x 回退到 Classic 策略导致 node_modules 中的外部包类型无法解析，union 数组如 `(WidgetType | string)[]` 退化为 `any[]` 的问题

## [1.3.3] - 2026-04-23

### Added

- 解析选项 `maxDepth`、`maxTypeTextLength`、`maxDetailedTypeTextLength`、`cacheMaxTypeTextLength` 支持传入 `-1` 表示不限制

## [1.3.2] - 2026-03-27

### Fixed

- `react-type-doc/ui` 现在会随包一起提供 CodeMirror 运行时依赖，并保持编辑器入口按需加载，消费者只需安装一次 `react-type-doc`
- 运行时与 UI 面板现在优先展示已实例化的泛型名称，同时保持外部类型和匿名对象标题的简洁稳定

## [1.3.1] - 2026-03-26

### Added

- 默认面板切换为 CodeMirror，提升只读类型文档的浏览体验
- 结构化泛型参数展示保留约束与默认值，泛型声明更完整

### Fixed

- 修复嵌套类型可点击范围定位问题，覆盖函数参数、元组和结构化泛型展示场景
- 修复包含冒号的字符串字面量在缓存引用中的解析问题
- 修复 CLI 与示例部署链路中的可执行入口和构建顺序问题

### Changed

- 更新 README，补充新的编辑器面板说明
- 新增 GitHub Actions 部署说明，方便维护示例站点构建流程

## [1.3.0] - 2026-03-25

### Added

- 结构化泛型参数提取与展示，保留约束和默认值，并在运行时与 UI 中统一呈现
- `TypeDocEditorPanel` 增强只读 CodeMirror 展示，加入 JSDoc 链接、语义和括号高亮
- `TypeDocPanel` 与泛型声明标题展示支持更完整的泛型签名

### Fixed

- `Record` / `Partial<Record>` 等映射类型的值类型回退更稳定
- `{@link}` 引用解析可正确跟随本地与导入类型

### Changed

- 示例项目补充 GitHub Pages 部署配置，并更新 Node 版本约束
- 文档和发布说明同步更新，补充新的泛型展示说明

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
[1.3.1]: https://github.com/hei-f/react-type-doc/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/hei-f/react-type-doc/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/hei-f/react-type-doc/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/hei-f/react-type-doc/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/hei-f/react-type-doc/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/hei-f/react-type-doc/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/hei-f/react-type-doc/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/hei-f/react-type-doc/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/hei-f/react-type-doc/releases/tag/v1.0.0
