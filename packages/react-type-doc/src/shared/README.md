# shared — 共享模块

跨层共享的定义和工具。本文档仅覆盖 `pathResolver.ts`，类型定义（`types.ts`）和常量（`constants.ts`）请直接查看源码。

## pathResolver.ts

`PathResolver` 类 —— tsconfig 路径别名解析器。

**职责：** 从 `tsconfig.json` 中读取 `compilerOptions.paths` 配置，将配置文件中使用的路径别名（如 `@/pages/...`）解析为绝对路径。

**使用场景：** `cli/generate.ts` 在解析 registry 中的 `sourcePath` 和 `outputPath` 时，通过此模块将别名路径转换为文件系统的实际路径。

**解析规则：**

1. 从 `tsconfig.json` 读取 `paths` 配置，结合 `baseUrl`（默认为 tsconfig 所在目录）计算每个别名的实际路径
2. 输入路径匹配到别名前缀时，替换为对应的实际路径
3. 未匹配任何别名时，作为相对于项目根目录的路径处理
4. tsconfig 中没有 `paths` 配置不报错，仅意味着无法使用路径别名

**公共 API：**

| 方法/函数 | 作用 |
|-----------|------|
| `createPathResolver(projectRoot, tsConfigPath)` | 工厂函数，创建 PathResolver 实例 |
| `resolver.resolve(inputPath)` | 解析路径（支持别名和相对路径） |
| `resolver.getMappings()` | 获取所有路径映射（调试用） |

## 注意事项

- tsconfig 解析支持带注释和尾随逗号的 JSON（先尝试标准 JSON 解析，失败后清理注释再解析）
- 通配符 `*` 会被自动移除：`@/*` → `@/`，`./src/*` → `./src/`
- `paths` 中每个别名只取第一个目标路径（`targetPaths[0]`），不支持多路径回退
