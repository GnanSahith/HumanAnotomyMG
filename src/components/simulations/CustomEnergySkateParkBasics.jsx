import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Play, Pause, RefreshCw, HelpCircle, Settings2 } from 'lucide-react';

/**
 * CustomEnergySkateParkBasics Helper Functions (Declared outside to ensure purity and ESLint compliance)
 */

/**
 * Evaluates the y-coordinate of the track at a given x-coordinate
 */
function getTrackY(type, x) {
  const clampedX = Math.max(100, Math.min(700, x));
  const u = (clampedX - 400) / 300; // normalized coordinate [-1, 1]

  switch (type) {
    case 'bowl':
      {
        // U-Shape Bowl
        return 500 - 350 * (1 - u * u);
      }
    case 'ramp':
      {
        // Single Ramp
        const r = (clampedX - 100) / 600; // normalized [0, 1]
        return 500 - 350 * (1 - r) * (1 - r);
      }
    case 'doubleWell':
      {
        // S-Shape Double Well
        return 360 - 140 * Math.cos(2 * Math.PI * u) - 80 * u * u;
      }
    default:
      return 500;
  }
}

/**
 * Evaluates the analytic slope dy/dx of the track at a given x-coordinate
 */
function getTrackSlope(type, x) {
  const clampedX = Math.max(100, Math.min(700, x));
  const u = (clampedX - 400) / 300;
  switch (type) {
    case 'bowl':
      {
        // y = 150 + 350 * u^2 where u = (x - 400)/300
        // dy/dx = 700 * u * (1/300) = (7/3) * u
        return 7 / 3 * u;
      }
    case 'ramp':
      {
        // y = 500 - 350 * (1 - r)^2 where r = (x-100)/600
        // dy/dx = -700 * (1 - r) * (-1/600) = (7/6) * (1 - r)
        const r = (clampedX - 100) / 600;
        return 7 / 6 * (1 - r);
      }
    case 'doubleWell':
      {
        // y = 360 - 140 * cos(2pi u) - 80 u^2 where u = (x-400)/300
        // dy/dx = (280pi / 300) * sin(2pi u) - (160 / 300) * u
        return 14 * Math.PI / 15 * Math.sin(2 * Math.PI * u) - 8 / 15 * u;
      }
    default:
      return 0;
  }
}

/**
 * Draws the track pillars and rails on the canvas
 */
