## Challenge Summary

**Overall risk assessment**: HIGH

## Observation
1. In `updatePhysics`, `PE_grav` is calculated as `const h = 8 - ps.y; ps.PE_grav = s.massValue * gravity * h;`. The energy graph bar height is computed as `const peGravH = Math.min((ps.PE_grav / maxE) * 100, 100);` and passed to a `div` as `height: ${peGravH}px`.
2. The equilibrium position of the spring is `restLength + (mass * gravity) / k`. With Mass = 2kg, k = 1 N/m, and Gravity = 9.81 m/s², `y` reaches `2 + 19.62 = 21.62` meters.
3. In `updatePhysics`, the stopwatch time updates via `if (stopwatchRunning) { setStopwatchTime(prev => prev + dt); }`, which occurs outside the `isPlaying` condition.
4. When bounding `y < 0.1`, the engine does `ps.vy *= -0.5`, reducing kinetic energy by 75% without adding the difference to `ps.thermalEnergy`.

## Logic Chain
1. **Energy Graph CSS Bug**: Because `ps.y` can easily exceed `8` meters (e.g., reaching 21.62m when `k=1`), `h = 8 - ps.y` becomes negative. This produces a negative `PE_grav`, resulting in a negative `peGravH`. The React inline style evaluates to `height: -XXpx`. The browser ignores negative CSS heights, causing the `PEg` bar to disappear completely instead of bottoming out at 0.
2. **Stopwatch Desync**: The `dt` value is calculated and added to the stopwatch every frame, regardless of whether `isPlaying` is true. If the simulation is paused, the physics engine freezes, but the stopwatch keeps counting. This defeats the purpose of the stopwatch for measuring precise periods, as physical time and simulation time decouple.
3. **Energy Destruction**: The inelastic collision with the ceiling destroys kinetic energy. Because the simulation explicitly tracks `thermalEnergy` to demonstrate energy conservation, failing to add this lost KE to `thermalEnergy` breaks the First Law of Thermodynamics in the UI's tracked totals.

## Caveats
- The scale of the energy graph (`maxE = 200`) is arbitrary and hardcoded. Even positive energies will quickly hit the 100px cap and stop growing visually. This is a design limitation rather than a hard bug, so it is omitted from the critical logic chain.
- The simulation does not bound `ps.y` on the bottom, allowing masses to stretch infinitely far off-screen.

## Conclusion
The physics engine and new features contain logic flaws that break the UI and physical accuracy. The Energy Graph fails to handle negative gravitational potential energy (resulting in invalid CSS), the Stopwatch desynchronizes from simulation time when paused, and ceiling collisions violate energy conservation by destroying kinetic energy without converting it to thermal energy.

## Verification Method
1. **Energy Graph**: Launch the app, select `Mass = 2 kg` and `Spring Constant = 1`. Enable the Energy Graph. Observe the `PEg` bar disappear as `y` exceeds 8 meters and the CSS height becomes negative.
2. **Stopwatch**: Pause the simulation (`isPlaying = false`). Start the stopwatch. Observe that the stopwatch time continues to increase despite the physics engine being frozen.
3. **Code Inspection**: Check `src/components/simulations/CustomMassesAndSprings.jsx` at line ~400 for the `height` style application, line ~130 for the `stopwatchRunning` logic, and line ~160 for the ceiling bounce logic.
