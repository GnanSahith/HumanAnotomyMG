# Handoff Report: Verification of CustomMassesAndSprings.jsx

## 1. Observation
I reviewed the newly integrated multiple springs and energy graph engine in `src/components/simulations/CustomMassesAndSprings.jsx`. 

**Observation A (Bounce Logic):** 
```javascript
// Limit to prevent shooting off screen
if (ps.y < 0.1) {
    ps.y = 0.1;
    ps.vy *= -0.5; // bounce
}
```
**Observation B (Energy Graph Styling):**
```javascript
const h = 8 - ps.y; 
ps.PE_grav = s.massValue * gravity * h;
// ...
const peGravH = Math.min((ps.PE_grav / maxE) * 100, 100);
// ...
<div style={{ width: '100%', height: `${peGravH}px`, background: '#0a84ff'... }} />
```
**Observation C (Thermal Energy Accumulation):**
```javascript
ps.thermalEnergy += (s.c * ps.vy * ps.vy) * subDt;
```
(No logic exists to reset `thermalEnergy` when the user manually drags the mass to inject new mechanical energy).

**Observation D (Render Loop):**
```javascript
    const updatePhysics = (time) => {
        // ...
        physicsRef.current.forEach(ps => {
            if (ps.isDragging || !isPlaying) return; // skips integration
        // ...
        setSimState([...physicsRef.current]); // Always triggers re-render
        requestRef.current = requestAnimationFrame(updatePhysics);
    };
```

## 2. Logic Chain

1. **Conservation of Energy Violation on Bounce**: When `ps.y < 0.1`, the engine applies an inelastic bounce `vy *= -0.5`. This instantly destroys 75% of the kinetic energy ($E_k \propto v^2$). However, this lost energy is never added to `thermalEnergy`. As a result, the total height of the bars on the Energy Graph will suddenly drop, visibly violating the Principle of Conservation of Energy.
2. **Negative CSS Heights Break Graph**: The gravitational potential energy assumes $y=8$ is the floor ($h = 8 - ps.y$). If a heavy mass on a weak spring stretches past $y=8$ (e.g. $m=2, g=24.79, k=1 \Rightarrow eqY \approx 51.5$), `PE_grav` becomes highly negative. This results in a negative CSS `height` value (e.g., `height: -150px`), which is invalid and causes the browser to render the bar as `0px`. Meanwhile, `PE_spring` shoots up, making the system look like it suddenly gained massive energy.
3. **Infinite Thermal Energy Bar**: Thermal energy naturally increases as damping removes mechanical energy. But when a user drags the mass again, they inject *new* mechanical energy into the system. Because `thermalEnergy` is not reset on drag, it accumulates infinitely across multiple drag-and-release cycles, quickly hitting the 100px ceiling and rendering the metric useless.
4. **Unconditional 60FPS Re-rendering**: The `updatePhysics` loop clones `physicsRef.current` and calls `setSimState` on every single animation frame, even when `!isPlaying` and no mass is being dragged. This forces React to unnecessarily re-render the entire complex SVG tree 60 times a second while idling.

## 3. Caveats
- The core integration scheme (Semi-implicit Euler) is mathematically symplectic and correctly conserves energy for harmonic oscillators. The flaws lie purely in edge-case boundary handling and React state management, not the core calculus.
- I simulated the numerical integration mathematically rather than relying on standard test frameworks, as none were configured for component testing in this workspace.

## 4. Conclusion
**Verdict: FAIL.**
The physics engine correctly integrates Hooke's Law and gravity, but the **Energy Graph implementation is flawed**. It breaks under edge cases (bouncing, heavy masses) and loses meaning over time due to infinite thermal accumulation. Additionally, the component suffers from severe idle performance degradation. The implementation requires bug fixes before it can be considered empirically correct.

## 5. Verification Method
To independently verify:
1. **Bounce Bug**: Start the app. Set $k=10, m=1$. Drag the mass down to $y=8$ (bottom of screen) and release. Watch it bounce at the ceiling and observe the Energy Graph total height drop abruptly.
2. **Negative PE Bug**: Set mass to `2 kg`, Gravity to `Jupiter (24.79)`, and $k$ to `1`. Observe the `PEg` blue bar disappear due to negative CSS height, while `PEs` maxes out.
3. **Thermal Accumulation**: Drag and release the mass 3-4 times, waiting for it to stop each time. Observe the red `Th` bar hit the ceiling and stay there.
4. **Performance Sink**: Open Chrome DevTools Performance tab, pause the simulation, don't touch the mouse, and record. You will see continuous script execution and layout recalculation at 60 FPS.
