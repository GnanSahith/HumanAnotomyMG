## 2026-06-14T12:16:39Z
Implement a fully functional, authentic physics simulation for CustomCircuitConstructionKitDC.jsx.
Target path: /Users/gnansahith/Documents/AntiGravity /Human_Anatomy_Portable/src/components/simulations/CustomCircuitConstructionKitDC.jsx
Required Features:
1. Interactive UI: Canvas/SVG simulation area + control sidebar.
2. Component Palette: Wires, Batteries, Resistors, Light Bulbs, Switches.
3. Placing and Dragging: Drag components, snap terminals, or grid-based placement.
4. Circuit Solver: Simple but real circuit solver (e.g. node analysis, nodal analysis, or loop analysis/graph traversal) to dynamically calculate currents/voltages.
5. Current Visualization: Moving dots (electrons/conventional current) proportional to current magnitude.
6. Interactive Tools: Voltmeter (draggable red/black probes), Ammeter.
7. Parameter Adjustments: Resistance/voltage adjustments.
8. Visual Effects: Bulb glow (I^2 * R), burnout if exceeding power limits.
9. Sleek dark-mode aesthetic: glassmorphism, vibrant colors, Lucide icons.
Strict Constraints:
- Accept `onBack` and `title` props, export default.
- Code size MUST be at least 8KB.
- Write real physics/canvas/SVG logic. No dummy facades.
- Verify build.
