# react-type-doc NPM包发布流程

这是 `react-type-doc` npm包的发布流程文档。

你现在需要执行此发布流程。

## ⚠️ 强制执行规则

**禁止跳过任何步骤**。本发布流程的每个步骤都是必须执行的，不允许以任何理由跳过：

1. **顺序执行**：必须严格按照步骤 1 → 2 → 3 → ... → 13 的顺序执行
2. **完整执行**：每个步骤内的所有子步骤也必须完整执行，不能遗漏
3. **显式确认**：每完成一个主要步骤，必须在输出中明确标记 `✓ 步骤 X 完成`
4. **异常处理**：如果某个步骤无法执行，必须明确说明原因并标记为 `○ 步骤 X 跳过（原因：...）`
5. **禁止合并**：不允许将多个步骤合并执行或同时进行
6. **检查点验证**：在进入下一步骤前，必须确认当前步骤已完全完成

**特别注意**：步骤 3（测试验证与质量检查）包含多个子步骤（3.1-3.8），每个子步骤都必须执行并输出结果，不允许只执行部分子步骤就进入步骤 4。

## 发布流程步骤

### 1. 前置检查

**1.1 检查git工作区状态**

- 执行 `git status`
- 确认是否有未提交的改动，如有则在步骤2中进行原子化提交

**1.2 检查npm登录状态**

- 执行 `npm whoami`
- 如果未登录，提示用户执行 `npm login` 后再继续

**1.3 确认发布范围**

- 确认本次发布涉及 `packages/react-type-doc` 目录下的改动
- 如果存在example示例项目的改动，确认是否需要同步发布（通常example不发布）

### 2. 分析并原子化提交改动

**2.1 分析工作区改动**

- 使用 `git status` 查看所有未提交的文件
- 使用 `git diff` 逐文件分析具体改动内容：
  - 识别每个文件中的改动块（hunks）和具体行号
  - 分析每个改动块的功能意图
  - 注意同一文件中可能包含多个不相关的改动
- 识别改动类型（新功能、bug修复、代码重构、性能优化、文档更新等）
- **关键**：必须精确到文件内的具体改动行，而不是整个文件

**2.2 原子化分组**

将所有改动按照**原子化提交原则**进行分组：

- **原子化标准**：每组改动应聚焦于单一具体功能或改动点
  - 一个功能点的所有相关文件和行归为一组
  - 一个bug修复的所有相关文件和行归为一组
  - 一类相关的代码优化归为一组
  - **关键**：同一文件内的不同功能改动必须拆分到不同的提交组
  - 例如：文件A中的第10-15行是功能X，第50-60行是功能Y，应拆分为两个提交组
  - 避免在一个提交中混合不相关的改动
- **重要**：暂时忽略版本号相关文件（packages/react-type-doc/package.json中的version字段、README.md中的版本badge、CHANGELOG.md），这些将在步骤9中单独提交
- **输出格式**：对每个提交组，明确列出：
  - 提交组编号
  - 功能描述
  - 涉及的文件及具体行号范围（格式：`文件路径:行号范围`，如 `src/core/typeParser.ts:10-15,50-60`）

**2.3 逐组提交功能改动**

按分组顺序，依次提交每组改动：

对于每组改动：

1. **展示改动详情**：
   - 明确列出本组涉及的所有文件及行号范围
   - 使用 `git diff` 展示具体的代码改动内容
   - 确认改动内容与预期的提交功能一致

2. **生成commit message**，遵循以下规范：
   - **质量要求**：必须清晰概括改动内容，让人一眼看懂做了什么
   - **格式**：`{类型前缀}: {具体改动描述}`
   - **类型前缀**：
     - `feat:` 新增功能
     - `fix:` 修复问题
     - `refactor:` 代码重构（不改变功能）
     - `perf:` 性能优化
     - `docs:` 文档更新
     - `style:` 代码格式调整（不影响逻辑）
     - `test:` 测试相关
     - `chore:` 其他杂项（如构建配置、依赖更新等）
   - **描述要求**：
     - 使用有意义的动词描述具体行为（如：添加、修复、优化、重构）
     - 包含改动的核心要点，避免模糊描述
     - 示例：`feat: 添加条件类型解析支持` 而非 `update code`

