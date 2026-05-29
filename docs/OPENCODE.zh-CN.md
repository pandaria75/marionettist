# OpenCode 与 Harness

[English](./OPENCODE.md)

本文档说明 `harness init --with-opencode` 安装的可选 OpenCode 脚手架。

OpenCode 是推荐项，但不是 harness core。

Harness 的核心仍然是：

- 以仓库文件作为协作契约
- 以 skills 作为工作流模型
- 以 gates 作为流程控制机制

OpenCode 的作用，是在这套模型之上增加一层更顺手的本地执行层。但它真正的优势在于：多 agent 角色各自独立绑定不同能力的模型，让每一类工作都用最适合它的模型去执行，而不是一刀切用最聪明的模型包揽一切。

## 1. 模型分层策略

不是 harness 流程中的每一步都需要最聪明的模型。这套工作流天然把任务分成了三种能力需求。

分配模型的方式和分配人员一样：把最强推理能力放在范围、风险和设计清晰度最关键的环节，把更快更便宜的模型放在执行类环节。

**第一层 — 思考型**

需要深度推理、消除模糊性并做出范围决策的工作：

| Agent | 原因 |
| --- | --- |
| `harness-builder` | 编排全流程，读取活跃任务状态，解读 gate 报告，路由 subagent，防止任务漂移 |
| `harness-planner` | 冻结需求，拆分工作切片，设计验证策略 |

请用你手上最强的模型跑这两个角色。这一步的质量决定了后续所有环节能不能做对。

**第二层 — 执行型**

需要稳定执行但不依赖深度原创推理的工作：

| Agent | 原因 |
| --- | --- |
| `harness-coder` | 在 allowed scope 内实现已批准 slice 或 group |
| `harness-reviewer` | 对照已批准 plan 检查范围、边界、验证和文档同步 |
| `harness-critic` | 在 critic gate 审查需求清晰度、计划安全性、上下文充分性和验证缺口 |

请用能力强但性价比高的模型。这类 agent 的执行依据是 `.task/<task-id>/context-pack.md` 和 implementation plan 中已经写好的显式约束。这里的 `<task-id>` 由 `.task/active.json` 选定。

**第三层 — 工具型**

需要快速、可靠地执行工具操作且推理需求很低的工作：

| Agent | 原因 |
| --- | --- |
| `harness-indexer` | 以只读方式探索仓库中的 docs、rules 和入口点 |
| `harness-validator` | 执行 build、compile、test、lint 并返回精简诊断 |

请用最便宜且能可靠遵循指令集的模型。速度和低成本比推理深度更重要。

这三级分层，就是多 agent OpenCode 脚手架存在的最根本原因。它不是为了让多个 agent 并行干活，而是为了把模型的能力和成本，精确匹配到每类工作的真实需求上。

## 2. 什么时候使用 OpenCode

当团队希望获得以下能力时，可以使用 OpenCode：

- 按 harness 流程把不同能力等级的模型分配到对应角色
- 面向常见任务入口的 slash commands
- 本地 agent 角色定义，每个角色独立绑定模型
- 可复用的 validator 脚手架
- 基于 `opencode-tasks` 的项目级调度感知配置

不要把 OpenCode 当成事实来源。

即使移除 `.opencode/`，仓库仍然应该能够仅依靠 `AGENTS.md`、rules、docs、`.task/` 和已安装 skills 被正确理解和使用。

## 3. 安装或补装

在项目初始化时安装 OpenCode 脚手架：

```powershell
harness init --with-opencode
```

写入前先预览：

```powershell
harness init --dry-run --with-opencode
```

为已初始化项目补装：

```powershell
harness init --with-opencode
```

这些资产安装后，后续 `harness diff` 和 `harness sync` 会通过 manifest 把它们视为 framework-managed 文件。

## 4. 会安装什么

典型文件包括：

- `opencode.jsonc`（项目根目录）
- `.opencode/commands/harness-feature.md`
- `.opencode/commands/harness-bugfix.md`
- `.opencode/commands/harness-refactor.md`
- `.opencode/commands/harness-docs.md`
- `.opencode/commands/harness-context.md`
- `.opencode/commands/harness-incident.md`
- `.opencode/commands/harness-status.md`
- `.opencode/commands/harness-continue.md`
- `.opencode/agents/harness-builder.md`
- `.opencode/agents/harness-coder.md`
- `.opencode/agents/harness-indexer.md`
- `.opencode/agents/harness-planner.md`
- `.opencode/agents/harness-reviewer.md`
- `.opencode/agents/harness-critic.md`
- `.opencode/agents/harness-validator.md`
- `.opencode/README.md`

