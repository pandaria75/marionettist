# Marionettist 使用指南

[English](./GUIDELINES.md)

本指南是面向采用 Marionettist 的团队的长期参考页。

建议先阅读更短的 onboarding 页面：

- 在 [README.zh-CN.md](../README.zh-CN.md) 了解项目概览
- 在 [docs/user-guide/quick-start.zh-CN.md](./user-guide/quick-start.zh-CN.md) 走最短安装路径
- 在 [docs/philosophy.zh-CN.md](./philosophy.zh-CN.md) 理解适合初学者的工作流理念
- 只有在团队需要可选 OpenCode 集成时，再看 [docs/OPENCODE.zh-CN.md](./OPENCODE.zh-CN.md)

更深入的设计理由见 [docs/DESIGN.zh-CN.md](./DESIGN.zh-CN.md)。

导航说明：

- 如需从重组后的文档入口开始，请见 [docs/README.md](./README.md)
- 如需更短的安装与日常使用路径，请见 [docs/user-guide/README.zh-CN.md](./user-guide/README.zh-CN.md)

## 1. 安装

先安装 CLI：

```powershell
npm install -g github:pandaria75/marionettist
```

然后在目标项目中运行：

```powershell
# 先预览
marionettist init --dry-run

# 交互式安装
marionettist init

# 可选：同时安装 OpenCode commands 和 agents
marionettist init --with-opencode
```

如需逐步完成首次安装，请配合 [docs/user-guide/quick-start.zh-CN.md](./user-guide/quick-start.zh-CN.md) 一起阅读。本页更适合作为长期参考：说明 init 会安装什么，以及后续工作流如何运行。

如果你维护的是这个 framework 源码仓库本身，请使用 `marionettist self init --apply`，不要在这里运行普通的 `marionettist init`。

交互式 init 不会静默覆盖已有文件。CLI 会询问是备份、覆盖还是跳过。用 `--auto` 跳过所有已存在文件。仅在刻意要替换时才使用 `--force`。

## 2. 初始化后得到什么

典型安装的文件：

- `AGENTS.md` — 仓库级 agent 行为
- `marionettist.config.yaml` — 本地 Marionettist 设置
- `docs/project/marionettist-workflow.md` — 任务工作流和状态契约
- `docs/project/knowledge-map.md` — 项目知识路由地图
- `.aiassistant/rules/*.md` — 可执行约束
- `.agents/skills/*/SKILL.md` — 可移植工作流 skills
- `.marionettist/manifest.json` — 受管文件所有权记录
- 可选：安装了 OpenCode 时的 `.opencode/*` 文件

初始化后，技术负责人通常应：

1. 填写 `AGENTS.md` 中的 project-local 部分。
2. 为项目调整 `marionettist.config.yaml`。
3. 更新 `docs/project/knowledge-map.md`，指向实际的项目文档。
4. 在 `.aiassistant/rules/` 下添加或细化本地规则。
5. 如使用 OpenCode，检查 `.marionettist/model-profiles.yml`。

### 可选项：`riskZones`

`riskZones` 是 `marionettist.config.yaml` 里的一个可选配置字段，用于标记项目中风险较高的区域。

- 可用于提示认证鉴权、计费、schema 变更、生产配置、外部 API 契约等敏感区域。
- 如果不配置它，Marionettist 仍然可以正常工作。
- 应将它视为面向 analysis、文档整理和 review 的轻量提示配置，不要把它当作一套已完全强约束的策略系统。

示例：

```yaml
riskZones:
  - name: "auth"
    paths:
      - "src/auth/**"
      - "src/permissions/**"
    notes:
      - "涉及访问控制和用户权限"
```

## 3. 安装模式

`marionettist init` 支持三种分发模式：

- `embedded` — 默认；Marionettist 安装在目标仓库本地
- `hybrid` — 本地安装，同时带 adapter 感知元数据
- `adapter` — adapter 导向安装，同时保留本地生成文件的追踪

