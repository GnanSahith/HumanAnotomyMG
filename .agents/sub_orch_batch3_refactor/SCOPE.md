# Scope: UI Refactoring Batch 3

## Architecture
- React simulation components built with HTML5 Canvas or SVG rendering and local React state.
- Dark-theme design wrapper with custom header, controls, and canvas container.
- Safe physics boundary constraints: do not touch physics loops, state logic, useRef, or requestAnimationFrame.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | CustomCircuitConstructionKitDC | Refactor styling of CustomCircuitConstructionKitDC.jsx | none | DONE |
| 2 | CustomCircuitConstructionKitDCVirtualLab | Refactor styling of CustomCircuitConstructionKitDCVirtualLab.jsx | none | DONE |
| 3 | CustomCircuitConstructionKitAC | Refactor styling of CustomCircuitConstructionKitAC.jsx | none | IN_PROGRESS |
| 4 | CustomChargesandFields | Refactor styling of CustomChargesandFields.jsx | none | PLANNED |
| 5 | CustomFaradaysLaw | Refactor styling of CustomFaradaysLaw.jsx | none | PLANNED |
| 6 | CustomOhmsLaw | Refactor styling of CustomOhmsLaw.jsx | none | PLANNED |
| 7 | CustomCoulombsLaw | Refactor styling of CustomCoulombsLaw.jsx | none | PLANNED |
| 8 | CustomJohnTravoltage | Refactor styling of CustomJohnTravoltage.jsx | none | PLANNED |
| 9 | CustomCapacitorLabBasics | Refactor styling of CustomCapacitorLabBasics.jsx | none | PLANNED |
| 10 | CustomResistanceinaWire | Refactor styling of CustomResistanceinaWire.jsx | none | PLANNED |

## Interface Contracts
- All 10 simulation components must accept `onBack` and `title` props.
- Standardized header displaying the `title` and a "Back" button calling `onBack()`.
- Global wrapper styling background: '#0a0a1a'.
