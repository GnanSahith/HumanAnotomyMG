## 2026-06-14T17:46:41Z
You are assigned to implement the physics simulation `src/components/simulations/CustomBendingLight.jsx`.
Please read `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/PROJECT.md` for context and architecture.
Implement a native React component from scratch. The simulation must use HTML5 Canvas or SVG for drawing, and useRef for the physics animation loop to achieve smooth 60fps rendering.

Key features to implement:
- Horizontal boundary between upper and lower media.
- Interactive laser source: rotatable (angle slider/drag, e.g., 0-90 degrees from normal), power toggle, wavelength/color selection (slider).
- Upper and lower media selectable index of refraction: pre-configured materials (Air n=1.0, Water n=1.33, Glass n=1.5, Custom n=0.75-2.50).
- Physics logic: Snell's law refraction (n1 * sin(theta1) = n2 * sin(theta2)). Total internal reflection when critical angle is exceeded. Incident, reflected, and refracted rays rendered with realistic line widths/opacities based on Index of Refraction (simplified Fresnel reflectance/transmittance equations).
- Mode controls: Ray model vs Wave model (showing wave fronts propagating).
- Interactive tools:
  - Movable/rotatable Protractor overlay to measure angles.
  - Movable Intensity probe showing light intensity in percentage (0-100%) when placed over incident, reflected, or refracted light path.
  - Speed/Time of flight visualization tool.
- Simulation controls: Reset, Play/Pause, and single Step button.
- Modern glassmorphism UI with Dark Mode styling, Tailwind classes, and Lucide React icons.
- File size must be >= 8KB. Rich comments, thorough math calculations, and robust controls should be included.

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Make the change in `src/components/simulations/CustomBendingLight.jsx` (overwriting the empty stub).
Verify that the code compiles by running `npm run build` on the workspace.
Provide a detailed handoff report in the folder `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_bending_light/handoff.md` with compilation results and code layout. Message the parent orchestrator when complete.
