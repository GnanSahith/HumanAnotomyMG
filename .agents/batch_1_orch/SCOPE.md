# Scope: Batch 1 Simulations Rebuild

## Architecture
- React frontend in `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src`
- Implement each simulation as a native React/Canvas component matching `phys_1_mg` style.
- Register each in `src/data/physicsSimulations.json` with `isNative: true`.
- Route each in `src/components/PhysicsSimulationView.jsx`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | phys_6 | Rebuild phys_6 | none | PLANNED |
| 2 | phys_8 | Rebuild phys_8 | none | PLANNED |
| 3 | phys_9 | Rebuild phys_9 | none | PLANNED |
| 4 | phys_10 | Rebuild phys_10 | none | PLANNED |
| 5 | phys_11 | Rebuild phys_11 | none | PLANNED |
| 6 | phys_12 | Rebuild phys_12 | none | PLANNED |
| 7 | phys_13 | Rebuild phys_13 | none | PLANNED |

## Interface Contracts
- Simulations ↔ JSON Data: Updates to `physicsSimulations.json` append `_mg` id.
- Simulations ↔ Routing: Export the component and render conditionally in `PhysicsSimulationView.jsx` when simulation `id` matches.
