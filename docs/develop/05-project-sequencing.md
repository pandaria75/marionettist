# Project Sequencing

## Strategy

Quill MVP is the mainline. Marionettist optimization is the feedback loop. Pi plugin work is a parallel experiment. Shared foundation is a delayed abstraction, not a current prerequisite.

This sequencing assumes Marionettist already has a stable enough mid-term Harness baseline to support forward motion now. The short-term need is not to re-prove basic viability, but to use real work to advance Quill, surface small issues, and collect evidence for later long-term decisions.

## Operating rules

1. Use `marionettist-pathway-opencode` to develop Quill.
2. Let Quill development expose real Marionettist problems.
3. Fix Harness issues immediately when they block Quill MVP.
4. Record non-blocking experience issues as Marionettist roadmap issues.
5. Delay pure architecture optimization.
6. Explore Pi plugin work on a separate branch.
7. Keep shared foundation work to documentation and evaluation until evidence exists.

## Issue handling during Quill work

- `blocking`: fix immediately.
- `non-blocking`: create an issue and roadmap it.
- `architecture-idea`: record for later evaluation.
- `future-work`: track after Quill MVP stabilizes.

See `01-quill-dogfooding-plan.md` for the detailed feedback protocol, required issue fields, and blocker triage rules.

## Sequence

- Phase 0: synchronize Marionettist docs and roadmap so short-term and long-term direction are explicit.
- Phase 1: use the existing Marionettist/OpenCode baseline to keep Quill MVP advancing.
- Phase 2: fix only genuinely blocking Marionettist problems immediately; record non-blocking friction for gradual follow-up.
- Phase 3: create `feature/pi-plugin-adapter` and validate a minimal Pi adapter in parallel without changing the Quill mainline.
- Phase 4: after Quill produces 2-3 real articles, collect workflow / artifact / checkpoint lessons from actual use.
- Phase 5: evaluate whether stable mechanisms should feed back into Marionettist long-term direction.
- Phase 6: decide later whether any shared foundation is justified.

```mermaid
flowchart TD
    A[Current baseline\nMarionettist already practical\nMid-term Harness exists] --> B{Which track?}

    B --> C[Short-term mainline\nAdvance Quill MVP now]
    B --> D[Existing mid-term baseline\nRefine Marionettist through real use]
    B --> E[Parallel experiment\nPi adapter stays isolated]
    B --> F[Long-term evolution\nEvidence-gated only]

    C --> C1[Use marionettist-pathway-opencode for Quill development]
    C1 --> C2[Build and iterate Quill MVP\nCLI / docs / workflow / style profile]
    C2 --> C3[Run article workflow\nbrief -> sources -> outline -> draft -> review -> final]
    C3 --> C4[Keep Quill moving while collecting feedback]

    D --> D1[Use current Harness baseline in real Quill work]
    D1 --> D2{Harness issue found?}
    D2 -->|Blocks accepted Quill progress| D3[Fix minimal blocker immediately]
    D2 -->|Non-blocking friction| D4[Record issue and continue]
    D2 -->|Architecture idea| D5[Capture for later evaluation]

    E --> E1[Create Pi plugin branch]
    E1 --> E2[Build minimal plugin scaffold / adapter only]
    E2 --> E3[Keep Pi experimental and separate from mainline]

    C4 --> G{Quill MVP stable enough\nfor stronger evidence?}
    G -->|Not yet| C2
    G -->|Yes| H[Collect repeated workflow / artifact / checkpoint lessons]

    H --> F
    F --> I{Are mechanisms repeated\nand boundaries stable?}
    I -->|No| J[Keep shared foundation deferred]
    I -->|Yes| K[Feed validated patterns back into Marionettist direction]
    K --> L[Broaden toward Agent Workflow Harness over time]
```

The long-term branch is intentionally evidence-gated. Pi remains experimental, and shared foundation work stays deferred unless repeated mechanisms survive real use across more than one workflow context.
