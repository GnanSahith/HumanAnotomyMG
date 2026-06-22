## 2026-06-20T23:00:00Z
You are the Simulation UI Refactoring Worker for Batch 3.
Your task is to refactor the UI layouts of the following 8 files in `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations` to match the target glassmorphic aesthetic:
1. CustomWaveonaString.jsx
2. CustomNormalModes.jsx
3. CustomFourierMakingWaves.jsx
4. CustomFaradaysLaw.jsx
5. CustomNeonLights.jsx
6. CustomMicrowaves.jsx
7. CustomColorVision.jsx
8. Customphys_10.jsx

Target Design System & Layout:
1. Global Wrapper:
   - Style: { width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }
2. Top Header Bar:
   - Style: { position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }
   - Back Button: glassmorphism ({ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" })
   - Title: { color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }
3. Control Panels (floating/overlay):
   - Style: { position: 'absolute', top: '90px', right: '20px', width: '300px', background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif" } (adjust position as needed so controls don't overlap critical canvas areas).
4. Canvas / Main View:
   - Style: { position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' } (if canvas size is fixed e.g. 800x600, center it inside the inset 0 wrapper, for example using { display: 'flex', alignItems: 'center', justifyContent: 'center' }).
5. UI Elements:
   - Update range sliders, checkboxes, buttons to use dark-mode/accent colors (#3498db, #2ecc71, etc.).

CRITICAL CONSTRAINTS:
1. Do not modify useRef states, requestAnimationFrame loops, or underlying physics/logic. ONLY modify styling and JSX return statements.
2. DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please execute the refactoring, compile/verify using the project build tool (npm run build), verify it has zero lint errors, and write your progress and findings in a handoff report. Report back to the Orchestrator when done.
