# 故障排查

[English](./troubleshooting.md)

## `marionettist init` 将修改现有文件

如果仓库里已经有本地材料，这属于预期行为。

- 先运行 `marionettist init --dry-run`
- 使用交互选项选择备份、覆盖或跳过
- 只有在你明确要替换时才使用 `--force`

## 生成出的配置与本地预期不一致

- 运行 `marionettist diff` 检查受管变更
- 只有在预览看起来安全后才运行 `marionettist sync`
- 检查 `AGENTS.md`、`marionettist.config.yaml` 和 `.marionettist/manifest.json`

## 已有 OpenCode 文件，但行为看起来还是旧的

- 重新确认安装模式和 OpenCode 选项
- 查看 [../OPENCODE.zh-CN.md](../OPENCODE.zh-CN.md)
- 如果重新生成的配置或插件文件没有自动重新加载，请重启 OpenCode

## 工作流感觉太严格或太宽松

- 检查 `marionettist.config.yaml` 中的 gate policy 设置
- 记住 gate policy 与 OpenCode permission mode 是分开的
- 只有在团队明确决定后再调整

## 你在某些文档里看到了旧的 harness 名称

当前面向用户的命令和配置统一使用 **Marionettist** 命名。剩余的 `harness` 引用只应出现在历史、迁移或规划语境中。

## 更多帮助

- 完整使用指南：[../GUIDELINES.zh-CN.md](../GUIDELINES.zh-CN.md)
- English usage guide: [../GUIDELINES.md](../GUIDELINES.md)
- OpenCode 指南：[../OPENCODE.zh-CN.md](../OPENCODE.zh-CN.md)
- English OpenCode guide: [../OPENCODE.md](../OPENCODE.md)
