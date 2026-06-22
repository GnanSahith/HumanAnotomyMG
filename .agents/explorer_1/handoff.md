# Simulation Facade Fix Strategy

## Observation
- The project requires 45 total custom React physics simulations, but 33 of them failed the Victory Audit.
- The `src/data/physicsSimulations.json` file lists 45 simulations with `_mg` native versions. 
- The script `generate_33_sims.py` explicitly iterates over missing native simulations and creates React files using a hardcoded `component_template`.
- All 33 failed simulations in `src/components/simulations/` (e.g., `CustomBalancingAct.jsx`, `CustomBendingLight.jsx`) merely render `<GenericSim />` or a generic circle animation with variables `param1`, `param2`, and `param3`. They lack simulation-specific physics logic.
- Legitimate simulations like `CustomProjectileMotion.jsx` (25KB) contain actual physics engines (e.g., Euler integration for gravity and drag), SVG canvas rendering, and domain-specific UI toggles.

## Logic Chain
1. The audit failed because `generate_33_sims.py` substituted actual mathematical models with a single generic template to save time, resulting in 0% feature parity.
2. The user explicitly requires 100% feature and logic parity with the original PhET HTML5 physics simulations.
3. Therefore, resolving the INTEGRITY VIOLATION requires discarding the auto-generated templates and manually writing 33 unique domain-specific React components. 
4. Because writing 33 standalone physics engines from scratch is incredibly labor-intensive, the optimal legitimate strategy requires leveraging open-source physics libraries where applicable, grouping simulations by domain, and implementing them progressively.

## Caveats
- Implementing 33 high-fidelity physics simulations is a massive undertaking. The main agent will likely need to employ tools like `matter.js` for mechanics or handle them sequentially across multiple sessions to avoid context/time constraints.
- We must strictly verify that each implementation adheres to the dark-mode aesthetic seen in `CustomProjectileMotion.jsx`.

## Conclusion
**Recommended Fix Strategy:**
1. **Clean Slate:** Delete `generate_33_sims.py`, `GenericSim.jsx`, and the 33 generated `Custom*.jsx` facade files.
2. **Library Adoption:** Install and configure lightweight libraries (e.g., `matter-js` for collision/mechanics) to avoid reinventing the wheel while maintaining custom rendering.
3. **Domain Batching:** Group the remaining 33 simulations by category (Electricity, Optics, Waves, Mechanics) and implement their underlying mathematical models progressively.
4. **Implementation Standard:** Each new component must mimic the architecture of `CustomProjectileMotion.jsx`, featuring specific state variables (not param1/param2), a `requestAnimationFrame` loop updating the math/engine, and a synced SVG/Canvas renderer.

## Verification Method
- Run `npm run build` to ensure project compiles.
- Run `npm run dev` and navigate to the simulation view.
- Manually test each added simulation (e.g., `Bending Light`) and verify its unique physics toggles (e.g., Refractive Index, Wavelength) and specific visual behaviors match the original PhET version.
