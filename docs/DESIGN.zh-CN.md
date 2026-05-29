# Universal AI Harness Framework 设计文档

[English](./DESIGN.md)

## 1. 定位

Universal AI Harness Framework 是一套面向软件仓库的文件型 AI 协作框架。

它适用于希望把 AI 协作变成以下形态的团队：

- 关键状态落在普通仓库文件里，便于检查
- 不依赖单一 agent 产品，便于迁移
- 可以持续升级，且不破坏本地内容
- 通过明确 gate 控制阶段切换

它不是某个业务项目的模板，不是 IDE 替代品，也不是某一个 agent 运行时的专用插件。

## 2. 设计主张

这套 framework 建立在四个核心观点上。

### 2.1 文件即协作契约

AI 协作里最常见的失败点，不是代码生成本身，而是约束丢失、上下文漂移和范围悄悄扩张。

因此 harness 把关键协作状态沉淀到仓库文件：

- `AGENTS.md` 定义仓库级入口行为和流程优先级
- `.aiassistant/rules/*.md` 定义可执行约束
- `docs/**/*.md` 解释设计知识和边界上下文
- `.task/` 保存需求、计划和编码上下文工件
- `.task/active.json` 和任务级 `state.json` 保存当前工作流状态
- `.harness/manifest.json` 记录 framework-managed ownership

因为这些都是普通文件，所以它们可以被审查、版本管理、同步，也可以被不同 agent 反复读取。

### 2.2 Skills 是轻量工作流编排

Harness 不依赖中心化编排服务。

它通过一组职责清晰的小 skill 来组合 workflow：

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

这样设计的好处是可移植。团队既可以用普通提示词运行这套方法，也可以接入 OpenCode，或者在任何能读取 Markdown 上下文的 agent 环境里复用它。

### 2.3 Gate 比自动化更重要

这套 framework 的方法论升级点，是把“agent 一路做完”改造成“agent 只能沿着明确状态迁移前进”。

核心 gate 只有两个：

- analysis -> coding
- 当前已批准的 slice 或已批准并行 group -> 下一 slice 或 group

在同一已批准 slice 内，coding 可以直接流转到 review；超出这个边界，agent 必须停下。

这种 gate 模型让人工确认聚焦在真正发生范围变化和风险变化的节点上。

对于 Tier L 或其他高风险工作，还可以引入专门的 `harness-critic` 角色，在编码前以及宣告已批准工作完成前，审查 requirement、slices、context pack 和 validation plan。critic 的职责是加强 gate，而不是提供编码授权。

### 2.4 OpenCode 是可选脚手架

Harness core 必须在没有 OpenCode 的情况下也能正常工作。

可选 OpenCode 资产的作用是改善使用体验，例如提供 slash commands、本地 agent 角色和 validator 脚手架。它们是推荐项，但不是 framework 的事实来源。

真正的事实来源仍然是仓库文件和 harness 方法本身。

### 2.5 设计记录：OpenCode 模型与权限放置

OpenCode 在多个位置支持操作级 agent 设置：`.opencode/agents/*.md` 下的基于文件的 agent frontmatter，以及 `opencode.jsonc` 中的内联 agent 配置。harness 有意将生成的目标项目 agent 文件保留为当前的渲染运行时产物，同时将模型选择策略移至 `.harness/model-profiles.yml`。

当前决策：

- `.harness/model-profiles.yml` 是模型 profile 选择的权威 harness 来源。
- `templates/opencode/agents/*.md` 仍作为生成 OpenCode agent prompt、frontmatter 和权限默认值的源模板。
- 目标项目的 `.opencode/agents/*.md` 仍是由 `harness init --with-opencode` 生成、并由 manifest-aware sync 更新的具体 OpenCode 运行时文件。
- `opencode.jsonc` 仍为项目级 OpenCode 配置，目前 harness 用它进行插件等共享运行时设置。
- 模型或权限漂移应由 `harness doctor` 检测并报告，不应被静默覆盖。

设计理由：

- Agent markdown 将 prompt 文本、model、mode 和权限默认值保存在一个可审查的文件中。
- Manifest-aware sync 已能安全管理 `.opencode/agents/*.md`，并可检测本地修改。
- `.harness/model-profiles.yml` 消除了模型 ID 的主要重复风险，且无需立即迁移 OpenCode 配置。
- 将全部模型和权限设置移入 `opencode.jsonc` 会导致操作设置与 prompt 文本分离，需要一个全新的合并/冲突模型，且有覆盖团队本地 OpenCode 配置的风险。

短期建议：将模型和权限字段保留在生成的 agent markdown 中，从 `.harness/model-profiles.yml` 渲染模型值，并通过 doctor 诊断检测漂移。

