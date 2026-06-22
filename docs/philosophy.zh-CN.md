# Marionettist 哲学

[English](./philosophy.md)

本页用适合初学者的方式回答一个简短问题："Marionettist 这套方法到底希望怎样工作？"

如果你想了解更完整的架构与设计理由，请继续阅读 [docs/DESIGN.zh-CN.md](./DESIGN.zh-CN.md)。

## 1. 先规划，再编码

Marionettist 认为，很多 AI 工作流问题在写代码之前就已经出现了。

常见失败点不只是代码输出不好，更在于上下文缺失、范围不清，以及 agent 越过了本该由人类决定的边界还继续前进。

所以常规路径是：

1. 先理解任务
2. 收集所需的仓库上下文
3. 写清计划与边界
4. 对非平凡任务，在获得批准后再开始编码

目标不是增加官僚流程，而是让下一步编码足够安全。

## 2. Gate 是一种安全姿态

Marionettist 不是围绕"让 agent 一直跑到自认为完成"来设计的。

它使用显式 gate：

- 分析结束后、编码开始前停下
- 每个已批准 slice 或已批准 group 完成后停下

这样人类可以继续掌控高风险决策、范围变化和边界跨越。

Gate 不是对 agent 的惩罚，而是一个共享暂停点，用来确认："我们现在做的还是正确的工作吗？"

## 3. 把工作切成 slice，而不是一次走完

对较大的任务，Marionettist 更偏好小而清晰的已批准 slice。

每个 slice 都应易于理解和 review。通常至少要说明：

- 这次要改什么
- 哪些文件或区域允许修改
- 哪些内容超出范围
- 预期如何验证

小 slice 能减少意外，也能让交接和 review 更容易。

## 4. Context pack 和 handoff 让工作不依赖聊天记忆

Marionettist 试图把重要上下文从聊天记录移回仓库文件。

所以任务通常会使用这些工件：

- task state
- implementation plan
- context pack
- review 记录或验证证据

Context pack 是当前工作的紧凑 briefing。Handoff 则记录发生了什么、改了什么，以及还需要注意什么。

这样即使对话很长、agent 更换，或者团队成员交接，工作也更稳定。

## 5. 框架核心必须保持项目中立

Marionettist 是一套可复用框架，不是业务项目模板。

它的核心文件、模板和默认指引不应假定：

- 特定编程语言
- 特定技术栈
- 特定模块布局
- 客户专属规则
- 某个应用专属示例

项目特有知识应放在目标项目自己的 docs、rules、config 和 task 工件中。

## 6. 设计文档提供更深入解释

本页是快速入门导向。

如果你想更深入理解"文件即契约"、所有权边界、tier 和安全升级等设计原因，请继续阅读 [docs/DESIGN.zh-CN.md](./DESIGN.zh-CN.md)。
