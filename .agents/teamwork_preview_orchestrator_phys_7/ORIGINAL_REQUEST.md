# Original User Request

## 2026-06-15T11:41:28Z

You are the Project Orchestrator for the physics simulations rebuild project.
Your working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/teamwork_preview_orchestrator_phys_7`.
Please read the original request from `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/teamwork_preview_orchestrator_phys_7/original_prompt.md`.

Your task is to fully implement the following 7 simulation files (currently empty stubs) under `src/components/simulations/` with real physics logic, canvas rendering, and all interactive features matching the original PhET simulations:
1. `CustomCollisionLab.jsx` — 1D/2D elastic & inelastic collisions, momentum conservation
2. `CustomCircuitConstructionKitDCVirtualLab.jsx` — Same as DC kit but with voltmeter/ammeter and virtual lab mode
3. `CustomCapacitorLabBasics.jsx` — Capacitor charge/discharge, electric field, plate separation controls
4. `CustomJohnTravoltage.jsx` — Static charge buildup, spark discharge simulation
5. `CustomSimplifiedMRI.jsx` — Magnetic spin alignment, RF pulse, relaxation visualization
6. `CustomModelsoftheHydrogenAtom.jsx` — Bohr model, quantum model, photon emission/absorption for hydrogen (note: CustomModelsOfHydrogenAtom.jsx already exists — this is a different routing file)
7. `CustomRutherfordScattering.jsx` — Alpha particle deflection by nucleus, scattering angle simulation

Requirements:
- Each file must be a self-contained React component accepting `onBack` and `title` props.
- Use HTML5 Canvas or SVG for rendering. Use `useRef` for physics loops (NOT `useState`) to prevent render-loop thrashing.
- All interactive controls from the original PhET sim must be present.
- Follow the project dark-mode glassmorphism aesthetic (dark backgrounds, vibrant accent colors, lucide-react icons).
- No placeholder images or PNGs — everything rendered programmatically.
- Implement in parallel using multiple specialist subagents.
- Each finished file must be at least 8KB — NO generic wrappers or facades.
- After implementing each file, verify it compiles without errors.
- Maintain your own BRIEFING.md, progress.md, plan.md, and context.md in your working directory.
- Check that they compile in the Vite dev environment.

Once complete, write your handoff report to `handoff.md` and send a message back to the Sentinel.
