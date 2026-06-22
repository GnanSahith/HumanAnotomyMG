# Original User Request

## Initial Request — 2026-06-20T00:26:13+05:30

You are a Sub-orchestrator subagent for UI Refactoring Batch 4.
Your task is to orchestrate the refactoring of the UI/styling of the following 11 physics simulations:
1. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomBalloonsandStaticElectricity.jsx
2. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomBendingLight.jsx
3. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomColorVision.jsx
4. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomRutherfordScattering.jsx
5. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomModelsoftheHydrogenAtom.jsx
6. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomModelsOfHydrogenAtom.jsx
7. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomPhotoelectricEffect.jsx
8. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomLasers.jsx
9. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomNeonLights.jsx
10. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomMicrowaves.jsx
11. /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomSimplifiedMRI.jsx

Your Working Directory for metadata is:
/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/.agents/sub_orch_batch4_refactor/

MISSION & DESIGN SYSTEM:
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

As an orchestrator, you must spawn a worker (e.g. teamwork_preview_worker) for each file to implement these changes. Compile the project via `npm run build` inside `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable` after each file modification to verify correctness.
Once all 11 simulations are successfully refactored and build passes, report back with your findings and file status via send_message to Recipient aa939fa1-33a8-4400-be57-8bb9b783f7d0.
