# Handoff Report: phys_6 Iteration 2 Strategy

## Observation
Reviewing `CustomMassesAndSprings.jsx` and the failure report:
1. **SVG Pointer Bug**: In `handlePointerMove` (lines 169-173), the mouse mapping uses `(yPx / rect.height) * 800`. Due to the SVG's `preserveAspectRatio="xMidYMid meet"`, `rect.height` includes empty letterboxed space when the window aspect ratio differs from 1:1, causing a visual offset.
2. **Multiple Springs**: The component currently hardcodes a single mass-spring system using singular states (`mass`, `springConstant`) and refs (`posRef`, `velRef`).
3. **Energy Graph**: Missing entirely. No tracking of Kinetic, Elastic Potential, Gravitational Potential, or Thermal energy.
4. **Measuring Tools**: No ruler or stopwatch UI components exist.
5. **Unknown Masses**: The `mass` control is purely a numerical slider, lacking discrete "Unknown A/B/C" options.

## Logic Chain
1. **SVG Bug Fix**: The standard and flawless way to map screen coordinates to an SVG viewBox is using the SVG's Current Transformation Matrix (CTM). 
   - **Fix**: Create an `SVGPoint` using `svgRef.current.createSVGPoint()`, set its `x` and `y` to `e.clientX` and `e.clientY`, and then transform it using `pt.matrixTransform(svgRef.current.getScreenCTM().inverse())`. This intrinsically handles any letterboxing or scaling.
2. **Multiple Springs Refactor**: Convert the singular simulation state into an array of objects or parallel states (e.g., `springs: [{ mass, k, pos, vel... }, { mass, k, pos, vel... }]`). Render the first spring at an offset like `x = -150` and the second at `x = 150` within the `-400 to 400` viewBox horizontal range. Update pointer handlers to track *which* spring is being dragged.
3. **Energy Graph Implementation**: 
   - Add a floating panel overlay containing SVG or HTML bar charts.
   - In `updatePhysics`, calculate real-time energy for each spring:
     - $KE = 0.5 \times m \times v^2$
     - $PE_s = 0.5 \times k \times (y - \text{restLength})^2$
     - $PE_g = m \times g \times (H_{max} - y)$
     - Thermal Energy accumulates over time: subtract damping work done ($F_{damping} \times \Delta y$).
4. **Measuring Tools Implementation**:
   - **Ruler**: Add an absolutely positioned `<g>` or `<div draggable>` representing a ruler. Needs its own `x/y` state and pointer handlers to allow the user to drag it next to the springs to measure extension.
   - **Stopwatch**: Add a small UI panel showing formatted `timeRef.current`. Include Start, Stop, and Reset buttons. Update the time display in the `requestAnimationFrame` loop.
5. **Unknown Masses**: Update the Mass UI slider to include preset buttons (e.g., "Custom", "Unknown A (red)", "Unknown B (blue)"). When an unknown is selected, apply a specific hardcoded mass to the physics engine (e.g., 0.65 kg) but hide the exact number from the user interface.

## Caveats
- Refactoring to multiple springs changes the core state mechanism significantly. The Implementer should take care to update the Euler integration loop to iterate over all springs instead of just one.
- Calculating Energy involves a baseline for $PE_g$. It's recommended to pick a fixed coordinate (e.g., `y=0` or the bottom of the screen) as height $h=0$.
- Frequent state updates for Energy Bars and Stopwatch might cause React render lag if not optimized. The Implementer may want to use direct DOM manipulation via refs for high-frequency text/bar updates if 60fps React state updates are too slow.

## Conclusion
The Implementer needs to:
1. Replace `getBoundingClientRect` mapping in `handlePointerMove` with `createSVGPoint` and `getScreenCTM().inverse()`.
2. Refactor state (`mass`, `springConstant`, `posRef`, etc.) to support 2 independent spring systems rendered side-by-side.
3. Add a live Energy Graph panel calculating KE, PEs, PEg, and Thermal.
4. Add draggable Ruler and interactive Stopwatch floating tools.
5. Add "Unknown Mass" presets to the Mass control UI that hide the numerical value.

## Verification Method
1. Start the project (`npm start` or equivalent) and navigate to the `phys_6` view.
2. Drag the mass in a strongly letterboxed window (e.g., very wide and short); verify the pointer stays exactly on the mass.
3. Verify there are controls and visuals for two springs side-by-side.
4. Toggle the Energy Graph and observe bars dynamically changing during oscillation.
5. Drag the Ruler around the screen and use the Stopwatch controls.
6. Select an Unknown Mass and verify the spring reacts appropriately without showing the exact `kg` value.
