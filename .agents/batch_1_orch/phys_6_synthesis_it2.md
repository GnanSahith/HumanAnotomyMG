# Synthesis of phys_6 Strategy (Iteration 2)

## Consensus
- **SVG Coordinate Bug**: Replace `getBoundingClientRect` arithmetic with native SVG coordinate transformation: `const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());`.
- **Multiple Springs**: Refactor the state to an array of spring objects, each with its own state (mass, pos, vel, restLength, stiffness, damping, dragging flag). 
- **Unknown Masses**: Add a feature to allow selecting "Unknown" masses (e.g., hidden weights of 50g, 100g, 250g) which the user must deduce using measuring tools. Implement as a draggable palette or preset selector.
- **Energy Graph**: In the physics update loop, calculate for each active spring: $KE = 0.5 \times m \times v^2$, $PE_{grav} = m \times g \times h$ (where $h$ is relative height), $PE_{spring} = 0.5 \times k \times x^2$, and $E_{thermal}$ (accumulated damping loss). Render this data visually in a new UI overlay/panel.
- **Measuring Tools**: 
  - *Ruler*: A draggable SVG group (`<g>`) resembling a metric ruler.
  - *Stopwatch*: A floating React panel tracking simulation time (`timeRef`), with start/stop/reset controls.

## Resolution
The Worker must fully refactor `CustomMassesAndSprings.jsx` to include these missing features to achieve 100% Feature Parity. The missing features were the cause of the Reviewer VETO.

## Important Note
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
