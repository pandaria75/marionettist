# OpenCode 与 Marionettist

[English](./OPENCODE.md)

本指南是 `marionettist init --with-opencode` 安装的可选 OpenCode 集成的主参考页。

OpenCode 改善体验，但不替代 Marionettist 工作流。仓库文件、任务工件和 gate 仍然是事实来源。

当你需要了解 OpenCode 特有的设置或使用细节时，请优先阅读本页，例如 package 与 local 插件来源、命令面、生成式回退文件、模型 profiles、权限、验证、同步以及隐私建议。

导航说明：

- 主文档入口见 [docs/README.md](./README.md)
- Pathway 相关背景见 [docs/pathways/README.md](./pathways/README.md)
- 更短的安装与使用路径见 [docs/user-guide/README.md](./user-guide/README.md)

## 1. OpenCode 增加了什么

- **Slash commands**，如 `/marionettist`、`/marionettist-dev`、`/marionettist-docs`。
- **角色 agent**，用于 builder、planner、coder、reviewer、critic、indexer 和 validator 工作。
- **模型 profiles**，使每个角色可使用恰当的模型层级。
- **Validator 指引**，用于 build、test、lint 和 smoke-check 工作流。
- **本地权限姿态**，通过生成的 OpenCode agent 文件实现。

这套支持是可选的。即使不使用 OpenCode，团队仍可通过文件和提示词使用 Marionettist。

当前默认姿态：

- 新安装默认通过 `marionettist-pathway-opencode` 采用 package-first 的 OpenCode 插件用法
- 本仓库中的打包 source 位于 `distributions/opencode/`
- package-first 安装使用 `marionettist-pathway-opencode` 的包路径，而本仓库仍然是该打包资产的源码来源
- 也可通过 `opencode.pluginSource: local` 使用仓库本地回退方案

重要边界：

- 将 `docs/OPENCODE.zh-CN.md` 视为给人阅读的参考页
- 将生成的 `.opencode/**` 文件视为已安装资产，而不是 framework 维护时的文档源码
- 对当前 framework 仓库自身，请使用 `marionettist self init --apply --with-opencode`，不要在这里使用普通 target-project init

## 2. 安装

先安装 Marionettist CLI。然后在你希望启用 OpenCode 的目标项目中使用以下命令。

```powershell
# 先预览
marionettist init --dry-run --with-opencode

# 安装 OpenCode 脚手架
marionettist init --with-opencode

# 可选的命令面
marionettist init --with-opencode --opencode-command-surface minimal
marionettist init --with-opencode --opencode-command-surface standard
marionettist init --with-opencode --opencode-command-surface advanced
```

对于当前这个 framework 仓库自身，请使用 `marionettist self init --apply --with-opencode`，而不是普通的 target-project init。

推荐顺序：

1. 如果仓库尚未初始化，先完成基础 Marionettist 安装
2. 需要可选 OpenCode 能力时，再加上 `--with-opencode`
3. 若团队还未明确需要更多 wrapper，优先从 `minimal` 开始

如果你希望使用仓库本地生成的插件路径，而不是 package 默认值，可设置：

```yaml
opencode:
  pluginSource: local  # package | local
```

也可在项目配置中设置命令面：

```yaml
opencode:
  commandSurface: minimal  # minimal | standard | advanced
```

旧值 `full` 仍可作为 `advanced` 的兼容别名。

如果其他文档只简短提到 OpenCode，详细设置应优先回链到本页，而不是在多个 onboarding 页面中重复片段。

## 3. 安装了什么

典型的 OpenCode 资产：

- `opencode.jsonc`
- `.opencode/README.md`
- `.opencode/plugin/opencode-tasks.js`
- `.opencode/commands/marionettist*.md`
- `.opencode/agents/marionettist-*.md`
- `.opencode/agents/validators/**`

这些是受管默认值。团队可自行决定哪些需要提交、哪些保留本地。

