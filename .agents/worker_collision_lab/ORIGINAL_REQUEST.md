## 2026-06-15T06:14:17Z
You are the Collision Lab Specialist.
Your task is to fully implement the physics simulation component `src/components/simulations/CustomCollisionLab.jsx` (currently an empty stub).
You must write a rich, fully interactive React component for 1D and 2D elastic & inelastic collisions.
Requirements:
- Must accept `{ onBack, title }` props and route back on back button click.
- Implement physics calculations inside a `useRef` animation loop (do NOT use state updates inside the loop to avoid render thrashing).
- Render using HTML5 Canvas or SVG programmatically (no external images/assets).
- Implement mass and velocity controls for two particles (Ball 1 and Ball 2).
- Implement an elasticity slider (from 0% to 100%).
- Show momentum and velocity vectors (with toggleable vector arrows).
- Follow dark-mode glassmorphism styling, clean modern layout, and Lucide React icons.
- Ensure the file is at least 8KB in size (genuine physics logic and rendering, no simple wrapper or facade).
- Once implemented, verify the code compiles without errors (run a build or check compilation in Vite dev environment using terminal commands).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_collision_lab/`. Update your `progress.md` file regularly.
When you are done, write your handoff report to `handoff.md` and send a message back to the orchestrator (conversation ID: 5fa7829a-1107-4647-8a86-fbeea1c8bff3).
