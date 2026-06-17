# OpenCode 与 Harness

[English](./OPENCODE.md)

本指南面向使用 `harness init --with-opencode` 安装的可选 OpenCode 脚手架的团队。

OpenCode 改善体验，但不替代 harness 工作流。仓库文件、任务工件和 gate 仍然是事实来源。

## 1. OpenCode 增加了什么

- **Slash commands**，如 `/harness`、`/harness-dev`、`/harness-docs`。
- **角色 agent**，用于 builder、planner、coder、reviewer、critic、indexer 和 validator 工作。
- **模型 profiles**，使每个角色可使用恰当的模型层级。
- **Validator 指引**，用于 build、test、lint 和 smoke-check 工作流。
- **本地权限姿态**，通过生成的 OpenCode agent 文件实现。

核心 harness 在没有 OpenCode 时依然可运行。

## 2. 安装

```powershell
# 先预览
harness init --dry-run --with-opencode

# 安装 OpenCode 脚手架
harness init --with-opencode

# 可选的命令面
harness init --with-opencode --opencode-command-surface minimal
harness init --with-opencode --opencode-command-surface standard
harness init --with-opencode --opencode-command-surface advanced
```

也可在项目配置中设置命令面：

```yaml
opencode:
  commandSurface: minimal  # minimal | standard | advanced
```

旧值 `full` 仍可作为 `advanced` 的兼容别名。

## 3. 安装了什么

典型的 OpenCode 资产：

- `opencode.jsonc`
- `.opencode/README.md`
- `.opencode/plugin/opencode-tasks.js`
- `.opencode/commands/harness*.md`
- `.opencode/agents/harness-*.md`
- `.opencode/agents/validators/**`

这些是受管默认值。团队可自行决定哪些需要提交、哪些保留本地。

当前 MVP 姿态：

- `opencode.jsonc` 启用仓库本地插件路径 `./.opencode/plugin/opencode-tasks.js`
- 只要该插件存在，就默认采用 plugin-first 行为
- 生成的 `.opencode/agents/**` 和 `.opencode/commands/**` 文件仍然是受支持的回退资产
- 框架 source 目前有意拆分：插件原型资产来自 `templates/pathways/opencode/**`，生成式回退资产来自 `templates/opencode/**`

使用 `harness diff`、`harness sync` 和 `harness doctor` 检查漂移和安全更新。若重新生成了 `opencode.jsonc` 或 `.opencode/plugin/**`，而当前会话没有自动重载配置，请重启 OpenCode。

## 4. 命令面

| 命令面 | 命令 | 适用场景 |
| --- | --- | --- |
| `minimal` | `/harness`、`/harness-dev`、`/harness-incident`、`/harness-docs`、`/harness-config` | 默认的 builder-first 工作流 |
| `standard` | minimal 外加 `/harness-context`、`/harness-status`、`/harness-continue` | 团队需要显式的状态和继续命令 |
| `advanced` | standard 外加 `/harness-feature`、`/harness-bugfix`、`/harness-refactor` | 团队想按任务类型使用专用 wrapper |

大多数团队应从 `minimal` 开始。builder 可以从 `/harness` 路由自然语言请求。

## 5. 主要命令

| 命令 | 用途 |
| --- | --- |
| `/harness` | 默认入口。分类请求并路由工作流。 |
| `/harness-dev` | 功能或实现工作。 |
| `/harness-incident` | 紧急 incident 或缓解工作。 |
| `/harness-docs` | 文档、规则或知识工作。 |
| `/harness-config` | Harness、工作流、工具或 agent 配置工作。 |
| `/harness-status` | 查看当前任务状态，不修改文件。 |
| `/harness-continue` | 按记录的状态继续活跃任务。 |

## 6. Agent 角色

| Agent | 职责 | Profile |
| --- | --- | --- |
| `harness-builder` | 编排工作流，读取状态，执行 gate，委派有边界的子任务。 | `think` |
| `harness-planner` | 规划需求、切片、验证和依赖顺序。 | `think` |
| `harness-coder` | 只实现已批准的 slice 或 group。 | `build` |
| `harness-reviewer` | 审查 diff 的范围、边界、验证和文档同步。 | `review` |
| `harness-critic` | 对高风险工作在编码前或完成前审查风险 gate。 | `review` |
| `harness-indexer` | 执行只读仓库探索。 | `run` |
| `harness-validator` | 运行或解读验证命令。 | `run` |

Builder 负责编排。子 agent 应接收有边界的输入并返回紧凑的证据。

