# Gates

Gates are the main pause points in the harness workflow.

## Core rule

For non-trivial work, stop:

1. after analysis, before coding
2. after each approved slice or approved group

This keeps human approval attached to the same unit of work that the agent is about to implement or has just finished implementing.

## Why gates matter

- they prevent silent scope expansion
- they keep review aligned with approved work
- they make task state inspectable in repository files instead of chat memory

## Current references

- [Usage guide: Gates](../GUIDELINES.md#6-gates)
- [Design overview: Gates Matter More Than Autonomy](../DESIGN.md#32-gates-matter-more-than-autonomy)
- [OpenCode guide: Gate Behavior](../OPENCODE.md#8-gate-behavior)

For exact project execution rules, use the installed `docs/project/harness-workflow.md` in a target project.
