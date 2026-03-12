# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.1]: https://github.com/hei-f/react-type-doc/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/hei-f/react-type-doc/releases/tag/v1.0.0
