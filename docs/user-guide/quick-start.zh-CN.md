# 快速开始

[English](./quick-start.md)

当你想用最短且安全的路径在目标项目中启用 Marionettist 时，请使用本页。

## 开始之前

- 以下步骤应在你要接入 Marionettist 的那个仓库内执行。
- 如果你维护的是当前这个 framework 仓库本身，请使用 `marionettist self init --apply`，不要运行普通的 `marionettist init`。
- 如果你还想启用可选的 OpenCode 集成，请先完成基础安装，再继续阅读 [OpenCode 文档](../OPENCODE.zh-CN.md)。

## 1. 安装 CLI

```powershell
npm install -g github:pandaria75/marionettist
```

## 2. 在目标项目中预览安装结果

在你希望接入 Marionettist 的目标项目中运行：

```powershell
marionettist init --dry-run
```

先通过预览确认 Marionettist 计划创建或接管哪些文件，再决定是否正式安装。

## 3. 安装 framework 文件

```powershell
marionettist init
```

可选的 OpenCode 脚手架：

```powershell
marionettist init --with-opencode
```

安装完成后，项目中通常会出现 `AGENTS.md`、`marionettist.config.yaml`，以及 `.marionettist/` 任务/运行时区域等入口文件。

## 4. 先调整第一批项目本地文件

安装后，通常先检查这些文件：

- `AGENTS.md`
- `marionettist.config.yaml`
- `docs/project/knowledge-map.md`
- 如果使用 OpenCode，再看 `.marionettist/model-profiles.yml`

推荐的首批修改：

- 在 `AGENTS.md` 中写清你的仓库边界与协作预期
- 在 `marionettist.config.yaml` 中设置项目本地默认值
- 在 `docs/project/knowledge-map.md` 中补充仓库专属的架构与所有权说明
- 只有当团队确实需要不同的 OpenCode 默认模型时，再调整模型选择

## 5. 按 Marionettist 工作流开始正常工作

典型流程：

```text
intake -> analysis/context -> coding -> review -> gate
```

可直接使用的提示词：

```text
请按照本仓库的 Marionettist 工作流执行。

任务：<描述工作>。

从任务 intake 和上下文准备开始。
在 analysis gate 获批前不要开始编码。
```

如果使用 OpenCode，简短入口是：

```text
/marionettist <描述工作>
```

如果这是你第一次设置 OpenCode，请继续阅读 [../OPENCODE.zh-CN.md](../OPENCODE.zh-CN.md)，了解命令面、agent 角色、模型 profiles 与权限建议。

## 6. 保持安装健康

当你修改配置或更新 framework 托管文件后，可使用：

```powershell
marionettist diff
marionettist sync
marionettist doctor
```

建议先运行 `diff`，再运行 `sync`，这样可以先安全查看托管变更。

## 下一步

- 更详细说明：[../GUIDELINES.zh-CN.md](../GUIDELINES.zh-CN.md)
- OpenCode 设置：[../OPENCODE.zh-CN.md](../OPENCODE.zh-CN.md)
- 配置：[./configuration.md](./configuration.md)
- 故障排查：[./troubleshooting.md](./troubleshooting.md)
- 更完整的文档入口：[./README.zh-CN.md](./README.zh-CN.md)