function drawTrack(ctx, type) {
  ctx.save();

  // Draw pillars supporting track down to ground
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 2;
  for (let x = 140; x <= 660; x += 80) {
    const yTrack = getTrackY(type, x);
    if (yTrack < 500) {
      ctx.beginPath();
      ctx.moveTo(x, yTrack);
      ctx.lineTo(x, 500);
      ctx.stroke();
    }
  }

  // Draw main structural rail (shadow rail)
  ctx.beginPath();
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#475569';
  for (let x = 100; x <= 700; x += 4) {
    const y = getTrackY(type, x);
    if (x === 100) ctx.moveTo(x, y);else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw glowing neon track line
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#06b6d4';
  for (let x = 100; x <= 700; x += 4) {
    const y = getTrackY(type, x);
    if (x === 100) ctx.moveTo(x, y);else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Outer safety stops
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(100, getTrackY(type, 100), 7, 0, Math.PI * 2);
  ctx.arc(700, getTrackY(type, 700), 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws the speed arrow overlay starting from the skater
 */
function drawSpeedOverlay(ctx, x, y, vx, vy, isOnTrack, type) {
  const spd = Math.hypot(vx, vy);
  if (spd < 0.1) return;
  let dx = vx;
  let dy = vy;
  if (isOnTrack) {
    const slope = getTrackSlope(type, x);
    const th = Math.atan(slope);
    const dir = vx >= 0 ? 1 : -1;
    dx = spd * Math.cos(th) * dir;
    dy = spd * Math.sin(th) * dir;
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  const scale = 7;
  const endX = x + dx * scale;
  const endY = y + dy * scale;
  ctx.lineTo(endX, endY);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#10b981';
  ctx.stroke();

  // Head of the arrow
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - 9 * Math.cos(angle - Math.PI / 6), endY - 9 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(endX - 9 * Math.cos(angle + Math.PI / 6), endY - 9 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.restore();
}

/**
 * Draws the speedometer gauge in the top-right corner of the canvas
 */
function drawSpeedometerOnCanvas(ctx, val) {
  ctx.save();
  ctx.translate(720, 80);

  // Frame Background
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Dial Arc
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0.75 * Math.PI, 2.25 * Math.PI);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();

  // Active Arc
  ctx.beginPath();
  const ratio = Math.min(1, val / 20);
  const endAngle = 0.75 * Math.PI + ratio * 1.5 * Math.PI;
  ctx.arc(0, 0, 36, 0.75 * Math.PI, endAngle);
  ctx.lineWidth = 4;
  const grad = ctx.createLinearGradient(-36, 0, 36, 0);
  grad.addColorStop(0, '#10b981');
  grad.addColorStop(0.5, '#fbbf24');
  grad.addColorStop(1, '#ef4444');
  ctx.strokeStyle = grad;
  ctx.stroke();

  // Needle
  const needleAngle = 0.75 * Math.PI + ratio * 1.5 * Math.PI;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(32 * Math.cos(needleAngle), 32 * Math.sin(needleAngle));
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f43f5e';
  ctx.stroke();

  // Dial Hub
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Label text
  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SPEED', 0, 16);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(`${val.toFixed(1)} m/s`, 0, 27);
  ctx.restore();
}

/**
 * Draws the pie chart floating above the skater
 */
function drawPieChartOnCanvas(ctx, x, y, radius, pe, ke, te) {
  // Clamp negative PE to 0 for pie chart display
  const pePie = Math.max(0, pe);
  const kePie = Math.max(0, ke);
  const tePie = Math.max(0, te);
  const total = pePie + kePie + tePie;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.stroke();
  if (total <= 0.01) {
    ctx.restore();
    return;
  }
  const pAng = pePie / total * Math.PI * 2;
  const kAng = kePie / total * Math.PI * 2;
  const tAng = tePie / total * Math.PI * 2;
  let startAngle = -Math.PI / 2;

  // Potential Energy (Blue)
  if (pAng > 0.001) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius - 1, startAngle, startAngle + pAng);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    startAngle += pAng;
  }

  // Kinetic Energy (Green)
  if (kAng > 0.001) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius - 1, startAngle, startAngle + kAng);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    startAngle += kAng;
  }

  // Thermal Energy (Red)
  if (tAng > 0.001) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius - 1, startAngle, startAngle + tAng);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Updates physics states for one tick interval
 */
function updatePhysicsStep(dt, p, settings) {
  const {
    gravity,
    mass,
    friction,
    trackType,
    trackBumperEnds
  } = settings;
  if (p.isDragging) return;
  if (p.isOnTrack) {
    // 1. Calculate track slope angles
    const slope = getTrackSlope(trackType, p.x);
    const theta = Math.atan(slope);

    // 2. Compute Accelerations
    const aGravity = -gravity * Math.sin(theta);
    const normalForce = mass * gravity * Math.cos(theta);
    let aFriction = 0;
    if (Math.abs(p.v) > 0.001) {
      aFriction = -friction * gravity * Math.cos(theta) * Math.sign(p.v);
    }
    const aTotal = aGravity + aFriction;

    // 3. Trial Velocity Step
    let nextV = p.v + aTotal * dt;

    // 4. Static Friction Lock
    if (Math.abs(nextV) < 0.05 && Math.abs(aGravity) < friction * gravity * Math.cos(theta)) {
      nextV = 0;
    }

    // 5. Compute position step
    const dx_dt = nextV / Math.sqrt(1 + slope * slope);
    let nextX = p.x + dx_dt * dt * 50; // Convert m/s to pixels/s (1m = 50px)

    // 6. Handle boundaries (bumpers vs flying off)
    let bounced = false;
    if (nextX < 100) {
      if (trackBumperEnds) {
        nextX = 100;
        bounced = true;
      } else {
        p.isOnTrack = false;
        p.vx = nextV * Math.cos(theta);
        p.vy = nextV * Math.sin(theta);
        p.x = 99;
        p.y = getTrackY(trackType, 100) - 2;
        return;
      }
    } else if (nextX > 700) {
      if (trackBumperEnds) {
        nextX = 700;
        bounced = true;
      } else {
        p.isOnTrack = false;
        p.vx = nextV * Math.cos(theta);
        p.vy = nextV * Math.sin(theta);
        p.x = 701;
        p.y = getTrackY(trackType, 700) - 2;
        return;
      }
    }
    const nextY = getTrackY(trackType, nextX);

    // 7. Friction work (Thermal Energy accumulation)
    const ds = Math.abs(dx_dt * dt);
    const dE_thermal = friction * normalForce * ds;
    const nextE_thermal = p.thermalEnergy + dE_thermal;

    // 8. Energy conservation checks
    const peNext = mass * gravity * (p.referenceHeight - nextY) / 50;
    const keNext = p.E_initial - peNext - nextE_thermal;
    if (keNext < 0 || bounced) {
      // Bounce / Turn back
      p.v = -p.v;
    } else {
      p.x = nextX;
      p.y = nextY;
      p.thermalEnergy = nextE_thermal;

      // Correct speed magnitude to prevent numerical integrator drift
      const targetSpeed = Math.sqrt(2 * keNext / mass);
      p.v = (nextV >= 0 ? 1 : -1) * targetSpeed;
    }
  } else {
    // Projectile Free-fall motion
    p.vy += gravity * dt;
    p.x += p.vx * dt * 50;
    p.y += p.vy * dt * 50;

    // Ground Collision
    if (p.y >= 500) {
      p.y = 500;
      p.vy = 0;

      // Ground sliding friction
      const aFriction = -friction * gravity * Math.sign(p.vx);
      const prevVx = p.vx;
      p.vx += aFriction * dt;
      if (Math.sign(prevVx) !== Math.sign(p.vx)) {
        p.vx = 0;
      }

      // Thermal energy dissipation
      const ds = Math.abs(prevVx * dt);
      p.thermalEnergy += friction * mass * gravity * ds;
    }

    // Check snapping back onto track
    if (p.x >= 100 && p.x <= 700) {
      const trackY = getTrackY(trackType, p.x);
      if (Math.abs(p.y - trackY) < 15) {
        p.y = trackY;
        p.isOnTrack = true;

        // Project 2D velocity vectors onto the track tangent angle
        const slope = getTrackSlope(trackType, p.x);
        const theta = Math.atan(slope);
        p.v = p.vx * Math.cos(theta) + p.vy * Math.sin(theta);
        p.vx = 0;
        p.vy = 0;

        // Reset the total energy baseline to keep physical consistency
        const pe = mass * gravity * (p.referenceHeight - p.y) / 50;
        const ke = 0.5 * mass * p.v * p.v;
        p.E_initial = pe + ke + p.thermalEnergy;
      }
    }
  }
}

/**
 * Main draw call that renders elements on canvas
 */
function renderCanvasFrame(ctx, canvas, p, settings, time) {
  const {
    showGrid,
    showSpeedOverlay,
    showReferenceLine,
    showPieChart,
    trackType,
    skaterCharacter
  } = settings;
  const width = canvas.width;
  const height = canvas.height;

  // Clear Screen
  ctx.clearRect(0, 0, width, height);

  // Background Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#0b0f19');
  skyGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Meter Grid
  if (showGrid) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

    // Verticals
    for (let x = 50; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 500);
      ctx.stroke();
      const meters = (x - 100) / 50;
      if (meters >= 0 && meters <= 12) {
        ctx.textAlign = 'center';
        ctx.fillText(`${meters.toFixed(0)}m`, x, 495);
      }
    }

    // Horizontals
    for (let y = 50; y <= 500; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      const heightMeters = (p.referenceHeight - y) / 50;
      ctx.textAlign = 'left';
      ctx.fillText(`${heightMeters.toFixed(0)}m`, 10, y - 4);
    }
    ctx.restore();
  }

  // Draw Ground
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(0, 500, width, height - 500);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 500);
  ctx.lineTo(width, 500);
  ctx.stroke();

  // Reference Height Line
  if (showReferenceLine) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, p.referenceHeight);
    ctx.lineTo(width, p.referenceHeight);
    ctx.stroke();

    // Draggable Line Tag
    ctx.fillStyle = '#2563eb';
    ctx.setLineDash([]);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(8, p.referenceHeight - 10, 48, 20, 4);
    } else {
      ctx.rect(8, p.referenceHeight - 10, 48, 20);
    }
    ctx.fill();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('0 m', 32, p.referenceHeight);
    ctx.restore();
  }

  // Track Rail
  drawTrack(ctx, trackType);

  // Draw Skater Avatar
  ctx.save();
  const slope = p.isOnTrack ? getTrackSlope(trackType, p.x) : Math.atan2(p.vy, p.vx);
  const theta = p.isOnTrack ? Math.atan(slope) : slope;
  ctx.translate(p.x, p.y);
  if (skaterCharacter === 'ball') {
    const ballGrad = ctx.createRadialGradient(-4, -4, 0, 0, 0, 14);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.3, '#f472b6');
    ballGrad.addColorStop(1, '#db2777');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (skaterCharacter === 'dog') {
    ctx.rotate(theta);

    // Skateboard
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-20, -3, 40, 6, 2);
    } else {
      ctx.rect(-20, -3, 40, 6);
    }
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-12, 5, 4, 0, Math.PI * 2);
    ctx.arc(12, 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pup Body
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-12, -18, 24, 15, 6);
    } else {
      ctx.rect(-12, -18, 24, 15);
    }
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(8, -22, 7, 0, Math.PI * 2);
    ctx.fill();

    // Ear
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(4, -22, 3, 6, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Face Details
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(14, -22, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9, -24, 1, 0, Math.PI * 2);
    ctx.fill();

    // Tail Wag animation
    const tailWag = Math.sin(time * 0.25) * 6;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.lineTo(-18, -18 + tailWag);
    ctx.stroke();
  } else {
    // Human Figure
    ctx.rotate(theta);

    // Board
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-18, -3, 36, 6, 2);
    } else {
      ctx.rect(-18, -3, 36, 6);
    }
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-10, 5, 4, 0, Math.PI * 2);
    ctx.arc(10, 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    // Spine
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -22);
    ctx.stroke();

    // Crouching legs
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-8, -2);
    ctx.moveTo(0, -6);
    ctx.lineTo(8, -2);
    ctx.stroke();

    // Balancing arms animation
    const armShift = Math.sin(time * 0.08) * 3;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-12, -13 + armShift);
    ctx.moveTo(0, -18);
    ctx.lineTo(12, -13 - armShift);
    ctx.stroke();

    // Head (Helmet)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Speed Vector Overlay
  if (showSpeedOverlay) {
    const vxVal = p.isOnTrack ? p.v * Math.cos(theta) : p.vx;
    const vyVal = p.isOnTrack ? p.v * Math.sin(theta) : p.vy;
    drawSpeedOverlay(ctx, p.x, p.y, vxVal, vyVal, p.isOnTrack, trackType);
  }

  // Floating Pie Chart
  if (showPieChart) {
    const h = (p.referenceHeight - p.y) / 50;
    const peVal = settings.mass * settings.gravity * h;
    const keVal = p.isOnTrack ? 0.5 * settings.mass * p.v * p.v : 0.5 * settings.mass * (p.vx * p.vx + p.vy * p.vy);
    const teVal = p.thermalEnergy;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 15);
    ctx.lineTo(p.x, p.y - 38);
    ctx.stroke();
    drawPieChartOnCanvas(ctx, p.x, p.y - 60, 20, peVal, keVal, teVal);
    ctx.restore();
  }

  // Render corner speedometer
  const speed = p.isOnTrack ? Math.abs(p.v) : Math.hypot(p.vx, p.vy);
  drawSpeedometerOnCanvas(ctx, speed);
}

