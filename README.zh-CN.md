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
- 可选 `.opencode/` 作为命令与 agent 自动化脚手架

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
- Tier M：编码前完成分析并生成 `.task/context-pack.md`
- Tier L：完整需求冻结、切片、gate 与审查流程

最关键的规则是 gate 机制：

- analysis 完成后必须停下，再决定是否进入 coding
- 每个已批准 slice 或已批准并行 group 完成后必须停下
- coding 只允许自动流转到同一 slice 或 group 的 review，不得自动进入下一阶段

## 本地开发安装

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
harness init --dry-run
harness init
```

使用推荐的 OpenCode 脚手架初始化：

```powershell
harness init --dry-run --with-opencode
harness init --with-opencode
```

预览框架受管变更：

```powershell
harness diff
```

应用安全的框架受管更新：

```powershell
harness sync
harness sync --dry-run
```

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

- `opencode.jsonc`
- `.opencode/commands/*.md`
- `.opencode/agents/*.md`
- `.opencode/README.md`

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

但如果你希望更快地落地日常流程，仍然建议启用 OpenCode，因为它能提供可复用的 slash commands、本地 agent 角色和 validator 脚手架。

启用后安装的是可编辑的本地脚手架，不是固定死的产品行为。团队可以按自己的模型、权限和验证方式继续调整。

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

## 验证

运行：

```powershell
npm run smoke
```
