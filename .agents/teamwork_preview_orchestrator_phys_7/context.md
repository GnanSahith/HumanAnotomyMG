# Context — Physics Simulations Rebuild (7 Simulations)

## Environment
- OS: Mac
- Workspace Root: `/Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable`
- Framework: React + Vite + Tailwind CSS
- Icon Library: `lucide-react`

## Key Constraints
- Real physics logic (numerical integrations, Euler/Verlet, or analytical equations).
- Canvas rendering inside a `useRef` physics animation loop (prevents render thrashing).
- Dark-mode glassmorphism theme matches the rest of the application.
- Self-contained React components accepting `{ onBack, title }`.
- Minimum size of 8KB per file. No placeholders or dummy/facade implementations.
- Absolute prohibition on importing PNGs or external imagery. Everything rendered programmatically.

## Reference Implementations
- **Circuit Kit**: `src/components/simulations/CustomCircuitConstructionKitDC.jsx` is ~74KB. It contains full MNA solvers, components dragging, and sound effects. We can extend it or adapt it for the Virtual Lab mode.
- **Hydrogen Atom**: `src/components/simulations/CustomModelsOfHydrogenAtom.jsx` is ~19KB. We can use it as a reference for quantum/Bohr visualizations.
- **Electrostatics/Balloons**: `src/components/simulations/CustomBalloonsandStaticElectricity.jsx` is ~39KB. Good reference for charge rendering and collision/drag physics.
