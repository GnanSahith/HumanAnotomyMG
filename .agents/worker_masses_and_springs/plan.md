# Plan for CustomMassesandSpringsBasics

## 1. Physics Engine Setup
- We will store physics values in React `useRef`s to ensure 60fps canvas updates without lagging or triggering re-renders:
  - `yRef` (current mass vertical position).
  - `vyRef` (mass velocity).
  - `thermalEnergyRef` (accumulated thermal energy).
  - `attachedMassRef` (currently attached mass, or `null` if none).
  - `isDraggingMassRef` (whether the attached mass is currently being dragged by the mouse).
- Standard variables:
  - Spring constant $k$: selectable/slider from 5 to 25 N/m.
  - Gravity $g$: Moon (1.62 m/s²), Earth (9.81 m/s²), Jupiter (24.79 m/s²), or custom slider.
  - Damping $c$: None (0.0), Friction (0.1), Lots (0.8).
- Update equations in `requestAnimationFrame` loop:
  - If a mass $m$ is attached and not being dragged:
    - Sub-step Euler integration (10 iterations per frame).
    - $F_s = -k \cdot (y - L_0)$
    - $F_g = m \cdot g$
    - $F_d = -c \cdot v$
    - $F_{net} = F_s + F_g + F_d$
    - $a = F_{net} / m$
    - $v = v + a \cdot dt$
    - $y = y + v \cdot dt$
    - $E_{thermal} = E_{thermal} + c \cdot v^2 \cdot dt$
  - Energies calculated at each step:
    - $KE = 0.5 \cdot m \cdot v^2$
    - $PE_{elastic} = 0.5 \cdot k \cdot (y - L_0)^2$
    - $PE_{gravitational} = m \cdot g \cdot (y_{datum} - y)$ where $y_{datum} = 4.0$ meters.
    - $E_{total} = KE + PE_{elastic} + PE_{gravitational} + E_{thermal}$

## 2. Interactive Weights & Drag-and-Drop
- Three weights: 50g, 100g, 250g.
- Render weights as separate objects in a rack at the bottom of the canvas.
- Pointer events for dragging:
  - If clicked on a rack weight, make it the actively dragged weight.
  - If clicked on the attached weight, drag it directly.
  - Detachment: if the attached weight is dragged horizontally by more than a threshold, detach it.
  - Snapping: if a free-dragged weight is released close to the spring hook, snap it and attach it.
  - Glide-back: if released elsewhere, animate it back to its rack position.

## 3. Reference Lines & Ruler
- Draw dashed lines for:
  - Natural length ($L_0$ line).
  - Equilibrium position ($y_{eq} = L_0 + m \cdot g / k$).
- Implement a draggable physical ruler:
  - Standard yellow style with transparent body.
  - Drag handle on top.
  - Tick marks at regular intervals.

## 4. Real-time Displays
- Energy bar chart:
  - Render as DOM bars in a side card. Update heights directly via refs to avoid React lag.
- Scrollable Oscilloscope (Graph):
  - Canvas graph plotting displacement vs time.
  - Scrolling line drawn at each frame step.
- Stopwatch:
  - Digital clock driven by the physics simulation clock (slows down in slow-motion).

## 5. UI Layout
- Nice glassmorphism panels using dark gradients, thin semi-transparent borders, and glow effects.
- Clean header with Play/Pause, Slow/Normal speed, Reset, and Back.
