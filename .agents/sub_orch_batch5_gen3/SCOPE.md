# Scope: Batch 5 (Light & Quantum)

## Architecture
- All 6 simulations must be fully implemented in `src/components/simulations/`.
- Must match the dark-mode glassmorphism theme, use HTML5 Canvas or SVG, and avoid render-loop thrashing (using refs instead of state for math loops).
- Minimum size per file: 8KB of genuine physics code. No stubs, wrappers, or external images/PNGs.

## Milestones
| # | Simulation / Feature | Target File | Dependencies | Status |
|---|----------------------|-------------|--------------|--------|
| 1 | Balloons and Static Electricity (phys_35_mg) | CustomBalloonsandStaticElectricity.jsx | none | PLANNED |
| 2 | Bending Light (phys_36_mg) | CustomBendingLight.jsx | none | PLANNED |
| 3 | Color Vision (phys_37_mg) | CustomColorVision.jsx | none | PLANNED |
| 4 | Molecules and Light (phys_38_mg) | CustomMoleculesandLight.jsx | none | PLANNED |
| 5 | Rutherford Scattering (phys_39_mg) | CustomRutherfordScattering.jsx | none | PLANNED |
| 6 | Models of the Hydrogen Atom (phys_40_mg) | CustomModelsoftheHydrogenAtom.jsx | none | PLANNED |

## Interface Contracts
### Routing and Export
- Every file must export the component as default (e.g. `export default function CustomBendingLight({ onBack, title })`).
- Components must accept `onBack` (callback to return to the library view) and `title` (string display) props.
- CustomModelsoftheHydrogenAtom.jsx must contain the Hydrogen Atom simulation implementation.
