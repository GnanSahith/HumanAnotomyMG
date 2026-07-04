import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Sliders, Sparkles, HelpCircle, Volume2, VolumeX, Eye, Info, RefreshCw, Settings2 } from 'lucide-react';

// ==========================================
// PURE UTILITY FUNCTIONS (Defined outside Component to satisfy react-hooks/purity lint rule)
// ==========================================

/**
 * Calculates the visual radius of a ball based on its mass.
 * Uses a sub-linear scaling (cube root or power of 0.4) so that large masses don't cover the screen
 * and small masses remain clickable.
 */
const getRadiusFromMass = mass => {
  return 16 + Math.pow(mass, 0.4) * 14;
};

/**
 * Calculates the kinetic energy: KE = 0.5 * m * v^2
 */
const getKineticEnergy = (mass, vx, vy) => {
  return 0.5 * mass * (vx * vx + vy * vy);
};

/**
 * Generates a random velocity vector for spark particles.
 * Defined here to bypass React render impurity checks.
 */
const getRandomSparkVelocity = speed => {
  const angle = Math.random() * Math.PI * 2;
  const sparkSpeed = (0.2 + Math.random() * 0.8) * speed * 0.4;
  return {
    vx: Math.cos(angle) * sparkSpeed,
    vy: Math.sin(angle) * sparkSpeed
  };
};

/**
 * Simple hex color darkener for gradient shading.
 */
const darkenColor = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 + (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 + (B < 0 ? 0 : B > 255 ? 255 : B)).toString(16).slice(1);
};

/**
 * Renders an arrow with a solid arrowhead on a 2D canvas context.
 */
const drawArrow = (ctx, fromX, fromY, toX, toY, color, width = 2, label = '') => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return; // Don't draw tiny arrows

  const headLength = 9; // arrowhead length in pixels
  const angle = Math.atan2(dy, dx);

  // Draw arrow shaft
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX - 5 * Math.cos(angle), toY - 5 * Math.sin(angle)); // end slightly before head
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (label) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    // Position label offset from the center of the arrow to be readable
    const midX = fromX + dx * 0.6;
    const midY = fromY + dy * 0.6 - 8;
    ctx.fillText(label, midX, midY);
    ctx.shadowBlur = 0; // reset
  }
};

/**
 * Sound synthesizer using standard Web Audio API (completely programmatic, zero asset dependencies).
 */
const playCollisionSound = intensity => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Frequency proportional to intensity: higher speed/mass = slightly lower, beefier pitch
    const baseFreq = 180 + Math.min(100 / intensity, 400);
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.type = 'triangle';
    gain.gain.setValueAtTime(Math.min(intensity * 0.08, 0.25), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Suppress browser audio context errors
  }
};

