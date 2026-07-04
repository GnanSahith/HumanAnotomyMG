import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Sliders, Eye, Layers, Lightbulb, Info, Sparkles, Activity, BookOpen, ArrowLeft, HelpCircle, Settings2 } from 'lucide-react';

// ============================================================================
// PHYSICS & BIOLOGICAL HELPER FUNCTIONS (FILE-LEVEL)
// ============================================================================

/**
 * Dan Bruton's Algorithm for converting light wavelength (380nm - 780nm) to RGB.
 * This represents the physiological response of the human eye to monochromatic light.
 * The gamma correction represents the non-linear response of human vision brightness.
 * 
 * @param {number} wavelength - Wavelength in nanometers (nm)
 * @returns {{r: number, g: number, b: number}} RGB color object [0-255]
 */
const wavelengthToRGB = wavelength => {
  let r = 0,
    g = 0,
    b = 0;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0.0;
    b = 1.0;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0.0;
    g = (wavelength - 440) / (490 - 440);
    b = 1.0;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0.0;
    g = 1.0;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1.0;
    b = 0.0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1.0;
    g = -(wavelength - 645) / (645 - 580);
    b = 0.0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1.0;
    g = 0.0;
    b = 0.0;
  }

  // Intensity factor falls off near the limits of human vision (380nm and 780nm)
  let factor = 0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 420 && wavelength <= 700) {
    factor = 1.0;
  } else if (wavelength >= 700 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  }
  const gamma = 0.8;
  const adjust = c => Math.round(c === 0 ? 0 : 255 * Math.pow(c * factor, gamma));
  return {
    r: adjust(r),
    g: adjust(g),
    b: adjust(b)
  };
};

/**
 * Classifies RGB values into standard human-recognizable color names.
 * Uses Euclidean distance in normalized RGB space.
 * 
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {string} Human color name
 */
const getColorName = (r, g, b) => {
  const sum = r + g + b;
  if (sum < 15) return 'Darkness (Black)';

  // Normalized vectors
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const baseColors = [{
    name: 'Red',
    r: 1,
    g: 0,
    b: 0
  }, {
    name: 'Orange',
    r: 1,
    g: 0.5,
    b: 0
  }, {
    name: 'Yellow',
    r: 1,
    g: 1,
    b: 0
  }, {
    name: 'Green',
    r: 0,
    g: 1,
    b: 0
  }, {
    name: 'Cyan',
    r: 0,
    g: 1,
    b: 1
  }, {
    name: 'Blue',
    r: 0,
    g: 0,
    b: 1
  }, {
    name: 'Purple',
    r: 0.5,
    g: 0,
    b: 0.8
  }, {
    name: 'Magenta',
    r: 1,
    g: 0,
    b: 1
  }, {
    name: 'White',
    r: 1,
    g: 1,
    b: 1
  }, {
    name: 'Grey',
    r: 0.5,
    g: 0.5,
    b: 0.5
  }];
  let bestName = 'Unknown';
  let minDistance = Infinity;
  for (const c of baseColors) {
    const dist = Math.sqrt(Math.pow(rN - c.r, 2) + Math.pow(gN - c.g, 2) + Math.pow(bN - c.b, 2));
    if (dist < minDistance) {
      minDistance = dist;
      bestName = c.name;
    }
  }
  if (sum > 720) return 'Bright White';
  if (sum < 100) return `Dim ${bestName}`;
  return bestName;
};

/**
 * Approximations of human cone receptor sensitivity curves (L, M, S cones).
 * Sensitivities are modeled as Gaussian distributions.
 */
const getLSensitivity = wl => Math.exp(-0.5 * Math.pow((wl - 560) / 45, 2)); // Peak: 560nm (Red-Yellow)
const getMSensitivity = wl => Math.exp(-0.5 * Math.pow((wl - 530) / 40, 2)); // Peak: 530nm (Green)
const getSSensitivity = wl => Math.exp(-0.5 * Math.pow((wl - 420) / 30, 2)); // Peak: 420nm (Blue)

// ============================================================================
// CANVAS VECTOR DRAWING HELPERS
// ============================================================================

/**
 * Draws a lightbulb vector onto the Canvas.
 */
const drawBulb = (ctx, x, y, color, intensity, size = 30) => {
  ctx.save();

  // Radial glow gradient for lit bulb
  if (intensity > 0) {
    const gradient = ctx.createRadialGradient(x, y, size * 0.1, x, y, size * 2.5);
    // Parse input rgb string to rgba to apply intensity alpha
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = match[0],
        g = match[1],
        b = match[2];
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
      gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${intensity * 0.4})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw lightbulb body silhouette
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  // Bulby round top
  ctx.arc(x, y, size * 0.8, -Math.PI / 6, 7 * Math.PI / 6, true);
  // Screw cap connection
  ctx.lineTo(x - size * 0.35, y + size * 0.9);
  ctx.lineTo(x + size * 0.35, y + size * 0.9);
  ctx.closePath();

  // Lit glass color vs unlit glass color
  ctx.fillStyle = intensity > 0 ? color : 'rgba(30, 30, 40, 0.6)';
  ctx.fill();
  ctx.stroke();

  // Screw Cap base
  ctx.fillStyle = '#636366';
  ctx.fillRect(x - size * 0.3, y + size * 0.9, size * 0.6, size * 0.25);
  ctx.strokeStyle = '#aeaeae';
  ctx.strokeRect(x - size * 0.3, y + size * 0.9, size * 0.6, size * 0.25);

  // Electrical contact
  ctx.fillStyle = '#2c2c2e';
  ctx.beginPath();
  ctx.arc(x, y + size * 1.15, size * 0.15, 0, Math.PI, false);
  ctx.fill();

  // Filament drawing inside the bulb
  ctx.beginPath();
  ctx.moveTo(x - size * 0.18, y + size * 0.7);
  ctx.lineTo(x - size * 0.18, y + size * 0.2);
  ctx.lineTo(x - size * 0.08, y);
  ctx.lineTo(x + size * 0.08, y);
  ctx.lineTo(x + size * 0.18, y + size * 0.2);
  ctx.lineTo(x + size * 0.18, y + size * 0.7);
  ctx.strokeStyle = intensity > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
};