3. **执行部分暂存提交**：

   **情况A：该组包含完整文件的所有改动**
   - 直接使用：`git add {文件路径1} {文件路径2} ...`
   - 然后执行：`git commit -m "{message}"`

   **情况B：该组仅包含文件的部分改动（行级别提交）**

   通过构造临时patch文件实现精确的行级别暂存（AI自动化操作）：

   a. **生成完整diff**：
   - 执行：`git diff -- {文件路径} > .git/temp_commit.patch`
   - 获取该文件的所有改动内容

   b. **读取并分析diff内容**：
   - 读取 `.git/temp_commit.patch` 文件
   - 解析diff格式，识别所有的hunks（改动块）
   - 每个hunk的格式为：`@@ -旧文件起始行,行数 +新文件起始行,行数 @@`

   c. **构造部分patch**：
   - 根据本组需要提交的行号范围，提取对应的hunks
   - 创建新的patch文件 `.git/partial_commit.patch`，只包含：
     - diff文件头信息（`diff --git`, `index`, `---`, `+++` 等）
     - 需要提交的hunks（保持完整的hunk格式）
   - **重要**：必须保持patch文件的格式完整性和上下文行

   d. **应用部分改动到暂存区**：
   - 执行：`git apply --cached --unidiff-zero .git/partial_commit.patch`
   - 如果失败，尝试：`git apply --cached .git/partial_commit.patch`（允许上下文行）

   e. **提交并清理**：
   - 执行：`git commit -m "{message}"`
   - 清理临时文件：`rm .git/temp_commit.patch .git/partial_commit.patch`

   f. **验证**：
   - 使用 `git show HEAD` 确认提交内容正确
   - 使用 `git diff` 确认未提交的改动仍在工作区

   **情况C：同时处理多个文件的部分改动**

   合并多个文件的部分改动到一个patch（AI自动化操作）：

   a. **逐个文件生成diff并提取目标hunks**：
   - 对每个文件执行情况B的步骤a-c
   - 将每个文件的部分patch内容追加到同一个 `.git/combined_commit.patch` 文件

   b. **应用合并的patch**：
   - 执行：`git apply --cached --unidiff-zero .git/combined_commit.patch`
   - 如果失败，尝试调整参数或拆分应用

   c. **提交并清理**：
   - 执行：`git commit -m "{message}"`
   - 清理所有临时patch文件

4. **验证提交结果**：
   - 使用 `git show HEAD` 查看刚才的提交内容
   - 确认提交的改动与预期完全一致
   - 使用 `git status` 确认工作区状态，未暂存的改动应该还保留在工作区

**2.4 工作区检查**

提交完功能改动后，检查工作区状态：

- 如果工作区已干净（除了可能的版本号文件），继续下一步
- 如果仍有未提交的功能文件，提示用户确认是否继续

### 3. 测试验证与质量检查

**3.1 TypeScript 类型检查**

- 执行类型检查命令：`bun run type-check`（在项目根目录）或 `npx tsgo --incremental --noEmit`（在packages/react-type-doc目录）
- **强制要求**：类型检查必须100%通过，不允许有任何类型错误
- **重要说明**：此检查必须在构建前完成，因为类型错误会导致构建失败或产生不可预期的问题
- 如果发现类型错误：
  - **立即终止发布流程**
  - 清晰列出所有类型错误的文件、行号及错误信息
  - 修复所有类型错误
  - 修复完成后，必须重新从步骤1开始执行发布流程
- **输出格式**：

```
TypeScript 类型检查结果：
- 错误数：0 ✓
状态：✓ 类型检查通过，可以继续
```

**3.2 运行完整测试套件并验证通过率**

- 进入包目录：`cd packages/react-type-doc`
- 执行完整测试命令：`bun test` 或 `bun run test`
- **强制要求**：所有测试必须100%通过，不允许有任何失败或错误的测试用例
- 如果发现测试失败：
  - **立即终止发布流程**
  - 清晰列出失败的测试用例名称及错误信息
  - 分析失败原因（代码问题、测试用例问题、环境问题等）
  - 修复所有失败的测试
  - 修复完成后，必须重新从步骤1开始执行发布流程
- **输出格式**：

```
测试执行结果：
- 总测试数：X
- 通过：X
- 失败：0 ✓
- 跳过：X（如有）
状态：✓ 所有测试通过，可以继续
```

**3.3 运行测试覆盖率分析**

