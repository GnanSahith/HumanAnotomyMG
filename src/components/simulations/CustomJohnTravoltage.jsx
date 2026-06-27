import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw, Zap, Sparkles, Sliders, Info, Volume2, VolumeX, HelpCircle, Play, Pause, Settings2 } from 'lucide-react';

/**
 * CustomJohnTravoltage - A high-fidelity static electricity simulation.
 * 
 * PHYSICS METHODOLOGY:
 * 1. Friction & Charge Transfer:
 *    - Moving John's shoe back and forth on the carpet transfers negative charges (electrons)
 *      from the carpet fibers to his body due to the triboelectric effect.
 *    - Charge accumulation rate is proportional to sliding velocity and carpet friction coefficient.
 * 
 * 2. Charge Distribution:
 *    - Transferred electrons repel each other and distribute evenly across John's body.
 *    - In this simulation, charges are modeled as independent particles that spawn at the foot
 *      and migrate along the limbs and torso, settling on random body segments (Head, Torso, Arms, Legs).
 * 
 * 3. Charge Leakage (Humidity):
 *    - Water molecules in the air collide with charged bodies and slowly neutralize/carry away charge.
 *    - The leak rate scales with both the humidity level and the total accumulated charge (exponential decay).
 * 
 * 4. Dielectric Breakdown of Air (Spark Discharge):
 *    - The electric field E in the gap between the finger and the doorknob is modeled as E = Q / d.
 *    - When the E-field exceeds the dielectric strength of air (breakdown threshold, adjustable),
 *      air molecules ionize, creating a low-resistance plasma channel (spark).
 *    - This results in a rapid discharge, visualized as a jagged neon lightning bolt.
 *    - The lightning is rendered using a recursive midpoint displacement algorithm.
 */

