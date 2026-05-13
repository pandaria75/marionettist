# Universal AI Harness Framework 使用文档

[English](./GUIDELINES.md)

本文档说明如何把 Universal AI Harness Framework 安装到目标项目，并在日常开发中使用 harness workflow 控制 AI Agent 的分析、编码、审查和知识同步。

## 1. 适用对象

本文档面向两类读者：

- Framework 维护者：负责维护本仓库的 CLI、模板和 core skills。
- 目标项目使用者：负责在自己的项目中运行 `harness init`、`harness diff`、`harness sync`，并用安装后的 workflow 与 Agent 协作。

如果你只是在目标项目中使用 harness，通常只需要关注第 3 节之后的内容。

## 2. 本地安装

在 framework 仓库中：

```powershell
npm link
```

然后在目标项目中：

```powershell
harness init
```

不使用 `npm link` 时，也可以直接运行：

```powershell
node E:\AI_WORK\universal-ai-harness-framework\bin\harness.js init --project .
```

## 3. 初始化目标项目

推荐先预览：

```powershell
harness init --dry-run
```

确认计划后再写入：

```powershell
harness init
```

初始化会创建或更新：

- `AGENTS.md`
- `harness.config.yaml`
- `docs/project/harness-workflow.md`
- `docs/project/knowledge-map.md`
- `.aiassistant/rules/*.md`
- `.agents/skills/*/SKILL.md`
- `.task/`
- `.harness/manifest.json`

默认规则：

- 已存在的 project-local 文件不会被直接覆盖。
- `AGENTS.md` 只写入或更新 harness managed block。
- `.task/` 是目标项目本地任务目录，不进入 managed file 清单。
- `.harness/manifest.json` 记录 framework-managed 文件 ownership 和 hash。

## 4. 初始化后的三件事

### 4.1 生成项目知识

在目标项目中让 Agent 执行：

```text
使用 workspace-knowledge-manager init。

目标：
- 阅读当前项目结构、配置、已有文档和关键源码证据
- 生成或更新 docs/project/knowledge-map.md
- 只创建高价值的设计、架构、功能行为、边界规则文档
- 不要生成代码索引、文件树、类清单或函数清单
```

### 4.2 填写 project-local 规则

编辑目标项目的 `AGENTS.md` project-local 区域：

```html
<!-- project-local:start -->
...
<!-- project-local:end -->
```

这里可以写团队偏好、项目专用 workflow、默认验证命令、风险区域说明等。不要改写 managed block，除非你接受未来 sync 时这些改动被 framework 覆盖。

### 4.3 调整配置和规则

根据目标项目实际情况更新：

- `harness.config.yaml`
- `.aiassistant/rules/*.md`
- `docs/project/knowledge-map.md`

规则用于约束，文档用于解释。不要把同一内容在 rules 和 docs 中重复维护。

## 5. 日常任务流程

Harness 的完整流程是：

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

实际使用时按任务复杂度裁剪。

### 5.1 Tier S: 小改动

适用于：

- 单文件低风险修改
- 文案、注释、配置小调整
- 明确的格式或拼写修复
- 已有上下文充足的局部改动

可直接提示：

```text
这是一个 Tier S 小改动。

任务：
<描述>

要求：
- 只修改相关文件
- 不扩展范围
- 遵循现有风格
- 完成后说明修改内容和验证方式
```

### 5.2 Tier M: 标准任务

适用于：

- 涉及多个文件但范围清楚的 bugfix 或功能
- 需要读规则和设计文档才能安全修改
- 需要编码前整理最小上下文

推荐流程：

```text
task-intake
  -> module-inspector / workflow-inspector
  -> context-pack-builder
  -> coding
  -> boundary-reviewer
```

入口提示：

```text
我要处理一个标准任务：

<任务描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake，必要时做 module-inspector 或 workflow-inspector。
编码前生成 .task/context-pack.md。
不要直接编码。
```

### 5.3 Tier L: 复杂任务

适用于：

- 需求、兼容性或边界不清楚
- 跨多个模块或子系统
- 高风险重构
- 影响公共行为、数据模型、外部接口、关键流程或权限边界
- 需要多人审查或分阶段交付

推荐流程：