- 执行测试覆盖率命令：`bun run test:coverage`
- 等待测试运行完成，获取覆盖率报告

**3.4 分析本次改动的测试覆盖情况**

- 识别步骤2中已提交的所有功能改动文件
- 在覆盖率报告中查找这些文件的覆盖率数据
- 重点关注以下指标：
  - 语句覆盖率（Statement Coverage）
  - 分支覆盖率（Branch Coverage）
  - 函数覆盖率（Function Coverage）
  - 行覆盖率（Line Coverage）

**3.5 识别测试缺失的代码**

对于每个改动文件，检查：

- 覆盖率是否达标（建议：核心解析逻辑≥80%，工具函数≥70%）
- 新增的函数/方法是否有测试用例
- 修复的bug是否有回归测试
- 边界情况和异常处理是否有测试覆盖

**输出格式**：

```
文件：src/core/typeParser.ts
- 当前覆盖率：85%（达标）
- 缺失测试的函数：无
- 未覆盖的分支：无

或

文件：src/runtime/reader.ts
- 当前覆盖率：45%（不达标）
- 缺失测试的函数：
  - resolveComplexType (第125-140行)
  - validateTypeRef (第150-165行)
- 未覆盖的分支：
  - 错误处理分支（第130行）
```

**3.6 补充测试用例**

如果存在测试覆盖不足的情况：

1. **向用户说明情况**：
   - 明确列出哪些文件/函数缺少测试
   - 解释为什么需要测试（如核心解析逻辑、容易出错的地方等）

2. **协助编写测试用例**：
   - 分析待测试代码的功能和逻辑
   - 设计测试场景（正常流程、边界情况、异常情况）
   - 编写测试代码，遵循项目的测试规范（使用vitest）
   - 确保测试用例清晰、可维护

3. **提交测试代码**：
   - 将测试文件添加到暂存区
   - 使用commit message格式：`test: 添加{模块名}的测试用例`
   - 执行提交：`git add {测试文件路径}`
   - 执行：`git commit -m "test: 添加{具体功能}的测试用例"`

4. **验证测试覆盖率**：
   - 重新运行测试覆盖率命令
   - 确认覆盖率是否达标
   - 如果仍有不足，重复步骤2-4

**3.7 特殊情况处理**

- **CLI命令或配置文件改动**：可以适当放宽覆盖率要求，但核心逻辑仍需测试
- **文档或类型定义文件改动**：无需测试，但仍需执行步骤 3.1 和 3.2 以确认现有测试不受影响
- **测试框架或测试工具本身的改动**：需要特别谨慎，确保不影响现有测试的正确性
- **紧急修复**：如果是紧急线上问题修复，可以先发布，但必须在后续版本补充测试

**3.8 完成检查（必须输出）**

在进入步骤 4 之前，必须输出以下检查清单，确认每项都已完成：

```
步骤 3 检查清单：
- [x] 3.1 TypeScript 类型检查完成，错误数：0
- [x] 3.2 测试套件执行完成，结果：X passed / 0 failed / X skipped
- [x] 3.3 测试覆盖率分析完成，整体覆盖率：X%
- [x] 3.4 本次改动文件覆盖情况已分析
- [x] 3.5 测试缺失代码已识别（或：无缺失）
- [x] 3.6 测试用例已补充（或：无需补充）
- [x] 3.7 特殊情况已处理（或：无特殊情况）
✓ 步骤 3 完成，可以进入步骤 4
```

**如果上述任何一项未完成，禁止进入步骤 4。**

### 4. 版本更新确认与分析

**4.1 分析上次版本tag以来的commit历史**

- 获取当前版本号：从 `packages/react-type-doc/package.json` 中读取当前版本
- 查找上一个版本tag：执行 `git tag -l "v*" --sort=-v:refname | head -1`
- 分析commit历史：执行 `git log <上次版本tag>..HEAD --oneline`（如果是首次发布或找不到tag，则使用 `git log --oneline`）
- 提取所有commit message的类型前缀

**4.2 根据commit内容推荐版本更新级别**

根据**语义化版本规范（Semantic Versioning）**分析commit内容：

**版本更新判断规则**：

- **major（主版本）**：如果存在以下情况，建议更新主版本号
  - commit message包含 `BREAKING CHANGE` 或 `!`（如 `feat!:`, `fix!:`）
  - 重大架构调整或API变更
  - 不兼容的功能修改

