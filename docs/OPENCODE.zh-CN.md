# OpenCode 与 Harness

[English](./OPENCODE.md)

面向使用 `harness init --with-opencode` 安装的可选 OpenCode 脚手架的技术负责人和开发者。

OpenCode 是推荐项，但可选的。Harness core 无需它即可运行，靠的是仓库文件、提示词和已安装 skills。设计理由见 [docs/DESIGN.zh-CN.md](./DESIGN.zh-CN.md)。

## 1. OpenCode 增加了什么

OpenCode 用体验改善包装了 harness 工作流：

- **模型分层。** 为不同 harness 角色分配不同模型 — 最强模型做规划，性价比模型做编码和 review，最便宜模型做工具型任务。
- **Slash commands。** 像 `/harness` 这样的快捷入口，直接路由到正确工作流。
- **Agent 角色。** 本地角色定义（builder、coder、reviewer、validator），每个角色独立配置模型和权限。
- **Validator 脚手架。** 遵循 harness 工作流的 build、test、lint 指引。

## 2. 模型分层策略

Harness 工作流天然将工作分为三类能力层级。


| 层级   | Profile  | 角色               | 模型选择                     |
| ------ | -------- | ------------------ | ---------------------------- |
| Think  | `think`  | builder、planner   | 手上最强的推理模型           |
| Build  | `build`  | coder              | 性能好、性价比高的模型       |
| Review | `review` | reviewer、critic   | 能力强、输出确定性的模型     |
| Run    | `run`    | indexer、validator | 最便宜且能可靠遵循指令的模型 |

这种分层是多 agent 脚手架存在的根本原因 — 把模型的能力和成本精确匹配到每类工作的真实需求上。

## 3. 安装

```powershell
# 项目初始化时安装
harness init --with-opencode

# 先预览
harness init --dry-run --with-opencode

# 选择命令面
harness init --with-opencode --opencode-command-surface minimal   # 默认
harness init --with-opencode --opencode-command-surface standard
harness init --with-opencode --opencode-command-surface advanced
```

也可在项目配置中指定：

```yaml
opencode:
  commandSurface: minimal  # 或 standard | advanced
```

旧值 `full` 仍可作为 `advanced` 的兼容别名。

OpenCode 安装同样遵循 harness 分发模式：

- `embedded` — 默认值，也最接近旧版本行为
- `hybrid` — 本地安装，同时带显式 adapter 感知分发元数据
- `adapter` — adapter 导向安装，但仍在本地受安全同步机制追踪

所选模式记录在 `.harness/manifest.json` 的 `distributionMode`。旧项目即使还没有这个字段也仍然有效，CLI 会报告或推断有效模式。只有在用户显式选择/提供模式、manifest 里已经存在 `distributionMode`，或 `harness.config.yaml` 指定了 `distribution.mode` 时，才会写入该字段。

这些资产在 `.harness/manifest.json` 中追踪，并参与 `harness diff`、`harness sync` 和 `harness doctor`。

## 4. 安装了什么

- `opencode.jsonc`（项目根目录）— 共享运行时设置
- `.opencode/commands/harness.md`、`harness-dev.md`、`harness-docs.md`、`harness-config.md`、`harness-incident.md`
- `.opencode/agents/harness-builder.md`、`harness-coder.md`、`harness-indexer.md`、`harness-planner.md`、`harness-reviewer.md`、`harness-critic.md`、`harness-validator.md`
- `.opencode/README.md`

这些是生成出来的受管默认值，不是锁死的产品行为。

命令面分为：

- `minimal`：`/harness`、`/harness-dev`、`/harness-incident`、`/harness-docs`、`/harness-config`
- `standard`：在 minimal 基础上增加 `/harness-context`、`/harness-status`、`/harness-continue`
- `advanced`：在 standard 基础上增加 `/harness-feature`、`/harness-bugfix`、`/harness-refactor`

设计原则是 builder-first：大多数团队应从 `/harness` 开始，只有在更多 wrapper 能改善团队体验时才扩展命令面。

## 5. OpenCode 如何嵌入 Harness

OpenCode 遵循同一套 harness 方法：

