# 通用 AI Harness 框架 (Universal AI Harness Framework)

用于项目级 Agent 工作流、设计知识、规则、任务上下文和评审闸口的复用 AI Harness 框架。

## 目的

本仓库是安装到其他项目的 Harness 资产的上游源。

它提供：

- `AGENTS.md` 目标项目模板
- 轻量级 Harness 工作流
- 项目中立的规则
- 核心 Agent 技能 (Skills)
- 用于设计和架构文档的 `workspace-knowledge-manager`
- 用于 `init`、`sync` 和 `diff` 的 `harness` CLI

## 核心概念

- **设计哲学 (Design Philosophy):** 为什么我们使用基于文件的 Harness 以及它如何改善 AI 协作。参见 [docs/DESIGN.zh-CN.md](./docs/DESIGN.zh-CN.md) | [English](./docs/DESIGN.md)。
- **使用指南 (Usage Guidelines):** 项目初始化、任务管理和维护的最佳实践。参见 [docs/GUIDELINES.zh-CN.md](./docs/GUIDELINES.zh-CN.md) | [English](./docs/GUIDELINES.md)。

## 本地开发安装

在本仓库中：

```powershell
npm link
```

然后在任何目标项目中：

```powershell
harness init
```

如果不进行 link，可以直接运行：

```powershell
node E:\AI_WORK\universal-ai-harness-framework\bin\harness.js init --project .
```

## 命令

预览或安装 Harness 文件：

```powershell
harness init --dry-run
harness init
```

预览框架管理的更改：

```powershell
harness diff
```

升级框架管理的文件：

```powershell
harness sync
```

## 目标项目使用

Harness 为任务提供了结构化的生命周期。典型的交互序列：

1.  **初始化知识库：**
    ```text
    使用 workspace-knowledge-manager init 探索项目并建立初始设计文档和规则。
    ```
2.  **开始任务：**
    ```text
    分析此任务并执行 task-intake。
    ```
3.  **规划 (Tier M/L)：** 在 Agent 的引导下使用 `requirement-freezer`、`implementation-slicer` 和 `context-pack-builder`。
4.  **执行：** Agent 按切片实现代码，并在每个**闸口 (Gate)** 停止以待确认。
5.  **评审与同步：**
    ```text
    使用 boundary-reviewer 检查我的更改，然后使用 workspace-knowledge-manager review 同步文档。
    ```

## 知识库策略 (Knowledge Policy)

本框架生成的文档旨在解释软件设计和架构：

- 职责 (Responsibilities)
- 功能行为 (Functional behavior)
- 工作流 (Workflows)
- 领域概念 (Domain concepts)
- 扩展点 (Extension points)
- 风险边界 (Risk boundaries)
- 设计约束 (Design constraints)

文档**绝不能**变成源代码索引。请使用 IDE 工具、MCP 工具、本地搜索或直接检查源代码进行代码导航。

## 框架管理 vs 项目本地内容

框架管理的内容可以通过 `harness sync` 进行更新。

管理文件的所有权记录在 `.harness/manifest.json` 中，包括框架版本、安装时间戳、管理的文件路径、源资产、内容类型和 SHA-256 哈希值。

默认情况下必须保留项目本地内容：

- 项目特定的文档 (docs)
- 项目特定的规则 (rules)
- 项目特定的技能 (skills)
- `.task/` 目录
- `AGENTS.md` 中的本地部分 (local sections)

`harness diff` 可以在不写入文件的情况下预览管理的更改。`harness sync` 会更新未更改或丢失的管理文件，创建新增的管理文件，并报告本地修改或冲突，而不会在默认情况下覆盖它们。

## 验证

运行：

```powershell
npm run smoke
```
