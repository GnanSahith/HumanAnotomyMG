## 2026-06-20T00:33:34Z
You are a teamwork_preview_worker.
Your working directory is: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_custom_pendulum_lab/
Your task is to refactor the UI and styling of CustomPendulumLab.jsx to adhere to the project's dark-mode/futuristic design system.

Target file: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomPendulumLab.jsx

CRITICAL CONSTRAINT: You MUST NOT break the underlying physics engines. Do not modify any useRef states or requestAnimationFrame loops. Only modify the JSX return statements, styles, and hover effects.

DESIGN SYSTEM & RULES:
1. Global Wrapper: style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}
2. Top Header Bar:
   - position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
   - Buttons: glassmorphism (background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)'), color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease'
   - Red hover on Back: rgba(255, 55, 95, 0.8), border #ff375f.
   - Blue hover on Reset/Play: rgba(52, 152, 219, 0.4), border #3498db.
   - Inject hover styles via a <style> block in the JSX.
   - Title: color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
   - The component must accept onBack and title props. The header must display the title and invoke onBack when Back button is clicked.
3. Control Panels (Left/Right/Bottom depending on sim):
   - Floating panels placed with position: 'absolute'.
   - Style: background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif"
   - For CustomPendulumLab, convert the right controls sidebar into a floating control panel on the right (e.g. right: 40px, top: 120px, bottom: 40px, width: 320px, overflowY: 'auto').
4. Canvas / SVG Main View:
   - position: 'absolute', inset: 0, zIndex: 1
   - Canvas style background should fit dark mode nicely. Ensure correct pointer events work correctly underneath the floating panels.
5. UI Elements:
   - Checkboxes/Sliders: Sliders should use accent colors based on dark-mode theme colors (#3498db, #2ecc71, #bf5af2, etc.).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

VERIFICATION REQUIRED:
1. Run the build command `npm run build` inside `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable` and verify that the build compiles successfully.
2. Document the build command and results in your handoff report.
3. Create your `handoff.md` and `progress.md` in `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_custom_pendulum_lab/`.
4. When finished, send a message to the caller with the results.
