# OpenCode 与 Harness

[English](./OPENCODE.md)

本文档说明 `harness init --with-opencode` 安装的可选 OpenCode 脚手架。

OpenCode 是推荐项，但不是 harness core。

Harness 的核心仍然是：

- 以仓库文件作为协作契约
- 以 skills 作为工作流模型
- 以 gates 作为流程控制机制

OpenCode 的作用，是在这套模型之上增加一层更顺手的本地执行层。

## 1. 什么时候使用 OpenCode

当团队希望更高效地重复执行 harness flow 时，可以使用 OpenCode，它主要提供：

- 面向常见任务入口的 slash commands
- 本地 agent 角色定义
- 可复用的 validator 脚手架
- 基于 `opencode-tasks` 的项目级调度感知配置

不要把 OpenCode 当成事实来源。

即使移除 `.opencode/`，仓库仍然应该能够仅依靠 `AGENTS.md`、rules、docs、`.task/` 和已安装 skills 被正确理解和使用。

## 2. 安装或补装

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

## 3. 会安装什么

典型文件包括：

- `opencode.jsonc`
- `.opencode/commands/harness-feature.md`
- `.opencode/commands/harness-bugfix.md`
- `.opencode/commands/harness-refactor.md`
- `.opencode/commands/harness-docs.md`
- `.opencode/commands/harness-context.md`
- `.opencode/agents/harness-builder.md`
- `.opencode/agents/harness-coder.md`
- `.opencode/agents/harness-indexer.md`
- `.opencode/agents/harness-planner.md`
- `.opencode/agents/harness-reviewer.md`
- `.opencode/agents/harness-validator.md`
- `.opencode/README.md`

这些都是可编辑的本地默认值，不是锁死的产品行为。

Framework 还会安装一个项目本地 `opencode.jsonc`，默认启用 `opencode-tasks`。

## 4. OpenCode 如何嵌入 Harness

OpenCode 应该遵循仓库文件已经定义好的那套 harness 方法。

推荐映射方式是：

1. 通过 slash command 或直接提示词启动正确流程
2. builder 执行 analysis
3. 对非平凡任务，builder 在 analysis gate 停下
4. builder 选择当前已批准的 slice 或 group
5. coder 只实现这部分已批准工作
6. reviewer 在编码后立即检查同一部分已批准工作
7. builder 在下一个 slice gate 再次停下

OpenCode 的职责是让这条流程更容易执行，而不是削弱 gate 机制。

## 5. Slash Commands

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

用于重建或刷新 `.task/context-pack.md`。

预期行为：

- 将当前已批准的 slice 或 group 压缩成最小编码上下文
- 只更新上下文
- 不单独授权开始编码

## 6. Agent 角色

| Agent | 角色 |
| --- | --- |
| `harness-builder` | 主编排者。负责 analysis、执行 gates、选择已批准 slice、调用 coder、reviewer 和 validator，并在需要时停下等待确认。 |
| `harness-indexer` | 只读仓库探索者，用于 docs、rules、边界和 workflow 入口分析。 |
| `harness-planner` | 负责生成需求、实现切片、验证策略和 context-pack 规划。 |
| `harness-coder` | 只实现当前已批准的 slice 或已批准 group。 |
| `harness-reviewer` | 负责审查边界安全、实际修改范围、验证覆盖，以及 docs 或 rules 同步需求。 |
| `harness-validator` | 负责执行 build、compile、test、lint 等验证命令，并返回精简诊断。 |

## 7. Gate 行为

OpenCode 流程必须遵守 harness 本身的非平凡任务 gate 规则。

必经 gate：

- analysis 完成后 -> coding 开始前
- 当前已批准 slice 或已批准 group 完成后 -> 下一个 slice 或 group 开始前

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

## 8. 模型与权限定制

安装后的 `.opencode/agents/*.md` 里的值都只是示例。

推荐调整方式：

- 给 `harness-builder` 和 `harness-reviewer` 使用更强模型
- 在合适场景下为 `harness-indexer` 和 `harness-validator` 使用更小或更便宜的模型
- 让 validator 和 reviewer 的 `temperature` 保持较低
- 在开启 shell、edit 或 task delegation 前先检查 `permission` 配置

除非团队有意共享默认值，否则应把这些文件视为团队本地脚手架。

## 9. Validator 行为

Validator 模板会按项目类型适配：

- 总是包含通用 fallback guidance
- 检测到 Gradle/Kotlin、Maven、Node.js 或 Python 项目时，会额外带上对应技术栈 guidance
- 其他技术栈可以继续使用通用 fallback，或替换成仓库自定义 guidance

运行期预期行为：

- 如果 `.task/context-pack.md` 中已有验证命令，优先使用它们
- 否则为当前已批准的 slice 或 group 选择最小相关命令
- 当启用 `opencode-tasks` 且用户要求周期性验证时，优先建议基于调度器的任务，而不是临时循环
- 长时间运行的验证产物应保留在 `.harness/tmp/harness-validator/<run-id>/`

常见产物包括：

- `command.txt`
- `status.txt`
- `stdout.log`
- `stderr.log`
- 可用时的 process id 文件

## 10. 隐私与版本管理

推荐默认策略：

- 在团队明确决定标准化范围之前，将 `.opencode/` 视为本地/私有内容
- 如果希望完全本地化，可加入 `.gitignore`
- 只把团队希望共享的文件纳入版本管理
- 共享 agent 文件前，先清理用户名、绝对路径、secrets 和内部 URL

公开示例时保持通用，例如：

- `/path/to/universal-ai-harness-framework`
- `C:\path\to\universal-ai-harness-framework`

不要在可复用默认值中发布机器私有路径或业务项目标识。
