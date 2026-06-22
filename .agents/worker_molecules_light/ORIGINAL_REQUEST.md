## 2026-06-14T17:50:00Z
You are assigned to implement the physics simulation `src/components/simulations/CustomMoleculesandLight.jsx`.
Please read `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/PROJECT.md` for context and architecture.
Implement a native React component from scratch. The simulation must use HTML5 Canvas or SVG for drawing, and useRef for the physics animation loop to achieve smooth 60fps rendering.

Key features to implement:
- Molecule Selection: At least 6 molecules (Carbon Monoxide, Carbon Dioxide, Water, Nitrogen, Oxygen, Ozone).
- Light Source Selection: Sliders or radio buttons to switch light source type (Microwave, Infrared, Visible, Ultraviolet).
- Light Controls: Slide to adjust photon emission rate (intensity), power toggle (on/off), light style selector (Single Photon pulse vs. continuous stream).
- Interactive Animation:
  - Emitter flashlight that fires photon wave-packets (wavy lines or labeled particles: "IR", "UV", "Visible", "Microwave") at the molecule.
  - Physics behaviors on photon collision with the molecule:
    1. Microwave: Polar molecules (Water, Carbon Monoxide) absorb and rotate. Non-polar molecules (Nitrogen, Oxygen) ignore.
    2. Infrared: Greenhouse/polar molecules (Carbon Dioxide, Water, Ozone) absorb and vibrate (stretch/bend bonds). After some vibration period, they re-emit the IR photon in a random direction (simulating the greenhouse effect) and stop vibrating. Non-polar molecules ignore.
    3. Visible: Photons pass through all molecules transparently without interaction.
    4. Ultraviolet: High-energy photons. Cause Ozone (O3) to dissociate (splitting bond into O2 + O, which then recombine after a short delay) or cause other molecules to vibrate/excite.
  - Bonds modeled as springs that stretch/bend realistically during vibration.
- Simulation playback controls: Play/Pause, Step, Reset button.
- Modern glassmorphism UI with Dark Mode styling, Tailwind classes, and Lucide React icons.
- File size must be >= 8KB. Rich comments, thorough molecular interaction math, and robust controls should be included.

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Make the change in `src/components/simulations/CustomMoleculesandLight.jsx` (overwriting the empty stub).
Verify that the code compiles by running `npm run build` on the workspace.
Provide a detailed handoff report in the folder `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_molecules_light/handoff.md` with compilation results and code layout. Message the parent orchestrator when complete.
