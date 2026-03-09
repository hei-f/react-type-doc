# packages

Monorepo 中的两个包。

## react-type-doc

对外发布的 npm 包，TypeScript 类型文档生成器。

分为构建阶段和运行时两个部分：

- **构建阶段**（`core/` + `cli/`）：通过 CLI 读取配置，使用 ts-morph 解析源文件中的类型，输出结构化 JSON（含类型去重的 `typeRegistry`）
- **运行时**（`runtime/`）：轻量级读取器 `PropsDocReader`，在用户应用中读取 JSON 数据并提供渲染决策 API。通过 `react-type-doc/runtime` 子路径导入，不引入 ts-morph

详见各子模块文档：[core](./react-type-doc/src/core/README.md)、[cli](./react-type-doc/src/cli/README.md)、[runtime](./react-type-doc/src/runtime/README.md)、[shared](./react-type-doc/src/shared/README.md)

## example

私有的演示与测试项目（Vite + React），承担两个职责：

- **交互式 Demo**：并排对比 `react-type-doc` 与 `react-docgen-typescript` 对同一类型的解析和展示效果
- **Benchmark**：对三个工具（react-type-doc、react-docgen-typescript、react-docgen）进行性能、输出大小和功能覆盖的量化对比

详见子模块文档：[components](./example/src/components/README.md)、[types](./example/src/types/README.md)

## 常用命令

从仓库根目录执行：

| 命令 | 作用 |
|------|------|
| `bun run generate` | 修改 rtd 代码后重新生成 example 的类型文档 JSON（直接执行 TS 源码，无需 build） |
| `bun run dev` | 启动 example 的 Vite 开发服务器 |
| `bun run build` | 构建 react-type-doc 的 dist 产物（发布前） |
| `bun run test` | 运行 react-type-doc 的单元测试 |
| `bun run benchmark` | 运行三方工具对比测试 |
