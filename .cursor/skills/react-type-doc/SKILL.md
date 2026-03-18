---
name: react-type-doc
description: Guide for using the react-type-doc library to generate and display TypeScript type documentation for React components. Use when configuring type doc generation, integrating TypeDocPanel UI component, using PropsDocReader runtime API, customizing type rendering, or when the user mentions react-type-doc, type documentation, props documentation, or TypeInfo.
---

# react-type-doc

TypeScript 类型文档生成器，专为运行时类型展示设计。将 `Partial<Omit<User, 'id'>>` 这样的类型表达式展开为具体的属性列表，支持循环引用检测、类型去重和交互式 UI 展示。

## 快速上手

```bash
npm install react-type-doc   # 或 pnpm add / yarn add
npx react-type-doc init      # 生成 reactTypeDoc.config.ts
npx react-type-doc            # 生成类型文档 JSON
```

## 导入路径

| 路径 | 内容 | 适用场景 |
|------|------|----------|
| `react-type-doc` | 运行时 API + 类型 + `defineConfig` | 配置文件、运行时使用 |
| `react-type-doc/runtime` | 运行时 API（不含 ts-morph） | 前端 bundle |
| `react-type-doc/ui` | TypeDocPanel + locale | UI 展示（需 react + styled-components） |

## 模块指南

根据任务场景，阅读对应的详细指南：

| 场景 | 文档 | 说明 |
|------|------|------|
| 配置 `reactTypeDoc.config.ts` | [config.md](config.md) | registry/scanDirs 注册模式、ParseOptions、输出优化 |
| 使用运行时 API 自定义渲染 | [runtime-api.md](runtime-api.md) | PropsDocReader 方法、TypeRenderInfo 渲染决策 |
| 集成内置 UI 组件 | [ui-component.md](ui-component.md) | TypeDocPanel 用法、locale 自定义 |
| 查阅完整类型定义 | [reference.md](reference.md) | TypeInfo/TypeRef、TypeCategory/RenderHint 枚举 |

## AI 交互协议

### 工作流程

当用户提出 react-type-doc 相关任务时，遵循以下流程：

1. **渐进式读取文档**：根据任务类型，优先读取"模块指南"中对应的详细文档（config.md、runtime-api.md 等）
2. **理解需求**：基于文档内容和用户描述，理解配置选项、实现方案和库的推荐做法
3. **识别不确定性**：只有当存在多种合理方案且无法从上下文判断用户意图时，才进行提问
4. **提供方案或实施**：基于理解给出建议或直接实施

### 何时使用 AskQuestion 工具

只在以下情况下调用 AskQuestion：

**情况 1：配置方案选择存在歧义**
- 特征：用户说"配置 react-type-doc"但未明确说明项目结构或偏好
- 不确定点：无法从上下文判断项目适合自动扫描（scanDirs）还是手动注册（registry）
- 示例问题："你的项目目录结构是否规范？（规范结构适合自动扫描，复杂结构适合手动注册）"

**情况 2：优化目标不明确**
- 特征：用户说"优化配置"但未说明优化方向
- 不确定点：优化目标（减小输出文件 vs 保持完整类型信息 vs 加快解析速度）直接影响配置策略
- 示例问题："主要优化目标是什么？（减小输出文件 / 加快解析速度 / 保持完整信息）"

**情况 3：用户主动表达不确定**
- 特征：用户询问"应该用哪个""有什么区别""怎么选择""推荐什么"
- 行动：根据具体问题提供 2-4 个选项，标记推荐选项

### 不应提问的情况

- 文档中已明确说明默认值或推荐配置的项目
- 用户已在描述中提供足够上下文（如"我的组件都在 src/components 下"）
- 库已有明确最佳实践的场景（如规范项目优先用 scanDirs）

### AskQuestion 模板参考

#### 模板 1：配置方案选择
```typescript
AskQuestion({
  title: "选择配置方式",
  questions: [{
    id: "org_mode",
    prompt: "选择类型文档的组织方式",
    options: [
      { id: "scanDirs", label: "自动扫描目录（推荐）- 适合规范的目录结构" },
      { id: "registry", label: "手动注册 - 适合复杂或非标准结构" },
      { id: "mixed", label: "混合模式 - 大部分自动扫描 + 特殊情况手动注册" }
    ]
  }]
})
```

#### 模板 2：优化目标
```typescript
AskQuestion({
  title: "优化配置",
  questions: [{
    id: "goal",
    prompt: "主要优化目标是什么？",
    options: [
      { id: "size", label: "减小输出文件大小（适合前端 bundle）" },
      { id: "speed", label: "加快解析速度（降低 maxDepth）" },
      { id: "complete", label: "保持完整类型信息（当前默认）" }
    ]
  }]
})
```

## 输出 JSON 结构概览

```json
{
  "generatedAt": "2026-01-08T15:00:00.000Z",
  "keys": {
    "Button": { "$ref": "ButtonProps" }
  },
  "typeRegistry": {
    "ButtonProps": {
      "kind": "object",
      "text": "ButtonProps",
      "properties": { "size": { "kind": "union", "text": "\"sm\" | \"lg\"" } }
    }
  }
}
```

- `keys` — 顶层映射，value 为 `TypeInfo`（完整定义）或 `TypeRef`（`{ $ref: string }`）
- `typeRegistry` — 去重的类型定义池，被 `$ref` 引用
- `TypeRef` 可携带位置相关的 `description` 和 `required`，优先于被引用类型的值
