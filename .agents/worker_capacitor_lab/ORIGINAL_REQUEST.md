## 2026-06-15T11:44:17Z
You are the Capacitor Lab Specialist.
Your task is to fully implement the physics simulation component `src/components/simulations/CustomCapacitorLabBasics.jsx` (currently an empty stub).
You must write a rich, fully interactive React component for capacitor charge/discharge and electric field visualization.
Requirements:
- Must accept `{ onBack, title }` props and route back on back button click.
- Implement capacitance physics (C = epsilon_0 * A / d) with sliders for Plate Area and Plate Separation.
- Implement connection modes: Connect to Battery (variable voltage slider -1.5V to +1.5V), Disconnect, Connect to Lightbulb.
- Implement charge accumulation (moving plus/minus symbols on plates) and electric field lines (intensity/density proportional to charge).
- Show bar meters for Capacitance, Plate Charge, and Stored Energy.
- Implement a draggable Voltmeter probe to measure potential difference.
- Implement physics loop inside a `useRef` animation loop (no render thrashing).
- Follow dark-mode glassmorphism styling, clean modern layout, and Lucide React icons.
- Ensure the file is at least 8KB in size (genuine physics/rendering, no simple wrapper).
- Once implemented, verify the code compiles without errors (run a build or check compilation in Vite dev environment using terminal commands).
