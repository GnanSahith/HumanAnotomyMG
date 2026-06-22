# BRIEFING — 2026-06-15T11:44:17+05:30

## Mission
Implement a rich, fully interactive React component for Custom Rutherford Scattering physics simulation.

## 🔒 My Identity
- Archetype: Rutherford Scattering Specialist
- Roles: implementer, qa, specialist
- Working directory: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_rutherford/
- Original parent: 5fa7829a-1107-4647-8a86-fbeea1c8bff3
- Milestone: Rutherford Scattering Component Implementation

## 🔒 Key Constraints
- Must accept `{ onBack, title }` props and route back on back button click.
- Implement Coulomb scattering physics: positive alpha particles deflect due to repulsive force from gold nucleus.
- Two modes: "Rutherford Atom" (concentrated positive nucleus at center) and "Plum Pudding Atom" (diffuse positive charge).
- Controls for speed/energy, nucleus atomic number Z, and beam position/width.
- Visual track/trace of alpha particle paths.
- Graph showing a histogram of scattering angles.
- File size must be >= 8KB of genuine code.
- Verify compilation without errors.
- DO NOT CHEAT (no hardcoding or facade implementations).

## Current Parent
- Conversation ID: 5fa7829a-1107-4647-8a86-fbeea1c8bff3
- Updated: 2026-06-15T11:44:17+05:30

## Task Summary
- **What to build**: Rich, interactive CustomRutherfordScattering component in React.
- **Success criteria**: Genuine physics simulation, two modes (Rutherford/Plum Pudding), interactive controls, path traces, angle histogram, size >= 8KB, error-free build.
- **Interface contracts**: `src/components/simulations/CustomRutherfordScattering.jsx` accepting `{ onBack, title }`.
- **Code layout**: Component in React/Vite.

## Key Decisions Made
- Use HTML5 Canvas for smooth simulation rendering of alpha particles.
- Use Euler or Verlet integration for real-time Coulomb force physics.
- Implement custom rendering for UI controls and custom SVG or Canvas chart for the histogram to keep dependencies minimal.

## Artifact Index
- `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomRutherfordScattering.jsx` — Target component implementation.

## Change Tracker
- **Files modified**: None
- **Build status**: TBD
- **Pending issues**: None

## Quality Status
- **Build/test result**: TBD
- **Lint status**: TBD
- **Tests added/modified**: TBD

## Loaded Skills
None