这些都是可编辑的本地默认值，不是锁死的产品行为。

Framework 还会在项目根目录安装 `opencode.jsonc`（不在 `.opencode/` 下），默认启用 `opencode-tasks`。

## 5. OpenCode 如何嵌入 Harness

OpenCode 应该遵循仓库文件已经定义好的那套 harness 方法。

推荐映射方式是：

1. 通过 slash command 或直接提示词启动正确流程
2. builder 执行 analysis（第一层模型）
3. 对非平凡任务，builder 在 analysis gate 停下
4. builder 选择当前已批准的 slice 或 group
5. coder 只实现这部分已批准工作（第二层模型）
6. reviewer 在编码后立即检查同一部分已批准工作（第二层模型）
7. 如果工作受 critic gate 约束，则在编码前和宣告完成前都由 critic 检查 gate 工件
8. builder 在下一个 slice gate 再次停下

OpenCode 的职责是让这条流程更容易执行，而不是削弱 gate 机制。

## 6. Slash Commands

### `/harness-feature`

用于新功能或新需求。

预期行为：

- 路由到 `harness-builder`
- 从 `task-intake` 开始
- 在 analysis gate 批准前保持在分析阶段

### `/harness-bugfix`

用于 bugfix，尤其当你已经掌握实际现象、预期行为、复现方式或证据时。

预期行为：

- 路由到 `harness-builder`
- 优先确认复现路径或失败测试
- 只有在预期行为仍不清楚时才使用 `requirement-freezer`

### `/harness-refactor`

用于保持行为不变的结构性修改。

预期行为：

- 明确 allowed scope 和 forbidden scope
- 在编码前分析边界和流程影响

### `/harness-docs`

用于 docs 或 rules 工作。

预期行为：

- 让文档工作走专门路径，而不是伪装成生产代码 slice
- 将更新限制在请求涉及的设计、模块或流程关注点内

### `/harness-context`

用于重建或刷新 `.task/<task-id>/context-pack.md`，其中 `<task-id>` 由 `.task/active.json` 选定。

预期行为：

- 将当前已批准的 slice 或 group 压缩成最小编码上下文
- 只更新上下文
- 不单独授权开始编码

### `/harness-incident`

用于证据优先的 incident / 现场分析。

预期行为：

- 路由到 `harness-builder`
- 先读取 `.task/active.json`，如存在再读取 task state
- 创建或更新 `.task/<task-id>/incident.md`，且它只是分析产物
- 整理用户提供的现象、日志、截图、报文、配置、环境信息、复现说明和未知项
- 不假设可以本地复现，也不假设具备站点访问能力
- 不自动抓取 terminal logs
- 在编码前停下，并为未来的 `incident-pack-builder` 与 `hypothesis-critic` 交接做好准备

### `/harness-status`

用于查看当前任务状态而不修改文件。

预期行为：

- 读取 `.task/active.json` 和 `.task/<task-id>/state.json`
- 显示 phase、gates、当前 slice、下一步命令、所需文件和警告
- 不猜测缺失的状态

### `/harness-continue`

用于按任务状态继续活跃任务。

预期行为：

- 先读状态再行动
- 遵守 gates 和 `allowedToCode`
- 路由到下一步 skill 或 subagent
- 重要阶段切换前请求确认

## 7. Agent 角色

| Agent | 角色 | 模型层级 |
| --- | --- | --- |
| `harness-builder` | 主编排者。读取活跃任务状态，执行 gates，选择已批准 slice，调用其他 agent，汇总结果，并在需要时停下等待确认。 | 第一层 |
| `harness-planner` | 负责生成需求、实现切片、验证策略和 context-pack 规划。 | 第一层 |
| `harness-coder` | 只实现当前已批准的 slice 或已批准 group。 | 第二层 |
| `harness-reviewer` | 负责审查边界安全、实际修改范围、验证覆盖，以及 docs 或 rules 同步需求。 | 第二层 |
| `harness-critic` | 在编码前或 critic-gated 工作宣告完成前，审查 requirement、plan、context、scope 与 validation 风险。 | 第二层（`review` profile） |
| `harness-indexer` | 只读仓库探索者，用于 docs、rules、边界和 workflow 入口分析。 | 第三层 |
| `harness-validator` | 负责执行 build、compile、test、lint 等验证命令，并返回精简诊断。 | 第三层 |

