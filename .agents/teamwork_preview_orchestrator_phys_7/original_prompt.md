## Original request for Rebuilding 7 Simulations

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
