# Project Sequencing

## Strategy

Quill MVP is the mainline. Marionettist optimization is the feedback loop. Pi plugin work is a parallel experiment. Shared foundation is a delayed abstraction, not a current prerequisite.

## Operating rules

1. Use `marionettist-pathway-opencode` to develop Quill.
2. Let Quill development expose real Marionettist problems.
3. Fix Harness issues immediately when they block Quill MVP.
4. Record non-blocking experience issues as Marionettist roadmap issues.
5. Delay pure architecture optimization.
6. Explore Pi plugin work on a separate branch.
7. Keep shared foundation work to documentation and evaluation until evidence exists.

## Issue handling during Quill work

- Blocking Quill MVP: fix immediately.
- Non-blocking but painful: create issue and roadmap it.
- Architecture-only: record as future work after Quill MVP.

## Sequence

- Phase 0: synchronize Marionettist docs and roadmap.
- Phase 1: use `marionettist-pathway-opencode` to develop Quill MVP.
- Phase 2: create `feature/pi-plugin-adapter` and validate a minimal Pi adapter in parallel.
- Phase 3: after Quill produces 2-3 real articles, collect workflow / artifact / checkpoint lessons.
- Phase 4: evaluate whether stable mechanisms should feed back into Marionettist.
- Phase 5: decide whether to extract a shared foundation.

```mermaid
flowchart TD
    A[Current state] --> B{Project priority decision}

    B --> C[Quill just started\nGoal: build MVP first]
    B --> D[Marionettist already advanced\nGoal: optimize through real validation]
    B --> E[Pi plugin is worth parallel exploration\nGoal: validate new platform adapter]

    C --> C1[Use marionettist-pathway-opencode for Quill]
    C1 --> C2[Build Quill MVP skeleton\nCLI / docs / workflow / style profile]
    C2 --> C3[Run article generation chain\nbrief -> outline -> draft -> review -> final]
    C3 --> C4[Write 2-3 real articles]
    C4 --> C5[Improve Quill from feedback]

    D --> D1[Develop Quill with Marionettist]
    D1 --> D2{Harness issue found?}
    D2 -->|Blocks Quill MVP| D3[Fix Harness immediately]
    D2 -->|Non-blocking but painful| D4[Record Marionettist issue]
    D2 -->|Architecture idea| D5[Delay until after Quill MVP]

    E --> E1[Create Pi plugin branch]
    E1 --> E2[Build only plugin scaffold and minimal adapter]
    E2 --> E3[Validate whether Pi suits long-term iteration]
    E3 --> E4{Mature enough?}
    E4 -->|Yes| E5[Merge into Marionettist mainline]
    E4 -->|No| E6[Keep experimental branch; do not affect mainline]

    C5 --> F{Is Quill MVP stable?}
    F -->|No| C2
    F -->|Yes| G[Extract stable patterns\nworkflow / artifact / checkpoint / model role]

    G --> H{Need shared foundation?}
    H -->|Not yet| I[Let Quill keep evolving independently]
    H -->|Repeated mechanisms are stable| J[Feed back into Marionettist]
    J --> K[Marionettist becomes broader Agent Workflow Harness]
```
