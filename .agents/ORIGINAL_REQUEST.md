# Original User Request

## Initial Request — 2026-06-14T00:55:17+05:30

**Project description** – Rebuild the remaining physics simulations from `physicsSimulations.json` into native, custom React/Canvas applications. Each new “_mg” simulation must faithfully reproduce **all** original options, toggles, sliders, and physical behavior, while using only programmatic rendering (no copied PNGs). We have already completed 12. Skip those and continue with the rest.

**Working directory:** `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable`

**Integrity mode:** development  

## Requirements

### R1. 100 % Logic & Feature Parity  
Every interactive element (options, sliders, toggles, etc.) from the original PhET simulation must be implemented. Lightweight physics/math libraries may be used if they improve speed/accuracy. No images or PNGs may be copied; all rendering must be done with CSS, Canvas, or SVG.

### R2. Premium UI (basic version)  
All simulations must follow the project’s dark‑mode, glassmorphism aesthetic with `lucide‑react` icons and smooth Canvas rendering. Full styling polish can be added later during the review phase.

### R3. Complete Suite Integration  
Each completed simulation must be added to `src/data/physicsSimulations.json` with an `_mg` suffix and `"isNative": true`, and routed in `src/components/PhysicsSimulationView.jsx` so all 45 simulations load without errors.

## Acceptance Criteria

### Verification (Agent‑as‑Judge)  
- [ ] Every rebuilt simulation runs without crashing in the Vite development server.  
- [ ] The visual style matches the dark‑mode/glassmorphism baseline (basic version).  
- [ ] An independent auditing agent cross‑checks each simulation against the original PhET version to confirm **100 % feature parity**.  
- [ ] `physicsSimulations.json` and `PhysicsSimulationView.jsx` successfully route all 45 simulations (no missing entries or routing errors).

## Follow-up — 2026-06-15T11:39:58+05:30

You are resuming an ongoing physics simulation rebuild project. The working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable`.

The following 7 simulation files are currently EMPTY STUBS (~185 bytes each) and need to be FULLY implemented with real physics logic, canvas rendering, and all interactive features matching the original PhET simulations:

1. `CustomCollisionLab.jsx` — 1D/2D elastic & inelastic collisions, momentum conservation
2. `CustomCircuitConstructionKitDCVirtualLab.jsx` — Same as DC kit but with voltmeter/ammeter and virtual lab mode
3. `CustomCapacitorLabBasics.jsx` — Capacitor charge/discharge, electric field, plate separation controls
4. `CustomJohnTravoltage.jsx` — Static charge buildup, spark discharge simulation
5. `CustomSimplifiedMRI.jsx` — Magnetic spin alignment, RF pulse, relaxation visualization
6. `CustomModelsoftheHydrogenAtom.jsx` — Bohr model, quantum model, photon emission/absorption for hydrogen (note: CustomModelsOfHydrogenAtom.jsx already exists — this is a different routing file)
7. `CustomRutherfordScattering.jsx` — Alpha particle deflection by nucleus, scattering angle simulation

## Requirements
- Each file must be a self-contained React component accepting `onBack` and `title` props.
- Use HTML5 Canvas or SVG for rendering. Use `useRef` for physics loops (NOT `useState`) to prevent render-loop thrashing.
- All interactive controls from the original PhET sim must be present.
- Follow the project dark-mode glassmorphism aesthetic (dark backgrounds, vibrant accent colors, lucide-react icons).
- No placeholder images or PNGs — everything rendered programmatically.
- Implement in parallel using multiple specialist subagents.
- Each finished file must be at least 8KB — NO generic wrappers or facades.
- After implementing each file, verify it compiles without errors.

## Acceptance Criteria
- All 7 stub files replaced with real implementations of at least 8KB each.
- An independent auditing agent must verify feature parity with the original PhET simulation before claiming victory.
