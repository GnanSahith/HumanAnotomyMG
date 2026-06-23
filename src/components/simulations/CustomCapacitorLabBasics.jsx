import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Zap, Gauge, Sun, Battery, HelpCircle } from 'lucide-react';

// Linear path interpolation helper (defined outside component to prevent render cycles/lint warnings)
const getPointOnPath = (vertices, t) => {
  if (vertices.length === 0) return { x: 0, y: 0 };
  const totalSegments = vertices.length - 1;
  const position = t * totalSegments;
  const index = Math.floor(position);
  const fraction = position - index;
  
  if (index >= totalSegments) {
    return vertices[vertices.length - 1];
  }
  
  const p1 = vertices[index];
  const p2 = vertices[index + 1];
  return {
    x: p1.x + (p2.x - p1.x) * fraction,
    y: p1.y + (p2.y - p1.y) * fraction
  };
};

// Check if probe coordinate is touching top or bottom plates
const checkConnection = (px, py, w, Y_top, Y_bottom) => {
  const halfW = w / 2;
  // Check top plate collision zone
  if (px >= 380 - halfW && px <= 380 + halfW && py >= Y_top - 15 && py <= Y_top + 20) {
    return 'top';
  }
  // Check bottom plate collision zone
  if (px >= 380 - halfW && px <= 380 + halfW && py >= Y_bottom - 20 && py <= Y_bottom + 15) {
    return 'bottom';
  }
  return null;
};

// Switch routing wiring coordinate paths generator helper
const getBatteryVertices = (w, Y_top, Y_bottom) => {
  return [
    { x: 120, y: 340 }, // Battery bottom
    { x: 120, y: 460 },
    { x: 380 - w / 2, y: 460 },
    { x: 380 - w / 2, y: Y_bottom }, // Bottom plate
    { x: 380 - w / 2, y: Y_top }, // Top plate
    { x: 380 - w / 2 - 20, y: Y_top },
    { x: 380 - w / 2 - 20, y: 430 },
    { x: 380, y: 430 }, // Switch Pivot
    { x: 300, y: 390 }, // Switch Battery Terminal
    { x: 300, y: 110 },
    { x: 120, y: 110 },
    { x: 120, y: 220 } // Battery top
  ];
};

const getLightbulbVertices = (w, Y_top, Y_bottom) => {
  return [
    { x: 380 - w / 2, y: Y_bottom }, // Bottom plate
    { x: 380 - w / 2, y: 460 },
    { x: 655, y: 460 },
    { x: 655, y: 335 }, // Bulb terminal 2
    { x: 640, y: 290 }, // Bulb filament center
    { x: 625, y: 335 }, // Bulb terminal 1
    { x: 625, y: 110 },
    { x: 460, y: 110 },
    { x: 460, y: 390 }, // Switch Bulb Terminal
    { x: 380, y: 430 }, // Switch Pivot
    { x: 380 - w / 2 - 20, y: 430 },
    { x: 380 - w / 2 - 20, y: Y_top },
    { x: 380 - w / 2, y: Y_top } // Top plate
  ];
};