当前 MVP 姿态：

- `opencode.pluginSource: package` 是新安装的默认值
- `opencode.pluginSource: local` 会保留仓库本地插件路径 `./.opencode/plugin/opencode-tasks.js`
- 生成的 `.opencode/agents/**` 和 `.opencode/commands/**` 文件仍然是受支持的回退资产
- 框架 source 现在以 `templates/pathways/opencode/**` 作为 OpenCode Pathway 唯一源；`distributions/opencode/**` 是由该源生成并检查的 package staging；`templates/opencode/**` 已移除且不再使用

不要把这些生成式回退文件当作更新 framework 行为的地方。在本 framework 仓库中，应编辑真正的 framework source，再重新生成，而不是直接修改生成镜像。

使用 `marionettist diff`、`marionettist sync` 和 `marionettist doctor` 检查漂移和安全更新。若重新生成了 `opencode.jsonc`、切换了插件来源，或更新了 `.opencode/plugin/**`，而当前会话没有自动重载配置，请重启或重新加载 OpenCode。

## 4. 命令面

| 命令面 | 命令 | 适用场景 |
| --- | --- | --- |
| `minimal` | `/marionettist`、`/marionettist-dev`、`/marionettist-incident`、`/marionettist-docs`、`/marionettist-config` | 默认的 builder-first 工作流 |
| `standard` | minimal 外加 `/marionettist-context`、`/marionettist-status`、`/marionettist-continue` | 团队需要显式的状态和继续命令 |
| `advanced` | standard 外加 `/marionettist-feature`、`/marionettist-bugfix`、`/marionettist-refactor` | 团队想按任务类型使用专用 wrapper |

大多数团队应从 `minimal` 开始。builder 可以从 `/marionettist` 路由自然语言请求。

## 5. 主要命令

| 命令 | 用途 |
| --- | --- |
| `/marionettist` | 默认入口。分类请求并路由工作流。 |
| `/marionettist-dev` | 功能或实现工作。 |
| `/marionettist-incident` | 紧急 incident 或缓解工作。 |
| `/marionettist-docs` | 文档、规则或知识工作。 |
| `/marionettist-config` | Marionettist、工作流、工具或 agent 配置工作。 |
| `/marionettist-status` | 查看当前任务状态，不修改文件。 |
| `/marionettist-continue` | 按记录的状态继续活跃任务。 |

## 6. Agent 角色

| Agent | 职责 | Profile |
| --- | --- | --- |
| `marionettist-builder` | 编排工作流，读取状态，执行 gate，委派有边界的子任务。 | `think` |
| `marionettist-planner` | 规划需求、切片、验证和依赖顺序。 | `think` |
| `marionettist-coder` | 只实现已批准的 slice 或 group。 | `build` |
| `marionettist-reviewer` | 审查 diff 的范围、边界、验证和文档同步。 | `review` |
| `marionettist-critic` | 对高风险工作在编码前或完成前审查风险 gate。 | `review` |
| `marionettist-indexer` | 执行只读仓库探索。 | `run` |
| `marionettist-validator` | 运行或解读验证命令。 | `run` |

Builder 负责编排。子 agent 应接收有边界的输入并返回紧凑的证据。

## 7. 模型 Profiles

OpenCode agent 的模型值从项目本地的模型 profile 设置渲染。对当前安装而言，`.marionettist/model-profiles.yml` 是主要路径。Legacy 的 `harness.config.yaml` 引用只应出现在迁移语境中。

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

1. 编辑 `.marionettist/model-profiles.yml`。
2. 运行 `marionettist diff` 预览生成的变更。
3. 预览安全时运行 `marionettist sync`。
4. 如果项目本地 model profiles 已定义模型选择，就避免在 `opencode.jsonc` 等生成式 OpenCode 文件中重复配置。

当项目本地存在 `.marionettist/model-profiles.yml` 时，包提供的 agent 默认值仍优先使用它。

