## 2026-06-14T12:16:41Z
You are assigned to implement the physics simulation `src/components/simulations/CustomColorVision.jsx`.
Please read `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/PROJECT.md` for context and architecture.
Implement a native React component from scratch. The simulation must use HTML5 Canvas or SVG for drawing, and useRef for the physics animation loop to achieve smooth 60fps rendering.

Key features to implement:
- Two modes: "Single Bulb" and "RGB Bulbs".
- In "Single Bulb" mode:
  - Slide to adjust bulb wavelength (color) and intensity.
  - Toggle colored filter: adjust filter wavelength/color and width.
  - Draw cartoon head with eye receiving the light, and a thought bubble displaying the color perceived by the brain (derived from the wavelengths/RGB that reach the eye through the filter).
- In "RGB Bulbs" mode:
  - Three sliders for Red, Green, and Blue bulb intensities (0-100%).
  - Show overlapping beams mixing colors.
  - Perceived color is displayed in the observer's thought bubble.
- Beam display option: Solid beam vs moving particle stream (colored circles moving from bulb to head).
- Simulation controls: Play/Pause, Step, and Reset button.
- Modern glassmorphism UI with Dark Mode styling, Tailwind classes, and Lucide React icons.
- File size must be >= 8KB. Rich comments, thorough color mixing math, and robust controls should be included.

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Make the change in `src/components/simulations/CustomColorVision.jsx` (overwriting the empty stub).
Verify that the code compiles by running `npm run build` on the workspace.
Provide a detailed handoff report in the folder `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_color_vision/handoff.md` with compilation results and code layout. Message the parent orchestrator when complete.
