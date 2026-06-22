## 2026-06-15T06:14:17Z

You are the MRI Simulation Specialist.
Your task is to fully implement the physics simulation component `src/components/simulations/CustomSimplifiedMRI.jsx` (currently an empty stub).
You must write a rich, fully interactive React component for magnetic resonance imaging physics.
Requirements:
- Must accept `{ onBack, title }` props and route back on back button click.
- Visualize a grid of hydrogen proton spins (dipole arrows) precessing in a main magnetic field B_0.
- Implement static magnetic field B_0 controls (Larmor frequency adjusts with B_0 field strength: omega = gamma * B_0).
- Implement an RF transmitter sending waves at an adjustable RF frequency.
- When RF frequency matches the Larmor frequency (resonance), the spins tip into the transverse plane (RF pulse).
- Visualize longitudinal relaxation (T1 recovery) and transverse relaxation (T2 dephasing / decay).
- Render a graph showing the RF pulse and the received Free Induction Decay (FID) signal (sine wave decay).
- Ensure the file is at least 8KB in size (genuine physics/rendering, no simple wrapper).
- Once implemented, verify the code compiles without errors (run a build or check compilation in Vite dev environment using terminal commands).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_mri/`. Update your `progress.md` file regularly.
When you are done, write your handoff report to `handoff.md` and send a message back to the orchestrator (conversation ID: 5fa7829a-1107-4647-8a86-fbeea1c8bff3).
