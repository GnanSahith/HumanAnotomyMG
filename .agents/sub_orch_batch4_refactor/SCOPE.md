# Scope: UI Refactoring Batch 4

## Architecture
- React components representing standalone physics simulations.
- Refactoring involves updating JSX styling to a dark-mode glassmorphic theme.
- Shared interface requirements: Props `onBack` and `title` must be accepted and correctly bound in the top header.

## Milestones
| # | Name | Scope / Target File | Dependencies | Status | Conv ID |
|---|---|---|---|---|---|
| 1 | Balloons and Static Electricity | CustomBalloonsandStaticElectricity.jsx | None | DONE | eca13cf7-b6e1-497d-80ac-e18d0500b5b3 |
| 2 | Bending Light | CustomBendingLight.jsx | M1 | DONE | b488d0e7-a3bd-4b11-961f-d474db026257 |
| 3 | Color Vision | CustomColorVision.jsx | M2 | IN_PROGRESS | 013dc5f3-e637-40cf-99c5-f94938c86a98 |
| 4 | Rutherford Scattering | CustomRutherfordScattering.jsx | M3 | PLANNED | - |
| 5 | Models of the Hydrogen Atom | CustomModelsoftheHydrogenAtom.jsx | M4 | PLANNED | - |
| 6 | Models Of Hydrogen Atom (Alt) | CustomModelsOfHydrogenAtom.jsx | M5 | PLANNED | - |
| 7 | Photoelectric Effect | CustomPhotoelectricEffect.jsx | M6 | PLANNED | - |
| 8 | Lasers | CustomLasers.jsx | M7 | PLANNED | - |
| 9 | Neon Lights | CustomNeonLights.jsx | M8 | PLANNED | - |
| 10 | Microwaves | CustomMicrowaves.jsx | M9 | PLANNED | - |
| 11 | Simplified MRI | CustomSimplifiedMRI.jsx | M10 | PLANNED | - |

## Interface Contracts
- All components must accept:
  - `title`: string, displayed in top header.
  - `onBack`: function, triggered on Back button click.
- Global wrapper styles:
  - `width: '100%'`, `height: '100%'`, `position: 'relative'`, `background: '#0a0a1a'`
- Header panel styling:
  - absolute positioning, top: 20px, left: 20px, right: 20px, flex alignment.
  - Glassmorphic Buttons (back/reset).
- Control panels styling:
  - absolute positioning, dark-mode semi-transparent background, glassmorphic border/backdrop filter.
