## 2026-06-15T06:14:17Z

You are the John Travoltage Specialist.
Your task is to fully implement the physics simulation component `src/components/simulations/CustomJohnTravoltage.jsx` (currently an empty stub).
You must write a rich, fully interactive React component for static charge accumulation and spark discharge.
Requirements:
- Must accept `{ onBack, title }` props and route back on back button click.
- Programmatically draw a character figure (John Travoltage) on a canvas, with a separate foot (can be rubbed/dragged on a carpet) and arm/hand (can be rotated/dragged towards a metal doorknob).
- Implement static charge accumulation: when the user rubs John's foot on the carpet, negative charges (electrons) are transferred and distributed evenly across his body.
- Implement spark discharge: when John's hand is close enough to the doorknob, and the accumulated charge density exceeds the dielectric breakdown threshold of the air gap (distance-dependent), trigger a visual spark (jagged neon lightning line) from the hand to the doorknob, accompanied by rapid discharge.
- Ensure the file is at least 8KB in size (genuine physics/rendering, no simple wrapper).
- Once implemented, verify the code compiles without errors (run a build or check compilation in Vite dev environment using terminal commands).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_john_travoltage/`. Update your `progress.md` file regularly.
When you are done, write your handoff report to `handoff.md` and send a message back to the orchestrator (conversation ID: 5fa7829a-1107-4647-8a86-fbeea1c8bff3).
