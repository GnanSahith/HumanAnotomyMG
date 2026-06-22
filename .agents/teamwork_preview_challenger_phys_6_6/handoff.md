# Handoff Report

## Observation
1. In `src/components/simulations/CustomMassesAndSprings.jsx`, the `handlePointerMove` function limits upward dragging (`if (newY < 0.2) newY = 0.2;`) but lacks a limit for downward dragging against `MAX_Y = 8.0`.
2. In `updatePhysics`, the boundary collision logic handles limits via:
   ```javascript
   if (ps.y > MAX_Y) {
       ps.y = MAX_Y;
       const oldVy = ps.vy;
       ps.vy *= -0.5; // bounce
       const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
       ps.thermalEnergy += dKE;
   }
   ```
3. If parameters are set such that equilibrium is below the floor (e.g., Gravity = 24.79 (Jupiter), Mass = 2kg, k = 1 N/m), the net force pulls the mass continuously into the floor boundary.
4. Pausing the simulation stops Euler integration correctly, while still allowing drag events to update `ps.y` and derived energies. Resuming uses `lastTimeRef.current = performance.now()` in `useEffect` cleanup, preventing `dt` spikes.

## Logic Chain
1. **Stretching Below Screen (Teleportation Bug)**: Because dragging is unbounded downwards, a user can drag the mass to `y = 100`. When released, the very first physics sub-step detects `ps.y > MAX_Y` and instantly sets `ps.y = 8.0`. This visually manifests as a jagged teleportation. Additionally, the massive amount of stored Spring Potential Energy is instantly destroyed without being converted to kinetic or thermal energy, violating conservation.
2. **Bouncing on Limits (Infinite Thermal Energy Bug)**: When a heavy mass rests on the bottom boundary (`MAX_Y`), it experiences a constant downward acceleration. Every substep, it gains a tiny positive velocity `vy = ay * subDt`. It then immediately hits the boundary, is forced back to `8.0`, and its velocity is reversed and halved (`vy *= -0.5`). This constant micro-collision generates a tiny amount of `dKE` every substep. Over time, this `dKE` accumulates, causing the Thermal Energy to rise infinitely even though the mass is visually at rest.
3. **Pausing/Resuming (Correct Behavior)**: The pause/resume functionality works flawlessly. Dragging while paused updates the energy graph correctly without incrementing simulation time. Unpausing safely recalculates a fresh `realDt`, avoiding any simulation "explosions" or time jumps.

## Caveats
- No caveats. The physical simulation math was verified manually by tracing Euler steps.

## Conclusion
The iteration 3 fixes for pause/resume are robust, but the boundary handling contains critical physics bugs. Dragging below the floor causes teleportation and energy loss, while resting on the floor causes an infinite thermal energy leak due to the lack of a proper "resting contact" solver.

## Verification Method
1. **Teleportation Bug**: Run the app, drag a mass far below the screen, and let go. Observe the mass instantly snap back to the bottom of the screen instead of flying up naturally.
2. **Thermal Energy Bug**: Set Gravity to Jupiter (24.79), Mass to 2kg, and Spring Constant (k) to 1. Let the mass hit the bottom of the screen. Enable "Show Energy Graph" and observe the red Thermal Energy bar continuously grow forever while the mass is sitting perfectly still.
