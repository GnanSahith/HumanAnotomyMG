import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Zap, Info, Activity, Sliders, RefreshCw, Settings2 } from 'lucide-react';

// Gyromagnetic ratio scaled for visible simulation speed (4*pi rad/s per Tesla)
const GAMMA_SIM = 4.0 * Math.PI;

// Tissue relaxation presets
const TISSUE_PRESETS = {
  fat: {
    T1: 600,
    T2: 80,
    name: 'Fat Tissue'
  },
  muscle: {
    T1: 1200,
    T2: 50,
    name: 'Muscle Tissue'
  },
  csf: {
    T1: 2800,
    T2: 240,
    name: 'Cerebrospinal Fluid (CSF)'
  },
  tumor: {
    T1: 1800,
    T2: 110,
    name: 'Pathology / Tumor'
  },
  custom: {
    T1: 1000,
    T2: 100,
    name: 'Custom Material'
  }
};

// --- Rendering Functions moved to Module scope ---
function drawGridCanvas(canvas, state, rfActive, phi) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2 + 10;

  // Draw static magnetic field B0 lines in background
  ctx.strokeStyle = `rgba(191, 90, 242, ${0.03 + state.B0 / 3.0 * 0.12})`;
  ctx.lineWidth = 1;
  const lines = Math.floor(state.B0 * 4) + 3;
  for (let i = 0; i < lines; i++) {
    const lx = cx - 130 + 260 / (lines - 1) * i;
    ctx.beginPath();
    ctx.moveTo(lx, cy + 70);
    ctx.lineTo(lx, cy - 70);
    ctx.stroke();

    // Field arrow head
    ctx.fillStyle = `rgba(191, 90, 242, ${0.08 + state.B0 / 3.0 * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(lx, cy - 75);
    ctx.lineTo(lx - 3, cy - 69);
    ctx.lineTo(lx + 3, cy - 69);
    ctx.fill();
  }

  // Draw scanner bore back cylinder ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 20, 160, 75, 0, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw RF transmitter plates on sides
  // Left coil
  ctx.fillStyle = rfActive ? 'rgba(255, 159, 10, 0.18)' : 'rgba(255, 255, 255, 0.03)';
  ctx.strokeStyle = rfActive ? 'rgba(255, 159, 10, 0.8)' : 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx - 150, cy, 10, 30, Math.PI / 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Right coil
  ctx.fillStyle = rfActive ? 'rgba(255, 159, 10, 0.18)' : 'rgba(255, 255, 255, 0.03)';
  ctx.strokeStyle = rfActive ? 'rgba(255, 159, 10, 0.8)' : 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.ellipse(cx + 150, cy, 10, 30, -Math.PI / 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Draw RF waves crossing the bore
  if (rfActive) {
    ctx.strokeStyle = `rgba(255, 159, 10, ${0.2 + 0.3 * Math.sin(phi * 4.5)})`;
    ctx.lineWidth = 1.2;
    const amplitude = 10 * (state.rfAmplitude / 0.5);
    for (let offset = -20; offset <= 20; offset += 20) {
      ctx.beginPath();
      for (let x = cx - 150; x <= cx + 150; x += 5) {
        const y = cy + offset + Math.sin((x - cx) * 0.07 + phi * 5) * amplitude;
        if (x === cx - 150) ctx.moveTo(x, y);else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // Draw 3D isometric grid of precessing spins
  const N = 5;
  const sX = 20; // 3D X-axis scaling
  const sY = 20; // 3D Y-axis scaling
  const sZ = 38; // 3D Z-axis scaling (vertical height)

  // Isometric projection mapping: converts 3D spins to 2D screen coordinates
  const project = (bx, by, x3d, y3d, z3d) => {
    const aX = Math.PI / 6; // 30 deg axis
    const aY = 5.0 * Math.PI / 6; // 150 deg axis
    const px = bx + x3d * sX * Math.cos(aX) + y3d * sY * Math.cos(aY);
    const py = by + x3d * sX * Math.sin(aX) + y3d * sY * Math.sin(aY) - z3d * sZ;
    return {
      x: px,
      y: py
    };
  };

  // Draw spins back-to-front (depth sorted)
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const spin = state.spins[r * N + c];
      const xGrid = r - 2;
      const yGrid = c - 2;

      // Base center of this spin on screen
      const baseX = cx + (xGrid - yGrid) * 32;
      const baseY = cy + (xGrid + yGrid) * 16 + 10;

      // Draw spin base transverse plane ellipse
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, sX * 0.8, sY * 0.4, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // Project arrow tip
      const tip = project(baseX, baseY, spin.x, spin.y, spin.z);

      // Interpolate arrow color based on transverse vs longitudinal magnitude
      const mxy = Math.sqrt(spin.x * spin.x + spin.y * spin.y);
      // Spin-up equilibrium is Red (#ff375f), flipped transverse is Cyan (#0a84ff)
      const red = Math.round(255 - mxy * 245);
      const green = Math.round(55 + mxy * 77);
      const blue = Math.round(95 + mxy * 160);
      const color = `rgb(${red}, ${green}, ${blue})`;

      // Draw arrow shaft
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();

      // Draw arrowhead pointing along 3D orientation
      const dx = tip.x - baseX;
      const dy = tip.y - baseY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 2) {
        const ux = dx / len;
        const uy = dy / len;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tip.x - ux * 5 + uy * 2, tip.y - uy * 5 - ux * 2);
        ctx.lineTo(tip.x - ux * 5 - uy * 2, tip.y - uy * 5 + ux * 2);
        ctx.fill();
      }
    }
  }

  // Draw scanner bore front opening (lays on top for 3D overlay)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 20, 180, 85, 0, 0, 2 * Math.PI);
  ctx.stroke();

  // Bore rim detail lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 175, 82, 0, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}
function drawMacroCanvas(canvas, state, rfActive, phi) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = 55;

  // Draw sphere wireframe outer circle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw Z-axis (B0 direction)
  ctx.strokeStyle = 'rgba(191, 90, 242, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 5);
  ctx.lineTo(cx, cy + radius + 5);
  ctx.stroke();

  // Z-axis Arrow head
  ctx.fillStyle = 'rgba(191, 90, 242, 0.5)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 8);
  ctx.lineTo(cx - 3, cy - radius - 2);
  ctx.lineTo(cx + 3, cy - radius - 2);
  ctx.fill();

  // Label B0
  ctx.fillStyle = '#bf5af2';
  ctx.font = '10px monospace';
  ctx.fillText('B₀', cx + 6, cy - radius);

  // Draw transverse XY-plane ellipse
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, 2 * Math.PI);
  ctx.stroke();

  // Project function for Bloch sphere
  const projectSphere = (x3d, y3d, z3d) => {
    const aX = Math.PI / 6;
    const aY = 5.0 * Math.PI / 6;
    const px = cx + x3d * radius * Math.cos(aX) + y3d * radius * Math.cos(aY);
    const py = cy + x3d * radius * Math.sin(aX) + y3d * radius * Math.sin(aY) - z3d * radius;
    return {
      x: px,
      y: py
    };
  };
  const macro = state.macroSpin;
  const mxy = Math.sqrt(macro.x * macro.x + macro.y * macro.y);

  // Draw precession circular envelope at current Mz height
  if (mxy > 0.03) {
    ctx.strokeStyle = 'rgba(10, 132, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    for (let a = 0; a <= 2 * Math.PI + 0.1; a += 0.1) {
      const pt = projectSphere(mxy * Math.cos(a), mxy * Math.sin(a), macro.z);
      if (a === 0) ctx.moveTo(pt.x, pt.y);else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw rotating RF field B1 vector (lies in XY-plane, z = 0)
  if (rfActive) {
    const ptB1 = projectSphere(0.7 * Math.cos(phi), 0.7 * Math.sin(phi), 0);
    ctx.strokeStyle = '#ff9f0a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ptB1.x, ptB1.y);
    ctx.stroke();

    // B1 Arrowhead
    const dxB1 = ptB1.x - cx;
    const dyB1 = ptB1.y - cy;
    const lenB1 = Math.sqrt(dxB1 * dxB1 + dyB1 * dyB1);
    if (lenB1 > 0) {
      const ux = dxB1 / lenB1;
      const uy = dyB1 / lenB1;
      ctx.fillStyle = '#ff9f0a';
      ctx.beginPath();
      ctx.moveTo(ptB1.x, ptB1.y);
      ctx.lineTo(ptB1.x - ux * 4 + uy * 2, ptB1.y - uy * 4 - ux * 2);
      ctx.lineTo(ptB1.x - ux * 4 - uy * 2, ptB1.y - uy * 4 + ux * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ff9f0a';
    ctx.font = '9px monospace';
    ctx.fillText('B₁', ptB1.x + 5, ptB1.y + 2);
  }

  // Draw macro spin magnetization vector M
  const tip = projectSphere(macro.x, macro.y, macro.z);
  const red = Math.round(255 - mxy * 245);
  const green = Math.round(55 + mxy * 77);
  const blue = Math.round(95 + mxy * 160);
  const color = `rgb(${red}, ${green}, ${blue})`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();

  // Magnetization Arrowhead
  const dx = tip.x - cx;
  const dy = tip.y - cy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 2) {
    const ux = dx / len;
    const uy = dy / len;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - ux * 7 + uy * 3, tip.y - uy * 7 - ux * 3);
    ctx.lineTo(tip.x - ux * 7 - uy * 3, tip.y - uy * 7 + ux * 3);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('M', tip.x + 5, tip.y - 3);
  ctx.restore();
}
function drawGraphCanvas(canvas, state) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // Oscilloscope screen background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);

  // Draw grid lines
  ctx.strokeStyle = '#14141e';
  ctx.lineWidth = 1;
  const rows = 4;
  const cols = 8;
  for (let r = 1; r < rows; r++) {
    const y = height / rows * r;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let c = 1; c < cols; c++) {
    const x = width / cols * c;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  const history = state.graphHistory;
  if (history.length < 2) {
    ctx.restore();
    return;
  }
  const midY = height / 2;
  const rfScale = height * 0.22;
  const fidScale = height * 0.38;

  // Draw RF pulse regions (translucent yellow background bars)
  ctx.fillStyle = 'rgba(255, 159, 10, 0.04)';
  let inPulseRegion = false;
  let regionStartIdx = 0;
  for (let i = 0; i < history.length; i++) {
    const active = Math.abs(history[i].rf) > 0.005;
    if (active && !inPulseRegion) {
      inPulseRegion = true;
      regionStartIdx = i;
    } else if (!active && inPulseRegion) {
      inPulseRegion = false;
      const xStart = width / 500 * regionStartIdx;
      const xEnd = width / 500 * i;
      ctx.fillRect(xStart, 0, xEnd - xStart, height);
      ctx.strokeStyle = 'rgba(255, 159, 10, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xStart, 0);
      ctx.lineTo(xStart, height);
      ctx.moveTo(xEnd, 0);
      ctx.lineTo(xEnd, height);
      ctx.stroke();
    }
  }
  if (inPulseRegion) {
    const xStart = width / 500 * regionStartIdx;
    ctx.fillRect(xStart, 0, width - xStart, height);
  }

  // Plot RF Transmit Trace (Orange)
  ctx.strokeStyle = '#ff9f0a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  let rfStarted = false;
  for (let i = 0; i < history.length; i++) {
    const x = width / 500 * i;
    const y = midY - history[i].rf * rfScale;
    if (!rfStarted) {
      ctx.moveTo(x, y);
      rfStarted = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Plot FID / Spin Echo Signal Trace (Neon Blue)
  ctx.strokeStyle = '#0a84ff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  let fidStarted = false;
  for (let i = 0; i < history.length; i++) {
    const x = width / 500 * i;
    const y = midY - history[i].fid * fidScale;
    if (!fidStarted) {
      ctx.moveTo(x, y);
      fidStarted = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Labels & Legends overlay
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText('FID / Receiver Signal (Mx)', 10, 16);
  ctx.fillStyle = '#ff9f0a';
  ctx.fillText('RF Transmit', width - 85, 16);
  ctx.restore();
}
const CustomSimplifiedMRIInner = () => {
  // --- React State for Sliders & UI Controls ---
  const [B0, setB0] = useState(1.5); // Tesla (0.5 to 3.0)
  const [inhomogeneity, setInhomogeneity] = useState(1.5); // % (0.0 to 5.0)
  const [rfFrequency, setRfFrequency] = useState(63.87); // MHz (10 to 140)
  const [rfAmplitude, setRfAmplitude] = useState(0.2); // Tesla (0.05 to 0.5)
  const [T1, setT1] = useState(1000); // ms (200 to 3000)
  const [T2, setT2] = useState(100); // ms (20 to 500)
  const [tissuePreset, setTissuePreset] = useState('custom');
  const [isPaused] = useState(false);
  const [activeTab, setActiveTab] = useState('how-to');

  // --- Refs for Canvas Elements & Animation State ---
  const gridCanvasRef = useRef(null);
  const macroCanvasRef = useRef(null);
  const graphCanvasRef = useRef(null);

  // DOM refs to update metrics at 60fps without React re-render lags
  const mxyTextRef = useRef(null);
  const mzTextRef = useRef(null);
  const statusTextRef = useRef(null);
  const larmorTextRef = useRef(null);

  // Simulation physics state stored in Ref to prevent useState thashing
  const simStateRef = useRef({
    spins: [],
    macroSpin: {
      x: 0,
      y: 0,
      z: 1
    },
    graphHistory: [],
    rfPhase: 0,
    rfPulseTimeRemaining: 0,
    rfPulseDuration: 0,
    rfPulseActive: false,
    rfPulseType: null,
    // 90 or 180
    manualRFActive: false,
    elapsedTime: 0,
    netMx: 0,
    netMy: 0,
    netMz: 1,
    // Physics parameters synced from React state
    B0: 1.5,
    inhomogeneity: 0.015,
    rfFrequency: 63.87,
    rfAmplitude: 0.2,
    T1: 1.0,
    // seconds
    T2: 0.1,
    // seconds
    isPaused: false
  });

  // --- Initializing Spin Grid ---
  // A 5x5 grid (25 spins) is simulated inside the bore.
  // Each spin gets a spatial inhomogeneity factor based on its grid position.
  const createSpins = useCallback(() => {
    const spins = [];
    const N = 5;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const xGrid = r - 2;
        const yGrid = c - 2;
        // Spatial magnetic gradient + pseudorandom local variations
        const gradient = xGrid / 2.0 * 0.4 + yGrid / 2.0 * 0.3;
        const noise = Math.sin(r * 1.9 + c * 3.1) * 0.3;
        const factor = Math.max(-1, Math.min(1, gradient + noise));
        spins.push({
          r,
          c,
          xGrid,
          yGrid,
          inhomogeneityFactor: factor,
          x: 0,
          y: 0,
          z: 1 // Initially fully aligned with B0 field along +Z
        });
      }
    }
    return spins;
  }, []);

  // --- Actions & RF Pulse Triggers ---
  const resetSimulation = () => {
    const state = simStateRef.current;
    state.spins.forEach(s => {
      s.x = 0;
      s.y = 0;
      s.z = 1;
    });
    state.macroSpin = {
      x: 0,
      y: 0,
      z: 1
    };
    state.graphHistory = [];
    state.rfPhase = 0;
    state.rfPulseTimeRemaining = 0;
    state.rfPulseDuration = 0;
    state.rfPulseActive = false;
    state.rfPulseType = null;
    state.manualRFActive = false;
    state.elapsedTime = 0;
    state.netMx = 0;
    state.netMy = 0;
    state.netMz = 1;
  };
  const snapToResonance = () => {
    const f0 = parseFloat((42.58 * B0).toFixed(2));
    setRfFrequency(f0);
  };

  // Initialize once on mount
  useEffect(() => {
    const state = simStateRef.current;
    state.spins = createSpins();
    resetSimulation();
  }, [createSpins]);

  // Synchronize React state sliders to the simulation loop refs
  useEffect(() => {
    const state = simStateRef.current;
    state.B0 = B0;
    state.inhomogeneity = inhomogeneity / 100.0;
    state.rfFrequency = rfFrequency;
    state.rfAmplitude = rfAmplitude;
    state.T1 = T1 / 1000.0;
    state.T2 = T2 / 1000.0;
    state.isPaused = isPaused;
  }, [B0, inhomogeneity, rfFrequency, rfAmplitude, T1, T2, isPaused]);

  // Sync Larmor frequency text on B0 slider change
  useEffect(() => {
    if (larmorTextRef.current) {
      const f0 = (42.58 * B0).toFixed(2);
      larmorTextRef.current.innerText = `${f0} MHz`;
    }
  }, [B0]);

  // --- Preset Selection ---
  const handlePresetChange = presetKey => {
    setTissuePreset(presetKey);
    if (presetKey !== 'custom') {
      const val = TISSUE_PRESETS[presetKey];
      setT1(val.T1);
      // Ensure T2 doesn't exceed T1
      const safeT2 = Math.min(val.T2, val.T1);
      setT2(safeT2);
    }
  };
  const handleT1SliderChange = e => {
    const val = parseInt(e.target.value, 10);
    setT1(val);
    setTissuePreset('custom');
    if (T2 > val) {
      setT2(val);
    }
  };
  const handleT2SliderChange = e => {
    const val = parseInt(e.target.value, 10);
    const safeVal = Math.min(val, T1);
    setT2(safeVal);
    setTissuePreset('custom');
  };
  const send90Pulse = () => {
    snapToResonance();
    const state = simStateRef.current;
    // Tipping angle: alpha = gamma * B1 * duration.
    // For 90 deg (pi/2 rad): duration = pi / (2 * gamma * B1)
    const duration = Math.PI / (2.0 * GAMMA_SIM * rfAmplitude);
    state.rfPulseTimeRemaining = duration;
    state.rfPulseDuration = duration;
    state.rfPulseActive = true;
    state.rfPulseType = 90;
    state.rfPhase = 0; // Lock initial RF phase for aligned tipping
  };
  const send180Pulse = () => {
    snapToResonance();
    const state = simStateRef.current;
    // For 180 deg (pi rad): duration = pi / (gamma * B1)
    const duration = Math.PI / (GAMMA_SIM * rfAmplitude);
    state.rfPulseTimeRemaining = duration;
    state.rfPulseDuration = duration;
    state.rfPulseActive = true;
    state.rfPulseType = 180;
    state.rfPhase = 0;
  };
  const triggerInstant180 = () => {
    const state = simStateRef.current;
    // Invert the transverse phases (y -> -y) and invert longitudinal spins (z -> -z)
    // to simulate a perfect instant 180 degree pulse around X-axis.
    state.spins.forEach(s => {
      s.y = -s.y;
      s.z = -s.z;
    });
    state.macroSpin.y = -state.macroSpin.y;
    state.macroSpin.z = -state.macroSpin.z;
  };

  // --- Main Animation Loop ---
  useEffect(() => {
    let frameId;
    let lastTime = performance.now();
    const resizeCanvas = (canvas, w, h) => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.style.width !== `${w}px` || canvas.style.height !== `${h}px`) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
    };
    const loop = time => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(loop);
      return;
    }
      const dt = Math.min((time - lastTime) / 1000.0, 0.1); // Cap delta to prevent Euler explosion
      lastTime = time;
      const state = simStateRef.current;

      // Handle dynamic canvas resizing to fit parent panels sharp on high-DPI
      if (gridCanvasRef.current) {
        const parent = gridCanvasRef.current.parentElement;
        resizeCanvas(gridCanvasRef.current, parent.clientWidth, parent.clientHeight - 40);
      }
      if (macroCanvasRef.current) {
        const parent = macroCanvasRef.current.parentElement;
        resizeCanvas(macroCanvasRef.current, parent.clientWidth, parent.clientHeight - 40);
      }
      if (graphCanvasRef.current) {
        const parent = graphCanvasRef.current.parentElement;
        resizeCanvas(graphCanvasRef.current, parent.clientWidth, parent.clientHeight - 40);
      }

      // Physics integration step
      let rfActive = false;
      let phi = state.rfPhase;
      if (!state.isPaused) {
        state.elapsedTime += dt;

        // Determine if RF Transmitter is active
        if (state.rfPulseTimeRemaining > 0) {
          rfActive = true;
          state.rfPulseTimeRemaining -= dt;
          if (state.rfPulseTimeRemaining <= 0) {
            state.rfPulseActive = false;
            state.rfPulseType = null;
          }
          // Force RF transmitter to resonant frequency during auto pulse
          const resonanceFreqSim = GAMMA_SIM * state.B0;
          state.rfPhase += resonanceFreqSim * dt;
        } else if (state.manualRFActive) {
          rfActive = true;
          const userFreqSim = GAMMA_SIM * (state.rfFrequency / 42.58);
          state.rfPhase += userFreqSim * dt;
        } else {
          // RF transmitter keeps running visually but without field emission
          const userFreqSim = GAMMA_SIM * (state.rfFrequency / 42.58);
          state.rfPhase += userFreqSim * dt;
        }
        state.rfPhase = state.rfPhase % (2 * Math.PI);
        phi = state.rfPhase;
        const B1_field = rfActive ? state.rfAmplitude : 0;

        // 1. Update Macro Spin (ideal spin experiencing zero inhomogeneity)
        let {
          x: mx,
          y: my,
          z: mz
        } = state.macroSpin;

        // Precession around static Z-field B0
        const w0Macro = GAMMA_SIM * state.B0;
        const dThMacro = w0Macro * dt;
        const cosM = Math.cos(dThMacro);
        const sinM = Math.sin(dThMacro);
        let mxTemp = mx * cosM - my * sinM;
        let myTemp = mx * sinM + my * cosM;
        mx = mxTemp;
        my = myTemp;

        // RF Tipping torque (Rotate around RF vector in XY plane by angle gamma * B1 * dt)
        if (B1_field > 0) {
          const dBeta = GAMMA_SIM * B1_field * dt;
          const cosP = Math.cos(phi);
          const sinP = Math.sin(phi);

          // Rotate to align rotating RF field axis with X
          const x1 = mx * cosP + my * sinP;
          const y1 = -mx * sinP + my * cosP;
          const z1 = mz;

          // Rotate around X-axis by dBeta
          const x2 = x1;
          const y2 = y1 * Math.cos(dBeta) - z1 * Math.sin(dBeta);
          const z2 = y1 * Math.sin(dBeta) + z1 * Math.cos(dBeta);

          // Rotate back to lab frame
          mx = x2 * cosP - y2 * sinP;
          my = x2 * sinP + y2 * cosP;
          mz = z2;
        }

        // Apply T1 & T2 relaxations
        mx *= Math.exp(-dt / state.T2);
        my *= Math.exp(-dt / state.T2);
        mz = 1.0 - (1.0 - mz) * Math.exp(-dt / state.T1);

        // Clamping to unit sphere limit
        const magM = Math.sqrt(mx * mx + my * my + mz * mz);
        if (magM > 1.0) {
          mx /= magM;
          my /= magM;
          mz /= magM;
        }
        state.macroSpin = {
          x: mx,
          y: my,
          z: mz
        };

        // 2. Update Grid Proton Spins (inhomogeneous ensemble)
        let netMx = 0;
        let netMy = 0;
        let netMz = 0;
        state.spins.forEach(spin => {
          let {
            x: sx,
            y: sy,
            z: sz
          } = spin;

          // Precession around local inhomogeneous B0 field
          const localB0 = state.B0 * (1.0 + state.inhomogeneity * spin.inhomogeneityFactor);
          const w0Local = GAMMA_SIM * localB0;
          const dThLocal = w0Local * dt;
          const cosL = Math.cos(dThLocal);
          const sinL = Math.sin(dThLocal);
          const sxTemp = sx * cosL - sy * sinL;
          const syTemp = sx * sinL + sy * cosL;
          sx = sxTemp;
          sy = syTemp;

          // RF tipping torque
          if (B1_field > 0) {
            const dBeta = GAMMA_SIM * B1_field * dt;
            const cosP = Math.cos(phi);
            const sinP = Math.sin(phi);
            const x1 = sx * cosP + sy * sinP;
            const y1 = -sx * sinP + sy * cosP;
            const z1 = sz;
            const x2 = x1;
            const y2 = y1 * Math.cos(dBeta) - z1 * Math.sin(dBeta);
            const z2 = y1 * Math.sin(dBeta) + z1 * Math.cos(dBeta);
            sx = x2 * cosP - y2 * sinP;
            sy = x2 * sinP + y2 * cosP;
            sz = z2;
          }

          // Relaxations
          sx *= Math.exp(-dt / state.T2);
          sy *= Math.exp(-dt / state.T2);
          sz = 1.0 - (1.0 - sz) * Math.exp(-dt / state.T1);

          // Clamping
          const mag = Math.sqrt(sx * sx + sy * sy + sz * sz);
          if (mag > 1.0) {
            sx /= mag;
            sy /= mag;
            sz /= mag;
          }
          spin.x = sx;
          spin.y = sy;
          spin.z = sz;
          netMx += sx;
          netMy += sy;
          netMz += sz;
        });

        // Compute average magnetization components of the ensemble
        const count = state.spins.length;
        state.netMx = netMx / count;
        state.netMy = netMy / count;
        state.netMz = netMz / count;

        // Push oscilloscope traces to scrolling history
        // RF trace uses the transmitter X-component, FID trace is the net ensemble Mx signal
        state.graphHistory.push({
          rf: rfActive ? B1_field * Math.cos(phi) : 0,
          fid: state.netMx,
          time: state.elapsedTime
        });
        if (state.graphHistory.length > 500) {
          state.graphHistory.shift();
        }

        // Live text metrics updates without useState trigger
        const netMxyVal = Math.sqrt(state.netMx * state.netMx + state.netMy * state.netMy);
        if (mxyTextRef.current) {
          mxyTextRef.current.innerText = `${(netMxyVal * 100).toFixed(1)}%`;
        }
        if (mzTextRef.current) {
          mzTextRef.current.innerText = `${(state.netMz * 100).toFixed(1)}%`;
        }
        if (statusTextRef.current) {
          let statusStr = "State: Thermal Equilibrium (B₀ only)";
          if (state.rfPulseActive || state.manualRFActive) {
            statusStr = `State: RF Pulse Active (${state.rfPulseType ? state.rfPulseType + '° Auto' : 'Manual'})`;
          } else if (netMxyVal > 0.05) {
            if (state.inhomogeneity > 0) {
              statusStr = "State: Free Induction Decay (T₂* Dephasing)";
            } else {
              statusStr = "State: Transverse Precession (T₂ Decay)";
            }
          } else if (state.netMz < 0.95) {
            statusStr = "State: T₁ Longitudinal Recovery";
          }
          statusTextRef.current.innerText = statusStr;
        }
      }

      // Draw all visual displays
      drawGridCanvas(gridCanvasRef.current, state, rfActive, phi);
      drawMacroCanvas(macroCanvasRef.current, state, rfActive, phi);
      drawGraphCanvas(graphCanvasRef.current, state);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);
  return <div className="mri-sim-container">
      {/* Dynamic inline styles for glassmorphism and responsiveness */}
      <style dangerouslySetInnerHTML={{
      __html: `
        .mri-sim-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background: #0a0a1a;
          color: #f5f5f7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow: hidden;
          position: relative;
        }

        .mri-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .mri-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mri-back-btn:hover {
          background: rgba(255, 55, 95, 0.85);
          border-color: #ff375f;
        }

        .mri-header-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #fff;
        }

        .mri-header-actions {
          display: flex;
          gap: 10px;
        }

        .mri-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mri-action-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .mri-action-btn.active-pause {
          background: rgba(10, 132, 255, 0.2);
          border-color: #0a84ff;
        }

        .mri-workspace {
          display: flex;
          flex: 1;
          min-height: 0;
          padding: 90px 20px 20px 20px;
          gap: 16px;
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          .mri-workspace {
            flex-direction: column;
            overflow-y: auto;
          }
        }

        .mri-console {
          width: 320px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          padding-right: 4px;
        }

        @media (max-width: 1024px) {
          .mri-console {
            width: 100%;
          }
        }

        .mri-card {
          background: rgba(20, 20, 30, 0.8);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .mri-card-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mri-slider-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .mri-slider-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
        }

        .mri-slider-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          margin-top: -4px;
        }

        .mri-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          outline: none;
        }

        .mri-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: #bf5af2;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .mri-slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }

        .mri-slider.rf::-webkit-slider-thumb {
          background: #ff9f0a;
        }

        .mri-presets {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .mri-preset-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          padding: 8px;
          border-radius: 8px;
          font-size: 11px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
        }

        .mri-preset-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .mri-preset-btn.active {
          background: rgba(191, 90, 242, 0.15);
          border-color: #bf5af2;
          color: #fff;
        }

        .mri-pulse-btns {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mri-pulse-btn {
          background: rgba(255, 159, 10, 0.12);
          border: 1px solid rgba(255, 159, 10, 0.3);
          color: #ff9f0a;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .mri-pulse-btn:hover {
          background: rgba(255, 159, 10, 0.22);
        }

        .mri-pulse-btn.refocus {
          background: rgba(10, 132, 255, 0.12);
          border-color: rgba(10, 132, 255, 0.3);
          color: #0a84ff;
        }

        .mri-pulse-btn.refocus:hover {
          background: rgba(10, 132, 255, 0.22);
        }

        .mri-transmit-btn {
          background: #ff9f0a;
          color: #000;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          user-select: none;
          transition: opacity 0.2s;
        }

        .mri-transmit-btn:active {
          opacity: 0.8;
        }

        .mri-displays {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
          min-height: 0;
        }

        .mri-main-visualizer {
          flex: 1.2;
          min-height: 250px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .mri-viz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          background: rgba(255, 255, 255, 0.01);
        }

        .mri-viz-title {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .mri-metrics {
          display: flex;
          gap: 16px;
          font-size: 12px;
        }

        .mri-metric-val {
          font-weight: bold;
          font-family: monospace;
          margin-left: 4px;
        }

        .mri-lower-row {
          flex: 1;
          display: flex;
          gap: 16px;
          min-height: 180px;
        }

        @media (max-width: 768px) {
          .mri-lower-row {
            flex-direction: column;
            min-height: auto;
          }
        }

        .mri-bloch-card {
          width: 180px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .mri-bloch-card {
            width: 100%;
            height: 180px;
          }
        }

        .mri-graph-card {
          flex: 1;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .mri-academy {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px;
          margin: 0 16px 16px 16px;
        }

        .mri-tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 14px;
          gap: 4px;
        }

        .mri-tab-btn {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255, 255, 255, 0.5);
          padding: 8px 14px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mri-tab-btn:hover {
          color: rgba(255, 255, 255, 0.85);
        }

        .mri-tab-btn.active {
          color: #bf5af2;
          border-bottom-color: #bf5af2;
          font-weight: 500;
        }

        .mri-tab-pane {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.75);
        }

        .mri-tab-pane h3 {
          margin: 0 0 8px 0;
          color: #fff;
          font-size: 15px;
        }

        .mri-tab-pane p {
          margin: 0 0 10px 0;
        }

        .mri-tab-pane ul {
          margin: 0 0 10px 0;
          padding-left: 20px;
        }

        .mri-tab-pane li {
          margin-bottom: 4px;
        }
      `
    }} />

      {/* Top Banner Header */}
      

      {/* Main Simulation Area */}
      <div className="mri-workspace">
        
        {/* Left Control Column */}
        <aside className="mri-console">
          
          {/* Static B0 Field Controls */}
          <section className="mri-card">
            <h2 className="mri-card-title">
              <Sliders size={16} color="#bf5af2" /> Main Magnet Field (B₀)
            </h2>
            <div className="mri-slider-group">
              <div className="mri-slider-label">
                <span>Field Strength B₀</span>
                <span style={{
                color: '#bf5af2',
                fontWeight: 'bold'
              }}>{B0.toFixed(1)} Tesla</span>
              </div>
              <input type="range" min="0.5" max="3.0" step="0.1" value={B0} onChange={e => setB0(parseFloat(e.target.value))} className="mri-slider" />
              <span className="mri-slider-desc">
                Protons precess at Larmor Frequency (42.58 MHz/T × B₀) = <span ref={larmorTextRef} style={{
                color: '#bf5af2',
                fontWeight: 'bold'
              }} />
              </span>
            </div>

            <div className="mri-slider-group">
              <div className="mri-slider-label">
                <span>Field Inhomogeneity (ΔB₀)</span>
                <span style={{
                color: '#ff375f',
                fontWeight: 'bold'
              }}>{inhomogeneity.toFixed(1)}%</span>
              </div>
              <input type="range" min="0.0" max="5.0" step="0.1" value={inhomogeneity} onChange={e => setInhomogeneity(parseFloat(e.target.value))} className="mri-slider" />
              <span className="mri-slider-desc">
                Spatial field variations accelerate spin-spin dephasing (shorter T₂*).
              </span>
            </div>
          </section>

          {/* RF Transmitter Controls */}
          <section className="mri-card">
            <h2 className="mri-card-title">
              <Zap size={16} color="#ff9f0a" /> RF Transmitter
            </h2>
            
            <div className="mri-slider-group">
              <div className="mri-slider-label">
                <span>RF Frequency</span>
                <span style={{
                color: '#ff9f0a',
                fontWeight: 'bold'
              }}>{rfFrequency.toFixed(2)} MHz</span>
              </div>
              <input type="range" min="10" max="140" step="0.1" value={rfFrequency} onChange={e => setRfFrequency(parseFloat(e.target.value))} className="mri-slider rf" />
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2px'
            }}>
                <span className="mri-slider-desc">Frequency of the excitation pulses.</span>
                <button className="mri-preset-btn" onClick={snapToResonance} style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 159, 10, 0.1)',
                borderColor: 'rgba(255,159,10,0.3)',
                color: '#ff9f0a'
              }}>
                  Tune Resonance
                </button>
              </div>
            </div>

            <div className="mri-slider-group">
              <div className="mri-slider-label">
                <span>RF Wave Amplitude (B₁)</span>
                <span style={{
                color: '#ff9f0a',
                fontWeight: 'bold'
              }}>{rfAmplitude.toFixed(2)} T</span>
              </div>
              <input type="range" min="0.05" max="0.5" step="0.01" value={rfAmplitude} onChange={e => setRfAmplitude(parseFloat(e.target.value))} className="mri-slider rf" />
              <span className="mri-slider-desc">Tipping torque strength. Higher B₁ tips spins faster.</span>
            </div>

            <div className="mri-pulse-btns">
              <button className="mri-transmit-btn" onMouseDown={() => {
              simStateRef.current.manualRFActive = true;
            }} onMouseUp={() => {
              simStateRef.current.manualRFActive = false;
            }} onMouseLeave={() => {
              simStateRef.current.manualRFActive = false;
            }} onTouchStart={() => {
              simStateRef.current.manualRFActive = true;
            }} onTouchEnd={() => {
              simStateRef.current.manualRFActive = false;
            }}>
                <Zap size={14} fill="currentColor" /> Hold to Transmit RF
              </button>
              <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
                <button className="mri-pulse-btn" onClick={send90Pulse}>
                  90° Pulse
                </button>
                <button className="mri-pulse-btn" onClick={send180Pulse}>
                  180° Inversion
                </button>
              </div>
              <button className="mri-pulse-btn refocus" onClick={triggerInstant180}>
                <RefreshCw size={14} /> Instant 180° Refocus
              </button>
            </div>
          </section>

          {/* Relaxation Times (Tissue presets) */}
          <section className="mri-card">
            <h2 className="mri-card-title">
              <Activity size={16} color="#0a84ff" /> Tissue Properties
            </h2>

            <div className="mri-presets" style={{
            marginBottom: '14px'
          }}>
              {Object.keys(TISSUE_PRESETS).map(key => <button key={key} className={`mri-preset-btn ${tissuePreset === key ? 'active' : ''}`} onClick={() => handlePresetChange(key)}>
                  {TISSUE_PRESETS[key].name.split(' ')[0]}
                </button>)}
            </div>

            <div className="mri-slider-group">
              <div className="mri-slider-label">
                <span>T₁ (Longitudinal Recovery)</span>
                <span style={{
                color: '#0a84ff',
                fontWeight: 'bold'
              }}>{T1} ms</span>
              </div>
              <input type="range" min="200" max="3000" step="50" value={T1} onChange={handleT1SliderChange} className="mri-slider" />
              <span className="mri-slider-desc">Spin alignment recovery rate along B₀ direction.</span>
            </div>

            <div className="mri-slider-group">
              <div className="mri-slider-label">
                <span>T₂ (Transverse Decay)</span>
                <span style={{
                color: '#0a84ff',
                fontWeight: 'bold'
              }}>{T2} ms</span>
              </div>
              <input type="range" min="20" max="500" step="10" value={T2} onChange={handleT2SliderChange} className="mri-slider" />
              <span className="mri-slider-desc">Spin phase decay rate in transverse XY plane.</span>
            </div>
          </section>

        </aside>

        {/* Right Viewport Displays */}
        <main className="mri-displays">
          
          {/* Grid visualizer */}
          <div className="mri-main-visualizer">
            <div className="mri-viz-header">
              <span className="mri-viz-title" ref={statusTextRef}>State: Idle</span>
              <div className="mri-metrics">
                <span>Transverse (Mxy): <span ref={mxyTextRef} className="mri-metric-val" style={{
                  color: '#0a84ff'
                }}>0.0%</span></span>
                <span>Longitudinal (Mz): <span ref={mzTextRef} className="mri-metric-val" style={{
                  color: '#ff375f'
                }}>100.0%</span></span>
              </div>
            </div>
            <canvas ref={gridCanvasRef} style={{
            display: 'block',
            flex: 1
          }} />
          </div>

          {/* Lower Displays row: Bloch sphere + oscilloscope */}
          <div className="mri-lower-row">
            
            {/* Single Proton Bloch Sphere */}
            <div className="mri-bloch-card">
              <div className="mri-viz-header" style={{
              padding: '6px 10px'
            }}>
                <span className="mri-viz-title" style={{
                fontSize: '11px'
              }}>Bloch Sphere (Macro Spin)</span>
              </div>
              <canvas ref={macroCanvasRef} style={{
              display: 'block',
              flex: 1
            }} />
            </div>

            {/* Scope Graph */}
            <div className="mri-graph-card">
              <div className="mri-viz-header" style={{
              padding: '6px 10px'
            }}>
                <span className="mri-viz-title" style={{
                fontSize: '11px'
              }}>Live Signal Scope (RF Pulse & Received FID/Echo)</span>
              </div>
              <canvas ref={graphCanvasRef} style={{
              display: 'block',
              flex: 1
            }} />
            </div>

          </div>

        </main>

      </div>

      {/* Physics Academy section */}
      <footer className="mri-academy">
        <nav className="mri-tabs">
          <button className={`mri-tab-btn ${activeTab === 'how-to' ? 'active' : ''}`} onClick={() => setActiveTab('how-to')}>
            How-To Guide
          </button>
          <button className={`mri-tab-btn ${activeTab === 'precession' ? 'active' : ''}`} onClick={() => setActiveTab('precession')}>
            Larmor Precession
          </button>
          <button className={`mri-tab-btn ${activeTab === 'relaxation' ? 'active' : ''}`} onClick={() => setActiveTab('relaxation')}>
            T₁ & T₂ Relaxation
          </button>
          <button className={`mri-tab-btn ${activeTab === 'echo' ? 'active' : ''}`} onClick={() => setActiveTab('echo')}>
            The Spin Echo
          </button>
        </nav>

        <div className="mri-tab-pane">
          {activeTab === 'how-to' && <div>
              <h3>How to Operate the Simulator</h3>
              <p>Follow these steps to observe core MRI physical phenomena:</p>
              <ul>
                <li><strong>Step 1: Excitation</strong>. Choose a tissue preset (e.g. Brain CSF) or custom settings, then click the <strong>90° Pulse</strong> button. The RF Transmitter will emit radio waves at the Larmor frequency, tipping the spins from longitudinal (+Z, red) to transverse (XY plane, blue). The scope will show the RF pulse (yellow) and the resulting Free Induction Decay (FID) signal (blue).</li>
                <li><strong>Step 2: Dephasing</strong>. Set the <strong>Field Inhomogeneity</strong> slider to 1.5% or higher. Notice how after the 90° excitation, the grid spins begin to separate/spread in their precession phase. This phase coherence loss causes the net transverse magnetization (Mxy) to decay rapidly, reducing the FID signal.</li>
                <li><strong>Step 3: Refocusing</strong>. While the spins are dephasing, click the <strong>Instant 180° Refocus</strong> or the <strong>180° Inversion</strong> button. Watch the spins rotate/flip. The faster spins are placed behind the slower spins, and as precession continues, they refocus together. A peak (the <strong>Spin Echo</strong>) will appear on the oscilloscope at double the delay time!</li>
              </ul>
            </div>}

          {activeTab === 'precession' && <div>
              <h3>Larmor Precession & Resonance</h3>
              <p>Hydrogen protons (¹H nuclei) possess spin and an associated magnetic moment. In the main magnetic field B₀, they precess around the field axis at a specific rate called the Larmor frequency:</p>
              <p style={{
            fontFamily: 'monospace',
            background: 'rgba(255,255,255,0.03)',
            padding: '6px 12px',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
                f₀ = γ · B₀ / (2·π) &nbsp; &nbsp; [γ / 2π = 42.58 MHz / Tesla for Hydrogen]
              </p>
              <p>This means in a 1.5 Tesla scanner, protons precess at exactly 63.87 MHz. Tipping them requires an alternating RF magnetic field (B₁) rotating in-phase with the precession (Resonance). If your RF frequency is off-resonance (try tuning the transmitter frequency manually away from Larmor), the tipping torque cancels out and no excitation occurs.</p>
            </div>}

          {activeTab === 'relaxation' && <div>
              <h3>T₁ Longitudinal Recovery & T₂ Transverse Decay</h3>
              <p>After the RF pulse is turned off, the spin system returns to its original thermodynamic state via two processes:</p>
              <ul>
                <li><strong>T₁ (Spin-Lattice Relaxation):</strong> The spins transfer energy to their surrounding grid lattice. The longitudinal magnetization Mz recovers exponentially back to 100% along the +Z axis. This is characterized by time constant T₁ (e.g., CSF has a long T₁ of 2.8s; fat has a short T₁ of 600ms).</li>
                <li><strong>T₂ (Spin-Spin Relaxation):</strong> The spins interact with each other's magnetic fields, causing them to phase-drift (dephase). The transverse magnetization Mxy decays exponentially with time constant T₂.</li>
                <li><strong>T₂* (Effective Transverse Decay):</strong> In real-life magnets, field inhomogeneities (ΔB₀) accelerate this dephasing. The signal decays much faster with time constant T₂* (where 1/T₂* = 1/T₂ + γ·ΔB₀).</li>
              </ul>
            </div>}

          {activeTab === 'echo' && <div>
              <h3>The Spin Echo Effect (Erwin Hahn, 1950)</h3>
              <p>The rapid signal decay caused by spatial field inhomogeneity (ΔB₀) can be reversed because it is a deterministic process (each spin precesses faster or slower based on its static position in space).</p>
              <p>Applying a 180° RF pulse at time τ after the initial 90° pulse flips the spins in the XY plane. This places the spins that were precessing faster (which had moved ahead in phase) behind the slower ones. Since they continue precessing at their same local speeds, the faster ones catch up to the slower ones. At time 2τ, all spins re-align in phase, creating a momentary signal recovery peak called the <strong>Spin Echo</strong>.</p>
              <p>This refocusing removes the effects of static magnetic field inhomogeneities, allowing the true T₂ relaxation properties of tissue to be measured.</p>
            </div>}
        </div>
      </footer>
    </div>;
};
export default function CustomSimplifiedMRI({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden'
  }}>
            
            <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomSimplifiedMRIInner onBack={null} title={""} />
            </div>
        </div>;
}