const CustomCapacitorLabBasicsInner = () => {
  const canvasRef = useRef(null);
  
  // React state for controls and synchronization
  const [area, setArea] = useState(200); // mm^2 (100 to 400)
  const [separation, setSeparation] = useState(5.0); // mm (2.0 to 10.0)
  const [batteryVoltage, setBatteryVoltage] = useState(1.5); // Volts (-1.5 to +1.5)
  const [connectionMode, setConnectionMode] = useState('battery'); // 'battery', 'disconnect', 'lightbulb'
  
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [showCharges, setShowCharges] = useState(true);
  const [showVoltmeter, setShowVoltmeter] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // High-frequency DOM element refs for lag-free bar meters
  const capacitanceBarRef = useRef(null);
  const capacitanceValRef = useRef(null);
  const chargeBarRef = useRef(null);
  const chargeValRef = useRef(null);
  const energyBarRef = useRef(null);
  const energyValRef = useRef(null);

  // Internal physical simulation state
  const stateRef = useRef({
    area: 200,
    separation: 5.0,
    batteryVoltage: 1.5,
    connectionMode: 'battery',
    voltage: 1.5, // Current capacitor voltage
    charge: 0.0, // Current capacitor charge (pC)
    lastTime: 0, // Initialized inside tick loop to avoid impure performance.now() call during render
    currentBuffer: 0.0, // Low-passed current for electron animation

    // Draggable Voltmeter state
    voltmeter: { x: 550, y: 80 },
    probeRed: { x: 520, y: 150, docked: true },
    probeBlack: { x: 580, y: 150, docked: true },
    draggedElement: null, // 'voltmeter' | 'probeRed' | 'probeBlack' | 'topPlate' | 'rightEdge' | 'batterySlider'
    dragOffset: { x: 0, y: 0 },

    // Electron flow animation progress (0 to 1)
    electrons: Array.from({ length: 18 }, (_, i) => i / 18),
  });

  // Keep stateRef in sync with React state
  useEffect(() => {
    stateRef.current.area = area;
  }, [area]);

  useEffect(() => {
    stateRef.current.separation = separation;
  }, [separation]);

  useEffect(() => {
    stateRef.current.batteryVoltage = batteryVoltage;
  }, [batteryVoltage]);

  useEffect(() => {
    stateRef.current.connectionMode = connectionMode;
  }, [connectionMode]);

  // Distance helper
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // Coordinate helper for objectFit contain mapping
  const getMouseCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    const renderedWidth = canvas.width * scale;
    const renderedHeight = canvas.height * scale;
    
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    
    return { x, y };
  };

  // Handle Canvas MouseDown (Hit Testing)
  const handleMouseDown = (e) => {
    const { x: mx, y: my } = getMouseCoordinates(e);

    const s = stateRef.current;
    const w = s.area * 0.5;
    const Y_top = 220 - s.separation * 8;
    const Y_bottom = 220 + s.separation * 8;

    // 1. Red probe tip hit test
    if (dist(mx, my, s.probeRed.x, s.probeRed.y) < 18) {
      s.draggedElement = 'probeRed';
      return;
    }

    // 2. Black probe tip hit test
    if (dist(mx, my, s.probeBlack.x, s.probeBlack.y) < 18) {
      s.draggedElement = 'probeBlack';
      return;
    }

    // 3. Voltmeter body hit test
    if (showVoltmeter) {
      if (mx >= s.voltmeter.x - 70 && mx <= s.voltmeter.x + 70 &&
          my >= s.voltmeter.y - 40 && my <= s.voltmeter.y + 40) {
        s.draggedElement = 'voltmeter';
        s.dragOffset = { x: mx - s.voltmeter.x, y: my - s.voltmeter.y };
        return;
      }
    }

    // 4. Battery slider handle hit test
    const Y_handle = 280 - (s.batteryVoltage / 1.5) * 60;
    if (mx >= 55 && mx <= 85 && my >= Y_handle - 10 && my <= Y_handle + 10) {
      s.draggedElement = 'batterySlider';
      return;
    }

    // 5. Right edge of plates (Area drag handle)
    const x_edge = 380 + w / 2;
    if (mx >= x_edge - 10 && mx <= x_edge + 15 && my >= Y_top - 5 && my <= Y_bottom + 5) {
      s.draggedElement = 'rightEdge';
      return;
    }

    // 6. Top plate hit test (Separation drag handle)
    if (mx >= 380 - w / 2 && mx <= 380 + w / 2 && my >= Y_top - 8 && my <= Y_top + 8) {
      s.draggedElement = 'topPlate';
      s.dragOffset.y = my - Y_top;
      return;
    }

    // 7. Switch terminals click toggle
    if (dist(mx, my, 300, 390) < 25) {
      setConnectionMode('battery');
    } else if (dist(mx, my, 380, 350) < 25) {
      setConnectionMode('disconnect');
    } else if (dist(mx, my, 460, 390) < 25) {
      setConnectionMode('lightbulb');
    }
  };

  // Handle Canvas MouseMove (Dragging)
  const handleMouseMove = (e) => {
    const s = stateRef.current;
    if (!s.draggedElement) return;

    const { x: mx, y: my } = getMouseCoordinates(e);

    if (s.draggedElement === 'probeRed') {
      s.probeRed.x = mx;
      s.probeRed.y = my;
      s.probeRed.docked = false;

      // Snapping back to dock
      if (dist(s.probeRed.x, s.probeRed.y, s.voltmeter.x - 30, s.voltmeter.y + 40) < 25) {
        s.probeRed.docked = true;
      }
    } else if (s.draggedElement === 'probeBlack') {
      s.probeBlack.x = mx;
      s.probeBlack.y = my;
      s.probeBlack.docked = false;

      // Snapping back to dock
      if (dist(s.probeBlack.x, s.probeBlack.y, s.voltmeter.x + 30, s.voltmeter.y + 40) < 25) {
        s.probeBlack.docked = true;
      }
    } else if (s.draggedElement === 'voltmeter') {
      s.voltmeter.x = Math.max(80, Math.min(canvas.width - 80, mx - s.dragOffset.x));
      s.voltmeter.y = Math.max(50, Math.min(canvas.height - 50, my - s.dragOffset.y));

      if (s.probeRed.docked) {
        s.probeRed.x = s.voltmeter.x - 30;
        s.probeRed.y = s.voltmeter.y + 40;
      }
      if (s.probeBlack.docked) {
        s.probeBlack.x = s.voltmeter.x + 30;
        s.probeBlack.y = s.voltmeter.y + 40;
      }
    } else if (s.draggedElement === 'batterySlider') {
      const cy = Math.max(220, Math.min(340, my));
      const dy = 280 - cy;
      const v = (dy / 60) * 1.5;
      setBatteryVoltage(Number(v.toFixed(3)));
    } else if (s.draggedElement === 'topPlate') {
      const newY_top = my - s.dragOffset.y;
      const sep = (220 - newY_top) / 8;
      setSeparation(Math.max(2.0, Math.min(10.0, Number(sep.toFixed(2)))));
    } else if (s.draggedElement === 'rightEdge') {
      const newHalfW = mx - 380;
      const a = newHalfW * 2;
      setArea(Math.max(100, Math.min(400, Math.round(a))));
    }
  };

  // Handle Canvas MouseUp/MouseLeave
  const handleMouseUp = () => {
    stateRef.current.draggedElement = null;
  };

  // Reset all parameters to initial state
  const handleReset = () => {
    setArea(200);
    setSeparation(5.0);
    setBatteryVoltage(1.5);
    setConnectionMode('battery');
    setShowFieldLines(true);
    setShowCharges(true);
    setShowVoltmeter(false);

    const s = stateRef.current;
    s.voltage = 1.5;
    s.charge = 0.0;
    s.currentBuffer = 0.0;
    s.voltmeter = { x: 550, y: 80 };
    s.probeRed = { x: 520, y: 150, docked: true };
    s.probeBlack = { x: 580, y: 150, docked: true };
    s.draggedElement = null;
  };

  // Animation & Physics simulation loop (60fps requestAnimationFrame)
  useEffect(() => {
    let animId;

    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext('2d');
      const now = performance.now();
      
      const s = stateRef.current;
      if (s.lastTime === 0) {
        s.lastTime = now;
      }
      const dt = (now - s.lastTime) / 1000;
      s.lastTime = now;

      // 1. Physics Calculations
      // Epsilon_0 = 8.854 pF/m
      // C = epsilon_0 * Area / separation
      const C = 0.008854 * s.area / s.separation; // in pF

      let oldVoltage = s.voltage;

      if (s.connectionMode === 'battery') {
        s.voltage = s.batteryVoltage;
        s.charge = C * s.voltage;
      } else if (s.connectionMode === 'lightbulb') {
        // Lightbulb discharge: tau = R * C
        // We set bulb resistance R = 15 Teraohms (so that time constant is C * 15 seconds)
        const R = 15.0; // T_omega
        const tau = R * C; // seconds
        s.charge = s.charge * Math.exp(-dt / tau);
        s.voltage = s.charge / C;
      } else {
        // Disconnected: charge Q is constant, voltage varies if C changes
        s.voltage = s.charge / C;
      }

      // Track current flow (dQ / dt) for electron drift animation
      const dQ = (s.voltage * C) - (oldVoltage * C);
      const instantCurrent = dt > 0 ? dQ / dt : 0;
      // Low-pass filter the current to avoid glitchy movements
      s.currentBuffer = s.currentBuffer * 0.9 + instantCurrent * 0.1;

      // Calculate stored energy U = 0.5 * C * V^2 (in pJ)
      const U = 0.5 * C * s.voltage * s.voltage;

      // Update React-independent Bar Meters in the DOM directly (high performance)
      if (capacitanceBarRef.current) {
        // Max capacitance is when Area = 400, Sep = 2.0 => C = 0.008854 * 400 / 2.0 = 1.77 pF
        const pct = Math.min(100, (C / 1.8) * 100);
        capacitanceBarRef.current.style.width = `${pct}%`;
      }
      if (capacitanceValRef.current) {
        capacitanceValRef.current.textContent = `${C.toFixed(3)} pF`;
      }

      if (chargeBarRef.current) {
        // Max charge magnitude is when C = 1.77, V = 1.5 => Q = 2.655 pC
        const Q_mag = Math.abs(s.charge);
        const pct = Math.min(100, (Q_mag / 2.7) * 100);
        chargeBarRef.current.style.width = `${pct}%`;
      }
      if (chargeValRef.current) {
        chargeValRef.current.textContent = `${Math.abs(s.charge).toFixed(3)} pC`;
      }

      if (energyBarRef.current) {
        // Max energy is when C = 1.77, V = 1.5 => U = 0.5 * 1.77 * 2.25 = 1.99 pJ
        const pct = Math.min(100, (U / 2.0) * 100);
        energyBarRef.current.style.width = `${pct}%`;
      }
      if (energyValRef.current) {
        energyValRef.current.textContent = `${U.toFixed(3)} pJ`;
      }

      // 2. Rendering the Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle blueprint-like grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      const w = s.area * 0.5;
      const Y_top = 220 - s.separation * 8;
      const Y_bottom = 220 + s.separation * 8;

      // Render wire structures
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw Battery to Switch wires
      ctx.beginPath();
      ctx.moveTo(120, 220); // Battery positive
      ctx.lineTo(120, 110);
      ctx.lineTo(300, 110);
      ctx.lineTo(300, 390); // switch left contact
      ctx.stroke();

      // Draw Switch to Capacitor Top Plate wires
      ctx.beginPath();
      ctx.moveTo(380, 430); // switch pivot
      ctx.lineTo(380 - w / 2 - 20, 430);
      ctx.lineTo(380 - w / 2 - 20, Y_top);
      ctx.lineTo(380 - w / 2, Y_top); // Capacitor top plate edge
      ctx.stroke();

      // Draw Lightbulb to Switch wires
      ctx.beginPath();
      ctx.moveTo(460, 390); // switch right contact
      ctx.lineTo(460, 110);
      ctx.lineTo(625, 110);
      ctx.lineTo(625, 335); // bulb terminal 1
      ctx.stroke();

      // Draw Bottom plate wire connections (Battery neg, bulb negative, capacitor bottom)
      ctx.beginPath();
      ctx.moveTo(120, 340); // Battery negative
      ctx.lineTo(120, 460);
      ctx.lineTo(655, 460);
      ctx.lineTo(655, 335); // bulb terminal 2
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(380 - w / 2, 460); // bottom plate junction
      ctx.lineTo(380 - w / 2, Y_bottom); // Bottom plate edge
      ctx.stroke();

      // 3. Render Switch Contact Terminals and Knife Arm
      // Switch contacts
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.arc(300, 390, 8, 0, Math.PI * 2); ctx.fill(); // Battery contact
      ctx.beginPath(); ctx.arc(460, 390, 8, 0, Math.PI * 2); ctx.fill(); // Lightbulb contact
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.arc(380, 430, 9, 0, Math.PI * 2); ctx.fill(); // Pivot terminal

      // Knife blade arm
      ctx.save();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#f59e0b'; // golden brass switch arm
      ctx.beginPath();
      ctx.moveTo(380, 430);
      if (s.connectionMode === 'battery') {
        ctx.lineTo(300, 390);
      } else if (s.connectionMode === 'lightbulb') {
        ctx.lineTo(460, 390);
      } else {
        ctx.lineTo(380, 360); // vertical (open)
      }
      ctx.stroke();
      ctx.restore();

      // 4. Render Battery
      ctx.save();
      // Draw battery cylinder
      const batGrad = ctx.createLinearGradient(95, 0, 145, 0);
      batGrad.addColorStop(0, '#1e293b');
      batGrad.addColorStop(0.3, '#475569');
      batGrad.addColorStop(0.7, '#334155');
      batGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = batGrad;
      ctx.beginPath();
      ctx.roundRect(95, 230, 50, 100, 6);
      ctx.fill();

      // Battery positive cap (brass color)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(112, 222, 16, 8);

      // Battery markings (+ and -)
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('+', 115, 252);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('-', 116, 318);

      // Battery voltage slider track next to it
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(70, 220);
      ctx.lineTo(70, 340);
      ctx.stroke();

      // Battery slider handle
      const Y_handle = 280 - (s.batteryVoltage / 1.5) * 60;
      const handleGrad = ctx.createLinearGradient(55, 0, 85, 0);
      handleGrad.addColorStop(0, '#ef4444');
      handleGrad.addColorStop(0.5, '#f87171');
      handleGrad.addColorStop(1, '#b91c1c');
      ctx.fillStyle = handleGrad;
      ctx.beginPath();
      ctx.roundRect(55, Y_handle - 8, 30, 16, 4);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Voltage value readout label on battery
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.batteryVoltage >= 0 ? '+' : ''}${s.batteryVoltage.toFixed(2)}V`, 120, 285);
      ctx.restore();

      // 5. Render Lightbulb
      ctx.save();
      const bulbX = 640;
      const bulbY = 280;

      // Glow effect if discharging
      if (s.connectionMode === 'lightbulb' && Math.abs(s.voltage) > 0.01) {
        const glowRadius = 30 + (Math.abs(s.voltage) / 1.5) * 80;
        const opacity = Math.min(0.85, (Math.abs(s.voltage) / 1.5) ** 2);
        
        // Radial glow gradient
        const radGlow = ctx.createRadialGradient(bulbX, bulbY - 10, 10, bulbX, bulbY - 10, glowRadius);
        radGlow.addColorStop(0, `rgba(253, 224, 71, ${opacity})`);
        radGlow.addColorStop(0.5, `rgba(234, 179, 8, ${opacity * 0.35})`);
        radGlow.addColorStop(1, 'rgba(234, 179, 8, 0)');
        
        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY - 10, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing rays
        const numRays = 12;
        ctx.strokeStyle = `rgba(253, 224, 71, ${opacity * 0.85})`;
        ctx.lineWidth = 2.5;
        for (let i = 0; i < numRays; i++) {
          const angle = (i * Math.PI * 2) / numRays;
          const rayStart = 38;
          const rayLen = 15 + (Math.abs(s.voltage) / 1.5) * 25;
          ctx.beginPath();
          ctx.moveTo(bulbX + Math.cos(angle) * rayStart, bulbY - 10 + Math.sin(angle) * rayStart);
          ctx.lineTo(bulbX + Math.cos(angle) * (rayStart + rayLen), bulbY - 10 + Math.sin(angle) * (rayStart + rayLen));
          ctx.stroke();
        }
      }

      // Socket (brass/metal base)
      ctx.fillStyle = '#78716c';
      ctx.fillRect(bulbX - 15, bulbY + 20, 30, 16);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(bulbX - 12, bulbY + 36, 24, 5);

      // Glass bulb outline
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY - 10, 32, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.lineTo(bulbX + 15, bulbY + 20);
      ctx.lineTo(bulbX - 15, bulbY + 20);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();

      // Filament support wires and glowing filament
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bulbX - 8, bulbY + 20);
      ctx.lineTo(bulbX - 5, bulbY + 2);
      ctx.moveTo(bulbX + 8, bulbY + 20);
      ctx.lineTo(bulbX + 5, bulbY + 2);
      ctx.stroke();

      // Filament loop
      ctx.strokeStyle = (s.connectionMode === 'lightbulb' && Math.abs(s.voltage) > 0.01) ? '#f59e0b' : '#78716c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bulbX - 5, bulbY + 2);
      ctx.bezierCurveTo(bulbX - 12, bulbY - 15, bulbX + 12, bulbY - 15, bulbX + 5, bulbY + 2);
      ctx.stroke();
      ctx.restore();

      // 6. Render Electric Field Lines between Capacitor Plates
      if (showFieldLines && Math.abs(s.voltage) > 0.05) {
        ctx.save();
        const numLines = Math.max(3, Math.min(22, Math.floor(w / 12)));
        const fieldIntensity = Math.abs(s.voltage) / s.separation; // proportional to V / d
        // Set opacity based on field intensity
        const opacity = Math.min(0.9, fieldIntensity * 2.0);
        ctx.strokeStyle = `rgba(147, 51, 234, ${opacity})`; // purple field lines
        ctx.lineWidth = Math.min(4, Math.max(1, fieldIntensity * 6));

        // Draw vertical field lines with direction arrows
        for (let i = 0; i < numLines; i++) {
          const fraction = numLines > 1 ? i / (numLines - 1) : 0.5;
          const lx = (380 - w / 2) + fraction * w;

          ctx.beginPath();
          ctx.moveTo(lx, Y_top + 4);
          ctx.lineTo(lx, Y_bottom - 4);
          ctx.stroke();

          // Draw field direction arrows pointing from positive plate to negative
          const isTopPositive = s.voltage > 0;
          const arrowY = (Y_top + Y_bottom) / 2;
          const arrowDir = isTopPositive ? 1 : -1;

          ctx.fillStyle = `rgba(147, 51, 234, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(lx, arrowY + arrowDir * 6);
          ctx.lineTo(lx - 4, arrowY - arrowDir * 2);
          ctx.lineTo(lx + 4, arrowY - arrowDir * 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Render Capacitor Plates (Metallic look with handles)
      ctx.save();
      
      // Top Plate (Positive plate if V > 0)
      const topPlateGrad = ctx.createLinearGradient(380 - w/2, 0, 380 + w/2, 0);
      topPlateGrad.addColorStop(0, '#64748b');
      topPlateGrad.addColorStop(0.3, '#94a3b8');
      topPlateGrad.addColorStop(0.7, '#64748b');
      topPlateGrad.addColorStop(1, '#475569');
      
      ctx.fillStyle = topPlateGrad;
      ctx.beginPath();
      ctx.roundRect(380 - w / 2, Y_top - 4, w, 8, 3);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bottom Plate
      ctx.fillStyle = topPlateGrad;
      ctx.beginPath();
      ctx.roundRect(380 - w / 2, Y_bottom - 4, w, 8, 3);
      ctx.fill();
      ctx.stroke();

      // Plate handles/indicators
      // Top plate separation arrow handle (two-headed vertical arrow)
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Up arrow
      ctx.moveTo(380, Y_top - 18);
      ctx.lineTo(375, Y_top - 12);
      ctx.lineTo(385, Y_top - 12);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Down arrow
      ctx.beginPath();
      ctx.moveTo(380, Y_top - 6);
      ctx.lineTo(375, Y_top - 12);
      ctx.lineTo(385, Y_top - 12);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // Right edge Area handle (double-headed horizontal arrow)
      const x_edge = 380 + w / 2;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      // Left arrow
      ctx.moveTo(x_edge + 8, 220);
      ctx.lineTo(x_edge + 14, 215);
      ctx.lineTo(x_edge + 14, 225);
      ctx.closePath();
      ctx.fill();
      // Right arrow
      ctx.beginPath();
      ctx.moveTo(x_edge + 20, 220);
      ctx.lineTo(x_edge + 14, 215);
      ctx.lineTo(x_edge + 14, 225);
      ctx.closePath();
      ctx.fill();
      // Dotted horizontal connection line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x_edge, 220);
      ctx.lineTo(x_edge + 8, 220);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      ctx.restore();

      // 8. Draw Charge Symbols on Plates (+ / -)
      if (showCharges && Math.abs(s.voltage) > 0.01) {
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate number of charges to display based on plate charge
        const Q_mag = Math.abs(s.charge);
        const maxDisplayCharges = 22;
        const numSymbols = Math.max(1, Math.min(maxDisplayCharges, Math.round(Q_mag * 8)));

        const topIsPositive = s.voltage > 0;

        for (let i = 0; i < numSymbols; i++) {
          const fraction = numSymbols > 1 ? i / (numSymbols - 1) : 0.5;
          // Space charges along the plate width
          const cx = (380 - w / 2 + 10) + fraction * (w - 20);

          // Top Plate charges
          ctx.fillStyle = topIsPositive ? '#f87171' : '#60a5fa';
          ctx.fillText(topIsPositive ? '+' : '-', cx, Y_top + 10);

          // Bottom Plate charges
          ctx.fillStyle = topIsPositive ? '#60a5fa' : '#f87171';
          ctx.fillText(topIsPositive ? '-' : '+', cx, Y_bottom - 10);
        }
        ctx.restore();
      }

      // 9. Electron flow animation along wires
      const activePath = s.connectionMode === 'battery' 
        ? getBatteryVertices(w, Y_top, Y_bottom)
        : (s.connectionMode === 'lightbulb' ? getLightbulbVertices(w, Y_top, Y_bottom) : null);

      if (activePath && activePath.length > 1) {
        ctx.save();
        // Determine drift speed based on active mode
        let driftSpeed = 0.0;
        let flowDir = 1.0;

        if (s.connectionMode === 'battery') {
          // speed based on voltage-change transient buffer
          driftSpeed = Math.abs(s.currentBuffer) * 35.0;
          flowDir = s.batteryVoltage > 0 ? -1.0 : 1.0;
        } else if (s.connectionMode === 'lightbulb') {
          // speed based on discharge current (proportional to capacitor voltage)
          driftSpeed = (Math.abs(s.voltage) / 1.5) * 8.0;
          flowDir = s.charge > 0 ? -1.0 : 1.0;
        }

        // Animate particles along the active path wire lines
        s.electrons.forEach((t, index) => {
          // Increment position progress
          let newT = t + flowDir * driftSpeed * dt;
          if (newT < 0) newT += 1.0;
          s.electrons[index] = newT % 1.0;

          // Interpolate coordinate along current active wire layout
          const pos = getPointOnPath(activePath, s.electrons[index]);

          // Draw electron particle (blue circle with '-' sign)
          ctx.fillStyle = '#06b6d4'; // cyan electron glow
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.font = '7px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('-', pos.x, pos.y);
        });
        ctx.restore();
      }

      // 10. Render Voltmeter Body and Draggable Probes
      if (showVoltmeter) {
        ctx.save();
        const vx = s.voltmeter.x;
        const vy = s.voltmeter.y;

        // Perform probe node connection checks
        const redNode = checkConnection(s.probeRed.x, s.probeRed.y, w, Y_top, Y_bottom);
        const blackNode = checkConnection(s.probeBlack.x, s.probeBlack.y, w, Y_top, Y_bottom);

        let redV = null;
        let blackV = null;
        if (redNode === 'top') redV = s.voltage;
        else if (redNode === 'bottom') redV = 0;

        if (blackNode === 'top') blackV = s.voltage;
        else if (blackNode === 'bottom') blackV = 0;

        let measuredDiff = null;
        if (redV !== null && blackV !== null) {
          measuredDiff = redV - blackV;
        }

        // Draw Probe flexible wires (smooth Bezier curves)
        // Red probe wire
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(vx - 30, vy + 40);
        ctx.bezierCurveTo(vx - 60, vy + 80, s.probeRed.x - 20, s.probeRed.y - 30, s.probeRed.x, s.probeRed.y);
        ctx.stroke();

        // Black probe wire
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(vx + 30, vy + 40);
        ctx.bezierCurveTo(vx + 60, vy + 80, s.probeBlack.x + 20, s.probeBlack.y - 30, s.probeBlack.x, s.probeBlack.y);
        ctx.stroke();

        // Draw Voltmeter main chassis panel (glassmorphic dark box)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)'; // deep navy slate
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(vx - 70, vy - 40, 140, 80, 10);
        ctx.fill();
        ctx.stroke();

        // Clear shadow for interior rendering
        ctx.shadowColor = 'transparent';

        // LCD reading screen
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.roundRect(vx - 55, vy - 24, 110, 32, 4);
        ctx.fill();

        // Screen readout text
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (measuredDiff !== null) {
          ctx.fillStyle = '#22c55e'; // bright neon green
          const sign = measuredDiff >= 0 ? '+' : '';
          ctx.fillText(`${sign}${measuredDiff.toFixed(3)} V`, vx, vy - 8);
        } else {
          ctx.fillStyle = '#64748b'; // dimmed slate
          ctx.fillText('?.??? V', vx, vy - 8);
        }

        // Instrument label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('VOLTMETER', vx, vy + 22);

        // Socket terminals
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(vx - 30, vy + 40, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.arc(vx + 30, vy + 40, 5, 0, Math.PI * 2); ctx.fill();

        // Draw Probe handles and tips
        // Red probe
        ctx.save();
        ctx.translate(s.probeRed.x, s.probeRed.y);
        ctx.rotate(-Math.PI / 4); // Angled needle
        // Metal tip
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-1.5, -28, 3, 14);
        // Red body
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(-4, -14, 8, 28, 3);
        ctx.fill();
        // Red cap
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath(); ctx.arc(0, 14, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Black probe
        ctx.save();
        ctx.translate(s.probeBlack.x, s.probeBlack.y);
        ctx.rotate(Math.PI / 4);
        // Metal tip
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-1.5, -28, 3, 14);
        // Black body
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-4, -14, 8, 28, 3);
        ctx.fill();
        // Black cap
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(0, 14, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.restore();
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [showFieldLines, showCharges, showVoltmeter]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'absolute',
      inset: 0,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f8fafc',
      pointerEvents: 'none'
    }}>
      {/* Main View: Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleMouseDown(touch);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          handleMouseMove(touch);
        }}
        onTouchEnd={handleMouseUp}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'crosshair',
          touchAction: 'none',
          pointerEvents: 'auto',
          zIndex: 1
        }}
      />

      {/* Floating Left Panel: Measurements */}
      <div style={{
        position: 'absolute',
        top: '90px',
        left: '20px',
        width: '280px',
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 10,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        pointerEvents: 'auto'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', margin: 0 }}>
          Measurements
        </h3>

        {/* Capacitance Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} style={{ color: '#38bdf8' }} />
              CAPACITANCE
            </span>
            <span ref={capacitanceValRef} style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', color: '#f1f5f9' }}>
              0.000 pF
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
            <div ref={capacitanceBarRef} style={{
              height: '100%',
              width: '0%',
              backgroundImage: 'linear-gradient(to right, #38bdf8, #0ea5e9)',
              boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)',
              borderRadius: '3px',
              transition: 'width 0.1s ease-out'
            }} />
          </div>
        </div>

        {/* Plate Charge Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={14} style={{ color: '#a855f7' }} />
              PLATE CHARGE
            </span>
            <span ref={chargeValRef} style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', color: '#f1f5f9' }}>
              0.000 pC
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
            <div ref={chargeBarRef} style={{
              height: '100%',
              width: '0%',
              backgroundImage: 'linear-gradient(to right, #c084fc, #a855f7)',
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
              borderRadius: '3px',
              transition: 'width 0.1s ease-out'
            }} />
          </div>
        </div>

        {/* Stored Energy Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sun size={14} style={{ color: '#10b981' }} />
              STORED ENERGY
            </span>
            <span ref={energyValRef} style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', color: '#f1f5f9' }}>
              0.000 pJ
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
            <div ref={energyBarRef} style={{
              height: '100%',
              width: '0%',
              backgroundImage: 'linear-gradient(to right, #34d399, #10b981)',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
              borderRadius: '3px',
              transition: 'width 0.1s ease-out'
            }} />
          </div>
        </div>

        {/* Resets / Help Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <HelpCircle size={13} />
            {showHelp ? 'Hide Guide' : 'Guide'}
          </button>
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* Floating Right Panel: Settings */}
      <div style={{
        position: 'absolute',
        top: '90px',
        right: '20px',
        width: '320px',
        maxHeight: 'calc(100% - 120px)',
        overflowY: 'auto',
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 10,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        pointerEvents: 'auto'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', margin: 0 }}>
          Settings
        </h3>

        {/* Connection Mode Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.5px' }}>CONNECTION MODE</label>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <button
              onClick={() => setConnectionMode('battery')}
              style={{
                backgroundColor: connectionMode === 'battery' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: connectionMode === 'battery' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                color: connectionMode === 'battery' ? '#38bdf8' : '#94a3b8',
                padding: '8px 12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Battery size={14} />
              Connect Battery
            </button>
            <button
              onClick={() => setConnectionMode('disconnect')}
              style={{
                backgroundColor: connectionMode === 'disconnect' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: connectionMode === 'disconnect' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                color: connectionMode === 'disconnect' ? '#f8fafc' : '#94a3b8',
                padding: '8px 12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Zap size={14} />
              Disconnect
            </button>
            <button
              onClick={() => setConnectionMode('lightbulb')}
              style={{
                backgroundColor: connectionMode === 'lightbulb' ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                border: connectionMode === 'lightbulb' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid transparent',
                color: connectionMode === 'lightbulb' ? '#f59e0b' : '#94a3b8',
                padding: '8px 12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sun size={14} />
              Connect Lightbulb
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Plate Area Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>PLATE AREA</label>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>{area} mm²</span>
            </div>
            <input
              type="range"
              min="100"
              max="400"
              step="10"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                background: '#1e293b',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
                accentColor: '#38bdf8'
              }}
            />
          </div>

          {/* Plate Separation Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>PLATE SEPARATION</label>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>{separation.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="10.0"
              step="0.1"
              value={separation}
              onChange={(e) => setSeparation(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                background: '#1e293b',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
                accentColor: '#38bdf8'
              }}
            />
          </div>

          {/* Battery Voltage Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>BATTERY VOLTAGE</label>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>
                {batteryVoltage >= 0 ? '+' : ''}{batteryVoltage.toFixed(2)} V
              </span>
            </div>
            <input
              type="range"
              min="-1.50"
              max="1.50"
              step="0.05"
              value={batteryVoltage}
              onChange={(e) => setBatteryVoltage(Number(e.target.value))}
              disabled={connectionMode !== 'battery'}
              style={{
                width: '100%',
                height: '6px',
                background: '#1e293b',
                borderRadius: '3px',
                outline: 'none',
                cursor: connectionMode === 'battery' ? 'pointer' : 'not-allowed',
                opacity: connectionMode === 'battery' ? 1.0 : 0.4,
                accentColor: '#ef4444'
              }}
            />
          </div>
        </div>

        {/* Visual Options / Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.5px' }}>VISUALIZATIONS</label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Show Field Lines */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showFieldLines}
                onChange={(e) => setShowFieldLines(e.target.checked)}
                style={{
                  width: '15px',
                  height: '15px',
                  accentColor: '#a855f7',
                  cursor: 'pointer'
                }}
              />
              Electric Field Lines
            </label>

            {/* Show Charges */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showCharges}
                onChange={(e) => setShowCharges(e.target.checked)}
                style={{
                  width: '15px',
                  height: '15px',
                  accentColor: '#a855f7',
                  cursor: 'pointer'
                }}
              />
              Plate Charges (+ / -)
            </label>

            {/* Show Voltmeter */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showVoltmeter}
                onChange={(e) => setShowVoltmeter(e.target.checked)}
                style={{
                  width: '15px',
                  height: '15px',
                  accentColor: '#a855f7',
                  cursor: 'pointer'
                }}
              />
              Active Voltmeter Probe
            </label>
          </div>
        </div>
      </div>

      {/* Floating Bottom Center: Help Guide overlay */}
      {showHelp && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '320px',
          right: '360px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '16px',
          zIndex: 10,
          fontSize: '12px',
          color: '#cbd5e1',
          pointerEvents: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          <h4 style={{ color: '#38bdf8', margin: '0 0 6px 0', fontSize: '13px' }}>Guide</h4>
          <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Drag top plate vertically to change separation. Drag right edge of top plate to adjust surface area.</li>
            <li>Select "Connect Battery" and drag the battery slider to charge.</li>
            <li>Select "Connect Lightbulb" to discharge through filament.</li>
            <li>With Voltmeter Probe enabled, drag the voltmeter body and position the red/black probes on top/bottom plates to measure voltage.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default function CustomCapacitorLabBasics({ onBack, title }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <style>{`
                .glass-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    color: white;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .glass-btn:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-1px); }
                .glass-btn:active { transform: translateY(1px); }
                .glass-btn-blue { background: rgba(52, 152, 219, 0.15); border-color: rgba(52, 152, 219, 0.3); color: #3498db; }
                .glass-btn-blue:hover { background: rgba(52, 152, 219, 0.25); }
                .reset-btn { background: rgba(231, 76, 60, 0.2); border-color: rgba(231, 76, 60, 0.3); color: #e74c3c; }
                .reset-btn:hover { background: rgba(231, 76, 60, 0.3); }
            `}</style>

            {/* Standardized Header */}
            <div style={{ height: '80px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    {onBack && (
                        <button onClick={onBack} className="glass-btn">
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                </div>
                <div>
                    <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', margin: 0 }}>
                        {title || 'Capacitor Lab Basics'}
                    </h2>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    {/* Inner handles actions */}
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
                 <CustomCapacitorLabBasicsInner />
            </div>
        </div>
    );
}
