# Universal AI Harness Framework 使用指南

[English](./GUIDELINES.md)

本文档面向已经或准备在目标项目中使用 harness 的团队与开发者，重点讲如何把这套 workflow 用起来，而不是解释框架内部实现。

## 1. 谁应该读这份文档

- 通过 `harness init` 接入项目的团队
- 用 agent 处理功能、缺陷、重构和文档任务的开发者

如果你维护的是 framework 本身，还应阅读 [DESIGN.zh-CN.md](./DESIGN.zh-CN.md)。

## 2. 快速开始

初始化目标项目：

```powershell
harness init --dry-run
harness init
```

推荐使用带 OpenCode 脚手架的初始化方式：

```powershell
harness init --dry-run --with-opencode
harness init --with-opencode
```

初始化完成后，优先做三件事：

1. 运行 `workspace-knowledge-manager init`，建立第一版项目知识。
2. 在 `AGENTS.md` 的 `project-local` 区域补充团队规则和默认值。
3. 根据项目实际情况调整 `harness.config.yaml`、rules 和 `docs/project/knowledge-map.md`。

## 3. 初始化后会得到什么

核心文件：

- `AGENTS.md`
- `harness.config.yaml`
- `docs/project/harness-workflow.md`
- `docs/project/knowledge-map.md`
- `.aiassistant/rules/*.md`
- `.agents/skills/*/SKILL.md`
- `.task/`
- `.harness/manifest.json`

默认行为：

- 已有 project-local 文件会被保留
- `AGENTS.md` 只更新 managed block
- `.task/` 是本地任务状态，不属于 managed file
- 后续升级由 manifest 判断哪些内容可以安全更新

## 4. 这套 Harness 应该怎么用

不要把 harness 当成“让 agent 一直写到结束”的自由编码模式。

正确方式是把它当成一条受控序列：

```text
task-intake
  -> requirement-freezer
  -> module-inspector / workflow-inspector
  -> implementation-slicer
  -> context-pack-builder
  -> coding
  -> boundary-reviewer
  -> workspace-knowledge-manager review
```

不是每个任务都要走全套。Harness 会按任务 tier 自动裁剪流程。

## 5. 三种任务 Tier

### 5.1 Tier S

适用于范围明确、风险很低、只涉及一个很小改动的任务。

例如：

- 拼写修复
- 注释或文案更新
- 单文件小配置修改
- 明显且低风险的局部修复

流程：

```text
coding -> boundary-reviewer
```

示例提示词：

```text
这是一个 Tier S 改动。

任务：
<描述>

要求：
- 只修改相关文件。
- 不扩展范围。
- 保持现有风格。
- 完成后总结验证情况。
```

### 5.2 Tier M

适用于范围清楚，但在安全编码前仍需要分析的标准任务。

例如：

- 影响少量文件的功能
- 需要先看调用链的 bugfix
- 边界清晰的重构
- 与行为变化有关的文档更新

流程：

```text
task-intake
  -> module-inspector / workflow-inspector（按需）
  -> context-pack-builder
  -> coding
  -> boundary-reviewer
```

最低要求：编码前生成 `.task/context-pack.md`。

示例提示词：

```text
我要处理一个标准任务：

<任务描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
编码前生成 .task/context-pack.md。
不要直接编码。
```

### 5.3 Tier L

适用于复杂任务或边界敏感任务。

例如：

- 需求或兼容性约束不清楚
- 跨模块改动
- 公共行为或契约变化
- 高风险重构
- 需要分阶段交付的任务

流程：

```text
task-intake
  -> requirement-freezer（按需）
  -> module-inspector / workflow-inspector
  -> implementation-slicer
  -> context-pack-builder
  -> coding by slice
  -> boundary-reviewer
  -> workspace-knowledge-manager review
```

最低要求：只能基于已批准的 slice 编码。

示例提示词：

```text
我要处理一个复杂任务：

<任务描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
如果需求或边界不清楚，使用 requirement-freezer。
编码前生成 implementation plan 和 .task/context-pack.md。
不要直接编码。
```

## 6. Gate 机制

对于非平凡任务，gate 是强制的。

Agent 必须停在以下节点：

- analysis 结束后，进入 coding 前
- 每个已批准 slice 或已批准并行 group 完成后

只有同一已批准 slice 或 group 内，coding 才能直接流转到 review。

它不能自动进入下一 slice。

推荐 gate 报告格式：

```text
Phase:
Completed Work:
Files Created or Changed:
Validation Status:
Recommended Next Step:
User confirmation required to continue.
```

