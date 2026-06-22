# Synthesis of phys_6 Strategy

## Consensus
- Create `src/components/simulations/CustomMassesAndSprings.jsx` mimicking the structure, aesthetics, and dark-mode styling of `src/components/simulations/CustomProjectileMotion.jsx` (`phys_1_mg`).
- The component must use `requestAnimationFrame` with Euler sub-stepping integration for physics simulation (Hooke's Law: $F_{spring} = -k \times (y - L_{rest})$). Total vertical acceleration will be $a_y = g - (k/m) \times (y - L_{rest}) - (c/m) \times v_y$.
- Use `<svg>` for graphics: a zigzag path for the spring, a rect for the mass. Implement pointer events for dragging the mass.
- Right sidebar must have controls for: Mass ($m$), Spring Constant ($k$), Damping ($c$), Gravity ($g$), and toggles for vectors.
- Add `phys_6_mg` to `src/data/physicsSimulations.json` based on the existing `phys_6` but set `"isNative": true` and `"title": "Masses and Springs MG"`.
- Update `src/components/PhysicsSimulationView.jsx` to import and conditionally render `CustomMassesAndSprings` for `activeSimulation.id === 'phys_6_mg'`.

## Resolved Conflicts
- Use SVG rendering as it matches `phys_1_mg` and is straightforward for spring rendering.

## Gaps
- None.

## Important Note
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
