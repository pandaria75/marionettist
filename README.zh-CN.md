# Marionettist

[English](./README.md)

一套可复用的文件型 Marionettist 工作流，让任意仓库中的 AI 辅助开发更安全。

它为 AI agent 和人类团队提供一份共享契约：规则放在哪里、任务上下文如何准备、何时可以编码、agent 必须在何处停下等待批准。

## 解决的问题

AI 辅助开发常因简单原因失败：

- agent 忘记了对话早期的约束
- 项目知识留在聊天中，不在仓库里
- 实现过程中范围悄悄扩张
- review 发生得太晚，或依据不清晰的需求
- agent prompt 升级覆盖了本地的团队规则

这套框架把重要内容移到普通文件中。任何 agent 都能读取，能在 Git 中 review，能安全地升级。

## 亮点

- **仓库内的契约。** `AGENTS.md`、rules、docs、任务状态和 manifest 都是普通文件。
- **Agent 中立的工作流。** 这套方法适用于任何能读 Markdown、能编辑文件的 agent。
- **显式 gate。** 非平凡工作在 analysis 完成后、以及每个已批准 slice 完成后停下。
- **编码前先建任务上下文。** Agent 应准备紧凑的 context pack，而不是仅凭聊天记录就开始编码。
- **安全同步。** `marionettist diff` 预览变更；`marionettist sync` 更新受管资产，同时保留本地内容。
- **OpenCode 可选支持。** Slash commands 和角色 agent 改善体验，但 Marionettist 不依赖 OpenCode。
- **模型分层。** OpenCode 部署可以为规划使用更强模型，为编码/review 使用均衡模型，为工具型任务使用更便宜的可靠模型。

## 安装

```powershell
# 从 GitHub 安装
npm install -g github:pandaria75/universal-ai-harness-framework

# 或从本框架仓库的本地克隆安装
npm link
```

## 最小使用方式

在目标项目中执行以下命令：

```powershell
# 预览将要安装的内容
marionettist init --dry-run

# 交互式安装 Marionettist
marionettist init

# 可选：同时安装 OpenCode commands 和 agents
marionettist init --with-opencode
```

初始化后，目标项目会得到以下文件：

- `AGENTS.md` — 仓库级 agent 行为
- `marionettist.config.yaml` — 本地 Marionettist 设置
- `docs/project/*` — 工作流和知识路由
- `.aiassistant/rules/*` — 约束规则
- `.agents/skills/*` — 可移植工作流 skills
- `.marionettist/manifest.json` — 用于安全升级

## 小例子

不使用 OpenCode 时，可以给 agent 这样的提示词：

```text
请按照本仓库的 Marionettist 工作流执行。

任务：添加一个小功能：<描述改动>。

从任务 intake 和上下文准备开始。
在 analysis gate 获批前不要开始编码。
```

安装了 OpenCode 后，从 builder 命令开始：

```text
/marionettist 添加一个小功能：<描述改动>
```

Agent 应分类任务、准备所需上下文，在 analysis gate 停下等待批准后再编码。

## 常用命令

```powershell
# 预览框架更新
marionettist diff

# 应用安全的受管内容更新
marionettist sync

# 诊断已安装的 Marionettist
marionettist doctor
```

更多安装模式、命令面选项、任务 tier 和 gate 行为，请阅读使用指南。

## 延伸阅读

| 文档 | 适合人群 | 内容 |
| --- | --- | --- |
| [docs/DESIGN.zh-CN.md](./docs/DESIGN.zh-CN.md) | 技术负责人、架构师、框架评估者 | 设计思想、工作流哲学、资产所有权、非目标 |
| [docs/GUIDELINES.zh-CN.md](./docs/GUIDELINES.zh-CN.md) | 采用 Marionettist 的团队 | 安装、日常使用、任务 tier、gate、升级 |
| [docs/OPENCODE.zh-CN.md](./docs/OPENCODE.zh-CN.md) | 使用 OpenCode 的团队 | Slash commands、agent 角色、模型 profiles、权限姿态 |

## 本仓库的边界

本仓库是 **framework 源码仓库**，不是普通的 target project。

- 维护本 framework 仓库时使用 `marionettist self init`。
- 不要在这里运行普通的 `marionettist init`，仿佛它是 target project。
- `templates/` 和 `skills/` 是面向目标项目的可发布资产。
- `.marionettist-self/` 是可删除的本地运行态。
- OpenCode 是可选的。核心 Marionettist 工作流通过文件和提示词即可运行。
