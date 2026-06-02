# Universal AI Harness Framework 使用指南

[English](./GUIDELINES.md)

面向在目标项目中日常使用 harness 的技术负责人和开发者。涵盖安装、任务工作流、gate、skills 和实用提示词。

底层设计见 [docs/DESIGN.zh-CN.md](./DESIGN.zh-CN.md)。

## 1. 快速开始

```powershell
# 预览安装计划
harness init --dry-run

# 交互式安装
harness init

# 推荐：安装时带上 OpenCode 脚手架
harness init --dry-run --with-opencode
harness init --with-opencode
```

安装后先做这些事：

1. 运行 `workspace-knowledge-manager init`，创建第一版项目知识文档。
2. 根据实际项目调整 `harness.config.yaml`、rules 和 `docs/project/knowledge-map.md`。
3. 在 `AGENTS.md` 的 `project-local` 块中填入团队特有规则。
4. 如果安装了 OpenCode，通过 `.harness/model-profiles.yml` 调整 agent 模型。

## 2. 初始化后得到什么

核心文件：
- `AGENTS.md` — 仓库入口行为
- `harness.config.yaml` — 项目配置
- `docs/project/harness-workflow.md` — 任务状态契约
- `docs/project/knowledge-map.md` — 知识路由
- `.aiassistant/rules/*.md` — 可执行约束
- `.agents/skills/*/SKILL.md` — 工作流 skills
- `.task/` — 任务工件（本地，不受管）
- `.harness/manifest.json` — 框架 ownership 追踪

默认安全行为：
- 已有项目本地文件被保留。
- `AGENTS.md` 只更新 managed block。
- 后续框架升级由 manifest 判断哪些内容可安全更新。

交互式 `harness init` 中，CLI 对每个已存在文件询问是备份、覆盖还是跳过。用 `--auto` 跳过所有已存在文件；搭配 `--force` 覆盖它们。

## 3. 工作模型

Harness 是受控序列，不是自由连续编码。

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

并非每个任务都需要全部步骤。Harness 按 tier 裁剪流程。

## 4. 三层任务 Tier

### Tier S — 平凡，低风险

范围明确的小改动。例如：拼写修复、注释更新、单文件配置调整。

流程：`coding -> boundary-reviewer`

```text
这是一个 Tier S 改动。

任务：<描述>

要求：
- 只修改相关文件。
- 不扩展范围。
- 保持现有风格。
- 完成后总结验证情况。
```

### Tier M — 标准范围工作

需要先分析再安全编码的工作。例如：涉及少量文件的功能、需要调用链检查的 bugfix、边界清晰的重构。

流程：`task-intake -> module/workflow-inspector（按需）-> context-pack-builder -> coding -> boundary-reviewer`

最低要求：编码前创建 `.task/<task-id>/context-pack.md`。

```text
我要处理一个标准任务：

<任务描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
编码前创建 .task/<task-id>/context-pack.md。
不要直接编码。
```

### Tier L — 复杂或边界敏感工作

需求不清、跨模块改动、公共契约变更、高风险重构或分阶段交付。

流程：完整 `task-intake` 至 `workspace-knowledge-manager review`

最低要求：只能基于已批准 slice 编码。

```text
我要处理一个复杂任务：

<任务描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
如需求或边界不清，使用 requirement-freezer。
编码前生成 implementation plan 和 .task/<task-id>/context-pack.md。
不要直接编码。
```

## 5. Gate 机制

对非平凡任务，gate 是强制的。Agent 必须停在：
- analysis 结束后，进入 coding 前
- 每个已批准 slice 或已批准并行 group 完成后

Agent 只能在同一已批准 slice 内从 coding 直接流转到 review。不得自动进入下一 slice。

推荐 gate 报告：

```text
Phase:
Completed Work:
Files Created or Changed:
Validation Status:
Recommended Next Step:
User confirmation required to continue.
```

## 6. 核心 Skills

| Skill | 何时使用 | 产出 |
| --- | --- | --- |
| `task-intake` | 非平凡任务的默认入口 | 分类、下一步 |
| `requirement-freezer` | 需求或边界不清 | `.task/<task-id>/requirement.md` |
| `module-inspector` | 理解模块、包或边界 | — |
| `workflow-inspector` | 理解执行流程或编排 | — |
| `implementation-slicer` | 拆分复杂工作为小切片 | `.task/<task-id>/implementation-plan.md` |
| `context-pack-builder` | 编码前构建最小工作上下文 | `.task/<task-id>/context-pack.md` |
| `boundary-reviewer` | 同一切片实现后立即审查 | `PASS`、`PASS_WITH_WARNINGS` 或 `BLOCKED` |
| `workspace-knowledge-manager` | 创建或维护设计文档和知识 | — |

## 7. 核心任务工件

| 工件 | 路径 | 何时 |
| --- | --- | --- |
| Requirement | `.task/<task-id>/requirement.md` | Tier L 或模糊工作 |
| Implementation Plan | `.task/<task-id>/implementation-plan.md` | Tier L 切片工作 |
| Context Pack | `.task/<task-id>/context-pack.md` | Tier M 或 L，编码前 |

实现计划中每个 slice 定义：goal、allowed scope、forbidden scope、validation 和 done criteria。

## 8. 实用提示词

### 新功能

```text
我想开发一个新功能：

<需求描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
不要直接编码。
```

### Bugfix

```text
我需要修一个 bug：

Observed：<实际行为>
Expected：<预期行为>
Reproduction：<复现步骤>
Evidence：<日志、失败测试、截图或其他证据>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
优先确认复现路径或失败测试。
编码前创建 .task/<task-id>/context-pack.md。
不要直接编码。
```

### 重构

```text
我需要做一次重构：

Goal：<重构目标>
Behavior that must stay unchanged：<不变约束>
Allowed modification scope：<允许范围>
Forbidden modification scope：<禁止范围>

请按照当前仓库的 harness workflow 推进。
先分析边界和流程影响。
不要直接编码。
```

## 9. 文档与规则

保持分工：
- **Docs** 解释设计含义。
- **Rules** 约束行为。

文档捕捉职责、工作流、领域概念、边界和风险区域。文档不应退化成代码索引。

当 docs 或 rules 新增、移动、重命名或删除时，更新 `docs/project/knowledge-map.md`。

## 10. 可选 OpenCode

OpenCode 是可选的，但推荐用于更高效的重复 harness 执行。它提供 builder-first 的 slash commands、各角色独立绑定的本地 agent 角色和 validator 脚手架。

详见 [docs/OPENCODE.zh-CN.md](./OPENCODE.zh-CN.md)。

## 11. 升级与同步

```powershell
# 应用前预览变更
harness diff

# 应用安全更新
harness sync
harness sync --dry-run
```

本地任务工件、docs、rules 和 skills 默认保留。`AGENTS.md` 只更新 managed block。本地修改和冲突会被报告，不会被静默覆盖。
