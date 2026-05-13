# Universal AI Harness Framework 设计文档

[English](./DESIGN.md)

## 1. 定位

Universal AI Harness Framework 是一套可安装到任意软件项目中的轻量文件型 AI 协作框架。

它不是某个具体项目的规则集合，也不是某个 Agent 的插件。它提供的是一组通用资产：

- 目标项目的 `AGENTS.md` 入口规则
- 项目级 workflow 与 knowledge map 模板
- 通用 rules
- 可被多种 Agent 读取的 Markdown skills
- `harness` Node CLI，用于 `init`、`diff`、`sync`

目标项目通过这些文件获得稳定的 AI 协作流程：先分诊、再明确范围、再压缩上下文、再按切片实现，最后审查边界和文档同步需求。

## 2. 设计目标

### 2.1 项目中立

Framework core 必须保持项目中立。模板、skills 和 CLI 默认行为不能假设特定业务领域、语言、构建工具、模块名称或验证命令。

目标项目的差异通过以下位置表达：

- `harness.config.yaml`
- `AGENTS.md` 的 project-local 区域
- 目标项目自己的 `docs/`
- 目标项目自己的 `.aiassistant/rules/`
- 目标项目自己的 `.agents/skills/`

### 2.2 文件即协作协议

AI 协作中最容易失控的部分不是代码生成本身，而是上下文漂移、范围扩张和口头约束丢失。

因此 harness 把长期有效的上下文落到仓库文件中：

- `AGENTS.md` 保存 Agent 入口规则。
- `.aiassistant/rules/*.md` 保存硬约束。
- `docs/**/*.md` 保存设计、架构、功能行为和边界知识。
- `.task/` 保存当前任务的需求、计划和上下文包。
- `.harness/manifest.json` 保存 framework-managed 文件的安装状态。

这些文件可以被版本管理、审查、迁移，也可以被不同 Agent 重复读取。

### 2.3 安全升级

Framework 会持续演进，但目标项目已经存在的本地文档、规则、skills 和任务上下文不能被默认覆盖。

因此 v1 CLI 使用 manifest 记录 managed ownership：

- `harness init` 生成 `.harness/manifest.json`。
- `harness diff` 基于 manifest 输出变更计划，不写文件。
- `harness sync` 只更新安全的 framework-managed 内容。
- `AGENTS.md` 只更新 managed block，保留 project-local 区域。
- `--force` 只允许覆盖 framework-managed 文件，不删除 project-local 文件。

## 3. Harness 资产模型

### 3.1 Framework-managed 资产

Framework-managed 资产来自本仓库：

- `templates/AGENTS.md`
- `templates/harness.config.yaml`
- `templates/docs/project/harness-workflow.md`
- `templates/docs/project/knowledge-map.md`
- `templates/rules/*.md`
- `skills/*/SKILL.md`

安装到目标项目后，这些文件由 `.harness/manifest.json` 追踪。

### 3.2 Project-local 资产

Project-local 资产属于目标项目团队：

- 目标项目新增或修改的设计文档
- 目标项目新增或修改的规则
- 目标项目专用 skills
- `.task/` 下的任务上下文
- `AGENTS.md` 的 project-local 区域
- 任何不在 manifest 中的已有文件

默认 `init` 和 `sync` 都不能覆盖 project-local 内容。

### 3.3 `AGENTS.md` managed block

`AGENTS.md` 是特殊文件。它同时包含 framework-managed 区域和 project-local 区域：

```html
<!-- harness-kit:start -->
...
<!-- harness-kit:end -->

<!-- project-local:start -->
...
<!-- project-local:end -->
```

Manifest 中 `AGENTS.md` 的 hash 只计算 managed block。目标项目可以自由维护 project-local 区域；`harness sync` 不应改写这些内容。

## 4. Manifest 机制

Manifest 路径固定为：

```text
.harness/manifest.json
```

格式：

```json
{
  "schemaVersion": 1,
  "frameworkVersion": "0.1.0",
  "installedAt": "2026-05-13T00:00:00.000Z",
  "updatedAt": "2026-05-13T00:00:00.000Z",
  "managedFiles": [
    {
      "path": "AGENTS.md",
      "source": "templates/AGENTS.md",
      "kind": "managed-block",
      "hash": "sha256..."
    }
  ]
}
```