```text
task-intake
  -> requirement-freezer
  -> module-inspector / workflow-inspector
  -> implementation-slicer
  -> context-pack-builder
  -> coding by slice
  -> boundary-reviewer
  -> workspace-knowledge-manager review
```

入口提示：

```text
我要处理一个复杂任务：

<任务描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
如果需求、兼容性或边界不清楚，使用 requirement-freezer。
编码前必须生成 implementation plan 和 .task/context-pack.md。
不要直接编码。
```

## 6. 常用 Skill

### 6.1 task-intake

用途：任务入口分诊。

输出应包含：

- Task Type
- Tier
- Current Understanding
- Blocking Questions
- Assumptions
- Recommended Next Step
- Guardrails

### 6.2 requirement-freezer

用途：把模糊需求冻结成可测试的事实。

输出：

```text
.task/<yyyy-MM-dd>/<task-name>.requirement.md
```

适合用于复杂功能、行为争议、兼容性要求不清楚、接口或数据契约变化等场景。

### 6.3 module-inspector

用途：分析模块、目录、功能区域或 ownership 边界。

它应读取 `docs/project/knowledge-map.md`，再按需读取相关 docs、rules 和源码证据。

### 6.4 workflow-inspector

用途：分析执行流程、状态变化、异步处理、前后端联动、外部集成或任务编排。

它只分析流程影响和风险，不直接生成完整 implementation plan。

### 6.5 implementation-slicer

用途：把已确认的需求或分析结果拆成小切片。

输出：

```text
.task/<yyyy-MM-dd>/<task-name>.implementation-plan.md
```

每个 slice 应写清楚：

- Goal
- Allowed Modification Scope
- Forbidden Scope
- Steps
- Validation
- Done Criteria
- Rollback Notes

### 6.6 context-pack-builder

用途：编码前生成最小上下文包。

输出：

```text
.task/context-pack.md
```

上下文包应只包含当前 slice 或 approved group 所需内容，不复制完整文档或源码。

### 6.7 boundary-reviewer

用途：实现完成后检查边界、规则、验证和文档同步需求。

最终结论必须是：

- `PASS`
- `PASS_WITH_WARNINGS`
- `BLOCKED`

### 6.8 workspace-knowledge-manager

用途：生成和维护设计知识、架构说明、边界规则和 knowledge map。

模式：

- `init`: 首次接入 harness 后建立知识结构。
- `refresh`: 周期性刷新设计文档和规则。
- `review`: 实现后判断是否需要同步 docs/rules。
- `topic`: 为指定能力、流程、子系统或架构关注点生成专题文档。

禁止输出代码索引目录、文件树、类清单、函数清单或调用点索引。

## 7. 编码 Gate

非平凡任务必须在以下位置暂停：

- analysis 到 coding
- 一个 slice 或 group 到下一个
- coding 到 review

Gate report 推荐格式：

```text
Phase:
Completed Work:
Files Created or Changed:
Validation Status:
Recommended Next Step:
User confirmation required to continue.
```

如果 Agent 越过 gate 直接继续编码，应要求它停止并回到当前 approved slice。

## 8. 新功能流程示例

```text
我要开发一个新功能：

<需求描述>

请按照当前仓库的 harness workflow 推进。
先进行 task-intake。
不要直接编码。
```

需求明确后：

```text
使用 requirement-freezer。

输入：
<task-intake 结果>

输出：
.task/<yyyy-MM-dd>/<task-name>.requirement.md

要求：
- 只把影响正确性或范围的问题作为 Blocking Questions
- 其他不确定点写入 Assumptions 或 Deferred Questions
- 不要写 implementation plan
- 不要编码
```

切片：

```text
使用 implementation-slicer。

输入：
.task/<yyyy-MM-dd>/<task-name>.requirement.md
以及已有的 module-inspector / workflow-inspector 结果。

输出：
.task/<yyyy-MM-dd>/<task-name>.implementation-plan.md

要求：
- 拆成小 slice
- 每个 slice 写 allowed scope、forbidden scope、validation 和 done criteria
- 只有在文件范围独立且合并风险明确时才标记 parallel-capable
- 不要编码
```

编码前：

```text
使用 context-pack-builder。

当前 slice：
Slice <N>: <name>

输出：
.task/context-pack.md

要求：
- 只保留当前 slice 需要的上下文
- 明确 allowed scope、forbidden scope、validation commands 和 stop conditions
- 不要编码
```

