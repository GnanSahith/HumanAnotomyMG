# Scope: UI Refactoring Batch 1

## Architecture
This batch focuses on applying the dark-mode futuristic visual identity/design system to 10 existing physics simulations in Human_Anatomy_Portable. 
The simulations are stand-alone JSX components that use HTML5 Canvas or SVG for physics rendering, overlaid with HTML/React UI controls.

The refactoring MUST NOT alter the internal simulation loop, refs, state variables, or business logic. It should strictly modify styling (CSS inline styles, classes), global structure of components to support standardized header/wrapper, and UI controls (buttons, checkboxes, sliders, floating panels).

## Milestones
| # | Name | File Path | Dependencies | Status |
|---|------|-----------|--------------|--------|
| 1 | CustomFriction | src/components/simulations/CustomFriction.jsx | None | DONE |
| 2 | CustomEnergySkatePark | src/components/simulations/CustomEnergySkatePark.jsx | None | DONE |
| 3 | CustomMassesAndSprings | src/components/simulations/CustomMassesAndSprings.jsx | None | DONE |
| 4 | CustomPendulumLab | src/components/simulations/CustomPendulumLab.jsx | None | DONE |
| 5 | CustomBalancingAct | src/components/simulations/CustomBalancingAct.jsx | None | IN_PROGRESS (696617fe-7056-4146-96d0-34ed492bfa02) |
| 6 | CustomCollisionLab | src/components/simulations/CustomCollisionLab.jsx | None | PLANNED |
| 7 | CustomCenterandVariability | src/components/simulations/CustomCenterandVariability.jsx | None | PLANNED |
| 8 | CustomEnergySkateParkBasics | src/components/simulations/CustomEnergySkateParkBasics.jsx | None | PLANNED |
| 9 | CustomHookesLaw | src/components/simulations/CustomHookesLaw.jsx | None | PLANNED |
| 10 | CustomMassesandSpringsBasics | src/components/simulations/CustomMassesandSpringsBasics.jsx | None | PLANNED |

## Interface Contracts
### Props for all Simulation Components:
- `onBack`: Function to be called when the top-left "Back" button is clicked.
- `title`: String displaying the title of the physics simulation.

### UI Styling Design System Elements:
1. **Global Wrapper**: `style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}`
2. **Top Header Bar**:
   - `style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}`
   - **Back Button**: Glassmorphism (`background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease'`), with red hover (`rgba(255, 55, 95, 0.8)`, border: `1px solid #ff375f`).
   - **Reset / Reset All Button**: Glassmorphism with blue hover (`rgba(52, 152, 219, 0.4)`, border: `1px solid #3498db`).
   - **Title**: `style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}`
3. **Control Panels**:
   - Placed with `position: 'absolute'` (e.g., bottom, left, right).
   - Style: `style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif' }}`
4. **Canvas / Main View**:
   - `style={{ position: 'absolute', inset: 0, zIndex: 1 }}` (Ensure that canvas allows correct pointer events to control panels).
5. **UI Form Elements**:
   - Checkboxes: `accentColor: '#3498db'`
   - Sliders/Toggles: Accent color based dark-mode themes (#3498db, #2ecc71, #e74c3c, #f1c40f, #bf5af2).
