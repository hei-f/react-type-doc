# GitHub Actions 部署指导

本文档用于说明当前仓库的 GitHub Actions 部署流程，并总结此前遇到的部署问题与排查方法。目标是让维护者能够快速理解 `react-type-doc` 示例站点是如何构建并部署到 GitHub Pages 的。

## 部署目标

当前仓库通过 GitHub Actions 自动构建 `packages/example`，然后将产物部署到 GitHub Pages。对应的 workflow 文件是：

`.github/workflows/deploy-example.yml`

## 工作流执行顺序

1. 检出仓库代码。
2. 配置 GitHub Pages。
3. 安装 `pnpm`。
4. 根据 `.nvmrc` 配置 Node.js。
5. 执行 `pnpm install --frozen-lockfile` 安装依赖。
6. 执行 `pnpm build` 构建 `packages/react-type-doc`。
7. 执行 `pnpm benchmark` 生成 `packages/example/benchmark-output` 下的对比数据。
8. 执行 `pnpm exec vite build` 构建 `packages/example`。
9. 上传 `packages/example/dist` 作为 Pages artifact。
10. 使用 `actions/deploy-pages` 完成发布。

## 这次部署遇到的问题

### 1. `react-type-doc` 命令在 CI 中不可用

最初在 `pnpm benchmark` 阶段会出现：

`sh: 1: react-type-doc: not found`

根因是 `packages/example` 的脚本直接执行 `react-type-doc`，但当时 `react-type-doc` 包的 bin 入口指向 `dist/cli.js`。在安装依赖阶段，这个构建产物还不存在，所以 pnpm 无法正确创建可执行链接。

处理方式：

- 给 `react-type-doc` 增加了稳定的 `bin/react-type-doc.js` 包装入口。
- `packages/react-type-doc/package.json` 的 `bin` 改为指向这个包装入口。
- workflow 中继续保持先 `pnpm build` 再 `pnpm benchmark`，确保 CLI 构建产物可用。

### 2. `vite build` 找不到 benchmark 生成的数据

随后在 `packages/example` 构建阶段会出现：

`Could not resolve "../benchmark-output/react-type-doc.json" from "src/App.tsx"`

原因是 `packages/example/src/App.tsx` 在构建时静态引用了 `benchmark-output/react-type-doc.json`。如果 `pnpm benchmark` 没有成功执行，或者输出目录被清理掉，Vite 构建就会失败。

处理方式：

- 将 `pnpm benchmark` 放在 `pnpm exec vite build` 之前。
- 在本地或 CI 中都要确保 benchmark 成功产出 JSON 文件后，再执行 example 构建。

### 3. Pages 构建和 base path 的衔接

GitHub Pages 发布时，应用需要感知站点的 base path。workflow 里通过 `actions/configure-pages` 获取 base path，并注入给构建步骤中的 `VITE_BASE_PATH`。

如果这个变量缺失，部署后的资源路径可能会不正确，页面会出现静态资源加载失败的问题。

## 本地验证命令

在提交部署相关修改前，建议按下面顺序验证：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm benchmark
pnpm --cwd packages/example exec vite build
pnpm --cwd packages/example exec react-type-doc --help
```

## 常见排查点

- 如果 `react-type-doc` 命令找不到，先确认 `packages/react-type-doc/package.json` 中的 `bin` 是否指向 `./bin/react-type-doc.js`，并且这个文件存在且可执行。
- 如果 `benchmark-output/react-type-doc.json` 缺失，先检查 `pnpm benchmark` 的输出是否报错，再检查 `packages/example/src/benchmark/adapters/react-type-doc.ts` 是否成功生成数据。
- 如果 Pages 部署后样式或 JS 资源 404，先检查 `VITE_BASE_PATH` 是否正确传入 `vite build`。
- 如果 GitHub Actions 在安装阶段失败，先确认 `.nvmrc`、`pnpm-lock.yaml` 和 `package.json` 是否与当前仓库状态一致。

## 对已有用户的影响

这份部署流程只影响仓库内的 GitHub Pages 示例站点构建，不要求用户先发布 `react-type-doc` 到 npm。

如果未来要单独发布 npm 包，那会是另一条发布链路，不属于这个 Pages 部署流程。
