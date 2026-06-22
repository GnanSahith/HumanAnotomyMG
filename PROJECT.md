# Project: Physics Simulations Rebuild (16 Remaining)

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
| 1 | Mechanics & Statistics | CustomBalancingAct, CustomCollisionLab, CustomCenterandVariability, CustomEnergySkateParkBasics, CustomHookesLaw, CustomMassesandSpringsBasics | None | IN_PROGRESS (Conv: 411ad5f3-0fe3-4f22-9cb8-136ac1217333) |
| 2 | Electricity & Circuits | CustomCircuitConstructionKitDC, CustomCircuitConstructionKitDCVirtualLab, CustomCapacitorLabBasics, CustomJohnTravoltage | None | IN_PROGRESS (Conv: 8f6cc3a4-100f-445e-8850-355af909beb1) |
| 3 | Optics & Quantum Physics | CustomBendingLight, CustomColorVision, CustomMoleculesandLight, CustomRutherfordScattering, CustomSimplifiedMRI, CustomModelsoftheHydrogenAtom | None | IN_PROGRESS (Conv: 0068667c-803f-4f7f-8732-c5355f88a5c5) |

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
