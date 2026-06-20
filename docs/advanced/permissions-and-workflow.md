# Permissions and Workflow Depth

OpenCode permissions and Marionettist workflow depth are related, but they are not the same control.

## Two separate ideas

- **Workflow depth** decides how much analysis, slicing, review, and gate structure a task needs.
- **Permission mode** decides how much tool friction OpenCode applies during execution.

Relaxing one does not automatically relax the other.

## Current posture

- gate policy controls pause behavior
- permission mode controls tool friction
- dangerous-command handling still applies even when permission friction is lower

High-risk actions still need explicit caution, such as force pushes, history rewrites, destructive deletes, project-external writes, and release or deploy actions.

## Current references

- [OpenCode guide: Permission Modes](../OPENCODE.md#9-permission-modes)
- [OpenCode guide: Gate Behavior](../OPENCODE.md#8-gate-behavior)
- [Usage guide: Gates](../GUIDELINES.md#6-gates)