- **minor（次版本）**：如果存在以下情况且无major级别变更，建议更新次版本号
  - commit message包含 `feat:` 前缀（新增功能）
  - 新增用户可见的功能特性
  - 向后兼容的功能增强

- **patch（修订版本）**：如果仅存在以下情况，建议更新修订版本号
  - commit message包含 `fix:` 前缀（问题修复）
  - commit message包含 `perf:` 前缀（性能优化）
  - 向后兼容的bug修复

- **无需更新版本**：如果commit仅包含以下类型
  - `docs:` 纯文档更新
  - `style:` 代码格式调整（不影响功能）
  - `test:` 测试相关
  - `chore:` 构建配置、依赖更新等（不包括release提交）

**4.3 向用户展示分析结果并确认**

- 列出自上次版本以来的所有commit（用列表形式展示）
- 标注每个commit的类型和重要程度
- **明确给出版本更新建议**：
  - 格式：`根据commit分析，建议更新版本号级别：[major/minor/patch/无需更新]`
  - 说明理由：列举关键的commit类型和数量
  - 示例：`建议：minor（次版本） - 检测到2个feat类型commit，新增了条件类型解析和映射类型支持功能`
- 询问用户确认：
  - **接受建议**：按推荐的版本级别更新
  - **自定义**：用户指定版本级别（major/minor/patch）
  - **不更新版本**：跳过版本相关步骤，直接进入构建流程
- 在得到用户明确的回答之后再执行后续步骤

**4.4 特殊情况处理**

- 如果无法确定版本更新级别（如commit message不规范），明确提示用户并提供commit列表供手动判断
- 如果检测到混合类型的commit（如既有feat又有BREAKING CHANGE），按最高级别推荐
- 如果没有新的commit（仅步骤2提交的内容），基于步骤2的提交进行分析

### 5. 更新版本号（如需要）

更新以下文件中的版本号：

- `packages/react-type-doc/package.json` 中的 `version` 字段
- 版本号格式：`major.minor.patch`（如 `1.2.3`）
- **注意**：README.md 中的 npm 版本 badge 使用 shields.io 动态 API（`img.shields.io/npm/v/react-type-doc.svg`），会自动从 npm registry 获取最新版本号，无需手动更新

### 6. 更新CHANGELOG

**6.1 更新CHANGELOG.md**

如果 `CHANGELOG.md` 文件尚不存在（首次发布），先在项目根目录创建该文件，添加标题 `# Changelog`。

在 `CHANGELOG.md` 文件顶部添加新版本的更新记录：

- 格式遵循 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) 规范：

```markdown
## [x.x.x] - YYYY-MM-DD

### Added
- 新增功能描述

### Fixed
- 修复问题描述

### Changed
- 变更描述

### Deprecated
- 废弃功能说明

### Removed
- 移除功能说明

### Security
- 安全问题修复
```

**6.2 根据commit历史填充内容**

- 将步骤2提交的commit按类型归类到对应章节：
  - `feat:` → Added
  - `fix:` → Fixed
  - `refactor:`、`perf:` → Changed
  - 移除功能的commit → Removed
  - 安全相关修复 → Security
- 使用用户友好的语言描述，而非直接复制commit message
- 突出核心改动，省略不重要的技术细节

**6.3 添加版本链接（可选）**

在文件末尾添加版本对比链接：

```markdown
[x.x.x]: https://github.com/hei-f/react-type-doc/compare/v上个版本...vx.x.x
```

### 7. 检查README文档更新

根据本次提交的改动内容，判断是否需要更新README文档：

- **需要更新的情况**：
  - 新增功能或移除功能
  - 修改了用户使用方式或配置方法
  - 更改了安装步骤或依赖要求
  - 修复了影响用户体验的重要问题
  - 更新了API或接口
  - 新增或修改了运行时API
- **检查要点**：
  - 功能介绍是否需要补充或修改
  - 使用说明是否需要更新
  - API文档是否需要更新
  - 示例代码是否需要更换
- **操作**：
  - 向用户确认是否需要更新README
  - 如需要，帮助用户修改README
  - 等待用户完成对README修改的确认后继续后续流程
  - 注：README更新会在步骤9中作为独立的 `docs:` 类型提交

