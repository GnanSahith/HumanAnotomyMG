## 2026-06-14T12:17:10Z
You are tasked with fully implementing the CustomMassesandSpringsBasics.jsx simulation as a native React component in /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomMassesandSpringsBasics.jsx.

Scope of CustomMassesandSpringsBasics:
- Simple masses and springs system showing simple harmonic motion (SHM) with damping.
- Dynamic controls:
  - Spring Constant (Small to Large).
  - Damping (None, Friction, Lots).
  - Gravity (Moon, Earth, Jupiter, or slider).
- Hanging weights: draggable masses of 50g, 100g, and 250g that attach to the bottom hook of the spring.
- Visual reference lines:
  - Natural Length of spring.
  - Equilibrium Position (where mass rests).
  - Mobile ruler to measure displacements.
- Displays:
  - Real-time vertical Energy plot (KE, PE_elastic, PE_gravitational, Thermal, and Total).
  - Oscillating wave/displacement vs time plotter or stopwatch.
- Speed controls: Normal and Slow-motion options.
- Fully functional physics update loop using useRef and requestAnimationFrame to draw on a Canvas at 60fps. Realistic spring equations (F = -kx - cv + mg).
- Nice glassmorphism dark-themed controls, reset button, and a back button calling onBack.
- The file MUST be at least 8KB in size, containing genuine and robust physics, spring animation, drag-and-drop mass attachments, and UI code (no facades, wrappers, or dummy components).

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please overwrite the file /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomMassesandSpringsBasics.jsx and output a summary of what you did.
