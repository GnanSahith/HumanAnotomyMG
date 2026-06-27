import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Settings2 } from 'lucide-react';
const CustomMicrowavesInner = ({
  onBack,
  title
}) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [amplitude, setAmplitude] = useState(50);
  const [frequency, setFrequency] = useState(50);
  const [moleculeCount, setMoleculeCount] = useState(20);

  // Simulation state
  const simState = useRef({
    time: 0,
    temperature: 0,
    molecules: []
  });
  const initMolecules = useCallback(() => {
    const newMolecules = [];
    const columns = Math.ceil(Math.sqrt(moleculeCount * 2));
    const startX = 400;
    const startY = 150;
    const spacingX = 40;
    const spacingY = 40;
    for (let i = 0; i < moleculeCount; i++) {
      const c = i % columns;
      const r = Math.floor(i / columns);
      newMolecules.push({
        x: startX + c * spacingX + (Math.random() - 0.5) * 10,
        y: startY + r * spacingY + (Math.random() - 0.5) * 10,
        theta: Math.random() * Math.PI * 2,
        omega: 0,
        baseX: startX + c * spacingX,
        baseY: startY + r * spacingY
      });
    }
    simState.current.molecules = newMolecules;
    simState.current.time = 0;
    simState.current.temperature = 0;
  }, [moleculeCount]);
  useEffect(() => {
    initMolecules();
  }, [initMolecules]);
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();
    const render = currentTime => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // Update physics if playing
      if (isPlaying) {
        simState.current.time += deltaTime;
        const t = simState.current.time;

        // Wave params
        const waveSpeed = 200;
        const k = frequency * 0.1 / waveSpeed; // wave number
        const w = frequency * 0.1; // angular frequency

        let totalKineticEnergy = 0;
        simState.current.molecules.forEach(m => {
          // E-field at molecule's position
          // Wave travels to the right
          const Ey = amplitude * 0.05 * Math.cos(k * m.x - w * t);

          // Torque
          const dipoleMoment = 1.0;
          const inertia = 0.5;
          const friction = 0.1;
          const torque = dipoleMoment * Math.cos(m.theta) * Ey;
          const alpha = (torque - friction * m.omega) / inertia;
          m.omega += alpha * deltaTime;
          m.theta += m.omega * deltaTime;

          // Add some random jiggle based on temperature
          const tempJiggle = simState.current.temperature / 100 * 2;
          m.x = m.baseX + (Math.random() - 0.5) * tempJiggle;
          m.y = m.baseY + (Math.random() - 0.5) * tempJiggle;
          totalKineticEnergy += 0.5 * inertia * m.omega * m.omega;
        });

        // Temperature rises slowly with kinetic energy and dissipates
        simState.current.temperature = simState.current.temperature * 0.99 + totalKineticEnergy / Math.max(1, moleculeCount) * 0.1;
      }

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = '#0a0a16';
      ctx.fillRect(0, 0, width, height);

      // Draw wave emitter
      ctx.fillStyle = '#333';
      ctx.fillRect(0, height / 2 - 40, 40, 80);
      ctx.strokeStyle = '#555';
      ctx.strokeRect(0, height / 2 - 40, 40, 80);

      // Draw E-field curve
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
      ctx.lineWidth = 3;
      const t = simState.current.time;
      const k = frequency * 0.1 / 200;
      const w = frequency * 0.1;
      for (let x = 40; x < width - 60; x += 5) {
        const Ey = amplitude * 1.5 * Math.cos(k * x - w * t);
        if (x === 40) {
          ctx.moveTo(x, height / 2 - Ey);
        } else {
          ctx.lineTo(x, height / 2 - Ey);
        }
      }
      ctx.stroke();

      // Draw Molecules
      simState.current.molecules.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.theta);

        // Oxygen (Red)
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hydrogen 1 (White)
        ctx.beginPath();
        ctx.arc(8, 6, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.stroke();

        // Hydrogen 2 (White)
        ctx.beginPath();
        ctx.arc(8, -6, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // Draw Thermometer
      const tempX = width - 40;
      const tempY = height / 2;
      const tempHeight = 200;
      ctx.fillStyle = '#222';
      ctx.fillRect(tempX - 10, tempY - tempHeight / 2, 20, tempHeight);
      ctx.strokeStyle = '#444';
      ctx.strokeRect(tempX - 10, tempY - tempHeight / 2, 20, tempHeight);
      ctx.beginPath();
      ctx.arc(tempX, tempY + tempHeight / 2, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#222';
      ctx.fill();
      ctx.stroke();
      const fillHeight = Math.min(tempHeight, simState.current.temperature * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(tempX - 8, tempY + tempHeight / 2 - fillHeight, 16, fillHeight);
      ctx.beginPath();
      ctx.arc(tempX, tempY + tempHeight / 2, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // Draw degree ticks
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      for (let ty = tempY - tempHeight / 2 + 10; ty < tempY + tempHeight / 2; ty += 20) {
        ctx.beginPath();
        ctx.moveTo(tempX - 10, ty);
        ctx.lineTo(tempX - 5, ty);
        ctx.stroke();
      }
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, amplitude, frequency, moleculeCount]);
  const handleReset = () => {
    setIsPlaying(false);
    initMolecules();
  };
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
    color: '#fff'
  }}>
      {/* Top Header Bar */}
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
      }} onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
      }} onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      }}>
            Back
          </button> : <div />}
        <h1 style={{
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        fontSize: '24px',
        fontWeight: '600',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        margin: 0
      }}>
          {title || 'Microwaves & Water Molecules'}
        </h1>
        <button onClick={handleReset} style={{
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
      }} onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
      }} onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      }}>
          Reset
        </button>
      </div>

      {/* Canvas / Main View */}
      <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: '320px'
    }}>
        <div style={{
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'rgba(20,20,30,0.4)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        position: 'relative'
      }}>
          <canvas ref={canvasRef} width={800} height={400} style={{
          display: 'block'
        }} />
          <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#ccc',
          fontFamily: 'monospace'
        }}>
            Time: <span style={{
            color: '#3498db',
            fontWeight: 'bold'
          }}>{simState.current.time.toFixed(1)}s</span>
          </div>
        </div>

        {/* Bottom Floating Play/Pause Controls */}
        <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 10
      }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#fff',
          width: '50px',
          height: '50px',
          borderRadius: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}>
            {isPlaying ? <Pause fill="#fff" size={20} /> : <Play fill="#fff" size={20} />}
          </button>
        </div>
      </div>

      {/* Floating Control Panel */}
      <div style={{
      position: 'absolute',
      top: '90px',
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
      maxHeight: 'calc(100% - 130px)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
        
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
          <label style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>Wave Generator</label>
          
          {/* Amplitude */}
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: '10px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px'
          }}>
              <span>Amplitude</span>
              <span style={{
              color: '#3498db',
              fontWeight: 'bold'
            }}>{amplitude}%</span>
            </div>
            <input type="range" min="0" max="100" value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} style={{
            width: '100%',
            accentColor: '#3498db'
          }} />
          </div>

          {/* Frequency */}
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: '10px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px'
          }}>
              <span>Frequency</span>
              <span style={{
              color: '#9b59b6',
              fontWeight: 'bold'
            }}>{frequency} Hz</span>
            </div>
            <input type="range" min="10" max="100" value={frequency} onChange={e => setFrequency(Number(e.target.value))} style={{
            width: '100%',
            accentColor: '#9b59b6'
          }} />
          </div>
        </div>

        <div style={{
        height: '1px',
        background: 'rgba(255,255,255,0.1)'
      }} />

        {/* Environment */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
          <label style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>Environment</label>
          
          {/* Molecule Count */}
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: '10px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px'
          }}>
              <span>Water Molecules</span>
              <span style={{
              color: '#2ecc71',
              fontWeight: 'bold'
            }}>{moleculeCount}</span>
            </div>
            <input type="range" min="1" max="50" value={moleculeCount} onChange={e => setMoleculeCount(Number(e.target.value))} style={{
            width: '100%',
            accentColor: '#2ecc71'
          }} />
          </div>
        </div>

        <div style={{
        height: '1px',
        background: 'rgba(255,255,255,0.1)'
      }} />

        {/* Info */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
          <label style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>Thermal Physics</label>
          <p style={{
          fontSize: '12.5px',
          color: '#ccc',
          lineHeight: '1.5',
          margin: '4px 0 0 0'
        }}>
            Microwaves rotate water molecules because they are electric dipoles. The continuous torque oscillates molecules and increases kinetic energy, raising the water temperature.
          </p>
        </div>

      </div>
    </div>;
};
export default function CustomMicrowaves({
  onBack,
  title
}) {
  return <CustomMicrowavesInner onBack={onBack} title={title || 'Microwaves & Water Molecules'} />;
}