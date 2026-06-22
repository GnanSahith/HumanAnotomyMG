# Synthesis of phys_6 Strategy (Iteration 4)

## Consensus
- **Drag Lower Bounds (Teleport Glitch)**: In `handlePointerMove`, clamp `newY` at the bottom boundary: `if (newY > 8.0) newY = 8.0;`. This prevents stretching infinitely below the screen and teleporting on release.
- **Infinite Thermal Energy Leak (Resting Contact Solver)**: When the mass hits the floor limit (`y >= 8.0`) and its velocity is very low (`Math.abs(vy) < 0.2`), simply set `vy = 0` and snap `y = 8.0` instead of multiplying by `-0.5` and accumulating thermal energy. This acts as a resting contact solver to prevent micro-collisions and infinite thermal energy buildup.
- **60 FPS Re-render Optimization**: The reviewer feedback regarding `setSimState` re-rendering the component at 60 FPS is correct in that it hurts performance. To fix this, change the SVG elements to use `React.useRef` (e.g. `massRef1`, `springRef1`, `energyBarRef`) and update their DOM attributes directly inside `updatePhysics` via `massRef1.current.setAttribute('y', newY)`, rather than calling `setSimState` in the `requestAnimationFrame` loop. This entirely avoids React re-renders during the physics simulation.

## Resolution
The Worker must edit `CustomMassesAndSprings.jsx` to apply these 3 specific fixes.

## Important Note
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
