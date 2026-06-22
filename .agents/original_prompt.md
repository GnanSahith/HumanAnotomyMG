# Original User Request

## Initial Request — 2026-06-13T12:43:25Z

**Project description** – Rebuild the remaining physics simulations from `physicsSimulations.json` into native, custom React/Canvas applications. Each new “_mg” simulation must faithfully reproduce **all** original options, toggles, sliders, and physical behavior, while using only programmatic rendering (no copied PNGs).

**Working directory:** `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable`

**Integrity mode:** development  

## Requirements

### R1. 100% Logic & Feature Parity  
Every interactive element (options, sliders, toggles, etc.) from the original PhET simulation must be implemented. Lightweight physics/math libraries may be used if they improve speed/accuracy. No images or PNGs may be copied; all rendering must be done with CSS, Canvas, or SVG.

### R2. Premium UI (basic version)  
All simulations must follow the project’s dark‑mode, glassmorphism aesthetic with `lucide‑react` icons and smooth Canvas rendering. Full styling polish can be added later during the review phase.

### R3. Complete Suite Integration  
Each completed simulation must be added to `src/data/physicsSimulations.json` with an `_mg` suffix and `"isNative": true`, and routed in `src/components/PhysicsSimulationView.jsx` so all 45 simulations load without errors.

## Acceptance Criteria

### Verification (Agent‑as‑Judge)  
- [ ] Every rebuilt simulation runs without crashing in the Vite development server.  
- [ ] The visual style matches the dark‑mode/glassmorphism baseline (basic version).  
- [ ] An independent auditing agent cross‑checks each simulation against the original PhET version to confirm **100% feature parity**.  
- [ ] `physicsSimulations.json` and `PhysicsSimulationView.jsx` successfully route all 45 simulations (no missing entries or routing errors).
