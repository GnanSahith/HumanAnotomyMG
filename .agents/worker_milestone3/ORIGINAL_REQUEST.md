## 2026-06-20T00:35:45Z
You are a Worker subagent. Your task is to refactor the styling/UI of `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomCircuitConstructionKitAC.jsx` to adhere to the Design System:
1. Ensure the file accepts `onBack` and `title` props.
2. Put the `title` in the top header and invoke `onBack` on the Back button click.
3. Update the global wrapper, header bar, and control panels to match the Design System:
   - Global Wrapper: style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a' }}
   - Top Header Bar: position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
   - Buttons: glassmorphism style (background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', color: 'white', cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '8px', padding: '10px 20px'), with hover transitions (red hover on Back: rgba(255, 55, 95, 0.8), border #ff375f; blue hover on Reset: rgba(52, 152, 219, 0.4)).
   - Control panels: background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif", position: 'absolute' (or floating absolute styles).
   - Checkboxes/Sliders/Toggles: Update accentColor/styling to match the dark-mode accent colors (#3498db, etc.).
4. Canvas wrapper: Ensure position: 'absolute', inset: 0, zIndex: 1. Ensure canvas handles pointer events correctly underneath panels.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CRITICAL: Do NOT touch any logic, refs, state, or requestAnimationFrame loops.
Run `npm run build` inside `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable` after editing to verify compilation.
Put your changes log in `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_milestone3/changes.md` and handoff report in `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_milestone3/handoff.md`. Send a handoff report when complete.