字段含义：

- `schemaVersion`: manifest 格式版本。
- `frameworkVersion`: 安装或同步时的 framework 版本。
- `installedAt`: 首次安装时间。
- `updatedAt`: 最近一次写入 manifest 的时间。
- `managedFiles[].path`: 目标项目中的相对路径。
- `managedFiles[].source`: framework 中的来源路径。
- `managedFiles[].kind`: `file` 或 `managed-block`。
- `managedFiles[].hash`: 上次安装的 managed 内容 SHA-256。

Manifest 是 sync/diff 判断文件状态的依据。没有 manifest 的项目不能执行可靠 sync，应先运行 `harness init`。

## 5. Managed File 状态机

`harness diff` 和 `harness sync` 使用同一套状态判断：

- `unchanged`: 本地 managed 内容仍等于上次安装 hash。
- `new-managed`: 当前 framework 新增 managed 资产，目标项目还不存在。
- `missing`: manifest 追踪的 managed 文件在目标项目中缺失，可以重建。
- `update`: 本地内容未改，framework 内容已更新，可以安全升级。
- `modified-local`: 本地 managed 内容被改过，framework 内容未变，默认不覆盖。
- `conflict`: 本地和 framework 都相对上次安装发生变化，需要人工判断。
- `orphan-managed`: manifest 仍追踪某文件，但当前 framework 不再提供它，只报告不删除。
- `skip-project-local`: 目标路径已有文件但不归 manifest 管理，默认保留。

这个状态机的核心原则是：能证明安全才写入；不能证明安全就报告。

## 6. Workflow 设计

Harness workflow 来源于真实项目中的 AI 协作经验，但被抽象成通用流程：

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

不同复杂度任务可以裁剪：

- Tier S: 低风险小改动，可直接实现并说明验证。
- Tier M: 标准任务，需要分析和 `.task/context-pack.md`。
- Tier L: 复杂任务，需要需求冻结、边界或流程分析、实现切片和阶段 gate。

Gate 的作用是让 Agent 在关键阶段停止，等待用户确认：

- analysis 到 coding
- 一个 slice 或 group 到下一个
- coding 到 review

## 7. Knowledge 设计

Harness 鼓励沉淀设计知识，不鼓励生成代码索引。

应该写入 docs 的内容：

- 系统能力和设计意图
- 架构形态和依赖方向
- 功能行为和工作流
- 领域概念
- 状态生命周期
- 扩展点
- 集成边界
- 兼容和迁移约束
- 高风险区域及原因

不应该写入 docs 的内容：

- 文件树
- 类清单
- 函数清单
- 调用点索引
- 控制器、服务、仓储的机械列表
- 可通过 IDE、MCP 或本地搜索获得的实现细节

`workspace-knowledge-manager` 的职责是生成和维护设计、架构、边界规则和知识路由，不生成代码索引目录。

## 8. CLI 架构

CLI 使用 Node.js 实现，入口为 `bin/harness.js`。

核心模块：

- `src/commands/init.js`: 初始化目标项目。
- `src/commands/sync.js`: 同步 framework-managed 资产。
- `src/commands/diff.js`: 输出同步计划。
- `src/core/plan.js`: 构建 manifest-aware 文件计划。
- `src/core/apply-plan.js`: 执行或打印计划。
- `src/core/manifest.js`: 读写 manifest。
- `src/core/managed-block.js`: 处理 `AGENTS.md` managed block。
- `src/core/hash.js`: 计算内容 hash。

CLI 当前只管理文本资产。二进制资产、远程 registry 和插件分发不是 v1 范围。

## 9. 非目标

当前 framework 不负责：

- 替代 IDE 代码导航。
- 生成完整代码索引。
- 规定目标项目技术栈。
- 管理业务项目私有知识。
- 删除目标项目本地文件。
- 自动解决 `conflict`。
- 作为某个特定 Agent 的专用插件。

这些边界能保持 framework 可迁移、可审查，并降低目标项目升级风险。
