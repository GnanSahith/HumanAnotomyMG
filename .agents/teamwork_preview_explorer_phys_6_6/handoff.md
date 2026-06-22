# Handoff Report: phys_6 Fix Strategy

## 1. Observation
- The `phys_6` failure report indicates that the simulation lacks complete feature parity with the PhET original, specifically missing: Energy Graph, Measuring Tools (Ruler, Stopwatch), Multiple Springs, and Unknown Masses.
- The report notes a UI bug: the SVG coordinate mapping in `handlePointerMove` uses `(yPx / rect.height) * 800`, which calculates incorrectly when the SVG container is letterboxed due to the `preserveAspectRatio="xMidYMid meet"` property on the SVG element.
- The source file `src/components/simulations/CustomMassesAndSprings.jsx` currently uses scalar states for a single spring system (`mass`, `springConstant`, `posRef`, `velRef`, `accRef`), missing the capability for multiple springs.
- The `timeRef` is tracked internally for physics updates but is not exposed to the user as a Stopwatch.
- Energy values (Kinetic, Gravitational Potential, Spring Potential, Thermal) are not currently calculated during the physics step in `updatePhysics`.

## 2. Logic Chain
1. **SVG Coordinate Mapping Fix**: To correctly map screen pixels to SVG coordinates regardless of letterboxing, the drag handler must use the SVG's current transformation matrix (CTM). Using `svgRef.current.getScreenCTM().inverse()` on a created `SVGPoint` guarantees a mathematically perfect screen-to-SVG mapping.
2. **Multiple Springs Support**: The architecture needs a refactor from scalar variables to an array of objects. Creating a state array `springs` (e.g., initialized with 2 objects) holding `mass`, `k`, `y`, `vy` will allow mapping over them in the render phase, positioning them at different X-coordinates (e.g., `-150` and `150`). The `updatePhysics` function must iterate over each spring to integrate its motion.
3. **Energy Graph**: Inside `updatePhysics` or via derived state, we need to calculate:
   - $KE = 0.5 \times m \times v^2$
   - $PE_{spring} = 0.5 \times k \times (y - restLength)^2$
   - $PE_{grav} = m \times g \times (y_{max} - y)$ (so it stays positive)
   - $Thermal$ = Accumulated loss (or simply $E_{initial} - (KE + PE_{spring} + PE_{grav})$ if no work is added)
   These values should be fed into a new `<EnergyGraph>` component rendering a live bar chart.
4. **Measuring Tools**: 
   - **Ruler**: Add an independent SVG `<g>` component for the ruler with its own `onPointerDown`/`Move` drag handlers, using the same CTM mapping logic.
   - **Stopwatch**: Expose `timeRef.current` via state syncing (or `requestAnimationFrame` update to a DOM ref to avoid React render lag) accompanied by Play/Pause/Reset buttons independent of the main physics playback.
5. **Unknown Masses**: Extend the UI for mass selection to include discrete "Unknown" objects (e.g., red, blue, green blocks) with hidden fixed masses (e.g., 0.8kg, 1.5kg, 2.3kg). When one is attached to a spring, the text label is "Unknown" instead of the numeric value, requiring the user to deduce it using the ruler and spring constant.

## 3. Caveats
- The exact layout changes (e.g., where the Energy Graph should be placed without crowding the canvas) are left to the implementer's discretion, but integrating it into the `Controls Sidebar` or an overlay panel is recommended.
- The mathematical energy sum must carefully account for the baseline $y=0$ of gravitational potential energy to ensure Total Energy remains constant when damping is 0. 
- Refactoring from a single spring to multiple springs will require updating the React state heavily; ensuring performance (e.g., avoiding rendering on every physics frame by using refs for positions) is crucial.

## 4. Conclusion
To achieve full parity, the implementer must execute five concrete changes:
1. Replace `getBoundingClientRect()` coordinate math in `handlePointerMove` with `matrixTransform` using `svg.getScreenCTM().inverse()`.
2. Refactor state (`mass`, `springConstant`, physics refs) into arrays to support 2+ side-by-side spring systems.
3. Add calculations for $KE$, $PE_{grav}$, $PE_{spring}$, and Thermal energy to `updatePhysics`, and display them visually.
4. Add a draggable SVG Ruler component and an independent Stopwatch UI.
5. Add "Unknown Mass" presets to the simulation parameters that hide their numerical `kg` values from the UI.

## 5. Verification Method
- **Bug Fix**: Run the simulation, resize the window to be very wide (letterboxed), and drag the mass. The mass should stay perfectly glued to the cursor without any vertical offset.
- **Features**: 
  - Ensure two springs are visible and configurable independently.
  - Check that the Energy Graph bars sum to a constant total (when damping is 0).
  - Drag the Ruler around the screen.
  - Use the Stopwatch to time oscillations.
  - Select an "Unknown Mass" and ensure the correct mass value is hidden from the user interface but still responds physically to the selected spring constant.
