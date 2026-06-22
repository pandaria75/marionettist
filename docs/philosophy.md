# Marionettist Philosophy

[中文版](./philosophy.zh-CN.md)

This page is the short, beginner-friendly answer to: "How is Marionettist supposed to work?"

For the deeper architecture and design rationale, see [docs/DESIGN.md](./DESIGN.md).

## 1. Plan before coding

Marionettist assumes that most AI-work problems start before code is written.

The common failure mode is not just bad code output. It is missing context, unclear scope, and an agent continuing after the point where a human should decide.

So the normal path is:

1. understand the task
2. gather the needed repository context
3. write down the plan and boundaries
4. start coding only after approval when the task is non-trivial

The goal is not bureaucracy. The goal is to make the next coding step safe.

## 2. Gates are a safety posture

Marionettist is not designed around "let the agent run until it feels done."

Instead, it uses explicit gates:

- stop after analysis, before coding
- stop after each approved slice or approved group

This keeps humans in control of risky decisions, scope changes, and boundary crossings.

A gate is not a punishment for the agent. It is a shared pause point for checking: "Are we still doing the right work?"

## 3. Work in slices, not one giant step

For larger tasks, Marionettist prefers small approved slices.

Each slice should be easy to understand and review. In practice, that usually means each slice says:

- what it is trying to change
- what files or areas are allowed
- what is out of scope
- what validation is expected

Small slices reduce surprise. They also make handoff and review much easier.

## 4. Context packs and handoffs keep work grounded

Marionettist tries to move important context out of chat and into repository files.

That is why tasks often use files such as:

- task state
- implementation plans
- context packs
- review notes or validation evidence

A context pack is the compact briefing for the current work. A handoff records what happened, what changed, and what still needs attention.

This makes the workflow more durable across long conversations, agent changes, and team handovers.

## 5. The framework stays project-neutral

Marionettist is a reusable framework, not a business-project template.

Its core files, templates, and default guidance should not assume:

- a specific language
- a specific stack
- a specific module layout
- customer-specific rules
- app-specific examples

Project-specific knowledge belongs in the target project's own docs, rules, config, and task artifacts.

## 6. Design docs go deeper

This page is the quick orientation.

When you want the deeper "why" behind files-as-contract, ownership boundaries, tiers, and safe upgrades, continue with [docs/DESIGN.md](./DESIGN.md).