/**
 * Draws the perceived thought bubble above the observer's head.
 */
const drawThoughtBubble = (ctx, bx, by, rgb) => {
  ctx.save();

  // Outer glassmorphism container for thought bubble
  ctx.beginPath();
  ctx.roundRect(bx - 90, by - 45, 180, 75, 16);
  ctx.fillStyle = 'rgba(20, 20, 25, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Small connection circles to the brain (thought bubble style)
  ctx.beginPath();
  ctx.arc(bx - 30, by + 45, 9, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 20, 25, 0.85)';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bx - 45, by + 58, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 20, 25, 0.85)';
  ctx.fill();
  ctx.stroke();

  // Perceived Color Preview Circle
  const cx = bx - 52;
  const cy = by - 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Internal visual structures inside the circle to represent "light rays"
  if (rgb.r > 20 || rgb.g > 20 || rgb.b > 20) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy);
    ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();
  }

  // Label text details (white text on dark bubble for maximum readability)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Perception', bx - 18, by - 12);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#a1a1aa';
  const colorName = getColorName(rgb.r, rgb.g, rgb.b);
  ctx.fillText(colorName, bx - 18, by + 4);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#71717a';
  ctx.fillText(`RGB(${rgb.r},${rgb.g},${rgb.b})`, bx - 18, by + 18);
  ctx.restore();
};

/**
 * Draws the cartoon observer head, eye details, brain wiring and calls the thought bubble.
 */