1. Slash command 或提示词启动流程。
2. Builder 分类请求并执行 analysis（Think 层）。
3. 对非平凡任务，Builder 在 analysis gate 停下。
4. Builder 选择当前已批准 slice。
5. Coder 只实现该已批准工作（Build 层）。
6. Reviewer 在编码后立即检查同一已批准工作（Review 层）。
7. 如受 critic gate 约束，critic 在编码前和宣告完成前分别审查。
8. Builder 在下一切片 gate 停下。

OpenCode 让这条流程更易执行 — 它不削弱 gate 模型。

## 6. 主要 Slash Commands


| 命令                | 用途                                       |
| ------------------- | ------------------------------------------ |
| `/harness`          | 默认入口。将自然语言请求路由到正确工作流。 |
| `/harness-dev`      | 开发和实现工作。                           |
| `/harness-incident` | 证据优先的 incident 调查。编码前停下。     |
| `/harness-docs`     | 文档或设计工作。                           |
| `/harness-config`   | Harness 或项目工作流配置。                 |
| `/harness-status`   | 查看当前任务状态，不修改文件。             |
| `/harness-continue` | 按任务状态继续活跃任务。                   |

## 7. Agent 角色


| Agent               | 职责                                           | Profile  |
| ------------------- | ---------------------------------------------- | -------- |
| `harness-builder`   | 主编排者。读取状态，执行 gate，路由 subagent。 | `think`  |
| `harness-planner`   | 需求、切片、验证策略。                         | `think`  |
| `harness-coder`     | 只实现当前已批准 slice 或 group。              | `build`  |
| `harness-reviewer`  | 审查范围、边界、验证和文档同步。               | `review` |
| `harness-critic`    | 在 critic gate 审查需求、计划和验证。          | `review` |
| `harness-indexer`   | 只读仓库探索，用于 docs、rules 和入口点。      | `run`    |
| `harness-validator` | 运行 build、compile、test、lint 并返回诊断。   | `run`    |

## 8. Gate 行为

OpenCode 流程遵守相同的 gate：

- analysis 完成后停下，进入 coding 前。
- 每个已批准 slice 或 group 完成后停下。

同一已批准 slice 内，coding 和 review 无需额外 gate。用户只需在进入下一切片前确认。

如果 review 返回 `BLOCKED`，coder 可尝试最小修复并重试 — 每一切片最多三次 review 尝试。三次 block 后停下，让用户决定。

常见继续指令：`continue`、`proceed`、`start current slice`、`accept this slice and continue`、`start the next approved slice`。

### Gate Policy 模式

项目可以单独配置 gate 行为，而不用把它和模型或权限设置混在一起。

- `strict` — 在正常 harness gate 上都停下。它是 Tier L、高风险或边界敏感改动的推荐模式。
- `balanced` — 推荐作为项目的通用默认值。它保留主要 harness 批准点，同时减少常规范围工作里可避免的摩擦。
- `autonomous` — 允许更多已批准的连续推进，但不会移除 slice 边界、forbidden scope 规则或其他 harness 控制。

Builder 可以针对某个具体任务推荐比项目默认值更严格的模式。常见模式是：

- 项目默认：`balanced`
- 任务建议：Tier L 或高风险工作使用 `strict`

如果启用了 task override，当前任务可以记录一个不同于项目默认值的 selected mode。这是有意的按任务控制，不是静默的策略漂移。

Final gate / final approval 默认仍然必需。`balanced` 不等于“跳过最后检查”，`autonomous` 也不等于“无需批准直接宣告完成”。只有项目或当前任务显式说明时，才应关闭 final approval。

已有项目如果还没有 `gatePolicy` 设置，仍然保持 legacy-compatible，可以之后再采用这些新模式。

## 9. 模型 Profiles 与定制

Agent 模型值从规范来源 `.harness/model-profiles.yml` 渲染；只有在该 canonical 文件不存在时，才回退到 `harness.config.yaml` 的 legacy profiles。Profile 与 skill 需求的映射：

- `reasoning` → `think`
- `coding` → `build`
- `reflective` → `review`
- `utility` → `run`

调整模型的步骤：

1. 先更新 `.harness/model-profiles.yml`。
2. 让 `harness diff` 和 `harness sync` 重新渲染 `.opencode/agents/*.md` 中的值。
3. 仅在团队有意选择本地权限策略时编辑 agent markdown 的权限配置。
4. 避免在 `opencode.jsonc` 中重复 harness agent 的模型或权限值。

