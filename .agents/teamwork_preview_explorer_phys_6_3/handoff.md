# Masses and Springs (`phys_6`) Native Migration Strategy

## 1. Observation
- `src/data/physicsSimulations.json`: The `phys_6` simulation is currently an iframe pointing to `masses-and-springs_en.html` and lacks the `"isNative": true` flag. Native simulations follow a `phys_X_mg` naming convention (e.g., `"phys_1_mg"`).
- `src/components/PhysicsSimulationView.jsx` (Lines 132-139): Native simulations are conditionally rendered based on `activeSimulation.id` (e.g., `activeSimulation.id === 'phys_1_mg' ? <CustomProjectileMotion .../>`).
- `src/components/simulations/CustomProjectileMotion.jsx` (`phys_1_mg`): Represents the target aesthetics and architecture.
  - **Layout:** A `flex` container with a dark gradient background (`linear-gradient(180deg, #12121A 0%, #0a0a0f 100%)`).
  - **Top Bar:** Contains a back button, title (with a Lucide `Atom` icon), and Play/Pause/Reset buttons.
  - **Right Sidebar (`340px`):** Houses controls (`<input type="range">`, `<select>`, `<input type="checkbox">`) styling for initial parameters, object properties, and environmental forces.
  - **Visuals & Engine:** Uses an `<svg>` with `viewBox` for rendering, and `requestAnimationFrame` with Euler sub-stepping integration for physics. Uses `useRef` for simulation state to prevent re-renders, and updates visual React state locally.

## 2. Logic Chain
To rebuild `phys_6` as a native React simulation matching `phys_1_mg`, we must replicate the established architecture:
1. **Component Creation:** A new file `src/components/simulations/CustomMassesAndSprings.jsx` must be created.
2. **Physics Engine:** The `updatePhysics` loop should implement Hooke's Law: $F_{spring} = -k \times (y - L_{rest})$. The total vertical acceleration will be $a_y = g - (k/m) \times (y - L_{rest}) - (c/m) \times v_y$, where $c$ is the damping coefficient.
3. **Interactive Graphics:** Like `phys_1_mg`, the simulation should use an `<svg>` canvas. 
   - A `<polyline>` or `<path>` drawn dynamically to represent the zigzag of the spring.
   - A `<rect>` for the hanging mass.
   - Pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`) attached to the mass to allow the user to drag and offset it, releasing to start oscillations.
4. **Controls:** The Right Sidebar must include sliders for: Mass ($m$), Spring Constant ($k$), Damping/Friction ($c$), and Gravity ($g$). It should also include toggles for Velocity and Acceleration vectors.
5. **Integration:** 
   - `physicsSimulations.json` should have `phys_6` renamed to `phys_6_mg`, with `"isNative": true`.
   - `PhysicsSimulationView.jsx` must import `CustomMassesAndSprings` and add it to the conditional rendering block for `phys_6_mg`.

## 3. Caveats
- `CustomEnergySkatePark.jsx` (`phys_5_mg`) uses HTML5 `<canvas>` instead of `<svg>`. Both are acceptable in this project, but `<svg>` is explicitly used in the reference `phys_1_mg` and is heavily suited for simple 2D shapes like a mass and spring.
- The drag-and-drop interaction for the mass requires careful coordinate mapping between client window space and SVG `viewBox` space.

## 4. Conclusion
The implementation requires creating `CustomMassesAndSprings.jsx` using the `phys_1_mg` layout template, implementing a Hooke's Law physics loop via `requestAnimationFrame`, rendering visually via SVG, and hooking up UI sliders to the physics refs. Finally, register the component in `PhysicsSimulationView.jsx` and flag it as `isNative` in the simulation data JSON.

## 5. Verification Method
- **Implementation check:** Inspect `src/components/simulations/CustomMassesAndSprings.jsx` to ensure it mimics the `phys_1_mg` Flex/SVG/Sidebar structure.
- **Data check:** Confirm `src/data/physicsSimulations.json` has `phys_6_mg` with `"isNative": true`.
- **Runtime test:** Run `npm run dev`, navigate to the physics portal, open "Masses and Springs", and verify that a native SVG-based UI renders instead of an iframe, and that the mass oscillates correctly when dragged.