function CustomJohnTravoltageInner() {
  const canvasRef = useRef(null);

  // User interface states
  const [humidity, setHumidity] = useState(25); // 0% to 100%
  const [dielectricStrength, setDielectricStrength] = useState(25); // 10 kV/cm to 45 kV/cm
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCharges, setShowCharges] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Interactive control states (synced with the canvas loop)
  const [armAngle, setArmAngle] = useState(-35); // -100 deg (up/back) to 30 deg (down/forward)
  const [footPosition, setFootPosition] = useState(300); // 200px to 380px on canvas

  // Telemetry states
  const [telemetry, setTelemetry] = useState({
    charge: 0,
    distance: 0,
    electricField: 0,
    threshold: 25,
    sparkState: 'SAFE',
    // 'SAFE', 'CRITICAL', 'DISCHARGING'
    dischargeRate: 0
  });

  // Reference for physics loop to read settings reactively
  const settingsRef = useRef({
    humidity: 25,
    dielectricStrength: 25,
    soundEnabled: true,
    showCharges: true
  });

  // Keep settingsRef in sync with React state
  useEffect(() => {
    settingsRef.current.humidity = humidity;
    settingsRef.current.dielectricStrength = dielectricStrength;
    settingsRef.current.soundEnabled = soundEnabled;
    settingsRef.current.showCharges = showCharges;
  }, [humidity, dielectricStrength, soundEnabled, showCharges]);

  // Simulation persistent state
  const stateRef = useRef({
    footX: 300,
    prevFootX: 300,
    armAngle: -35,
    accumulatedCharge: 0,
    particles: [],
    isDischarging: false,
    draggedElement: null,
    // 'hand' or 'foot'
    x_h: 0,
    y_h: 0,
    x_f: 0,
    y_f: 0,
    soundThrottle: 0,
    leakAccumulator: 0,
    sparkAudioCtx: null,
    dischargeAccumulator: 0
  });

  // Sync React slider controls into stateRef
  useEffect(() => {
    stateRef.current.armAngle = armAngle;
  }, [armAngle]);
  useEffect(() => {
    stateRef.current.footX = footPosition;
  }, [footPosition]);

  // Web Audio Synth for static sound effects
  const playZapSound = (duration = 0.08, frequency = 900) => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      const state = stateRef.current;
      if (!state.sparkAudioCtx) {
        state.sparkAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioCtx = state.sparkAudioCtx;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Synth nodes
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const filterNode = audioCtx.createBiquadFilter();
      osc.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Spark Crackle Pitch Sweep
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + duration);

      // Bandpass filter for a static hiss/crackle texture
      filterNode.type = 'bandpass';
      filterNode.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      filterNode.Q.setValueAtTime(4, audioCtx.currentTime);

      // Volume envelope
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);

      // Also mix a tiny burst of white noise for the spark snap
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1500, audioCtx.currentTime);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start();
    } catch (e) {
      console.warn("Web Audio API not fully initialized:", e);
    }
  };
  const playRubbingSound = () => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      const state = stateRef.current;
      if (!state.sparkAudioCtx) {
        state.sparkAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioCtx = state.sparkAudioCtx;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Low frequency scraping friction sound
      const duration = 0.04;
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, audioCtx.currentTime);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch {
      // Ignored
    }
  };

  // Setup interactive drag coordinate calculation
  const getCanvasCoords = e => {
    const canvas = canvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Scale coordinates correctly in case of responsive layout resizing
    const x = (clientX - rect.left) / rect.width * canvas.width;
    const y = (clientY - rect.top) / rect.height * canvas.height;
    return {
      x,
      y
    };
  };
  const handleMouseDown = e => {
    const coords = getCanvasCoords(e);
    const state = stateRef.current;

    // Calculate distance from click to hand handle and foot handle
    const distToHand = Math.hypot(coords.x - state.x_h, coords.y - state.y_h);
    const distToFoot = Math.hypot(coords.x - state.footX, coords.y - 500);

    // Initialize Web Audio context on user gesture
    if (!state.sparkAudioCtx) {
      try {
        state.sparkAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        // Ignored
      }
    }
    if (distToHand < 35) {
      state.draggedElement = 'hand';
    } else if (distToFoot < 35) {
      state.draggedElement = 'foot';
    }
  };
  const handleMouseMove = e => {
    const coords = getCanvasCoords(e);
    const state = stateRef.current;
    if (state.draggedElement === 'hand') {
      // Rotate shoulder towards pointer
      // Shoulder is located at x = 420, y = 240
      const dx = coords.x - 420;
      const dy = coords.y - 240;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < -180) angle += 360;
      if (angle > 180) angle -= 360;

      // Clamp arm rotation: -105 degrees (up/back) to 30 degrees (down/front)
      angle = Math.max(-105, Math.min(30, angle));
      setArmAngle(Math.round(angle));
    } else if (state.draggedElement === 'foot') {
      // Slide shoe along the carpet
      // Bound it between x = 200 (left carpet edge) and x = 385 (right carpet edge)
      const footX = Math.max(200, Math.min(385, coords.x));
      setFootPosition(Math.round(footX));
    }
  };
  const handleMouseUp = () => {
    stateRef.current.draggedElement = null;
  };
  const resetCharges = () => {
    const state = stateRef.current;
    state.accumulatedCharge = 0;
    state.particles = [];
    state.isDischarging = false;
  };
  const resetAll = () => {
    resetCharges();
    setArmAngle(-35);
    setFootPosition(300);
  };

  // Main Canvas & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = performance.now();
    let telemetryThrottle = 0;

    // Recursive midpoint displacement lightning generator
    const drawLightning = (x1, y1, x2, y2, displace) => {
      if (displace < 2) {
        ctx.lineTo(x2, y2);
      } else {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const offset = (Math.random() - 0.5) * displace;

        // Calculate normal vector for perpendicular offsets
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;
        const cx = midX + nx * offset;
        const cy = midY + ny * offset;
        drawLightning(x1, y1, cx, cy, displace / 2);
        drawLightning(cx, cy, x2, y2, displace / 2);
      }
    };

    // Helper to spawn a new charge particle
    const createChargeParticle = startX => {
      const parts = ['head', 'torso', 'arm_left', 'arm_right', 'leg_left', 'leg_right'];
      const weights = [0.15, 0.35, 0.10, 0.15, 0.10, 0.15];
      let roll = Math.random();
      let chosenPart = 'torso';
      let sum = 0;
      for (let i = 0; i < parts.length; i++) {
        sum += weights[i];
        if (roll <= sum) {
          chosenPart = parts[i];
          break;
        }
      }
      return {
        id: Math.random().toString(36).substr(2, 9),
        bodyPart: chosenPart,
        r: Math.sqrt(Math.random()),
        // Bias outward from center for head
        phi: Math.random() * Math.PI * 2,
        dx: (Math.random() - 0.5) * 32,
        // Torso horizontal spread
        dy: Math.random() * 105,
        // Torso vertical spread
        u: Math.random(),
        // Linear path interpolant for limbs
        noiseX: (Math.random() - 0.5) * 6,
        noiseY: (Math.random() - 0.5) * 6,
        t: 0,
        // Migration progress (0 to 1)
        startX: startX,
        startY: 500,
        x: startX,
        y: 500
      };
    };
    const loop = timestamp => {
      let dt = (timestamp - lastTime) / 1000;
      if (dt > 0.1) dt = 0.1; // clamp delta to protect physics calculations
      lastTime = timestamp;
      const state = stateRef.current;
      const settings = settingsRef.current;

      // ----------------------------------------------------
      // 1. UPDATE PHYSICS
      // ----------------------------------------------------

      // Calculate arm coordinates
      const angleRad = state.armAngle * Math.PI / 180;
      // Shoulder = (420, 240). Arm length = 120.
      state.x_h = 420 + 120 * Math.cos(angleRad);
      state.y_h = 240 + 120 * Math.sin(angleRad);
      // Finger tip extends further by 15px
      state.x_f = state.x_h + 15 * Math.cos(angleRad);
      state.y_f = state.y_h + 15 * Math.sin(angleRad);

      // Friction: Rub foot on carpet
      const footMovement = Math.abs(state.footX - state.prevFootX);
      if (footMovement > 0.4 && !state.isDischarging) {
        // Charge accumulation rate depends on motion delta
        const addedCharge = footMovement * 0.16;
        state.accumulatedCharge = Math.min(150, state.accumulatedCharge + addedCharge);

        // Periodically trigger friction audio
        state.soundThrottle += dt;
        if (state.soundThrottle > 0.06) {
          playRubbingSound();
          state.soundThrottle = 0;
        }

        // Spawn matching visual particles
        const targetParticleCount = Math.floor(state.accumulatedCharge);
        if (state.particles.length < targetParticleCount) {
          const toSpawn = targetParticleCount - state.particles.length;
          for (let i = 0; i < toSpawn; i++) {
            state.particles.push(createChargeParticle(state.footX));
          }
        }
      }
      state.prevFootX = state.footX;

      // Air Leakage: Charge decays exponentially based on air humidity
      if (state.accumulatedCharge > 0 && !state.isDischarging) {
        // High humidity: fast leak. Dry air (low humidity): extremely slow leak.
        const leakRate = 0.04 * (settings.humidity / 100) * state.accumulatedCharge;
        state.accumulatedCharge = Math.max(0, state.accumulatedCharge - leakRate * dt);
        const targetCount = Math.floor(state.accumulatedCharge);
        if (state.particles.length > targetCount) {
          // Remove older particles first (slice from front)
          state.particles = state.particles.slice(state.particles.length - targetCount);
        }
      }

      // Spark Breakdown Calculations
      // Doorknob center is at (595, 260), radius is 15
      const dxKnob = state.x_f - 595;
      const dyKnob = state.y_f - 260;
      const rawDistance = Math.hypot(dxKnob, dyKnob);
      const gapDistance = Math.max(0.5, rawDistance - 15); // subtract knob radius

      // Distance in simulated cm (15 pixels = 1 cm)
      const gapDistanceCm = gapDistance / 15;

      // Electric Field (kV/cm) E = Q / d
      const electricField = gapDistanceCm > 0.1 ? state.accumulatedCharge / gapDistanceCm : 0;

      // Dielectric breakdown threshold set by user
      const threshold = settings.dielectricStrength;

      // Check if spark discharges
      if (!state.isDischarging && state.accumulatedCharge > 3 && electricField >= threshold) {
        state.isDischarging = true;
        // Big snap sound effect
        playZapSound(0.12, 1000);
      }

      // Handle continuous spark discharge phase
      if (state.isDischarging) {
        // Discharge speed increases with voltage/electric field
        const baseDischargeSpeed = 95.0; // charges per second
        state.dischargeAccumulator += baseDischargeSpeed * dt;
        const chargesToDrain = Math.floor(state.dischargeAccumulator);
        if (chargesToDrain > 0) {
          state.accumulatedCharge = Math.max(0, state.accumulatedCharge - chargesToDrain);
          state.dischargeAccumulator -= chargesToDrain;
        }

        // Emit crackling audio periodically
        state.soundThrottle += dt;
        if (state.soundThrottle > 0.05 && state.accumulatedCharge > 2) {
          playZapSound(0.06, 750 + Math.random() * 300);
          state.soundThrottle = 0;
        }

        // Discharge termination conditions
        // Spark breaks if charge is fully depleted or distance increases (hysteresis)
        if (state.accumulatedCharge <= 1) {
          state.isDischarging = false;
        } else if (electricField < threshold * 0.72) {
          state.isDischarging = false;
        }
      }

      // Update particle positions
      state.particles = state.particles.filter(p => {
        if (state.isDischarging) {
          // Electrodynamic pull: charges rush down the right arm to discharge at finger tip
          const dx = state.x_f - p.x;
          const dy = state.y_f - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 10) {
            return false; // charge discharged into the knob
          }

          // Speed up electron flow during discharge
          const flowSpeed = 500 * dt;
          p.x += dx / dist * Math.min(flowSpeed, dist);
          p.y += dy / dist * Math.min(flowSpeed, dist);
          return true;
        } else {
          // Normal electrostatic migration up the body
          if (p.t < 1) {
            p.t = Math.min(1, p.t + dt / 0.55); // migrate over 0.55s
          }

          // Calculate absolute target coordinates depending on current body segment positions
          let tx = 400;
          let ty = 240;
          switch (p.bodyPart) {
            case 'head':
              tx = 400 + 22 * p.r * Math.cos(p.phi);
              ty = 180 + 22 * p.r * Math.sin(p.phi);
              break;
            case 'torso':
              tx = 400 + p.dx;
              ty = 230 + p.dy;
              break;
            case 'arm_left':
              tx = 380 + p.u * (330 - 380) + p.noiseX;
              ty = 240 + p.u * (330 - 240) + p.noiseY;
              break;
            case 'arm_right':
              tx = 420 + p.u * (state.x_h - 420) + p.noiseX;
              ty = 240 + p.u * (state.y_h - 240) + p.noiseY;
              break;
            case 'leg_left':
              tx = 380 + p.u * (370 - 380) + p.noiseX;
              ty = 350 + p.u * (500 - 350) + p.noiseY;
              break;
            case 'leg_right':
              tx = 420 + p.u * (state.footX - 420) + p.noiseX;
              ty = 350 + p.u * (500 - 350) + p.noiseY;
              break;
            default:
              break;
          }
          p.x = p.startX + (tx - p.startX) * p.t;
          p.y = p.startY + (ty - p.startY) * p.t;
          return true;
        }
      });

      // Synchronize states to telemetry React state at 10Hz (throttled)
      telemetryThrottle += dt;
      if (telemetryThrottle > 0.1) {
        let sparkState = 'SAFE';
        if (state.isDischarging) sparkState = 'DISCHARGING';else if (electricField > threshold * 0.8) sparkState = 'CRITICAL';
        setTelemetry({
          charge: Math.round(state.accumulatedCharge),
          distance: Number(gapDistanceCm.toFixed(1)),
          electricField: Number(electricField.toFixed(1)),
          threshold: threshold,
          sparkState: sparkState,
          dischargeRate: state.isDischarging ? Math.round(95.0 * (electricField / threshold)) : 0
        });
        telemetryThrottle = 0;
      }

      // ----------------------------------------------------
      // 2. RENDER GRAPHICS
      // ----------------------------------------------------
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background room gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#0f172a'); // slate-900
      bgGrad.addColorStop(1, '#020617'); // slate-950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw carpet (static ground)
      ctx.fillStyle = '#1e3a8a'; // deep indigo
      ctx.fillRect(150, 500, 270, 36);

      // Carpet fibers texture
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;
      for (let i = 160; i < 420; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 500);
        ctx.lineTo(i - 4, 536);
        ctx.stroke();
      }

      // Draw door frame outlines
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(610, 80);
      ctx.lineTo(610, 500);
      ctx.lineTo(800, 500);
      ctx.stroke();

      // Draw metal lock plate
      ctx.fillStyle = '#475569'; // slate-600
      ctx.fillRect(602, 230, 8, 60);

      // Draw doorknob with radial gradient for shiny 3D chrome effect
      const knobGrad = ctx.createRadialGradient(591, 256, 1, 595, 260, 15);
      knobGrad.addColorStop(0, '#e2e8f0'); // white/silver
      knobGrad.addColorStop(0.5, '#94a3b8'); // slate-400
      knobGrad.addColorStop(1, '#475569'); // slate-600
      ctx.fillStyle = knobGrad;
      ctx.beginPath();
      ctx.arc(595, 260, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Body shake modifier for high voltage discharge vibration
      const shakeX = state.isDischarging ? (Math.random() - 0.5) * 6 : 0;
      const shakeY = state.isDischarging ? (Math.random() - 0.5) * 6 : 0;

      // Draw John Travoltage
      // Coordinates shifted by (shakeX, shakeY) during discharge

      // A. Draw Left Arm (Background layer)
      ctx.strokeStyle = '#f59e0b'; // sleeve yellow
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(380 + shakeX, 240 + shakeY);
      ctx.lineTo(345 + shakeX, 290 + shakeY);
      ctx.stroke();
      ctx.strokeStyle = '#fef08a'; // skin yellow
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(345 + shakeX, 290 + shakeY);
      ctx.lineTo(330 + shakeX, 330 + shakeY);
      ctx.stroke();

      // Left hand
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(330 + shakeX, 330 + shakeY, 8, 0, Math.PI * 2);
      ctx.fill();

      // B. Draw Legs (Indigo jeans)
      // Left leg (standing pivot, anchored)
      ctx.strokeStyle = '#1d4ed8'; // blue jeans
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(380 + shakeX, 350 + shakeY);
      ctx.lineTo(370, 500); // anchored foot
      ctx.stroke();

      // Left shoe
      ctx.fillStyle = '#451a03'; // brown shoe
      ctx.beginPath();
      ctx.ellipse(370, 500, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right leg (rubbing/slidable leg)
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.moveTo(420 + shakeX, 350 + shakeY);
      // Knee joint
      const kneeX = 420 + shakeX;
      const kneeY = 420 + shakeY;
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(state.footX, 500); // slider-controlled ankle
      ctx.stroke();

      // Right shoe
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(state.footX, 500, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight active foot drag area when mouse is near
      const _distToFoot = Math.hypot(state.footX - (state.prevFootX || state.footX), 500 - 500); // dummy for hover
      // Draw drag helper ring around foot
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(state.footX, 500, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // C. Draw Torso (yellow shirt)
      // Rounded body pill shape
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      const torsoX = 400 + shakeX - 22;
      const torsoY = 220 + shakeY;
      // Draw custom rounded rect to guarantee HTML5 compliance
      ctx.moveTo(torsoX + 18, torsoY);
      ctx.lineTo(torsoX + 44 - 18, torsoY);
      ctx.quadraticCurveTo(torsoX + 44, torsoY, torsoX + 44, torsoY + 18);
      ctx.lineTo(torsoX + 44, torsoY + 130 - 18);
      ctx.quadraticCurveTo(torsoX + 44, torsoY + 130, torsoX + 44 - 18, torsoY + 130);
      ctx.lineTo(torsoX + 18, torsoY + 130);
      ctx.quadraticCurveTo(torsoX, torsoY + 130, torsoX, torsoY + 130 - 18);
      ctx.lineTo(torsoX, torsoY + 18);
      ctx.quadraticCurveTo(torsoX, torsoY, torsoX + 18, torsoY);
      ctx.closePath();
      ctx.fill();

      // D. Draw Right Arm (Active rotatable arm)
      // Sleeve
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 17;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(420 + shakeX, 240 + shakeY);
      // Sleeve ends 40px along arm vector
      const sleeveX = 420 + shakeX + 45 * Math.cos(angleRad);
      const sleeveY = 240 + shakeY + 45 * Math.sin(angleRad);
      ctx.lineTo(sleeveX, sleeveY);
      ctx.stroke();

      // Forearm (skin tone)
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(sleeveX, sleeveY);
      ctx.lineTo(state.x_h + shakeX, state.y_h + shakeY);
      ctx.stroke();

      // Hand
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(state.x_h + shakeX, state.y_h + shakeY, 9, 0, Math.PI * 2);
      ctx.fill();

      // Pointing index finger
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(state.x_h + shakeX, state.y_h + shakeY);
      ctx.lineTo(state.x_f + shakeX, state.y_f + shakeY);
      ctx.stroke();

      // Glowing pulse ring on hand when hover/drag is active
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(state.x_h + shakeX, state.y_h + shakeY, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // E. Draw Head & Responsive Face Expressions
      const headX = 400 + shakeX;
      const headY = 180 + shakeY;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(headX, headY, 27, 0, Math.PI * 2);
      ctx.fill();

      // Face features: eyes
      if (state.isDischarging) {
        // Shocked crossed eyes 'X X'
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        // Left eye X
        ctx.beginPath();
        ctx.moveTo(headX - 14, headY - 8);
        ctx.lineTo(headX - 6, headY);
        ctx.moveTo(headX - 6, headY - 8);
        ctx.lineTo(headX - 14, headY);
        // Right eye X
        ctx.moveTo(headX + 6, headY - 8);
        ctx.lineTo(headX + 14, headY);
        ctx.moveTo(headX + 14, headY - 8);
        ctx.lineTo(headX + 6, headY);
        ctx.stroke();

        // Wide open screaming mouth
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(headX, headY + 8, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (state.accumulatedCharge > 85) {
        // Highly charged shocked look (wide white eyes, open mouth)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headX - 9, headY - 4, 6, 0, Math.PI * 2);
        ctx.arc(headX + 9, headY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(headX - 9, headY - 4, 2, 0, Math.PI * 2);
        ctx.arc(headX + 9, headY - 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Shocked open mouth
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(headX, headY + 8, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Normal state (simple black eyes, smiling mouth)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(headX - 8, headY - 4, 2.5, 0, Math.PI * 2);
        ctx.arc(headX + 8, headY - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Smug smile
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(headX, headY + 5, 8, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
      }

      // Spikey hair stands up in proportion to accumulated charge
      const hairStrands = 7;
      ctx.strokeStyle = '#451a03'; // dark brown hair
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      const chargeRatio = state.accumulatedCharge / 150;
      const hairLength = 10 + chargeRatio * 15; // grows/stands up taller

      for (let i = 0; i < hairStrands; i++) {
        // Angles spanning from top-left to top-right of head
        const angle = -140 + i * 16;
        const rad = angle * Math.PI / 180;

        // Base starting point on skull edge
        const bx = headX + 27 * Math.cos(rad);
        const by = headY + 27 * Math.sin(rad);

        // Stand straight out based on electrostatic charge repulsion
        const extX = bx + hairLength * Math.cos(rad);
        const extY = by + hairLength * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(extX, extY);
        ctx.stroke();
      }

      // F. Render Electron Particles (showCharges visual flag)
      if (settings.showCharges && state.particles.length > 0) {
        state.particles.forEach(p => {
          // Draw blue negative charge circle
          ctx.fillStyle = '#3b82f6'; // vibrant blue
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // White border
          ctx.strokeStyle = '#eff6ff';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Draw '-' minus sign in center
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x - 2, p.y);
          ctx.lineTo(p.x + 2, p.y);
          ctx.stroke();
        });
      }

      // G. Render Neon Spark Lightning Bolt
      if (state.isDischarging && state.accumulatedCharge > 1) {
        // Draw multiple layered lightning paths to create glowing high-voltage neon look
        // Outer cyan glow layer
        ctx.beginPath();
        ctx.moveTo(state.x_f + shakeX, state.y_f + shakeY);
        ctx.shadowColor = '#06b6d4'; // cyan-500
        ctx.shadowBlur = 18;

        // Target left edge of knob (580, 260)
        drawLightning(state.x_f + shakeX, state.y_f + shakeY, 580, 260, 25);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.lineWidth = 5;
        ctx.lineJoin = 'miter';
        ctx.stroke();

        // Inner white hot core layer
        ctx.beginPath();
        ctx.moveTo(state.x_f + shakeX, state.y_f + shakeY);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        drawLightning(state.x_f + shakeX, state.y_f + shakeY, 580, 260, 10);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Reset shadow properties immediately to protect subsequent rendering
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Draw electrical spark particles splash on the doorknob contact point
        ctx.fillStyle = '#22d3ee'; // cyan-400
        for (let i = 0; i < 6; i++) {
          const px = 580 + (Math.random() - 0.7) * 14;
          const py = 260 + (Math.random() - 0.5) * 14;
          const pr = 1.5 + Math.random() * 2;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Interactive controls description box in corner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // slate-900/85
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'absolute',
    inset: 0,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#f8fafc',
    pointerEvents: 'none'
  }}>
      {/* Centered Interactive Simulation Canvas */}
      <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}>
        <div style={{
        pointerEvents: 'auto',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}>
          <canvas ref={canvasRef} width={800} height={600} style={{
          display: 'block',
          width: '640px',
          height: '480px',
          borderRadius: '16px',
          background: '#090915',
          cursor: 'grab'
        }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart => {
          const coords = getCanvasCoords(handleTouchStart);
          const state = stateRef.current;
          const distToHand = Math.hypot(coords.x - state.x_h, coords.y - state.y_h);
          const distToFoot = Math.hypot(coords.x - state.footX, coords.y - 500);
          if (!state.sparkAudioCtx) {
            try {
              state.sparkAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch {/* ignore */}
          }
          if (distToHand < 35) state.draggedElement = 'hand';else if (distToFoot < 35) state.draggedElement = 'foot';
          if (handleTouchStart.cancelable) handleTouchStart.preventDefault();
        }} onTouchMove={handleTouchMove => {
          const coords = getCanvasCoords(handleTouchMove);
          const state = stateRef.current;
          if (state.draggedElement === 'hand') {
            const dx = coords.x - 420;
            const dy = coords.y - 240;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angle < -180) angle += 360;
            if (angle > 180) angle -= 360;
            angle = Math.max(-105, Math.min(30, angle));
            setArmAngle(Math.round(angle));
          } else if (state.draggedElement === 'foot') {
            const footX = Math.max(200, Math.min(385, coords.x));
            setFootPosition(Math.round(footX));
          }
          if (handleTouchMove.cancelable) handleTouchMove.preventDefault();
        }} onTouchEnd={handleMouseUp} />
        </div>
      </div>

      {/* Floating Bottom Left: Instructions HUD */}
      <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      width: '280px',
      background: 'rgba(20, 20, 30, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      padding: '16px',
      borderRadius: '12px',
      zIndex: 10,
      color: 'white',
      fontSize: '12px',
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
        <span style={{
        color: '#22d3ee',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <Sparkles size={13} /> Instructions
        </span>
        <ul style={{
        margin: 0,
        paddingLeft: '16px',
        color: '#cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        lineHeight: '1.4'
      }}>
          <li>Drag shoe on carpet to accumulate negative charges.</li>
          <li>Drag hand closer to doorknob to discharge a spark.</li>
          <li>Adjust parameters in settings panel to test effects.</li>
        </ul>
      </div>

      {/* Floating Right Control Panel: Settings & Telemetry */}
      <div style={{
      position: 'absolute',
      top: '90px',
      right: '20px',
      width: '320px',
      maxHeight: 'calc(100% - 110px)',
      overflowY: 'auto',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      pointerEvents: 'auto'
    }}>
        <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '8px',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <Sliders size={16} /> Simulation Settings
        </h3>

        {/* Electron Overlay Checkbox */}
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px'
      }}>
          <span>Show Electrons (Charges)</span>
          <button onClick={() => setShowCharges(!showCharges)} style={{
          relative: 'inline-flex',
          width: '40px',
          height: '20px',
          borderRadius: '10px',
          border: 'none',
          background: showCharges ? '#06b6d4' : 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s'
        }}>
            <span style={{
            display: 'block',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '3px',
            left: showCharges ? '23px' : '3px',
            transition: 'left 0.2s'
          }} />
          </button>
        </div>

        {/* Humidity Slider */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span style={{
            color: '#cbd5e1'
          }}>Air Humidity (Leak):</span>
            <span style={{
            color: '#22d3ee',
            fontWeight: 'bold'
          }}>{humidity}%</span>
          </div>
          <input type="range" min="0" max="100" value={humidity} onChange={e => setHumidity(Number(e.target.value))} style={{
          accentColor: '#22d3ee',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* Dielectric Strength Slider */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span style={{
            color: '#cbd5e1'
          }}>Dielectric Threshold:</span>
            <span style={{
            color: '#22d3ee',
            fontWeight: 'bold'
          }}>{dielectricStrength} kV/cm</span>
          </div>
          <input type="range" min="10" max="45" value={dielectricStrength} onChange={e => setDielectricStrength(Number(e.target.value))} style={{
          accentColor: '#22d3ee',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* Sound Toggle */}
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '10px'
      }}>
          <span>Sound Effects</span>
          <button onClick={() => setSoundEnabled(!soundEnabled)} style={{
          background: 'none',
          border: 'none',
          color: soundEnabled ? '#22d3ee' : '#94a3b8',
          cursor: 'pointer',
          padding: '4px'
        }}>
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* Joints Control */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '12px'
      }}>
          <label style={{
          fontSize: '11px',
          color: '#94a3b8',
          fontWeight: 'bold',
          letterSpacing: '0.05em'
        }}>MANUAL JOINTS CONTROL</label>
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
              <span>Arm Rotation Angle:</span>
              <span style={{
              fontFamily: 'monospace'
            }}>{armAngle}°</span>
            </div>
            <input type="range" min="-105" max="30" value={armAngle} onChange={e => setArmAngle(Number(e.target.value))} style={{
            accentColor: '#22d3ee',
            cursor: 'pointer',
            width: '100%'
          }} />
          </div>

          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
              <span>Foot Carpet Position:</span>
              <span style={{
              fontFamily: 'monospace'
            }}>{Math.round((footPosition - 200) / 1.85)}%</span>
            </div>
            <input type="range" min="200" max="385" value={footPosition} onChange={e => setFootPosition(Number(e.target.value))} style={{
            accentColor: '#22d3ee',
            cursor: 'pointer',
            width: '100%'
          }} />
          </div>
        </div>

        {/* Telemetry */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '12px'
      }}>
          <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
            <Zap size={14} style={{
            color: '#22d3ee'
          }} /> Electrostatic Telemetry
          </h3>
          
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '12px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
              <span>Body Net Charge:</span>
              <span style={{
              color: '#22d3ee',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>{telemetry.charge} nC</span>
            </div>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
              <span>Finger-Knob Distance:</span>
              <span style={{
              fontFamily: 'monospace'
            }}>{telemetry.distance} cm</span>
            </div>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
              <span>Calculated E-Field:</span>
              <span style={{
              fontFamily: 'monospace'
            }}>{telemetry.electricField} kV/cm</span>
            </div>
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '8px'
        }}>
            <span>Spark Status:</span>
            <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            background: telemetry.sparkState === 'DISCHARGING' ? 'rgba(239,68,68,0.2)' : telemetry.sparkState === 'CRITICAL' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
            color: telemetry.sparkState === 'DISCHARGING' ? '#f87171' : telemetry.sparkState === 'CRITICAL' ? '#fbbf24' : '#34d399',
            border: telemetry.sparkState === 'DISCHARGING' ? '1px solid rgba(239,68,68,0.4)' : telemetry.sparkState === 'CRITICAL' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(16,185,129,0.4)'
          }}>
              {telemetry.sparkState}
            </span>
          </div>
        </div>

        {/* Resets & Guide */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '12px'
      }}>
          <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}>
            <button onClick={resetCharges} style={{
            padding: '8px',
            background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
              Clear Charges
            </button>
            <button onClick={resetAll} style={{
            padding: '8px',
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: '8px',
            color: '#22d3ee',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <button onClick={() => setShowInfoModal(true)} style={{
          padding: '8px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '8px',
          color: '#cbd5e1',
          fontSize: '12px',
          cursor: 'pointer',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
            <Info size={12} /> Educational Guide
          </button>
        </div>
      </div>

      {/* Educational Guide Modal */}
      {showInfoModal && <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      pointerEvents: 'auto'
    }}>
          <div style={{
        background: 'rgba(20, 20, 30, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
            <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
              <Info size={20} style={{
            color: '#22d3ee'
          }} /> How Static Electricity Works
            </h3>
            
            <div style={{
          fontSize: '13px',
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '300px',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
              <p><strong>1. Triboelectric Charging:</strong> Dragging John's shoe on the carpet transfers electrons to his body due to friction.</p>
              <p><strong>2. Charge Repulsion:</strong> Transferred electrons repel each other and distribute across his skin, causing hair to stand up.</p>
              <p><strong>3. Dielectric Breakdown:</strong> If John's hand is close enough to the knob, the strong electric field ionizes the air, triggering a spark discharge.</p>
              <p><strong>4. Humidity Dissipation:</strong> Polar water molecules in humid air collide with John's body and carry away static charge naturally.</p>
            </div>

            <button onClick={() => setShowInfoModal(false)} style={{
          alignSelf: 'flex-end',
          padding: '8px 16px',
          background: '#22d3ee',
          color: '#080816',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
              Close Guide
            </button>
          </div>
        </div>}
    </div>;
}
export default function CustomJohnTravoltage({
  onBack,
  title
}) {
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden'
  }}>
            <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      right: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100
    }}>
                {onBack ? <button onClick={onBack} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        padding: '10px 20px',
        borderRadius: '12px',
        color: '#fff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif"
      }}>
                        ← Back
                    </button> : <div />}
                <h1 style={{
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        fontSize: '24px',
        fontWeight: '600',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        margin: 0
      }}>
                    {title || "John Travoltage"}
                </h1>
                <div style={{
        width: '100px'
      }}></div>
            </div>
            <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomJohnTravoltageInner />
            </div>
        </div>;
}