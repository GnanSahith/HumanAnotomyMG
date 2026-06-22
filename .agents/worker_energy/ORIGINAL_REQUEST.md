## 2026-06-19T19:04:56Z

You are a worker agent. Your working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_energy/`.
Your task is to refactor the UI and styling of `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomEnergyFormsandChanges.jsx` based on the task description in `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_energy/task.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Design System Details:
1. Global Wrapper: style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a' }}
2. Top Header Bar:
   - position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
   - Buttons: glassmorphism (background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)'), hover transitions. Red hover on Back: rgba(255, 55, 95, 0.8), border #ff375f. Blue hover on Reset: rgba(52, 152, 219, 0.4).
   - Title: color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
3. Control Panels (Left/Right/Bottom depending on sim):
   - Floating panels placed with position: 'absolute'.
   - background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif"
4. Canvas / Main View:
   - position: 'absolute', inset: 0, zIndex: 1
   - Ensure the canvas handles pointer events correctly underneath the floating panels.
5. UI Elements:
   - Checkboxes/Sliders/Toggles must be updated to match the dark-mode accent colors (#3498db, #2ecc71, #e74c3c, #f1c40f, #bf5af2). Specifically, checkboxes should use accentColor: '#3498db'.

CRITICAL CONSTRAINT: You MUST NOT break the underlying physics engines. Do not modify the useRef states or requestAnimationFrame loops. Only modify the JSX return statements and CSS/styles. Every file must accept `onBack` and `title` props, display the title in the header, and invoke `onBack` when the Back button is clicked.

Once changes are done, run `npm run build` inside `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable` to verify compilation.
Write your changes and build output to a handoff file, and report back via send_message to Recipient 5d1e31cb-a546-4f33-8853-2b9a2d2a4809.