如果项目仍依赖 legacy `harness.config.yaml` profiles，且尚未创建 `.harness/model-profiles.yml`，那么 sync 会根据有效 legacy 值恢复 canonical 文件，使生成的 OpenCode 资产与 canonical 来源重新对齐。`harness doctor` 会报告预期模型值来自 canonical 文件还是 legacy fallback，并标记生成资产漂移。

validator 和 reviewer 的 `temperature` 保持较低以确保输出确定性。第三层 agent（indexer、validator）需要的权限比第一层少。

## 10. 权限模式与危险命令基线

Permission mode 和 gate policy 不是一回事：

- **Gate policy** 控制 harness 工作流里的批准停顿点。
- **Permission mode** 控制 OpenCode 对命令/工具访问施加多大的权限摩擦。

例如，项目可以使用 `balanced` gate 搭配 `default` 权限，也可以使用 `strict` gate 搭配 `moderate` 权限。两者应分别选择。

OpenCode 权限策略可通过 `harness.config.yaml` 配置：

```yaml
opencode:
  permissionMode: default  # 或 moderate | loose
```

配置键为 `opencode.permissionMode`。

各模式含义：

- `default` — 保持当前与 harness 兼容的既有行为。如果团队没有明确理由调整，应优先使用它。
- `moderate` — 降低日常权限确认摩擦，同时保留同一套危险命令基线与风险提示。
- `loose` — 进一步降低经验型本地用户的操作摩擦，但仍保留 OpenCode schema 能表达出来的 harness 危险命令基线。

危险命令基线包括：

- destructive deletes（破坏性删除）
- dangerous git rewrites（危险的 git 历史重写）
- force pushes（强推）
- publish 或 release 操作
- 全局配置修改
- 写入项目目录之外的位置
- 高风险 shell 管道或链式命令模式

这套基线会在 OpenCode schema 能力允许的范围内尽可能强地执行。有些模式可以直接体现在生成的权限规则中；另一些则无法仅靠 schema 精确表达。对后一类情况，harness 会用 warning、prompt 和 agent 指引文字补足，而不会假装 schema 具备并不存在的更强保护能力。

`loose` 不是“全部放行”模式。它应被视为更高信任度的本地工作流选项，而不是共享默认值建议。框架**不建议**全局 `permission: allow`，因为那会移除对破坏性或仓库级操作的重要摩擦。

对目标项目来说，权限选择应保持项目中立并经过团队评估。除非你有明确理由接受 `moderate` 或 `loose` 带来的额外风险，否则从 `default` 开始。

## 11. 受管资产 Ownership 与安全同步

对目标项目的 OpenCode 资产来说，source of truth 是框架中的 `templates/opencode/**`。

受管的 OpenCode manifest 条目会记录 adapter 感知元数据，例如：

- `adapter: "opencode"`
- `commandSurface`
- `templateHash`
- `renderedHash`
- 保留作为兼容回退字段的 legacy `hash`

比较时使用 `renderedHash ?? hash`，因此旧 manifest 也能继续参与安全同步。

安全行为包括：

- 本地修改会被保护并报告，不会被静默覆盖
- 缺失的生成文件会作为 missing managed files 报告
- 当生成输入变化导致当前输出不再匹配记录的 rendered hash 时，会报告为冲突
- orphaned managed entries 会持续可见，直到项目自行决定如何清理
- force 语义必须显式触发；受管替换需要有意为之，不能静默覆盖

这意味着：`harness diff` 是预览步骤，`harness sync` 只应用安全的受管更新，`harness doctor` 用于解释漂移与 ownership 状态。

## 12. Validator 行为

Validator 模板按项目类型适配（Gradle/Kotlin、Maven、Node.js、Python 或通用 fallback）。

运行时行为：

- 优先使用 `.task/<task-id>/context-pack.md` 中的验证命令（如有）。
- 否则为当前 slice 选择最小相关命令。
- 长时间运行的验证产物保存在 `.harness/tmp/harness-validator/<run-id>/` 下。

## 13. 隐私与版本管理

- 在团队决定标准化范围前，将 `.opencode/` 视为本地/私有内容。
- 如果希望完全本地化，加入 `.gitignore`。
- 只版本管理团队希望共享的文件。
- 共享 agent 文件前清理用户名、绝对路径、secrets 和内部 URL。
