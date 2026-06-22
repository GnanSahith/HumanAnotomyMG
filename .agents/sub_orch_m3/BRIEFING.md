# BRIEFING — 2026-06-14T17:45:53+05:30

## Mission
Implement 6 native custom simulation React components (Optics & Quantum Physics) under src/components/simulations/ matching the dark-mode aesthetic, authentic physics, and size constraints.

## 🔒 My Identity
- Archetype: Project Orchestrator
- Roles: orchestrator
- Working directory: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/sub_orch_m3
- Original parent: main agent
- Original parent conversation ID: 3995ed85-fae5-4ed5-a513-6422b27e6676

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/sub_orch_m3/SCOPE.md
1. **Decompose**: Decomposed by the 6 simulation files in Milestone 3
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: For each simulation, spawn Worker and Reviewer subagents to implement and verify the code.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: at 16 spawns, write handoff.md, spawn successor
- **Work items**:
  1. CustomBendingLight [in-progress]
  2. CustomColorVision [done]
  3. CustomMoleculesandLight [in-progress]
  4. CustomRutherfordScattering [pending]
  5. CustomSimplifiedMRI [pending]
  6. CustomModelsoftheHydrogenAtom [pending]
- **Current phase**: 2
- **Current focus**: CustomBendingLight, CustomMoleculesandLight

## 🔒 Key Constraints
- Worker must implement authentic physics and canvas/SVG rendering, size >= 8KB.
- No facades or wrappers.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh
- MANDATORY INTEGRITY WARNING must be included verbatim in each worker prompt.

## Current Parent
- Conversation ID: 3995ed85-fae5-4ed5-a513-6422b27e6676
- Updated: not yet

## Key Decisions Made
- Use canvas/SVG rendering with useRef to support 60fps performance and dark mode glassmorphism UI.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| Bending Light Worker | Worker | CustomBendingLight | in-progress | 78245321-0c61-4f3b-9235-fa5967ef90dc |
| Color Vision Worker | Worker | CustomColorVision | completed | 2035867d-dba9-46f1-849c-0400b9ab4a31 |
| Color Vision Reviewer | Reviewer | CustomColorVision | completed | 3f659958-1293-4a64-92b5-c1d7e6b37312 |
| Molecules and Light Worker | Worker | CustomMoleculesandLight | in-progress | 96622480-b7b7-4476-80ca-89e20eb1b3b3 |

## Succession Status
- Succession required: no
- Spawn count: 4 / 16
- Pending subagents: 78245321-0c61-4f3b-9235-fa5967ef90dc, 96622480-b7b7-4476-80ca-89e20eb1b3b3
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-21
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run manage_task(Action="list") — re-create if missing

## Artifact Index
- /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/sub_orch_m3/progress.md — progress tracker
- /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/sub_orch_m3/SCOPE.md — scope description
- /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/sub_orch_m3/ORIGINAL_REQUEST.md — user request copy
