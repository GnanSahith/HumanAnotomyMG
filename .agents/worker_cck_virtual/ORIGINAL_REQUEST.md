## 2026-06-15T11:44:17Z
You are the Circuit Construction Kit Specialist.
Your task is to fully implement the physics simulation component `src/components/simulations/CustomCircuitConstructionKitDCVirtualLab.jsx` (currently an empty stub).
This simulation should build on the existing `src/components/simulations/CustomCircuitConstructionKitDC.jsx` but must specifically implement "Virtual Lab" mode and add Voltmeter & Ammeter tools.
Requirements:
- Must accept `{ onBack, title }` props and route back on back button click.
- Read and adapt/extend code from `src/components/simulations/CustomCircuitConstructionKitDC.jsx`.
- Implement a drag-and-drop circuit builder with wires, batteries, resistors, lightbulbs, and switches.
- Implement realistic visual representations (lifelike 3D-like rendering of batteries, bulbs, wires) toggleable with schematic representations (circuit symbols) in "Virtual Lab" mode.
- Implement Voltmeter and Ammeter probes that can be dragged and placed on nodes to measure potential difference and branch current.
- Implement a real-time circuit solver (Modified Nodal Analysis or loop current solver) to compute voltages and currents.
- Follow dark-mode glassmorphism styling, clean modern layout, and Lucide React icons.
- Ensure the file is at least 8KB in size (genuine physics/rendering, no simple wrapper).
- Once implemented, verify the code compiles without errors (run a build or check compilation in Vite dev environment using terminal commands).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_cck_virtual/`. Update your `progress.md` file regularly.
When you are done, write your handoff report to `handoff.md` and send a message back to the orchestrator (conversation ID: 5fa7829a-1107-4647-8a86-fbeea1c8bff3).
