# Handoff Report: phys_6 Iteration 2 Strategy

## Observation
1. **Pointer Bug:** In `src/components/simulations/CustomMassesAndSprings.jsx` (lines 169-173), the mouse Y-coordinate is mapped using `const viewBoxY = (yPx / rect.height) * 800;`. Because the SVG has `preserveAspectRatio="xMidYMid meet"`, `rect.height` includes any letterboxed blank space, throwing off the coordinate mapping when the container is not a perfect square.
2. **Missing Features (Parity):**
   - **Multiple Springs:** Currently, the code defines singular state variables (`mass`, `springConstant`, `posRef`, etc.) and hardcodes a single spring at `x=0`.
   - **Unknown Masses:** Mass is currently bound to a UI slider (lines 362-367). There is no "mass palette" or drag-and-drop functionality for attaching/detaching masses.
   - **Energy Graph:** The simulation computes forces and velocities but does not calculate or display Kinetic, Potential (Gravity/Spring), or Thermal energies.
   - **Measuring Tools:** No Ruler or Stopwatch exists in the UI.

## Logic Chain
To achieve full parity with PhET's Masses and Springs, we must implement the following architectural shifts:

1. **Fix SVG Coordinate Mapping:**
   Instead of manually calculating bounds, use native SVG matrix transformations. Replace lines 169-173 with:
   ```javascript
   const pt = svgRef.current.createSVGPoint();
   pt.x = e.clientX;
   pt.y = e.clientY;
   const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
   const newY = svgP.y / scale;
   ```
2. **Refactor for Multiple Springs:**
   Convert scalar physics refs (`posRef`, `velRef`, `accRef`) and states (`mass`, `springConstant`, `damping`) into an array of spring objects (e.g., `springs = [{id: 1, x: -100, k: 10, mass: null}, {id: 2, x: 100, k: 10, mass: null}]`). The `updatePhysics` loop must iterate over this array.
3. **Drag-and-Drop Unknown Masses:**
   - Remove the global mass slider.
   - Create a palette of draggable mass objects at the bottom of the SVG (e.g., 50g, 100g, 250g, and "Unknown Red", "Unknown Blue").
   - Track drag state for masses. On `pointerUp`, check if the mass is within a threshold distance of a spring's hook. If so, attach it (update the spring's `mass` property) and snap its position to the spring.
4. **Energy Graph (Bar Chart):**
   - In the `updatePhysics` loop, compute per-spring energy:
     - `KE = 0.5 * m * v^2`
     - `PE_spring = 0.5 * k * (y - restLength)^2`
     - `PE_gravity = m * g * (referenceY - y)`
     - `E_thermal`: accumulate `Math.abs(F_damping * v * dt)` every frame.
   - Create an SVG or HTML overlay showing a live-updating bar chart of these values.
5. **Measuring Tools:**
   - **Ruler:** Add a draggable `<g>` element containing ruler ticks and numbers. Manage its `x`/`y` via standard pointer events (like the masses).
   - **Stopwatch:** Add a floating absolute-positioned React panel. Store a `stopwatchTime` state and `isStopwatchRunning` state. Update it either in `updatePhysics` or a separate interval.

## Caveats
- **Thermal Energy Accumulation:** Euler integration can leak energy. Accumulating thermal energy might result in the Total Energy (KE + PE + Thermal) drifting slightly over time. For a visual simulation, this is usually acceptable, but using a smaller `dt` or a better integrator (e.g., Verlet/RK4) would stabilize it. Since standard Euler is used in iteration 1, we will stick to it but accumulate `E_thermal` carefully.
- **Drag-and-Drop Collision:** Checking if a mass is dropped "near" a spring requires converting the mass's dropped coordinates to the spring's coordinate space. Ensure all drags use `getScreenCTM().inverse()`.

## Conclusion
The Implementer needs to rewrite `CustomMassesAndSprings.jsx` to manage an array of Springs and an array of Draggable Masses. The SVG interaction bug is trivial to fix with `matrixTransform`. The Energy Graph and Measuring Tools can be built as visual overlays reading from the physics engine's state. 

## Verification Method
1. **SVG Bug:** Resize the window to an extreme aspect ratio (e.g., very wide). Drag the mass. The mouse cursor should stay exactly pinned to the mass.
2. **Multiple Springs:** Verify 2 or more springs render and simulate independently.
3. **Unknown Masses:** Drag a colored mass onto a spring, verify it oscillates differently based on its hidden mass value.
4. **Measuring Tools:** Drag the ruler around the screen. Start and stop the stopwatch.
5. **Energy Graph:** Observe the bar chart; Total Energy should remain constant as KE and PE convert into Thermal.
