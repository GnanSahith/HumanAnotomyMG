import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Sliders, 
  Waves, 
  Zap, 
  ArrowLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Info, 
  Compass, 
  GitMerge, 
  ActivitySquare
} from 'lucide-react';

// Color map for distinct normal modes (Mode 1 to Mode 10+)
const MODE_COLORS = [
  '#ff3b30', // Mode 1: Red
  '#ff9500', // Mode 2: Orange
  '#ffcc00', // Mode 3: Yellow
  '#4cd964', // Mode 4: Green
  '#5ac8fa', // Mode 5: Light Blue
  '#007aff', // Mode 6: Blue
  '#5856d6', // Mode 7: Indigo
  '#af52de', // Mode 8: Purple
  '#ff2d55', // Mode 9: Pink
  '#ff9500', // Mode 10: Dark Gold
  '#00d2c4', // Mode 11: Teal
  '#ff4f00'  // Mode 12: Coral
];

function CustomNormalModesInner({ onBack, title }) {
  const [numMasses, setNumMasses] = useState(3);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1); // 1 = normal, 0.25 = slow motion
  const [tension, setTension] = useState('medium'); // low, medium, high (affects spring constant & frequency)
  const [damping, setDamping] = useState('none'); // none, low, medium, high
  const [showIndividual, setShowIndividual] = useState(true);
  const [showSprings, setShowSprings] = useState(true);
  const [showFrequencies, setShowFrequencies] = useState(false);
  const [showPhaseWheels, setShowPhaseWheels] = useState(false);
  const [activePreset, setActivePreset] = useState('fundamental');

  const MAX_MASSES = 12;
  const [modeAmplitudes, setModeAmplitudes] = useState(() => {
    const initial = Array(MAX_MASSES).fill(0);
    initial[0] = 0.8; // Set Mode 1 (Fundamental) as active initially
    return initial;
  });
  const [modePhases, setModePhases] = useState(Array(MAX_MASSES).fill(0));

  const canvasRef = useRef(null);
  const draggedDisplacementsRef = useRef(null);
  const [draggedMass, setDraggedMass] = useState(null);

  // Base frequency factor (omega_0) based on tension
  const getOmega0 = useCallback(() => {
    switch (tension) {
      case 'low': return 1.5;
      case 'medium': return 3.0;
      case 'high': return 6.0;
      default: return 3.0;
    }
  }, [tension]);

  // Adjust amplitudes when the number of masses changes
  useEffect(() => {
    setModeAmplitudes(prev => {
      const next = [...prev];
      for (let i = numMasses; i < MAX_MASSES; i++) {
        next[i] = 0;
      }
      return next;
    });
  }, [numMasses]);

  // Simulation time tick & damping
  useEffect(() => {
    let animationFrame;
    let lastTime = performance.now();

    const animate = (currentTime) => {
      const realDelta = (currentTime - lastTime) / 1000;
      const delta = realDelta * speed;
      lastTime = currentTime;

      if (playing) {
        setTime(prev => prev + delta);

        // Apply exponential damping to mode amplitudes over time
        if (damping !== 'none') {
          const dampingConst = damping === 'low' ? 0.05 : damping === 'medium' ? 0.15 : 0.4;
          setModeAmplitudes(prev => prev.map((amp, idx) => {
            if (idx >= numMasses) return 0;
            return amp * Math.exp(-dampingConst * delta);
          }));
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [playing, speed, damping, numMasses]);

  const handleAmplitudeChange = (modeIndex, value) => {
    const newAmps = [...modeAmplitudes];
    newAmps[modeIndex] = parseFloat(value);
    setModeAmplitudes(newAmps);
    setActivePreset('custom');
  };

  const handlePhaseChange = (modeIndex, value) => {
    const newPhases = [...modePhases];
    newPhases[modeIndex] = parseFloat(value);
    setModePhases(newPhases);
    setActivePreset('custom');
  };

  const stepForward = () => {
    const dt = 0.05 * speed;
    setTime(prev => prev + dt);
  };

  const resetSimulation = () => {
    setTime(0);
    const initialAmps = Array(MAX_MASSES).fill(0);
    initialAmps[0] = 0.8;
    setModeAmplitudes(initialAmps);
    setModePhases(Array(MAX_MASSES).fill(0));
    setNumMasses(3);
    setTension('medium');
    setDamping('none');
    setSpeed(1);
    setDraggedMass(null);
    setActivePreset('fundamental');
  };

  const applyPreset = (presetType) => {
    setTime(0);
    setModePhases(Array(MAX_MASSES).fill(0));
    const newAmps = Array(MAX_MASSES).fill(0);
    
    switch (presetType) {
      case 'fundamental':
        newAmps[0] = 0.8;
        break;
      case 'second':
        newAmps[1] = 0.8;
        break;
      case 'third':
        newAmps[2] = 0.8;
        break;
      case 'pluck':
        // Project a triangular shape peaking at the center
        // y_k = 1 - 2*|k - (N+1)/2| / (N+1)
        for (let m = 1; m <= numMasses; m++) {
          let sum = 0;
          for (let k = 1; k <= numMasses; k++) {
            const center = (numMasses + 1) / 2;
            const y_k = 1.0 - Math.abs(k - center) / center;
            sum += y_k * Math.sin((m * Math.PI * k) / (numMasses + 1));
          }
          newAmps[m - 1] = (2 / (numMasses + 1)) * sum * 0.8;
        }
        break;
      case 'strike':
        // A superposition of several lower modes representing a sharp pluck near one end
        for (let m = 1; m <= numMasses; m++) {
          let sum = 0;
          for (let k = 1; k <= numMasses; k++) {
            // High displacement near mass 1, decays rapidly
            const y_k = k === 1 ? 0.9 : k === 2 ? 0.4 : 0.1;
            sum += y_k * Math.sin((m * Math.PI * k) / (numMasses + 1));
          }
          newAmps[m - 1] = (2 / (numMasses + 1)) * sum;
        }
        break;
      case 'clear':
      default:
        // All modes set to zero
        break;
    }
    setModeAmplitudes(newAmps);
    setActivePreset(presetType);
  };

  // Coiled Spring drawing function
  const drawSpring = (ctx, x1, y1, x2, y2, coils = 12, width = 6) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len < 5) {
      ctx.lineTo(x2, y2);
      ctx.stroke();
      return;
    }

    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    
    // Draw straight end leads
    const leadLen = Math.min(10, len * 0.1);
    const startX = x1 + ux * leadLen;
    const startY = y1 + uy * leadLen;
    const endX = x2 - ux * leadLen;
    const endY = y2 - uy * leadLen;
    ctx.lineTo(startX, startY);
    
    const steps = coils * 4;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = startX + t * (endX - startX);
      const cy = startY + t * (endY - startY);
      
      let offset = 0;
      if (i > 0 && i < steps) {
        const phase = (i % 4);
        if (phase === 1) offset = width;
        else if (phase === 3) offset = -width;
      }
      ctx.lineTo(cx + px * offset, cy + py * offset);
    }
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background with deep space glow
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const spacing = width / (numMasses + 1);
    const centerY = height / 2;
    const maxAmplitude = height * 0.35;

    // Draw reference dashed center line
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Calculate current positions for all masses
    const OMEGA_0 = getOmega0();
    const positions = [];
    for (let i = 1; i <= numMasses; i++) {
      let yDisp = 0;
      for (let m = 1; m <= numMasses; m++) {
        const amp = modeAmplitudes[m - 1];
        const phase = modePhases[m - 1];
        const omega = 2 * OMEGA_0 * Math.sin((m * Math.PI) / (2 * (numMasses + 1)));
        const shape = Math.sin((m * Math.PI * i) / (numMasses + 1));
        
        yDisp += amp * shape * Math.cos(omega * time + phase);
      }
      positions.push({
        x: i * spacing,
        y: centerY - yDisp * maxAmplitude
      });
    }

    // Draw springs / string lines connecting the oscillators
    if (showSprings) {
      // Spring from left wall to mass 1
      drawSpring(ctx, 0, centerY, positions[0].x, positions[0].y, 14, 8);
      // Springs between adjacent masses
      for (let i = 0; i < numMasses - 1; i++) {
        drawSpring(ctx, positions[i].x, positions[i].y, positions[i + 1].x, positions[i + 1].y, 10, 8);
      }
      // Spring from last mass to right wall
      drawSpring(ctx, positions[numMasses - 1].x, positions[numMasses - 1].y, width, centerY, 14, 8);
    } else {
      // Continuous string visual representation
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      positions.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)'; // Pink string glow
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow
    }

    // Draw individual mode shape overlays (faint background waves)
    if (showIndividual) {
      for (let m = 1; m <= numMasses; m++) {
        const amp = modeAmplitudes[m - 1];
        if (Math.abs(amp) < 0.05) continue; // Skip zero/negligible modes

        const phase = modePhases[m - 1];
        const omega = 2 * OMEGA_0 * Math.sin((m * Math.PI) / (2 * (numMasses + 1)));
        
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        
        // Trace high-res sine path for beautiful curve rendering
        for (let px = 0; px <= width; px += 4) {
          const frac = px / width;
          const shape = Math.sin(m * Math.PI * frac);
          const yDisp = amp * shape * Math.cos(omega * time + phase);
          ctx.lineTo(px, centerY - yDisp * maxAmplitude);
        }
        
        ctx.strokeStyle = `${MODE_COLORS[(m - 1) % MODE_COLORS.length]}33`; // Faint colored lines
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw boundary fixed posts
    ctx.fillStyle = 'rgba(51, 65, 85, 0.9)'; // Slate block
    ctx.fillRect(0, centerY - 25, 12, 50);
    ctx.fillRect(width - 12, centerY - 25, 12, 50);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, centerY - 25, 12, 50);
    ctx.strokeRect(width - 12, centerY - 25, 12, 50);

    // Draw the mass nodes
    positions.forEach((p, idx) => {
      const isHovered = draggedMass === idx;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isHovered ? 13 : 11, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${(idx * 360) / numMasses}, 85%, 55%)`;
      ctx.fill();
      ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();
      
      // Center inner metallic dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Show vertical alignment helpers if dragged
      if (isHovered) {
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(p.x, centerY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Handle Mini Canvases Rendering if enabled
    if (showIndividual) {
      for (let m = 0; m < numMasses; m++) {
        const miniCanvas = document.getElementById(`mini-canvas-${m}`);
        if (!miniCanvas) continue;
        const mCtx = miniCanvas.getContext('2d');
        const mWidth = miniCanvas.width;
        const mHeight = miniCanvas.height;
        
        mCtx.clearRect(0, 0, mWidth, mHeight);
        mCtx.fillStyle = '#090d16';
        mCtx.fillRect(0, 0, mWidth, mHeight);
        
        // Center line
        mCtx.beginPath();
        mCtx.moveTo(0, mHeight / 2);
        mCtx.lineTo(mWidth, mHeight / 2);
        mCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        mCtx.lineWidth = 1;
        mCtx.stroke();
        
        const mSpacing = mWidth / (numMasses + 1);
        const mCenterY = mHeight / 2;
        const mMaxAmp = mHeight * 0.35;
        const mPositions = [];
        
        const amp = modeAmplitudes[m];
        const phase = modePhases[m];
        const omega = 2 * OMEGA_0 * Math.sin(((m + 1) * Math.PI) / (2 * (numMasses + 1)));
        
        for (let i = 1; i <= numMasses; i++) {
          const shape = Math.sin(((m + 1) * Math.PI * i) / (numMasses + 1));
          const yDisp = amp * shape * Math.cos(omega * time + phase);
          mPositions.push({
            x: i * mSpacing,
            y: mCenterY - yDisp * mMaxAmp
          });
        }
        
        // Draw string path
        mCtx.beginPath();
        mCtx.moveTo(0, mCenterY);
        mPositions.forEach(p => mCtx.lineTo(p.x, p.y));
        mCtx.lineTo(mWidth, mCenterY);
        mCtx.strokeStyle = `${MODE_COLORS[m % MODE_COLORS.length]}aa`;
        mCtx.lineWidth = 2;
        mCtx.stroke();
        
        // Draw nodes
        mPositions.forEach(p => {
          mCtx.beginPath();
          mCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          mCtx.fillStyle = MODE_COLORS[m % MODE_COLORS.length];
          mCtx.fill();
        });
      }
    }
  }, [numMasses, modeAmplitudes, modePhases, time, showSprings, showIndividual, tension, damping, draggedMass, getOmega0]);

  // Mouse Drag handlers for configuring initial wave shape
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const spacing = canvas.width / (numMasses + 1);
    const centerY = canvas.height / 2;
    const maxAmplitude = canvas.height * 0.35;

    // Recalculate current positions of all masses
    const OMEGA_0 = getOmega0();
    const currentPositions = [];
    for (let i = 1; i <= numMasses; i++) {
      let yDisp = 0;
      for (let m = 1; m <= numMasses; m++) {
        const amp = modeAmplitudes[m - 1];
        const phase = modePhases[m - 1];
        const omega = 2 * OMEGA_0 * Math.sin((m * Math.PI) / (2 * (numMasses + 1)));
        const shape = Math.sin((m * Math.PI * i) / (numMasses + 1));
        yDisp += amp * shape * Math.cos(omega * time + phase);
      }
      currentPositions.push({
        x: i * spacing,
        y: centerY - yDisp * maxAmplitude
      });
    }

    // Find if mouse is clicked close to any mass
    let closestIdx = -1;
    let minDist = 25; // Interaction threshold
    currentPositions.forEach((pos, idx) => {
      const dist = Math.sqrt((pos.x - mouseX) ** 2 + (pos.y - mouseY) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== -1) {
      setPlaying(false); // Pause simulation during manual shape configuration
      setDraggedMass(closestIdx);
      
      const displacements = currentPositions.map(p => (centerY - p.y) / maxAmplitude);
      draggedDisplacementsRef.current = displacements;
    }
  };

  const handleMouseMove = (e) => {
    if (draggedMass === null || !draggedDisplacementsRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const centerY = canvas.height / 2;
    const maxAmplitude = canvas.height * 0.35;

    // Map mouse vertical position to normalized displacement [-1.0, 1.0]
    const nextDisp = (centerY - mouseY) / maxAmplitude;
    const clampedDisp = Math.max(-1.0, Math.min(1.0, nextDisp));

    const nextDisps = [...draggedDisplacementsRef.current];
    nextDisps[draggedMass] = clampedDisp;
    draggedDisplacementsRef.current = nextDisps;

    // Project displacements onto the N normal modes (discrete Fourier sine transform)
    const newAmps = Array(MAX_MASSES).fill(0);
    for (let m = 1; m <= numMasses; m++) {
      let sum = 0;
      for (let k = 1; k <= numMasses; k++) {
        sum += nextDisps[k - 1] * Math.sin((m * Math.PI * k) / (numMasses + 1));
      }
      newAmps[m - 1] = (2 / (numMasses + 1)) * sum;
    }

    setModeAmplitudes(newAmps);
    setModePhases(Array(MAX_MASSES).fill(0)); // Reset phase to zero on user configuration
    setTime(0); // Restart oscillator timeline from initial static shape
    setActivePreset('custom');
  };

  const handleMouseUp = () => {
        setDraggedMass(null);
        draggedDisplacementsRef.current = null;
      };

      return (
        <div style={{
          width: '100%', height: '100%',
          position: 'relative', background: '#0a0a1a', overflow: 'hidden',
          fontFamily: "'Inter', sans-serif", color: '#fff'
        }}>
          {/* Top Header Bar */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
            {onBack ? (
              <button 
                onClick={onBack}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <div />}
            <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
              {title || 'Normal Modes & Coupled Oscillators'}
            </h1>
            <div style={{ width: '100px' }} />
          </div>

          {/* Canvas / Main View */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="relative w-full max-w-[850px] aspect-[850/380] flex items-center justify-center p-2">
              <canvas 
                ref={canvasRef} 
                width={850} 
                height={380} 
                className="w-full h-auto max-w-full drop-shadow-[0_0_25px_rgba(168,85,247,0.15)] cursor-ns-resize"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {draggedMass === null && (
                <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', color: '#ccc', pointerEvents: 'none' }}>
                  💡 Drag any oscillator node to pluck or deform the string
                </div>
              )}
            </div>

            {/* Bottom Floating Play/Pause Controls */}
            <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10, background: 'rgba(20, 20, 30, 0.8)', padding: '8px 16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              <button 
                onClick={() => setPlaying(!playing)} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: playing ? 'rgba(241, 196, 15, 0.2)' : 'rgba(46, 204, 113, 0.2)', border: playing ? '1px solid #f1c40f' : '1px solid #2ecc71', color: playing ? '#f1c40f' : '#2ecc71', padding: '6px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? 'Pause' : 'Play'}
              </button>
              {!playing && (
                <button 
                  onClick={stepForward} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', padding: '6px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  <ChevronRight className="h-4 w-4" /> Step
                </button>
              )}
              <button 
                onClick={resetSimulation} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
              <div style={{ fontSize: '12px', color: '#ccc', fontFamily: 'monospace' }}>
                Time: <span style={{ color: '#3498db', fontWeight: 'bold' }}>{time.toFixed(2)}s</span>
              </div>
            </div>
          </div>

          {/* Floating Analysis Panels (Left overlay) */}
          {(showFrequencies || showPhaseWheels || showIndividual) && (
            <div style={{
              position: 'absolute', top: '90px', left: '20px', width: '300px',
              background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px',
              zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif",
              maxHeight: 'calc(100% - 130px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              {/* Frequencies Table */}
              {showFrequencies && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ActivitySquare className="h-4 w-4 text-cyan-400" /> Mode Frequencies
                  </h3>
                  <table style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Mode</th>
                        <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Freq (Hz)</th>
                        <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Period (s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: numMasses }).map((_, m) => {
                        const omega = 2 * getOmega0() * Math.sin(((m + 1) * Math.PI) / (2 * (numMasses + 1)));
                        const hz = omega / (2 * Math.PI);
                        const period = 1 / hz;
                        return (
                          <tr key={m} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '4px 0', fontWeight: 'bold', color: MODE_COLORS[m % MODE_COLORS.length] }}>Mode {m + 1}</td>
                            <td style={{ padding: '4px 0', textAlign: 'right', color: '#ccc' }}>{hz.toFixed(2)}</td>
                            <td style={{ padding: '4px 0', textAlign: 'right', color: '#ccc' }}>{period.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Phase Wheels */}
              {showPhaseWheels && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass className="h-4 w-4 text-amber-400" /> Phase Dials
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {Array.from({ length: numMasses }).map((_, m) => {
                      const omega = 2 * getOmega0() * Math.sin(((m + 1) * Math.PI) / (2 * (numMasses + 1)));
                      const curPhase = (omega * time + modePhases[m]) % (Math.PI * 2);
                      const amp = modeAmplitudes[m] || 0;
                      return (
                        <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', marginBottom: '4px' }}>M{m + 1}</span>
                          <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div 
                              style={{
                                position: 'absolute', width: '14px', height: '2px', originX: 0, transformOrigin: 'left center',
                                left: '50%', top: 'calc(50% - 1px)',
                                transform: `rotate(${-curPhase * (180 / Math.PI)}deg)`,
                                backgroundColor: MODE_COLORS[m % MODE_COLORS.length],
                                opacity: Math.abs(amp) > 0.02 ? 1 : 0.2
                              }}
                            />
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff', zIndex: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mode Decomposition Overview */}
              {showIndividual && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GitMerge className="h-4 w-4 text-purple-400" /> Mode Contribution
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {Array.from({ length: numMasses }).map((_, m) => {
                      const amp = modeAmplitudes[m] || 0;
                      const pct = Math.min(100, Math.round(Math.abs(amp) * 100));
                      return (
                        <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
                          <span style={{ fontSize: '9px', color: MODE_COLORS[m % MODE_COLORS.length], fontWeight: 'bold' }}>M{m+1}</span>
                          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Control Panels (floating/overlay Right) */}
          <div style={{
            position: 'absolute', top: '90px', right: '20px', width: '300px',
            background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px',
            zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif",
            maxHeight: 'calc(100% - 130px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <Sliders className="h-5 w-5 text-cyan-400" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Simulation Controls</h3>
            </div>

            {/* Presets Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Preset Waves</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'fundamental', label: 'Fund. (n=1)' },
                  { id: 'second', label: 'Mode 2' },
                  { id: 'third', label: 'Mode 3' },
                  { id: 'pluck', label: 'Pluck Tri.' },
                  { id: 'strike', label: 'End Pluck' },
                  { id: 'clear', label: 'Clear' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    style={{
                      background: activePreset === preset.id ? 'rgba(155, 89, 182, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: activePreset === preset.id ? '1px solid #9b59b6' : '1px solid transparent',
                      color: activePreset === preset.id ? '#9b59b6' : '#ccc',
                      fontSize: '11px', padding: '6px 4px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            {/* Number of Masses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Number of Masses</span>
                <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{numMasses}</span>
              </div>
              <input 
                type="range" min="1" max={MAX_MASSES} step="1"
                value={numMasses} onChange={(e) => setNumMasses(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#3498db' }}
              />
            </div>

            {/* Damping Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Damping</span>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                {['none', 'low', 'medium', 'high'].map((d) => (
                  <button
                    key={d} onClick={() => setDamping(d)}
                    style={{
                      flex: 1, padding: '6px 0', border: 'none', borderRadius: '6px',
                      background: damping === d ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: damping === d ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', fontWeight: damping === d ? 600 : 400,
                      fontSize: '11px', textTransform: 'uppercase', transition: 'all 0.2s'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Tension Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tension</span>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                {['low', 'medium', 'high'].map((t) => (
                  <button
                    key={t} onClick={() => setTension(t)}
                    style={{
                      flex: 1, padding: '6px 0', border: 'none', borderRadius: '6px',
                      background: tension === t ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: tension === t ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', fontWeight: tension === t ? 600 : 400,
                      fontSize: '11px', textTransform: 'uppercase', transition: 'all 0.2s'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Visualizations</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                  <span>Show Overlays</span>
                  <input type="checkbox" checked={showIndividual} onChange={(e) => setShowIndividual(e.target.checked)} style={{ accentColor: '#2ecc71' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                  <span>Show Springs</span>
                  <input type="checkbox" checked={showSprings} onChange={(e) => setShowSprings(e.target.checked)} style={{ accentColor: '#2ecc71' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                  <span>Show Freq Table</span>
                  <input type="checkbox" checked={showFrequencies} onChange={(e) => setShowFrequencies(e.target.checked)} style={{ accentColor: '#2ecc71' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                  <span>Show Phase Wheels</span>
                  <input type="checkbox" checked={showPhaseWheels} onChange={(e) => setShowPhaseWheels(e.target.checked)} style={{ accentColor: '#2ecc71' }} />
                </label>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            {/* Amplitude Equalizer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mode Equalizer</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {Array.from({ length: numMasses }).map((_, m) => (
                  <div key={m} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: MODE_COLORS[m % MODE_COLORS.length], fontWeight: 'bold' }}>Mode {m + 1}</span>
                      <span style={{ fontFamily: 'monospace' }}>Amp: {modeAmplitudes[m].toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="-1" max="1" step="0.01"
                      value={modeAmplitudes[m]} onChange={(e) => handleAmplitudeChange(m, e.target.value)} 
                      style={{ width: '100%', accentColor: MODE_COLORS[m % MODE_COLORS.length] }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                      <span>Phase Offset</span>
                      <span>{(modePhases[m] / Math.PI).toFixed(2)}π</span>
                    </div>
                    <input 
                      type="range" min="0" max={Math.PI * 2} step="0.01"
                      value={modePhases[m]} onChange={(e) => handlePhaseChange(m, e.target.value)} 
                      style={{ width: '100%', accentColor: '#9b59b6' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    export default function CustomNormalModes({ onBack, title }) {
        return <CustomNormalModesInner onBack={onBack} title={title || 'Normal Modes & Coupled Oscillators'} />;
    }