### 8. 构建包

**8.1 执行构建命令**

- 进入包目录：`cd packages/react-type-doc`
- 执行构建命令：`bun run build`
- 该命令使用tsup构建，会生成：
  - ESM格式：`dist/index.js`、`dist/runtime-entry.js`、`dist/cli.js`
  - CJS格式：`dist/index.cjs`、`dist/runtime-entry.cjs`
  - 类型定义：`dist/index.d.ts`、`dist/runtime-entry.d.ts`等
  - SourceMap文件：`*.js.map`、`*.cjs.map`
- 构建失败则终止流程，提示用户检查错误

**8.2 验证构建产物**

检查 `packages/react-type-doc/dist` 目录下的产物是否完整：

- **主入口**：
  - `index.js` (ESM)
  - `index.cjs` (CommonJS)
  - `index.d.ts` (类型定义)
  - `index.d.cts` (CommonJS类型定义)
  
- **运行时入口**：
  - `runtime-entry.js` (ESM)
  - `runtime-entry.cjs` (CommonJS)
  - `runtime-entry.d.ts` (类型定义)
  - `runtime-entry.d.cts` (CommonJS类型定义)

- **UI组件入口**：
  - `ui-entry.js` (ESM)
  - `ui-entry.cjs` (CommonJS)
  - `ui-entry.d.ts` (类型定义)
  - `ui-entry.d.cts` (CommonJS类型定义)
  
- **CLI入口**：
  - `cli.js` (带shebang的可执行文件)

- **SourceMap文件**（可选）：
  - `*.js.map`
  - `*.cjs.map`

- 检查关键文件大小是否合理（不应为0字节或异常大）
- 如果产物不完整或异常，终止流程并排查构建配置

**输出格式**：

```
构建产物验证：
✓ 主入口文件完整 (index.js, index.cjs, index.d.ts, index.d.cts)
✓ 运行时入口完整 (runtime-entry.js, runtime-entry.cjs, runtime-entry.d.ts, runtime-entry.d.cts)
✓ UI组件入口完整 (ui-entry.js, ui-entry.cjs, ui-entry.d.ts, ui-entry.d.cts)
✓ CLI入口完整 (cli.js)
✓ 文件大小正常
状态：✓ 构建产物验证通过，可以继续
```

### 9. 提交版本号和文档改动

返回项目根目录：`cd ../..`（如果在packages/react-type-doc目录）

**9.1 提交版本号更新（如有版本更新）**

```bash
git add packages/react-type-doc/package.json README.md
git commit -m "chore: release v{版本号}"
```

**9.2 提交CHANGELOG更新（如有CHANGELOG改动）**

```bash
git add CHANGELOG.md
git commit -m "docs: 更新CHANGELOG v{版本号}"
```

**9.3 提交README更新（如有README改动但不是版本号）**

```bash
git add README.md
git commit -m "docs: 更新README文档"
```

### 10. 发布到npm

**10.1 进入包目录**

```bash
cd packages/react-type-doc
```

**10.2 执行发布命令**

```bash
npm publish --access public
```

- `prepublishOnly` 钩子会自动执行 `pnpm run build` 进行构建
- 发布到npm registry（public access，因为是公开包）
- 如果发布失败，检查：
  - npm登录状态（`npm whoami`）
  - 版本号是否已存在（`npm view react-type-doc versions`）
  - 网络连接
  - package.json中的name和version字段是否正确

**10.3 验证发布成功**

- 访问npm包页面：`https://www.npmjs.com/package/react-type-doc`
- 确认新版本已显示
- 检查包的files、main、module、types等字段是否正确

### 11. 推送到远程并创建Tag

返回项目根目录：`cd ../..`

**11.1 推送commits**

```bash
git push
```

**11.2 创建并推送Tag（仅版本更新时）**

- Tag命名格式：`v{版本号}`（如 `v1.2.3`）
- 创建tag：`git tag v{版本号}`
- 为tag添加注释（可选）：`git tag -a v{版本号} -m "Release v{版本号}"`
- 推送tag：`git push origin v{版本号}`

### 12. 生成GitHub Release内容（仅版本更新时）

生成适用于GitHub Release的内容：

- **Title格式**：`v{版本号}`