长期方向：考虑未来可选的适配器层，可为偏好中央 OpenCode 配置的团队渲染等效的内联 `opencode.jsonc` agent 配置。该迁移必须是显式的、可通过 `harness diff` 预览的、可逆的、且有冲突报告保护。不应作为隐式同步行为引入。

## 3. 设计目标

### 3.1 项目中立

Core templates、skills 和 CLI 默认行为必须保持项目中立。

Framework 不应假设：

- 某个业务领域
- 某种技术栈
- 某种仓库布局
- 某个构建工具
- 某个验证命令
- 某种 agent 运行时

项目差异应落到目标项目自己的 config、docs、rules、`AGENTS.md` 本地块和本地 skills 中。

### 3.2 安全演进

Framework 必须能持续演进，但不能悄悄覆盖项目本地工作。

因此 CLI 采用 manifest-aware 模型：

- `harness init` 安装 managed 资产并写入 `.harness/manifest.json`
- `harness diff` 只计算计划，不修改文件
- `harness sync` 默认只更新安全的 managed 内容
- `AGENTS.md` 通过 managed block 同步，保留本地 block
- `--force` 只作用于 framework-managed 资产
- `harness doctor` 验证已安装的文件契约，不修改项目

### 3.3 最小但持久的流程控制

Framework 应该只引入控制风险所需的最小流程，而不是把所有任务都变成高仪式感流程。

因此它采用三层任务分级：

- Tier S：低风险小任务
- Tier M：需要分析和 context pack 的标准任务
- Tier L：需要切片和明确 gate 的复杂或边界敏感任务

这套方法对状态迁移很严格，但对分析深度保持弹性。

## 4. 资产模型

### 4.1 Framework-Managed 资产

Framework-managed 资产来自本仓库，并通过 `.harness/manifest.json` 跟踪。

包括：

- `templates/AGENTS.md`
- `templates/harness.config.yaml`
- `templates/docs/project/*`
- `templates/rules/*`
- `skills/*/SKILL.md`
- 按需安装的可选 `.opencode/*` 资产

### 4.2 Project-Local 资产

Project-local 资产归目标仓库团队所有。

包括：

- 项目专用 docs
- 项目专用 rules
- 项目专用 skills
- `.task/` 下的工作工件
- `AGENTS.md` 的本地区域
- 未被 framework 标准化的本地 `.opencode/` 定制
- 所有不在 manifest 中的文件

默认规则是：除非能够明确证明安全，否则保留本地工作。

### 4.3 `AGENTS.md` 的分区 ownership

`AGENTS.md` 同时包含 framework-managed 和 project-local 两块：

```html
<!-- harness-kit:start -->
...
<!-- harness-kit:end -->

<!-- project-local:start -->
...
<!-- project-local:end -->
```

这样 framework 就能持续演进仓库级 workflow 指南，同时保留团队自己的本地行为定义。

当 `harness init` 遇到目标 `AGENTS.md` 中没有 managed-block 标记时，会将现有全部内容包裹在 `project-local-imported` 标记块中，并在其上方插入 framework managed block。后续 sync 只替换 managed block；project-local 内容（包括导入的和常规的 local block）都会被保留。

### 4.4 Manifest 与 Sync 语义

`.harness/manifest.json` 记录每个受管文件及其安装时的 hash。sync 时会为每个文件计算四态状态：

- `unchanged`：本地和 framework 自上次安装后均未变化
- `update`：framework 变化，本地未变化 — 安全覆盖
- `modified-local`：本地变化，framework 未变化 — 默认保留
- `conflict`：本地和 framework 都变化了 — 默认保留
- `missing`：manifest 中有记录但磁盘上缺失 — 重新安装

`--force` 会覆盖 `modified-local` 和 `conflict` 状态，使用 framework 版本。使用 force 时 manifest 记录 framework hash；不使用时保留之前的 hash。

framework 中不再存在的受管文件会被报告为 `orphan-managed`，不会被自动删除。

## 5. Workflow 模型

### 5.0 任务状态契约

Harness 使用两个 JSON 文件作为运行时状态契约：`.task/active.json` 和 `.task/<task-id>/state.json`。

字段 schema 的 canonical 定义放在安装到目标项目的 workflow 文档中：`templates/docs/project/harness-workflow.md`，执行 `harness init` 后对应为 `docs/project/harness-workflow.md`。

框架维护文档解释这套契约为什么存在；目标项目 workflow 文档定义 agent 必须读写的具体字段。

### 5.1 先分析，再编码

非平凡任务不能直接从 coding 开始。

