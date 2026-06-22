# Project: Physics Simulations Rebuild (7 Simulations)

## Architecture
- React component simulations placed in `src/components/simulations/`.
- Integrated via `src/components/PhysicsSimulationView.jsx` and `src/data/physicsSimulations.json`.
- Uses HTML5 Canvas or SVG for interactive graphics.
- Uses `useRef` for physics animation loops to avoid useState thrashing, maintaining 60fps performance.
- Sleek dark-mode aesthetic with Lucide React icons and glassmorphism styling.
- Minimum file size constraint: 8KB per simulation file (genuine physics/rendering logic, no facades).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | CustomCollisionLab | src/components/simulations/CustomCollisionLab.jsx | None | DONE (Conv: 4634cc31-924a-4195-b9ee-343657187c5f) |
| 2 | CustomCircuitConstructionKitDCVirtualLab | src/components/simulations/CustomCircuitConstructionKitDCVirtualLab.jsx | None | DONE (Conv: a505c219-5f67-4b4e-b7af-c9d4812afcd2) |
| 3 | CustomCapacitorLabBasics | src/components/simulations/CustomCapacitorLabBasics.jsx | None | DONE (Conv: 82896c3d-73d7-43d7-b976-98b741b90874) |
| 4 | CustomJohnTravoltage | src/components/simulations/CustomJohnTravoltage.jsx | None | DONE (Conv: e68dfb70-9251-44c3-8696-737e4e02205d) |
| 5 | CustomSimplifiedMRI | src/components/simulations/CustomSimplifiedMRI.jsx | None | DONE (Conv: d3be13c4-7561-4f0d-8c9e-33a815651397) |
| 6 | CustomModelsoftheHydrogenAtom | src/components/simulations/CustomModelsoftheHydrogenAtom.jsx | None | DONE (Conv: 8fbce2bc-be6b-48dc-9f24-98f65f6cf14c) |
| 7 | CustomRutherfordScattering | src/components/simulations/CustomRutherfordScattering.jsx | None | DONE (Conv: 8d1413f9-0251-477a-804e-0f34553ba01a) |
| 8 | Project Integration & Build Verification | Integration & verification check | None | DONE (Conv: 224b2fdc-e432-43fb-a86b-e07bd6163c0a) |

## Interface Contracts
### Simulation Component ↔ View Host
- Component exports default function accepting:
  - `onBack`: callback to return to the library view.
  - `title`: string title of the simulation.
- Component styling: Dark background, modern UI panels, fully self-contained.

## Code Layout
- Custom simulation files: `src/components/simulations/Custom*.jsx`
- Routing & Layout: `src/components/PhysicsSimulationView.jsx`
- Registry: `src/data/physicsSimulations.json`
