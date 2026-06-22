# Original User Request

## Initial Request — 2026-06-13T16:34:23+05:30

Rebuild all 39 remaining physics simulations from the `physicsSimulations.json` database into native, custom React/Canvas applications. The new simulations must match the sleek, premium dark-mode aesthetic and smooth 60fps performance of the 6 existing custom simulations (`phys_1_mg` through `phys_5_mg`, and `phys_7_mg`).

### Requirements

#### R1. 100% Logic & Feature Parity
Every single option, toggle, slider, and physical behavior present in the original simulation must be implemented in our version. You may use lightweight physics/math libraries if it yields better and faster results, but you must NOT copy any images or PNGs from the originals—everything must be rendered natively via CSS, Canvas, or SVG.

#### R2. Match UI/UX Aesthetics
The visual design must strictly adhere to the project's established premium dark-mode UI. Use `lucide-react` icons, vibrant contrast colors, glassmorphism effects, and highly optimized `<canvas>` rendering where appropriate. Do not use placeholder images.

#### R3. Complete the Entire Set
You must process and rebuild all 39 remaining simulations. Do not stop until all of them are complete. Each completed simulation must be registered in `src/data/physicsSimulations.json` with an `_mg` suffix and `isNative: true`, and properly routed in `src/components/PhysicsSimulationView.jsx`.

### Acceptance Criteria

#### Verification (Agent-as-Judge)
- [ ] For every simulation built, an independent auditing agent must verify that the simulation runs without crashing in the Vite development server.
- [ ] The auditing agent must confirm that the visual style strictly matches the dark-mode/glassmorphism aesthetic.
- [ ] The auditing agent must cross-reference the completed simulation's features with the original PhET version to guarantee that 100% of the interactive options and logic have been successfully ported.
- [ ] `physicsSimulations.json` and `PhysicsSimulationView.jsx` must be confirmed to successfully route all 45 total simulations without errors.

<ADDITIONAL_METADATA>
The current local time is: 2026-06-13T16:34:23+05:30.
</ADDITIONAL_METADATA>

## Follow-up — 2026-06-14T17:43:29+05:30

