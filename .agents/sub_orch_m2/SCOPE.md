# Scope: Milestone 2 - Electricity & Circuits

## Architecture
- Implementation of 4 native custom simulation React components:
  1. `CustomCircuitConstructionKitDC.jsx`
  2. `CustomCircuitConstructionKitDCVirtualLab.jsx`
  3. `CustomCapacitorLabBasics.jsx`
  4. `CustomJohnTravoltage.jsx`
- Location: `src/components/simulations/`
- Aesthetic: dark-mode glassmorphism, responsive controls, Lucide React icons, Canvas or SVG rendering.
- Performance: smooth 60fps Canvas/SVG animation using `useRef` for physics animation loops.
- Size constraint: >= 8KB per file. No facades or wrappers.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | CustomCircuitConstructionKitDC | Interactive DC circuit builder: resistors, batteries, switches, bulbs, current visualization | None | PLANNED |
| 2 | CustomCircuitConstructionKitDCVirtualLab | DC kit with voltmeter/ammeter measurements and virtual lab mode | None | PLANNED |
| 3 | CustomCapacitorLabBasics | Capacitor charge/discharge, electric field, plate separation, voltage controls | None | PLANNED |
| 4 | CustomJohnTravoltage | Static charge buildup, body potential, spark discharge simulation with sound/visual indicators | None | PLANNED |
