# cli — 命令行工具

提供 `react-type-doc` 的 CLI 入口，支持配置初始化和类型文档生成两个命令。

## 模块说明

### index.ts

CLI 主入口，解析命令行参数并分发到对应的命令处理函数。

**命令列表：**

| 命令 | 作用 |
|------|------|
| （无参数） | 执行生成命令（`runGenerate`） |
| `init` | 初始化配置文件（`runInit`） |
| `-h` / `--help` | 显示帮助信息 |
| `-v` / `--version` | 显示版本号 |

### generate.ts

生成命令的核心实现，串联整个解析流程。

**执行流程：**

1. 从项目根目录加载 `reactTypeDoc.config.ts` 配置文件（动态 `import`）
2. 调用 `initParseOptions` 初始化解析配置
3. 创建 `PathResolver` 处理路径别名
4. 创建 ts-morph `Project` 实例加载 tsconfig 中的所有源文件
5. 遍历 `registry` 中的每个注册项：
   - 有 `typeName` → 调用 `typeResolver.resolveType()` 直接查找类型
   - 无 `typeName` → 调用 `componentParser.findComponentProps()` 提取组件 Props
6. 从全局类型缓存收集 `typeRegistry`（去重后的类型定义）
7. 构建 `OutputResult` 并写入 JSON 文件

**代码组织风格：** IO 操作（文件读写、日志打印）与纯函数（结果构建、耗时计算）严格分离。

### init.ts

初始化命令，在项目根目录生成 `reactTypeDoc.config.ts` 模板文件。

如果配置文件已存在则跳过并提示，不会覆盖。

## 注意事项

- `generate.ts` 的配置加载使用动态 `import`，要求运行时环境支持直接导入 TypeScript 文件（如 bun、tsx）
- `generate.ts` 在遍历 registry 前会调用 `clearTypeCache()`，确保每次生成都是干净的状态。所有 registry 项共享同一个 typeCache，这是类型去重（typeRegistry）的基础
