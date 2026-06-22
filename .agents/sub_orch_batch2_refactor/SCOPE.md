# Scope: UI Refactoring Batch 2

## Architecture
- React simulation components utilizing HTML5 Canvas, SVG, or DOM nodes for rendering.
- State is managed via React useState, useRef, and custom hooks.
- Animation loops are powered by requestAnimationFrame, which must remain unmodified.
- Layouts are currently mixed style types (CSS modules, style objects, or inline styles).
- UI panels are overlays that should be absolute-positioned, glassmorphism/dark-themed, and have correct pointer-events behavior.

## Milestones
| # | Name | Scope | Dependencies | Status | Conv ID |
|---|------|-------|-------------|--------|---------|
| 1 | CustomStatesOfMatter | src/components/simulations/CustomStatesOfMatter.jsx | None | DONE | 5f98ffa1-3bcc-40d4-8d5e-9a6cf67a6f0f |
| 2 | CustomStatesOfMatterBasics | src/components/simulations/CustomStatesOfMatterBasics.jsx | None | DONE | 62d0be20-aafb-476f-8173-177054e770f1 |
| 3 | CustomDiffusion | src/components/simulations/CustomDiffusion.jsx | None | DONE | a177d566-1479-44b8-a8f7-4e399a127671 |
| 4 | CustomEnergyFormsandChanges | src/components/simulations/CustomEnergyFormsandChanges.jsx | None | DONE | 64292252-7531-422f-8a3b-3e2960466970 |
| 5 | CustomBlackbodySpectrum | src/components/simulations/CustomBlackbodySpectrum.jsx | None | PLANNED | - |
| 6 | CustomWaveonaString | src/components/simulations/CustomWaveonaString.jsx | None | PLANNED | - |
| 7 | SoundWaves_mg | src/components/simulations/SoundWaves_mg.jsx | None | PLANNED | - |
| 8 | CustomNormalModes | src/components/simulations/CustomNormalModes.jsx | None | PLANNED | - |
| 9 | CustomFourierMakingWaves | src/components/simulations/CustomFourierMakingWaves.jsx | None | PLANNED | - |
| 10 | CustomMoleculesandLight | src/components/simulations/CustomMoleculesandLight.jsx | None | PLANNED | - |

## Interface Contracts
### All Simulations
- Props: `onBack: PropTypes.func.isRequired`, `title: PropTypes.string`
- Header: Display `title` in custom top header bar, with Back and Reset buttons styled with glassmorphism and proper hover colors.
- Interactive canvas must handle pointer events correctly, ensuring they do not get blocked by overlays unless required.
