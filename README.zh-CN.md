# 通用 AI Harness 框架

[English](./README.md)

一套面向仓库级 AI 协作的可复用文件型 harness。

它通过以下文件为项目提供可持续的协作契约：

- `AGENTS.md` 作为仓库级入口说明
- `.aiassistant/rules/*.md` 作为可执行约束
- `docs/**/*.md` 作为设计知识与路由
- `.task/` 作为需求、计划、上下文工件目录
- `skills/*/SKILL.md` 作为轻量工作流编排能力
- `.harness/manifest.json` 作为安全升级依据
- 可选 `.opencode/` 作为命令与 agent 自动化脚手架（外加项目根目录的 `opencode.jsonc`）

## 适用对象

- 维护模板、skills 和 CLI 的框架维护者
- 通过 `harness init` 接入项目的团队
- 日常与 agent 协作的一线开发者

## 这套 Harness 是什么

它不是单纯的代码生成器，也不是绑定某一个 agent 产品的插件。

它向项目安装一组最小但关键的仓库文件，让 AI 协作变得可审查、可复现、可升级。

核心思想只有五条：

1. 把长期有效的约束和知识落到文件里。
2. 让 agent 先分析，再编码。
3. 只有基于明确任务工件时才允许编码。
4. 每个实现切片完成后立即审查同一切片。
5. 在跨阶段或跨切片前停在 gate。

设计模型见 [docs/DESIGN.zh-CN.md](./docs/DESIGN.zh-CN.md)，日常用法见 [docs/GUIDELINES.zh-CN.md](./docs/GUIDELINES.zh-CN.md)。

## 核心工作流

Harness 工作流本质上是一套由 skills 组成的轻量编排模型：

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

流程会按任务复杂度裁剪：

- Tier S：低风险小改动，直接编码并审查
- Tier M：编码前完成分析并生成任务级 `.task/<task-id>/context-pack.md`
- Tier L：完整需求冻结、切片、gate 与审查流程

最关键的规则是 gate 机制：

- analysis 完成后必须停下，再决定是否进入 coding
- 每个已批准 slice 或已批准并行 group 完成后必须停下
- coding 只允许自动流转到同一 slice 或 group 的 review，不得自动进入下一阶段

## 本地开发安装

### 从 GitHub 安装

```powershell
npm install -g github:pandaria75/universal-ai-harness-framework
```

然后在任意目标项目中：

```powershell
harness init
```

升级到最新版本：

```powershell
npm install -g github:pandaria75/universal-ai-harness-framework#master
```

### 从本地仓库安装

在本仓库中：

```powershell
npm link
```

然后在任意目标项目中：

```powershell
harness init
```

如果不 link，也可以直接运行 CLI：

```powershell
node /path/to/universal-ai-harness-framework/bin/harness.js init --project .
```

Windows 示例：

```powershell
node C:\path\to\universal-ai-harness-framework\bin\harness.js init --project .
```

## 常用命令

初始化项目：

```powershell
# 预览将要安装的内容
harness init --dry-run

# 完整的交互式初始化
harness init

# 使用默认值的非交互式初始化
harness init --auto

# 非交互式初始化，覆盖已有受管文件
harness init --auto --force
```

当 `harness init` 检测到已有文件时，会对每个文件提示冲突策略：备份（重命名为 `.bak`）、覆盖、或跳过。使用 `--auto` 可跳过交互提示，默认跳过所有已有文件；配合 `--force` 则会覆盖所有已有受管文件。

使用推荐的 OpenCode 脚手架初始化：

```powershell
harness init --dry-run --with-opencode
harness init --with-opencode
```

这个命令用于普通目标项目。不要在本 framework 仓库里用普通 `harness init` 做自举。

为维护本 framework 仓库初始化 OpenCode 文件：

```powershell
harness self init --with-opencode
harness self init --apply --with-opencode
```

self OpenCode 文件和目标项目 OpenCode 模板是两套边界。self 文件生成在本仓库根目录，仅服务于 framework 维护。目标项目 OpenCode 模板仍位于 `templates/opencode/`，只由普通目标项目的 `harness init --with-opencode` 安装。

当本 framework 仓库启用 self OpenCode 后，根目录 `.opencode/` 会同时包含两类文件：

- 用于维护本仓库的 framework self-only OpenCode 文件
- 从 `templates/opencode/**` 复制出来的本地运行态镜像

预览框架受管变更：

```powershell
harness diff
```

应用安全的框架受管更新：

```powershell
harness sync
harness sync --dry-run

# 用框架版本覆盖本地修改的受管文件
harness sync --force
```

诊断目标项目的 harness 安装状态：

```powershell
harness doctor
```

`harness doctor` 检查 config、受管 `AGENTS.md` block、manifest、rules、knowledge map、workflow 文档、`.task` 目录、可选 OpenCode 模板、skill frontmatter、模型 profiles 和当前活跃任务指针。

## 任务状态

非平凡任务按任务维度隔离。活跃任务由 `.task/active.json` 选定，持久化任务状态保存在 `.task/<task-id>/state.json`。

新的 context pack 应写入 `.task/<task-id>/context-pack.md`。旧的 `.task/context-pack.md` 仅作为迁移回退路径。安装到目标项目的 `docs/project/harness-workflow.md` 定义 task state contract。

## 模型 Profiles

`harness.config.yaml` 定义了稳定的模型 profiles：`think`、`build`、`review` 和 `run`。

Skills 声明能力需求，如 `reasoning`、`coding`、`reflective` 或 `utility`。OpenCode agent 文件可能渲染具体的 `model` 字段，但这些值来自配置的 profiles，而不是在各个 skill 内部独立选择。