## 8. Gate 行为

OpenCode 流程必须遵守 harness 本身的非平凡任务 gate 规则。

必经 gate：

- analysis 完成后 -> coding 开始前
- 当前已批准 slice 或已批准 group 完成后 -> 下一个 slice 或 group 开始前

额外的 critic-gated 行为：

- 当任务状态或 workflow policy 标记该工作需要 critic gate，且 `criticPassed` 为 false 时，`harness-continue` 应在任何 coding handoff 前先路由到 `harness-critic`
- critic 的 `PASS` 不能绕过 `allowedToCode`、当前 phase 规则或用户确认
- 对 critic-gated 工作，在 coding、review 和 required validation 完成后，应再次路由到 `harness-critic`，再宣告当前已批准工作完成

关键点：

- 同一已批准 slice 的 coding 和 review 属于同一个执行阶段
- 对同一已批准 slice，用户不需要在 coder 和 reviewer 之间再次确认
- 在进入下一个 slice 或 group 前，用户必须再次确认

常见继续指令：

```text
continue
proceed
start current slice
accept this slice and continue
start the next approved slice
```

如果同一 slice 在总计三次 review 尝试后仍然 `BLOCKED`，就应停止并让用户决定下一步。

## 9. 模型 Profiles 与权限定制

安装后的 `.opencode/agents/*.md` 文件包含面向 OpenCode 兼容性的具体模型字段；当项目存在 `.harness/model-profiles.yml` 时，这些值从该文件的模型 profiles 渲染，只有在需要兼容旧项目时才回退到 `harness.config.yaml` 的 `models.profiles.*`。

稳定 profiles：

- `think`：builder 和 planner
- `build`：coder
- `review`：reviewer 和 critic
- `run`：indexer 和 validator

Skill 模型需求与 profiles 的映射关系如下：

- `reasoning` -> `think`
- `coding` -> `build`
- `reflective` -> `review`
- `utility` -> `run`

每个 agent 角色都有自己的文件，你可以在修改对应 profile 后调整具体模型。

从三级分层策略出发，根据团队可用的模型和预算做调整：

- 第一层（builder、planner）：手上最强的推理模型
- 第二层（coder、reviewer）：能力强但性价比高的模型
- 第三层（indexer、validator）：最便宜但能可靠执行工具指令的模型

其他设置：

- validator 和 reviewer 的 `temperature` 保持较低，确保输出确定性
- 在开启 shell、edit 或 task delegation 前先检查 `permission` 配置
- 第三层 agent 通常需要的权限比第一层少

除非团队有意共享默认值，否则应把这些文件视为团队本地脚手架。

## 10. Validator 行为

Validator 模板会按项目类型适配：

- 总是包含通用 fallback guidance
- 检测到 Gradle/Kotlin、Maven、Node.js 或 Python 项目时，会额外带上对应技术栈 guidance
- 其他技术栈可以继续使用通用 fallback，或替换成仓库自定义 guidance

运行期预期行为：

- 如果 `.task/<task-id>/context-pack.md` 中已有验证命令，优先使用它们
- 否则为当前已批准的 slice 或 group 选择最小相关命令
- 当启用 `opencode-tasks` 且用户要求周期性验证时，优先建议基于调度器的任务，而不是临时循环
- 长时间运行的验证产物应保留在 `.harness/tmp/harness-validator/<run-id>/`

常见产物包括：

- `command.txt`
- `status.txt`
- `stdout.log`
- `stderr.log`
- 可用时的 process id 文件

## 11. 隐私与版本管理

推荐默认策略：

- 在团队明确决定标准化范围之前，将 `.opencode/` 视为本地/私有内容
- 如果希望完全本地化，可加入 `.gitignore`
- 只把团队希望共享的文件纳入版本管理
- 共享 agent 文件前，先清理用户名、绝对路径、secrets 和内部 URL

公开示例时保持通用，例如：

- `/path/to/universal-ai-harness-framework`
- `C:\path\to\universal-ai-harness-framework`

不要在可复用默认值中发布机器私有路径或业务项目标识。
