## 2026-06-15T06:14:17Z
You are the Rutherford Scattering Specialist.
Your task is to fully implement the physics simulation component `src/components/simulations/CustomRutherfordScattering.jsx` (currently an empty stub).
You must write a rich, fully interactive React component for alpha particle deflection by a heavy target nucleus.
Requirements:
- Must accept `{ onBack, title }` props and route back on back button click.
- Implement Coulomb scattering physics: positive alpha particles deflect due to repulsive force from gold nucleus. Use numerical integration (Verlet/Euler) or analytical scattering trajectories.
- Support two modes: "Rutherford Atom" (concentrated positive nucleus at center, causing sharp deflections and backscattering) and "Plum Pudding Atom" (diffuse positive charge, alpha particles pass through with minimal deflection).
- Controls for alpha particle speed/energy, nucleus atomic number Z (charge), and beam position/width.
- Visual track/trace of alpha particle paths.
- Graph showing a histogram of scattering angles.
- Ensure the file is at least 8KB in size (genuine physics/rendering, no simple wrapper).
- Once implemented, verify the code compiles without errors (run a build or check compilation in Vite dev environment using terminal commands).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_rutherford/`. Update your `progress.md` file regularly.
When you are done, write your handoff report to `handoff.md` and send a message back to the orchestrator (conversation ID: 5fa7829a-1107-4647-8a86-fbeea1c8bff3).
