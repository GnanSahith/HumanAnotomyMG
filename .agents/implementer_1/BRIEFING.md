# BRIEFING — 2026-06-13T18:14:00+05:30

## Mission
Implement the native React/Canvas version of `phys_22` (Sound Waves) according to the Handoff Report.

## 🔒 My Identity
- Archetype: Implementer
- Roles: implementer, qa, specialist
- Working directory: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/implementer_1
- Original parent: af83f5e4-1193-44b4-9f03-bee0d40a70c1
- Milestone: phys_22 implementation

## 🔒 Key Constraints
- Native custom build inside `SoundWaves_mg.jsx`
- Handle resizing and efficiently render sound waves using `ImageData` reuse
- Update `PhysicsSimulationView.jsx` and `physicsSimulations.json`
- Ensure build passes

## Current Parent
- Conversation ID: af83f5e4-1193-44b4-9f03-bee0d40a70c1
- Updated: 2026-06-13T18:14:00+05:30

## Task Summary
- **What to build**: SoundWaves_mg.jsx
- **Success criteria**: Functional Sound Waves canvas simulation, matching aesthetics, and routing
- **Interface contracts**: Match CustomStatesOfMatter.jsx style
- **Code layout**: Component in src/components/simulations, route in src/components/PhysicsSimulationView.jsx, config in src/data/physicsSimulations.json

## Key Decisions Made
- Use ImageData buffer reuse for performance in SoundWaves_mg.jsx

## Artifact Index
- [TBD]