// ==========================================
// PRESETS CONFIGURATIONS
// ==========================================
const PRESETS = [{
  name: '1D Elastic Equal Mass',
  mode: '1d',
  elasticity: 1.0,
  m1: 2.0,
  x1: 200,
  y1: 225,
  vx1: 3.0,
  vy1: 0,
  m2: 2.0,
  x2: 600,
  y2: 225,
  vx2: -3.0,
  vy2: 0,
  desc: 'Identical masses collide head-on. They completely swap velocities.'
}, {
  name: '1D Perfectly Inelastic',
  mode: '1d',
  elasticity: 0.0,
  m1: 3.0,
  x1: 200,
  y1: 225,
  vx1: 4.0,
  vy1: 0,
  m2: 1.0,
  x2: 500,
  y2: 225,
  vx2: 0,
  vy2: 0,
  desc: 'Elasticity is 0%. The balls stick together and move as a single combined body.'
}, {
  name: '1D Heavy & Light',
  mode: '1d',
  elasticity: 1.0,
  m1: 8.0,
  x1: 200,
  y1: 225,
  vx1: 2.5,
  vy1: 0,
  m2: 0.5,
  x2: 500,
  y2: 225,
  vx2: 0,
  vy2: 0,
  desc: 'Massive Ball 1 hits tiny Ball 2. Ball 2 bounces away at nearly double speed.'
}, {
  name: '2D Elastic Oblique',
  mode: '2d',
  elasticity: 1.0,
  m1: 2.5,
  x1: 250,
  y1: 160,
  vx1: 3.5,
  vy1: 1.0,
  m2: 2.5,
  x2: 550,
  y2: 290,
  vx2: -2.5,
  vy2: -1.0,
  desc: 'Balls hit off-center in 2D space, scattering away at oblique angles.'
}, {
  name: '2D Glancing Inelastic',
  mode: '2d',
  elasticity: 0.4,
  m1: 3.0,
  x1: 280,
  y1: 150,
  vx1: 3.0,
  vy1: 1.5,
  m2: 1.5,
  x2: 500,
  y2: 300,
  vx2: -1.0,
  vy2: -2.0,
  desc: 'Off-center collision with 40% elasticity. Kinetic energy is partially converted.'
}];
function CustomCollisionLabInner({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  // ==========================================
  // REACT STATE FOR UI CONTROLS
  // ==========================================
  const [activeTab, setActiveTab] = useState('setup');
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const [mode, setMode] = useState('2d'); // '1d' or '2d'
  const [elasticity, setElasticity] = useState(1.0); // 0.0 to 1.0

  // Ball 1 parameters
  const [mass1, setMass1] = useState(2.0);
  const [initVx1, setInitVx1] = useState(3.0);
  const [initVy1, setInitVy1] = useState(0.0);

  // Ball 2 parameters
  const [mass2, setMass2] = useState(2.0);
  const [initVx2, setInitVx2] = useState(-3.0);
  const [initVy2, setInitVy2] = useState(0.0);

  // Display / Toggle states
  const [showGrid, setShowGrid] = useState(true);
  const [showTrails, setShowTrails] = useState(false);
  const [showCenterOfMass, setShowCenterOfMass] = useState(true);
  const [vectorType, setVectorType] = useState('both'); // 'velocity', 'momentum', 'both', 'none'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ==========================================
  // REFS FOR SIMULATION LOOP & PHYSICAL STATE
  // ==========================================
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  // Core physical state (to prevent state rendering thrash at 60 FPS)
  const physicsStateRef = useRef({
    mode: '2d',
    elasticity: 1.0,
    isPlaying: false,
    showGrid: true,
    showTrails: false,
    showCenterOfMass: true,
    ball1: {
      x: 250,
      y: 160,
      vx: 3.5,
      vy: 1.0,
      radius: getRadiusFromMass(2.5),
      mass: 2.5,
      color: '#38bdf8',
      // sky-400 cyan
      trail: []
    },
    ball2: {
      x: 550,
      y: 290,
      vx: -2.5,
      vy: -1.0,
      radius: getRadiusFromMass(2.5),
      mass: 2.5,
      color: '#fb7185',
      // rose-400 red
      trail: []
    },
    draggedBall: null,
    // null, 1, or 2
    draggedVector: null // null, 1, or 2
  });

  // Sub-render elements: impact sparks & center of mass trails
  const sparksRef = useRef([]);
  const impactFlashRef = useRef(null);
  const comTrailRef = useRef([]);
  const tickCountRef = useRef(0);
  const initialKERef = useRef(15.0);

  // Sync sound state ref to bypass closures in animation loop
  const soundEnabledRef = useRef(soundEnabled);

  // ==========================================
  // REAL-TIME STATS DOM REF ACCESSORS
  // ==========================================
  const b1VxRef = useRef(null);
  const b1VyRef = useRef(null);
  const b1PxRef = useRef(null);
  const b1PyRef = useRef(null);
  const b1PRef = useRef(null);
  const b1KERef = useRef(null);
  const b2VxRef = useRef(null);
  const b2VyRef = useRef(null);
  const b2PxRef = useRef(null);
  const b2PyRef = useRef(null);
  const b2PRef = useRef(null);
  const b2KERef = useRef(null);
  const totalPxRef = useRef(null);
  const totalPyRef = useRef(null);
  const totalPRef = useRef(null);
  const totalKERef = useRef(null);
  const keLossRef = useRef(null);

  // ==========================================
  // CALCULATION HELPERS
  // ==========================================
  const getCenterOfMass = () => {
    const state = physicsStateRef.current;
    const m1 = state.ball1.mass;
    const m2 = state.ball2.mass;
    const totalM = m1 + m2;
    return {
      x: (state.ball1.x * m1 + state.ball2.x * m2) / totalM,
      y: (state.ball1.y * m1 + state.ball2.y * m2) / totalM
    };
  };

  // ==========================================
  // PHYSICS UPDATE & COLLISION ENGINE
  // ==========================================
  const updatePhysics = dt => {
    const state = physicsStateRef.current;
    if (!state.isPlaying) return;

    // Sub-stepping to prevent tunneling or overlaps at high speeds
    const subSteps = 8;
    const subDt = dt / subSteps;
    const scale = 50; // pixels per meter

    for (let step = 0; step < subSteps; step++) {
      // Force 1D constraint
      if (state.mode === '1d') {
        state.ball1.y = 225;
        state.ball1.vy = 0;
        state.ball2.y = 225;
        state.ball2.vy = 0;
      }

      // Move Ball 1 (if not interactive dragging)
      if (state.draggedBall !== 1) {
        state.ball1.x += state.ball1.vx * subDt * scale;
        if (state.mode === '2d') {
          state.ball1.y += state.ball1.vy * subDt * scale;
        }
      }

      // Move Ball 2 (if not interactive dragging)
      if (state.draggedBall !== 2) {
        state.ball2.x += state.ball2.vx * subDt * scale;
        if (state.mode === '2d') {
          state.ball2.y += state.ball2.vy * subDt * scale;
        }
      }

      // Boundary checks: Balls bounce off boundaries with e_wall = 1.0 (elastic)
      const walls = {
        left: 0,
        right: 800,
        top: 0,
        bottom: 450
      };
      const eWall = 1.0;

      // Ball 1 walls
      if (state.ball1.x - state.ball1.radius < walls.left) {
        state.ball1.vx = -eWall * state.ball1.vx;
        state.ball1.x = walls.left + state.ball1.radius;
      } else if (state.ball1.x + state.ball1.radius > walls.right) {
        state.ball1.vx = -eWall * state.ball1.vx;
        state.ball1.x = walls.right - state.ball1.radius;
      }
      if (state.mode === '2d') {
        if (state.ball1.y - state.ball1.radius < walls.top) {
          state.ball1.vy = -eWall * state.ball1.vy;
          state.ball1.y = walls.top + state.ball1.radius;
        } else if (state.ball1.y + state.ball1.radius > walls.bottom) {
          state.ball1.vy = -eWall * state.ball1.vy;
          state.ball1.y = walls.bottom - state.ball1.radius;
        }
      }

      // Ball 2 walls
      if (state.ball2.x - state.ball2.radius < walls.left) {
        state.ball2.vx = -eWall * state.ball2.vx;
        state.ball2.x = walls.left + state.ball2.radius;
      } else if (state.ball2.x + state.ball2.radius > walls.right) {
        state.ball2.vx = -eWall * state.ball2.vx;
        state.ball2.x = walls.right - state.ball2.radius;
      }
      if (state.mode === '2d') {
        if (state.ball2.y - state.ball2.radius < walls.top) {
          state.ball2.vy = -eWall * state.ball2.vy;
          state.ball2.y = walls.top + state.ball2.radius;
        } else if (state.ball2.y + state.ball2.radius > walls.bottom) {
          state.ball2.vy = -eWall * state.ball2.vy;
          state.ball2.y = walls.bottom - state.ball2.radius;
        }
      }

      // Ball-to-Ball collision check
      const dx = state.ball2.x - state.ball1.x;
      const dy = state.mode === '2d' ? state.ball2.y - state.ball1.y : 0;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = state.ball1.radius + state.ball2.radius;
      if (dist < minDist) {
        // Determine collision normal & tangent axes
        const nx = dist > 0 ? dx / dist : 1;
        const ny = dist > 0 ? dy / dist : 0;
        const tx = -ny;
        const ty = nx;

        // Project velocities onto normal and tangent vectors
        const v1n = state.ball1.vx * nx + state.ball1.vy * ny;
        const v1t = state.ball1.vx * tx + state.ball1.vy * ty;
        const v2n = state.ball2.vx * nx + state.ball2.vy * ny;
        const v2t = state.ball2.vx * tx + state.ball2.vy * ty;

        // Only resolve if they are moving towards each other
        if (v1n - v2n > 0) {
          const m1 = state.ball1.mass;
          const m2 = state.ball2.mass;
          const e = state.elasticity;

          // Compute post-collision normal velocities (1D Elastic/Inelastic equations)
          const v1nPrime = ((m1 - e * m2) * v1n + (1 + e) * m2 * v2n) / (m1 + m2);
          const v2nPrime = ((1 + e) * m1 * v1n + (m2 - e * m1) * v2n) / (m1 + m2);

          // Reconstruct final velocities back to X/Y axes
          state.ball1.vx = v1nPrime * nx + v1t * tx;
          state.ball1.vy = v1nPrime * ny + v1t * ty;
          state.ball2.vx = v2nPrime * nx + v2t * tx;
          state.ball2.vy = v2nPrime * ny + v2t * ty;

          // Positional correction to resolve penetration instantly (mass-weighted)
          const overlap = minDist - dist;
          const totalM = m1 + m2;
          state.ball1.x -= overlap * (m2 / totalM) * nx;
          state.ball1.y -= overlap * (m2 / totalM) * ny;
          state.ball2.x += overlap * (m1 / totalM) * nx;
          state.ball2.y += overlap * (m1 / totalM) * ny;

          // Visual/Audio feedback setup
          const relVx = state.ball1.vx - state.ball2.vx;
          const relVy = state.ball1.vy - state.ball2.vy;
          const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);
          if (relSpeed > 0.15) {
            const midX = (state.ball1.x * state.ball2.radius + state.ball2.x * state.ball1.radius) / minDist;
            const midY = (state.ball1.y * state.ball2.radius + state.ball2.y * state.ball1.radius) / minDist;

            // Create flash
            impactFlashRef.current = {
              x: midX,
              y: midY,
              radius: 4,
              maxRadius: 24 + relSpeed * 4,
              alpha: 1.0
            };

            // Spawn sparks
            const numSparks = Math.floor(12 + relSpeed * 3);
            for (let i = 0; i < numSparks; i++) {
              const sv = getRandomSparkVelocity(relSpeed);
              sparksRef.current.push({
                x: midX,
                y: midY,
                vx: sv.vx + (state.ball1.vx + state.ball2.vx) * 0.4,
                // carry system momentum bias
                vy: sv.vy + (state.ball1.vy + state.ball2.vy) * 0.4,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                color: Math.random() > 0.5 ? state.ball1.color : state.ball2.color,
                radius: 1.2 + Math.random() * 2.5
              });
            }

            // Play sound
            if (soundEnabledRef.current) {
              playCollisionSound(relSpeed * Math.max(m1, m2));
            }
          }
        }
      }
    }

    // Particle update (runs once per frame, not per substep)
    sparksRef.current.forEach(p => {
      p.x += p.vx * dt * scale;
      p.y += p.vy * dt * scale;
      p.life -= p.decay;
    });
    sparksRef.current = sparksRef.current.filter(p => p.life > 0);

    // Flash radial decay
    if (impactFlashRef.current) {
      const f = impactFlashRef.current;
      f.radius += (f.maxRadius - f.radius) * 0.25;
      f.alpha -= 0.07;
      if (f.alpha <= 0) {
        impactFlashRef.current = null;
      }
    }

    // Trail recording
    tickCountRef.current++;
    if (state.showTrails && tickCountRef.current % 2 === 0) {
      state.ball1.trail.push({
        x: state.ball1.x,
        y: state.ball1.y
      });
      if (state.ball1.trail.length > 45) state.ball1.trail.shift();
      state.ball2.trail.push({
        x: state.ball2.x,
        y: state.ball2.y
      });
      if (state.ball2.trail.length > 45) state.ball2.trail.shift();
      const com = getCenterOfMass();
      comTrailRef.current.push(com);
      if (comTrailRef.current.length > 45) comTrailRef.current.shift();
    }
  };

  // ==========================================
  // RENDER ENGINE (DRAWING TO CANVAS)
  // ==========================================
  const drawBall = (ctx, ball, numberLabel) => {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.1, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.25, ball.color);
    gradient.addColorStop(1.0, darkenColor(ball.color, 0.45));
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0; // turn off shadow for outline
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label texts
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${ball.mass.toFixed(1)} kg`, ball.x, ball.y - 2);
    ctx.font = '8px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`Ball ${numberLabel}`, ball.x, ball.y + 10);
    ctx.restore();
  };
  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = physicsStateRef.current;

    // Clear and draw grid backing
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Coordinate Grid lines
    if (state.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const spacing = 50; // 50px = 1m
      for (let x = spacing; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.font = '8px monospace';
        ctx.fillText(`${(x / spacing).toFixed(1)}m`, x + 3, canvas.height - 4);
      }
      for (let y = spacing; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.font = '8px monospace';
        ctx.fillText(`${(y / spacing).toFixed(1)}m`, 4, y - 4);
      }
      ctx.setLineDash([]);
    }

    // 1D center track guide line
    if (state.mode === '1d') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 225);
      ctx.lineTo(800, 225);
      ctx.stroke();
    }

    // Draw Trails
    if (state.showTrails) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      // Ball 1 Trail
      if (state.ball1.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(state.ball1.trail[0].x, state.ball1.trail[0].y);
        for (let i = 1; i < state.ball1.trail.length; i++) {
          ctx.lineTo(state.ball1.trail[i].x, state.ball1.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.stroke();
      }

      // Ball 2 Trail
      if (state.ball2.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(state.ball2.trail[0].x, state.ball2.trail[0].y);
        for (let i = 1; i < state.ball2.trail.length; i++) {
          ctx.lineTo(state.ball2.trail[i].x, state.ball2.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(251, 113, 133, 0.15)';
        ctx.stroke();
      }

      // CoM Trail
      if (state.showCenterOfMass && comTrailRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(comTrailRef.current[0].x, comTrailRef.current[0].y);
        for (let i = 1; i < comTrailRef.current.length; i++) {
          ctx.lineTo(comTrailRef.current[i].x, comTrailRef.current[i].y);
        }
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // Draw Center of Mass (+)
    if (state.showCenterOfMass) {
      const com = getCenterOfMass();
      ctx.save();
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)'; // yellow
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(com.x, com.y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(com.x - 10, com.y);
      ctx.lineTo(com.x + 10, com.y);
      ctx.moveTo(com.x, com.y - 10);
      ctx.lineTo(com.x, com.y + 10);
      ctx.stroke();
      ctx.fillStyle = '#eab308';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText('CoM', com.x + 12, com.y - 3);
      ctx.restore();
    }

    // Draw Particles Sparks
    sparksRef.current.forEach(p => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
      ctx.restore();
    });

    // Draw collision shockwave/impact flash
    if (impactFlashRef.current) {
      const f = impactFlashRef.current;
      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${f.alpha})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253, 224, 71, ${f.alpha * 0.4})`; // soft gold glow
      ctx.fill();
      ctx.restore();
    }

    // Draw Ball 1 and Ball 2
    drawBall(ctx, state.ball1, '1');
    drawBall(ctx, state.ball2, '2');

    // Draw Vector Overlays (Velocity & Momentum)
    const vScale = 15; // 1m/s = 15px
    const pScale = 10; // 1kg*m/s = 10px

    if (vectorType === 'velocity' || vectorType === 'both') {
      const b1 = state.ball1;
      const b2 = state.ball2;
      if (Math.abs(b1.vx) > 0.02 || Math.abs(b1.vy) > 0.02) {
        const speed1 = Math.sqrt(b1.vx * b1.vx + b1.vy * b1.vy);
        drawArrow(ctx, b1.x, b1.y, b1.x + b1.vx * vScale, b1.y + b1.vy * vScale, '#10b981', 2.2, `${speed1.toFixed(1)}m/s`);
      }
      if (Math.abs(b2.vx) > 0.02 || Math.abs(b2.vy) > 0.02) {
        const speed2 = Math.sqrt(b2.vx * b2.vx + b2.vy * b2.vy);
        drawArrow(ctx, b2.x, b2.y, b2.x + b2.vx * vScale, b2.y + b2.vy * vScale, '#10b981', 2.2, `${speed2.toFixed(1)}m/s`);
      }
    }
    if (vectorType === 'momentum' || vectorType === 'both') {
      const b1 = state.ball1;
      const b2 = state.ball2;
      const px1 = b1.vx * b1.mass;
      const py1 = b1.vy * b1.mass;
      const pMag1 = Math.sqrt(px1 * px1 + py1 * py1);
      const px2 = b2.vx * b2.mass;
      const py2 = b2.vy * b2.mass;
      const pMag2 = Math.sqrt(px2 * px2 + py2 * py2);

      // If we draw both, offset momentum vector vertically by 6px to avoid overlaying green arrows
      const offset = vectorType === 'both' ? 8 : 0;
      if (pMag1 > 0.02) {
        drawArrow(ctx, b1.x, b1.y + offset, b1.x + px1 * pScale, b1.y + py1 * pScale + offset, '#f59e0b', 2.2, `${pMag1.toFixed(1)}kg·m/s`);
      }
      if (pMag2 > 0.02) {
        drawArrow(ctx, b2.x, b2.y + offset, b2.x + px2 * pScale, b2.y + py2 * pScale + offset, '#f59e0b', 2.2, `${pMag2.toFixed(1)}kg·m/s`);
      }
    }
  };
  const updateHUD = () => {
    const state = physicsStateRef.current;

    // Ball 1 Stats
    const m1 = state.ball1.mass;
    const vx1 = state.ball1.vx;
    const vy1 = state.ball1.vy;
    const v1Mag = Math.sqrt(vx1 * vx1 + vy1 * vy1);
    const px1 = m1 * vx1;
    const py1 = m1 * vy1;
    const p1Mag = m1 * v1Mag;
    const ke1 = getKineticEnergy(m1, vx1, vy1);

    // Ball 2 Stats
    const m2 = state.ball2.mass;
    const vx2 = state.ball2.vx;
    const vy2 = state.ball2.vy;
    const v2Mag = Math.sqrt(vx2 * vx2 + vy2 * vy2);
    const px2 = m2 * vx2;
    const py2 = m2 * vy2;
    const p2Mag = m2 * v2Mag;
    const ke2 = getKineticEnergy(m2, vx2, vy2);

    // System Totals
    const totalPx = px1 + px2;
    const totalPy = py1 + py2;
    const totalPMag = Math.sqrt(totalPx * totalPx + totalPy * totalPy);
    const totalKE = ke1 + ke2;
    const keLoss = Math.max(0, initialKERef.current - totalKE);

    // Write directly to HTML elements to prevent thrashing
    if (b1VxRef.current) b1VxRef.current.textContent = `${vx1.toFixed(2)}`;
    if (b1VyRef.current) b1VyRef.current.textContent = `${vy1.toFixed(2)}`;
    if (b1PxRef.current) b1PxRef.current.textContent = `${px1.toFixed(2)}`;
    if (b1PyRef.current) b1PyRef.current.textContent = `${py1.toFixed(2)}`;
    if (b1PRef.current) b1PRef.current.textContent = `${p1Mag.toFixed(2)}`;
    if (b1KERef.current) b1KERef.current.textContent = `${ke1.toFixed(2)} J`;
    if (b2VxRef.current) b2VxRef.current.textContent = `${vx2.toFixed(2)}`;
    if (b2VyRef.current) b2VyRef.current.textContent = `${vy2.toFixed(2)}`;
    if (b2PxRef.current) b2PxRef.current.textContent = `${px2.toFixed(2)}`;
    if (b2PyRef.current) b2PyRef.current.textContent = `${py2.toFixed(2)}`;
    if (b2PRef.current) b2PRef.current.textContent = `${p2Mag.toFixed(2)}`;
    if (b2KERef.current) b2KERef.current.textContent = `${ke2.toFixed(2)} J`;
    if (totalPxRef.current) totalPxRef.current.textContent = `${totalPx.toFixed(2)}`;
    if (totalPyRef.current) totalPyRef.current.textContent = `${totalPy.toFixed(2)}`;
    if (totalPRef.current) totalPRef.current.textContent = `${totalPMag.toFixed(2)}`;
    if (totalKERef.current) totalKERef.current.textContent = `${totalKE.toFixed(2)} J`;
    if (keLossRef.current) {
      const lossPct = initialKERef.current > 0.05 ? keLoss / initialKERef.current * 100 : 0.0;
      keLossRef.current.textContent = `${keLoss.toFixed(2)} J (${lossPct.toFixed(1)}%)`;
    }
  };

  // Latest refs pattern to keep functions fresh inside tick loop without restarting it
  const updatePhysicsRef = useRef(updatePhysics);
  const drawFrameRef = useRef(drawFrame);
  const updateHUDRef = useRef(updateHUD);
  useEffect(() => {
    updatePhysicsRef.current = updatePhysics;
    drawFrameRef.current = drawFrame;
    updateHUDRef.current = updateHUD;
  });

  // ==========================================
  // THE TICK ANIMATION LOOP
  // ==========================================
  useEffect(() => {
    let lastTime = performance.now();
    const tick = now => {
      // Delta time capped at 0.1s to prevent extreme jumps during lag spikes
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      updatePhysicsRef.current(dt);
      drawFrameRef.current();
      updateHUDRef.current();
      requestRef.current = requestAnimationFrame(tick);
    };
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Sync state variables to the ref so the animation loop gets updates instantly
  useEffect(() => {
    physicsStateRef.current.mode = mode;
    physicsStateRef.current.elasticity = elasticity;
    physicsStateRef.current.isPlaying = isPlaying;
    physicsStateRef.current.showGrid = showGrid;
    physicsStateRef.current.showTrails = showTrails;
    physicsStateRef.current.showCenterOfMass = showCenterOfMass;
  }, [mode, elasticity, isPlaying, showGrid, showTrails, showCenterOfMass]);

  // Keep sound enabled sync'd
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // ==========================================
  // PRESET LOADER
  // ==========================================
  const loadPreset = preset => {
    setIsPlaying(false);
    physicsStateRef.current.isPlaying = false;
    physicsStateRef.current.mode = preset.mode;
    setMode(preset.mode);
    physicsStateRef.current.elasticity = preset.elasticity;
    setElasticity(preset.elasticity);

    // Ball 1 Setup
    setMass1(preset.m1);
    physicsStateRef.current.ball1.mass = preset.m1;
    physicsStateRef.current.ball1.radius = getRadiusFromMass(preset.m1);
    physicsStateRef.current.ball1.x = preset.x1;
    physicsStateRef.current.ball1.y = preset.y1;
    physicsStateRef.current.ball1.vx = preset.vx1;
    physicsStateRef.current.ball1.vy = preset.vy1;
    physicsStateRef.current.ball1.trail = [];
    setInitVx1(preset.vx1);
    setInitVy1(preset.vy1);

    // Ball 2 Setup
    setMass2(preset.m2);
    physicsStateRef.current.ball2.mass = preset.m2;
    physicsStateRef.current.ball2.radius = getRadiusFromMass(preset.m2);
    physicsStateRef.current.ball2.x = preset.x2;
    physicsStateRef.current.ball2.y = preset.y2;
    physicsStateRef.current.ball2.vx = preset.vx2;
    physicsStateRef.current.ball2.vy = preset.vy2;
    physicsStateRef.current.ball2.trail = [];
    setInitVx2(preset.vx2);
    setInitVy2(preset.vy2);

    // Reset HUD and auxiliary arrays
    comTrailRef.current = [];
    sparksRef.current = [];
    impactFlashRef.current = null;
    initialKERef.current = getKineticEnergy(preset.m1, preset.vx1, preset.vy1) + getKineticEnergy(preset.m2, preset.vx2, preset.vy2);
    drawFrame();
    updateHUD();
  };

  // ==========================================
  // CONTROL EVENT HANDLERS
  // ==========================================
  const togglePlay = () => {
    const state = physicsStateRef.current;
    if (!state.isPlaying) {
      // Re-calculate initial Kinetic Energy whenever starting from rest
      initialKERef.current = getKineticEnergy(state.ball1.mass, state.ball1.vx, state.ball1.vy) + getKineticEnergy(state.ball2.mass, state.ball2.vx, state.ball2.vy);
    }
    setIsPlaying(!isPlaying);
  };
  const handleReset = () => {
    setIsPlaying(false);
    physicsStateRef.current.isPlaying = false;
    const state = physicsStateRef.current;
    if (state.mode === '1d') {
      state.ball1.x = 220;
      state.ball1.y = 225;
      state.ball2.x = 580;
      state.ball2.y = 225;
    } else {
      state.ball1.x = 250;
      state.ball1.y = 175;
      state.ball2.x = 550;
      state.ball2.y = 275;
    }

    // Restore velocities to the UI slider parameters
    state.ball1.vx = initVx1;
    state.ball1.vy = state.mode === '2d' ? initVy1 : 0;
    state.ball2.vx = initVx2;
    state.ball2.vy = state.mode === '2d' ? initVy2 : 0;

    // Clear particles & trails
    state.ball1.trail = [];
    state.ball2.trail = [];
    comTrailRef.current = [];
    sparksRef.current = [];
    impactFlashRef.current = null;
    initialKERef.current = getKineticEnergy(state.ball1.mass, state.ball1.vx, state.ball1.vy) + getKineticEnergy(state.ball2.mass, state.ball2.vx, state.ball2.vy);
    drawFrame();
    updateHUD();
  };
  const handleStep = () => {
    if (isPlaying) return;
    updatePhysics(1 / 60);
    drawFrame();
    updateHUD();
  };
  const handleMassChange = (ballNum, val) => {
    const state = physicsStateRef.current;
    if (ballNum === 1) {
      setMass1(val);
      state.ball1.mass = val;
      state.ball1.radius = getRadiusFromMass(val);
    } else {
      setMass2(val);
      state.ball2.mass = val;
      state.ball2.radius = getRadiusFromMass(val);
    }
    if (!state.isPlaying) {
      drawFrame();
      updateHUD();
    }
  };
  const handleVelocitySliderChange = (ballNum, axis, val) => {
    const state = physicsStateRef.current;
    if (ballNum === 1) {
      if (axis === 'x') {
        setInitVx1(val);
        state.ball1.vx = val;
      } else {
        setInitVy1(val);
        state.ball1.vy = val;
      }
    } else {
      if (axis === 'x') {
        setInitVx2(val);
        state.ball2.vx = val;
      } else {
        setInitVy2(val);
        state.ball2.vy = val;
      }
    }
    if (!state.isPlaying) {
      drawFrame();
      updateHUD();
    }
  };
  const handleModeToggle = newMode => {
    setMode(newMode);
    const state = physicsStateRef.current;
    state.mode = newMode;
    if (newMode === '1d') {
      state.ball1.y = 225;
      state.ball1.vy = 0;
      state.ball2.y = 225;
      state.ball2.vy = 0;
      setInitVy1(0);
      setInitVy2(0);
    } else {
      // Give subtle vertical offsets to make 2D interesting right away
      if (state.ball1.y === 225 && state.ball2.y === 225) {
        state.ball1.y = 175;
        state.ball2.y = 275;
      }
    }
    if (!state.isPlaying) {
      drawFrame();
      updateHUD();
    }
  };

  // ==========================================
  // INTERACTIVE CANVAS MOUSE HANDLING
  // ==========================================
  const getMouseCoordinates = evt => {
    const canvas = canvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) / rect.width * canvas.width,
      y: (evt.clientY - rect.top) / rect.height * canvas.height
    };
  };
  const handleCanvasMouseDown = evt => {
    const coords = getMouseCoordinates(evt);
    const state = physicsStateRef.current;
    const vScale = 15; // velocity display multiplier

    // 1. Check if clicking the velocity vector arrow heads
    const checkVectorHead = (ball, index) => {
      if (vectorType === 'none' || vectorType === 'momentum') return false;
      const hx = ball.x + ball.vx * vScale;
      const hy = state.mode === '2d' ? ball.y + ball.vy * vScale : ball.y;
      const dx = coords.x - hx;
      const dy = coords.y - hy;
      if (dx * dx + dy * dy < 144) {
        // Click radius of 12px around head
        state.draggedVector = index;
        return true;
      }
      return false;
    };
    if (checkVectorHead(state.ball1, 1)) return;
    if (checkVectorHead(state.ball2, 2)) return;

    // 2. Check if clicking inside the circles
    const checkBallClick = (ball, index) => {
      const dx = coords.x - ball.x;
      const dy = state.mode === '2d' ? coords.y - ball.y : 0; // lock y check in 1D
      if (dx * dx + dy * dy < ball.radius * ball.radius) {
        state.draggedBall = index;
        return true;
      }
      return false;
    };
    if (checkBallClick(state.ball1, 1)) return;
    if (checkBallClick(state.ball2, 2)) return;
  };
  const handleCanvasMouseMove = evt => {
    const coords = getMouseCoordinates(evt);
    const state = physicsStateRef.current;
    const vScale = 15;

    // Check if cursor should change to indicate interactive hover
    const canvas = canvasRef.current;
    if (canvas && !state.draggedBall && !state.draggedVector) {
      let hovering = false;
      const checkHover = ball => {
        // Ball body hover
        const dx = coords.x - ball.x;
        const dy = state.mode === '2d' ? coords.y - ball.y : 0;
        if (dx * dx + dy * dy < ball.radius * ball.radius) {
          canvas.style.cursor = 'grab';
          hovering = true;
        }
        // Vector head hover
        if (!hovering && (vectorType === 'velocity' || vectorType === 'both')) {
          const hx = ball.x + ball.vx * vScale;
          const hy = state.mode === '2d' ? ball.y + ball.vy * vScale : ball.y;
          const vdx = coords.x - hx;
          const vdy = coords.y - hy;
          if (vdx * vdx + vdy * vdy < 144) {
            canvas.style.cursor = 'crosshair';
            hovering = true;
          }
        }
      };
      checkHover(state.ball1);
      if (!hovering) checkHover(state.ball2);
      if (!hovering) canvas.style.cursor = 'default';
    }

    // Apply interactive drags
    if (state.draggedBall) {
      const ball = state.draggedBall === 1 ? state.ball1 : state.ball2;
      ball.x = Math.max(ball.radius, Math.min(800 - ball.radius, coords.x));
      if (state.mode === '2d') {
        ball.y = Math.max(ball.radius, Math.min(450 - ball.radius, coords.y));
      }
      ball.trail = [];
      comTrailRef.current = [];
      drawFrame();
      updateHUD();
    } else if (state.draggedVector) {
      const bIndex = state.draggedVector;
      const ball = bIndex === 1 ? state.ball1 : state.ball2;

      // Compute new velocities based on vector drag distance
      let vx = (coords.x - ball.x) / vScale;
      let vy = state.mode === '2d' ? (coords.y - ball.y) / vScale : 0;

      // Clamp maximum velocity to +/- 6.0 m/s
      vx = Math.max(-6.0, Math.min(6.0, vx));
      vy = Math.max(-6.0, Math.min(6.0, vy));
      ball.vx = vx;
      ball.vy = vy;

      // Sync values back to React slider states
      if (bIndex === 1) {
        setInitVx1(vx);
        setInitVy1(vy);
      } else {
        setInitVx2(vx);
        setInitVy2(vy);
      }
      drawFrame();
      updateHUD();
    }
  };
  const handleCanvasMouseUp = () => {
    const state = physicsStateRef.current;
    state.draggedBall = null;
    state.draggedVector = null;
  };

  // ==========================================
  // LAYOUT RENDERING
  // ==========================================
  return <div className="w-full h-full flex flex-col text-slate-100 font-sans antialiased overflow-hidden" style={{
    height: '100%'
  }}>
            

            {/* Main Interactive Screen */}
            <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'none'
    }}>
                
                {/* Left/Center: Canvas Viewport (Full Screen Left) */}
                <div style={{
        position: 'absolute',
        left: 0,
        right: '340px',
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}>
                    {/* Interactive Canvas Viewport */}
                    <div className="relative w-full flex-1 overflow-hidden flex flex-col bg-[#0a0a1a]">
                        <div className="px-4 py-2.5 /80 border-b border-white/5 flex justify-between items-center text-xs text-slate-400 font-medium z-10 bg-[rgba(20,20,30,0.8)]">
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Interactive Physics Viewport (800m × 450m scale)</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Drag balls to move. Drag arrow heads to alter velocity.</span>
                            </div>
                        </div>

                        {/* HTML5 Canvas */}
                        <div className="relative flex-1 w-full cursor-default">
                            <canvas ref={canvasRef} width={800} height={450} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }} className="absolute inset-0 block" />
                        </div>

                        {/* Top-Right Canvas Overlay (Fast Readout) */}
                        <div className="absolute top-12 left-4 /70 backdrop-blur-md p-3 rounded-xl border border-white/5 text-xs flex flex-col gap-1.5 shadow-lg select-none pointer-events-none bg-[rgba(20,20,30,0.8)] z-10">
                            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] border-b border-white/5 pb-1 mb-1">
                                System Overview
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Total KE:</span>
                                <span ref={totalKERef} className="font-mono text-emerald-400">0.00 J</span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-400">KE Loss:</span>
                                <span ref={keLossRef} className="font-mono text-rose-400">0.00 J (0.0%)</span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Total |p|:</span>
                                <span ref={totalPRef} className="font-mono text-amber-400">0.00 kg·m/s</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Numerical Dashboard Panel */}
                    <div className="backdrop-blur-md border-t border-white/5 p-5 shadow-xl flex flex-col gap-4 z-10 shrink-0" style={{
          background: 'rgba(20, 20, 30, 0.95)',
          color: 'white'
        }}>
                        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                            <Info size={18} className="text-sky-400" />
                            <h3 className="font-semibold text-white m-0">Metrics Dashboard</h3>
                        </div>

                        {/* Stats Table */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Ball 1 Card */}
                            <div className="p-4 rounded-xl border border-sky-500/20 flex flex-col gap-2.5 bg-sky-950/10">
                                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Ball 1 (Cyan)
                                    </span>
                                    <span className="text-[10px] bg-sky-950/50 text-sky-300 px-2 py-0.5 rounded border border-sky-800/40">
                                        Mass: {mass1.toFixed(1)} kg
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 font-mono">
                                    <div className="text-slate-400">Velocity X:</div>
                                    <div className="text-right text-sky-300"><span ref={b1VxRef}>0.00</span> m/s</div>
                                    <div className="text-slate-400">Velocity Y:</div>
                                    <div className="text-right text-sky-300"><span ref={b1VyRef}>0.00</span> m/s</div>
                                    <div className="text-slate-400">Momentum X:</div>
                                    <div className="text-right text-amber-300"><span ref={b1PxRef}>0.00</span> kg·m/s</div>
                                    <div className="text-slate-400">Momentum Y:</div>
                                    <div className="text-right text-amber-300"><span ref={b1PyRef}>0.00</span> kg·m/s</div>
                                    <div className="text-slate-400 font-semibold">Total |p|:</div>
                                    <div className="text-right text-amber-400 font-semibold"><span ref={b1PRef}>0.00</span> kg·m/s</div>
                                    <div className="text-slate-400 font-semibold border-t border-white/5 pt-1">Kinetic Energy:</div>
                                    <div className="text-right text-emerald-400 font-semibold border-t border-white/5 pt-1"><span ref={b1KERef}>0.00 J</span></div>
                                </div>
                            </div>

                            {/* Ball 2 Card */}
                            <div className="p-4 rounded-xl border border-rose-500/20 flex flex-col gap-2.5 bg-rose-950/10">
                                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Ball 2 (Rose)
                                    </span>
                                    <span className="text-[10px] bg-rose-950/50 text-rose-300 px-2 py-0.5 rounded border border-rose-800/40">
                                        Mass: {mass2.toFixed(1)} kg
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 font-mono">
                                    <div className="text-slate-400">Velocity X:</div>
                                    <div className="text-right text-rose-300"><span ref={b2VxRef}>0.00</span> m/s</div>
                                    <div className="text-slate-400">Velocity Y:</div>
                                    <div className="text-right text-rose-300"><span ref={b2VyRef}>0.00</span> m/s</div>
                                    <div className="text-slate-400">Momentum X:</div>
                                    <div className="text-right text-amber-300"><span ref={b2PxRef}>0.00</span> kg·m/s</div>
                                    <div className="text-slate-400">Momentum Y:</div>
                                    <div className="text-right text-amber-300"><span ref={b2PyRef}>0.00</span> kg·m/s</div>
                                    <div className="text-slate-400 font-semibold">Total |p|:</div>
                                    <div className="text-right text-amber-400 font-semibold"><span ref={b2PRef}>0.00</span> kg·m/s</div>
                                    <div className="text-slate-400 font-semibold border-t border-white/5 pt-1">Kinetic Energy:</div>
                                    <div className="text-right text-emerald-400 font-semibold border-t border-white/5 pt-1"><span ref={b2KERef}>0.00 J</span></div>
                                </div>
                            </div>

                            {/* Total System Card */}
                            <div className="p-4 rounded-xl border border-white/5 flex flex-col gap-2.5 bg-white/5">
                                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                                    <span className="font-bold text-white flex items-center gap-1.5">
                                        Total System Values
                                    </span>
                                    <span className="text-[9px] uppercase tracking-wider text-slate-500">
                                        Conserved States
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 font-mono">
                                    <div className="text-slate-400">Net Momentum Px:</div>
                                    <div className="text-right text-slate-200"><span ref={totalPxRef}>0.00</span> kg·m/s</div>
                                    <div className="text-slate-400">Net Momentum Py:</div>
                                    <div className="text-right text-slate-200"><span ref={totalPyRef}>0.00</span> kg·m/s</div>
                                    
                                    <div className="col-span-2 border-t border-white/5 my-1" />
                                    
                                    <div className="text-slate-300 font-semibold">Total Momentum:</div>
                                    <div className="text-right text-amber-400 font-bold"><span ref={totalPRef}>0.00</span> kg·m/s</div>
                                    
                                    <div className="text-slate-300 font-semibold">Total KE (J):</div>
                                    <div className="text-right text-emerald-400 font-bold"><span ref={totalKERef}>0.00 J</span></div>
                                    
                                    <div className="text-slate-300 font-semibold">KE Lost:</div>
                                    <div className="text-right text-rose-400 font-bold"><span ref={keLossRef}>0.00 J (0.0%)</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Control panel */}
                <div style={{
        position: 'absolute',
        right: '0px',
        top: '0px',
        bottom: '0px',
        width: '340px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        background: 'rgba(20, 20, 30, 0.8)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '20px',
        color: 'white',
        pointerEvents: 'auto',
        fontFamily: "'Inter', sans-serif"
      }} className="scrollbar-hide">
                    {/* Tab Selection */}
                    <div className="flex border-b border-slate-800 /50">
                        <button onClick={() => setActiveTab('setup')} className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1.5 transition ${activeTab === 'setup' ? 'text-sky-400 border-b-2 border-sky-400 ' : 'text-slate-400 hover:text-slate-300'}`}>
                            <Sparkles size={16} /> Setup
                        </button>
                        <button onClick={() => setActiveTab('ball1')} className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1.5 transition ${activeTab === 'ball1' ? 'text-sky-400 border-b-2 border-sky-400 ' : 'text-slate-400 hover:text-slate-300'}`}>
                            <Sliders size={16} className="text-sky-400" /> Ball 1
                        </button>
                        <button onClick={() => setActiveTab('ball2')} className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1.5 transition ${activeTab === 'ball2' ? 'text-rose-400 border-b-2 border-rose-400 ' : 'text-slate-400 hover:text-slate-300'}`}>
                            <Sliders size={16} className="text-rose-400" /> Ball 2
                        </button>
                        <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1.5 transition ${activeTab === 'info' ? 'text-amber-400 border-b-2 border-amber-400 ' : 'text-slate-400 hover:text-slate-300'}`}>
                            <HelpCircle size={16} /> Physics
                        </button>
                    </div>

                    {/* Tab Body */}
                    <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto max-h-[550px] lg:max-h-none">
                        
                        {/* Tab 1: Setup & Presets */}
                        {activeTab === 'setup' && <div className="flex flex-col gap-5">
                                {/* Mode Selection */}
                                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                    <label style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500
              }}>Dimension Mode</label>
                                    <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                                        <button onClick={() => handleModeToggle('1d')} style={{
                  flex: 1,
                  padding: '10px',
                  background: mode === '1d' ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: mode === '1d' ? '1px solid #3498db' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600
                }}>
                                            1D Collision
                                        </button>
                                        <button onClick={() => handleModeToggle('2d')} style={{
                  flex: 1,
                  padding: '10px',
                  background: mode === '2d' ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: mode === '2d' ? '1px solid #3498db' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600
                }}>
                                            2D Collision
                                        </button>
                                    </div>
                                </div>

                                <hr style={{
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              margin: 0
            }} />

                                {/* Elasticity Slider */}
                                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                    <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                                        <label style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }}>Elasticity</label>
                                        <span style={{
                  fontSize: '14px',
                  color: '#3498db',
                  fontWeight: 700
                }}>{Math.round(elasticity * 100)}%</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={elasticity} onChange={e => setElasticity(parseFloat(e.target.value))} style={{
                width: '100%',
                accentColor: '#3498db'
              }} />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>Sticky</span>
                                        <span>Partial</span>
                                        <span>Elastic</span>
                                    </div>
                                </div>

                                <hr style={{
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              margin: 0
            }} />

                                {/* View options */}
                                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
                                    <label style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
                marginBottom: '4px'
              }}>Display Elements</label>
                                    <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                                        <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                                            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#3498db'
                  }} />
                                            <span style={{
                    fontSize: '14px',
                    color: '#fff',
                    fontWeight: 500
                  }}>Show Coordinate Grid</span>
                                        </label>
                                        <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                                            <input type="checkbox" checked={showTrails} onChange={e => setShowTrails(e.target.checked)} style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#3498db'
                  }} />
                                            <span style={{
                    fontSize: '14px',
                    color: '#fff',
                    fontWeight: 500
                  }}>Show Motion Trails</span>
                                        </label>
                                        <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                                            <input type="checkbox" checked={showCenterOfMass} onChange={e => setShowCenterOfMass(e.target.checked)} style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#3498db'
                  }} />
                                            <span style={{
                    fontSize: '14px',
                    color: '#fff',
                    fontWeight: 500
                  }}>Show Center of Mass</span>
                                        </label>
                                    </div>
                                    
                                    <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '8px'
              }}>
                                        <label style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }}>Vector Overlays</label>
                                        <select value={vectorType} onChange={e => setVectorType(e.target.value)} style={{
                  width: '100%',
                  background: 'rgba(20, 20, 30, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '8px',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}>
                                            <option value="both">Show Velocity & Momentum</option>
                                            <option value="velocity">Show Velocity Only (Green)</option>
                                            <option value="momentum">Show Momentum Only (Gold)</option>
                                            <option value="none">No Vectors</option>
                                        </select>
                                    </div>
                                </div>

                                <hr style={{
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              margin: 0
            }} />

                                {/* Presets Selectors */}
                                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                    <label style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500
              }}>Experiment Presets</label>
                                    <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                                        {PRESETS.map((p, idx) => <button key={idx} onClick={() => loadPreset(p)} style={{
                  padding: '10px',
                  background: 'rgba(20, 20, 30, 0.8)', backdropFilter: 'blur(12px)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }} onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }} onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}>
                                                <Sparkles size={14} color="#3498db" /> 
                                                <div style={{
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                                                    <span>{p.name}</span>
                                                    <span style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.5)'
                    }}>{p.desc}</span>
                                                </div>
                                            </button>)}
                                    </div>
                                </div>
                            </div>}

                        {/* Tab 2: Ball 1 Parameters */}
                        {/* Tab 2: Ball 1 Controls */}
                        {activeTab === 'ball1' && <div className="flex flex-col gap-5">
                                {/* Mass Slider */}
                                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                    <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                                        <label style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }}>Mass</label>
                                        <span style={{
                  fontSize: '14px',
                  color: '#3498db',
                  fontWeight: 700
                }}>{mass1.toFixed(1)} kg</span>
                                    </div>
                                    <input type="range" min="0.2" max="10.0" step="0.1" value={mass1} onChange={e => setMass1(parseFloat(e.target.value))} style={{
                width: '100%',
                accentColor: '#3498db'
              }} />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>0.2 kg</span>
                                        <span>5.0 kg</span>
                                        <span>10.0 kg</span>
                                    </div>
                                </div>

                                <hr style={{
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              margin: 0
            }} />

                                {/* Vx Slider */}
                                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                    <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                                        <label style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }}>Initial Velocity X (Vx)</label>
                                        <span style={{
                  fontSize: '14px',
                  color: '#3498db',
                  fontWeight: 700
                }}>{initVx1.toFixed(1)} m/s</span>
                                    </div>
                                    <input type="range" min="-6.0" max="6.0" step="0.1" value={initVx1} onChange={e => handleVelocitySliderChange(1, 'x', parseFloat(e.target.value))} style={{
                width: '100%',
                accentColor: '#3498db'
              }} />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>-6.0 m/s</span>
                                        <span>0.0 (Rest)</span>
                                        <span>6.0 m/s</span>
                                    </div>
                                </div>

                                {/* Vy Slider (Only rendered in 2D mode) */}
                                {mode === '2d' ? <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                        <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                                            <label style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }}>Initial Velocity Y (Vy)</label>
                                            <span style={{
                  fontSize: '14px',
                  color: '#3498db',
                  fontWeight: 700
                }}>{initVy1.toFixed(1)} m/s</span>
                                        </div>
                                        <input type="range" min="-6.0" max="6.0" step="0.1" value={initVy1} onChange={e => handleVelocitySliderChange(1, 'y', parseFloat(e.target.value))} style={{
                width: '100%',
                accentColor: '#3498db'
              }} />
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>-6.0 m/s</span>
                                            <span>0.0</span>
                                            <span>6.0 m/s</span>
                                        </div>
                                    </div> : <div className="p-3 /45 rounded-lg border border-slate-800/80 text-[11px] text-slate-500">
                                        Vy slider disabled. Switch to 2D mode to apply vertical motion vectors.
                                    </div>}
                            </div>}

                        {/* Tab 3: Ball 2 Controls */}
                        {activeTab === 'ball2' && <div className="flex flex-col gap-5">
                                {/* Mass Slider */}
                                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                    <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                                        <label style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }}>Mass</label>
                                        <span style={{
                  fontSize: '14px',
                  color: '#ff375f',
                  fontWeight: 700
                }}>{mass2.toFixed(1)} kg</span>
                                    </div>
                                    <input type="range" min="0.2" max="10.0" step="0.1" value={mass2} onChange={e => setMass2(parseFloat(e.target.value))} style={{
                width: '100%',
                accentColor: '#ff375f'
              }} />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>0.2 kg</span>
                                        <span>5.0 kg</span>
                                        <span>10.0 kg</span>
                                    </div>
                                </div>

                                <hr style={{
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              margin: 0
            }} />

                                {/* Vx Slider */}
                                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                    <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                                        <label style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }}>Initial Velocity X (Vx)</label>
                                        <span style={{
                  fontSize: '14px',
                  color: '#ff375f',
                  fontWeight: 700
                }}>{initVx2.toFixed(1)} m/s</span>
                                    </div>
                                    <input type="range" min="-6.0" max="6.0" step="0.1" value={initVx2} onChange={e => handleVelocitySliderChange(2, 'x', parseFloat(e.target.value))} style={{
                width: '100%',
                accentColor: '#ff375f'
              }} />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>-6.0 m/s</span>
                                        <span>0.0 (Rest)</span>
                                        <span>6.0 m/s</span>
                                    </div>
                                </div>

                                {/* Vy Slider (Only rendered in 2D mode) */}
                                {mode === '2d' ? <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                                        <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                                            <label style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }}>Initial Velocity Y (Vy)</label>
                                            <span style={{
                  fontSize: '14px',
                  color: '#ff375f',
                  fontWeight: 700
                }}>{initVy2.toFixed(1)} m/s</span>
                                        </div>
                                        <input type="range" min="-6.0" max="6.0" step="0.1" value={initVy2} onChange={e => handleVelocitySliderChange(2, 'y', parseFloat(e.target.value))} style={{
                width: '100%',
                accentColor: '#ff375f'
              }} />
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>-6.0 m/s</span>
                                            <span>0.0</span>
                                            <span>6.0 m/s</span>
                                        </div>
                                    </div> : <div className="p-3 /45 rounded-lg border border-slate-800/80 text-[11px] text-slate-500">
                                        Vy slider disabled. Switch to 2D mode to apply vertical motion vectors.
                                    </div>}
                            </div>}

                        {/* Tab 4: Physics Help & Explainer */}
                        {activeTab === 'info' && <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
                                <h4 style={{
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '12px',
              margin: 0
            }}>
                                    <Info size={18} color="#3498db" /> Scientific Principles
                                </h4>
                                <div>
                                    <h5 style={{
                color: '#3498db',
                fontWeight: '600',
                margin: '0 0 8px 0',
                fontSize: '15px'
              }}>Conservation of Momentum</h5>
                                    <p style={{
                margin: '0 0 12px 0'
              }}>
                                        In any system free of external forces, the total momentum remains constant:
                                    </p>
                                    <code style={{
                display: 'block',
                padding: '12px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#2ecc71',
                fontFamily: 'monospace',
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                                        m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'
                                    </code>
                                    <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                margin: 0
              }}>
                                        Observe that the "Total Momentum" in the dashboard remains constant through impacts (except when bouncing off walls).
                                    </p>
                                </div>
                                <hr style={{
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              margin: 0
            }} />
                                <div>
                                    <h5 style={{
                color: '#3498db',
                fontWeight: '600',
                margin: '0 0 8px 0',
                fontSize: '15px'
              }}>Restitution Coefficient (e)</h5>
                                    <p style={{
                margin: '0 0 12px 0'
              }}>
                                        Elasticity governs energy conversion during impact:
                                    </p>
                                    <ul style={{
                paddingLeft: '20px',
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                                        <li><strong style={{
                    color: '#fff'
                  }}>100% (e=1):</strong> Perfectly elastic. Kinetic Energy is perfectly conserved.</li>
                                        <li><strong style={{
                    color: '#fff'
                  }}>0% (e=0):</strong> Perfectly inelastic. Maximum KE is converted into internal/thermal energy, bodies stick.</li>
                                        <li><strong style={{
                    color: '#fff'
                  }}>Partial:</strong> Some KE is lost as heat/deformation.</li>
                                    </ul>
                                </div>
                                <hr style={{
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              margin: 0
            }} />
                                <div>
                                    <h5 style={{
                color: '#3498db',
                fontWeight: '600',
                margin: '0 0 8px 0',
                fontSize: '15px'
              }}>Kinetic Energy</h5>
                                    <p style={{
                margin: '0 0 12px 0'
              }}>
                                        The energy of translation is calculated as:
                                    </p>
                                    <code style={{
                display: 'block',
                padding: '12px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#2ecc71',
                fontFamily: 'monospace',
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                                        KE = ½ m v² = ½ m (v_x² + v_y²)
                                    </code>
                                    <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                margin: 0
              }}>
                                        In inelastic collisions, notice the reduction in system KE, and trace the "KE Lost" readout.
                                    </p>
                                </div>
                            </div>}

                    </div>
                </div>
            </div>
        </div>;
}
export default function CustomCollisionLab({
  onBack,
  title
}) {
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}>
            <style>{`
                .glass-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .glass-btn:hover { background: rgba(255, 255, 255, 0.1); }
                .play-btn { background: rgba(46, 204, 113, 0.2); border-color: rgba(46, 204, 113, 0.3); color: #2ecc71; }
                .play-btn:hover { background: rgba(46, 204, 113, 0.3); }
                .reset-btn { background: rgba(231, 76, 60, 0.2); border-color: rgba(231, 76, 60, 0.3); color: #e74c3c; }
                .reset-btn:hover { background: rgba(231, 76, 60, 0.3); }

                .sim-select {
                    width: 100%;
                    padding: 10px 12px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    font-size: 14px;
                    font-weight: 500;
                    appearance: none;
                    outline: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .sim-select:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .sim-select:focus {
                    border-color: #3498db;
                    background: rgba(20, 20, 30, 0.9);
                }
                .sim-select option {
                    background: #14141e;
                    color: #fff;
                }
            `}</style>
            <div style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    }}>
                 <CustomCollisionLabInner onBack={onBack} title={title} />
            </div>
        </div>;
}