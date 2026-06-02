# Universal AI Harness Framework 设计文档

[English](./DESIGN.md)

## 1. 定位

Harness 是一套面向软件仓库的文件型协作框架。

它为希望 AI 辅助变得可审查、agent 中立、可安全升级、并通过显式工作流 gate 控制的团队而设计。它不是业务项目模板，不是 IDE 替代品，也不绑定任何单一 agent 产品。

## 2. 设计原则

### 2.1 文件即协作契约

AI 协作中最常见的失败模式不是糟糕的代码生成，而是约束丢失、上下文漂移和范围扩张。

Harness 将关键状态持久化到仓库文件中：

- `AGENTS.md` — 仓库入口行为和流程优先级
- `.aiassistant/rules/*.md` — 可执行约束
- `docs/**/*.md` — 设计知识和边界上下文
- `.task/` — 需求、计划和编码上下文工件
- `.task/active.json` 和任务级 `state.json` — 运行时工作流状态
- `.harness/manifest.json` — 框架 ownership 追踪

因为是普通文件，任何 agent 都能读取。它们可以被审查、版本管理，并在团队间同步。

### 2.2 Skills 是轻量工作流编排

Harness 不使用中心化编排服务器。工作流由小型可复用 skills 组合而成：

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

这保持了框架的可移植性。团队可以用普通提示词、OpenCode 或任何能读取 Markdown 的 agent 环境来运行同一套方法。

### 2.3 Gate 比自动化更重要

Harness 有意将方法论从"agent 一直做下去"升级为"agent 只能通过显式状态迁移前进"。

核心 gate：

- analysis → coding
- 当前已批准 slice → 下一 slice

在同一已批准 slice 内，coding 可直接流转到 review。超出此边界，agent 必须停下。

对高风险工作，`harness-critic` 角色可在 critic gate — 编码前和宣告工作完成前 — 审查 requirements、slices 和 validation plans。

### 2.4 OpenCode 是可选的

Harness core 无需 OpenCode 即可运行。事实来源始终是仓库文件和这套方法本身。

OpenCode 增加体验型脚手架 — slash commands、agent 角色和 validator 模板 — 但不是必需的。

## 3. 设计目标

### 3.1 项目中立

Core templates、skills 和 CLI 默认值不得假设特定业务领域、技术栈、仓库布局、构建工具或 agent 运行时。项目特有知识应放在目标项目的 config、docs、rules 和本地 skills 中。

### 3.2 安全演进

框架必须能演进，但不能悄悄覆盖项目本地工作。CLI 使用 manifest-aware 模型：

- `harness init` 安装受管资产并写入 `.harness/manifest.json`
- `harness diff` 计算写计划，不修改文件
- `harness sync` 默认只更新安全的受管内容
- `AGENTS.md` 按 managed block 同步，保留本地 block
- `harness doctor` 验证已安装的文件契约，不修改项目

### 3.3 最小但持久的流程控制

Harness 只引入控制风险所需的最小流程，不搞仪式感。三层任务分级：

- **Tier S**：平凡低风险改动 — 直接编码和审查
- **Tier M**：标准范围工作 — 编码前完成分析和 context pack
- **Tier L**：复杂或边界敏感工作 — 完整需求、切片、gate 和审查

方法对 gate 迁移严格，但对每个 tier 所需的分析深度保持弹性。

## 4. 资产模型

### Framework-Managed

从本仓库安装，由 `.harness/manifest.json` 追踪：

- `templates/AGENTS.md`、`templates/harness.config.yaml`、`templates/docs/project/*`、`templates/rules/*`
- `skills/*/SKILL.md`
- 按需安装的可选 `.opencode/*` 资产

### Project-Local

归目标仓库团队所有，默认保留：

- 项目专用 docs、rules 和 skills
- `.task/` 工作工件
- `AGENTS.md` 的本地块
- 未被框架标准化的本地 `.opencode/` 定制
- 所有不在 manifest 中的文件

### `AGENTS.md` 分区 Ownership

`AGENTS.md` 使用 managed-block 标记，让框架能演进通用块，同时保留项目本地块可编辑：

```html
<!-- harness-kit:start -->
...
<!-- harness-kit:end -->

<!-- project-local:start -->
...
<!-- project-local:end -->
```

## 5. 工作流模型

### 先分析再编码

非平凡任务不从编码起步。它们从分类和工件创建开始：`requirement.md`、`implementation-plan.md`、`context-pack.md` 和 `state.json`。

### 基于切片的执行

复杂工作被拆分为小切片。每个切片定义 goal、allowed scope、forbidden scope、validation 和 done criteria。审批、编码和审查的最小单元保持小。

### 同切片审查

Review 不是未来某个独立阶段 — 它属于同一个执行单元。实现、验证并审查同一个已批准 slice，然后在 slice gate 停下。

### 并行是可选项

方法允许声明并行能力的 slices 或 groups，但回退始终是顺序执行。并行是优化，不是前提条件。

## 6. 知识模型

Harness docs 服务于设计知识，不是源码索引。

文档捕捉设计意图、架构方向、工作流、领域概念、扩展点、边界和风险区域。它们不捕捉文件树、类清单、函数清单或调用点索引。用 IDE 工具或本地搜索做代码导航。

Rules 约束行为。Docs 解释含义。Framework 两者都保留，但严格分离。

上下文路由保持文件化：

- 从 `docs/project/knowledge-map.md` 开始
- 按 area 字段匹配（Areas、Tags、Docs、Rules、Read When、Boundaries、Validation）
- 当目标路径已知时，向上查找就近的 `MODULE_RULES.md`、`AGENTS.md` 和 `HARNESS_RULES.md`

## 7. CLI 模型

CLI 是文本资产安装器和同步器。它将框架模板渲染到目标项目，检测安全与不安全的更新，并默认保护项目本地内容。它不管理业务知识、二进制资产或自动冲突解决。

## 8. OpenCode 集成（可选）

启用后，框架安装项目本地脚手架：slash commands、含各角色独立模型配置的 agent 角色定义、validator guidance 和 `opencode.jsonc`。

多 agent 角色的主要设计价值是模型分层 — 把最强模型分配给分析和规划，性价比模型分配给编码和 review，最便宜的可靠模型分配给工具型任务。

详见 [docs/OPENCODE.zh-CN.md](./OPENCODE.zh-CN.md) 的实用指南。

## 9. 非目标

框架不追求：

- 替代 IDE 导航
- 生成详尽的代码索引
- 规定单一技术栈
- 接管项目私有业务知识
- 默认删除项目本地文件
- 自动解决 manifest 冲突
- 把方法绑定到单一 agent 供应商