const drawHead = (ctx, x, y, perceivedRGB) => {
  ctx.save();

  // 1. Draw head silhouette (facing left)
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(161, 161, 170, 0.5)';
  ctx.lineWidth = 3;
  ctx.moveTo(x + 50, y + 140); // throat
  ctx.quadraticCurveTo(x + 75, y + 50, x + 75, y - 40); // back of skull
  ctx.quadraticCurveTo(x + 65, y - 110, x - 5, y - 110); // crown
  ctx.quadraticCurveTo(x - 55, y - 110, x - 65, y - 50); // forehead
  ctx.lineTo(x - 70, y - 35); // brow
  ctx.lineTo(x - 88, y - 25); // nose tip
  ctx.lineTo(x - 68, y - 15); // under nose
  ctx.lineTo(x - 72, y - 6); // top lip
  ctx.lineTo(x - 62, y + 4); // mouth gap
  ctx.lineTo(x - 72, y + 14); // bottom lip
  ctx.lineTo(x - 66, y + 32); // chin
  ctx.quadraticCurveTo(x - 52, y + 68, x - 42, y + 95); // jawline
  ctx.lineTo(x - 32, y + 140); // front of neck
  ctx.stroke();

  // 2. Draw eye anatomy detail
  const eyeX = x - 46;
  const eyeY = y - 24;

  // Eyeball (white)
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Iris (dynamic reaction: size/opacity varies slightly based on brightness)
  const isDark = perceivedRGB.r + perceivedRGB.g + perceivedRGB.b < 15;
  ctx.beginPath();
  ctx.arc(eyeX - 3, eyeY, 7, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#27272a' : '#2563eb'; // blue iris when lit, dark when unlit
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(eyeX - 5, eyeY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();

  // Eye reflection dot (gives life to the cartoon observer)
  ctx.beginPath();
  ctx.arc(eyeX - 7, eyeY - 2, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // 3. Draw brain / cognitive center
  const brainX = x + 15;
  const brainY = y - 45;
  ctx.beginPath();
  ctx.arc(brainX, brainY, 34, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();

  // Squiggly brain cognitive path (glows with the color perceived by the brain)
  ctx.beginPath();
  ctx.strokeStyle = perceivedRGB.r + perceivedRGB.g + perceivedRGB.b > 0 ? `rgba(${perceivedRGB.r}, ${perceivedRGB.g}, ${perceivedRGB.b}, 0.8)` : 'rgba(63, 63, 70, 0.4)';
  ctx.lineWidth = 2.5;
  ctx.arc(brainX - 8, brainY - 8, 14, Math.PI, 1.7 * Math.PI);
  ctx.arc(brainX + 8, brainY - 8, 14, 1.3 * Math.PI, 2 * Math.PI);
  ctx.arc(brainX + 12, brainY + 8, 12, 1.7 * Math.PI, 0.5 * Math.PI);
  ctx.arc(brainX - 12, brainY + 8, 12, 0.5 * Math.PI, 1.3 * Math.PI);
  ctx.stroke();

  // Draw optical neural line connecting eye to brain
  ctx.beginPath();
  ctx.moveTo(eyeX + 10, eyeY);
  ctx.bezierCurveTo(brainX - 30, eyeY + 10, brainX - 25, brainY + 20, brainX, brainY);
  ctx.strokeStyle = perceivedRGB.r + perceivedRGB.g + perceivedRGB.b > 0 ? `rgba(${perceivedRGB.r}, ${perceivedRGB.g}, ${perceivedRGB.b}, 0.55)` : 'rgba(63, 63, 70, 0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // 4. Draw Thought Bubble
  drawThoughtBubble(ctx, x - 10, y - 175, perceivedRGB);
  ctx.restore();
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function CustomColorVisionInner({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  // --------------------------------------------------------------------------
  // REACT STATE (Controls, Modes, and Panel Displays)
  // --------------------------------------------------------------------------
  const [mode, setMode] = useState('single'); // 'single' | 'rgb'
  const [bulbWavelength, setBulbWavelength] = useState(550); // Single bulb wavelength (nm)
  const [bulbIntensity, setBulbIntensity] = useState(1.0); // Single bulb intensity (0 to 1)

  // Filter settings
  const [filterActive, setFilterActive] = useState(false);
  const [filterWavelength, setFilterWavelength] = useState(500); // Filter wavelength center (nm)
  const [filterWidth, setFilterWidth] = useState(40); // Filter bandpass width (nm)

  // RGB Bulbs settings
  const [redIntensity, setRedIntensity] = useState(0.8); // Red bulb (650nm) intensity
  const [greenIntensity, setGreenIntensity] = useState(0.0); // Green bulb (530nm) intensity
  const [blueIntensity, setBlueIntensity] = useState(0.8); // Blue bulb (460nm) intensity

  // Display details
  const [beamDisplay, setBeamDisplay] = useState('particles'); // 'particles' | 'solid' | 'both'
  const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // --------------------------------------------------------------------------
  // REFERENCES FOR PHYSICS ANIMATION LOOP (avoiding closure staleness)
  // --------------------------------------------------------------------------
  const canvasRef = useRef(null);
  const settingsRef = useRef({});
  const particlesRef = useRef([]);
  const splashesRef = useRef([]);

  // Keep ref settings in perfect sync with React state values for the 60fps loop
  useEffect(() => {
    settingsRef.current = {
      mode,
      bulbWavelength,
      bulbIntensity,
      filterActive,
      filterWavelength,
      filterWidth,
      redIntensity,
      greenIntensity,
      blueIntensity,
      beamDisplay,
      isPlaying
    };
  }, [mode, bulbWavelength, bulbIntensity, filterActive, filterWavelength, filterWidth, redIntensity, greenIntensity, blueIntensity, beamDisplay, isPlaying]);

  // --------------------------------------------------------------------------
  // L, M, S CONE ACTIVATION MATH FOR UI METERS
  // --------------------------------------------------------------------------
  let coneL = 0;
  let coneM = 0;
  let coneS = 0;
  if (mode === 'single') {
    let trans = 1.0;
    if (filterActive) {
      const sigma = filterWidth / 2;
      trans = Math.exp(-0.5 * Math.pow((bulbWavelength - filterWavelength) / sigma, 2));
    }
    const effIntensity = bulbIntensity * trans;
    coneL = effIntensity * getLSensitivity(bulbWavelength);
    coneM = effIntensity * getMSensitivity(bulbWavelength);
    coneS = effIntensity * getSSensitivity(bulbWavelength);
  } else {
    // RGB Bulbs behave as three monochromatic emitters: Red(650nm), Green(530nm), Blue(460nm)
    coneL = redIntensity * getLSensitivity(650) + greenIntensity * getLSensitivity(530) + blueIntensity * getLSensitivity(460);
    coneM = redIntensity * getMSensitivity(650) + greenIntensity * getMSensitivity(530) + blueIntensity * getMSensitivity(460);
    coneS = redIntensity * getSSensitivity(650) + greenIntensity * getSSensitivity(530) + blueIntensity * getSSensitivity(460);
  }

  // Convert receptor signals to normalized percentages [0-100%]
  const lActivation = Math.min(100, Math.round(coneL * 100));
  const mActivation = Math.min(100, Math.round(coneM * 100));
  const sActivation = Math.min(100, Math.round(coneS * 100));

  // Compute live perceived color values for reference inside React UI
  let perceivedRGB = {
    r: 0,
    g: 0,
    b: 0
  };
  if (mode === 'single') {
    const raw = wavelengthToRGB(bulbWavelength);
    let trans = 1.0;
    if (filterActive) {
      const sigma = filterWidth / 2;
      trans = Math.exp(-0.5 * Math.pow((bulbWavelength - filterWavelength) / sigma, 2));
    }
    perceivedRGB = {
      r: Math.round(raw.r * bulbIntensity * trans),
      g: Math.round(raw.g * bulbIntensity * trans),
      b: Math.round(raw.b * bulbIntensity * trans)
    };
  } else {
    perceivedRGB = {
      r: Math.round(redIntensity * 255),
      g: Math.round(greenIntensity * 255),
      b: Math.round(blueIntensity * 255)
    };
  }

  // --------------------------------------------------------------------------
  // PHYSICS ANIMATION LOOP IMPLEMENTATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    /**
     * Spawns new photons (particles) and updates active particle streams.
     * Evaluates photon transmission coefficients at the filter barrier (Gaussian bandpass filter).
     */
    const updatePhysics = () => {
    if (!isPlayingRef.current) {
      if (lastTimeRef && lastTimeRef.current !== undefined) lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(updatePhysics);
      return;
    }
      const settings = settingsRef.current;
      if (!settings.isPlaying) return;
      const particles = particlesRef.current;
      const splashes = splashesRef.current;

      // 1. Spawning Photons based on selected mode
      if (settings.mode === 'single') {
        if (settings.bulbIntensity > 0) {
          // Emits photons proportionally to intensity
          const countToSpawn = Math.floor(settings.bulbIntensity * 3.5);
          const rgb = wavelengthToRGB(settings.bulbWavelength);
          for (let i = 0; i < countToSpawn; i++) {
            if (Math.random() < 0.65) {
              particles.push({
                x: 80,
                y: 250 + (Math.random() - 0.5) * 16,
                vx: 3.5 + Math.random() * 2,
                vy: (Math.random() - 0.5) * 1.2,
                color: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                wavelength: settings.bulbWavelength,
                size: 2.8 + Math.random() * 2,
                alpha: 1.0,
                passedFilter: false,
                blocked: false
              });
            }
          }
        }
      } else {
        // RGB mode - separate streams
        // Red (650nm)
        if (settings.redIntensity > 0) {
          const spawnCount = Math.floor(settings.redIntensity * 3.5);
          for (let i = 0; i < spawnCount; i++) {
            if (Math.random() < 0.65) {
              const vx = 3.5 + Math.random() * 2;
              const targetY = 250 + (Math.random() - 0.5) * 12;
              const dx = 620 - 80;
              const dy = targetY - 150;
              particles.push({
                x: 80,
                y: 150 + (Math.random() - 0.5) * 10,
                vx: vx,
                vy: dy / dx * vx + (Math.random() - 0.5) * 0.4,
                color: 'rgb(255, 0, 0)',
                wavelength: 650,
                size: 2.8 + Math.random() * 2,
                alpha: settings.redIntensity,
                passedFilter: true,
                blocked: false
              });
            }
          }
        }
        // Green (530nm)
        if (settings.greenIntensity > 0) {
          const spawnCount = Math.floor(settings.greenIntensity * 3.5);
          for (let i = 0; i < spawnCount; i++) {
            if (Math.random() < 0.65) {
              const vx = 3.5 + Math.random() * 2;
              const targetY = 250 + (Math.random() - 0.5) * 12;
              const dx = 620 - 80;
              const dy = targetY - 250;
              particles.push({
                x: 80,
                y: 250 + (Math.random() - 0.5) * 10,
                vx: vx,
                vy: dy / dx * vx + (Math.random() - 0.5) * 0.4,
                color: 'rgb(0, 255, 0)',
                wavelength: 530,
                size: 2.8 + Math.random() * 2,
                alpha: settings.greenIntensity,
                passedFilter: true,
                blocked: false
              });
            }
          }
        }
        // Blue (460nm)
        if (settings.blueIntensity > 0) {
          const spawnCount = Math.floor(settings.blueIntensity * 3.5);
          for (let i = 0; i < spawnCount; i++) {
            if (Math.random() < 0.65) {
              const vx = 3.5 + Math.random() * 2;
              const targetY = 250 + (Math.random() - 0.5) * 12;
              const dx = 620 - 80;
              const dy = targetY - 350;
              particles.push({
                x: 80,
                y: 350 + (Math.random() - 0.5) * 10,
                vx: vx,
                vy: dy / dx * vx + (Math.random() - 0.5) * 0.4,
                color: 'rgb(0, 0, 255)',
                wavelength: 460,
                size: 2.8 + Math.random() * 2,
                alpha: settings.blueIntensity,
                passedFilter: true,
                blocked: false
              });
            }
          }
        }
      }

      // 2. Advancing existing particles & assessing boundary interactions
      const activeParticles = [];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.blocked) {
          // Slow down and fade out blocked photons
          p.vx *= 0.75;
          p.vy *= 0.75;
          p.alpha -= 0.12;
          p.x += p.vx;
          p.y += p.vy;
          if (p.alpha > 0.05) {
            activeParticles.push(p);
          }
        } else {
          // Advance normal photon positions
          p.x += p.vx;
          p.y += p.vy;

          // Bandpass filter boundary at x = 380 in Single Bulb Mode
          if (settings.mode === 'single' && settings.filterActive && !p.passedFilter && p.x >= 380) {
            p.passedFilter = true;

            // Calculate transmission probability T based on Gaussian curve
            const lambda_b = p.wavelength;
            const lambda_f = settings.filterWavelength;
            const sigma = settings.filterWidth / 2;
            const T = Math.exp(-0.5 * Math.pow((lambda_b - lambda_f) / sigma, 2));
            if (Math.random() > T) {
              // Photon gets absorbed by the filter material
              p.blocked = true;
            } else {
              // Photon is transmitted with reduced intensity
              p.alpha *= T;
            }
          }

          // Trigger retina absorption splash when reaching the eye boundary at x >= 625
          if (p.x >= 625) {
            const splCount = Math.floor(Math.random() * 3) + 1;
            for (let s = 0; s < splCount; s++) {
              splashes.push({
                x: 625,
                y: p.y,
                vx: -(1 + Math.random() * 1.5),
                // fly back slightly
                vy: (Math.random() - 0.5) * 3,
                color: p.color,
                size: p.size * 0.6,
                alpha: p.alpha * 0.8,
                life: 12 + Math.random() * 8
              });
            }
          } else {
            activeParticles.push(p);
          }
        }
      }
      particlesRef.current = activeParticles;

      // 3. Update Retina absorption splash particles
      const activeSplashes = [];
      for (let i = 0; i < splashes.length; i++) {
        const s = splashes[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 1 / s.life;
        if (s.alpha > 0) {
          activeSplashes.push(s);
        }
      }
      splashesRef.current = activeSplashes;
    };

    /**
     * Core renderer function. Draws all visual components in sequence at 60fps.
     */
    const render = () => {
      // Execute physics calculations
      updatePhysics();

      // Clear Canvas to zinc dark background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render subtle lab-style grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      const settings = settingsRef.current;

      // Live computation of perceived color values
      let livePerceived = {
        r: 0,
        g: 0,
        b: 0
      };
      if (settings.mode === 'single') {
        const raw = wavelengthToRGB(settings.bulbWavelength);
        let trans = 1.0;
        if (settings.filterActive) {
          const sigma = settings.filterWidth / 2;
          trans = Math.exp(-0.5 * Math.pow((settings.bulbWavelength - settings.filterWavelength) / sigma, 2));
        }
        livePerceived = {
          r: Math.round(raw.r * settings.bulbIntensity * trans),
          g: Math.round(raw.g * settings.bulbIntensity * trans),
          b: Math.round(raw.b * settings.bulbIntensity * trans)
        };
      } else {
        livePerceived = {
          r: Math.round(settings.redIntensity * 255),
          g: Math.round(settings.greenIntensity * 255),
          b: Math.round(settings.blueIntensity * 255)
        };
      }

      // A. RENDER SOLID LIGHT BEAMS (Additive mixing via Canvas Screen composition)
      if (settings.beamDisplay === 'solid' || settings.beamDisplay === 'both') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        if (settings.mode === 'single') {
          const rgb = wavelengthToRGB(settings.bulbWavelength);
          if (settings.filterActive) {
            // Beam 1: Bulb to Filter (pre-filtered beam)
            const gradient1 = ctx.createLinearGradient(80, 250, 380, 250);
            gradient1.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${settings.bulbIntensity * 0.45})`);
            gradient1.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${settings.bulbIntensity * 0.3})`);
            ctx.fillStyle = gradient1;
            ctx.beginPath();
            ctx.moveTo(80, 238);
            ctx.lineTo(380, 202);
            ctx.lineTo(380, 298);
            ctx.lineTo(80, 262);
            ctx.closePath();
            ctx.fill();

            // Beam 2: Filter to Eye (transmitted beam)
            const sigma = settings.filterWidth / 2;
            const trans = Math.exp(-0.5 * Math.pow((settings.bulbWavelength - settings.filterWavelength) / sigma, 2));
            const activeIntensity = settings.bulbIntensity * trans;
            if (activeIntensity > 0.005) {
              const gradient2 = ctx.createLinearGradient(380, 250, 620, 250);
              gradient2.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${activeIntensity * 0.45})`);
              gradient2.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${activeIntensity * 0.08})`);
              ctx.fillStyle = gradient2;
              ctx.beginPath();
              ctx.moveTo(380, 202);
              ctx.lineTo(625, 222);
              ctx.lineTo(625, 278);
              ctx.lineTo(380, 298);
              ctx.closePath();
              ctx.fill();
            }
          } else {
            // Single uninterrupted beam
            const gradient = ctx.createLinearGradient(80, 250, 625, 250);
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${settings.bulbIntensity * 0.45})`);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${settings.bulbIntensity * 0.08})`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(80, 238);
            ctx.lineTo(625, 212);
            ctx.lineTo(625, 288);
            ctx.lineTo(80, 262);
            ctx.closePath();
            ctx.fill();
          }
        } else {
          // RGB Mode: Overlapping Beams
          // Red Bulb Beam (pointing to eye)
          if (settings.redIntensity > 0) {
            const gradRed = ctx.createLinearGradient(80, 150, 625, 250);
            gradRed.addColorStop(0, `rgba(255, 0, 0, ${settings.redIntensity * 0.45})`);
            gradRed.addColorStop(1, `rgba(255, 0, 0, ${settings.redIntensity * 0.08})`);
            ctx.fillStyle = gradRed;
            ctx.beginPath();
            ctx.moveTo(80, 140);
            ctx.lineTo(625, 214);
            ctx.lineTo(625, 286);
            ctx.lineTo(80, 160);
            ctx.closePath();
            ctx.fill();
          }

          // Green Bulb Beam (pointing to eye)
          if (settings.greenIntensity > 0) {
            const gradGreen = ctx.createLinearGradient(80, 250, 625, 250);
            gradGreen.addColorStop(0, `rgba(0, 255, 0, ${settings.greenIntensity * 0.45})`);
            gradGreen.addColorStop(1, `rgba(0, 255, 0, ${settings.greenIntensity * 0.08})`);
            ctx.fillStyle = gradGreen;
            ctx.beginPath();
            ctx.moveTo(80, 240);
            ctx.lineTo(625, 214);
            ctx.lineTo(625, 286);
            ctx.lineTo(80, 260);
            ctx.closePath();
            ctx.fill();
          }

          // Blue Bulb Beam (pointing to eye)
          if (settings.blueIntensity > 0) {
            const gradBlue = ctx.createLinearGradient(80, 350, 625, 250);
            gradBlue.addColorStop(0, `rgba(0, 0, 255, ${settings.blueIntensity * 0.45})`);
            gradBlue.addColorStop(1, `rgba(0, 0, 255, ${settings.blueIntensity * 0.08})`);
            ctx.fillStyle = gradBlue;
            ctx.beginPath();
            ctx.moveTo(80, 340);
            ctx.lineTo(625, 214);
            ctx.lineTo(625, 286);
            ctx.lineTo(80, 360);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // B. RENDER MOVING PHOTON STREAM
      if (settings.beamDisplay === 'particles' || settings.beamDisplay === 'both') {
        const particles = particlesRef.current;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          if (p.blocked) {
            ctx.fillStyle = `rgba(80, 80, 90, ${p.alpha * 0.35})`;
          } else {
            // Extract numbers from rgb style and apply dynamic alpha
            const match = p.color.match(/\d+/g);
            if (match && match.length >= 3) {
              ctx.fillStyle = `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${p.alpha})`;
            } else {
              ctx.fillStyle = p.color;
            }
          }
          ctx.fill();

          // Particle outer glowing halo
          if (!p.blocked && p.alpha > 0.15) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            const match = p.color.match(/\d+/g);
            if (match && match.length >= 3) {
              ctx.fillStyle = `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${p.alpha * 0.22})`;
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            }
            ctx.fill();
          }
        }

        // Draw active splash remnants at retina interface
        const splashes = splashesRef.current;
        for (let i = 0; i < splashes.length; i++) {
          const s = splashes[i];
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          const match = s.color.match(/\d+/g);
          if (match && match.length >= 3) {
            ctx.fillStyle = `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${s.alpha})`;
          } else {
            ctx.fillStyle = s.color;
          }
          ctx.fill();
        }
      }

      // C. RENDER LIGHTBULBS
      if (settings.mode === 'single') {
        const rgb = wavelengthToRGB(settings.bulbWavelength);
        drawBulb(ctx, 80, 250, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, settings.bulbIntensity, 32);
      } else {
        drawBulb(ctx, 80, 150, 'rgb(255, 0, 0)', settings.redIntensity, 23);
        drawBulb(ctx, 80, 250, 'rgb(0, 255, 0)', settings.greenIntensity, 23);
        drawBulb(ctx, 80, 350, 'rgb(0, 0, 255)', settings.blueIntensity, 23);
      }

      // D. RENDER COLOR BANDPASS FILTER
      if (settings.mode === 'single' && settings.filterActive) {
        const frgb = wavelengthToRGB(settings.filterWavelength);
        const fx = 380;
        // Map 10nm - 120nm width to 6px - 28px visual glass width
        const visWidth = Math.max(6, settings.filterWidth * 0.22);

        // Frame posts at top and bottom limits
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fx, 40);
        ctx.lineTo(fx, 90);
        ctx.moveTo(fx, 360);
        ctx.lineTo(fx, 410);
        ctx.stroke();

        // Mechanical mount caps
        ctx.fillStyle = '#71717a';
        ctx.fillRect(fx - 14, 86, 28, 8);
        ctx.fillRect(fx - 14, 356, 28, 8);

        // Glass filter pane background (translucent gradient)
        ctx.save();
        const glassGrad = ctx.createLinearGradient(fx - visWidth / 2, 250, fx + visWidth / 2, 250);
        glassGrad.addColorStop(0, `rgba(${frgb.r}, ${frgb.g}, ${frgb.b}, 0.75)`);
        glassGrad.addColorStop(0.5, `rgba(${frgb.r}, ${frgb.g}, ${frgb.b}, 0.3)`);
        glassGrad.addColorStop(1, `rgba(${frgb.r}, ${frgb.g}, ${frgb.b}, 0.85)`);
        ctx.fillStyle = glassGrad;
        ctx.fillRect(fx - visWidth / 2, 90, visWidth, 270);

        // Glowing border highlight of filter color
        ctx.strokeStyle = `rgba(${frgb.r}, ${frgb.g}, ${frgb.b}, 0.95)`;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(fx - visWidth / 2, 90, visWidth, 270);
        ctx.restore();

        // Text label indicating wavelength center and band width
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${settings.filterWavelength} nm`, fx, 75);
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '10px sans-serif';
        ctx.fillText(`(±${settings.filterWidth}nm)`, fx, 422);
      }

      // E. RENDER OBSERVER (HEAD, RETINA, GLOWING BRAIN AND THOUGHT BUBBLE)
      drawHead(ctx, 680, 250, livePerceived);

      // Trigger next animation tick
      animationFrameId = requestAnimationFrame(render);
    };

    // Initialize animation loop
    render();

    // Clean up loop on component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --------------------------------------------------------------------------
  // USER CONTROL HANDLERS
  // --------------------------------------------------------------------------

  // Steps the animation forward by 1 frame manually when paused
  const handleStep = () => {
    if (isPlaying) return;

    // Temporarily trigger animation frame logic once
    const particles = particlesRef.current;
    const splashes = splashesRef.current;

    // Simulate spawning photons for single tick
    if (mode === 'single') {
      if (bulbIntensity > 0) {
        const rgb = wavelengthToRGB(bulbWavelength);
        particles.push({
          x: 80,
          y: 250 + (Math.random() - 0.5) * 16,
          vx: 4.5,
          vy: (Math.random() - 0.5) * 1.0,
          color: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          wavelength: bulbWavelength,
          size: 3.5,
          alpha: 1.0,
          passedFilter: false,
          blocked: false
        });
      }
    } else {
      if (redIntensity > 0) {
        particles.push({
          x: 80,
          y: 150,
          vx: 4.5,
          vy: 0.8,
          color: 'rgb(255, 0, 0)',
          wavelength: 650,
          size: 3.5,
          alpha: redIntensity,
          passedFilter: true,
          blocked: false
        });
      }
      if (greenIntensity > 0) {
        particles.push({
          x: 80,
          y: 250,
          vx: 4.5,
          vy: 0.0,
          color: 'rgb(0, 255, 0)',
          wavelength: 530,
          size: 3.5,
          alpha: greenIntensity,
          passedFilter: true,
          blocked: false
        });
      }
      if (blueIntensity > 0) {
        particles.push({
          x: 80,
          y: 350,
          vx: 4.5,
          vy: -0.8,
          color: 'rgb(0, 0, 255)',
          wavelength: 460,
          size: 3.5,
          alpha: blueIntensity,
          passedFilter: true,
          blocked: false
        });
      }
    }

    // Update particles position by 1 step
    const nextParticles = [];
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (mode === 'single' && filterActive && !p.passedFilter && p.x >= 380) {
        p.passedFilter = true;
        const sigma = filterWidth / 2;
        const T = Math.exp(-0.5 * Math.pow((p.wavelength - filterWavelength) / sigma, 2));
        if (Math.random() > T) {
          p.blocked = true;
        } else {
          p.alpha *= T;
        }
      }
      if (p.blocked) {
        p.alpha -= 0.2;
        if (p.alpha > 0) nextParticles.push(p);
      } else if (p.x >= 625) {
        // Simple retina flash particle
        splashes.push({
          x: 625,
          y: p.y,
          vx: -1.5,
          vy: (Math.random() - 0.5) * 2,
          color: p.color,
          size: 2,
          alpha: p.alpha,
          life: 10
        });
      } else {
        nextParticles.push(p);
      }
    }
    particlesRef.current = nextParticles;

    // Advance retina splash
    const nextSplashes = [];
    for (let i = 0; i < splashes.length; i++) {
      const s = splashes[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 0.1;
      if (s.alpha > 0) nextSplashes.push(s);
    }
    splashesRef.current = nextSplashes;
  };

  // Full reset to initial baseline values
  const handleReset = () => {
    setMode('single');
    setBulbWavelength(550);
    setBulbIntensity(1.0);
    setFilterActive(false);
    setFilterWavelength(500);
    setFilterWidth(40);
    setRedIntensity(0.8);
    setGreenIntensity(0.0);
    setBlueIntensity(0.8);
    setBeamDisplay('particles');
    setIsPlaying(true);
    particlesRef.current = [];
    splashesRef.current = [];
  };
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }} className="text-white font-sans selection:bg-purple-500/30">
      
      {/* Standardized Header */}
      

      {/* Canvas Viewport (Center) */}
      <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'auto',
      padding: '20px 340px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        <canvas ref={canvasRef} width={800} height={450} style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        pointerEvents: 'auto',
        background: '#050510',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }} />

        {/* HUD over Canvas */}
        <div style={{
        position: 'absolute',
        top: '10px',
        left: '330px',
        right: '330px',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center'
      }}>
          <div style={{
          display: 'flex',
          gap: '6px',
          padding: '6px',
          borderRadius: '100px',
          background: 'rgba(20, 20, 30, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          pointerEvents: 'auto',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
            <button onClick={() => setBeamDisplay('particles')} style={{
            padding: '8px 20px',
            borderRadius: '100px',
            background: beamDisplay === 'particles' ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
            color: beamDisplay === 'particles' ? '#3498db' : 'rgba(255, 255, 255, 0.7)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: beamDisplay === 'particles' ? '1px solid rgba(52, 152, 219, 0.4)' : '1px solid transparent'
          }}>
              Photons
            </button>
            <button onClick={() => setBeamDisplay('solid')} style={{
            padding: '8px 20px',
            borderRadius: '100px',
            background: beamDisplay === 'solid' ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
            color: beamDisplay === 'solid' ? '#3498db' : 'rgba(255, 255, 255, 0.7)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: beamDisplay === 'solid' ? '1px solid rgba(52, 152, 219, 0.4)' : '1px solid transparent'
          }}>
              Solid Beam
            </button>
            <button onClick={() => setBeamDisplay('both')} style={{
            padding: '8px 20px',
            borderRadius: '100px',
            background: beamDisplay === 'both' ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
            color: beamDisplay === 'both' ? '#3498db' : 'rgba(255, 255, 255, 0.7)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: beamDisplay === 'both' ? '1px solid rgba(52, 152, 219, 0.4)' : '1px solid transparent'
          }}>
              Both
            </button>
          </div>
        </div>
      </div>

      {/* Left Panel: Retinal Activations (LMS Cones) & perceived retina color & Trichromatic theory info */}
      <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      width: '300px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      maxHeight: 'calc(100% - 110px)',
      overflowY: 'auto'
    }}>
        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
          <Activity size={16} className="text-emerald-400" />
          Retina Response
        </h3>
        
        <div className="flex flex-col gap-4">
          {/* L Cones */}
          <div className="border border-zinc-800/60 bg-zinc-900/30 p-3 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-400">L-Cones (Long)</span>
              <span className="font-mono bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded text-[10px]">
                {lActivation}%
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-950 overflow-hidden rounded-full">
              <div className="h-full bg-rose-500 transition-all duration-150" style={{
              width: `${lActivation}%`
            }} />
            </div>
            <span className="text-[10px] text-zinc-500 leading-normal">Peak: 560 nm (Red/Yellow)</span>
          </div>

          {/* M Cones */}
          <div className="border border-zinc-800/60 bg-zinc-900/30 p-3 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400">M-Cones (Medium)</span>
              <span className="font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">
                {mActivation}%
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-950 overflow-hidden rounded-full">
              <div className="h-full bg-emerald-500 transition-all duration-150" style={{
              width: `${mActivation}%`
            }} />
            </div>
            <span className="text-[10px] text-zinc-500 leading-normal">Peak: 530 nm (Green/Yellow)</span>
          </div>

          {/* S Cones */}
          <div className="border border-zinc-800/60 bg-zinc-900/30 p-3 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-400">S-Cones (Short)</span>
              <span className="font-mono bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded text-[10px]">
                {sActivation}%
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-950 overflow-hidden rounded-full">
              <div className="h-full bg-indigo-500 transition-all duration-150" style={{
              width: `${sActivation}%`
            }} />
            </div>
            <span className="text-[10px] text-zinc-500 leading-normal">Peak: 420 nm (Violet/Blue)</span>
          </div>

          {/* Observer retina perceived color readout card */}
          <div className="border border-zinc-800/60 bg-zinc-900/30 rounded-xl p-3 text-xs flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-purple-400" />
              <span>Perceived Color:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {getColorName(perceivedRGB.r, perceivedRGB.g, perceivedRGB.b)}
              </span>
              <span className="w-4 h-4 rounded-md border border-zinc-800 inline-block" style={{
              backgroundColor: `rgb(${perceivedRGB.r}, ${perceivedRGB.g}, ${perceivedRGB.b})`
            }} />
            </div>
          </div>

          {/* Educational context */}
          <div className="border-t border-zinc-800/60 pt-3 flex flex-col gap-2">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase flex items-center gap-1">
              <BookOpen size={12} />
              Trichromatic Theory
            </h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              The retina has three classes of cones (L, M, S). The brain processes overlapping signals from these three channels to perceive color.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Controls & parameters */}
      <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '300px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      maxHeight: 'calc(100% - 110px)',
      overflowY: 'auto'
    }}>
        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
          <Sliders size={16} className="text-purple-400" />
          Controls
        </h3>

        {/* Simulation mode select tabs */}
        <div className="flex gap-1 bg-zinc-950/40 p-1 rounded-xl mb-4 border border-zinc-800/40">
          <button onClick={() => {
          setMode('single');
          particlesRef.current = [];
        }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition flex items-center justify-center gap-1.5 ${mode === 'single' ? 'bg-indigo-600/80 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}>
            <Lightbulb size={12} />
            Single
          </button>
          <button onClick={() => {
          setMode('rgb');
          particlesRef.current = [];
        }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition flex items-center justify-center gap-1.5 ${mode === 'rgb' ? 'bg-indigo-600/80 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}>
            <Sliders size={12} />
            RGB
          </button>
        </div>

        {/* DYNAMIC SETTINGS SLIDER PANEL */}
        <div className="flex flex-col gap-4">
          {/* A. SINGLE BULB MODE CONTROLS */}
          {mode === 'single' && <div className="flex flex-col gap-4">
              
              {/* Wavelength Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Wavelength</span>
                  <span className="font-mono text-zinc-400">
                    {bulbWavelength} nm
                  </span>
                </div>
                
                {/* Spectral color slider track */}
                <div className="relative w-full h-3 rounded-md overflow-hidden border border-zinc-800">
                  <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to right, #700070 0%, #0000ff 17%, #00ffff 33%, #00ff00 50%, #ffff00 67%, #ff7f00 83%, #ff0000 100%)'
              }} />
                  <input type="range" min="380" max="780" step="1" value={bulbWavelength} onChange={e => setBulbWavelength(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {/* Interactive slide indicator circle */}
                  <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-zinc-900 rounded-full pointer-events-none shadow-md" style={{
                left: `calc(${(bulbWavelength - 380) / 400 * 100}% - 7px)`
              }} />
                </div>
              </div>

              {/* Intensity Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Intensity</span>
                  <span className="font-mono text-zinc-400">
                    {Math.round(bulbIntensity * 100)}%
                  </span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={bulbIntensity} onChange={e => setBulbIntensity(Number(e.target.value))} className="w-full accent-indigo-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800" />
              </div>

              {/* Filter Active Toggle Card */}
              <div className="border border-zinc-800/80 bg-zinc-900/20 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className={filterActive ? 'text-indigo-400' : 'text-zinc-500'} />
                    <span className="text-xs font-semibold text-zinc-300">Wavelength Filter</span>
                  </div>
                  <button onClick={() => {
                setFilterActive(!filterActive);
                particlesRef.current = [];
              }} className={`w-9 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none bg-zinc-700 ${filterActive ? 'bg-indigo-600' : ''}`}>
                    <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-200 ${filterActive ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {filterActive && <div className="flex flex-col gap-3 mt-1 border-t border-zinc-800/60 pt-2.5">
                    
                    {/* Filter Wavelength */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400 font-medium">Filter Center</span>
                        <span className="font-mono text-zinc-400">
                          {filterWavelength} nm
                        </span>
                      </div>
                      
                      {/* Spectrum track for filter */}
                      <div className="relative w-full h-3 rounded-md overflow-hidden border border-zinc-800">
                        <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(to right, #700070 0%, #0000ff 17%, #00ffff 33%, #00ff00 50%, #ffff00 67%, #ff7f00 83%, #ff0000 100%)'
                  }} />
                        <input type="range" min="380" max="780" step="1" value={filterWavelength} onChange={e => setFilterWavelength(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-zinc-900 rounded-full pointer-events-none shadow-md" style={{
                    left: `calc(${(filterWavelength - 380) / 400 * 100}% - 7px)`
                  }} />
                      </div>
                    </div>

                    {/* Filter Bandpass Width */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400 font-medium">Bandpass Width</span>
                        <span className="font-mono text-zinc-400">
                          ±{filterWidth} nm
                        </span>
                      </div>
                      <input type="range" min="10" max="120" step="1" value={filterWidth} onChange={e => setFilterWidth(Number(e.target.value))} className="w-full accent-indigo-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800" />
                    </div>
                  </div>}
              </div>
            </div>}

          {/* B. RGB BULBS MODE CONTROLS */}
          {mode === 'rgb' && <div className="flex flex-col gap-3">
              {/* Red Intensity */}
              <div className="flex flex-col gap-1.5 bg-rose-950/20 border border-rose-900/10 p-2.5 rounded-xl">
                <div className="flex justify-between text-xs">
                  <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 block" />
                    Red Bulb (650nm)
                  </span>
                  <span className="font-mono text-rose-300">
                    {Math.round(redIntensity * 100)}%
                  </span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={redIntensity} onChange={e => setRedIntensity(Number(e.target.value))} className="w-full accent-red-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800" />
              </div>

              {/* Green Intensity */}
              <div className="flex flex-col gap-1.5 bg-emerald-950/20 border border-emerald-900/10 p-2.5 rounded-xl">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 block" />
                    Green Bulb (530nm)
                  </span>
                  <span className="font-mono text-emerald-300">
                    {Math.round(greenIntensity * 100)}%
                  </span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={greenIntensity} onChange={e => setGreenIntensity(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800" />
              </div>

              {/* Blue Intensity */}
              <div className="flex flex-col gap-1.5 bg-indigo-950/20 border border-indigo-900/10 p-2.5 rounded-xl">
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block" />
                    Blue Bulb (460nm)
                  </span>
                  <span className="font-mono text-indigo-300">
                    {Math.round(blueIntensity * 100)}%
                  </span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={blueIntensity} onChange={e => setBlueIntensity(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800" />
              </div>
            </div>}

          {/* Educational theory for filters */}
          <div className="border-t border-zinc-800/60 pt-3 flex flex-col gap-1.5 mt-2">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase flex items-center gap-1">
              <BookOpen size={12} />
              Filtration Theory
            </h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Filters absorb light selectively. Wavelengths outside the filter bandpass are absorbed, while matching colors propagate to the observer.
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED INFO MODAL */}
      {showInfoModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition duration-300 bg-black/40">
          <div className="border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="text-indigo-400" />
                The Physics & Biology of Color Vision
              </h2>
              <button onClick={() => setShowInfoModal(false)} className="text-zinc-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg transition">
                Close
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-4 leading-relaxed">
              <div>
                <h3 className="font-semibold text-indigo-400 text-sm mb-1">Additive Color Mixing</h3>
                <p>
                  Unlike pigments (which mix subtractively), lights mix additively. Emitting red, green, and blue light 
                  from distinct emitters overlays their electromagnetic components. Since the eye responds 
                  to these channels directly, stimulating the L and M cones simultaneously with red and green light 
                  triggers the exact neural pathways as a pure monochromatic yellow wavelength (580nm).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-indigo-400 text-sm mb-1">Monochromatic vs. Polychromatic Light</h3>
                <p>
                  Monochromatic light consists of a single electromagnetic frequency (represented by the 
                  wavelength slider in "Single Bulb" mode). In contrast, polychromatic light is a combination of 
                  multiple wavelengths (such as the combined beams in "RGB Bulbs" mode). The brain resolves both 
                  stimuli into a single perceived color.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-indigo-400 text-sm mb-1">Filter Physics Mathematics</h3>
                <p>
                  We model the transmission coefficient of the colored glass filter using a normal Gaussian bandpass distribution:
                </p>
                <div className="my-2 p-2.5 rounded-lg border border-zinc-800 font-mono text-center text-[10px] text-zinc-400">
                  T(&lambda;) = exp( -0.5 * [(&lambda;_bulb - &lambda;_filter) / &sigma;]^2 )
                </div>
                <p>
                  Where the parameter &sigma; is directly proportional to the bandwidth slider. Wavelengths outside this 
                  threshold are absorbed by the molecular crystal structures of the filter, decaying and converting 
                  to minute amounts of thermal energy instead of propagating forward.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-indigo-400 text-sm mb-1">Observer Visual Process</h3>
                <p>
                  Inside the simulation viewport, notice the observer:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-zinc-400">
                  <li><strong>Photons / Beam:</strong> Trace the path of light through the filters directly to the cornea.</li>
                  <li><strong>Retina & Cone Meters:</strong> The graphs display the instantaneous simulation levels of L, M, and S cones.</li>
                  <li><strong>Thought Bubble:</strong> Displays the final cognitive perception resulting from the sensory signals.</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-3 flex justify-end">
              <button onClick={() => setShowInfoModal(false)} className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow transition duration-200">
                Get Started
              </button>
            </div>
          </div>
        </div>}

    </div>;
}
export default function CustomColorVision({
  onBack,
  title
}) {
  return <CustomColorVisionInner onBack={onBack} title={title} />;
}