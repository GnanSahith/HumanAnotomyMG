# Handoff Report: Rebuild phys_6 (Masses and Springs)

## Observation
- **Scope**: Rebuild `phys_6` (Masses and Springs) to a native React/Canvas simulation matching the aesthetics of `phys_1_mg`.
- **Data Configuration**: In `src/data/physicsSimulations.json`, native simulations are registered with an `_mg` suffix and `isNative: true` (e.g., `phys_1_mg`, `phys_5_mg`). `phys_6` exists as a standard iframe-based simulation.
- **Routing**: `src/components/PhysicsSimulationView.jsx` renders native simulations by checking `activeSimulation.id` (e.g., `activeSimulation.id === 'phys_5_mg' ? <CustomEnergySkatePark ... /> :`).
- **Aesthetics & Structure**: Native components like `src/components/simulations/CustomProjectileMotion.jsx` use a dark themed layout (`background: 'linear-gradient(180deg, #12121A 0%, #0a0a0f 100%)'`), an SVG-based canvas for rendering, Euler integration for physics inside a `requestAnimationFrame` loop, and a right-hand sidebar for parameter controls (sliders, checkboxes).

## Logic Chain
1. To rebuild `phys_6`, a new component `src/components/simulations/CustomMassesAndSprings.jsx` must be created. It should mimic the dark theme, layout, and physics loop of existing custom simulations, utilizing Euler integration for the spring force ($F = -kx - bv$).
2. The UI will need an SVG representation of a spring that stretches dynamically based on the mass's vertical position, alongside sliders for mass ($m$), spring constant ($k$), damping ($b$), and gravity ($g$).
3. The new simulation must be registered in `src/data/physicsSimulations.json` as `"phys_6_mg"`, copying the metadata of `"phys_6"` but appending " MG" to the title and setting `"isNative": true`.
4. `PhysicsSimulationView.jsx` must be modified to import `CustomMassesAndSprings` and conditionally render it when `activeSimulation.id === 'phys_6_mg'`.

## Caveats
- The visual rendering of a spring in SVG requires drawing a zig-zag or coiled path that scales dynamically with the distance between the anchor point and the mass.
- The physics engine needs sub-step Euler integration or Verlet integration for stability, as springs can become unstable with large spring constants and large time steps.
- I have not investigated the exact visual parameters of the original PhET 'Masses and Springs' simulation to copy; the implementation will just need to provide standard matching capabilities (mass, stiffness, damping, gravity).

## Conclusion
**Fix Strategy**:
1. **Create** `src/components/simulations/CustomMassesAndSprings.jsx`. Implement the UI with the standard dark top bar and sidebar, and an SVG canvas for the spring-mass system.
2. **Update** `src/data/physicsSimulations.json` to include `"phys_6_mg"` (below `"phys_6"`).
3. **Update** `src/components/PhysicsSimulationView.jsx` to import `CustomMassesAndSprings` and route `"phys_6_mg"` to it (around line 138).

## Verification Method
1. Launch the React development server (e.g., `npm run dev` or `npm start`).
2. Navigate to the Physics Interactive Library.
3. Open "Masses and Springs MG".
4. Confirm the view switches to the native component (no PhET iframe).
5. Interact with the simulation: start it, pause it, and adjust sliders (mass, spring constant, gravity) to ensure the physics and SVG spring rendering behave realistically.
