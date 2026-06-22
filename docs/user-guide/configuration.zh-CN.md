# 配置

[English](./configuration.md)

先从控制本地行为的最小文件集合开始。

## 核心文件

- `AGENTS.md` —— 仓库级代理说明
- `marionettist.config.yaml` —— 本地 Marionettist 行为与策略
- `.marionettist/model-profiles.yml` —— 使用 OpenCode 时的模型 profile 映射
- `docs/project/knowledge-map.md` —— 安装到目标仓库后，用于项目文档路由的项目专属说明

## 建议优先检查的高价值设置

在 `marionettist.config.yaml` 中，团队通常会先看：

- gate policy 默认值
- 本地工作流调整项
- 可选的 `riskZones`
- 如果使用 OpenCode，则检查相关设置

可选 risk zone 示例：

```yaml
riskZones:
  - name: "auth"
    paths:
      - "src/auth/**"
    notes:
      - "会影响访问控制与用户权限"
```

## OpenCode 专属配置

如果你使用 OpenCode 安装，还应检查：

- command surface 选择
- permission mode 选择
- 插件来源选择：`package` 或 `local`
- `.marionettist/model-profiles.yml` 中的模型 profile

示例：

```yaml
opencode:
  pluginSource: package  # package | local
```

- `package` 是新安装的默认顺畅路径
- `local` 会保留仓库本地生成的插件回退方案
- 如果 sync 需要把 `opencode.pluginSource` 渲染到 `marionettist.config.yaml`，该文件可能会显示为 `conflict`；应用前先检查 diff

OpenCode 还有两组需要区分的、偏配置导向的命令表面：

- `marionettist-config` 仍然是通用的 OpenCode 配置包装命令
- `marionettist-pathway-config` 是面向 Pathway 的 OpenCode Pathway MVP 配置编写工作流

`marionettist-pathway-config` 并不是新的核心 CLI 配置命令。它是一个 Pathway 范围内的工作流，应该：

- 先起草候选 YAML 或配置修改
- 在写入前展示 diff 或类似 diff 的预览
- 写入前要求显式确认

如果配置变更还更新了 OpenCode 可见的插件、命令或技能资产，可能需要重启 OpenCode，当前会话才会看到新行为。

当前支持的选项请参见 [../OPENCODE.zh-CN.md](../OPENCODE.zh-CN.md)。

迁移说明：除非未来版本明确说明，否则不应把旧的 `harness` 配置或 OpenCode 命名视为长期兼容表面。整理旧安装时，请使用[迁移指南](../migration/README.md)。

## 需要完整参考？

- [../GUIDELINES.zh-CN.md](../GUIDELINES.zh-CN.md)
- [../OPENCODE.zh-CN.md](../OPENCODE.zh-CN.md)