所选模式在适用时记录在 `.marionettist/manifest.json` 中。大多数团队从默认的 `embedded` 模式开始即可。

## 4. 日常工作流

Marionettist 是一个受控序列：

```text
intake -> analysis/context -> coding -> review -> gate
```

对非平凡工作，agent 应在编码前准备任务上下文。对更大规模的工作，还应冻结需求、将实现拆分为切片。

实用的启动提示词：

```text
请按照本仓库的 Marionettist 工作流执行。

任务：<描述工作>。

从任务 intake 和上下文准备开始。
在 analysis gate 获批前不要开始编码。
```

如果使用可选 OpenCode 集成，简短入口是：

```text
/marionettist <描述工作>
```

## 5. 任务分级

### Tier S — 平凡低风险

适用于拼写修改、注释改动或无边界风险的单文件小更新。

预期流程：

```text
coding -> review
```

### Tier M — 标准范围工作

适用于需要上下文但边界清晰的小功能、bugfix、重构或文档任务。

预期流程：

```text
analysis -> context-pack -> coding -> review -> gate
```

最低要求：编码前创建或更新 `.task/<task-id>/context-pack.md`。

### Tier L — 复杂或敏感工作

适用于跨区域改动、架构敏感重构、公共契约变更、需求不清或分阶段交付。

预期流程：

```text
intake -> requirement -> inspection -> implementation plan -> context-pack -> approved slice coding -> review -> gate
```

最低要求：只能基于已批准 slice 编码。除非用户显式选择其他允许的姿态，否则使用更严格的 gate。

## 6. Gate

对非平凡工作，agent 必须在以下位置停下：

- 完成分析后，进入编码前
- 每个已批准 slice 或已批准 group 完成后，进入下一个之前

编码可以直接流向同一已批准 slice 的 review。不得悄悄进入无关的工作。

Gate 报告格式：

```text
Phase:
Completed Work:
Files Created or Changed:
Validation Status:
Recommended Next Step:
User confirmation required to continue.
```

### Gate policy 模式

项目可以在 `marionettist.config.yaml` 中配置 gate 姿态：

```yaml
gatePolicy:
  defaultMode: "strict" # strict | balanced | autonomous
  finalApprovalRequired: true
  allowTaskOverride: true
```

- `strict` 在每个正常 gate 停下。
- `balanced` 保留主要审批点，可减少已批准的简单延续中的摩擦。
- `autonomous` 允许在已批准范围内更多连续推进，但依然保留必要的停止点。

Gate policy 不是 OpenCode permission mode。它不放宽危险命令规则、禁止范围或最终批准，除非显式配置。

确切的 gate 语义参照目标项目中安装的 `docs/project/marionettist-workflow.md`。

## 7. 任务工件

常用任务文件：

| 工件 | 路径 | 用途 |
| --- | --- | --- |
| 当前任务指针 | `.task/active.json` | 选择当前任务和阶段 |
| 需求 | `.task/<task-id>/requirement.md` | 冻结目标和约束 |
| 实现计划 | `.task/<task-id>/implementation-plan.md` | 定义切片和验证 |
| Context pack | `.task/<task-id>/context-pack.md` | 给 coder 提供紧凑的已批准上下文 |
| 状态 | `.task/<task-id>/state.json` | 记录 gate、当前 slice 和状态 |

这些文件应保持简洁。优先使用链接和提炼的上下文，而非复制大段源文件。

## 8. 实用提示词

### 功能

```text
我想开发一个功能：

<需求>

请按照当前仓库的 Marionettist 工作流执行。
从任务 intake 开始。
不要直接开始编码。
```

### Bugfix

```text
我需要修一个 bug：

观察到的行为：<实际行为>
期望的行为：<预期行为>
复现方式：<步骤或证据>

请按照当前仓库的 Marionettist 工作流执行。
编码前先确认复现路径或失败测试。
```

### 重构