它们应先经过分类、边界读取和任务工件创建。

根据任务情况，analysis 阶段可能产出：

- `.task/active.json`
- `.task/<task-id>/requirement.md`
- `.task/<task-id>/implementation-plan.md`
- `.task/<task-id>/context-pack.md`
- `.task/<task-id>/state.json`

这些文件把对话中的意图转换成可执行的仓库状态。

旧的 `.task/context-pack.md` 可以作为迁移回退路径读取，但新工作应使用活跃任务目录。

### 5.2 基于切片的执行

复杂任务需要被拆成更小的实现切片，这样审批、编码、验证和审查的最小单元才会足够小。

每个 slice 至少应定义：

- goal
- allowed scope
- forbidden scope
- validation
- done criteria

这让 framework 倾向于可审查增量，而不是无限放大的 agent 自主执行。

### 5.3 同切片即时审查

Review 不是未来某个独立阶段，而是当前执行单元的一部分。

Harness 期望的顺序是：

1. 实现当前已批准 slice
2. 验证当前已批准 slice
3. 审查当前已批准 slice
4. 在 slice gate 停下

如果 review 返回 `BLOCKED`，agent 可以只做最小的 slice-local 修复并重试，总计最多 3 次。

### 5.4 并行是可选能力，不是基础假设

方法论允许在复杂任务里声明 `parallel-capable` slices 或 groups，但并行执行是可选的，并且取决于 agent 能力。

始终存在的回退模型是按依赖顺序串行执行。

这样就不会把某些高级运行时能力变成 framework 自身的前提条件。

## 6. 知识模型

Harness docs 是设计知识，不是源码索引。

文档应沉淀：

- 设计意图
- 架构方向
- 工作流和状态迁移
- 领域概念
- 扩展点
- 边界和风险区域
- 兼容与迁移含义

文档不应沉淀：

- 文件树
- 类或函数清单
- 调用点索引
- 机械式实现列表

Rules 的职责是约束行为，docs 的职责是解释含义。Framework 同时保留两者，但严格分离。

上下文路由也应保持文件化且最小化：

- 先从 `docs/project/knowledge-map.md` 开始
- 使用通用 area 字段进行匹配，如 `Areas`、`Tags`、`Docs`、`Rules`、`Read When`、`Boundaries`、`Validation`
- 当目标路径已知时，再向上查找就近的 `MODULE_RULES.md`、`AGENTS.md` 和 `HARNESS_RULES.md`
- 在 task context pack 中记录已加载和已排除的来源，而不是默认加载全部 docs

## 7. CLI 模型

当前 CLI 的职责是安装和同步文本型资产。

它负责：

- 将 framework 模板渲染到目标项目
- 判断哪些更新安全、哪些不安全
- 默认保护项目本地内容
- 按需安装可选 OpenCode 脚手架

它故意保持窄范围，不负责业务知识管理、二进制资产处理或自动冲突解决。

## 8. 可选 OpenCode 集成

OpenCode 支持被有意设计为次级能力。

当团队启用 `--with-opencode` 时，framework 会安装项目本地脚手架，例如：

- 起始 slash commands
- 本地 agent 角色定义，每个角色可独立绑定模型
- validator guidance
- 带项目级调度启用配置的 `opencode.jsonc`

`harness-builder` 仍是主编排者。其核心职责是状态读取、gate 决策、subagent 路由、结果汇总和 gate 处的人工确认。深度分析、实现、review 和验证应委托给边界明确的角色。

这组委托角色也可以包括用于 critic-gated 工作的 `harness-critic`，以及在任何实现开始前先走 `/harness-incident`、`incident-pack-builder`、`hypothesis-critic` 的证据优先 incident 支持链路。

模型选择基于 profile 驱动。`harness.config.yaml` 定义了名为 `think`、`build`、`review` 和 `run` 的稳定 profiles；可选 OpenCode agent 文件从这些 profiles 渲染具体的模型值。

多 agent 角色的设计价值不是并行，而是模型分层：把最强模型分配给分析和规划，把性价比模型分配给编码和 review，把最便宜的可靠模型分配给 indexer 和 validator 这类工具型任务。

这些能力会显著提升日常使用效率，尤其适合重复执行 harness flow 的场景。但 framework 本身必须在没有它们的情况下也可理解、可使用。

## 9. 非目标

这套 framework 不追求：

- 替代 IDE 导航
- 生成完整代码索引
- 规定唯一工程技术栈
- 接管项目私有业务知识
- 默认删除项目本地文件
- 自动解决 manifest 冲突
- 把方法绑定到单一 agent 供应商

这些非目标保证了 framework 的可迁移性和可维护性。
