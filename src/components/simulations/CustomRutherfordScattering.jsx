/**
 * CustomRutherfordScattering.jsx
 * 
 * A high-fidelity, interactive physics simulation of the Rutherford Gold Foil Experiment.
 * Developed by the Rutherford Scattering Specialist.
 * 
 * ============================================================================
 * PHYSICS & HISTORICAL FORMULATION
 * ============================================================================
 * 
 * 1. THE GEIGER-MARSDEN EXPERIMENT (1909)
 *    Before 1911, the prevailing model of the atom was J.J. Thomson's "Plum Pudding"
 *    model, where the atom was conceived as a diffuse, positively charged sphere
 *    with tiny negative electrons embedded within it.
 *    
 *    Ernest Rutherford, along with Hans Geiger and Ernest Marsden, fired alpha
 *    particles (helium nuclei, q = +2e, m = 6.64e-27 kg) at a thin sheet of gold foil.
 *    Under the Plum Pudding model, the electric field inside the diffuse positive charge
 *    is extremely weak, and the alpha particles should pass through with deflections
 *    of less than a fraction of a degree.
 *    
 *    Instead, they observed that while most particles went straight through, about
 *    1 in 8,000 was deflected by large angles (> 90 degrees), and some even bounced
 *    straight back. Rutherford remarked it was as if a 15-inch artillery shell had
 *    bounced off tissue paper.
 * 
 * 2. COULOMB SCATTERING PHYSICS
 *    The alpha particle (+2e) and target nucleus (+Ze) experience a repulsive Coulomb force:
 *    
 *        F = (k_e * q_1 * q_2) / r^2 = (1 / (4 * pi * epsilon_0)) * (2 * Z * e^2) / r^2
 *    
 *    Where:
 *        q_1 = +2e (Alpha particle charge)
 *        q_2 = +Ze (Target nucleus charge)
 *        r = distance between the alpha particle and the nucleus
 * 
 * 3. MODEL FORMULATIONS
 *    
 *    A. Rutherford Atom (Concentrated Nucleus):
 *       The entire positive charge (+Ze) and nearly all the atomic mass are concentrated
 *       in a tiny nucleus at the center (r_nucleus ~ 10^-14 m).
 *       Outside the nucleus, the force is:
 *           F = (C * Z) / r^2
 *       In this simulation, we model this point-charge repulsion with a small softening 
 *       factor (epsilon^2) to prevent numerical divergence during extremely close encounters:
 *           a_x = (G * Z * dx) / (r * (r^2 + epsilon^2))
 *           a_y = (G * Z * dy) / (r * (r^2 + epsilon^2))
 * 
 *    B. Plum Pudding Atom (Diffuse Positive Charge):
 *       The positive charge (+Ze) is uniformly distributed throughout a sphere of radius R.
 *       Using Gauss's Law, the electric field and force inside the sphere (r < R) is:
 *           F_in = (C * Z * r) / R^3
 *       Outside the sphere (r >= R), the force acts as if the charge were at the center:
 *           F_out = (C * Z) / r^2
 *       This leads to the following acceleration equations in our simulation:
 *           For r < R:
 *               a_x = (G * Z * dx) / R^3
 *               a_y = (G * Z * dy) / R^3
 *           For r >= R:
 *               a_x = (G * Z * dx) / (r * (r^2 + epsilon^2))
 *               a_y = (G * Z * dy) / (r * (r^2 + epsilon^2))
 * 
 * 4. NUMERICAL INTEGRATION
 *    We integrate the equations of motion using Euler-Cromer integration. To maintain
 *    extreme precision near the scattering center (where velocities change rapidly), we use
 *    sub-stepping: we divide the animation frame's timestep (dt) into 10 sub-steps.
 * 
 *        For each sub-step:
 *            r = sqrt(dx^2 + dy^2)
 *            ax, ay = compute_acceleration(dx, dy, r, Z, model)
 *            vx = vx + ax * (dt / sub_steps)
 *            vy = vy + ay * (dt / sub_steps)
 *            x = x + vx * (dt / sub_steps)
 *            y = y + vy * (dt / sub_steps)
 * 
 * 5. SCATTERING ANGLE
 *    Initial velocity is purely horizontal: v_initial = (v_0, 0).
 *    Final velocity upon exiting the simulation space is v_final = (v_x, v_y).
 *    The scattering angle theta is:
 *        theta = |atan2(v_y, v_x)| * (180 / pi)
 *    This yields a value in [0, 180] degrees.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Info, 
  HelpCircle, 
  Sparkles, 
  Activity, 
  Trash2, 
  ArrowLeft, 
  ChevronRight,
  Layers,
  Settings2,
  TrendingUp,
  Award
} from 'lucide-react';

// Element presets for target nucleus
const PRESETS = {
  Au: { name: 'Gold (Au)', Z: 79, symbol: 'Au', color: '#fbbf24', radius: 12 },
  Pb: { name: 'Lead (Pb)', Z: 82, symbol: 'Pb', color: '#94a3b8', radius: 13 },
  Ag: { name: 'Silver (Ag)', Z: 47, symbol: 'Ag', color: '#cbd5e1', radius: 10 },
  Cu: { name: 'Copper (Cu)', Z: 29, symbol: 'Cu', color: '#f97316', radius: 8 },
  C:  { name: 'Carbon (C)', Z: 6, symbol: 'C', color: '#4b5563', radius: 6 },
};

function CustomRutherfordScatteringInner({ onBack, title }) {
  // --- STATE VARIABLES ---
  const [modelMode, setModelMode] = useState('rutherford'); // 'rutherford' or 'plumPudding'
  const [selectedPreset, setSelectedPreset] = useState('Au');
  const [nucleusZ, setNucleusZ] = useState(79);
  
  // Alpha particle properties
  const [alphaEnergy, setAlphaEnergy] = useState(5.0); // MeV, controls speed
  const [beamPosition, setBeamPosition] = useState(0); // Vertical offset from center
  const [beamWidth, setBeamWidth] = useState(40); // Vertical spread width
  const [firingRate, setFiringRate] = useState(8); // Particles/second
  const [continuousFiring, setContinuousFiring] = useState(true);

  // Visualization settings
  const [showTracks, setShowTracks] = useState(true);
  const [persistentTracks, setPersistentTracks] = useState(true);
  const [showForces, setShowForces] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1.0); // Speed modifier
  const [isPlaying, setIsPlaying] = useState(true);

  // Simulation data & stats
  const [scatteringAngles, setScatteringAngles] = useState([]);
  const [stats, setStats] = useState({
    fired: 0,
    detected: 0,
    backscattered: 0, // > 90 deg
    forwardscattered: 0, // <= 90 deg
    maxAngle: 0
  });

  // Track the most recently active particle's energy state for educational display
  const [energyMonitor, setEnergyMonitor] = useState({ ke: 0, pe: 0, total: 0, active: false });

  // Theory panel toggle
  const [showTheory, setShowTheory] = useState(true);

  // --- REFS ---
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastSpawnTimeRef = useRef(0);
  const particlesRef = useRef([]); // Mutable array for high-performance physics ticks
  const historyPathsRef = useRef([]); // Store old tracks for rendering
  const statsRef = useRef({ fired: 0, detected: 0, backscattered: 0, forwardscattered: 0, maxAngle: 0 });

  // Physics constants (tuned for canvas scale 800x500)
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const CENTER_X = CANVAS_WIDTH / 2;
  const CENTER_Y = CANVAS_HEIGHT / 2;
  const PLUM_PUDDING_RADIUS = 110;
  const COULOMB_CONSTANT = 170; // Tuned electrostatic force scaling
  const SOFTENING_FACTOR_SQ = 64; // epsilon^2 to avoid division by zero/extreme jumps

  // Sync selected element preset with nucleusZ
  const handlePresetChange = (key) => {
    setSelectedPreset(key);
    if (key !== 'custom') {
      setNucleusZ(PRESETS[key].Z);
    }
  };

  // Convert MeV to initial speed v0
  // v = sqrt(2*E/m) -> scaled for visualization
  const getInitialSpeed = (energy) => {
    return 3.0 + Math.sqrt(energy) * 1.5;
  };

  // Create a single particle
  const spawnParticle = (yOffset) => {
    const v0 = getInitialSpeed(alphaEnergy);
    const id = Math.random().toString(36).substring(2, 9);
    
    // Choose vertical start position: yOffset can be passed (e.g. for sweeps) 
    // or randomized within beamWidth around beamPosition
    let startY = CENTER_Y + beamPosition;
    if (yOffset !== undefined) {
      startY += yOffset;
    } else if (beamWidth > 0) {
      startY += (Math.random() - 0.5) * beamWidth;
    }

    const newParticle = {
      id,
      x: 20,
      y: startY,
      vx: v0,
      vy: 0,
      initialY: startY,
      path: [{ x: 20, y: startY }],
      color: `hsl(${130 + Math.random() * 40}, 95%, 60%)`, // Neon green variations
      active: true,
      lastKe: 0.5 * 4 * v0 * v0,
      lastPe: 0,
    };

    particlesRef.current.push(newParticle);
    statsRef.current.fired += 1;
    updateStatsState();
  };

  // Fire a single particle on demand
  const handleFireSingle = () => {
    spawnParticle(0);
  };

  // Fire a sweep of particles (evenly spaced across beam width)
  const handleFireSweep = () => {
    const numParticles = 15;
    if (numParticles <= 1) {
      spawnParticle(0);
      return;
    }
    
    for (let i = 0; i < numParticles; i++) {
      const fraction = i / (numParticles - 1) - 0.5; // -0.5 to 0.5
      const yOffset = fraction * beamWidth;
      spawnParticle(yOffset);
    }
  };

  // Clear all tracks and data
  const handleClearData = () => {
    particlesRef.current = [];
    historyPathsRef.current = [];
    setScatteringAngles([]);
    statsRef.current = { fired: 0, detected: 0, backscattered: 0, forwardscattered: 0, maxAngle: 0 };
    setStats({ fired: 0, detected: 0, backscattered: 0, forwardscattered: 0, maxAngle: 0 });
    setEnergyMonitor({ ke: 0, pe: 0, total: 0, active: false });
  };

  // Reset simulation to default values
  const handleResetSim = () => {
    setModelMode('rutherford');
    setSelectedPreset('Au');
    setNucleusZ(79);
    setAlphaEnergy(5.0);
    setBeamPosition(0);
    setBeamWidth(40);
    setFiringRate(8);
    setContinuousFiring(true);
    setShowTracks(true);
    setPersistentTracks(true);
    setShowForces(false);
    setSimSpeed(1.0);
    setIsPlaying(true);
    handleClearData();
  };

  // Helper to push statistics safely
  const updateStatsState = () => {
    setStats({ ...statsRef.current });
  };

  // --- PHYSICS ENGINE & ANIMATION LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Create vibrating positions for electrons in Plum Pudding mode
    const electronPositions = Array.from({ length: 14 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (PLUM_PUDDING_RADIUS - 15);
      return {
        r: radius,
        angle: angle,
        speed: 0.02 + Math.random() * 0.03
      };
    });

    // Orbiting angles for planetary electrons in Rutherford mode
    const planetaryElectrons = [
      { r: 160, angle: 0, speed: 0.04 },
      { r: 210, angle: Math.PI * 0.6, speed: 0.03 },
      { r: 250, angle: Math.PI * 1.3, speed: 0.02 }
    ];

    let lastFrameTime = performance.now();

    const loop = (time) => {
      const deltaMs = time - lastFrameTime;
      lastFrameTime = time;

      // 1. Particle Spawner (continuous mode)
      if (isPlaying && continuousFiring) {
        const intervalMs = 1000 / firingRate;
        if (time - lastSpawnTimeRef.current >= intervalMs) {
          spawnParticle();
          lastSpawnTimeRef.current = time;
        }
      }

      // 2. Physics Update (Sub-stepping integration)
      if (isPlaying) {
        const subSteps = 10;
        // Total dt per frame depends on simSpeed
        const dt = simSpeed * (Math.min(deltaMs, 33) / 16.6) * 1.0; // Normalized around 60fps
        const stepDt = dt / subSteps;

        const activeParticles = particlesRef.current;

        for (let s = 0; s < subSteps; s++) {
          for (let i = 0; i < activeParticles.length; i++) {
            const p = activeParticles[i];
            if (!p.active) continue;

            // Vector pointing from particle to target nucleus
            const dx = p.x - CENTER_X;
            const dy = p.y - CENTER_Y;
            const r = Math.sqrt(dx * dx + dy * dy);

            // Compute Electrostatic repulsions
            let ax = 0;
            let ay = 0;

            if (modelMode === 'rutherford') {
              // Point-like concentrated nucleus repulsion
              // F = k * q1 * q2 / r^2
              const denom = r * (r * r + SOFTENING_FACTOR_SQ);
              if (denom > 0.001) {
                // acceleration magnitude a = F/m (we treat alpha mass as constant = 4)
                const aMag = (COULOMB_CONSTANT * nucleusZ * 2) / 4;
                ax = (aMag * dx) / denom;
                ay = (aMag * dy) / denom;
              }
            } else {
              // Plum Pudding Atom Mode (diffuse spherical positive charge)
              if (r < PLUM_PUDDING_RADIUS) {
                // Inside the sphere: E is linear with r (F = k * q1 * q2 * r / R^3)
                const aMagInside = (COULOMB_CONSTANT * nucleusZ * 2) / (4 * Math.pow(PLUM_PUDDING_RADIUS, 3));
                ax = aMagInside * dx;
                ay = aMagInside * dy;
              } else {
                // Outside the sphere: behaves like point charge
                const denom = r * (r * r + SOFTENING_FACTOR_SQ);
                if (denom > 0.001) {
                  const aMag = (COULOMB_CONSTANT * nucleusZ * 2) / 4;
                  ax = (aMag * dx) / denom;
                  ay = (aMag * dy) / denom;
                }
              }
            }

            // Update velocities
            p.vx += ax * stepDt;
            p.vy += ay * stepDt;

            // Update position
            p.x += p.vx * stepDt;
            p.y += p.vy * stepDt;

            // Calculate Energies for educational display (Alpha mass = 4)
            const mass = 4.0;
            const vSq = p.vx * p.vx + p.vy * p.vy;
            p.lastKe = 0.5 * mass * vSq;
            
            // Potential Energy U = k * q1 * q2 / r
            if (modelMode === 'rutherford') {
              p.lastPe = (COULOMB_CONSTANT * nucleusZ * 2) / Math.max(r, 4);
            } else {
              if (r < PLUM_PUDDING_RADIUS) {
                // U inside charged sphere: U(r) = (k*q1*q2 / (2*R)) * (3 - r^2/R^2)
                const u0 = (COULOMB_CONSTANT * nucleusZ * 2) / (2 * PLUM_PUDDING_RADIUS);
                p.lastPe = u0 * (3.0 - (r * r) / (PLUM_PUDDING_RADIUS * PLUM_PUDDING_RADIUS));
              } else {
                p.lastPe = (COULOMB_CONSTANT * nucleusZ * 2) / r;
              }
            }

            // Append to path trail (every few sub-steps to avoid bloating)
            if (s === 0 && showTracks) {
              const lastPt = p.path[p.path.length - 1];
              const distFromLast = lastPt ? Math.sqrt(Math.pow(p.x - lastPt.x, 2) + Math.pow(p.y - lastPt.y, 2)) : 999;
              if (distFromLast > 1.5) {
                p.path.push({ x: p.x, y: p.y });
                if (p.path.length > 250) {
                  p.path.shift();
                }
              }
            }

            // Check boundary escape (particle exited simulation space)
            if (p.x < 0 || p.x > CANVAS_WIDTH || p.y < 0 || p.y > CANVAS_HEIGHT) {
              p.active = false;

              // Calculate scattering angle theta (final deflection relative to initial horizontal motion)
              // initial motion was horizontal (1, 0), final velocity is (p.vx, p.vy)
              let thetaRad = Math.atan2(p.vy, p.vx);
              let thetaDeg = Math.abs(thetaRad * (180.0 / Math.PI));

              // Record data point
              setScatteringAngles(prev => {
                const next = [...prev, thetaDeg];
                // Cap log to avoid memory issue
                if (next.length > 5000) next.shift();
                return next;
              });

              // Update stats
              statsRef.current.detected += 1;
              if (thetaDeg > 90) {
                statsRef.current.backscattered += 1;
              } else {
                statsRef.current.forwardscattered += 1;
              }
              if (thetaDeg > statsRef.current.maxAngle) {
                statsRef.current.maxAngle = thetaDeg;
              }
              updateStatsState();

              // Push path to history for persistent tracks visualization
              if (persistentTracks && showTracks) {
                historyPathsRef.current.push({
                  path: p.path,
                  color: p.color,
                  time: time
                });
                // Cap history tracks size
                if (historyPathsRef.current.length > 30) {
                  historyPathsRef.current.shift();
                }
              }
            }
          }
        }

        // Clean up inactive particles from physics ref
        particlesRef.current = activeParticles.filter(p => p.active);

        // Update Energy Monitor with the first active particle's state if available
        const monitorParticle = particlesRef.current[particlesRef.current.length - 1];
        if (monitorParticle) {
          setEnergyMonitor({
            ke: monitorParticle.lastKe,
            pe: monitorParticle.lastPe,
            total: monitorParticle.lastKe + monitorParticle.lastPe,
            active: true
          });
        } else {
          setEnergyMonitor(prev => ({ ...prev, active: false }));
        }

        // Update electron positions (vibrating/orbiting for animation visual)
        electronPositions.forEach(el => {
          el.angle += el.speed * simSpeed;
        });
        planetaryElectrons.forEach(el => {
          el.angle += el.speed * simSpeed;
        });
      }

      // 3. Render Canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid lines (radar style)
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.lineWidth = 1;
      for (let x = 50; x < CANVAS_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 50; y < CANVAS_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw scattering target background boundaries
      if (modelMode === 'plumPudding') {
        // Draw Plum Pudding Atom: Large diffuse positively charged sphere
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, PLUM_PUDDING_RADIUS, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, PLUM_PUDDING_RADIUS);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)'); // Red diffuse positive fluid
        gradient.addColorStop(0.7, 'rgba(239, 68, 68, 0.12)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for Plum Pudding Atom
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Diffuse Positive Fluid (+Ze)', CENTER_X, CENTER_Y - 45);

        // Draw electrons embedded (vibrating J.J. Thomson electrons)
        electronPositions.forEach((el, index) => {
          const ex = CENTER_X + Math.cos(el.angle) * el.r;
          const ey = CENTER_Y + Math.sin(el.angle) * el.r;

          ctx.beginPath();
          ctx.arc(ex, ey, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981'; // Green electrons
          ctx.fill();
          ctx.strokeStyle = '#047857';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Electron negative label "-"
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('-', ex, ey - 0.5);
        });
      } else {
        // Rutherford Atom: Draw planetary Bohr orbits and electrons
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
        ctx.lineWidth = 1;
        planetaryElectrons.forEach(orbit => {
          ctx.beginPath();
          ctx.arc(CENTER_X, CENTER_Y, orbit.r, 0, Math.PI * 2);
          ctx.stroke();

          // Orbiting Electron
          const ex = CENTER_X + Math.cos(orbit.angle) * orbit.r;
          const ey = CENTER_Y + Math.sin(orbit.angle) * orbit.r;
          ctx.beginPath();
          ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#3b82f6'; // Blue electron
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('-', ex, ey - 0.5);
        });
      }

      // Draw Alpha particle gun (collimator) on the left
      const gunY = CENTER_Y + beamPosition;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, gunY - 15, 25, 30);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(5, gunY - 15, 25, 30);
      
      // Draw golden barrel tip
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(30, gunY - 7, 8, 14);
      
      // Draw collimator slit visualization
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(37, gunY - 3, 2, 6);

      // Draw beam vertical range indicators
      if (beamWidth > 0) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(35, gunY - beamWidth / 2);
        ctx.lineTo(120, gunY - beamWidth / 2);
        ctx.moveTo(35, gunY + beamWidth / 2);
        ctx.lineTo(120, gunY + beamWidth / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw persistent/historical tracks (lower opacity)
      if (showTracks && persistentTracks) {
        historyPathsRef.current.forEach(historyItem => {
          const path = historyItem.path;
          if (path.length < 2) return;

          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let k = 1; k < path.length; k++) {
            ctx.lineTo(path[k].x, path[k].y);
          }
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.09)'; // Very faint green
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }

      // Draw active particles and their trails
      particlesRef.current.forEach(p => {
        // Draw trail
        if (showTracks && p.path.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(p.path[0].x, p.path[0].y);
          for (let k = 1; k < p.path.length; k++) {
            ctx.lineTo(p.path[k].x, p.path[k].y);
          }
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw particle body
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Plus signs inside alpha particle "+ +"
        ctx.fillStyle = '#064e3b';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('++', p.x, p.y);

        // Draw active electrostatic force vector arrow
        if (showForces) {
          const dx = p.x - CENTER_X;
          const dy = p.y - CENTER_Y;
          const r = Math.sqrt(dx * dx + dy * dy);
          
          let fMag = 0;
          if (modelMode === 'rutherford') {
            fMag = (COULOMB_CONSTANT * nucleusZ * 20) / (r * r + SOFTENING_FACTOR_SQ);
          } else {
            if (r < PLUM_PUDDING_RADIUS) {
              fMag = (COULOMB_CONSTANT * nucleusZ * 20 * r) / Math.pow(PLUM_PUDDING_RADIUS, 3);
            } else {
              fMag = (COULOMB_CONSTANT * nucleusZ * 20) / (r * r + SOFTENING_FACTOR_SQ);
            }
          }

          // Force vector points radially outward
          if (r > 0) {
            const fx = (dx / r) * fMag * 4; // Scale arrow for visualization
            const fy = (dy / r) * fMag * 4;

            ctx.strokeStyle = '#ef4444'; // Red force arrow
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + fx, p.y + fy);
            ctx.stroke();

            // Arrow head
            const arrowAngle = Math.atan2(fy, fx);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(p.x + fx, p.y + fy);
            ctx.lineTo(
              p.x + fx - 8 * Math.cos(arrowAngle - Math.PI / 6),
              p.y + fy - 8 * Math.sin(arrowAngle - Math.PI / 6)
            );
            ctx.lineTo(
              p.x + fx - 8 * Math.cos(arrowAngle + Math.PI / 6),
              p.y + fy - 8 * Math.sin(arrowAngle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          }
        }
      });

      // Draw target nucleus at center (Rutherford mode)
      if (modelMode === 'rutherford') {
        const presetObj = PRESETS[selectedPreset] || { color: '#ef4444', radius: 10, name: 'Custom' };
        const radius = presetObj.radius || 10;
        const color = presetObj.color || '#fbbf24';

        // Draw radial glow
        const glowRad = radius * 3.5;
        const nGradient = ctx.createRadialGradient(CENTER_X, CENTER_Y, radius * 0.2, CENTER_X, CENTER_Y, glowRad);
        nGradient.addColorStop(0, `${color}ff`);
        nGradient.addColorStop(0.2, `${color}66`);
        nGradient.addColorStop(0.6, `${color}15`);
        nGradient.addColorStop(1, `${color}00`);
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, glowRad, 0, Math.PI * 2);
        ctx.fillStyle = nGradient;
        ctx.fill();

        // Draw solid nucleus core
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label for nucleus
        ctx.fillStyle = color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${presetObj.name || 'Nucleus'} (+${nucleusZ}e)`, CENTER_X, CENTER_Y - radius - 8);
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, modelMode, selectedPreset, nucleusZ, alphaEnergy, beamPosition, beamWidth, firingRate, continuousFiring, showTracks, persistentTracks, showForces, simSpeed]);


  // --- ANGLE HISTOGRAM CALCULATION ---
  // Create 12 bins of 15-degree width from 0 to 180 degrees
  const BIN_WIDTH = 15;
  const NUM_BINS = 12;
  const binnedData = useMemo(() => {
    const bins = Array.from({ length: NUM_BINS }, (_, i) => ({
      min: i * BIN_WIDTH,
      max: (i + 1) * BIN_WIDTH,
      count: 0,
      percent: 0
    }));

    if (scatteringAngles.length === 0) return bins;

    scatteringAngles.forEach(angle => {
      // Clamp just in case
      const clampedAngle = Math.max(0, Math.min(179.9, angle));
      const binIdx = Math.floor(clampedAngle / BIN_WIDTH);
      if (binIdx >= 0 && binIdx < NUM_BINS) {
        bins[binIdx].count += 1;
      }
    });

    bins.forEach(b => {
      b.percent = (b.count / scatteringAngles.length) * 100;
    });

    return bins;
  }, [scatteringAngles]);

  const maxBinCount = useMemo(() => {
    return Math.max(...binnedData.map(b => b.count), 1);
  }, [binnedData]);


  // --- JSX RENDER ---
  return (
    <div className="w-full h-full h-full flex flex-col text-white font-sans select-none">
      
      {/* 1. Header Navigation Bar */}
      

      {/* 2. Main Layout Area */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        
        {/* LEFT COLUMN: Simulation Canvas and Stats */}
        <div className="flex-1 flex flex-col items-center p-6 gap-6 overflow-y-auto">
          
          {/* Canvas Wrapper */}
          <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-full max-w-[800px]">
            
            {/* Screen Overlay Title Labels */}
            <div className="absolute top-4 left-4 /70 border border-white/10 rounded-lg p-2.5 text-xs select-none">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px]">Active Model</span>
              <span className="font-bold text-white text-sm">
                {modelMode === 'rutherford' ? 'Rutherford Nuclear Atom' : 'Thomson Plum Pudding Atom'}
              </span>
            </div>

            <div className="absolute top-4 right-4 text-right /70 border border-white/10 rounded-lg p-2.5 text-xs select-none">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px]">Target Nucleus</span>
              <span className="font-bold text-white text-sm">
                {modelMode === 'rutherford' ? `${PRESETS[selectedPreset]?.name || 'Custom (Z=' + nucleusZ + ')'}` : 'Diffuse Positive Cloud'}
              </span>
              <span className="text-emerald-400 block font-mono text-xs font-semibold">Z = {nucleusZ}</span>
            </div>

            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block w-full h-auto aspect-[8/5] cursor-default"
            />

            {/* Simulated beam label */}
            <div className="absolute bottom-4 left-4 text-xs font-mono text-slate-400 /80 px-2 py-1 rounded border border-white/5">
              Alpha Beam Emitter: {alphaEnergy.toFixed(1)} MeV
            </div>
          </div>

          {/* Quick Info & Interactions Helper */}
          <div className="w-full max-w-[800px] flex flex-wrap gap-4 justify-between items-center text-xs text-slate-400 px-2 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400" />
              Alpha particles have charge +2e and mass ~4 amu.
            </span>
            <div className="flex gap-4">
              <button 
                onClick={handleFireSweep} 
                className="text-emerald-400 hover:text-emerald-300 font-bold border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-all"
              >
                Launch Flood Sweep (15 particles)
              </button>
              <button 
                onClick={handleClearData} 
                className="text-rose-400 hover:text-rose-300 font-bold border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all"
              >
                Clear Screen & Stats
              </button>
            </div>
          </div>

          {/* Real-time statistics widgets */}
          <div className="w-full max-w-[800px] grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="border border-white/5 rounded-xl p-4 flex flex-col justify-between" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fired Alphas</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black font-mono text-white">{stats.fired}</span>
              </div>
            </div>

            <div className="border border-white/5 rounded-xl p-4 flex flex-col justify-between" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Detected / Escaped</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black font-mono text-slate-300">{stats.detected}</span>
              </div>
            </div>

            <div className="border border-white/5 rounded-xl p-4 flex flex-col justify-between" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Backscattered ({'>'}90°)</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black font-mono text-amber-400">
                  {stats.backscattered}
                </span>
                <span className="text-xs text-slate-400">
                  ({stats.detected > 0 ? ((stats.backscattered / stats.detected) * 100).toFixed(2) : 0}%)
                </span>
              </div>
            </div>

            <div className="border border-white/5 rounded-xl p-4 flex flex-col justify-between" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Max Deflection</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black font-mono text-emerald-400">{stats.maxAngle.toFixed(1)}°</span>
              </div>
            </div>

          </div>

          {/* Energy Monitor Section */}
          <div className="w-full max-w-[800px] border border-white/5 rounded-xl p-4" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-sky-400" />
              <span>Real-Time Energetics Monitor (Last Particle)</span>
            </h3>
            
            {energyMonitor.active ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="/40 p-2 rounded border border-white/5">
                    <span className="text-slate-400 block text-[9px]">KINETIC ENERGY (KE)</span>
                    <span className="text-emerald-400 font-bold">{energyMonitor.ke.toFixed(1)} units</span>
                  </div>
                  <div className="/40 p-2 rounded border border-white/5">
                    <span className="text-slate-400 block text-[9px]">POTENTIAL ENERGY (PE)</span>
                    <span className="text-amber-400 font-bold">{energyMonitor.pe.toFixed(1)} units</span>
                  </div>
                  <div className="/40 p-2 rounded border border-white/5">
                    <span className="text-slate-400 block text-[9px]">TOTAL MECHANICAL ENERGY</span>
                    <span className="text-white font-bold">{(energyMonitor.total).toFixed(1)} units</span>
                  </div>
                </div>

                {/* Energy balance bar */}
                <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                  <div 
                    style={{ width: `${(energyMonitor.ke / Math.max(energyMonitor.total, 1)) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all duration-75"
                    title="Kinetic Energy Share"
                  />
                  <div 
                    style={{ width: `${(energyMonitor.pe / Math.max(energyMonitor.total, 1)) * 100}%` }}
                    className="bg-amber-500 h-full transition-all duration-75"
                    title="Potential Energy Share"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Pure Kinetic (Infinite Separation)</span>
                  <span>Pure Potential (Closest Approach)</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-3">
                No active alpha particles in field. Launch particles to monitor energy conservation.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Controls Sidebar */}
        <aside style={{ position: 'absolute', top: '90px', right: '20px', width: '320px', maxHeight: 'calc(100% - 110px)', overflowY: 'auto', background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white', zIndex: 10, pointerEvents: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Section: Model Mode Selector */}
          <div className="p-5 border-b border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-400" />
              <span>Atomic Model Mode</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setModelMode('rutherford');
                  handleClearData();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                  modelMode === 'rutherford' 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                    : '/40 border-white/5 text-slate-400 hover:text-slate-200 hover:'
                }`}
              >
                <span className="font-bold text-xs uppercase tracking-wider">Rutherford Model</span>
                <span className="text-[10px] text-slate-400 mt-1 leading-tight block">
                  Concentrated core at center causes major backscattering.
                </span>
              </button>

              <button
                onClick={() => {
                  setModelMode('plumPudding');
                  handleClearData();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                  modelMode === 'plumPudding' 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                    : '/40 border-white/5 text-slate-400 hover:text-slate-200 hover:'
                }`}
              >
                <span className="font-bold text-xs uppercase tracking-wider">Plum Pudding</span>
                <span className="text-[10px] text-slate-400 mt-1 leading-tight block">
                  Diffuse positive charge. Particles pass straight through.
                </span>
              </button>
            </div>
          </div>

          {/* Section: Target Nucleus Controls */}
          {modelMode === 'rutherford' && (
            <div className="p-5 border-b border-white/5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Settings2 size={14} className="text-amber-400" />
                <span>Target Element Presets</span>
              </h3>

              <div className="flex flex-wrap gap-1.5">
                {Object.keys(PRESETS).map(key => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedPreset === key 
                        ? ' border-amber-500 text-amber-400' 
                        : '/40 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {PRESETS[key].symbol}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedPreset('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedPreset === 'custom' 
                      ? ' border-amber-500 text-amber-400' 
                      : '/40 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Z
                </button>
              </div>

              {/* Atomic number slider */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Target Atomic Number (Z)</span>
                  <span className="font-mono text-amber-400 font-bold">{nucleusZ} protons</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={nucleusZ}
                  onChange={(e) => {
                    setNucleusZ(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                />
                <span className="text-[10px] text-slate-500 leading-tight block">
                  Increasing Z increases repulsive charge force (F ∝ Z), creating wider deflection angles.
                </span>
              </div>
            </div>
          )}

          {/* Section: Alpha Beam Physics Sliders */}
          <div className="p-5 border-b border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders size={14} className="text-cyan-400" />
              <span>Alpha Beam Parameters</span>
            </h3>

            {/* Particle Energy Speed */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Alpha Particle Energy</span>
                <span className="font-mono text-cyan-400 font-bold">{alphaEnergy.toFixed(1)} MeV</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.5"
                value={alphaEnergy}
                onChange={(e) => setAlphaEnergy(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-500" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
              />
              <span className="text-[10px] text-slate-500 leading-tight block">
                Higher energy increases incoming speed. Faster particles spend less time in the electric field, leading to smaller deflection angles.
              </span>
            </div>

            {/* Impact Parameter Offset */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Beam Vertical Align</span>
                <span className="font-mono text-cyan-400 font-bold">{beamPosition > 0 ? `+${beamPosition}` : beamPosition} px</span>
              </div>
              <input
                type="range"
                min="-120"
                max="120"
                value={beamPosition}
                onChange={(e) => setBeamPosition(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-500" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
              />
            </div>

            {/* Beam Spread Width */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Beam Spread (Width)</span>
                <span className="font-mono text-cyan-400 font-bold">{beamWidth} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="160"
                value={beamWidth}
                onChange={(e) => setBeamWidth(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-500" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
              />
              <span className="text-[10px] text-slate-500 leading-tight block">
                Defines the vertical dispersion of incoming alphas. Broad sweeps show multiple deflection curves at once.
              </span>
            </div>

            {/* Continuous stream toggle and speed */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Continuous Stream</span>
                <button
                  onClick={() => setContinuousFiring(!continuousFiring)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    continuousFiring 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : ' border-white/5 text-slate-400'
                  }`}
                >
                  {continuousFiring ? 'Active' : 'Disabled'}
                </button>
              </div>

              {continuousFiring && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Firing Frequency</span>
                    <span className="font-mono text-slate-400">{firingRate} particles/sec</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={firingRate}
                    onChange={(e) => setFiringRate(parseInt(e.target.value))}
                    className="w-full h-1 rounded accent-slate-400" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                  />
                </div>
              )}

              {/* Simulation speed multiplier */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Simulation Speed</span>
                  <span className="font-mono text-slate-400">{simSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 rounded accent-slate-400" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                />
              </div>
            </div>
          </div>

          {/* Section: Display Checkboxes */}
          <div className="p-5 border-b border-white/5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Display Options</h3>
            
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showTracks}
                onChange={(e) => setShowTracks(e.target.checked)}
                className="rounded border-white/10 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
              />
              <span>Draw Particle Trails</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                disabled={!showTracks}
                checked={persistentTracks}
                onChange={(e) => setPersistentTracks(e.target.checked)}
                className="rounded border-white/10 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer disabled:opacity-50" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
              />
              <span className={showTracks ? '' : 'opacity-50'}>Keep Historical Paths (Last 30)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showForces}
                onChange={(e) => setShowForces(e.target.checked)}
                className="rounded border-white/10 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
              />
              <span>Show Coulomb Force Vectors (Red Arrows)</span>
            </label>
          </div>

          {/* Section: Scattering Angle Histogram */}
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity size={14} className="text-purple-400" />
                <span>Scattering Angle Distribution</span>
              </h3>
              <span className="text-[10px] text-slate-500">
                N={scatteringAngles.length} particles
              </span>
            </div>

            {/* Custom SVG Bar Chart Histogram */}
            <div className="/60 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="h-32 w-full flex items-end gap-1.5 relative pt-4">
                
                {scatteringAngles.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-600 font-mono">
                    No data recorded yet
                  </div>
                ) : (
                  binnedData.map((bin, index) => {
                    const barHeightPct = (bin.count / maxBinCount) * 100;
                    return (
                      <div key={index} className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer">
                        {/* Bar Segment */}
                        <div 
                          style={{ height: `${Math.max(barHeightPct, 2)}%` }}
                          className={`w-full rounded-t transition-all duration-300 ${
                            bin.min >= 90 
                              ? 'bg-amber-500 hover:bg-amber-400' 
                              : 'bg-emerald-500 hover:bg-emerald-400'
                          }`}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-all origin-bottom text-[9px] text-slate-200 px-1.5 py-1 rounded border border-white/10 z-20 pointer-events-none whitespace-nowrap shadow-xl font-mono" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                          {bin.min}-{bin.max}°: {bin.count} ({bin.percent.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })
                )}

              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[9px] text-slate-500 font-semibold font-mono border-t border-white/5 pt-1.5">
                <span>0°</span>
                <span>45°</span>
                <span>90°</span>
                <span>135°</span>
                <span>180°</span>
              </div>

              {/* Educational Highlight indicator */}
              <div className="text-[10px] p-2.5 rounded-lg border border-white/5 leading-normal space-y-1.5" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded" />
                  <span className="text-slate-300 font-medium">Forward Scatter (0° - 90°)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded" />
                  <span className="text-slate-300 font-medium">Backscatter (90° - 180°)</span>
                </div>
                <p className="text-slate-400 mt-1 text-[9px]">
                  {modelMode === 'rutherford' ? (
                    <span className="text-amber-300">
                      Rutherford core creates a tail of backscattering (90°-180°). This proves a highly dense core exists!
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Plum Pudding positive charge is too weak to deflect particles above 10°. Backscattering is 0.00%.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Help theory card */}
          <div className="p-5 mt-auto border-t border-white/5" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
            <button
              onClick={() => setShowTheory(!showTheory)}
              className="w-full flex justify-between items-center text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle size={14} className="text-purple-400" />
                Theory & Historical Context
              </span>
              <ChevronRight size={14} className={`transform transition-transform ${showTheory ? 'rotate-90' : ''}`} />
            </button>

            {showTheory && (
              <div className="mt-3.5 space-y-3 text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                <p>
                  <strong>How the nucleus was discovered:</strong> In 1909, Geiger and Marsden fired alpha particles (+2e) at gold foil. Under the <em>Plum Pudding Model</em>, the massive alpha particles were expected to pass through with near-zero deflection because the positive charge was thought to be diffuse and spread out over the whole atom.
                </p>
                <p>
                  <strong>The Surprise:</strong> Approximately 1 in 8,000 alpha particles deflected by more than 90°. To explain this, Rutherford proposed that <strong>all positive charge</strong> and almost all the atomic mass resides in a tiny, highly concentrated point at the center of the atom: the <strong>nucleus</strong>.
                </p>
                <p>
                  <strong>Try it yourself:</strong> Switch between the two modes. In Plum Pudding mode, watch the particles pass straight through with minor deflections. Then, switch to Rutherford mode and fire a broad sweep of particles. Watch how the particles that pass very close to the center undergo extreme 180-degree deflections!
                </p>
              </div>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}


export default function CustomRutherfordScattering({ onBack, title }) {
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
                 <CustomRutherfordScatteringInner onBack={null} title={""} />
            </div>
        </div>
    );
}
