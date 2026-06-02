# 通用 AI Harness 框架

[English](./README.md)

一套可复用的文件型框架，为任意仓库提供可持久化、可升级的 AI agent 协作契约。

## 解决的问题

不受控的 AI 辅助开发会产生约束丢失、上下文漂移和范围悄悄扩张等问题。这套 harness 通过把可审查的协作规则和任务状态放在普通仓库文件中，让 agent 先读后动。

## 主要优势

- **文件即契约。** `AGENTS.md`、rules、docs 和 task 工件都是普通文件 — 可审查、可版本管理、agent 无关。
- **工作流 gate。** Agent 在 analysis 完成后以及每个已批准 slice 完成后必须停下。不设置无边界自主执行。
- **安全升级。** `harness diff` 预览变更。`harness sync` 只更新受管内容。本地工作默认保留。
- **模型分层。** OpenCode 脚手架允许把最强模型分配给规划，性价比模型分配给编码和 review，最便宜的可靠模型分配给工具型任务。
- **可选工具。** OpenCode slash commands 和 agent 角色是体验优化，不是必须项。核心 harness 仅靠文件和提示词即可运行。

## 安装

```powershell
# 从 GitHub 安装
npm install -g github:pandaria75/universal-ai-harness-framework

# 或从本地仓库安装
npm link
```

## 最小使用方式

在任意目标项目中：

```powershell
# 预览将要安装的内容
harness init --dry-run

# 交互式安装
harness init
```

这会安装 `AGENTS.md`、`harness.config.yaml`、项目 docs、rules、skills 和 `.harness/manifest.json`，为后续安全升级做好准备。

## 下一步

| 文档 | 面向读者 |
| --- | --- |
| [docs/DESIGN.zh-CN.md](./docs/DESIGN.zh-CN.md) | 想理解设计原则的技术负责人和开发者 |
| [docs/GUIDELINES.zh-CN.md](./docs/GUIDELINES.zh-CN.md) | 日常使用 harness 的团队 — 安装、任务 tier、gate、skills 和提示词 |
| [docs/OPENCODE.zh-CN.md](./docs/OPENCODE.zh-CN.md) | 使用或评估可选 OpenCode 脚手架的团队 |

## 常用命令速查

```powershell
# 初始化目标项目
harness init
harness init --with-opencode

# 预览框架更新，不写入文件
harness diff

# 应用安全的受管内容更新
harness sync
harness sync --dry-run

# 诊断 harness 安装状态
harness doctor
```

## 边界

- 本仓库是 **framework 源码仓库**。使用 `harness self init` 维护本仓库 — 不要用普通的 `harness init`。
- `templates/` 和 `skills/` 是可发布资产。self-only 规则不得写入这些位置。
- `.harness-self/` 是可删除的本地运行态。
- OpenCode 是可选的。harness 本身不依赖它。
- 文档服务于设计知识，不是代码索引。