## 7. 主要 Skills

### 7.1 `task-intake`

作为非平凡任务的默认入口。

它应完成：

- 判断任务类型
- 判断任务 tier
- 只问阻塞性问题
- 选择下一步 harness 动作

### 7.2 `requirement-freezer`

当预期行为、业务规则、兼容性或边界不清楚时使用。

输出：

```text
.task/<yyyy-MM-dd>/<task-slug>/requirement.md
```

### 7.3 `module-inspector`

当你需要理解模块、包、功能区或依赖边界时使用。

### 7.4 `workflow-inspector`

当你需要理解执行流程、异步行为、编排链路或集成流时使用。

### 7.5 `implementation-slicer`

把复杂且已确认的工作拆成可执行的小切片。

输出：

```text
.task/<yyyy-MM-dd>/<task-slug>/implementation-plan.md
```

### 7.6 `context-pack-builder`

编码前用于生成最小工作上下文。

输出：

```text
.task/context-pack.md
```

它应只保留当前 slice 或已批准 group 所需的上下文，而不是复制整份 docs 或源码。

### 7.7 `boundary-reviewer`

在同一已批准 slice 完成实现后立即执行。

最终结论只能是：

- `PASS`
- `PASS_WITH_WARNINGS`
- `BLOCKED`

### 7.8 `workspace-knowledge-manager`

用于创建或维护设计文档、规则路由和知识更新。

常用模式：

- `init`
- `refresh`
- `review`
- `topic`

## 8. 三类核心任务工件

### 8.1 Requirement Document

当任务需要冻结需求时使用。

路径：

```text
.task/<yyyy-MM-dd>/<task-slug>/requirement.md
```

### 8.2 Implementation Plan

当任务需要明确切片时使用。

路径：

```text
.task/<yyyy-MM-dd>/<task-slug>/implementation-plan.md
```

每个 slice 至少应定义：

- goal
- allowed scope
- forbidden scope
- validation
- done criteria

### 8.3 Context Pack

在非平凡实现任务进入编码前使用。

路径：

```text
.task/context-pack.md
```

它应包括：

- task goal
- requirement 和 plan 来源
- 已读取 docs 和 rules
- allowed / forbidden scope
- 当前已批准 slice 或 group
- validation commands
- assumptions
- stop conditions

## 9. 实战示例

### 9.1 新功能

```text
我想开发一个新功能：

<需求描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
不要直接编码。
```

### 9.2 Bugfix

```text
我需要修一个 bug：

Observed:
<实际行为>

Expected:
<预期行为>

Reproduction:
<复现步骤>

Evidence:
<日志、失败测试、截图或其他证据>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
优先确认复现路径或失败测试。
编码前生成 .task/context-pack.md。
不要直接编码。
```

### 9.3 重构

```text
我需要做一次重构：

Goal:
<重构目标>

Behavior that must stay unchanged:
<不变约束>

Allowed modification scope:
<允许范围>

Forbidden modification scope:
<禁止范围>

请按照当前仓库的 harness workflow 推进。
先分析边界和流程影响。
不要直接编码。
```

## 10. 文档与规则

始终保持分工清晰：

- docs 解释设计含义
- rules 约束行为边界

文档应沉淀：

- 职责
- 工作流
- 领域概念
- 边界
- 风险区域

文档不应退化成代码索引。

当 docs 或 rules 被新增、移动、重命名或删除时，要同步更新 `docs/project/knowledge-map.md`。

## 11. 可选 OpenCode

OpenCode 是可选的，但如果团队希望更高效地重复执行 harness flow，建议启用。

典型收益：

- `/harness-feature`、`/harness-bugfix` 这类可复用 slash commands
- 本地 builder、coder、reviewer、validator agent 角色
- 项目级 validator guidance 和带调度感知的脚手架

应把 `.opencode/` 当作可编辑的本地脚手架，而不是锁死的系统。

详见 [OPENCODE.zh-CN.md](./OPENCODE.zh-CN.md)。

## 12. 升级与同步

预览 framework-managed 变更：

```powershell
harness diff
```

应用安全更新：

```powershell
harness sync
harness sync --dry-run
```

注意：

- 本地 task 工件会保持本地化
- 本地 docs、rules 和 skills 默认保留
- `AGENTS.md` 只更新 managed block
- 本地修改和冲突会被报告，而不是被静默覆盖

## 13. 验证

维护本 framework 时运行：

```powershell
npm run smoke
```
