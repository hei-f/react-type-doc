# react-type-doc Example & Benchmark

这是 `react-type-doc` 的测试项目，用于功能测试和性能对比。

## 项目结构

```
example/
├── src/
│   ├── types/           # 复杂类型定义（测试用例）
│   ├── components/      # React 组件（测试用例）
│   └── benchmark/       # 对比测试框架
│       ├── adapters/    # 各工具适配器
│       ├── runner.ts    # 测试执行器
│       └── reporter.ts  # 报告生成器
├── reactTypeDoc.config.ts  # react-type-doc 配置
└── package.json
```

## 测试类型场景

本项目包含以下复杂类型场景用于测试：

- **基础类型** (`types/basic.ts`): 原始类型、字面量、数组、元组、函数
- **复合类型** (`types/composite.ts`): 联合类型、交叉类型、索引签名、嵌套对象
- **泛型** (`types/generics.ts`): 泛型约束、条件类型、递归泛型
- **工具类型** (`types/utility.ts`): Pick、Omit、Partial、Record 等
- **命名空间** (`types/namespace.ts`): 嵌套命名空间、命名空间合并
- **高级类型** (`types/advanced.ts`): 模板字面量、映射类型、infer 推断
- **循环引用** (`types/circular.ts`): 自引用、相互引用
- **外部类型** (`types/external.ts`): React 类型、第三方库类型

## 运行对比测试

```bash
# 安装依赖
bun install

# 运行对比测试
bun run benchmark
```

测试结果将保存到 `benchmark-output/` 目录：

- `report.json`: JSON 格式的详细报告
- `BENCHMARK.md`: Markdown 格式的可读报告
- `react-type-doc.json`: react-type-doc 的输出
- `react-docgen-typescript.json`: react-docgen-typescript 的输出
- `react-docgen.json`: react-docgen 的输出

> **说明**：我们只对比真正的竞品工具（生成类型 JSON 数据的工具），TypeDoc 等文档站点生成器不在对比范围内。

## 对比维度

1. **性能**: 执行时间
2. **输出大小**: 生成文件的大小
3. **功能支持**: 各种 TypeScript 类型特性的支持情况
4. **易用程度**: 配置复杂度、上手难度、文档质量

> **对比工具说明**：
> - ✅ **react-docgen-typescript**: 真正的竞品，同样用于生成类型 JSON 数据
> - ✅ **react-docgen**: 参考对比，技术路线不同（PropTypes vs TypeScript）
> - ❌ **TypeDoc**: 已移除，因为它是文档站点生成器，不是数据生成器

## 开发

```bash
# 启动开发服务器
bun run dev

# 构建
bun run build

# 仅生成 react-type-doc 文档
bun run generate:react-type-doc
```

## 许可证

MIT
