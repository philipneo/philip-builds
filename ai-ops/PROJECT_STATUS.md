# Philip Builds Studio — Project Status
## Current checkpoint
The site has already had:
- 7 practical demos added.
- Homepage upgraded.
- Portfolio upgraded.
- Local Business Command Center flagship added.
- Latest known pushed cinematic checkpoint: `398d4c2`.
## Current problem
The demos still feel too short and static. Tier 1 demos need a full product-level rebuild with phone mockups, desktop mockups, scroll depth, and animation.
## Current task
Set up `ai-ops/` handoff system so Claude and Codex can coordinate through repo files instead of manual copy/paste.
## Next task
Claude should write the full creative spec and Codex task brief into:
- `ai-ops/CLAUDE_SPEC.md`
- `ai-ops/CODEX_TASKS.md`
Then Codex should execute from `ai-ops/CODEX_TASKS.md`.
## Production workflow
1. Claude writes creative spec and Codex task files.
2. Codex reads task files and executes.
3. Codex writes QA/build report.
4. Claude reviews Codex report.
5. Philip says `run` only if safe.
6. Codex commits/pushes.
7. Project status gets updated.
## Safety rule
No private files, Gmail, outreach, `.claude/`, fake claims, or unapproved commits.