/**
 * --- REACT MAIN COMPONENT ---
 */
function CustomEnergySkateParkBasicsInner({
  onBack,
  title
}) {
  // --- STATE DECLARATIONS ---
  const [trackType, setTrackType] = useState('bowl'); // 'bowl' | 'ramp' | 'doubleWell'
  const [gravity, setGravity] = useState(9.8); // m/s^2 (Space 0, Earth 9.8, etc.)
  const [mass, setMass] = useState(50); // kg (5 to 100)
  const [friction, setFriction] = useState(0.02); // Friction coefficient (0 to 0.15)
  const [skaterCharacter, setSkaterCharacter] = useState('skater'); // 'skater' | 'ball' | 'dog'
  const [motionMode, setMotionMode] = useState('normal'); // 'normal' | 'slow'
  const [isPaused, setIsPaused] = useState(false);

  // Toggles
  const [showGrid, setShowGrid] = useState(false);
  const [showSpeedOverlay, setShowSpeedOverlay] = useState(false);
  const [showReferenceLine, setShowReferenceLine] = useState(false);
  const [showPieChart, setShowPieChart] = useState(true);
  const [trackBumperEnds, setTrackBumperEnds] = useState(true);

  // --- REFS ---
  const canvasRef = useRef(null);

  // High-performance state tracker
  const physicsRef = useRef({
    x: 150,
    // Pixels
    y: 0,
    // Pixels
    v: 0,
    // m/s
    vx: 0,
    // m/s
    vy: 0,
    // m/s
    isOnTrack: true,
    thermalEnergy: 0,
    // Joules
    E_initial: 0,
    // Joules
    isDragging: false,
    isDraggingReferenceLine: false,
    referenceHeight: 500 // Pixels (represents y = 500px as 0m)
  });
  const settingsRef = useRef({
    gravity,
    mass,
    friction,
    trackType,
    showGrid,
    showSpeedOverlay,
    showReferenceLine,
    showPieChart,
    motionMode,
    isPaused,
    skaterCharacter,
    trackBumperEnds
  });

  // Keep setting values fresh in animation loop
  useEffect(() => {
    settingsRef.current = {
      gravity,
      mass,
      friction,
      trackType,
      showGrid,
      showSpeedOverlay,
      showReferenceLine,
      showPieChart,
      motionMode,
      isPaused,
      skaterCharacter,
      trackBumperEnds
    };
  }, [gravity, mass, friction, trackType, showGrid, showSpeedOverlay, showReferenceLine, showPieChart, motionMode, isPaused, skaterCharacter, trackBumperEnds]);

  // Position Reset Action
  const resetSkaterPosition = type => {
    const p = physicsRef.current;
    p.x = 150;
    p.y = getTrackY(type, 150);
    p.v = 0;
    p.vx = 0;
    p.vy = 0;
    p.isOnTrack = true;
    p.thermalEnergy = 0;
    const pe = mass * gravity * (p.referenceHeight - p.y) / 50;
    p.E_initial = pe;
  };
  const handleResetAll = () => {
    setTrackType('bowl');
    setGravity(9.8);
    setMass(50);
    setFriction(0.02);
    setSkaterCharacter('skater');
    setMotionMode('normal');
    setIsPaused(false);
    setShowGrid(false);
    setShowSpeedOverlay(false);
    setShowReferenceLine(false);
    setShowPieChart(true);
    setTrackBumperEnds(true);
    const p = physicsRef.current;
    p.x = 150;
    p.y = getTrackY('bowl', 150);
    p.v = 0;
    p.vx = 0;
    p.vy = 0;
    p.isOnTrack = true;
    p.thermalEnergy = 0;
    p.referenceHeight = 500;
    const pe = 50 * 9.8 * (500 - p.y) / 50;
    p.E_initial = pe;
  };
  const handleStepForward = () => {
    const p = physicsRef.current;
    const settings = settingsRef.current;
    const dt = 1 / 60;
    updatePhysicsStep(dt, p, settings);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderCanvasFrame(ctx, canvas, p, settings, 0);
      }
    }
  };

  // Real-time DOM display updating
  const updateDOM = (ke, pe, te, total) => {
    const maxVal = Math.max(Math.abs(ke), Math.abs(pe), Math.abs(te), Math.abs(total), 40);
    const updateBarElement = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (val >= 0) {
        const h = val / maxVal * 110;
        el.style.bottom = '50px';
        el.style.height = `${h}px`;
        el.style.borderRadius = '4px 4px 0 0';
      } else {
        const h = Math.abs(val) / maxVal * 40;
        el.style.bottom = `${50 - h}px`;
        el.style.height = `${h}px`;
        el.style.borderRadius = '0 0 4px 4px';
      }
    };
    updateBarElement('bar-ke', ke);
    updateBarElement('bar-pe', pe);
    updateBarElement('bar-te', te);
    updateBarElement('bar-total', total);
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${val.toFixed(0)} J`;
    };
    setTxt('val-ke', ke);
    setTxt('val-pe', pe);
    setTxt('val-te', te);
    setTxt('val-total', total);
  };

  // Animation Loop Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animFrameId;
    let frameCount = 0;
    const tick = () => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(tick);
      return;
    }
      const p = physicsRef.current;
      const settings = settingsRef.current;
      frameCount++;
      if (!settings.isPaused && !p.isDragging) {
        const dt = (settings.motionMode === 'slow' ? 0.25 : 1.0) * (1 / 60);
        updatePhysicsStep(dt, p, settings);
      }
      renderCanvasFrame(ctx, canvas, p, settings, frameCount);
      const curSpeed = p.isOnTrack ? Math.abs(p.v) : Math.hypot(p.vx, p.vy);
      const h = (p.referenceHeight - p.y) / 50;
      const pe = settings.mass * settings.gravity * h;
      const ke = p.isOnTrack ? 0.5 * settings.mass * p.v * p.v : 0.5 * settings.mass * (p.vx * p.vx + p.vy * p.vy);
      updateDOM(ke, pe, p.thermalEnergy, p.E_initial);

      // Gauge needle updates via direct DOM manipulation
      const ring = document.getElementById('speed-gauge-ring');
      const text = document.getElementById('speed-gauge-text');
      if (ring) {
        const dashVal = Math.min(1, curSpeed / 20) * 157;
        ring.setAttribute('stroke-dasharray', `${dashVal} 314`);
      }
      if (text) {
        text.textContent = `${curSpeed.toFixed(1)} m/s`;
      }
      animFrameId = requestAnimationFrame(tick);
    };
    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [trackType]);
  const getMouseCoordinates = e => {
    const canvas = canvasRef.current;
    if (!canvas) return {
      mx: 0,
      my: 0
    };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    const displayedWidth = canvas.width * scale;
    const displayedHeight = canvas.height * scale;
    const offsetX = (rect.width - displayedWidth) / 2;
    const offsetY = (rect.height - displayedHeight) / 2;
    const mx = (clientX - rect.left - offsetX) / scale;
    const my = (clientY - rect.top - offsetY) / scale;
    return {
      mx,
      my
    };
  };

  // Pointer dragging event handlers
  const handlePointerDown = e => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const {
      mx: x,
      my: y
    } = getMouseCoordinates(e);
    const p = physicsRef.current;

    // Draggable Reference Line Handle
    if (showReferenceLine) {
      if (Math.abs(y - p.referenceHeight) < 15 && x >= 8 && x <= 56) {
        p.isDraggingReferenceLine = true;
        e.target.setPointerCapture(e.pointerId);
        return;
      }
    }

    // Draggable Skater
    const dist = Math.hypot(x - p.x, y - p.y);
    if (dist < 32) {
      p.isDragging = true;
      p.x = x;
      p.y = y;
      p.v = 0;
      p.vx = 0;
      p.vy = 0;
      p.isOnTrack = false;
      p.thermalEnergy = 0;
      e.target.setPointerCapture(e.pointerId);
      return;
    }
  };
  const handlePointerMove = e => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const {
      mx: x,
      my: y
    } = getMouseCoordinates(e);
    const p = physicsRef.current;
    if (p.isDraggingReferenceLine) {
      const oldRef = p.referenceHeight;
      p.referenceHeight = Math.max(100, Math.min(520, y));
      const deltaPE = mass * gravity * (p.referenceHeight - oldRef) / 50;
      p.E_initial += deltaPE;
    } else if (p.isDragging) {
      const constrainedX = Math.max(15, Math.min(canvas.width - 15, x));
      const constrainedY = Math.max(15, Math.min(canvas.height - 15, y));
      if (constrainedX >= 100 && constrainedX <= 700) {
        const trY = getTrackY(trackType, constrainedX);
        if (Math.abs(constrainedY - trY) < 35) {
          p.x = constrainedX;
          p.y = trY;
          p.isOnTrack = true;
          return;
        }
      }
      p.x = constrainedX;
      p.y = constrainedY;
      p.isOnTrack = false;
    }
  };
  const handlePointerUp = e => {
    const p = physicsRef.current;
    if (p.isDraggingReferenceLine) {
      p.isDraggingReferenceLine = false;
      e.target.releasePointerCapture(e.pointerId);
    } else if (p.isDragging) {
      p.isDragging = false;
      e.target.releasePointerCapture(e.pointerId);
      const pe = mass * gravity * (p.referenceHeight - p.y) / 50;
      p.E_initial = pe;
      p.thermalEnergy = 0;
      p.v = 0;
      p.vx = 0;
      p.vy = 0;
    }
  };

  // Mount initialization
  useEffect(() => {
    resetSkaterPosition(trackType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    color: '#f8fafc',
    background: 'transparent',
    fontFamily: "'Inter', sans-serif"
  }}>
      {/* Main Workspace Layout */}
      <div style={{
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      position: 'relative'
    }}>
        
        {/* Canvas Simulation Window */}
        <div style={{
        flex: 1,
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 340px 20px 20px',
        boxSizing: 'border-box'
      }}>
          <canvas ref={canvasRef} width={800} height={600} style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block',
          cursor: 'crosshair',
          background: '#050510',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />

          {/* Draggable indicator prompt */}
          <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          background: 'rgba(0,0,0,0.4)',
          padding: '4px 8px',
          borderRadius: '6px',
          pointerEvents: 'none'
        }}>
            <HelpCircle size={12} /> Place the skater on or above the track to start
          </div>
        </div>

        {/* Right Glassmorphic Control Panel */}
        <aside style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '300px',
        maxHeight: 'calc(100% - 180px)',
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 10,
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
          
          {/* Energy Bar Chart Block */}
          <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
            <div style={{
            fontSize: '14px',
            color: '#94a3b8',
            fontWeight: '600'
          }}>Energy Tracking (Joules)</div>
            
            {/* Bars container */}
            <div style={{
            display: 'flex',
            height: '170px',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            padding: '0 8px',
            position: 'relative',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.03)',
            marginBottom: '10px'
          }}>
              {/* Reference zero line */}
              <div id="bar-zero-line" style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '1px',
              background: 'rgba(255,255,255,0.25)',
              bottom: '50px',
              pointerEvents: 'none'
            }} />

              {/* Kinetic Energy (Green) */}
              <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '32px',
              height: '100%',
              position: 'relative'
            }}>
                <div id="bar-ke" style={{
                position: 'absolute',
                bottom: '50px',
                width: '22px',
                background: '#10b981',
                borderRadius: '3px 3px 0 0',
                height: '0px',
                minHeight: '1px',
                transition: 'height 0.05s linear'
              }} />
                <div style={{
                position: 'absolute',
                bottom: '-20px',
                fontSize: '9px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>Kin</div>
              </div>

              {/* Potential Energy (Blue) */}
              <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '32px',
              height: '100%',
              position: 'relative'
            }}>
                <div id="bar-pe" style={{
                position: 'absolute',
                bottom: '50px',
                width: '22px',
                background: '#3b82f6',
                borderRadius: '3px 3px 0 0',
                height: '0px',
                minHeight: '1px',
                transition: 'height 0.05s linear'
              }} />
                <div style={{
                position: 'absolute',
                bottom: '-20px',
                fontSize: '9px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>Pot</div>
              </div>

              {/* Thermal Energy (Red) */}
              <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '32px',
              height: '100%',
              position: 'relative'
            }}>
                <div id="bar-te" style={{
                position: 'absolute',
                bottom: '50px',
                width: '22px',
                background: '#ef4444',
                borderRadius: '3px 3px 0 0',
                height: '0px',
                minHeight: '1px',
                transition: 'height 0.05s linear'
              }} />
                <div style={{
                position: 'absolute',
                bottom: '-20px',
                fontSize: '9px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>Th</div>
              </div>

              {/* Total Energy (Gold) */}
              <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '32px',
              height: '100%',
              position: 'relative'
            }}>
                <div id="bar-total" style={{
                position: 'absolute',
                bottom: '50px',
                width: '22px',
                background: '#fbbf24',
                borderRadius: '3px 3px 0 0',
                height: '0px',
                minHeight: '1px',
                transition: 'height 0.05s linear'
              }} />
                <div style={{
                position: 'absolute',
                bottom: '-20px',
                fontSize: '9px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>Tot</div>
              </div>
            </div>

            {/* Readouts */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            fontSize: '11px',
            background: 'rgba(255,255,255,0.02)',
            padding: '8px',
            borderRadius: '6px'
          }}>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
                <span style={{
                color: '#10b981'
              }}>Kinetic:</span>
                <span id="val-ke" style={{
                fontWeight: '600'
              }}>0 J</span>
              </div>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
                <span style={{
                color: '#3b82f6'
              }}>Potential:</span>
                <span id="val-pe" style={{
                fontWeight: '600'
              }}>0 J</span>
              </div>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
                <span style={{
                color: '#ef4444'
              }}>Thermal:</span>
                <span id="val-te" style={{
                fontWeight: '600'
              }}>0 J</span>
              </div>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
                <span style={{
                color: '#fbbf24'
              }}>Total:</span>
                <span id="val-total" style={{
                fontWeight: '600'
              }}>0 J</span>
              </div>
            </div>
          </div>

          {/* Interactive Parameters and Sliders */}
          <div style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
            
            {/* Preset Track Selector */}
            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
              <div style={{
              fontSize: '13px',
              color: '#94a3b8',
              fontWeight: '600'
            }}>Select Track Preset</div>
              <div style={{
              display: 'flex',
              gap: '6px'
            }}>
                {[{
                id: 'bowl',
                label: 'U-Bowl',
                shape: '∪'
              }, {
                id: 'ramp',
                label: 'Ramp',
                shape: '╲'
              }, {
                id: 'doubleWell',
                label: 'Double-Well',
                shape: '∽'
              }].map(item => <button key={item.id} onClick={() => {
                setTrackType(item.id);
                resetSkaterPosition(item.id);
              }} style={{
                flex: 1,
                padding: '8px 4px',
                background: trackType === item.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                border: trackType === item.id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}>
                    <span style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  lineHeight: 1
                }}>{item.shape}</span>
                    <span>{item.label}</span>
                  </button>)}
              </div>
            </div>

            {/* Gravity Slider */}
            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#f8fafc',
              fontWeight: '500'
            }}>
                <span style={{
                color: '#94a3b8'
              }}>Gravity</span>
                <span style={{
                color: '#a855f7',
                fontWeight: 'bold'
              }}>{gravity.toFixed(1)} m/s²</span>
              </div>
              <input type="range" min="0" max="25" step="0.1" value={gravity} onChange={e => {
              const val = parseFloat(e.target.value);
              setGravity(val);
              const p = physicsRef.current;
              const h = (p.referenceHeight - p.y) / 50;
              const pe = mass * val * h;
              p.E_initial = pe + (p.isOnTrack ? 0.5 * mass * p.v * p.v : 0.5 * mass * (p.vx * p.vx + p.vy * p.vy)) + p.thermalEnergy;
            }} style={{
              width: '100%',
              accentColor: '#a855f7'
            }} />
              <div style={{
              display: 'flex',
              gap: '4px'
            }}>
                {[{
                label: 'Space',
                val: 0
              }, {
                label: 'Moon',
                val: 1.6
              }, {
                label: 'Earth',
                val: 9.8
              }, {
                label: 'Jupiter',
                val: 24.8
              }].map(p => <button key={p.label} onClick={() => {
                setGravity(p.val);
                const ph = physicsRef.current;
                const h = (ph.referenceHeight - ph.y) / 50;
                const pe = mass * p.val * h;
                ph.E_initial = pe + (ph.isOnTrack ? 0.5 * mass * ph.v * ph.v : 0.5 * mass * (ph.vx * ph.vx + ph.vy * ph.vy)) + ph.thermalEnergy;
              }} style={{
                flex: 1,
                padding: '3px 0',
                background: gravity === p.val ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                border: gravity === p.val ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                color: '#e2e8f0',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                    {p.label}
                  </button>)}
              </div>
            </div>

            {/* Friction Slider */}
            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#f8fafc',
              fontWeight: '500'
            }}>
                <span style={{
                color: '#94a3b8'
              }}>Friction coefficient</span>
                <span style={{
                color: '#ef4444',
                fontWeight: 'bold'
              }}>{friction === 0 ? 'None' : friction.toFixed(3)}</span>
              </div>
              <input type="range" min="0" max="0.15" step="0.005" value={friction} onChange={e => setFriction(parseFloat(e.target.value))} style={{
              width: '100%',
              accentColor: '#ef4444'
            }} />
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#94a3b8'
            }}>
                <span>None</span>
                <span>Medium</span>
                <span>Lots</span>
              </div>
            </div>

            {/* Mass Slider */}
            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#f8fafc',
              fontWeight: '500'
            }}>
                <span style={{
                color: '#94a3b8'
              }}>Skater Mass</span>
                <span style={{
                color: '#3b82f6',
                fontWeight: 'bold'
              }}>{mass} kg</span>
              </div>
              <input type="range" min="5" max="100" step="1" value={mass} onChange={e => {
              const newMass = parseFloat(e.target.value);
              const p = physicsRef.current;
              const h = (p.referenceHeight - p.y) / 50;
              const pe = newMass * gravity * h;
              const ke = p.isOnTrack ? 0.5 * newMass * p.v * p.v : 0.5 * newMass * (p.vx * p.vx + p.vy * p.vy);
              const ratio = newMass / mass;
              p.thermalEnergy *= ratio;
              p.E_initial = pe + ke + p.thermalEnergy;
              setMass(newMass);
            }} style={{
              width: '100%',
              accentColor: '#3b82f6'
            }} />
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#94a3b8'
            }}>
                <span>5 kg</span>
                <span>50 kg</span>
                <span>100 kg</span>
              </div>
            </div>

            {/* Skater character selector */}
            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
              <div style={{
              fontSize: '13px',
              color: '#94a3b8',
              fontWeight: '600'
            }}>Skater Avatar</div>
              <div style={{
              display: 'flex',
              gap: '4px'
            }}>
                {[{
                id: 'skater',
                label: 'Skater'
              }, {
                id: 'dog',
                label: 'Pup'
              }, {
                id: 'ball',
                label: 'Sphere'
              }].map(avatar => <button key={avatar.id} onClick={() => setSkaterCharacter(avatar.id)} style={{
                flex: 1,
                padding: '6px 0',
                background: skaterCharacter === avatar.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: skaterCharacter === avatar.id ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                    {avatar.label}
                  </button>)}
              </div>
            </div>

            {/* Toggles Container */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '8px'
          }}>
              <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
                <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} style={{
                cursor: 'pointer'
              }} />
                <span>Grid Overlay</span>
              </label>

              <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
                <input type="checkbox" checked={showReferenceLine} onChange={e => setShowReferenceLine(e.target.checked)} style={{
                cursor: 'pointer'
              }} />
                <span>Ref Height</span>
              </label>

              <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
                <input type="checkbox" checked={showSpeedOverlay} onChange={e => setShowSpeedOverlay(e.target.checked)} style={{
                cursor: 'pointer'
              }} />
                <span>Velocity Vector</span>
              </label>

              <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
                <input type="checkbox" checked={showPieChart} onChange={e => setShowPieChart(e.target.checked)} style={{
                cursor: 'pointer'
              }} />
                <span>Pie Chart</span>
              </label>

              <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              gridColumn: 'span 2'
            }}>
                <input type="checkbox" checked={trackBumperEnds} onChange={e => {
                setTrackBumperEnds(e.target.checked);
                if (e.target.checked) {
                  const p = physicsRef.current;
                  if (p.x < 100) p.x = 100;
                  if (p.x > 700) p.x = 700;
                }
              }} style={{
                cursor: 'pointer'
              }} />
                <span>Bounce at Track Ends</span>
              </label>
            </div>

            {/* Speedometer Gauge */}
            <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '8px'
          }}>
              <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: '600'
            }}>Speedometer</div>
              <div style={{
              position: 'relative',
              width: '120px',
              height: '65px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}>
                <svg width="120" height="120" style={{
                position: 'absolute',
                bottom: '-60px'
              }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeDasharray="157 314" transform="rotate(-180 60 60)" />
                  <circle id="speed-gauge-ring" cx="60" cy="60" r="50" fill="none" stroke="url(#speed-grad-panel)" strokeWidth="8" strokeDasharray="0 314" transform="rotate(-180 60 60)" style={{
                  transition: 'stroke-dasharray 0.05s linear'
                }} />
                  <defs>
                    <linearGradient id="speed-grad-panel" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="60%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <div id="speed-gauge-text" style={{
                fontSize: '18px',
                fontWeight: 'bold',
                zIndex: 1,
                color: '#f8fafc',
                fontFamily: 'monospace'
              }}>
                  0.0 m/s
                </div>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* Bottom sim control bar */}
      <footer style={{
      padding: '16px 24px',
      background: 'rgba(15, 23, 42, 0.6)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      zIndex: 10
    }}>
        {/* Play/Pause */}
        <button onClick={() => setIsPaused(!isPaused)} style={{
        background: isPaused ? '#10b981' : 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isPaused ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
        transition: 'all 0.2s'
      }} title={isPaused ? 'Resume' : 'Pause'}>
          {isPaused ? <Play size={20} fill="#fff" /> : <Pause size={20} fill="#fff" />}
        </button>

        {/* Manual frame stepping */}
        <button onClick={handleStepForward} disabled={!isPaused} style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        color: '#fff',
        cursor: isPaused ? 'pointer' : 'not-allowed',
        opacity: isPaused ? 1 : 0.4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s'
      }} title="Single Step Frame">
          <RefreshCw size={16} />
        </button>

        {/* Speed settings */}
        <div style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.3)',
        padding: '4px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
          {[{
          id: 'normal',
          label: 'Normal Speed'
        }, {
          id: 'slow',
          label: 'Slow Motion'
        }].map(mode => <button key={mode.id} onClick={() => setMotionMode(mode.id)} style={{
          padding: '6px 14px',
          background: motionMode === mode.id ? 'rgba(255,255,255,0.12)' : 'transparent',
          border: 'none',
          borderRadius: '16px',
          color: '#f8fafc',
          fontSize: '11px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}>
              {mode.label}
            </button>)}
        </div>

        {/* Action reset buttons */}
        <div style={{
        display: 'flex',
        gap: '10px',
        marginLeft: 'auto'
      }}>
          <button onClick={() => resetSkaterPosition(trackType)} style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          color: '#f8fafc',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}>
            Restart Skater
          </button>
          <button onClick={handleResetAll} style={{
          padding: '8px 16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px',
          color: '#ef4444',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}>
            Reset All
          </button>
        </div>
      </footer>
    </div>;
}
export default function CustomEnergySkateParkBasics({
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
            `}</style>
            
            <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomEnergySkateParkBasicsInner onBack={null} title={""} />
            </div>
        </div>;
}