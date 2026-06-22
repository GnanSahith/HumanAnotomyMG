# Handoff Report: phys_6 Bug Fixes (Iteration 3)

## Observation
I investigated `src/components/simulations/CustomMassesAndSprings.jsx` to identify the causes of the 5 bugs reported in the Iteration 2 failure report.

1. **Energy Graph CSS Crash**: At line 398, `peGravH` is calculated as `Math.min((ps.PE_grav / maxE) * 100, 100)`. If `ps.PE_grav` is negative, `peGravH` is negative, which is then passed directly into a React style prop (`height: ${peGravH}px`), leading to invalid CSS.
2. **Stopwatch Desync**: At line 130, `stopwatchTime` increments based purely on `if (stopwatchRunning)`, ignoring `isPlaying`.
3. **Energy Destruction**: At line 158, when `ps.y < 0.1`, the simulation applies a ceiling bounce (`ps.vy *= -0.5`), but does not calculate or preserve the 75% lost kinetic energy.
4. **Thermal Accumulation**: At line 195 (`handlePointerDown`), when dragging starts, `ps.vy` is reset to 0, but `ps.thermalEnergy` is untouched, allowing it to accumulate infinitely across successive drags. (It is successfully reset during `handleReset`, however).
5. **60 FPS Re-render when paused**: In `updatePhysics` (line 112), `setSimState` is called unconditionally on every animation frame, even if `isPlaying` is false and no masses are dragging, causing a constant 60 FPS React re-render cycle.

## Logic Chain
- **Energy Graph CSS Crash**: Using `Math.max(0, ...)` limits the height correctly, but to visually represent negative energy below the datum (as requested), we can compute the absolute height and apply `transform: translateY(...)`.
- **Stopwatch Desync**: Updating the conditional to `if (stopwatchRunning && isPlaying)` ensures it pauses symmetrically with the simulation loop.
- **Energy Destruction**: By capturing `oldVy` before modifying it, we can calculate the energy loss (`0.5 * m * (oldVy^2 - newVy^2)`) and add it directly to `ps.thermalEnergy`.
- **Thermal Accumulation**: Resetting `ps.thermalEnergy = 0;` alongside `ps.vy = 0;` inside `handlePointerDown` cleanly solves the issue since grabbing the mass should establish a new energetic baseline.
- **60 FPS Re-render**: Checking `!isPlaying && !isAnyDragging` immediately after the `dt` calculation in `updatePhysics` allows us to request the next animation frame and `return` early, avoiding the expensive state update step.

## Caveats
- For the Energy Graph CSS fix, rendering negative PE_grav using `translateY` assumes the parent flex container allows overflow. If clipping occurs, we may just need to allow the container to overflow or accept that the bar extends downwards.
- Thermal Energy resets on *every* grab. This correctly satisfies the requirement ("Reset thermalEnergy to 0 when the user drags the mass").

## Conclusion
The implementer should apply the 5 specific replacement chunks detailed below to `src/components/simulations/CustomMassesAndSprings.jsx`.

### Implementation Proposal:

#### 1. Energy Graph CSS Crash
**Lines 398-401:**
```javascript
// Before
const keH = Math.min((ps.KE / maxE) * 100, 100);
const peGravH = Math.min((ps.PE_grav / maxE) * 100, 100);
const peSprH = Math.min((ps.PE_spring / maxE) * 100, 100);
const thermH = Math.min((ps.thermalEnergy / maxE) * 100, 100);

// After
const keH = Math.max(0, Math.min((ps.KE / maxE) * 100, 100));
const peGravH = Math.max(0, Math.min(Math.abs(ps.PE_grav / maxE) * 100, 100));
const peSprH = Math.max(0, Math.min((ps.PE_spring / maxE) * 100, 100));
const thermH = Math.max(0, Math.min((ps.thermalEnergy / maxE) * 100, 100));
```

**Line 410:**
```javascript
// Before
<div style={{ width: '100%', height: `${peGravH}px`, background: '#0a84ff', transition: 'height 0.05s' }} />

// After
<div style={{ width: '100%', height: `${peGravH}px`, background: '#0a84ff', transition: 'height 0.05s', transform: ps.PE_grav < 0 ? `translateY(${peGravH}px)` : 'none' }} />
```

#### 2. Stopwatch Desync
**Lines 130-132:**
```javascript
// Before
        if (stopwatchRunning) {
            setStopwatchTime(prev => prev + dt); 
        }

// After
        if (stopwatchRunning && isPlaying) {
            setStopwatchTime(prev => prev + dt); 
        }
```

#### 3. Energy Destruction
**Lines 158-161:**
```javascript
// Before
                if (ps.y < 0.1) {
                    ps.y = 0.1;
                    ps.vy *= -0.5; // bounce
                }

// After
                if (ps.y < 0.1) {
                    ps.y = 0.1;
                    const oldVy = ps.vy;
                    ps.vy *= -0.5; // bounce
                    const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
                    ps.thermalEnergy += dKE;
                }
```

#### 4. Thermal Accumulation
**Lines 195-203:**
```javascript
// Before
    const handlePointerDown = (e, id) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const ps = physicsRef.current.find(p => p.id === id);
        if (ps) {
            ps.isDragging = true;
            ps.vy = 0;
            setSelectedSpringId(id);
        }
    };

// After
    const handlePointerDown = (e, id) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const ps = physicsRef.current.find(p => p.id === id);
        if (ps) {
            ps.isDragging = true;
            ps.vy = 0;
            ps.thermalEnergy = 0;
            setSelectedSpringId(id);
        }
    };
```

#### 5. 60 FPS Re-render when paused
**Lines 120-122:**
```javascript
// Before
        const realDt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const safeDt = Math.min(realDt, 0.1);

// After
        const realDt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const isAnyDragging = physicsRef.current.some(p => p.isDragging);
        if (!isPlaying && !isAnyDragging) {
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const safeDt = Math.min(realDt, 0.1);
```

## Verification Method
- **Energy Graph CSS**: Open the energy graph, pause simulation, grab a mass, and drag it well below the zero-line (stretch spring heavily). The browser console should not log a negative CSS height error, and the blue bar should translate downwards.
- **Stopwatch**: Start the stopwatch, pause the physics simulation. The stopwatch should freeze.
- **Energy Conservation**: Drag mass extremely high (near y=0) with 0 damping. Allow it to hit the ceiling (`y < 0.1`). Note the loss in KE instantly converts into a jump in the red Thermal Energy bar.
- **Thermal Accumulation**: After accumulating thermal energy, drag the mass. Thermal energy bar should reset to 0.
- **60 FPS Re-render**: Pause the simulation. Open React dev tools profiling or add a `console.log` inside the component render body. It should stop printing.