编码：

```text
读取 AGENTS.md 和 .task/context-pack.md。

只实现当前 approved slice。
不要扩展需求。
不要修改 forbidden scope。
完成后运行或说明 validation commands。
当前 slice 完成后暂停，等待确认。
不要自动进入下一个 slice 或 review。
```

审查：

```text
使用 boundary-reviewer。

检查当前 diff，对照：
- AGENTS.md
- .task/context-pack.md
- docs/project/knowledge-map.md
- 相关 rules/docs

输出 PASS / PASS_WITH_WARNINGS / BLOCKED。
不要修改代码。
```

## 9. Bugfix 流程示例

```text
我要修复一个 bug：

现象：
<实际现象>

期望：
<期望行为>

复现步骤：
<步骤>

证据：
<日志、截图、失败测试或其他证据>

请按照当前仓库的 bugfix harness workflow 推进。
先进行 task-intake。
优先确认复现路径或失败测试。
编码前生成 .task/context-pack.md。
不要直接编码。
```

Bugfix 通常不需要完整 requirement-freezer，但以下情况应使用：

- 期望行为不明确
- 正确行为存在争议
- 涉及兼容性
- 涉及外部接口、数据契约或公共行为变化
- 修复本身会改变设计规则

## 10. 重构流程示例

```text
我要进行一个重构任务：

目标：
<重构目标>

必须保持不变的行为：
<行为约束>

允许修改范围：
<范围>

禁止修改范围：
<范围>

请按照当前仓库的 harness workflow 推进。
先分析边界和流程影响。
不要直接编码。
```

重构必须强调：

- 行为保持不变。
- 修改范围要明确。
- 验证方式要先定义。
- 不要把重构和新功能混在一起。

## 11. 文档和知识同步

实现后运行或请求：

```text
使用 workspace-knowledge-manager review。

检查当前 diff 是否影响：
- 架构
- 公共行为
- 功能设计
- 工作流
- 领域概念
- 模块或目录边界
- 扩展点
- 运行或兼容性约束

只输出是否需要更新 docs/rules。
不要自动修改文档，除非我明确要求。
```

只有设计含义变化时才更新 docs。不要因为新增、重命名或移动源码文件就生成文件清单或索引。

## 12. 升级和同步

查看 framework-managed 变更：

```powershell
harness diff
```

同步可安全更新的内容：

```powershell
harness sync
```

dry-run：

```powershell
harness sync --dry-run
```

强制覆盖 managed 文件：

```powershell
harness sync --force
```

注意：

- `--force` 只作用于 manifest-managed 文件。
- `--force` 不删除 project-local 文件。
- `orphan-managed` 只报告，不删除。
- `modified-local` 和 `conflict` 默认不会被覆盖。
- `AGENTS.md` 只同步 managed block。

## 13. Managed 状态说明

`harness diff` 和 `harness sync --dry-run` 会输出计划：

- `unchanged`: 本地 managed 内容未变。
- `new-managed`: framework 新增 managed 文件，目标项目可创建。
- `missing`: 之前安装过的 managed 文件缺失，可重建。
- `update`: 本地未改、framework 已更新，可安全升级。
- `modified-local`: 本地改过，默认不覆盖。
- `conflict`: 本地和 framework 都变化，需要人工判断。
- `orphan-managed`: manifest 仍追踪但 framework 不再提供，只报告不删除。
- `skip-project-local`: 目标路径已有本地文件，默认保留。
- `manifest-preview`: dry-run 中即将写入的 manifest 预览项。

## 14. 维护 framework 时的验证

修改 CLI、模板或 skills 后，在 framework 仓库运行：

```powershell
npm run smoke
```

修改模板或 skills 后还应检查项目中立性：

```powershell
rg -n "<source-project-term-1>|<source-project-term-2>|<source-project-technology>" templates skills README.md AGENTS.md package.json src scripts docs
```

期望无匹配。默认模板不能包含从某个业务项目带来的专用术语或技术假设。

## 15. 一句话原则

```text
先分诊，再定范围；
先打包上下文，再编码；
一次只做一个切片；
阶段之间先确认；
完成后审查边界；
设计知识进 docs，代码索引留给 IDE 和搜索工具。
```
