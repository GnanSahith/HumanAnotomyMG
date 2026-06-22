import React, { useRef, useState, useEffect } from 'react';

const CustomLasersInner = () => {
  const canvasRef = useRef(null);
  const [pumpIntensity, setPumpIntensity] = useState(50);
  const [leftMirror, setLeftMirror] = useState(100);
  const [rightMirror, setRightMirror] = useState(90);
  
  const state = useRef({
    atoms: [],
    photons: [],
    lastTime: performance.now()
  });

  useEffect(() => {
    // Generate atoms
    const atoms = [];
    const rows = 12;
    const cols = 24;
    const startX = 180;
    const startY = 80;
    const spacingX = 20;
    const spacingY = 22;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const jitterX = (Math.random() - 0.5) * 12;
        const jitterY = (Math.random() - 0.5) * 12;
        atoms.push({
          x: startX + j * spacingX + jitterX,
          y: startY + i * spacingY + jitterY,
          state: 1, // 1: E1, 2: E2, 3: E3
          stateTime: 0
        });
      }
    }
    state.current.atoms = atoms;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const E3_LIFETIME = 0.08;
    const E2_LIFETIME = 2.5; 
    const C = 350;           
    const STIM_PROB = 0.04;  

    const draw = (currentTime) => {
      const dt = Math.min((currentTime - state.current.lastTime) / 1000, 0.05);
      state.current.lastTime = currentTime;

      const { atoms, photons } = state.current;

      const pumpRatePerAtom = (pumpIntensity / 100) * 8; 
      
      atoms.forEach(atom => {
        atom.stateTime += dt;
        
        if (atom.state === 1) {
          if (Math.random() < pumpRatePerAtom * dt) {
            atom.state = 3;
            atom.stateTime = 0;
          }
        } else if (atom.state === 3) {
          if (Math.random() < dt / E3_LIFETIME) {
            atom.state = 2;
            atom.stateTime = 0;
          }
        } else if (atom.state === 2) {
          if (Math.random() < dt / E2_LIFETIME) {
            atom.state = 1;
            atom.stateTime = 0;
            const angle = Math.random() * Math.PI * 2;
            photons.push({
              x: atom.x,
              y: atom.y,
              vx: Math.cos(angle) * C,
              vy: Math.sin(angle) * C,
              wavelength: 'red'
            });
          }
        }
      });

      const newPhotons = [];
      for (let i = photons.length - 1; i >= 0; i--) {
        const p = photons[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < 150 && p.vx < 0) {
          if (Math.random() < leftMirror / 100) {
            p.x = 150 + (150 - p.x);
            p.vx = -p.vx;
          }
        } else if (p.x > 650 && p.vx > 0) {
          if (Math.random() < rightMirror / 100) {
            p.x = 650 - (p.x - 650);
            p.vx = -p.vx;
          }
        }

        if (p.x < 0 || p.x > 800 || p.y < 0 || p.y > 400) {
          photons.splice(i, 1);
          continue;
        }

        for (let j = 0; j < atoms.length; j++) {
          const atom = atoms[j];
          if (atom.state === 2) {
            const dx = atom.x - p.x;
            const dy = atom.y - p.y;
            if (dx * dx + dy * dy < 144) {
              if (Math.random() < STIM_PROB) {
                atom.state = 1;
                atom.stateTime = 0;
                newPhotons.push({
                  x: atom.x,
                  y: atom.y,
                  vx: p.vx,
                  vy: p.vy,
                  wavelength: 'red'
                });
              }
            }
          }
        }
      }
      
      photons.push(...newPhotons);

      ctx.fillStyle = '#111827'; 
      ctx.fillRect(0, 0, 800, 400);

      ctx.fillStyle = `rgba(200, 200, 255, ${0.2 + (leftMirror / 100) * 0.8})`;
      ctx.fillRect(140, 50, 10, 300);
      
      ctx.fillStyle = `rgba(200, 200, 255, ${0.2 + (rightMirror / 100) * 0.8})`;
      ctx.fillRect(650, 50, 10, 300);

      if (pumpIntensity > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(400, 200, 0, 400, 200, 300);
        grad.addColorStop(0, `rgba(50, 150, 255, ${pumpIntensity / 250})`);
        grad.addColorStop(1, 'rgba(50, 150, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(150, 50, 500, 300);
        ctx.restore();
      }

      ctx.save();
      for (const atom of atoms) {
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, 4, 0, Math.PI * 2);
        
        if (atom.state === 1) {
          ctx.fillStyle = '#4B5563'; 
          ctx.fill();
        } else if (atom.state === 2) {
          ctx.fillStyle = '#EF4444'; 
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#EF4444';
          ctx.fill();
        } else if (atom.state === 3) {
          ctx.fillStyle = '#3B82F6'; 
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#3B82F6';
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.save();
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#EF4444';
      ctx.strokeStyle = '#FCA5A5'; 
      
      ctx.beginPath();
      for (const p of photons) {
        const len = 10;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const nx = p.vx / speed;
        const ny = p.vy / speed;
        
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - nx * len, p.y - ny * len);
      }
      ctx.stroke();
      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [pumpIntensity, leftMirror, rightMirror]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
      {/* Canvas / Main View centered */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '340px' }}>
        <div style={{ width: '800px', height: '400px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', background: '#070714' }}>
          <canvas ref={canvasRef} width={800} height={400} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Control Panels (floating/overlay) */}
      <div style={{ position: 'absolute', top: '90px', right: '20px', width: '320px', background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'calc(100% - 110px)', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', color: '#3498db' }}>Controls</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Pump Intensity</span>
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>{pumpIntensity}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" step="1" 
            value={pumpIntensity} 
            onChange={(e) => setPumpIntensity(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Left Mirror Reflectivity</span>
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>{leftMirror}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" step="1" 
            value={leftMirror} 
            onChange={(e) => setLeftMirror(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Right Mirror Reflectivity</span>
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>{rightMirror}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" step="1" 
            value={rightMirror} 
            onChange={(e) => setRightMirror(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} 
          />
        </div>

        <h3 style={{ margin: '10px 0 0 0', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', color: '#2ecc71' }}>Energy Levels</h3>
        <ul style={{ margin: '10px 0', paddingLeft: '20px', lineHeight: '1.6', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
          <li><span style={{ color: '#3498db', fontWeight: 'bold' }}>Blue:</span> Pumped State (Fast decay)</li>
          <li><span style={{ color: '#ef4444', fontWeight: 'bold' }}>Red:</span> Metastable State (Slow decay)</li>
          <li><span style={{ color: '#9ca3af', fontWeight: 'bold' }}>Gray:</span> Ground State</li>
        </ul>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Increase the pump intensity to achieve population inversion.
          Adjust mirror reflectivities to build up the laser cavity photon density.
        </p>
      </div>
    </div>
  );
};




export default function CustomLasers({ onBack, title }) {
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
                 <CustomLasersInner onBack={null} title={""} />
            </div>
        </div>
    );
}
