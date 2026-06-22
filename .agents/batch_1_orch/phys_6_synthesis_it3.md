# Synthesis of phys_6 Strategy (Iteration 3)

## Consensus
- **Energy Graph CSS Crash**: Ensure `PE_grav` does not cause negative heights. Add a fixed reference datum `const PE_datum = 6.0;` (or similar max drop). Change the height calculation to use absolute value `Math.abs(PE_grav)` and if it's negative, render it below the axis line using CSS transforms or distinct absolute positioning.
- **Stopwatch Desync**: In the `updatePhysics` loop, the stopwatch increment `setStopwatchTime(prev => prev + dt)` must be wrapped inside `if (isPlaying) { ... }`.
- **Energy Destruction**: In the floor/ceiling collision logic (`y < 0.1` or `y > MAX`), when `ps.vy *= -0.5;`, calculate the lost kinetic energy `dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy)` and add it to `ps.thermalEnergy`.
- **Thermal Accumulation**: Reset `ps.thermalEnergy = 0;` inside the `handlePointerDown` function when a user grabs the mass, or when the `Reset` button is pressed.
- **60 FPS Re-render**: At the top of `updatePhysics`, add an early return: `if (!isPlaying && !springs.some(s => s.isDragging)) return;` so that React state is not updated unnecessarily when paused.

## Resolution
The Worker must edit `CustomMassesAndSprings.jsx` to apply these 5 specific fixes.

## Important Note
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
