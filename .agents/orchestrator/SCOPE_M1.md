# Scope: M1 (Motion & Work)

## Architecture
- Modules: `phys_8_mg`, `phys_9_mg`, `phys_10_mg`, `phys_11_mg`, `phys_12_mg`, `phys_13_mg`.
- Rebuild physics simulations natively.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | phys_8_mg | Balancing Act | none | PLANNED |
| 2 | phys_9_mg | Collision Lab | none | PLANNED |
| 3 | phys_10_mg | Center and Variability | none | PLANNED |
| 4 | phys_11_mg | Energy Skate Park: Basics | none | PLANNED |
| 5 | phys_12_mg | Hooke's Law | none | PLANNED |
| 6 | phys_13_mg | Masses and Springs: Basics | none | PLANNED |

## Interface Contracts
- Add `phys_X_mg` to `src/data/physicsSimulations.json`.
- Export default component from `src/components/simulations/<Name>.jsx`.
- Route in `src/components/PhysicsSimulationView.jsx`.