```text
我需要做一次重构：

目标：<目标>
必须保持不变的行为：<约束>
允许范围：<文件或区域>
禁止范围：<文件或区域>

请按照当前仓库的 Marionettist 工作流执行。
先分析边界影响。
不要直接开始编码。
```

### 文档

```text
我需要更新文档：

受众：<读者>
目标：<文档应解释的内容>
文件：<目标文档>

请按照 docs 工作流执行。
语言保持简洁，不要把文档写成代码索引。
```

## 9. 文档与规则

保持清晰的分工：

- **Docs** 解释设计、职责、工作流、边界和风险。
- **Rules** 定义 agent 必须遵守的约束。

文档不应罗列每个文件、类、函数或调用点。用 IDE 工具或本地搜索做代码导航。

当 docs 或 rules 新增、移动、重命名或删除时，更新 `docs/project/knowledge-map.md`。

## 10. OpenCode

OpenCode 是可选的。没有它，Marionettist 依然能通过文件、提示词和 skills 运行。

如需 slash commands、角色 agents、模型 profiles 或 permission posture 的安装与使用细节，请阅读 [docs/OPENCODE.zh-CN.md](./OPENCODE.zh-CN.md)。本页只保留无论是否使用 OpenCode 都成立的工作流契约。

## 11. 升级与同步

应用前先预览变更：

```powershell
marionettist diff
```

应用安全的受管更新：

```powershell
marionettist sync
marionettist sync --dry-run
```

检查安装状态：

```powershell
marionettist doctor
```

本地任务工件、本地 docs、本地 rules 和本地 skills 默认保留。`AGENTS.md` 只更新 managed block。冲突会被报告，不会被静默覆盖。

## 12. 清理与重新初始化

当你希望在一次干净重装或迁移前移除框架受管文件时，使用 `marionettist clear`。`marionettist uninstall` 是它的别名。

先预览：

```powershell
marionettist clear
marionettist clear --scope opencode
```

只有在确认要移除受管资产时才应用：

```powershell
marionettist clear --apply
marionettist uninstall --scope all --apply
```

- 默认模式只是预览。除非带 `--apply`，否则不会改动文件。
- `--scope all` 会移除仍然存在的、所有由 manifest 管理的 Marionettist 资产。
- `--scope opencode` 只移除记录为 OpenCode adapter 的 manifest 受管文件；它不会仅凭 `.opencode/` 路径推断所有权。
- apply 模式会在每次删除文件或编辑 `AGENTS.md` managed block 之前，把备份写入 `.marionettist/backups/<timestamp>/`。
- `AGENTS.md` 不会被整体删除。clear 只移除 `marionettist-kit` managed block，并保留项目本地部分。
- 如果 `AGENTS.md` 只包含 managed block，clear 会保留一个安全的 `# AGENTS` 占位文件，而不是删除整个文件。
- apply 不是跨所有目标的原子操作。如果后续备份或删除步骤失败，更早的目标可能已经被备份并移除。必要时可用备份目录恢复。
- 当前 apply 失败会直接暴露底层文件系统错误。把该输出当作第一恢复线索。

典型迁移流程：

```powershell
# 1) 先预览 clear 会移除什么
marionettist clear --scope all

# 2) 预览确认后再应用 clear
marionettist clear --scope all --apply

# 3) 干净地重新安装 Marionettist
marionettist init --with-opencode
```

只在你确实要清理的目标项目中运行 apply。该命令会拒绝那些逃出项目根目录的 manifest 目标，包括解析后位于工作区外的符号链接目标。

## 13. 常见误区

- 不要在本 framework 源码仓库中随意运行 `marionettist init`。这里要用 self 命令。
- 非平凡工作的 analysis gate 获批前不要开始编码。
- 不要把文档当作源码索引。
- 不要混淆 gate policy 和 OpenCode permission mode。
- 不要把项目私有规则写入框架模板。
- 除非团队有意接受受管替换，否则不要使用 force sync。
