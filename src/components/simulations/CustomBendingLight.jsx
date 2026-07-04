/**
 * CustomBendingLight.jsx
 * 
 * A high-fidelity, interactive physics simulation of the Bending of Light (Optics).
 * Built with React, HTML5 Canvas, and a requestAnimationFrame physics loop.
 * 
 * ============================================================================
 * PHYSICS & MATHEMATICAL FORMULATION
 * ============================================================================
 * 
 * 1. SNELL'S LAW OF REFRACTION
 *    Snell's Law describes the relationship between the angles of incidence
 *    and refraction when light passes through a boundary between two isotropic
 *    media with different indices of refraction (n1 and n2):
 *    
 *        n1 * sin(theta1) = n2 * sin(theta2)
 *    
 *    Where:
 *        n1 = refractive index of the upper medium (medium 1)
 *        theta1 = angle of incidence relative to the normal
 *        n2 = refractive index of the lower medium (medium 2)
 *        theta2 = angle of refraction relative to the normal
 * 
 * 2. CRITICAL ANGLE & TOTAL INTERNAL REFLECTION (TIR)
 *    When light travels from a medium with a higher refractive index to one with
 *    a lower refractive index (n1 > n2), the angle of refraction theta2 is
 *    larger than the angle of incidence theta1. As theta1 increases, theta2
 *    approaches 90 degrees.
 *    
 *    The critical angle (theta_c) is the incident angle for which the refracted
 *    angle is exactly 90 degrees:
 *    
 *        sin(theta_c) = n2 / n1  =>  theta_c = arcsin(n2 / n1)
 *    
 *    If the angle of incidence exceeds the critical angle (theta1 > theta_c),
 *    no refraction can occur. Instead, 100% of the light is reflected back into
 *    the first medium. This phenomenon is known as Total Internal Reflection.
 * 
 * 3. FRESNEL EQUATIONS FOR REFLECTANCE AND TRANSMITTANCE
 *    To simulate realistic ray opacities and widths, we calculate the fraction
 *    of power reflected (R) and transmitted (T) using the Fresnel equations.
 *    Assuming unpolarized (average of s- and p-polarized) light:
 *    
 *        rs = (n1 * cos(theta1) - n2 * cos(theta2)) / (n1 * cos(theta1) + n2 * cos(theta2))
 *        rp = (n2 * cos(theta1) - n1 * cos(theta2)) / (n2 * cos(theta1) + n1 * cos(theta2))
 *        
 *        R = (rs^2 + rp^2) / 2
 *        T = 1 - R
 *    
 *    At normal incidence (theta1 = 0):
 *        R = ((n1 - n2) / (n1 + n2))^2
 *        T = 1 - R
 * 
 * 4. WAVEFRONT PROPAGATION & VELOCITY
 *    In the Wave Model, light behaves as a series of planar wave fronts.
 *    The velocity (v) of the wave in a medium depends on its refractive index (n):
 *    
 *        v = c / n
 *    
 *    Consequently, the wavelength in the medium (lambda) shrinks proportionally:
 *    
 *        lambda = lambda_0 / n
 *    
 *    To render wave propagation at 60fps, we define the phase along a ray:
 *        Incident Phase:    phi1(s, t) = k1 * s - omega * t
 *        Reflected Phase:   phi_ref(s, t) = k1 * d + k1 * s - omega * t
 *        Refracted Phase:   phi_refr(s, t) = k1 * d + k2 * s - omega * t
 * 
 *    Where:
 *        s = distance along the specific ray
 *        d = length of the incident ray
 *        k1 = 2*pi / lambda1, k2 = 2*pi / lambda2
 *        omega * t = elapsed simulation phase time
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sliders, Compass, Gauge, Activity, ArrowLeft, Zap, HelpCircle, Sparkles, Info, Settings2 } from 'lucide-react';

// Predefined materials with their corresponding indices of refraction
const MATERIALS = {
  air: {
    name: 'Air',
    n: 1.00
  },
  water: {
    name: 'Water',
    n: 1.33
  },
  glass: {
    name: 'Glass',
    n: 1.50
  },
  custom: {
    name: 'Custom',
    n: 1.20
  }
};

// Helper function to convert wavelength (nm) to RGB string for visual rendering
function wavelengthToRGB(wavelength) {
  let r, g, b, factor;
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
  } else {
    r = 0.0;
    g = 0.0;
    b = 0.0;
  }

  // Fade intensity near limits of human vision
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 420 && wavelength < 701) {
    factor = 1.0;
  } else if (wavelength >= 701 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 701);
  } else {
    factor = 0.0;
  }
  const R = Math.round(255 * Math.pow(r * factor, 0.8));
  const G = Math.round(255 * Math.pow(g * factor, 0.8));
  const B = Math.round(255 * Math.pow(b * factor, 0.8));
  return `rgb(${R}, ${G}, ${B})`;
}
export default function CustomBendingLight({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  // --- Simulation State ---
  const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [isResetHovered, setIsResetHovered] = useState(false);
  const [laserAngle, setLaserAngle] = useState(30); // in degrees relative to normal
  const [laserOn, setLaserOn] = useState(true);
  const [wavelength, setWavelength] = useState(650); // in nanometers (default Red)

  // Media refractive indices
  const [medium1Type, setMedium1Type] = useState('air');
  const [n1Custom, setN1Custom] = useState(1.00);
  const [medium2Type, setMedium2Type] = useState('glass');
  const [n2Custom, setN2Custom] = useState(1.50);

  // Model selection: Ray (solid lines) vs Wave (propagating fronts)
  const [isWaveModel, setIsWaveModel] = useState(false);

  // Tool activations
  const [protractorActive, setProtractorActive] = useState(false);
  const [intensityProbeActive, setIntensityProbeActive] = useState(false);
  const [speedProbeActive, setSpeedProbeActive] = useState(false);

  // Movable coordinates
  const [protractorPos, setProtractorPos] = useState({
    x: 400,
    y: 250
  });
  const [protractorAngle, setProtractorAngle] = useState(0); // in radians
  const [intensityProbePos, setIntensityProbePos] = useState({
    x: 220,
    y: 120
  });
  const [speedProbePos, setSpeedProbePos] = useState({
    x: 220,
    y: 380
  });

  // Time of Flight (Pulse) State
  const [pulseActive, setPulseActive] = useState(false);
  const [showAngles, setShowAngles] = useState(true);

  // --- Refs for Physics Engine ---
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Physics parameters that run smoothly in animation loop
  const wavePhaseRef = useRef(0);
  const pulseTimeRef = useRef(0);
  const dragStateRef = useRef(null); // 'laser' | 'protractor_move' | 'protractor_rotate' | 'intensity_probe' | 'speed_probe' | null

  // Calculate actual indices
  const n1 = medium1Type === 'custom' ? n1Custom : MATERIALS[medium1Type].n;
  const n2 = medium2Type === 'custom' ? n2Custom : MATERIALS[medium2Type].n;

  // --- Reset Simulation ---
  const resetSim = () => {
    setIsPlaying(true);
    setLaserAngle(30);
    setLaserOn(true);
    setWavelength(650);
    setMedium1Type('air');
    setN1Custom(1.00);
    setMedium2Type('glass');
    setN2Custom(1.50);
    setIsWaveModel(false);
    setProtractorActive(false);
    setIntensityProbeActive(false);
    setSpeedProbeActive(false);
    setProtractorPos({
      x: 400,
      y: 250
    });
    setProtractorAngle(0);
    setIntensityProbePos({
      x: 220,
      y: 120
    });
    setSpeedProbePos({
      x: 220,
      y: 380
    });
    setPulseActive(false);
    setShowAngles(true);
    wavePhaseRef.current = 0;
    pulseTimeRef.current = 0;
    dragStateRef.current = null;
  };

  // Launch a Speed/Time-of-flight test pulse
  const launchPulse = () => {
    pulseTimeRef.current = 0;
    setPulseActive(true);
  };

  // Helper for computing distance to a line segment
  const distToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };

  // --- Main Draw & Physics Update Loop ---
  useEffect(() => {
    const render = timestamp => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // Elapsed time
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const elapsedMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      const dt = Math.min(0.05, elapsedMs / 1000); // Caps time-jumps

      // 1. UPDATE PHYSICAL STATES
      if (isPlaying) {
        // Increment phase for wave wavefronts (phase speed varies in mediums)
        wavePhaseRef.current += dt * 18;
        if (pulseActive) {
          pulseTimeRef.current += dt;
        }
      }

      // 2. CLEAR CANVAS
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#06060c'; // Deep dark empty background
      ctx.fillRect(0, 0, width, height);

      // 3. DRAW MEDIA LAYERS
      // Upper medium (Medium 1) background
      if (medium1Type !== 'air' || n1 > 1.0) {
        ctx.fillStyle = `rgba(14, 116, 144, ${Math.min(0.35, (n1 - 0.75) * 0.15)})`;
        ctx.fillRect(0, 0, width, 250);
      }
      // Lower medium (Medium 2) background
      ctx.fillStyle = `rgba(56, 189, 248, ${0.05 + Math.min(0.45, (n2 - 0.75) * 0.22)})`;
      ctx.fillRect(0, 250, width, 250);

      // Draw boundary line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 250);
      ctx.lineTo(width, 250);
      ctx.stroke();

      // Draw normal line (dashed vertical line)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(400, 0);
      ctx.lineTo(400, height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 4. RAY & PHYSICS MATH COMPUTATIONS
      const theta1Rad = laserAngle * Math.PI / 180;
      const d = 180; // Distance of laser from boundary intersection (400, 250)
      const xL = 400 - d * Math.sin(theta1Rad);
      const yL = 250 - d * Math.cos(theta1Rad);
      const P0 = {
        x: xL,
        y: yL
      };
      const P1 = {
        x: 400,
        y: 250
      };

      // Reflected Ray endpoints
      const sinTheta1 = Math.sin(theta1Rad);
      const cosTheta1 = Math.cos(theta1Rad);
      let tRef = 0;
      let xRef = 400;
      let yRef = 250;
      if (cosTheta1 > 0) {
        const tY0 = 250 / cosTheta1;
        const xY0 = 400 + tY0 * sinTheta1;
        if (xY0 >= 0 && xY0 <= width) {
          tRef = tY0;
          xRef = xY0;
          yRef = 0;
        } else if (xY0 > width) {
          tRef = (width - 400) / sinTheta1;
          xRef = width;
          yRef = 250 - tRef * cosTheta1;
        } else {
          tRef = (0 - 400) / sinTheta1;
          xRef = 0;
          yRef = 250 - tRef * cosTheta1;
        }
      }
      const P_ref = {
        x: xRef,
        y: yRef
      };
      const L_ref = tRef;

      // Refracted Ray endpoints (using Snell's Law)
      const sinTheta2 = n1 / n2 * sinTheta1;
      const isTIR = Math.abs(sinTheta2) > 1.0;
      let P_refr = null;
      let L_refr = 0;
      let theta2Rad = 0;
      if (!isTIR) {
        theta2Rad = Math.asin(sinTheta2);
        const cosTheta2 = Math.sqrt(1.0 - sinTheta2 * sinTheta2);
        const tY500 = 250 / cosTheta2;
        const xY500 = 400 + tY500 * sinTheta2;
        if (xY500 >= 0 && xY500 <= width) {
          L_refr = tY500;
          P_refr = {
            x: xY500,
            y: 500
          };
        } else if (xY500 > width) {
          L_refr = (width - 400) / sinTheta2;
          P_refr = {
            x: width,
            y: 250 + L_refr * cosTheta2
          };
        } else {
          L_refr = (0 - 400) / sinTheta2;
          P_refr = {
            x: 0,
            y: 250 + L_refr * cosTheta2
          };
        }
      }

      // Fresnel Coefficients
      let R = 1.0;
      let T = 0.0;
      if (!isTIR) {
        const cos1 = Math.abs(cosTheta1);
        const cos2 = Math.sqrt(1.0 - sinTheta2 * sinTheta2);
        if (cos1 > 0.99999) {
          R = Math.pow((n1 - n2) / (n1 + n2), 2);
          T = 1.0 - R;
        } else {
          const rs = (n1 * cos1 - n2 * cos2) / (n1 * cos1 + n2 * cos2);
          const rp = (n2 * cos1 - n1 * cos2) / (n2 * cos1 + n1 * cos2);
          R = (rs * rs + rp * rp) / 2;
          T = 1.0 - R;
        }
      }
      const beamColor = wavelengthToRGB(wavelength);

      // 5. DRAW RAY / WAVE VISUALS
      if (laserOn) {
        if (!isWaveModel) {
          // Ray Model Rendering (glowing rays)
          // Incident Ray
          ctx.strokeStyle = beamColor;
          ctx.lineWidth = 6;
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.moveTo(P0.x, P0.y);
          ctx.lineTo(P1.x, P1.y);
          ctx.stroke();
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.moveTo(P0.x, P0.y);
          ctx.lineTo(P1.x, P1.y);
          ctx.stroke();

          // Reflected Ray
          if (R > 0.005) {
            ctx.strokeStyle = beamColor;
            ctx.lineWidth = Math.max(1, 6 * R);
            ctx.globalAlpha = R * 0.25;
            ctx.beginPath();
            ctx.moveTo(P1.x, P1.y);
            ctx.lineTo(P_ref.x, P_ref.y);
            ctx.stroke();
            ctx.lineWidth = Math.max(0.5, 2.5 * R);
            ctx.globalAlpha = R * 0.95;
            ctx.beginPath();
            ctx.moveTo(P1.x, P1.y);
            ctx.lineTo(P_ref.x, P_ref.y);
            ctx.stroke();
          }

          // Refracted Ray
          if (!isTIR && T > 0.005 && P_refr) {
            ctx.strokeStyle = beamColor;
            ctx.lineWidth = Math.max(1, 6 * T);
            ctx.globalAlpha = T * 0.25;
            ctx.beginPath();
            ctx.moveTo(P1.x, P1.y);
            ctx.lineTo(P_refr.x, P_refr.y);
            ctx.stroke();
            ctx.lineWidth = Math.max(0.5, 2.5 * T);
            ctx.globalAlpha = T * 0.95;
            ctx.beginPath();
            ctx.moveTo(P1.x, P1.y);
            ctx.lineTo(P_refr.x, P_refr.y);
            ctx.stroke();
          }
          ctx.globalAlpha = 1.0; // Reset opacity
        } else {
          // Wave Model Rendering (Phase-aligned propagating wavefronts)
          const lambda0 = 42; // Base vacuum wavelength in pixels
          const lambda1 = lambda0 / n1;
          const lambda2 = lambda0 / n2;
          const drawWavefronts = (startX, startY, endX, endY, lambda, phase, intensity) => {
            if (intensity <= 0.01) return;
            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.hypot(dx, dy);
            const ux = dx / length;
            const uy = dy / length;
            const vx = -uy;
            const vy = ux;

            // wavefront position offsets from start
            const normPhase = phase / (2 * Math.PI) % 1.0;
            const s0 = (normPhase < 0 ? normPhase + 1.0 : normPhase) * lambda;
            ctx.strokeStyle = beamColor;
            ctx.lineWidth = 3;
            for (let s = s0; s < length; s += lambda) {
              const cx = startX + s * ux;
              const cy = startY + s * uy;
              let alpha = intensity * 0.8;
              if (s < 10) alpha *= s / 10;
              if (length - s < 10) alpha *= (length - s) / 10;
              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              const w = 34; // wavefront line width
              ctx.moveTo(cx - w / 2 * vx, cy - w / 2 * vy);
              ctx.lineTo(cx + w / 2 * vx, cy + w / 2 * vy);
              ctx.stroke();
              ctx.restore();
            }
          };

          // 1. Incident Wavefronts
          drawWavefronts(P0.x, P0.y, P1.x, P1.y, lambda1, wavePhaseRef.current, 1.0);

          // Phase matching at interface (s = d)
          const interfacePhase = wavePhaseRef.current - 2 * Math.PI * d / lambda1;

          // 2. Reflected Wavefronts
          drawWavefronts(P1.x, P1.y, P_ref.x, P_ref.y, lambda1, interfacePhase, R);

          // 3. Refracted Wavefronts
          if (!isTIR && P_refr) {
            drawWavefronts(P1.x, P1.y, P_refr.x, P_refr.y, lambda2, interfacePhase, T);
          }
          ctx.globalAlpha = 1.0;
        }
      }

      // 6. DRAW LASER SOURCE GUN
      ctx.save();
      ctx.translate(xL, yL);
      ctx.rotate(Math.PI / 2 - theta1Rad);

      // Gun Barrel Body
      ctx.fillStyle = '#1e1e2f';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // rect parameters: x, y, width, height, radius
      ctx.roundRect(-42, -14, 42, 28, 4);
      ctx.fill();
      ctx.stroke();

      // Gun Nozzle
      ctx.fillStyle = '#2d2d3f';
      ctx.beginPath();
      ctx.rect(0, -8, 8, 16);
      ctx.fill();
      ctx.stroke();

      // Power On/Off Status LED
      ctx.fillStyle = laserOn ? beamColor : '#ef4444';
      ctx.shadowColor = laserOn ? beamColor : '#ef4444';
      ctx.shadowBlur = laserOn ? 6 : 0;
      ctx.beginPath();
      ctx.arc(-22, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset blur

      ctx.restore();

      // 7. DRAW ANGLES & ARCS OVERLAY
      if (showAngles && laserOn) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);

        // Incident angle arc (drawn towards vertical normal upwards)
        ctx.beginPath();
        ctx.arc(400, 250, 45, -Math.PI / 2, -Math.PI / 2 - theta1Rad, theta1Rad > 0);
        ctx.stroke();

        // Label incident angle
        const textA1 = -Math.PI / 2 - theta1Rad / 2;
        const labelX1 = 400 + 65 * Math.cos(textA1);
        const labelY1 = 250 + 65 * Math.sin(textA1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.abs(laserAngle).toFixed(1)}°`, labelX1, labelY1);
        if (!isTIR) {
          // Refracted angle arc
          ctx.beginPath();
          ctx.arc(400, 250, 45, Math.PI / 2, Math.PI / 2 + theta2Rad, theta2Rad < 0);
          ctx.stroke();
          const textA2 = Math.PI / 2 + theta2Rad / 2;
          const labelX2 = 400 + 65 * Math.cos(textA2);
          const labelY2 = 250 + 65 * Math.sin(textA2);
          ctx.fillText(`${Math.abs(theta2Rad * 180 / Math.PI).toFixed(1)}°`, labelX2, labelY2);
        } else {
          // TIR Text Alert
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Total Internal Reflection', 400, 290);
        }
        ctx.restore();
      }

      // 8. PULSE ANIMATION (Speed & Time-of-flight Visualization)
      if (pulseActive && laserOn) {
        const speed1 = 220 / n1; // Pixels per second
        const t1 = d / speed1; // Time to reach intersection point (400, 250)
        const curTime = pulseTimeRef.current;
        ctx.save();
        if (curTime < t1) {
          // Pulse in upper medium
          const distWalked = speed1 * curTime;
          const px = P0.x + distWalked * Math.sin(theta1Rad);
          const py = P0.y + distWalked * Math.cos(theta1Rad);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = beamColor;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Pulse has split
          // Reflected branch
          const elapsedPostSplit = curTime - t1;
          const distRef = speed1 * elapsedPostSplit;
          if (distRef <= L_ref) {
            const rx = P1.x + distRef * Math.sin(theta1Rad);
            const ry = P1.y - distRef * Math.cos(theta1Rad);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = beamColor;
            ctx.shadowBlur = 8;
            ctx.globalAlpha = Math.sqrt(R);
            ctx.beginPath();
            ctx.arc(rx, ry, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Refracted branch
          if (!isTIR && P_refr) {
            const speed2 = 220 / n2;
            const distRefr = speed2 * elapsedPostSplit;
            if (distRefr <= L_refr) {
              const rx = P1.x + distRefr * Math.sin(theta2Rad);
              const ry = P1.y + distRefr * Math.cos(theta2Rad);
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = beamColor;
              ctx.shadowBlur = 8;
              ctx.globalAlpha = Math.sqrt(T);
              ctx.beginPath();
              ctx.arc(rx, ry, 5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.restore();

        // Check if pulse has gone completely offscreen
        const speed2 = isTIR ? 0 : 220 / n2;
        const tRefEnd = t1 + L_ref / speed1;
        const tRefrEnd = isTIR ? 0 : t1 + L_refr / speed2;
        const maxTime = Math.max(tRefEnd, tRefrEnd);
        if (curTime > maxTime) {
          setPulseActive(false);
          pulseTimeRef.current = 0;
        }
      }

      // 8.5 DRAW TIME OF FLIGHT STOPWATCH ON CANVAS
      if (pulseActive && laserOn) {
        ctx.save();
        const clockX = 20;
        const clockY = 435;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(clockX, clockY, 140, 45, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TIME OF FLIGHT', clockX + 70, clockY + 14);
        ctx.fillStyle = '#f59e0b'; // Amber
        ctx.font = 'bold 16px Courier, monospace';
        ctx.fillText(`${(pulseTimeRef.current * 6.67).toFixed(2)} fs`, clockX + 70, clockY + 33);
        ctx.restore();
      }

      // 9. DRAW INTENSITY PROBE
      if (intensityProbeActive) {
        // Compute reading
        let measuredIntensity = 0;
        if (laserOn) {
          const px = intensityProbePos.x;
          const py = intensityProbePos.y;
          const dInc = distToSegment(px, py, P0.x, P0.y, P1.x, P1.y);
          const dRef = distToSegment(px, py, P1.x, P1.y, P_ref.x, P_ref.y);
          const dRefr = isTIR ? Infinity : distToSegment(px, py, P1.x, P1.y, P_refr.x, P_refr.y);
          const threshold = 18;
          if (dInc <= threshold && dInc <= dRef && dInc <= dRefr) {
            measuredIntensity = 100.0;
          } else if (dRef <= threshold && dRef <= dInc && dRef <= dRefr) {
            measuredIntensity = R * 100.0;
          } else if (!isTIR && dRefr <= threshold && dRefr <= dInc && dRefr <= dRef) {
            measuredIntensity = T * 100.0;
          }
        }
        const boxX = intensityProbePos.x + 60;
        const boxY = intensityProbePos.y - 45;

        // Draw connection cable wire
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(intensityProbePos.x, intensityProbePos.y);
        ctx.bezierCurveTo(intensityProbePos.x + 20, intensityProbePos.y - 10, boxX - 20, boxY + 20, boxX, boxY + 15);
        ctx.stroke();

        // Draw Sensor Tip
        ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
        ctx.beginPath();
        ctx.arc(intensityProbePos.x, intensityProbePos.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(intensityProbePos.x, intensityProbePos.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(intensityProbePos.x - 7, intensityProbePos.y);
        ctx.lineTo(intensityProbePos.x + 7, intensityProbePos.y);
        ctx.moveTo(intensityProbePos.x, intensityProbePos.y - 7);
        ctx.lineTo(intensityProbePos.x, intensityProbePos.y + 7);
        ctx.stroke();

        // Glassmorphic Digital Display Box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY - 15, 95, 45, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('INTENSITY', boxX + 47.5, boxY - 3);
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`${measuredIntensity.toFixed(1)}%`, boxX + 47.5, boxY + 18);
      }

      // 10. DRAW SPEED PROBE
      if (speedProbeActive) {
        const py = speedProbePos.y;

        // n value at probe location
        const probeN = py < 250 ? n1 : n2;
        const speedVal = (1.0 / probeN).toFixed(2);
        const speedMS = 2.99792e8 / probeN;
        const speedMSStr = (speedMS / 1e8).toFixed(3) + " × 10⁸";
        const sBoxX = speedProbePos.x + 60;
        const sBoxY = speedProbePos.y - 45;

        // Draw cable wire
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(speedProbePos.x, speedProbePos.y);
        ctx.bezierCurveTo(speedProbePos.x + 20, speedProbePos.y - 10, sBoxX - 20, sBoxY + 20, sBoxX, sBoxY + 15);
        ctx.stroke();

        // Draw sensor tip
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.beginPath();
        ctx.arc(speedProbePos.x, speedProbePos.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(speedProbePos.x, speedProbePos.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(speedProbePos.x - 7, speedProbePos.y);
        ctx.lineTo(speedProbePos.x + 7, speedProbePos.y);
        ctx.moveTo(speedProbePos.x, speedProbePos.y - 7);
        ctx.lineTo(speedProbePos.x, speedProbePos.y + 7);
        ctx.stroke();

        // Glassmorphic Display Box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(sBoxX, sBoxY - 15, 95, 45, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LIGHT SPEED', sBoxX + 47.5, sBoxY - 3);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`${speedVal} c`, sBoxX + 47.5, sBoxY + 10);
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
        ctx.fillText(`${speedMSStr} m/s`, sBoxX + 47.5, sBoxY + 22);
      }

      // 11. DRAW PROTRACTOR OVERLAY
      if (protractorActive) {
        ctx.save();
        ctx.translate(protractorPos.x, protractorPos.y);
        ctx.rotate(protractorAngle);

        // Circular background disk
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.beginPath();
        ctx.arc(0, 0, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tick marks and degree labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let angleDeg = 0; angleDeg < 360; angleDeg += 5) {
          const angleRad = angleDeg * Math.PI / 180;
          const isMajor = angleDeg % 30 === 0;
          const isMedium = angleDeg % 10 === 0 && !isMajor;
          const tickLen = isMajor ? 10 : isMedium ? 7 : 4;
          const x1 = (100 - tickLen) * Math.cos(angleRad);
          const y1 = (100 - tickLen) * Math.sin(angleRad);
          const x2 = 100 * Math.cos(angleRad);
          const y2 = 100 * Math.sin(angleRad);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          if (isMajor) {
            const textDist = 80;
            const tx = textDist * Math.cos(angleRad);
            const ty = textDist * Math.sin(angleRad);
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(angleRad + Math.PI / 2);
            ctx.fillText(`${angleDeg}°`, 0, 0);
            ctx.restore();
          }
        }

        // Center crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 15);
        ctx.stroke();

        // Edge rotation handle circle
        ctx.fillStyle = '#c084fc'; // Purple accent
        ctx.beginPath();
        ctx.arc(100, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Center move handle circle (in global coordinates)
        ctx.fillStyle = '#38bdf8'; // Cyan accent
        ctx.beginPath();
        ctx.arc(protractorPos.x, protractorPos.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 12. QUEUE NEXT FRAME
      requestRef.current = requestAnimationFrame(render);
    };
    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, laserAngle, laserOn, wavelength, medium1Type, n1Custom, medium2Type, n2Custom, isWaveModel, protractorActive, intensityProbeActive, speedProbeActive, protractorPos, protractorAngle, intensityProbePos, speedProbePos, pulseActive, showAngles, n1, n2]);

  // --- Single Physics Frame Step ---
  const stepSim = () => {
    if (isPlaying) setIsPlaying(false);
    // Move time forward manually by 1 frame (~16.6ms)
    wavePhaseRef.current += 1.0;
    if (pulseActive) {
      pulseTimeRef.current += 0.0167;
    }
  };

  // --- Mouse & Drag Interactivity Handlers ---
  const getMouseCoordinates = e => {
    const canvas = canvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    const rect = canvas.getBoundingClientRect();

    // Calculate the actual rendered dimensions with objectFit: contain
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    const renderedWidth = canvas.width * scale;
    const renderedHeight = canvas.height * scale;

    // Calculate the letterbox offsets
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    return {
      x,
      y
    };
  };
  const handleMouseDown = e => {
    const {
      x,
      y
    } = getMouseCoordinates(e);

    // Laser Source position check
    const theta1Rad = laserAngle * Math.PI / 180;
    const d = 180;
    const xL = 400 - d * Math.sin(theta1Rad);
    const yL = 250 - d * Math.cos(theta1Rad);
    if (Math.hypot(x - xL, y - yL) < 26) {
      dragStateRef.current = 'laser';
      return;
    }

    // Protractor Tool handles check
    if (protractorActive) {
      // Rotation handle location: rotated by protractorAngle at radius 100px
      const rotX = protractorPos.x + 100 * Math.cos(protractorAngle);
      const rotY = protractorPos.y + 100 * Math.sin(protractorAngle);
      if (Math.hypot(x - rotX, y - rotY) < 14) {
        dragStateRef.current = 'protractor_rotate';
        return;
      }

      // Center move handle
      if (Math.hypot(x - protractorPos.x, y - protractorPos.y) < 15) {
        dragStateRef.current = 'protractor_move';
        return;
      }
    }

    // Intensity Probe tip check
    if (intensityProbeActive) {
      if (Math.hypot(x - intensityProbePos.x, y - intensityProbePos.y) < 16) {
        dragStateRef.current = 'intensity_probe';
        return;
      }
    }

    // Speed Probe tip check
    if (speedProbeActive) {
      if (Math.hypot(x - speedProbePos.x, y - speedProbePos.y) < 16) {
        dragStateRef.current = 'speed_probe';
        return;
      }
    }
  };
  const handleMouseMove = e => {
    if (!dragStateRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const {
      x,
      y
    } = getMouseCoordinates(e);
    if (dragStateRef.current === 'laser') {
      const dx = 400 - x;
      const dy = 250 - y;
      if (dy > 12) {
        let angle = Math.atan2(dx, dy); // radians relative to normal
        const maxRad = 85 * Math.PI / 180;
        angle = Math.max(-maxRad, Math.min(maxRad, angle));
        setLaserAngle(angle * 180 / Math.PI);
      }
    } else if (dragStateRef.current === 'protractor_move') {
      setProtractorPos({
        x: Math.max(10, Math.min(canvas.width - 10, x)),
        y: Math.max(10, Math.min(canvas.height - 10, y))
      });
    } else if (dragStateRef.current === 'protractor_rotate') {
      const dx = x - protractorPos.x;
      const dy = y - protractorPos.y;
      setProtractorAngle(Math.atan2(dy, dx));
    } else if (dragStateRef.current === 'intensity_probe') {
      setIntensityProbePos({
        x: Math.max(10, Math.min(canvas.width - 10, x)),
        y: Math.max(10, Math.min(canvas.height - 10, y))
      });
    } else if (dragStateRef.current === 'speed_probe') {
      setSpeedProbePos({
        x: Math.max(10, Math.min(canvas.width - 10, x)),
        y: Math.max(10, Math.min(canvas.height - 10, y))
      });
    }
  };
  const handleMouseUp = () => {
    dragStateRef.current = null;
  };
  const activeColor = wavelengthToRGB(wavelength);
  return <div className="select-none" style={{
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
        .glass-btn:active { transform: translateY(1px); }
        .glass-btn-blue { background: rgba(52, 152, 219, 0.15); border-color: rgba(52, 152, 219, 0.3); color: #3498db; }
        .glass-btn-blue:hover { background: rgba(52, 152, 219, 0.25); }
        .reset-btn { background: rgba(231, 76, 60, 0.2); border-color: rgba(231, 76, 60, 0.3); color: #e74c3c; }
        .reset-btn:hover { background: rgba(231, 76, 60, 0.3); }
      `}</style>

      {/* Standardized Header */}
      

      <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'auto',
      padding: '20px 360px 20px 240px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        {/* Canvas / Main View */}
        <canvas ref={canvasRef} width={800} height={500} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        zIndex: 1,
        objectFit: 'contain',
        cursor: 'default',
        background: '#0e111a',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }} />

      {/* Floating Medium Info Panels on the Left */}
      <div style={{
        position: 'absolute',
        left: '20px',
        top: '100px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          padding: '12px 16px',
          borderRadius: '12px',
          color: 'white',
          width: '200px'
        }}>
          <span style={{
            display: 'block',
            fontSize: '9px',
            color: '#888',
            fontWeight: 'bold',
            tracking: '0.05em',
            textTransform: 'uppercase'
          }}>Medium 1 (Upper)</span>
          <span style={{
            fontSize: '15px',
            fontWeight: 'bold',
            display: 'block',
            margin: '2px 0'
          }}>{MATERIALS[medium1Type]?.name || "Custom"}</span>
          <span style={{
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#3498db',
            fontWeight: '600'
          }}>n = {n1.toFixed(3)}</span>
        </div>

        <div style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          padding: '12px 16px',
          borderRadius: '12px',
          color: 'white',
          width: '200px'
        }}>
          <span style={{
            display: 'block',
            fontSize: '9px',
            color: '#888',
            fontWeight: 'bold',
            tracking: '0.05em',
            textTransform: 'uppercase'
          }}>Medium 2 (Lower)</span>
          <span style={{
            fontSize: '15px',
            fontWeight: 'bold',
            display: 'block',
            margin: '2px 0'
          }}>{MATERIALS[medium2Type]?.name || "Custom"}</span>
          <span style={{
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#2ecc71',
            fontWeight: '600'
          }}>n = {n2.toFixed(3)}</span>
        </div>
      </div>

      {/* Floating Instruction Tips */}
      <div style={{
        position: 'absolute',
        left: '20px',
        bottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 10,
        pointerEvents: 'none',
        fontSize: '11px',
        color: '#888'
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}><Sparkles size={12} style={{
            color: '#ff375f'
          }} /> Click and drag the Laser Pointer to rotate</span>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}><Info size={12} style={{
            color: '#3498db'
          }} /> Drag tools from the panel onto the canvas</span>
      </div>

      {/* Floating Control Panel */}
      <div style={{
        position: 'absolute',
        right: '20px',
        top: '100px',
        width: '320px',
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 10,
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        maxHeight: 'calc(100% - 120px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Play/Pause & Step Sim controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px'
        }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            background: isPlaying ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)',
            border: isPlaying ? '1px solid rgba(231, 76, 60, 0.4)' : '1px solid rgba(46, 204, 113, 0.4)',
            borderRadius: '10px',
            color: isPlaying ? '#e74c3c' : '#2ecc71',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'Pause Sim' : 'Play Sim'}</span>
          </button>
          <button onClick={stepSim} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }} title="Advance 1 frame">
            <ChevronRightIcon size={16} />
          </button>
        </div>

        {/* Laser Configuration */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Zap size={16} style={{
                color: '#f1c40f'
              }} />
              <span style={{
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#aaa'
              }}>Laser Gun</span>
            </div>
            <button onClick={() => setLaserOn(!laserOn)} style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: laserOn ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
              border: laserOn ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid rgba(231, 76, 60, 0.4)',
              color: laserOn ? '#2ecc71' : '#e74c3c',
              transition: 'all 0.2s',
              outline: 'none'
            }}>
              {laserOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <span style={{
                color: '#ccc'
              }}>Wavelength</span>
              <span style={{
                color: activeColor,
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}>{wavelength} nm</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: activeColor,
                border: '1px solid rgba(255,255,255,0.2)'
              }} />
              <input type="range" min="380" max="700" value={wavelength} onChange={e => setWavelength(parseInt(e.target.value))} style={{
                accentColor: '#3498db',
                background: 'linear-gradient(to right, #7e22ce, #2563eb, #10b981, #eab308, #ea580c, #dc2626)',
                width: '100%',
                cursor: 'pointer',
                height: '6px',
                borderRadius: '3px',
                appearance: 'none',
                outline: 'none'
              }} />
            </div>
          </div>
        </div>

        {/* Media Selector */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sliders size={16} style={{
              color: '#3498db'
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#aaa'
            }}>Media Configuration</span>
          </div>

          {/* Medium 1 select */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <label style={{
              fontSize: '11px',
              color: '#888'
            }}>UPPER MEDIUM (1)</label>
            <select value={medium1Type} onChange={e => setMedium1Type(e.target.value)} style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}>
              <option value="air" style={{
                background: '#14141e'
              }}>Air (n = 1.00)</option>
              <option value="water" style={{
                background: '#14141e'
              }}>Water (n = 1.33)</option>
              <option value="glass" style={{
                background: '#14141e'
              }}>Glass (n = 1.50)</option>
              <option value="custom" style={{
                background: '#14141e'
              }}>Custom Index</option>
            </select>
            {medium1Type === 'custom' && <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginTop: '4px'
            }}>
                <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#666',
                fontFamily: 'monospace'
              }}>
                  <span>n = 0.75</span>
                  <span style={{
                  color: '#3498db',
                  fontWeight: 'bold'
                }}>n = {n1Custom.toFixed(2)}</span>
                  <span>n = 2.50</span>
                </div>
                <input type="range" min="0.75" max="2.50" step="0.01" value={n1Custom} onChange={e => setN1Custom(parseFloat(e.target.value))} style={{
                accentColor: '#3498db',
                cursor: 'pointer',
                width: '100%'
              }} />
              </div>}
          </div>

          {/* Medium 2 select */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <label style={{
              fontSize: '11px',
              color: '#888'
            }}>LOWER MEDIUM (2)</label>
            <select value={medium2Type} onChange={e => setMedium2Type(e.target.value)} style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}>
              <option value="air" style={{
                background: '#14141e'
              }}>Air (n = 1.00)</option>
              <option value="water" style={{
                background: '#14141e'
              }}>Water (n = 1.33)</option>
              <option value="glass" style={{
                background: '#14141e'
              }}>Glass (n = 1.50)</option>
              <option value="custom" style={{
                background: '#14141e'
              }}>Custom Index</option>
            </select>
            {medium2Type === 'custom' && <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginTop: '4px'
            }}>
                <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#666',
                fontFamily: 'monospace'
              }}>
                  <span>n = 0.75</span>
                  <span style={{
                  color: '#3498db',
                  fontWeight: 'bold'
                }}>n = {n2Custom.toFixed(2)}</span>
                  <span>n = 2.50</span>
                </div>
                <input type="range" min="0.75" max="2.50" step="0.01" value={n2Custom} onChange={e => setN2Custom(parseFloat(e.target.value))} style={{
                accentColor: '#3498db',
                cursor: 'pointer',
                width: '100%'
              }} />
              </div>}
          </div>
        </div>

        {/* Visualization Settings */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Activity size={16} style={{
              color: '#bf5af2'
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#aaa'
            }}>Visualization</span>
          </div>

          {/* Ray vs Wave Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '2px',
            gap: '4px'
          }}>
            <button onClick={() => setIsWaveModel(false)} style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              background: !isWaveModel ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
              border: !isWaveModel ? '1px solid rgba(52, 152, 219, 0.4)' : '1px solid transparent',
              color: !isWaveModel ? '#3498db' : '#aaa',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}>
              Ray Model
            </button>
            <button onClick={() => setIsWaveModel(true)} style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              background: isWaveModel ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
              border: isWaveModel ? '1px solid rgba(52, 152, 219, 0.4)' : '1px solid transparent',
              color: isWaveModel ? '#3498db' : '#aaa',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}>
              Wave Model
            </button>
          </div>

          {/* Show angles checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#ccc'
          }}>
            <input type="checkbox" checked={showAngles} onChange={() => setShowAngles(!showAngles)} style={{
              accentColor: '#3498db',
              cursor: 'pointer',
              width: '15px',
              height: '15px'
            }} />
            <span>Overlay Angle Measurements</span>
          </label>
        </div>

        {/* Interactive Tools */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Compass size={16} style={{
              color: '#2ecc71'
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#aaa'
            }}>Interactive Tools</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            <button onClick={() => setProtractorActive(!protractorActive)} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px',
              borderRadius: '12px',
              background: protractorActive ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: protractorActive ? '1px solid rgba(52, 152, 219, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: protractorActive ? '#3498db' : '#ccc',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
              transition: 'all 0.2s',
              outline: 'none'
            }}>
              <Compass size={18} />
              <span>Protractor</span>
            </button>

            <button onClick={() => setIntensityProbeActive(!intensityProbeActive)} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px',
              borderRadius: '12px',
              background: intensityProbeActive ? 'rgba(231, 76, 60, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: intensityProbeActive ? '1px solid rgba(231, 76, 60, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: intensityProbeActive ? '#e74c3c' : '#ccc',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
              transition: 'all 0.2s',
              outline: 'none'
            }}>
              <Activity size={18} />
              <span>Intensity Probe</span>
            </button>

            <button onClick={() => setSpeedProbeActive(!speedProbeActive)} style={{
              gridColumn: 'span 2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '12px',
              background: speedProbeActive ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: speedProbeActive ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: speedProbeActive ? '#2ecc71' : '#ccc',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
              transition: 'all 0.2s',
              outline: 'none'
            }}>
              <Gauge size={18} />
              <span>Speed Probe</span>
            </button>
          </div>
        </div>

        {/* Time of Flight Pulse Tool */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Zap size={16} style={{
              color: '#f1c40f'
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#aaa'
            }}>Time of Flight</span>
          </div>
          <button onClick={launchPulse} disabled={!laserOn} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '10px',
            background: laserOn ? 'rgba(241, 196, 15, 0.2)' : 'rgba(255, 255, 255, 0.02)',
            border: laserOn ? '1px solid rgba(241, 196, 15, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
            color: laserOn ? '#f1c40f' : '#666',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: laserOn ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            outline: 'none'
          }}>
            <Play size={12} fill={laserOn ? '#f1c40f' : '#666'} />
            <span>Launch Packet Pulse</span>
          </button>
        </div>

        {/* Physics Quick Help */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '16px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.8)',
          lineHeight: '1.4'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#3498db',
            fontWeight: 'bold'
          }}>
            <HelpCircle size={14} />
            <span>Physics Reference</span>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{
              background: 'rgba(20, 20, 30, 0.8)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                color: '#3498db',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>Snell's Law</div>
              <div style={{
                fontFamily: 'monospace',
                color: '#2ecc71',
                fontSize: '12px',
                marginBottom: '4px'
              }}>n₁·sin(θ₁) = n₂·sin(θ₂)</div>
              <div style={{
                fontSize: '11px'
              }}>Light bends toward the normal in denser media.</div>
            </div>
            <div style={{
              background: 'rgba(20, 20, 30, 0.8)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                color: '#3498db',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>Total Internal Reflection</div>
              <div style={{
                fontFamily: 'monospace',
                color: '#2ecc71',
                fontSize: '12px',
                marginBottom: '4px'
              }}>θ₁ &gt; θ_c and n₁ &gt; n₂</div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>;
}

// Simple custom component wrapper to avoid importing missing icon shapes
function ChevronRightIcon({
  size = 16
}) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>;
}