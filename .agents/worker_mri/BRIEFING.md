# BRIEFING — 2026-06-15T11:45:00+05:30

## Mission
Fully implement the interactive MRI Physics Simulation component in src/components/simulations/CustomSimplifiedMRI.jsx.

## 🔒 My Identity
- Archetype: MRI Simulation Specialist
- Roles: implementer, qa, specialist
- Working directory: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_mri/
- Original parent: 5fa7829a-1107-4647-8a86-fbeea1c8bff3
- Milestone: MRI Physics Simulation Implementation

## 🔒 Key Constraints
- Must accept { onBack, title } props and route back on back button click.
- Visualize a grid of hydrogen proton spins (dipole arrows) precessing in a main magnetic field B_0.
- Implement static magnetic field B_0 controls (Larmor frequency adjusts with B_0 field strength: omega = gamma * B_0).
- Implement an RF transmitter sending waves at an adjustable RF frequency.
- When RF frequency matches the Larmor frequency (resonance), the spins tip into the transverse plane (RF pulse).
- Visualize longitudinal relaxation (T1 recovery) and transverse relaxation (T2 dephasing / decay).
- Render a graph showing the RF pulse and the received Free Induction Decay (FID) signal (sine wave decay).
- Ensure the file is at least 8KB in size (genuine physics/rendering, no simple wrapper).
- Compile without errors (Vite build or dev environment check).
- File path: src/components/simulations/CustomSimplifiedMRI.jsx

## Current Parent
- Conversation ID: 5fa7829a-1107-4647-8a86-fbeea1c8bff3
- Updated: not yet

## Task Summary
- **What to build**: Rich, interactive MRI physics simulator in React.
- **Success criteria**: Functional grid of precessing spins, resonant RF pulse tipping, T1/T2 relaxation, live graphing of RF and FID, file >= 8KB, clean build.
- **Interface contracts**: Accepts `{ onBack, title }` props.
- **Code layout**: src/components/simulations/CustomSimplifiedMRI.jsx

## Key Decisions Made
- Standard 60fps canvas animation loop using `useRef` to maintain high performance and prevent React state thrashing.
- Numerical integration of the Bloch equations (with precession, RF excitation torque, and T1/T2 relaxation times) in the lab frame for genuine, non-fabricated physics.
- High-fidelity visual displays: 3D isometric grid of 25 spins in a scanner bore with painter's algorithm depth sorting, macro spin Bloch sphere with precessional cone trace, and scrolling oscilloscope graph with dual channels.
- Interactive controls: static B₀ field (changing Larmor frequency), local B₀ field inhomogeneity (simulating dephasing), tissue presets (Fat, Muscle, CSF, Tumor) and automatic 90/180/refocus pulse buttons.
- Direct DOM manipulation via refs for real-time numeric indicators (Mxy, Mz) to guarantee 60fps responsiveness.

## Artifact Index
- `src/components/simulations/CustomSimplifiedMRI.jsx` — The main component file containing the MRI simulator (54 KB).