You are resuming an ongoing physics simulation rebuild project. The working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable`.

The following simulations have already been properly implemented — DO NOT touch these:
- CustomProjectileMotion.jsx, CustomForcesAndMotion.jsx, CustomGravityAndOrbits.jsx, CustomFriction.jsx, CustomEnergySkatePark.jsx, CustomPendulumLab.jsx, CustomMassesAndSprings.jsx, CustomStatesOfMatter.jsx, CustomStatesOfMatterBasics.jsx, CustomGasProperties.jsx, CustomWaveInterference.jsx, SoundWaves_mg.jsx, CustomDiffusion.jsx, CustomWaveonaString.jsx, CustomEnergyFormsandChanges.jsx, CustomFaradaysLaw.jsx, CustomCircuitConstructionKitAC.jsx, CustomFourierMakingWaves.jsx, CustomPhotoelectricEffect.jsx, CustomMicrowaves.jsx, CustomLasers.jsx, CustomNeonLights.jsx, CustomOhmsLaw.jsx, CustomChargesandFields.jsx, CustomResistanceinaWire.jsx, CustomCoulombsLaw.jsx, CustomModelsOfHydrogenAtom.jsx, CustomBalloonsandStaticElectricity.jsx, CustomNormalModes.jsx

The following 16 simulation files are currently EMPTY STUBS (~185 bytes each) and need to be FULLY implemented with real physics logic, canvas rendering, and all interactive features matching the original PhET simulations:

1. `CustomBalancingAct.jsx` — Torque, lever arm physics, drag-and-drop weights on a balance beam
2. `CustomCollisionLab.jsx` — 1D/2D elastic & inelastic collisions, momentum conservation
3. `CustomCenterandVariability.jsx` — Statistics: mean, median, mode, spread visualization
4. `CustomEnergySkateParkBasics.jsx` — Simplified skate park: KE/PE/thermal energy tracking on preset tracks
5. `CustomHookesLaw.jsx` — Spring force F=kx, displacement vs force graphs, spring systems
6. `CustomMassesandSpringsBasics.jsx` — Spring oscillation, period, amplitude controls
7. `CustomBendingLight.jsx` — Snell's law, refraction, total internal reflection with ray tracing
8. `CustomColorVision.jsx` — RGB color mixing, single/multi-bulb color vision simulation
9. `CustomMoleculesandLight.jsx` — Photon absorption by molecules, infrared/UV/visible light interaction
10. `CustomRutherfordScattering.jsx` — Alpha particle deflection by nucleus, scattering angle simulation
11. `CustomCircuitConstructionKitDC.jsx` — Interactive DC circuit builder: resistors, batteries, switches, bulbs
12. `CustomCircuitConstructionKitDCVirtualLab.jsx` — Same as DC kit but with voltmeter/ammeter and virtual lab mode
13. `CustomCapacitorLabBasics.jsx` — Capacitor charge/discharge, electric field, plate separation controls
14. `CustomJohnTravoltage.jsx` — Static charge buildup, spark discharge simulation
15. `CustomSimplifiedMRI.jsx` — Magnetic spin alignment, RF pulse, relaxation visualization
16. `CustomModelsoftheHydrogenAtom.jsx` — Bohr model, quantum model, photon emission/absorption for hydrogen

## Requirements
- Each file must be a self-contained React component accepting `onBack` and `title` props.
- Use HTML5 Canvas or SVG for rendering. Use `useRef` for physics loops (NOT `useState`) to prevent render-loop thrashing.
- All interactive controls from the original PhET sim must be present.
- Follow the project dark-mode glassmorphism aesthetic (dark backgrounds, vibrant accent colors, lucide-react icons).
- No placeholder images or PNGs — everything rendered programmatically.
- Implement in parallel using multiple specialist subagents.
- Each finished file must be at least 8KB — NO generic wrappers or facades.
- After implementing each file, verify it compiles without errors.

## Acceptance Criteria
- All 16 stub files replaced with real implementations of at least 8KB each.
## Follow-up — 2026-06-15T11:39:58+05:30

You are resuming an ongoing physics simulation rebuild project. The working directory is `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable`.

The following 7 simulation files are currently EMPTY STUBS (~185 bytes each) and need to be FULLY implemented with real physics logic, canvas rendering, and all interactive features matching the original PhET simulations:

1. `CustomCollisionLab.jsx` — 1D/2D elastic & inelastic collisions, momentum conservation
2. `CustomCircuitConstructionKitDCVirtualLab.jsx` — Same as DC kit but with voltmeter/ammeter and virtual lab mode
3. `CustomCapacitorLabBasics.jsx` — Capacitor charge/discharge, electric field, plate separation controls
4. `CustomJohnTravoltage.jsx` — Static charge buildup, spark discharge simulation
5. `CustomSimplifiedMRI.jsx` — Magnetic spin alignment, RF pulse, relaxation visualization
6. `CustomModelsoftheHydrogenAtom.jsx` — Bohr model, quantum model, photon emission/absorption for hydrogen (note: CustomModelsOfHydrogenAtom.jsx already exists — this is a different routing file)
7. `CustomRutherfordScattering.jsx` — Alpha particle deflection by nucleus, scattering angle simulation

## Requirements
- Each file must be a self-contained React component accepting `onBack` and `title` props.
- Use HTML5 Canvas or SVG for rendering. Use `useRef` for physics loops (NOT `useState`) to prevent render-loop thrashing.
- All interactive controls from the original PhET sim must be present.
- Follow the project dark-mode glassmorphism aesthetic (dark backgrounds, vibrant accent colors, lucide-react icons).
- No placeholder images or PNGs — everything rendered programmatically.
- Implement in parallel using multiple specialist subagents.
- Each finished file must be at least 8KB — NO generic wrappers or facades.
- After implementing each file, verify it compiles without errors.

## Acceptance Criteria
- All 7 stub files replaced with real implementations of at least 8KB each.
- An independent auditing agent must verify feature parity with the original PhET simulation before claiming victory.