对于当前 framework 仓库，请把自维护行为保留在 self-profile source 中，而不是放进生成的 `.opencode/**` 镜像里。

## 8. Gate 行为

OpenCode 遵循与文件型工作流相同的 Marionettist gate。

- 非平凡工作在 analysis 完成后、编码前停下。
- 只实现已批准的 slice 或 group。
- 编码后立即 review 同一 slice。
- 进入下一切片前停下，除非当前已选的 gate policy 显式允许安全延续。

Gate policy 与 OpenCode permission mode 分开配置。`balanced` 或 `autonomous` gate 不授予更宽的工具权限，也不绕过危险命令处理。

确切的 gate 规则参照目标项目中安装的 `docs/project/marionettist-workflow.md`。

## 9. 权限模式

OpenCode permission mode 控制工具和命令的权限摩擦。通过 `marionettist.config.yaml` 配置：

```yaml
opencode:
  permissionMode: default  # default | moderate | loose
```

模式摘要：

- `default` 保持标准的生成权限姿态。
- `moderate` 减少日常摩擦，同时保留风险警告。
- `loose` 对有经验的本地用户进一步减少摩擦。

Permission mode 不取消危险命令基线。agent 必须仍将强推、历史重写、破坏性删除、release/publish/deploy 操作、全局配置修改、项目外部写入和高风险 shell 链式命令视为高风险。

OpenCode schema 无法表达所有危险的 shell 模式。当 schema 规则不足以覆盖时，Marionettist 依靠提示文本、警告和 review 指引来补充。

## 10. Validator 行为

Validator 角色应使用最小的相关验证命令。

优先顺序：

1. `.task/<task-id>/context-pack.md` 中列出的命令
2. 由改动文件推断的命令
3. 从 docs 或 config 中读取的项目默认值
4. 通用回退检查

验证可包括 build、compile、单元测试、lint、类型检查、smoke check 或文档检查。对于仅文档类的改动，smoke test 通常不需要，除非任务或项目规则有要求。

## 11. 受管所有权与同步

生成的 OpenCode 文件在通过 Marionettist 安装时，会通过 `.marionettist/manifest.json` 追踪。

对这个 MVP 来说，即使默认姿态是 plugin-first，manifest 所有权和生成文件回退仍然成立。

安全行为：

- 本地编辑被报告，不会静默覆盖
- 缺失的受管文件被报告
- 渲染输入漂移被标记为冲突
- force 式替换必须显式触发

OpenCode 插件来源说明：

- 当 Marionettist 需要把 `opencode.pluginSource` 渲染到 `marionettist.config.yaml` 时，sync 可能会把该配置文件报告为 `conflict`，而不是 `modified-local`
- 在应用前先 review diff；当受管渲染输入变化时，这属于预期行为
- 旧的生成式安装不会被自动迁移到新的 package 默认值

操作说明：

- 同名的本地 commands 或 agents 会覆盖插件提供的同名条目
- 如果显式插件配置与 `.opencode/plugin/` 自动发现同时加载注入同一个 Marionettist surface 的 source，当前原型仍可接受，因为其 config hook 是幂等的
- 当本地 OpenCode CLI 不可用或不支持 `--command` 时，命令 smoke 可能带证据地报告 `NOT_RUN`；但在关闭 MVP 运行时验证工作前，仍应至少在一个具备能力的环境中运行一次 `opencode run --command marionettist-pathway-prototype`

当其他文档对 OpenCode 只保留简短说明时，通常应回链到本页，而不是重复这些所有权和同步细节。

迁移建议：

1. 保留用户自有的自定义 `.opencode` 内容
2. 先卸载或移除旧的生成式 OpenCode 集成
3. 启用 package 插件路径
4. 仅保留你仍然需要的本地覆盖
5. 重启或重新加载 OpenCode

使用以下流程：

```powershell
marionettist diff
marionettist sync
marionettist doctor
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
