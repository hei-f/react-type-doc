# 测试文档

本文档描述了 react-type-doc 项目的测试设置、结构和指南。

## 测试框架

项目使用 [Vitest](https://vitest.dev/) 作为测试框架，具有以下特性：

- 快速的测试执行
- 与 Vite 原生集成
- TypeScript 支持开箱即用
- JSX/TSX 支持
- 代码覆盖率报告（v8）

## 目录结构

```
packages/react-type-doc/
├── src/
│   ├── __tests__/
│   │   ├── fixtures/          # 测试固件（示例类型定义）
│   │   │   ├── basic-types.ts     # 基础类型定义
│   │   │   └── component-types.tsx # React 组件类型定义
│   │   └── helpers/           # 测试辅助工具
│   │       └── testUtils.ts       # 通用测试工具函数
│   ├── core/
│   │   ├── typeParser.ts
│   │   └── typeParser.test.ts # typeParser 单元测试
│   └── runtime/
│       ├── reader.ts
│       ├── reader.test.ts          # reader 基础测试
│       └── reader.getTypeRenderInfo.test.ts # getTypeRenderInfo 专项测试
├── vitest.config.ts          # Vitest 配置
└── coverage/                 # 覆盖率报告（生成后）
```

## 运行测试

**须通过子包 `package.json` 的脚本调用 Vitest**（会加载 `vitest.config.ts` 中的 `environment: jsdom` 等）。**不要使用**裸命令 `bun test`：那是 Bun 内置测试运行器，不读 Vitest 配置，UI 相关用例会失败（如 `document is not defined`）。

### 基础命令

在 `packages/react-type-doc` 目录：

```bash
# 运行所有测试（单次执行后退出；发布/CI 请用此形式）
bun run test run

# 开发时 watch（默认 Vitest 监听模式）
bun run test

# 运行测试并生成覆盖率报告（单次）
bun run test:coverage run

# 运行测试并打开 UI 界面
bun run test:ui
```

在仓库根目录（脚本会 `--cwd` 到子包）：

```bash
bun run test -- run
bun run test:coverage -- run
bun run test:ui
```

### 运行特定测试

```bash
cd packages/react-type-doc

# 按文件名/路径片段过滤（Vitest）
bun run test run typeParser
bun run test run reader
bun run test run getTypeRenderInfo
```

## 测试文件组织

### 1. 测试固件 (Fixtures)

位于 `src/__tests__/fixtures/`，包含：

- **basic-types.ts**: 基础 TypeScript 类型定义
  - 原始类型 (string, number, boolean, etc.)
  - 数组类型
  - 联合类型
  - 枚举类型
  - 对象类型
  - 函数类型

- **component-types.tsx**: React 组件类型定义
  - React 函数组件
  - Props 接口
  - 事件处理器类型

### 2. 测试工具 (Test Utils)

位于 `src/__tests__/helpers/testUtils.ts`，提供：

- `createTestProject()`: 创建测试用的 ts-morph Project
- `createTestFile()`: 在项目中创建测试文件
- `getExportedType()`: 提取导出的类型信息

### 3. 单元测试

#### typeParser.test.ts (75% 覆盖率)

测试核心类型解析功能（149 个测试用例）：

- **配置和缓存管理**: 测试 initParseOptions, clearTypeCache, getTypeCacheSize 等
- **getTypeKind**: 测试类型种类识别
- **parseTypeInfo**: 测试类型信息解析
  - 基础类型（string, number, boolean, etc.）
  - 数组类型
  - 联合类型
  - 枚举类型
  - 对象类型（含属性、索引签名）
  - 函数类型（含参数、返回值、泛型）
  - 交叉类型
  - 元组类型
  - 条件类型
  - 映射类型
  - 内置类型（Promise, Map, Set, Date, RegExp, Error）
  - TypeScript 工具类型（Partial, Required, Pick, Omit, Record, etc.）
  - 循环引用
  - 深度限制
  - JSDoc 注释解析
  - 特殊属性（readonly, optional, Symbol）

#### reader.test.ts (99% 覆盖率)

测试 PropsDocReader 类的基础功能（65 个测试用例）：

- **实例化**: 测试 create 方法
- **原始数据访问**: 测试 getRaw
- **引用解析**: 测试 resolveRef
- **属性访问**: 测试 getPropertyEntries
- **可展开性判断**: 测试 isExpandable（object, array, union）
- **显示名称**: 测试 getDisplayName
- **键管理**: 测试 getAllKeys, hasKey
- **类型注册表**: 测试 getTypeRegistry
- **类型判断**: 测试 isExternal, isCircular, isComplexType, isGenericType, isFunctionType
- **函数签名**: 测试 getFunctionSignatures
- **自定义类型名**: 测试 extractCustomTypeName
- **导航目标**: 测试 getNavigationTarget（数组类型、元素类型、回退逻辑）

#### reader.getTypeRenderInfo.test.ts (专项测试)

专门测试 `getTypeRenderInfo` 方法的复杂逻辑（44 个测试用例）：

- **renderHint 优先级**: builtin, external, circular, truncated, generic
- **按 kind 分类**:
  - enum: 有值、无值
  - union: 简单联合、复杂联合
  - array: 简单数组、复杂元素
  - object: 简单对象、可展开对象
  - function: 单签名、多签名
  - primitive: 各种基础类型
- **兜底处理**: 未知 kind、不可展开类型

## 覆盖率报告

### 当前覆盖率

```
----------------|---------|----------|---------|---------|----------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s    
----------------|---------|----------|---------|---------|----------------------
All files       |   79.59 |    75.05 |    87.5 |   79.96 |                      
 core           |   74.94 |    69.65 |   82.25 |   75.35 |                      
  typeParser.ts |   74.94 |    69.65 |   82.25 |   75.35 | 详见报告             
 runtime        |   98.96 |    94.33 |     100 |   98.95 |                      
  reader.ts     |   98.92 |    94.23 |     100 |   98.91 | 451 (死代码分支)     
  utils.ts      |     100 |      100 |     100 |     100 |                      
 shared         |     100 |      100 |     100 |     100 |                      
  constants.ts  |     100 |      100 |     100 |     100 |                      
  types.ts      |     100 |      100 |     100 |     100 |                      
----------------|---------|----------|---------|---------|----------------------
```

### 覆盖率目标

- **纯逻辑模块（reader.ts, utils.ts）**: 目标 90%+ ✅ (达到 99%)
- **简单模块（constants.ts, types.ts）**: 目标 100% ✅ (达到 100%)
- **复杂解析模块（typeParser.ts）**: 目标 70%+ ✅ (达到 75%)
- **总体覆盖率**: 目标 75%+ ✅ (达到 80%)

### 查看详细覆盖率报告

```bash
# 生成并查看 HTML 覆盖率报告
cd packages/react-type-doc && bun run test:coverage run
open coverage/index.html
```

## 测试最佳实践

### 1. 测试命名

- 使用中文描述测试意图
- 遵循 "应该..." 的模式
- 清晰描述测试场景

```typescript
it('应该正确解析数组类型', () => {
  // ...
});
```

### 2. 测试组织

- 使用 `describe` 分组相关测试
- 每个测试应该独立且可重复
- 使用 `beforeEach` 进行测试前的准备工作

```typescript
describe('typeParser', () => {
  beforeEach(() => {
    clearTypeCache();
  });

  describe('parseTypeInfo', () => {
    it('应该...', () => {});
  });
});
```

### 3. 断言风格

- 使用 Vitest 的 expect API
- 断言应该清晰且具体
- 测试边界情况和错误路径

```typescript
expect(typeInfo).toBeDefined();
expect(typeInfo.kind).toBe('object');
expect(typeInfo.properties).toHaveProperty('name');
```

### 4. 测试数据

- 使用 fixtures 目录存放共享的测试数据
- 使用 `createTestFile` 创建内联测试类型
- 保持测试数据最小化和相关性

```typescript
createTestFile(
  project,
  'test.ts',
  `export type TestType = string;`,
);
```

## 持续集成

测试应该在以下情况下自动运行：

- 代码提交前（通过 git hooks）
- Pull Request 创建时
- 代码合并到主分支时

## 未来改进计划

1. **提升 typeParser.ts 覆盖率**: 补充边界情况和错误处理测试至 90%+
2. **性能测试**: 添加基准测试，确保类型解析性能
3. **集成测试**: 添加端到端测试，测试完整的使用场景
4. **快照测试**: 使用快照测试验证类型信息输出的稳定性
5. **错误场景**: 补充更多异常情况和错误处理的测试

## 常见问题

### Q: 测试运行很慢怎么办？

A:
- 使用 `bun run test run <pattern>`（在 `packages/react-type-doc`）运行子集
- 使用 `--reporter=dot` 减少输出
- 检查是否有死循环或无限递归

### Q: 覆盖率报告在哪里？

A: 在 `packages/react-type-doc` 执行 `bun run test:coverage run` 后，报告生成在 `coverage/` 目录下。

### Q: 如何调试失败的测试？

A:
- 使用 `console.log` 输出中间结果
- 使用 Vitest UI: `bun run test:ui`
- 使用 VS Code 的调试功能

### Q: 为什么 Array<T> 被识别为 'object'？

A: 这是 ts-morph 的行为，泛型数组类型（如 `Array<string>`）可能被识别为 object 类型，而数组字面量（如 `string[]`）被识别为 array 类型。测试应该同时接受这两种情况。

## 贡献指南

在提交代码时：

1. 确保所有测试通过: `bun run test run`（在 `packages/react-type-doc`）或仓库根 `bun run test -- run`
2. 确保覆盖率不下降: `bun run test:coverage run`（在子包）或 `bun run test:coverage -- run`（在根目录）
3. 为新功能添加测试
4. 更新相关文档

## 测试统计

- **总测试用例数**: 149 个
- **测试通过率**: 100%
- **测试文件数**: 3 个
- **测试覆盖的模块**: core, runtime, shared
