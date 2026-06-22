# Handoff Report: Physics Simulations Fix Strategy

## 1. Observation
- The project requires natively rebuilding 33 remaining physics simulations (matching the PhET originals) into React/Canvas applications without using placeholder images or external iframes.
- Inspection of `src/data/physicsSimulations.json` shows 45 total simulations. Six of them (like `phys_5_mg` / `CustomEnergySkatePark.jsx` and `CustomMassesAndSprings.jsx`) are implemented legitimately. These legitimate files range from 15KB to 37KB and use fully handwritten kinematics logic (e.g., manual parabola fitting, Euler integration loops, canvas rendering).
- The 33 failing simulations were mass-generated via `generate_33_sims.py`, which statically injected identical components wrapping `GenericSim.jsx` (a simple oscillating circle). 
- The project `package.json` contains `three.js`, `@react-three/fiber`, and `@react-three/drei`, but it currently lacks any dedicated 2D physics engine (like `matter-js` or `planck.js`).

## 2. Logic Chain
- To achieve true logic parity for 33 completely distinct physical domains, hand-writing custom mathematical update loops for each simulation (as was done for the first 6) is statistically impossible within an agent's context and execution constraints.
- The prompt explicitly allows using "lightweight physics/math libraries if it yields better and faster results".
- By shifting from "manual math implementation" to "Scene Configuration", we can achieve 100% feature parity rapidly. A physics engine like `matter.js` perfectly handles collisions, gravity, restitution, and constraints out-of-the-box for Mechanics/Thermodynamics simulations.
- For non-rigid body simulations like "Lasers", "Neon Lights", or "Simplified MRI" (Light & Quantum categories), 2D rigid-body physics is inadequate. These must be driven by standard math/state equations or implemented in 3D using the already installed `three.js` shaders.
- Therefore, the fix requires standardizing the physics core rather than mass-generating facade UI.

## 3. Caveats
- We did not manually reverse-engineer all 33 PhET simulations. The mapping of which simulations require `matter-js` vs `three.js` vs custom state logic will require a triage step.
- `matter-js` natively renders via canvas, but to strictly match the "premium dark-mode glassmorphism aesthetic", its default renderer should be bypassed or overridden with custom `ctx.fillStyle` logic inside a unified React wrapper.

## 4. Conclusion
The recommended strategy to legitimately rebuild the 33 simulations is the **Physics Engine Pipeline**:
1. **Engine Adoption**: Install `matter-js` to handle all rigid-body, collision, and spring kinematics. Use the pre-installed `three.js` for Quantum/Light wave phenomena.
2. **Unified Architecture**: Create two foundational wrapper components: `MatterSimEngine.jsx` and `QuantumSimEngine.jsx`. These wrappers will handle the animation loops, dark-mode styling, glassmorphism UI sliders, and event bindings.
3. **Data-Driven Injection**: Instead of 33 identical facades, use agent delegation (one simulation per sub-agent prompt) to generate 33 isolated scene configuration files. Each file only defines the specific Matter/Three bodies, initial state, and constraint logic matching the PhET original, drastically reducing the implementation footprint per simulation.
4. **Clean Slate**: Delete the contents of `src/components/simulations/GenericSim.jsx` and the 33 facade wrapper files to pass the auditor's integrity check.

## 5. Verification Method
- Code Review: Ensure `GenericSim.jsx` is completely purged. Inspect `src/components/simulations/*.jsx` to verify each imports either `matter-js`, `three`, or contains genuine mathematical logic (no facades).
- Build: Run `npm run build` to guarantee compilation.
- Visual Audit: Run the Vite preview server and manually open 5-10 rebuilt components to verify they exhibit unique physics matching the specific simulation title (e.g. "Capacitor Lab" must show capacitors).
