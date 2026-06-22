# Investigation Handoff

## Observation
- **Energy Graph CSS Crash**: The failure report highlights a crash due to negative CSS height. Code inspection of `src/components/simulations/CustomMassesAndSprings.jsx` confirms that at line 399, `peGravH` is calculated as `Math.min((ps.PE_grav / maxE) * 100, 100)`. If `ps.PE_grav` is negative, `peGravH` becomes negative, leading to an invalid CSS height string.
- **Stopwatch Desync**: The stopwatch continues when paused. In `updatePhysics` (line 130), `setStopwatchTime` increments by `dt` simply if `stopwatchRunning` is true, without checking `isPlaying`.
- **Energy Destruction**: When hitting the ceiling at `ps.y < 0.1` (line 158), `ps.vy` is halved and reversed (`ps.vy *= -0.5`). The kinetic energy difference is lost and not transferred to `ps.thermalEnergy`.
- **Thermal Accumulation**: When a user drags the mass (`handlePointerDown`, line 195), `ps.vy` is reset to 0, but `ps.thermalEnergy` is not cleared, causing it to accumulate indefinitely across multiple drags.
- **60 FPS Re-render**: `updatePhysics` calculates sub-steps and unconditionally calls `setSimState([...physicsRef.current])` (line 179) every frame, causing 60 FPS React re-renders even when the simulation is paused (`!isPlaying`) and no mass is being dragged.

## Logic Chain
Based on the observations, here is the exact strategy to implement the missing fixes:
1. **Fix Energy Graph CSS Crash**: 
   Change line 399 to take the absolute value of energy: 
   `const peGravH = Math.min((Math.abs(ps.PE_grav) / maxE) * 100, 100);`
2. **Fix Stopwatch Desync**:
   Change the stopwatch increment logic (line 130) to require both running and playing states:
   `if (stopwatchRunning && isPlaying) { setStopwatchTime(prev => prev + dt); }`
3. **Fix Energy Destruction**:
   In the ceiling bounce condition (line 158), calculate the kinetic energy lost and add it to thermal energy:
   ```javascript
   if (ps.y < 0.1) {
       ps.y = 0.1;
       const oldVy = ps.vy;
       ps.vy *= -0.5; // bounce
       const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
       ps.thermalEnergy += dKE;
   }
   ```
4. **Fix Thermal Accumulation**:
   In `handlePointerDown` (line 195), add a reset for thermal energy when dragging begins:
   ```javascript
   if (ps) {
       ps.isDragging = true;
       ps.vy = 0;
       ps.thermalEnergy = 0; // Added reset
       setSelectedSpringId(id);
   }
   ```
5. **Fix 60 FPS Re-render**:
   At the beginning of `updatePhysics` (around line 121), add an early return if the simulation is paused and nothing is being dragged, skipping the state update:
   ```javascript
   const realDt = (time - lastTimeRef.current) / 1000;
   lastTimeRef.current = time;

   const anyDragging = physicsRef.current.some(ps => ps.isDragging);
   if (!isPlaying && !anyDragging) {
       requestRef.current = requestAnimationFrame(updatePhysics);
       return;
   }
   ```

## Caveats
- Using `Math.abs(ps.PE_grav)` prevents the negative CSS height crash but makes negative gravitational potential energy render visually identical to positive energy. If visual distinction is necessary, a CSS transform (e.g., `transform: ps.PE_grav < 0 ? 'scaleY(-1)' : 'none'`) could be applied to the bar. However, taking the absolute value is sufficient to resolve the crash and satisfies the minimum fix strategy.
- No other files need to be modified; all issues are isolated to `CustomMassesAndSprings.jsx`.

## Conclusion
The implementation strategy for the 5 bugs from iteration 3 has been fully identified with exact code changes targeting `src/components/simulations/CustomMassesAndSprings.jsx`. The root causes have been traced and resolutions map directly to the vetoes in the failure report. The implementer can apply these exact code snippets directly.

## Verification Method
1. **Energy Graph**: Pull the spring downwards until `y > 8` (bottom of the screen). Verify the app does not crash and the PEg bar renders properly.
2. **Stopwatch**: Start the stopwatch, then pause the simulation. Verify the stopwatch stops incrementing.
3. **Energy Destruction**: Drag the mass down and release it so it shoots up and hits the ceiling. Verify the red thermal energy bar suddenly increases upon collision.
4. **Thermal Accumulation**: Observe the thermal energy bar. Drag the mass again. Verify the thermal energy bar instantly drops to 0.
5. **Re-renders**: With the simulation paused and not interacting with the mass, use React DevTools Profiler to ensure `CustomMassesAndSprings` is not re-rendering.
