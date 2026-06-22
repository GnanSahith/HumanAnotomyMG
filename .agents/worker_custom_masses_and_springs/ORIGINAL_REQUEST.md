## 2026-06-20T00:31:31Z

You are a teamwork_preview_worker.
Your working directory is: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_custom_masses_and_springs/
Your task is to refactor the UI and styling of CustomMassesAndSprings.jsx to adhere to the project's dark-mode/futuristic design system.

Target file: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomMassesAndSprings.jsx

CRITICAL CONSTRAINT: You MUST NOT break the underlying physics engines. Do not modify any useRef states, performance.now() hooks, or requestAnimationFrame loops. Only modify the JSX return statements, styles, and hover effects.

DESIGN SYSTEM & RULES:
1. Global Wrapper: style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}
2. Top Header Bar:
   - position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
   - Buttons (Back, Play/Pause, Reset): glassmorphism (background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)'), color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease'
   - Red hover on Back: rgba(255, 55, 95, 0.8), border #ff375f.
   - Blue hover on Reset/Play: rgba(52, 152, 219, 0.4), border #3498db.
   - Inject hover styles via a <style> block in the JSX.
   - Title: color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
   - The component must accept onBack and title props. The header must display the title and invoke onBack when Back button is clicked.
3. Control Panels & Overlays:
   - Floating panels placed with position: 'absolute'.
   - Style: background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif"
   - Right Control Panel: Convert the right controls panel into a floating panel positioned at `right: 40px`, `top: 120px`, `bottom: 40px`, `width: 340px`, with scrollable behavior (`overflowY: 'auto'`).
   - Stopwatch Overlay and Energy Graph: Make sure these are absolute positioned overlays styled with the floating panel dark-glass background. Place the Stopwatch at e.g. `left: 40px, top: 120px` and the Energy Graph at `left: 40px, bottom: 40px` to keep the layout clean and organized.
4. SVG Main View:
   - position: 'absolute', inset: 0, zIndex: 1
   - Replace the background rect (#151522) with a dark theme color (e.g. #0a0a1a). Ensure correct pointer events (pointerEvents: 'none' on decorations, etc.).
5. UI Elements:
   - Checkboxes: accentColor: '#3498db'
   - Sliders (Spring Constant, Damping, etc.): Change their accentColor to match dark-mode accent colors (#3498db, #2ecc71, #f1c40f, #bf5af2).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

VERIFICATION REQUIRED:
1. Run the build command `npm run build` inside `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable` and verify that the build compiles successfully.
2. Document the build command and results in your handoff report.
3. Create your `handoff.md` and `progress.md` in `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/worker_custom_masses_and_springs/`.
4. When finished, send a message to the caller with the results.
