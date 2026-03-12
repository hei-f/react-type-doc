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
