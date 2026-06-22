# Plan — Physics Simulations Rebuild (7 Simulations)

## Objective
Fully implement 7 interactive physics simulations under `src/components/simulations/` with custom physics logic, canvas rendering, glassmorphism UI, Vite compile validation, and a minimum file size of 8KB.

## Step-by-Step Milestones
1. **CustomCollisionLab**:
   - 1D/2D elastic & inelastic collisions
   - Momentum conservation display, vector arrows
   - Mass and initial velocity adjusters
2. **CustomCircuitConstructionKitDCVirtualLab**:
   - Interactive circuit builder (wires, batteries, lightbulbs, resistors)
   - Voltmeter and Ammeter probes
   - Virtual lab mode (with real-time MNA solver or loop current solver)
   - Built based on adapting and extending `CustomCircuitConstructionKitDC.jsx`
3. **CustomCapacitorLabBasics**:
   - Capacitor charge/discharge cycle with battery/bulb
   - Electric field vector lines visualization
   - Controls for plate separation, area, voltage
4. **CustomJohnTravoltage**:
   - Static charge accumulation visualization (rubbing foot on carpet)
   - Spark discharge to doorknob when close enough
   - Sound effects or visual lightning spark
5. **CustomSimplifiedMRI**:
   - Spin alignment of atomic nuclei in a static magnetic field
   - Radio Frequency (RF) pulse triggering
   - Relaxation process visualization (longitudinal T1 and transverse T2)
6. **CustomModelsoftheHydrogenAtom**:
   - Bohr model showing discrete energy levels
   - Quantum mechanical probability cloud model
   - Photon absorption and emission mechanics with spectrometer graph
7. **CustomRutherfordScattering**:
   - Alpha particle shooting source
   - Golden foil nucleus deflection physics (Coulomb repulsion)
   - Angle distribution and deflection track visualization

## Execution Strategy
- For each simulation, spawn a specialized `teamwork_preview_worker` subagent to write the implementation and verify compilation.
- Collect worker results, run compilation checks, and audit files to ensure they are >8KB and fully correct.