- **Description要求**：
  - 使用Markdown格式
  - 简洁明了，只概括核心改动点
  - 使用列表形式，每项一行
  - 分类展示（如：新增功能、问题修复、性能优化等）
  - 避免冗余描述和技术细节
  - 可以直接从CHANGELOG中提取内容

**示例格式**：

```markdown
## ✨ 新增功能

- 支持条件类型解析
- 新增映射类型支持
- 添加CLI命令行参数验证

## 🐛 问题修复

- 修复循环引用检测误报问题
- 修复泛型类型参数丢失问题

## 📚 文档

- 更新API使用文档
- 添加更多示例代码

## 📦 安装

\`\`\`bash
npm install react-type-doc@{版本号}
\`\`\`

## 🔗 链接

- [完整更新日志](https://github.com/hei-f/react-type-doc/blob/main/CHANGELOG.md)
- [文档](https://github.com/hei-f/react-type-doc#readme)
```

### 13. 发布总结

向用户展示：

- 本次发布的版本号（如有）
- npm包地址：`https://www.npmjs.com/package/react-type-doc`
- 改动摘要（基于commit和CHANGELOG）
- 安装命令：`npm install react-type-doc@{版本号}`
- 下一步操作建议：
  - 在GitHub上创建Release（使用步骤12生成的内容）
  - 更新相关文档站点（如有）
  - 通知用户或团队新版本发布

**输出格式**：

```
🎉 发布完成！

📦 包信息：
- 包名：react-type-doc
- 版本：v{版本号}
- npm地址：https://www.npmjs.com/package/react-type-doc

📝 改动摘要：
[列出主要改动]

💻 安装命令：
npm install react-type-doc@{版本号}

✅ 下一步操作：
1. 在GitHub创建Release: https://github.com/hei-f/react-type-doc/releases/new?tag=v{版本号}
2. 复制步骤12生成的Release内容
3. 发布Release

✓ 步骤 13 完成，发布流程结束
```

## 错误处理

任何步骤失败时：

1. **立即停止后续流程**
2. **清晰告知失败的步骤和原因**
3. **提供可能的解决建议**：
   - TypeScript错误：检查类型定义，运行 `bun run type-check` 定位问题
   - 测试失败：运行 `bun test` 查看详细错误，检查测试用例
   - 构建失败：检查tsup配置，查看构建日志
   - npm发布失败：检查登录状态、版本号、网络连接
   - git推送失败：检查远程仓库权限、分支保护规则
4. **等待用户处理后再继续**
5. **如果是关键步骤失败（类型检查、测试、构建），必须重新从步骤1开始执行发布流程**

## 常见问题

**Q: 如何回滚已发布的版本？**

A: npm不支持删除已发布的版本，但可以：
- 使用 `npm deprecate react-type-doc@版本号 "原因说明"` 标记为废弃
- 发布新的修复版本

**Q: 如何发布beta或rc版本？**

A: 使用带标签的版本号：
- 版本号格式：`1.2.3-beta.0`、`1.2.3-rc.1`
- 发布命令：`npm publish --tag beta`（而不是latest）
- 用户安装：`npm install react-type-doc@beta`

**Q: monorepo中如何只构建react-type-doc包？**

A: 在项目根目录运行 `bun run build`，它会自动只构建react-type-doc包（配置在根package.json的scripts中）

**Q: 如何验证发布的包内容？**

A: 在发布前，可以使用：
- `npm pack`：生成tarball文件，检查打包内容
- `npm publish --dry-run`：模拟发布，不实际上传

## 附录

**项目结构**：

```
react-type-doc/
├── packages/
│   ├── react-type-doc/          # 主包（发布到npm）
│   │   ├── src/
│   │   ├── dist/                # 构建产物
│   │   ├── package.json
│   │   └── tsup.config.ts
│   └── example/                 # 示例项目（不发布）
├── CHANGELOG.md                 # 版本更新日志
├── README.md                    # 项目说明文档
└── package.json                 # monorepo根配置
```

**关键命令速查**：

```bash
# 类型检查
bun run type-check

# 运行测试
cd packages/react-type-doc && bun test

# 测试覆盖率
cd packages/react-type-doc && bun run test:coverage

# 构建
bun run build

# 发布
cd packages/react-type-doc && npm publish --access public

# 查看当前版本
npm view react-type-doc version

# 查看所有版本
npm view react-type-doc versions
```

