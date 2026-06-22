# Failure Report: Iteration 2 for phys_6

## Overview
Iteration 2 successfully implemented the missing features (Multiple Springs, Energy Graph, Measuring Tools, Unknown Masses). However, it failed the Challenger empirical testing gate due to multiple physics and edge-case bugs. 

## Feedback
- **Challenger 4 & 3 VETO (High)**: **Energy Graph CSS Crash**: When the spring stretches too far, `PE_grav` can become negative, causing the React inline style to use a negative height (e.g. `height: -133.5px`). The browser ignores negative heights, causing the bar to disappear entirely. **Fix Strategy**: In the Energy Graph render, take the absolute value of energy for the bar height, and if `PE_grav` is negative, render the bar downwards below the 0-line, or define a static `y=0` datum at the bottom of the screen so `h` is always positive.
- **Challenger 4 VETO (High)**: **Stopwatch Desync**: The stopwatch continues to increment by `dt` every frame even when the simulation is paused (`isPlaying = false`). **Fix Strategy**: Only increment `stopwatchTime` inside the physics loop when `isPlaying` is true.
- **Challenger 4 & 3 VETO (Medium)**: **Energy Destruction & Conservation**: When the mass hits the ceiling (`y < 0.1`), its velocity is reversed and halved (`vy *= -0.5`), destroying 75% of kinetic energy without adding the lost energy to `thermalEnergy`. **Fix Strategy**: Calculate the kinetic energy lost during the bounce (`dKE = 0.5 * m * (oldVy^2 - newVy^2)`) and add it to `thermalEnergy`.
- **Challenger 3 VETO (Medium)**: **Thermal Accumulation**: Thermal energy accumulates infinitely across multiple drags/resets without clearing. **Fix Strategy**: Reset `thermalEnergy` to 0 when the user drags the mass or resets the simulation.
- **Challenger 3 VETO (Low)**: **60 FPS Re-render when paused**: The `requestAnimationFrame` loop continuously fires and updates React state even when `isPlaying` is false and nothing is being dragged. **Fix Strategy**: Early return from `updatePhysics` if `!isPlaying && !isDragging`.

## Directive for Iteration 3
The Explorer must recommend exact code changes to resolve the Energy Graph negative CSS issue, the Stopwatch desync, the Energy Destruction during collisions, the infinite Thermal Accumulation, and the unnecessary 60 FPS re-renders.
