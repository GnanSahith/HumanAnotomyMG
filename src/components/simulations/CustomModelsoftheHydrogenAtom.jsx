/**
 * CustomModelsoftheHydrogenAtom.jsx
 * 
 * A high-fidelity, interactive physics simulation of the Hydrogen Atom Models.
 * Emphasizing the transition between the historical Bohr Model and the modern
 * Schrödinger Wave Mechanics (Quantum Cloud Model).
 * 
 * ============================================================================
 * PHYSICS & MATHEMATICAL FORMULATION
 * ============================================================================
 * 
 * 1. ENERGY LEVELS OF THE HYDROGEN ATOM
 *    The energy levels of a hydrogenic atom are quantized and given by:
 *        E_n = -R_H / n^2
 *    Where:
 *        R_H = 13.6057 eV (Rydberg constant in electron-volts)
 *        n = Principal Quantum Number (1, 2, 3, 4, 5, 6, ...)
 * 
 *    Energy Differences (Transition Energies):
 *        Delta E = E_upper - E_lower = 13.6057 * (1 / n_lower^2 - 1 / n_upper^2) eV
 * 
 * 2. Wavelength-Energy Relationship
 *    The wavelength (lambda) of a photon absorbed or emitted during a transition
 *    is related to the energy difference by the Planck-Einstein relation:
 *        lambda = h * c / Delta E
 *    With hc approximated as:
 *        h * c = 1239.8419 eV * nm
 * 
 *    Key Lyman Series Transitions (from n_lower = 1):
 *        - n = 1 -> 2 : Delta E = 10.20 eV  => lambda = 121.57 nm  (Lyman alpha, UV)
 *        - n = 1 -> 3 : Delta E = 12.09 eV  => lambda = 102.57 nm  (Lyman beta, UV)
 *        - n = 1 -> 4 : Delta E = 12.75 eV  => lambda = 97.25 nm   (Lyman gamma, UV)
 *        - n = 1 -> 5 : Delta E = 13.06 eV  => lambda = 94.97 nm   (Lyman delta, UV)
 *        - n = 1 -> 6 : Delta E = 13.22 eV  => lambda = 93.78 nm   (Lyman epsilon, UV)
 * 
 *    Key Balmer Series Transitions (to n_lower = 2, emitted in visible range):
 *        - n = 3 -> 2 : Delta E = 1.89 eV   => lambda = 656.28 nm  (Balmer alpha, Red)
 *        - n = 4 -> 2 : Delta E = 2.55 eV   => lambda = 486.13 nm  (Balmer beta, Cyan)
 *        - n = 5 -> 2 : Delta E = 2.86 eV   => lambda = 434.05 nm  (Balmer gamma, Blue)
 *        - n = 6 -> 2 : Delta E = 3.02 eV   => lambda = 410.17 nm  (Balmer delta, Violet)
 * 
 * 3. QUANTUM WAVEFUNCTIONS (SCHRÖDINGER HYDROGEN ATOM)
 *    The spatial wavefunction of the electron in a hydrogen-like atom is:
 *        Psi_{n,l,m}(r, theta, phi) = R_{n,l}(r) * Y_l^m(theta, phi)
 *    Where:
 *        R_{n,l}(r) is the Radial Wavefunction (using Laguerre polynomials).
 *        Y_l^m(theta, phi) are the Spherical Harmonics.
 * 
 *    Radial Wavefunctions used in this simulation (scaled to Bohr radius a_0):
 *        - R_{1,0}(r) = 2 * exp(-r)
 *        - R_{2,0}(r) = (1 - r/2) * exp(-r/2) / sqrt(2)
 *        - R_{2,1}(r) = r * exp(-r/2) / (2 * sqrt(6))
 *        - R_{3,0}(r) = (27 - 18r + 2r^2) * exp(-r/3) / (27 * sqrt(3))
 *        - R_{3,1}(r) = r * (6 - r) * exp(-r/3) * (4 * sqrt(2) / 81)
 *        - R_{3,2}(r) = r^2 * exp(-r/3) * (4 / (81 * sqrt(30)))
 *        - R_{4,0}(r) = (96 - 72r + 12r^2 - r^3) * exp(-r/4) / 96
 *        - R_{4,1}(r) = r * (80 - 20r + r^2) * exp(-r/4) * (sqrt(5/3) / 128)
 *        - R_{4,2}(r) = r^2 * (12 - r) * exp(-r/4) / (768 * sqrt(5))
 *        - R_{4,3}(r) = r^3 * exp(-r/4) / (1536 * sqrt(35))
 * 
 *    Angular Wavefunctions (Spherical Harmonics projection for phi = 0):
 *        - l=0, m=0: 1.0
 *        - l=1, m=0: cos(theta)
 *        - l=1, m=1: sin(theta)
 *        - l=2, m=0: (3 * cos^2(theta) - 1) / 2
 *        - l=2, m=1: sin(theta) * cos(theta)
 *        - l=2, m=2: sin^2(theta)
 *        - l=3, m=0: (5 * cos^3(theta) - 3 * cos(theta)) / 2
 *        - l=3, m=1: sin(theta) * (5 * cos^2(theta) - 1)
 *        - l=3, m=2: sin^2(theta) * cos(theta)
 *        - l=3, m=3: sin^3(theta)
 * 
 * 4. SELECTION RULES
 *    Single-photon electric dipole transitions must obey the selection rules:
 *        Delta l = l_upper - l_lower = +/- 1
 *        Delta m = m_upper - m_lower = 0, +/- 1
 *    Thus, from the ground state 1s (l=0), the electron can only be excited
 *    to a state with l = 1 (p orbital).
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  HelpCircle, 
  Activity, 
  Sun, 
  Sliders, 
  Info, 
  BookOpen, 
  Layers,
  Sparkles
} from 'lucide-react';

// Transition energy and wavelength data
const TRANSITIONS = [
  { from: 1, to: 2, wl: 121.57, energy: 10.20, name: 'Lyman-α (UV)' },
  { from: 1, to: 3, wl: 102.57, energy: 12.09, name: 'Lyman-β (UV)' },
  { from: 1, to: 4, wl: 97.25, energy: 12.75, name: 'Lyman-γ (UV)' },
  { from: 1, to: 5, wl: 94.97, energy: 13.06, name: 'Lyman-δ (UV)' },
  { from: 1, to: 6, wl: 93.78, energy: 13.22, name: 'Lyman-ε (UV)' },
  { from: 3, to: 2, wl: 656.28, energy: 1.89, name: 'Balmer-α (Red)' },
  { from: 4, to: 2, wl: 486.13, energy: 2.55, name: 'Balmer-β (Cyan)' },
  { from: 5, to: 2, wl: 434.05, energy: 2.86, name: 'Balmer-γ (Blue)' },
  { from: 6, to: 2, wl: 410.17, energy: 3.02, name: 'Balmer-δ (Violet)' },
  { from: 4, to: 3, wl: 1875.1, energy: 0.66, name: 'Paschen-α (IR)' },
  { from: 5, to: 3, wl: 1281.8, energy: 0.97, name: 'Paschen-β (IR)' },
  { from: 6, to: 3, wl: 1093.8, energy: 1.13, name: 'Paschen-γ (IR)' }
];

// Helper to convert wavelength (nm) to RGB color string
const wavelengthToColor = (wl) => {
  if (wl < 380) {
    // UV: Deep Violet/Purple with lower opacity representation
    return 'rgba(168, 85, 247, 0.8)';
  }
  if (wl > 780) {
    // IR: Deep Red
    return 'rgba(239, 68, 68, 0.7)';
  }

  let r = 0, g = 0, b = 0;
  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380);
    g = 0.0;
    b = 1.0;
  } else if (wl >= 440 && wl < 490) {
    r = 0.0;
    g = (wl - 440) / (490 - 440);
    b = 1.0;
  } else if (wl >= 490 && wl < 510) {
    r = 0.0;
    g = 1.0;
    b = -(wl - 510) / (510 - 490);
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1.0;
    b = 0.0;
  } else if (wl >= 580 && wl < 645) {
    r = 1.0;
    g = -(wl - 645) / (645 - 580);
    b = 0.0;
  } else if (wl >= 645 && wl <= 780) {
    r = 1.0;
    g = 0.0;
    b = 0.0;
  }

  // Factor to fade out colors near visible limits (380nm and 780nm)
  let factor = 1.0;
  if (wl >= 380 && wl < 420) {
    factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
  } else if (wl > 700 && wl <= 780) {
    factor = 0.3 + 0.7 * (780 - wl) / (780 - 700);
  }

  const R = Math.round(r * factor * 255);
  const G = Math.round(g * factor * 255);
  const B = Math.round(b * factor * 255);

  return `rgb(${R}, ${G}, ${B})`;
};

// Physics Radial Wavefunction R(n, l, r) where r is in units of Bohr radius
function radialWavefunction(n, l, r) {
  if (n === 1) {
    return 2.0 * Math.exp(-r);
  } else if (n === 2) {
    if (l === 0) {
      return (1.0 - 0.5 * r) * Math.exp(-0.5 * r) / Math.sqrt(2);
    } else if (l === 1) {
      return r * Math.exp(-0.5 * r) / (2.0 * Math.sqrt(6));
    }
  } else if (n === 3) {
    if (l === 0) {
      return (27.0 - 18.0 * r + 2.0 * r * r) * Math.exp(-r / 3.0) / (27.0 * Math.sqrt(3));
    } else if (l === 1) {
      return r * (6.0 - r) * Math.exp(-r / 3.0) * (4.0 * Math.sqrt(2) / 81.0);
    } else if (l === 2) {
      return r * r * Math.exp(-r / 3.0) * (4.0 / (81.0 * Math.sqrt(30)));
    }
  } else if (n === 4) {
    if (l === 0) {
      return (96.0 - 72.0 * r + 12.0 * r * r - r * r * r) * Math.exp(-r / 4.0) / 96.0;
    } else if (l === 1) {
      return r * (80.0 - 20.0 * r + r * r) * Math.exp(-r / 4.0) * (Math.sqrt(5/3) / 128.0);
    } else if (l === 2) {
      return r * r * (12.0 - r) * Math.exp(-r / 4.0) / (768.0 * Math.sqrt(5));
    } else if (l === 3) {
      return r * r * r * Math.exp(-r / 4.0) / (1536.0 * Math.sqrt(35));
    }
  }
  return 0.0;
}

// Angular probability density |Y_l^m(theta, phi=0)|^2
function angularDensity(l, m, cosTheta, sinTheta) {
  const absM = Math.abs(m);
  if (l === 0) {
    return 1.0;
  } else if (l === 1) {
    if (absM === 0) return cosTheta * cosTheta * 3.0;
    if (absM === 1) return sinTheta * sinTheta * 1.5;
  } else if (l === 2) {
    if (absM === 0) return Math.pow(3.0 * cosTheta * cosTheta - 1.0, 2) * 1.25;
    if (absM === 1) return sinTheta * sinTheta * cosTheta * cosTheta * 7.5;
    if (absM === 2) return Math.pow(sinTheta, 4) * 1.875;
  } else if (l === 3) {
    if (absM === 0) return Math.pow(5.0 * Math.pow(cosTheta, 3) - 3.0 * cosTheta, 2) * 1.75;
    if (absM === 1) return sinTheta * sinTheta * Math.pow(5.0 * cosTheta * cosTheta - 1.0, 2) * 0.84375;
    if (absM === 2) return Math.pow(sinTheta, 4) * cosTheta * cosTheta * 13.125;
    if (absM === 3) return Math.pow(sinTheta, 6) * 1.09375;
  }
  return 1.0;
}

function CustomModelsoftheHydrogenAtomInner({ onBack, title }) {
  const [model, setModel] = useState('Bohr'); // 'Bohr' or 'Quantum'
  const [lightType, setLightType] = useState('White'); // 'White' or 'Monochromatic'
  const [wavelength, setWavelength] = useState(121.6); // 95 to 700 nm
  const [running, setRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 4x
  const [beamIntensity, setBeamIntensity] = useState(3); // 1 to 5
  const [activeTab, setActiveTab] = useState('Controls'); // 'Controls' | 'Theory' | 'Log'

  // Bohr model level (1 to 6)
  const [bohrLevel, setBohrLevel] = useState(1);
  // Quantum state numbers
  const [qN, setQN] = useState(1);
  const [qL, setQL] = useState(0);
  const [qM, setQM] = useState(0);

  // Spectrometer state
  const [spectrometerLogs, setSpectrometerLogs] = useState([]);
  const [spectrometerCounts, setSpectrometerCounts] = useState({});
  const [historyLog, setHistoryLog] = useState([]);

  // Refs for drawing and physics loop
  const canvasRef = useRef(null);
  const spectrometerCanvasRef = useRef(null);
  const loopRef = useRef(null);
  const stateRef = useRef({
    photons: [],         // incoming light beam photons
    emittedPhotons: [],  // emitted photons spreading outwards
    electronLevel: 1,    // n = 1 to 6 (tracks state inside the physics loop)
    excitedLifetime: 0,  // remaining frames before transition down
    electronAngle: 0,    // Bohr model electron position angle
    lastWavelength: 121.6,
    beamTimer: 0,
    quantumN: 1,
    quantumL: 0,
    quantumM: 0,
    flashIntensity: 0    // for absorption transition splash screen effect
  });

  // Sync React states to ref for loop access
  useEffect(() => {
    stateRef.current.electronLevel = bohrLevel;
  }, [bohrLevel]);

  useEffect(() => {
    stateRef.current.quantumN = qN;
    stateRef.current.quantumL = qL;
    stateRef.current.quantumM = qM;
  }, [qN, qL, qM]);

  useEffect(() => {
    stateRef.current.lastWavelength = wavelength;
  }, [wavelength]);

  // Log helper
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setHistoryLog(prev => [{ time: timestamp, msg: message }, ...prev].slice(0, 100));
  };

  // Helper to add lines to spectrometer
  const recordEmission = (wl) => {
    // Round to 1 decimal place
    const roundedWl = Math.round(wl * 10) / 10;
    setSpectrometerCounts(prev => ({
      ...prev,
      [roundedWl]: (prev[roundedWl] || 0) + 1
    }));
    setSpectrometerLogs(prev => [...prev, roundedWl].slice(-200));
  };

  // Preset button action
  const applyPreset = (wl) => {
    setLightType('Monochromatic');
    setWavelength(wl);
    addLog(`Light source set to monochromatic wavelength: ${wl} nm`);
  };

  // Clear spectrometer
  const clearSpectrometer = () => {
    setSpectrometerCounts({});
    setSpectrometerLogs([]);
    setHistoryLog([]);
    addLog('Spectrometer and simulation logs cleared.');
  };

  // Reset simulation state
  const resetSimulation = () => {
    setBohrLevel(1);
    setQN(1);
    setQL(0);
    setQM(0);
    stateRef.current.photons = [];
    stateRef.current.emittedPhotons = [];
    stateRef.current.excitedLifetime = 0;
    stateRef.current.flashIntensity = 0;
    clearSpectrometer();
    addLog('Simulation reset to ground state n=1.');
  };

  // Manual state controls
  const handleManualBohrLevel = (n) => {
    setBohrLevel(n);
    if (n > 1) {
      stateRef.current.excitedLifetime = 120 + Math.random() * 80;
    }
    addLog(`Manually set Bohr electron level to n=${n}`);
  };

  const handleManualQuantumState = (n, l, m) => {
    setQN(n);
    setQL(l);
    setQM(m);
    if (n > 1) {
      stateRef.current.excitedLifetime = 120 + Math.random() * 80;
    }
    addLog(`Manually set Quantum State to |${n}, ${l}, ${m}⟩`);
  };

  // Fire a single photon
  const fireSinglePhoton = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cy = canvas.height / 2;
    stateRef.current.photons.push({
      x: 30,
      y: cy + (Math.random() - 0.5) * 20,
      vx: 4 * simSpeed,
      vy: 0,
      wl: wavelength,
      color: wavelengthToColor(wavelength),
      absorbed: false
    });
    addLog(`Fired single ${wavelength} nm photon from source`);
  };

  // Trigger quantum wavefunction heatmap caching to improve performance
  const [heatmapCanvas, setHeatmapCanvas] = useState(null);
  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 300;
    offscreen.height = 300;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 300, 300);
    const scale = 25.0 / qN; // Scaling factor so orbitals fit nicely

    // 1. First find maximum probability density value on grid to normalize intensity
    let maxP = 0.0001;
    const step = 3;
    for (let x = -150; x <= 150; x += step) {
      for (let y = -150; y <= 150; y += step) {
        const r_val = Math.sqrt(x*x + y*y) / scale;
        if (r_val === 0) continue;
        const cosT = y / (r_val * scale);
        const sinT = x / (r_val * scale);
        const R = radialWavefunction(qN, qL, r_val);
        const A = angularDensity(qL, qM, cosT, sinT);
        const P = R * R * A;
        if (P > maxP) maxP = P;
      }
    }

    // 2. Draw density gradient to offscreen canvas
    const imgData = ctx.createImageData(300, 300);
    for (let py = 0; py < 300; py++) {
      const y = py - 150;
      for (let px = 0; px < 300; px++) {
        const x = px - 150;
        const r_val = Math.sqrt(x*x + y*y) / scale;
        
        let brightness = 0;
        if (r_val > 0) {
          const cosT = y / (r_val * scale);
          const sinT = x / (r_val * scale);
          const R = radialWavefunction(qN, qL, r_val);
          const A = angularDensity(qL, qM, cosT, sinT);
          brightness = (R * R * A) / maxP;
        }

        if (brightness > 0.005) {
          // Adjust threshold brightness mapping
          const intensity = Math.min(1.0, brightness) * 230;
          
          // Map phase angle in the XY plane to color hue for complex phase visualization
          const angle = Math.atan2(x, y);
          const phase = qM * angle;
          const hue = ((phase * 180 / Math.PI) + 360) % 360;

          // Convert HSL (hue, 100%, 60%) to RGB
          let r, g, b;
          if (qM === 0) {
            // Constant phase: glowing cyan-blue
            r = 30;
            g = 200;
            b = 255;
          } else {
            // Variable phase: colorful representation
            const hVal = hue / 60;
            const xVal = (1 - Math.abs((hVal % 2) - 1));
            if (hVal >= 0 && hVal < 1) { r = 1; g = xVal; b = 0; }
            else if (hVal >= 1 && hVal < 2) { r = xVal; g = 1; b = 0; }
            else if (hVal >= 2 && hVal < 3) { r = 0; g = 1; b = xVal; }
            else if (hVal >= 3 && hVal < 4) { r = 0; g = xVal; b = 1; }
            else if (hVal >= 4 && hVal < 5) { r = xVal; g = 0; b = 1; }
            else { r = 1; g = 0; b = xVal; }
            
            r = Math.round(r * 255);
            g = Math.round(g * 255);
            b = Math.round(b * 255);
          }

          const idx = (py * 300 + px) * 4;
          imgData.data[idx] = r;     // R
          imgData.data[idx+1] = g;   // G
          imgData.data[idx+2] = b;   // B
          imgData.data[idx+3] = intensity; // Alpha channel maps to density
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    setHeatmapCanvas(offscreen);
  }, [qN, qL, qM]);

  // Main Canvas animation and physics simulation loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Radii of Bohr orbits in pixels (n = 1 to 6)
    const bohrRadii = [0, 45, 80, 115, 145, 170, 190];

    const updateAndDraw = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // --- Background Stars/Glow Effect ---
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // --- Draw Light Source gun on the left ---
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, cy - 35, 30, 70);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, cy - 35, 30, 70);

      // Light beam glowing nozzle
      const nozzleColor = lightType === 'White' ? '#ffffff' : wavelengthToColor(wavelength);
      ctx.fillStyle = nozzleColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = nozzleColor;
      ctx.beginPath();
      ctx.arc(30, cy, 10, -Math.PI/2, Math.PI/2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label light source
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText("LIGHT GUN", 5, cy - 40);

      // --- 1. Physics: Fire incoming photons ---
      if (running) {
        stateRef.current.beamTimer += simSpeed;
        const beamThreshold = [180, 120, 60, 30, 15][beamIntensity - 1];
        if (stateRef.current.beamTimer >= beamThreshold) {
          stateRef.current.beamTimer = 0;
          
          let wl = wavelength;
          if (lightType === 'White') {
            // Generate a flat random spectrum (90 to 700 nm)
            wl = 90 + Math.random() * 610;
          }
          stateRef.current.photons.push({
            x: 30,
            y: cy + (Math.random() - 0.5) * 16,
            vx: 3.5 * simSpeed,
            vy: 0,
            wl: wl,
            color: wavelengthToColor(wl),
            absorbed: false
          });
        }
      }

      // --- 2. Draw Orbit / Wavefunction Environment ---
      if (model === 'Bohr') {
        // Draw the concentric electron orbits
        for (let i = 1; i <= 6; i++) {
          ctx.beginPath();
          ctx.arc(cx, cy, bohrRadii[i], 0, 2 * Math.PI);
          if (i === stateRef.current.electronLevel) {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
            ctx.lineWidth = 2.5;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
          }
          ctx.stroke();

          // Orbit label
          ctx.fillStyle = i === stateRef.current.electronLevel ? '#c084fc' : '#475569';
          ctx.font = '10px monospace';
          ctx.fillText(`n=${i}`, cx + bohrRadii[i] - 10, cy - 5);
        }
      } else {
        // Quantum Cloud Model
        // Draw orbital label box
        ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
        ctx.fillRect(cx - 70, cy - 180, 140, 24);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(cx - 70, cy - 180, 140, 24);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Ψ (n=${stateRef.current.quantumN}, l=${stateRef.current.quantumL}, m=${stateRef.current.quantumM})`, cx, cy - 164);
        ctx.textAlign = 'left';

        // Draw Cached Heatmap density background
        if (heatmapCanvas) {
          ctx.drawImage(heatmapCanvas, cx - 150, cy - 150, 300, 300);
        }

        // Draw Monte Carlo probability density dot cloud representation (Dynamic Measurement Simulation)
        if (running) {
          const scale = 25.0 / stateRef.current.quantumN;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          
          let dotsCount = 0;
          let attempts = 0;
          while (dotsCount < 18 && attempts < 100) {
            attempts++;
            // Sample a random point in box
            const rx = (Math.random() - 0.5) * 300;
            const ry = (Math.random() - 0.5) * 300;
            const r_val = Math.sqrt(rx*rx + ry*ry) / scale;
            if (r_val === 0) continue;
            
            const cosT = ry / (r_val * scale);
            const sinT = rx / (r_val * scale);
            const R = radialWavefunction(stateRef.current.quantumN, stateRef.current.quantumL, r_val);
            const A = angularDensity(stateRef.current.quantumL, stateRef.current.quantumM, cosT, sinT);
            
            // Rejection sampling against maximum possible density boundary
            const P = R * R * A;
            const maxVal = 0.5; // Estimated normalization limit
            if (Math.random() < P / maxVal) {
              ctx.beginPath();
              ctx.arc(cx + rx, cy + ry, 1, 0, 2*Math.PI);
              ctx.fill();
              dotsCount++;
            }
          }
        }
      }

      // --- 3. Draw Nucleus (Proton) ---
      // Glowing core
      const protonGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 12);
      protonGlow.addColorStop(0, '#fca5a5');
      protonGlow.addColorStop(0.3, '#ef4444');
      protonGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = protonGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
      ctx.fill();

      // Core proton circle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#fee2e2';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Plus sign inside proton
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy); ctx.lineTo(cx + 2, cy);
      ctx.moveTo(cx, cy - 2); ctx.lineTo(cx, cy + 2);
      ctx.stroke();

      // --- 4. Physics & Rendering: Update incoming photons ---
      const activePhotons = stateRef.current.photons;
      for (let i = activePhotons.length - 1; i >= 0; i--) {
        const p = activePhotons[i];
        if (running) {
          p.x += p.vx;
        }

        // Draw photon as wave packet (sine wave modulated by a Gaussian envelope)
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let sx = -15; sx <= 15; sx += 0.5) {
          const waveX = p.x + sx;
          const envelope = Math.exp(-Math.pow(sx / 7, 2)); // Gaussian envelope
          const waveY = p.y + Math.sin((p.x - sx) * 0.45) * 6 * envelope;
          if (sx === -15) ctx.moveTo(waveX, waveY);
          else ctx.lineTo(waveX, waveY);
        }
        ctx.stroke();

        // Draw leading glow bead
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
        ctx.fill();

        // --- Transition Mechanics: Absorption Interaction ---
        // A photon can only be absorbed if the atom is in the ground state (n=1)
        const currentN = model === 'Bohr' ? stateRef.current.electronLevel : stateRef.current.quantumN;
        if (currentN === 1 && !p.absorbed && p.x >= cx - 35 && p.x <= cx + 15) {
          // Check energy matches
          const photonEnergy = 1239.84 / p.wl;
          
          let targetExcitation = 0;
          for (let tn = 2; tn <= 6; tn++) {
            // Delta E = 13.6 * (1 - 1/n^2)
            const deltaE = 13.606 * (1.0 - 1.0 / (tn * tn));
            if (Math.abs(photonEnergy - deltaE) < 0.15) { // Absorption energy tolerance
              targetExcitation = tn;
              break;
            }
          }

          if (targetExcitation > 0) {
            p.absorbed = true;
            // Transition the state
            if (model === 'Bohr') {
              setBohrLevel(targetExcitation);
              stateRef.current.electronLevel = targetExcitation;
            } else {
              setQN(targetExcitation);
              // Selection rules check: excitation from ground s-orbital (l=0) forces excited p-orbital (l=1)
              setQL(1);
              const randomM = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
              setQM(randomM);
              stateRef.current.quantumN = targetExcitation;
              stateRef.current.quantumL = 1;
              stateRef.current.quantumM = randomM;
            }
            
            // Set excited state lifetime (number of frames before cascading down)
            stateRef.current.excitedLifetime = 90 + Math.random() * 60;
            stateRef.current.flashIntensity = 1.0; // trigger glowing absorption splash

            addLog(`Photon ABSORBED! Wavelength: ${Math.round(p.wl * 10) / 10} nm. Ground state electron EXCITED to shell n=${targetExcitation}`);
            
            // Remove the absorbed photon
            activePhotons.splice(i, 1);
            continue;
          }
        }

        // Clean up out of boundary photons
        if (p.x > width + 40) {
          activePhotons.splice(i, 1);
        }
      }

      // --- 5. Bohr Electron Orbit Mechanics ---
      if (model === 'Bohr') {
        const radius = bohrRadii[stateRef.current.electronLevel];
        if (running) {
          // Orbit velocity decreases for higher energy orbits: omega is proportional to 1 / n^1.5
          const omega = (0.065 / Math.pow(stateRef.current.electronLevel, 1.5)) * simSpeed;
          stateRef.current.electronAngle += omega;
        }
        
        const ex = cx + radius * Math.cos(stateRef.current.electronAngle);
        const ey = cy + radius * Math.sin(stateRef.current.electronAngle);

        // Draw orbit track trail (faint glow)
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#60a5fa';
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(ex, ey, 5.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // --- 6. Physics: Emission Transitions & Cascading down ---
      const currentLevel = model === 'Bohr' ? stateRef.current.electronLevel : stateRef.current.quantumN;
      if (currentLevel > 1) {
        if (running) {
          stateRef.current.excitedLifetime -= simSpeed;
          
          if (stateRef.current.excitedLifetime <= 0) {
            // Decay to a lower level
            let nextLevel = 1;
            
            if (model === 'Bohr') {
              // Bohr model decay: choose any lower state randomly
              nextLevel = Math.floor(Math.random() * (currentLevel - 1)) + 1;
              setBohrLevel(nextLevel);
              stateRef.current.electronLevel = nextLevel;
            } else {
              // Quantum model decay: must obey Selection Rules (Delta L = +/-1)
              // Since excited state from ground is l=1, we can drop to l'=0 (like ground 1s, or 2s/3s) or l'=2 (if next n >= 3).
              // Let's select a valid level
              const possibleNextLevels = [];
              for (let tn = 1; tn < currentLevel; tn++) {
                // Ground 1s is always allowed.
                // For other shells, checks if there is any subshell that obeys selection rules.
                possibleNextLevels.push(tn);
              }

              nextLevel = possibleNextLevels[Math.floor(Math.random() * possibleNextLevels.length)];
              setQN(nextLevel);
              
              // Set l' obeying selection rules: l' = l - 1 or l' = l + 1
              const currentL = stateRef.current.quantumL;
              let nextL = 0;
              if (nextLevel > 1) {
                // Choose between possible lower orbitals
                const allowedL = [];
                if (currentL - 1 >= 0 && currentL - 1 < nextLevel) allowedL.push(currentL - 1);
                if (currentL + 1 < nextLevel) allowedL.push(currentL + 1);
                nextL = allowedL.length > 0 ? allowedL[Math.floor(Math.random() * allowedL.length)] : 0;
              } else {
                nextL = 0; // Ground state must be 1s (l=0)
              }
              
              // Choose new m' from -l' to +l'
              const nextM = nextL === 0 ? 0 : Math.floor(Math.random() * (2 * nextL + 1)) - nextL;

              setQL(nextL);
              setQM(nextM);
              stateRef.current.quantumN = nextLevel;
              stateRef.current.quantumL = nextL;
              stateRef.current.quantumM = nextM;
            }

            // Calculate emission energy & wavelength
            const energyDiff = 13.606 * (1.0 / (nextLevel * nextLevel) - 1.0 / (currentLevel * currentLevel));
            const emitWavelength = 1239.84 / energyDiff;
            
            // Spawn emitted photon wave outward in a random angle
            const emitAngle = Math.random() * 2 * Math.PI;
            stateRef.current.emittedPhotons.push({
              x: cx,
              y: cy,
              vx: 3.0 * Math.cos(emitAngle) * simSpeed,
              vy: 3.0 * Math.sin(emitAngle) * simSpeed,
              wl: emitWavelength,
              color: wavelengthToColor(emitWavelength),
              distanceEmitted: 0
            });

            // Log event
            const seriesName = nextLevel === 1 ? 'Lyman' : nextLevel === 2 ? 'Balmer' : 'Paschen';
            addLog(`EMISSION Transition! n=${currentLevel} -> n=${nextLevel}. Emitted ${Math.round(emitWavelength * 10) / 10} nm photon (${seriesName} series)`);

            // If we are still above level 1, cascade down again after another delay
            if (nextLevel > 1) {
              stateRef.current.excitedLifetime = 70 + Math.random() * 50;
            }
          }
        }
      }

      // --- 7. Draw & Update Emitted Photons ---
      const emitted = stateRef.current.emittedPhotons;
      for (let j = emitted.length - 1; j >= 0; j--) {
        const ep = emitted[j];
        if (running) {
          ep.x += ep.vx;
          ep.y += ep.vy;
          ep.distanceEmitted += Math.sqrt(ep.vx*ep.vx + ep.vy*ep.vy);
        }

        // Draw outgoing wavepacket (circular wavefront ripples of wavelength colors)
        ctx.strokeStyle = ep.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw 3 concentric rings to look like a packet
        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = ep.distanceEmitted - ring * 8;
          if (ringRadius > 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius, 0, 2*Math.PI);
            // Alpha fades out as it expands
            const alpha = Math.max(0, 1 - ringRadius / (width * 0.7));
            ctx.globalAlpha = alpha;
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1.0;

        // Draw particle representation inside
        ctx.fillStyle = ep.color;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, 3, 0, 2 * Math.PI);
        ctx.fill();

        // Check if photon hits spectrometer detectors (outer boundary)
        if (ep.x < 10 || ep.x > width - 10 || ep.y < 10 || ep.y > height - 10) {
          recordEmission(ep.wl);
          emitted.splice(j, 1);
        }
      }

      // --- 8. Render Transition Absorption Splash/Flash ---
      if (stateRef.current.flashIntensity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${stateRef.current.flashIntensity * 0.25})`;
        ctx.fillRect(0, 0, width, height);

        // Ring flash expansion
        ctx.strokeStyle = `rgba(168, 85, 247, ${stateRef.current.flashIntensity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, (1.0 - stateRef.current.flashIntensity) * 140, 0, 2*Math.PI);
        ctx.stroke();

        if (running) {
          stateRef.current.flashIntensity -= 0.04 * simSpeed;
        }
      }

      // Repeat loop
      loopRef.current = requestAnimationFrame(updateAndDraw);
    };

    loopRef.current = requestAnimationFrame(updateAndDraw);
    return () => {
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current);
      }
    };
  }, [model, running, lightType, wavelength, beamIntensity, simSpeed, heatmapCanvas]);

  // Render Spectrometer Canvas Lines
  useEffect(() => {
    const canvas = spectrometerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw dark background spectrum bar
    const specGrad = ctx.createLinearGradient(0, 0, w, 0);
    // Draw colors from UV (90nm) to visible (380-700) to IR (700+)
    specGrad.addColorStop(0.0, 'rgba(168, 85, 247, 0.05)'); // Deep UV
    specGrad.addColorStop(0.2, 'rgba(168, 85, 247, 0.25)'); // Near UV / Violet
    specGrad.addColorStop(0.35, 'rgba(59, 130, 246, 0.25)'); // Blue
    specGrad.addColorStop(0.5, 'rgba(34, 197, 94, 0.25)');  // Green
    specGrad.addColorStop(0.75, 'rgba(234, 179, 8, 0.25)');  // Yellow/Orange
    specGrad.addColorStop(0.9, 'rgba(239, 68, 68, 0.25)');   // Red
    specGrad.addColorStop(1.0, 'rgba(239, 68, 68, 0.05)');   // Near IR

    ctx.fillStyle = specGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw wavelength grid markings
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let wlMark = 100; wlMark <= 700; wlMark += 100) {
      // Map 90nm to 700nm to 0 to w
      const mx = ((wlMark - 90) / 610) * w;
      ctx.beginPath();
      ctx.moveTo(mx, 0);
      ctx.lineTo(mx, h);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText(`${wlMark}nm`, mx - 12, h - 4);
    }

    // Draw active vertical line spectrum peaks based on logged photons
    spectrometerLogs.forEach((wl) => {
      const x = ((wl - 90) / 610) * w;
      if (x >= 0 && x <= w) {
        ctx.strokeStyle = wavelengthToColor(wl);
        ctx.shadowBlur = 4;
        ctx.shadowColor = wavelengthToColor(wl);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x, h - 14);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

  }, [spectrometerLogs]);

  return (
    <div className="w-full h-full h-full flex flex-col text-white font-sans select-none">
      
      {/* 1. Header Navigation Bar */}
      

      {/* 2. Main Workspace Layout */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        
        {/* Left Side Column: Visualization & Spectrometer (Column Span 8) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5 h-full">
          
          {/* Main Simulation Sandbox Canvas */}
          <div className="relative flex-1 border border-white/5 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-2 shadow-2xl min-h-[460px]" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
            
            {/* Visual labels overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1 text-xs text-slate-400 pointer-events-none">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Sun size={14} className="text-amber-400" />
                Beam Source: {lightType}
              </span>
              {lightType === 'Monochromatic' && (
                <span className="font-mono text-slate-400">
                  λ = {wavelength.toFixed(1)} nm ({ (1239.84 / wavelength).toFixed(2) } eV)
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold tracking-widest text-purple-300 uppercase">
                {model} Model
              </span>
            </div>

            {/* Simulation Canvas */}
            <canvas
              ref={canvasRef}
              width={720}
              height={440}
              className="w-full h-full max-w-[720px] max-h-[440px] rounded-xl border border-white/5 shadow-inner"
            />

            {/* Quick Status Bar */}
            <div className="w-full max-w-[720px] mt-2 px-2 flex justify-between items-center text-[11px] font-mono text-slate-500">
              <span>Ground state transition threshold: &lt; 121.6 nm (UV required for absorption)</span>
              <span>Active Photons: {stateRef.current.photons.length + stateRef.current.emittedPhotons.length}</span>
            </div>
          </div>

          {/* Spectrometer Analysis Unit */}
          <div className="border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col gap-4" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-cyan-400" />
                <h2 className="text-sm font-semibold tracking-wide text-slate-100">Spectrograph Detector</h2>
              </div>
              <button 
                onClick={clearSpectrometer}
                className="text-[10px] text-slate-400 hover:text-rose-400 underline uppercase tracking-wider"
              >
                Clear Data
              </button>
            </div>

            <div className="w-full rounded-lg p-2 border border-white/5 relative">
              <div className="absolute -top-1 left-2 px-1 text-[9px] text-slate-500 font-mono" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>EMISSION LINES RECORDED</div>
              <canvas 
                ref={spectrometerCanvasRef}
                width={700}
                height={80}
                className="w-full h-16 rounded"
              />
              <div className="flex justify-between px-1 mt-1 text-[9px] text-slate-500 font-mono">
                <span>90nm (Ultra-Violet)</span>
                <span>380nm (Visible Purple)</span>
                <span>700nm (Visible Red)</span>
                <span>780nm+ (Infra-Red)</span>
              </div>
            </div>

            {/* Counts table grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {TRANSITIONS.filter(t => spectrometerCounts[t.wl] > 0).map(t => (
                <div key={t.wl} className="flex flex-col /60 p-2 rounded border border-white/5">
                  <span className="text-[9px] text-slate-400 font-semibold truncate" title={t.name}>{t.name}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs font-mono font-bold text-white">{t.wl}nm</span>
                    <span className="text-xs font-mono font-extrabold text-cyan-400">×{spectrometerCounts[t.wl]}</span>
                  </div>
                </div>
              ))}
              {Object.keys(spectrometerCounts).length === 0 && (
                <div className="col-span-full py-2 text-center text-xs text-slate-500 italic">
                  No photons detected yet. Shine light matching a level difference (e.g. 121.6nm) to trigger absorption, excitation, and cascading emission.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Side Column: Parameter Controls, Theory, and Log (Column Span 4) */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col border border-white/5 rounded-2xl shadow-xl overflow-hidden h-full min-h-[580px]" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
          
          {/* Section Tabs */}
          <div className="flex border-b border-white/5 /50">
            <button
              onClick={() => setActiveTab('Controls')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'Controls' 
                  ? 'border-purple-500 text-white ' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders size={13} />
              Controls
            </button>
            <button
              onClick={() => setActiveTab('Theory')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'Theory' 
                  ? 'border-purple-500 text-white ' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen size={13} />
              Physics Info
            </button>
            <button
              onClick={() => setActiveTab('Log')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'Log' 
                  ? 'border-purple-500 text-white ' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity size={13} />
              Event Log
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[600px]">
            
            {activeTab === 'Controls' && (
              <div className="flex flex-col gap-6">
                
                {/* A. Model Switcher */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-wider text-purple-400 uppercase flex items-center gap-1.5">
                    <Layers size={13} /> Atomic Physics Model
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => { setModel('Bohr'); addLog('Switched to Bohr Model view'); }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        model === 'Bohr' 
                          ? 'bg-purple-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Bohr Orbits (1913)
                    </button>
                    <button
                      onClick={() => { setModel('Quantum'); addLog('Switched to Schrödinger Wave Cloud view'); }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        model === 'Quantum' 
                          ? 'bg-purple-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Quantum Cloud (1926)
                    </button>
                  </div>
                </div>

                {/* B. Light Source Controls */}
                <div className="flex flex-col /40 border border-white/5 p-4 rounded-xl gap-4">
                  <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                    <Sun size={14} className="text-amber-400" /> Light Source Settings
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLightType('White')}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        lightType === 'White' 
                          ? 'bg-white text-slate-900 border-white' 
                          : 'border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      White Light (Continuous)
                    </button>
                    <button
                      onClick={() => setLightType('Monochromatic')}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        lightType === 'Monochromatic' 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Monochromatic
                    </button>
                  </div>

                  {lightType === 'Monochromatic' && (
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Wavelength</span>
                        <span className="font-mono text-purple-400 font-bold">{wavelength} nm</span>
                      </div>
                      <input
                        type="range"
                        min="95"
                        max="700"
                        step="0.5"
                        value={wavelength}
                        onChange={(e) => setWavelength(Number(e.target.value))}
                        className="w-full accent-purple-500 h-1 rounded"
                        style={{
                          background: `linear-gradient(to right, #a855f7 0%, #3b82f6 30%, #22c55e 60%, #eab308 80%, #ef4444 100%)`
                        }}
                      />
                      
                      {/* Presets Grid */}
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Tuning Presets (n=1 excitation)</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => applyPreset(121.6)}
                            className="py-1 px-2 text-[10px] font-semibold hover: text-slate-200 rounded transition-all truncate" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                            title="Lyman-Alpha (121.6nm) -> excites n=1 to n=2"
                          >
                            n = 2 (121.6nm)
                          </button>
                          <button
                            onClick={() => applyPreset(102.6)}
                            className="py-1 px-2 text-[10px] font-semibold hover: text-slate-200 rounded transition-all truncate" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                            title="Lyman-Beta (102.6nm) -> excites n=1 to n=3"
                          >
                            n = 3 (102.6nm)
                          </button>
                          <button
                            onClick={() => applyPreset(97.2)}
                            className="py-1 px-2 text-[10px] font-semibold hover: text-slate-200 rounded transition-all truncate" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                            title="Lyman-Gamma (97.2nm) -> excites n=1 to n=4"
                          >
                            n = 4 (97.2nm)
                          </button>
                          <button
                            onClick={() => applyPreset(95.0)}
                            className="py-1 px-2 text-[10px] font-semibold hover: text-slate-200 rounded transition-all truncate" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                            title="Lyman-Delta (95.0nm) -> excites n=1 to n=5"
                          >
                            n = 5 (95.0nm)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Photon Stream Rate</span>
                      <span className="font-mono text-slate-300 font-bold">{beamIntensity} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={beamIntensity}
                      onChange={(e) => setBeamIntensity(Number(e.target.value))}
                      className="w-full accent-purple-500 h-1 rounded" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                    />
                  </div>

                  <button
                    onClick={fireSinglePhoton}
                    className="w-full mt-1 py-2 rounded bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-xs font-bold tracking-wide transition-all shadow"
                  >
                    Fire Single Photon
                  </button>
                </div>

                {/* C. Direct Atom Level Stimulation Control */}
                <div className="flex flex-col /40 border border-white/5 p-4 rounded-xl gap-4">
                  <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                    <Activity size={14} className="text-purple-400" /> Manual Atomic State Control
                  </h3>
                  
                  {model === 'Bohr' ? (
                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] text-slate-400 italic">Force electron to orbital shell:</span>
                      <div className="grid grid-cols-6 gap-1">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <button
                            key={n}
                            onClick={() => handleManualBohrLevel(n)}
                            className={`py-1.5 rounded font-mono text-xs font-bold transition-all border ${
                              bohrLevel === n 
                                ? 'bg-purple-600 text-white border-purple-500' 
                                : ' text-slate-400 hover:text-slate-200 border-transparent'
                            }`}
                          >
                            n={n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] text-slate-400 italic">Force quantum number states:</span>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">n (Principal):</span>
                          <span className="text-white font-bold">{qN}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map(n => (
                            <button
                              key={n}
                              onClick={() => {
                                // Clamp valid l when n changes
                                const newL = Math.min(qL, n - 1);
                                const newM = Math.min(Math.max(qM, -newL), newL);
                                handleManualQuantumState(n, newL, newM);
                              }}
                              className={`py-1.5 rounded font-mono text-xs font-bold transition-all ${
                                qN === n ? 'bg-cyan-600 text-white' : ' text-slate-400'
                              }`}
                            >
                              n={n}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">l (Azimuthal):</span>
                          <span className="text-white font-bold">
                            {qL} ({['s', 'p', 'd', 'f'][qL]} orbital)
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[0, 1, 2, 3].map(l => {
                            const disabled = l >= qN;
                            return (
                              <button
                                key={l}
                                disabled={disabled}
                                onClick={() => {
                                  // Clamp valid m when l changes
                                  const newM = Math.min(Math.max(qM, -l), l);
                                  handleManualQuantumState(qN, l, newM);
                                }}
                                className={`py-1.5 rounded font-mono text-xs font-bold transition-all ${
                                  disabled 
                                    ? ' text-slate-700 cursor-not-allowed' 
                                    : qL === l 
                                      ? 'bg-cyan-600 text-white' 
                                      : ' text-slate-400'
                                }`}
                              >
                                l={l}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">m (Magnetic):</span>
                          <span className="text-white font-bold">{qM}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {[-3, -2, -1, 0, 1, 2, 3].map(m => {
                            const disabled = Math.abs(m) > qL;
                            return (
                              <button
                                key={m}
                                disabled={disabled}
                                onClick={() => handleManualQuantumState(qN, qL, m)}
                                className={`py-1 rounded font-mono text-[10px] font-bold transition-all ${
                                  disabled 
                                    ? ' text-slate-700 cursor-not-allowed' 
                                    : qM === m 
                                      ? 'bg-cyan-600 text-white' 
                                      : ' text-slate-400'
                                }`}
                              >
                                {m > 0 ? `+${m}` : m}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* D. Additional simulation options */}
                <div className="flex flex-col /40 border border-white/5 p-4 rounded-xl gap-3">
                  <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                    <Sliders size={13} /> Simulation Settings
                  </h3>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Simulation Speed</span>
                    <span className="font-mono text-slate-300 font-bold">{simSpeed}x</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSimSpeed(s)}
                        className={`py-1 text-xs rounded font-bold border transition-all ${
                          simSpeed === s 
                            ? 'bg-purple-600 text-white border-purple-500 shadow' 
                            : 'border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}x Speed
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'Theory' && (
              <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed">
                
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">The Bohr Hydrogen Model (1913)</h3>
                  <p className="mb-2">
                    Niels Bohr combined classical physics with Planck's quantum concept, proposing that:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li>Electrons orbit in discrete, stable circular orbits around the proton.</li>
                    <li>Orbits satisfy quantization of angular momentum: <code className="text-cyan-400">L = n * ħ</code>.</li>
                    <li>The orbital radii increase non-linearly: <code className="text-cyan-400">r_n = n² * a_0</code>.</li>
                    <li>Radiation is emitted or absorbed only when changing orbits: <code className="text-cyan-400">ΔE = E_upper - E_lower = h * ν</code>.</li>
                  </ul>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <h3 className="text-sm font-bold text-white mb-1">Schrödinger Wave Mechanics (1926)</h3>
                  <p className="mb-2">
                    In modern quantum mechanics, the electron is described by a spatial wavefunction <code className="text-purple-400">Ψ(r, θ, φ)</code>.
                    Its probability density is <code className="text-purple-400">|Ψ|²</code>, visualized as a cloud of varying density.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li><code className="text-white">n (Principal)</code>: Dictates energy levels <code className="text-cyan-400">E_n = -13.6/n² eV</code>.</li>
                    <li><code className="text-white">l (Azimuthal)</code>: Defines the shape of the subshell <code className="text-cyan-400">0 ≤ l &lt; n</code> (s, p, d, f).</li>
                    <li><code className="text-white">m (Magnetic)</code>: Spatial orientation <code className="text-cyan-400">-l ≤ m ≤ l</code>.</li>
                    <li>Colors represent the phase angle <code className="text-purple-400">e^(i * m * φ)</code>.</li>
                  </ul>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <h3 className="text-sm font-bold text-white mb-1">Absorption & Cascading Decay</h3>
                  <p className="mb-2">
                    Hydrogen absorbs incoming photons only if the energy matches the difference between ground state (n=1) and an excited state (n=2..6):
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li><code className="text-white">Lyman Series (UV)</code>: Transitions directly to/from n=1. Excites the atom during absorption.</li>
                    <li><code className="text-white">Balmer Series (Visible)</code>: Transitions ending at n=2. These emit red (656nm), cyan (486nm), blue (434nm), and violet (410nm) visible light.</li>
                    <li><code className="text-white">Paschen Series (IR)</code>: Transitions ending at n=3.</li>
                  </ul>
                  <p className="mt-2 text-purple-300 font-semibold flex items-center gap-1.5">
                    <Info size={14} /> selection rule: Δl = ±1.
                  </p>
                </div>

              </div>
            )}

            {activeTab === 'Log' && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Live Simulation Event Log</span>
                <div className="flex flex-col gap-1.5 font-mono text-[10px] text-slate-400 overflow-y-auto max-h-[460px] pr-1">
                  {historyLog.map((item, index) => (
                    <div key={index} className="flex gap-2 py-1 border-b border-white/5 align-top">
                      <span className="text-purple-400 shrink-0">[{item.time}]</span>
                      <span className="text-slate-300 leading-tight">{item.msg}</span>
                    </div>
                  ))}
                  {historyLog.length === 0 && (
                    <span className="text-slate-600 italic py-4 text-center">No simulation events logged yet.</span>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Atomic Energy Level Diagram Footer */}
          <div className="p-4 border-t border-white/5 flex flex-col gap-2 font-mono text-[10px] text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Layers size={11} className="text-cyan-400" /> ENERGY LEVELS (Hydrogen Atom)
            </span>
            <div className="flex flex-col gap-1 relative pl-2 border-l border-slate-700">
              <div className="flex justify-between items-center">
                <span>n=6</span> <span className="text-slate-500">-0.38 eV</span>
              </div>
              <div className="flex justify-between items-center">
                <span>n=5</span> <span className="text-slate-500">-0.54 eV</span>
              </div>
              <div className="flex justify-between items-center">
                <span>n=4</span> <span className="text-slate-500">-0.85 eV</span>
              </div>
              <div className="flex justify-between items-center">
                <span>n=3</span> <span className="text-slate-500">-1.51 eV</span>
              </div>
              <div className="flex justify-between items-center">
                <span>n=2</span> <span className="text-slate-500">-3.40 eV</span>
              </div>
              <div className="flex justify-between items-center text-white font-semibold">
                <span>n=1 (Ground State)</span> <span>-13.60 eV</span>
              </div>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}


export default function CustomModelsoftheHydrogenAtom({ onBack, title }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                {onBack ? (
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                        ← Back
                    </button>
                ) : <div />}
                <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
                    {title || 'Simulation'}
                </h1>
                <div style={{ width: '100px' }}></div>
            </div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }}>
                 <CustomModelsoftheHydrogenAtomInner onBack={null} title={""} />
            </div>
        </div>
    );
}
