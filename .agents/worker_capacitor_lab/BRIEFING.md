# BRIEFING — 2026-06-15T11:51:00Z

## Mission
Fully implement the capacitor simulation component `src/components/simulations/CustomCapacitorLabBasics.jsx` in React/Canvas matching PhET features and dark-mode glassmorphism styling.

## 🔒 My Identity
- Archetype: Specialist/Implementer
- Roles: implementer, qa, specialist
- Working directory: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_capacitor_lab/
- Original parent: 5fa7829a-1107-4647-8a86-fbeea1c8bff3
- Milestone: Rebuild Capacitor Lab Basics

## 🔒 Key Constraints
- Accept `{ onBack, title }` props and route back on back button click.
- Implement capacitance physics (C = epsilon_0 * A / d) with sliders for Plate Area and Plate Separation.
- Implement connection modes: Connect to Battery (variable voltage slider -1.5V to +1.5V), Disconnect, Connect to Lightbulb.
- Implement charge accumulation (moving plus/minus symbols on plates) and electric field lines (intensity/density proportional to charge).
- Show bar meters for Capacitance, Plate Charge, and Stored Energy.
- Implement a draggable Voltmeter probe to measure potential difference.
- Implement physics loop inside a `useRef` animation loop (no render thrashing).
- Follow dark-mode glassmorphism styling, clean modern layout, and Lucide React icons.
- Ensure the file is at least 8KB in size (genuine physics/rendering, no simple wrapper).
- Verify compilation of the code.

## Current Parent
- Conversation ID: 5fa7829a-1107-4647-8a86-fbeea1c8bff3
- Updated: not yet

## Task Summary
- **What to build**: CustomCapacitorLabBasics.jsx
- **Success criteria**: Genuine physics, >8KB, correct equations, interactive Controls, draggable Voltmeter, compiles, glassmorphism UI.
- **Interface contracts**: Accept `{ onBack, title }` props.
- **Code layout**: src/components/simulations/CustomCapacitorLabBasics.jsx

## Key Decisions Made
- Moved helper functions (`getPointOnPath`, `checkConnection`, `getBatteryVertices`, `getLightbulbVertices`) outside the React component to satisfy ESLint variable-declaration hoisting checks.
- Implemented high-performance direct DOM references for the bar meters to completely avoid React render thrashing at 60fps.
- Designed closed-loop wiring paths for charging and discharging to animate electron flow with physical drift speed.
- Created snapped docked state for Voltmeter red/black probes.
- Synchronized on-canvas battery voltage slider and plate dimensions vertical/horizontal dragging with React state.

## Artifact Index
- /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_capacitor_lab/progress.md — progress tracking and heartbeat
- /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_capacitor_lab/handoff.md — final handoff report

## Change Tracker
- **Files modified**:
  - `src/components/simulations/CustomCapacitorLabBasics.jsx` — Complete implementation of physics simulation.
- **Build status**: Pass
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (Vite production build succeeds)
- **Lint status**: 0 errors/warnings (ESLint checks pass cleanly)
- **Tests added/modified**: None (no tests in src/)

## Loaded Skills
- None