## 7. 模型 Profiles

OpenCode agent 的模型值在 `.harness/model-profiles.yml` 存在时从它渲染。Legacy 的 `harness.config.yaml` 模型 profiles 仅作回退。

各 profile 的默认意图：

| Profile | 使用角色 | 典型需求 |
| --- | --- | --- |
| `think` | builder、planner | 可用的最强推理能力 |
| `build` | coder | 有能力且成本效益好的实现模型 |
| `review` | reviewer、critic | 谨慎且稳定的 review 模型 |
| `run` | indexer、validator | 更便宜的可靠工具模型 |

Skill 到 profile 的映射：

- `reasoning` → `think`
- `coding` → `build`
- `reflective` → `review`
- `utility` → `run`

调整模型的步骤：

1. 编辑 `.harness/model-profiles.yml`。
2. 运行 `harness diff` 预览生成的变更。
3. 预览安全时运行 `harness sync`。
4. 避免在 `opencode.jsonc` 中重复模型选择。

## 8. Gate 行为

OpenCode 遵循与文件型工作流相同的 harness gate。

- 非平凡工作在 analysis 完成后、编码前停下。
- 只实现已批准的 slice 或 group。
- 编码后立即 review 同一 slice。
- 进入下一切片前停下，除非当前已选的 gate policy 显式允许安全延续。

Gate policy 与 OpenCode permission mode 分开配置。`balanced` 或 `autonomous` gate 不授予更宽的工具权限，也不绕过危险命令处理。

确切的 gate 规则参照目标项目中安装的 `docs/project/harness-workflow.md`。

## 9. 权限模式

OpenCode permission mode 控制工具和命令的权限摩擦。通过 `harness.config.yaml` 配置：

```yaml
opencode:
  permissionMode: default  # default | moderate | loose
```

模式摘要：

- `default` 保持标准的生成权限姿态。
- `moderate` 减少日常摩擦，同时保留风险警告。
- `loose` 对有经验的本地用户进一步减少摩擦。

Permission mode 不取消危险命令基线。agent 必须仍将强推、历史重写、破坏性删除、release/publish/deploy 操作、全局配置修改、项目外部写入和高风险 shell 链式命令视为高风险。

OpenCode schema 无法表达所有危险的 shell 模式。当 schema 规则不足以覆盖时，harness 依靠提示文本、警告和 review 指引来补充。

## 10. Validator 行为

Validator 角色应使用最小的相关验证命令。

优先顺序：

1. `.task/<task-id>/context-pack.md` 中列出的命令
2. 由改动文件推断的命令
3. 从 docs 或 config 中读取的项目默认值
4. 通用回退检查

验证可包括 build、compile、单元测试、lint、类型检查、smoke check 或文档检查。对于仅文档类的改动，smoke test 通常不需要，除非任务或项目规则有要求。

## 11. 受管所有权与同步

生成的 OpenCode 文件在通过 harness 安装时，会通过 `.harness/manifest.json` 追踪。

对这个 MVP 来说，即使默认姿态是 plugin-first，manifest 所有权和生成文件回退仍然成立。

安全行为：

- 本地编辑被报告，不会静默覆盖
- 缺失的受管文件被报告
- 渲染输入漂移被标记为冲突
- force 式替换必须显式触发

操作说明：

- 如果插件条目和文件条目使用同名，插件条目可能会覆盖文件条目
- 如果显式插件配置与 `.opencode/plugin/` 自动发现同时加载同一个插件，当前原型仍可接受，因为其 config hook 是幂等的
- 当本地 OpenCode CLI 不可用或不支持 `--command` 时，命令 smoke 可能带证据地报告 `NOT_RUN`；但在关闭 MVP 运行时验证工作前，仍应至少在一个具备能力的环境中运行一次 `opencode run --command harness-pathway-prototype`

使用以下流程：

```powershell
harness diff
harness sync
harness doctor
```

一般升级指引见 [docs/GUIDELINES.zh-CN.md](./GUIDELINES.zh-CN.md#11-升级与同步)。

## 12. 隐私与版本管理

在团队决定共享范围前，将 `.opencode/` 视为本地/私有内容。

提交生成或定制的 OpenCode 文件前：

- 删除用户名和绝对本地路径
- 删除 secrets 和内部 URL
- 检查权限设置
- 确认团队希望共享这些 command 和 agent 行为

对于本 framework 仓库自身，请遵循 `.opencode/README.md` 和根目录的 `AGENTS.md`。Self-only 的 OpenCode 文件不得复制到目标项目模板中。
