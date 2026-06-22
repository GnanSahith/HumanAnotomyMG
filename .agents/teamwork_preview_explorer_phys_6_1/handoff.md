# Observation
1. The `SCOPE.md` document requires rebuilding the `phys_6` (Masses and Springs) simulation as a native React/Canvas application matching the `phys_1_mg` style.
2. The reference style `phys_1_mg` maps to `CustomProjectileMotion.jsx` in `src/components/simulations/`.
3. `CustomProjectileMotion.jsx` is built using React hooks (`useState`, `useEffect`, `useRef`), `lucide-react` icons, and renders physics using a `requestAnimationFrame` loop with an Euler integrator.
4. The UI aesthetic consists of a full-screen layout with a dark theme gradient background (`#12121A` to `#0a0a0f`), a top bar for controls (Play/Pause/Reset), an SVG-based visual canvas taking up the main area, and a 340px wide right-side panel for tuning physics parameters via range sliders.
5. `physicsSimulations.json` currently points `phys_6` to an iframe url `masses-and-springs_en.html`.
6. Routing in `PhysicsSimulationView.jsx` handles native component rendering based on the `activeSimulation.id` matching `*_mg`.

# Logic Chain
1. To rebuild `phys_6` natively, a new React component `src/components/simulations/CustomMassesAndSprings.jsx` must be created.
2. This new component must mimic the layout, CSS, and structural flow of `CustomProjectileMotion.jsx` to ensure aesthetic consistency.
3. The physics engine in the new component must implement a 1D damped harmonic oscillator where $F_{net} = m \cdot g - k \cdot y - c \cdot v$ (where $y$ is displacement, $k$ is the spring constant, $c$ is damping, and $g$ is gravity).
4. The visual SVG layer must dynamically render a spring (e.g., using a zigzag SVG `<path>`) attached to an anchor at the top and a mass object suspended at the bottom.
5. The right-side controls should include sliders for Mass, Spring Constant, Damping, and a dropdown/slider for Gravity.
6. Once the component is created, `src/data/physicsSimulations.json` needs an entry for `phys_6_mg` setting `"isNative": true`.
7. `src/components/PhysicsSimulationView.jsx` must be updated to import `CustomMassesAndSprings` and conditionally render it when `activeSimulation.id === 'phys_6_mg'`.

# Caveats
1. No implementation was performed, as the directive stated "Do not implement."
2. The specific interaction of dragging the mass manually with the mouse is not detailed in the fix strategy but is a common feature in PhET simulations; adding pointer event handlers to the SVG mass element may be required for full feature parity.

# Conclusion
The fix strategy is to implement `CustomMassesAndSprings.jsx` using `requestAnimationFrame` for a damped harmonic oscillator, wrap it in the identical dark-themed UI layout as `CustomProjectileMotion.jsx`, define `phys_6_mg` in `physicsSimulations.json`, and route it in `PhysicsSimulationView.jsx`.

# Verification Method
1. Verify that `src/components/simulations/CustomMassesAndSprings.jsx` exists and implements the `phys_1_mg` UI patterns.
2. Verify `PhysicsSimulationView.jsx` has the routing logic `activeSimulation.id === 'phys_6_mg' ? <CustomMassesAndSprings ... />`.
3. Verify `physicsSimulations.json` contains the `phys_6_mg` entry.
4. Run the project (`npm run dev`) and open the "Masses and Springs MG" simulation. Verify the dark theme, sliders, and accurate spring physics behavior.
