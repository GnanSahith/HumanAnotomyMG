# Observation
- **Target File**: `src/components/simulations/CustomMassesAndSprings.jsx`
- **Energy Graph CSS Crash**: At lines 398-401, values like `peGravH` are calculated and then passed directly to inline CSS height attributes (line 410). If `PE_grav` is negative, this results in negative pixel values which crash the layout.
- **Stopwatch Desync**: At lines 130-132, the stopwatch increments simply if `stopwatchRunning` is true, ignoring `isPlaying`.
- **Energy Destruction**: At lines 158-161, a hardcoded bounce (`ps.vy *= -0.5`) cuts velocity by half, but does not allocate the resulting lost kinetic energy to `thermalEnergy`.
- **Thermal Accumulation**: At lines 195-202 (`handlePointerDown`), velocity is zeroed and dragging starts, but `ps.thermalEnergy` is not zeroed. Over time, dragging pumps more and more energy into the system's thermal pool without clearing it.
- **60 FPS Re-render**: In `updatePhysics` (lines 112-182), `setSimState` is called unconditionally on every animation frame, even if `isPlaying` is false and no masses are being dragged.

# Logic Chain
1. To fix the Energy Graph crash, taking `Math.max(0, ...)` for the height guarantees a valid CSS pixel value and prevents crash behavior, gracefully hiding negative energies or displaying them at zero height.
2. To fix the Stopwatch desync, the stopwatch increment logic must be gated by `isPlaying`. Adding `&& isPlaying` to the condition resolves it.
3. To fix Energy Destruction during bounces, the difference between the old kinetic energy and the new kinetic energy must be added to `ps.thermalEnergy`. `dKE = 0.5 * m * (oldVy^2 - newVy^2)`.
4. To fix Thermal Accumulation, clearing `ps.thermalEnergy = 0` in `handlePointerDown` resets the thermal pool when the user explicitly interacts and "resets" the mass's state.
5. To fix the 60 FPS Re-render issue, we can detect if simulation is paused (`!isPlaying`) and no springs are dragging (`!physicsRef.current.some(p => p.isDragging)`). If both are true, we can simply re-request the animation frame and `return` early, skipping integration and the React `setSimState` call.

# Caveats
- Using `Math.max(0, ...)` for the graph bars means negative potential energy won't be visibly drawn below the axis, but it prevents the crash. If a below-axis visual is strictly required, more extensive changes to the SVG/HTML layout of the bar graph would be needed. This strategy prioritizes stability.
- We must ensure we do not block `updatePhysics` completely if a parameter changes while paused; however, `useEffect` already catches parameter changes and triggers `handleReset` which updates `simState` directly.

# Conclusion
Implement the following targeted fixes in `CustomMassesAndSprings.jsx`:

1. **Energy Graph**: Wrap CSS height calculations in `Math.max(0, ...)`:
   ```javascript
   const keH = Math.max(0, Math.min((ps.KE / maxE) * 100, 100));
   const peGravH = Math.max(0, Math.min((ps.PE_grav / maxE) * 100, 100));
   const peSprH = Math.max(0, Math.min((ps.PE_spring / maxE) * 100, 100));
   const thermH = Math.max(0, Math.min((ps.thermalEnergy / maxE) * 100, 100));
   ```
2. **Stopwatch**:
   ```javascript
   if (stopwatchRunning && isPlaying) {
       setStopwatchTime(prev => prev + dt); 
   }
   ```
3. **Energy Destruction**:
   ```javascript
   if (ps.y < 0.1) {
       ps.y = 0.1;
       const oldVy = ps.vy;
       ps.vy *= -0.5; // bounce
       const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
       ps.thermalEnergy += dKE;
   }
   ```
4. **Thermal Accumulation**: Add `ps.thermalEnergy = 0;` inside `handlePointerDown`.
5. **Re-render Optimization**: Inside `updatePhysics` right after calculating `dt`:
   ```javascript
   const isAnyDragging = physicsRef.current.some(p => p.isDragging);
   if (!isPlaying && !isAnyDragging) {
       requestRef.current = requestAnimationFrame(updatePhysics);
       return;
   }
   ```

# Verification Method
Run the React application and open `phys_6`.
1. Pull the mass far down to trigger negative PE_grav and verify the UI does not crash.
2. Start the stopwatch, pause the simulation, and verify the stopwatch stops incrementing.
3. Throw the mass into the ceiling and verify Thermal energy spikes upon collision.
4. Drag the mass after some thermal energy has accumulated and verify the thermal energy bar drops to 0.
5. Use React Developer Tools Profiler to verify that while paused and not dragging, the component does not continuously render.