## `harness init` 会安装什么

核心资产：

- `AGENTS.md`
- `harness.config.yaml`
- `docs/project/harness-workflow.md`
- `docs/project/knowledge-map.md`
- `.aiassistant/rules/*.md`
- `.agents/skills/*/SKILL.md`
- `.task/`
- `.harness/manifest.json`

使用 `--with-opencode` 时的可选 OpenCode 资产：

- `opencode.jsonc`（项目根目录）
- `.opencode/commands/*.md`
- `.opencode/agents/*.md`
- `.opencode/README.md`

Framework 自举使用不同命令和不同内容：

- `harness self init --apply --with-opencode`
- 根目录 `opencode.jsonc`
- `.opencode/commands/harness-self-*.md`
- `.opencode/agents/harness-framework-*.md`
- `.opencode/agents/harness-*.md` 下的 generated mirror
- `.opencode/agents/validators/**` 下的 generated mirror
- `.opencode/commands/harness-*.md` 下的 generated mirror

这些 self 文件只用于维护 framework 本体，不得混入 `templates/AGENTS.md`、`templates/opencode/` 或 `skills/`。

`templates/opencode/**` 仍然是目标项目 OpenCode agents 和 commands 的唯一源头。如果要修改标准 harness builder/coder/planner/reviewer/validator 或 harness slash commands，应修改 `templates/opencode/**`，然后执行：

```powershell
harness self init --apply --with-opencode
harness self doctor
```

不要直接编辑根目录 `.opencode/agents/harness-*.md`、`.opencode/agents/validators/**` 或 `.opencode/commands/harness-*.md` 这些 generated mirror。

## 受管内容与本地内容

这套框架的设计目标之一，是在持续演进的同时不夺走项目本地内容的 ownership。

Framework-managed 内容记录在 `.harness/manifest.json` 中。

以下 project-local 内容默认保留：

- 项目专用 docs
- 项目专用 rules
- 项目专用 skills
- `.task/` 下的任务工件
- `AGENTS.md` 中的 `project-local` 区域
- 你选择不标准化的本地 `.opencode/` 定制

`harness diff` 只展示计划，不写文件。

`harness sync` 只更新可以证明安全的内容；如果发现本地改动或冲突，会报告而不是默认覆盖。

## 可选 OpenCode

OpenCode 是可选的，不是核心依赖。

Harness 的核心能力基于仓库文件、普通提示词和已安装 skills，本身就可以运行。这是第一原则。

推荐启用 OpenCode 有两个原因：

1. **模型分层。** 多 agent 角色各自独立绑定模型，让每类工作都用最适合的模型。强模型做需求分析和任务规划。性价比模型做编码和 review。便宜快模型做 indexer 和 validator 等工具型工作。
2. **更快的执行效率。** 可复用 slash commands、本地 agent 角色和 validator 脚手架能减少重复提示词的开销。

启用后安装的是可编辑的本地脚手架，不是固定死的产品行为。团队可以按自己的模型、权限和验证方式继续调整。

在本 framework 仓库中，应改用 `harness self init --apply --with-opencode`。它生成 self-only 的 OpenCode commands 和 agents，用于维护 `src/commands`、`src/core`、`templates` 和 `skills`，同时保持 framework 维护规则与目标项目模板隔离。

适合提交进 git 的 framework self OpenCode 文件有：

- `opencode.jsonc`
- `.opencode/README.md`
- `.opencode/agents/harness-framework-*.md`
- `.opencode/commands/harness-self-*.md`

不应作为源头直接维护的 generated mirror 文件有：

- `.opencode/agents/harness-builder.md`
- `.opencode/agents/harness-coder.md`
- `.opencode/agents/harness-indexer.md`
- `.opencode/agents/harness-planner.md`
- `.opencode/agents/harness-reviewer.md`
- `.opencode/agents/harness-validator.md`
- `.opencode/agents/validators/**`
- `.opencode/commands/harness-bugfix.md`
- `.opencode/commands/harness-context.md`
- `.opencode/commands/harness-continue.md`
- `.opencode/commands/harness-docs.md`
- `.opencode/commands/harness-feature.md`
- `.opencode/commands/harness-refactor.md`
- `.opencode/commands/harness-status.md`

详见 [docs/OPENCODE.zh-CN.md](./docs/OPENCODE.zh-CN.md)。

## 知识策略

Harness 文档是为设计知识服务的，不是为代码索引服务的。

文档应解释：

- 职责
- 行为
- 工作流
- 领域概念
- 边界
- 扩展点
- 风险区域

文档不应变成：

- 文件树
- 类清单
- 函数清单
- 调用点索引
- 机械式源码地图

代码导航应交给 IDE、本地搜索或直接源码检查。

## 可发布性

所有可复用框架资产都必须经过脱敏，避免携带项目私有或机器私有信息。

不要发布：

- 个人用户名
- 工作站绝对路径
- secrets 或 tokens
- 内部 URL
- 从源项目复制来的品牌化默认值

## 框架自举 Profile

当前仓库是框架源码仓库，不是普通 target project。维护自身时使用 `harness self init`、`harness self doctor` 和 `harness self test`。

- `.harness/self/` 是版本化 self profile。
- `.harness-self/` 是可删除的本地运行态和 sandbox 输出。
- `fixtures/` 存放版本化 sandbox 输入。
- `templates/` 和 `skills/` 是可发布源资产，不能写入 self-only 规则。

## 验证

运行：

```powershell
npm run smoke
npm run self:smoke
```
