import React, { useState, useEffect, useRef } from 'react';
import { Atom, Sun, Target, Activity, Settings, Maximize2, RotateCcw, ArrowLeft, Play, Pause, Settings2 } from 'lucide-react';
function CustomModelsOfHydrogenAtomInner() {
  const [model, setModel] = useState('Bohr');
  const [lightType, setLightType] = useState('White');
  const [wavelength, setWavelength] = useState(121);
  const [running, setRunning] = useState(true);
  const canvasRef = useRef(null);
  const spectrometerRef = useRef(null);
  const state = useRef({
    photons: [],
    // incoming and outgoing photons
    electronLevel: 1,
    // 1 to 6
    electronAngle: 0,
    solarRadius: 60,
    time: 0,
    emittedPhotons: [] // for spectrometer
  });
  const bohrLevels = [0, 20, 45, 65, 80, 90, 98]; // dummy radii for n=1 to 6 (index 1 to 6)

  const wavelengthToColor = wl => {
    if (wl < 400) return '#a855f7'; // UV represented as purple
    if (wl > 700) return '#ef4444'; // IR as red
    // Rough approximation for visible
    if (wl < 450) return '#3b82f6';
    if (wl < 500) return '#06b6d4';
    if (wl < 550) return '#22c55e';
    if (wl < 600) return '#eab308';
    if (wl < 650) return '#f97316';
    return '#ef4444';
  };
  const firePhoton = () => {
    let wl = wavelength;
    if (lightType === 'White') {
      // Random wavelength: mostly visible and some UV
      const randoms = [97, 102, 121, 410, 434, 486, 656, 300, 400, 500, 600, 700];
      wl = randoms[Math.floor(Math.random() * randoms.length)];
    }
    state.current.photons.push({
      x: -50,
      y: 200 + (Math.random() - 0.5) * 40,
      vx: 5,
      vy: 0,
      wl: wl,
      color: wavelengthToColor(wl),
      active: true,
      isEmitted: false
    });
  };
  useEffect(() => {
    let anim;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.current.time++;

      // Automatically fire photons
      if (running && state.current.time % 20 === 0) {
        firePhoton();
      }
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw Atom Model
      ctx.save();
      ctx.translate(cx, cy);
      if (model === 'Billiard Ball') {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();
      } else if (model === 'Plum Pudding') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#60a5fa';
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.arc(40 * Math.cos(i * Math.PI / 4), 40 * Math.sin(i * Math.PI / 4), 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (model === 'Classical Solar System') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        state.current.electronAngle += 0.1;
        if (running) {
          state.current.solarRadius -= 0.1; // spiral in
        }
        if (state.current.solarRadius < 8) state.current.solarRadius = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, state.current.solarRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(state.current.solarRadius * Math.cos(state.current.electronAngle), state.current.solarRadius * Math.sin(state.current.electronAngle), 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (model === 'Bohr') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        for (let n = 1; n <= 6; n++) {
          ctx.strokeStyle = n === state.current.electronLevel ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.arc(0, 0, bohrLevels[n], 0, Math.PI * 2);
          ctx.stroke();
        }
        state.current.electronAngle += 0.05 / state.current.electronLevel;
        const r = bohrLevels[state.current.electronLevel];
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(r * Math.cos(state.current.electronAngle), r * Math.sin(state.current.electronAngle), 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (model === 'de Broglie') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        const n = state.current.electronLevel;
        const baseR = bohrLevels[n];
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2.05; a += 0.05) {
          const wave = Math.sin(a * n - state.current.time * 0.1) * 10;
          const px = (baseR + wave) * Math.cos(a);
          const py = (baseR + wave) * Math.sin(a);
          if (a === 0) ctx.moveTo(px, py);else ctx.lineTo(px, py);
        }
        ctx.stroke();
      } else if (model === 'Schrödinger') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        const n = state.current.electronLevel;
        const r = bohrLevels[n];
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 20);
        grad.addColorStop(0, 'rgba(96, 165, 250, 0.0)');
        grad.addColorStop(0.5, 'rgba(96, 165, 250, 0.4)');
        grad.addColorStop(1, 'rgba(96, 165, 250, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r + 20, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 30; i++) {
          const a = Math.random() * Math.PI * 2;
          const dist = r + (Math.random() - 0.5) * 15;
          ctx.fillStyle = `rgba(96, 165, 250, ${Math.random() * 0.8})`;
          ctx.beginPath();
          ctx.arc(dist * Math.cos(a), dist * Math.sin(a), 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Draw and update photons
      for (let i = state.current.photons.length - 1; i >= 0; i--) {
        const p = state.current.photons[i];
        if (!running) {
          // draw only
        } else {
          p.x += p.vx;
          p.y += p.vy;
        }
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Interaction logic
        if (p.active && !p.isEmitted) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 50) {
            if (model === 'Billiard Ball') {
              p.vx = -p.vx; // bounce
              p.active = false;
            } else if (model === 'Bohr' || model === 'de Broglie' || model === 'Schrödinger') {
              // check absorption
              const E_photon = 1240 / p.wl; // eV
              const level = state.current.electronLevel;
              let absorbed = false;
              for (let targetN = level + 1; targetN <= 6; targetN++) {
                const E_diff = 13.6 * (1 / (level * level) - 1 / (targetN * targetN));
                if (Math.abs(E_photon - E_diff) < 0.5) {
                  state.current.electronLevel = targetN;
                  p.active = false;
                  absorbed = true;

                  // Emit after a delay
                  setTimeout(() => {
                    if (state.current.electronLevel > 1) {
                      const dropTo = 1; // Simplify: drop to ground
                      const emittedE = 13.6 * (1 / (dropTo * dropTo) - 1 / (state.current.electronLevel * state.current.electronLevel));
                      const emittedWl = 1240 / emittedE;
                      const angle = Math.random() * Math.PI * 2;
                      state.current.photons.push({
                        x: cx,
                        y: cy,
                        vx: 5 * Math.cos(angle),
                        vy: 5 * Math.sin(angle),
                        wl: emittedWl,
                        color: wavelengthToColor(emittedWl),
                        active: true,
                        isEmitted: true
                      });
                      state.current.emittedPhotons.push(emittedWl);
                      state.current.electronLevel = dropTo;
                    }
                  }, 1000 + Math.random() * 1000);
                  break;
                }
              }
              if (absorbed) p.x = 10000; // hide
            }
          }
        }
        if (p.x > canvas.width + 100 || p.x < -100 || p.y < -100 || p.y > canvas.height + 100) {
          state.current.photons.splice(i, 1);
        }
      }
      anim = requestAnimationFrame(draw);
    };
    anim = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(anim);
  }, [model, running, lightType, wavelength]);

  // Spectrometer drawing
  useEffect(() => {
    const canvas = spectrometerRef.current;
    const ctx = canvas.getContext('2d');
    const drawSpec = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw spectrum background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#a855f7');
      grad.addColorStop(0.3, '#3b82f6');
      grad.addColorStop(0.5, '#22c55e');
      grad.addColorStop(0.7, '#eab308');
      grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;

      // Draw lines
      ctx.fillStyle = '#fff';
      state.current.emittedPhotons.forEach(wl => {
        // Map 90-700 to 0-canvas.width
        let x = (wl - 90) / 610 * canvas.width;
        if (x < 0) x = 0;
        if (x > canvas.width) x = canvas.width;
        ctx.fillStyle = wavelengthToColor(wl);
        ctx.fillRect(x, 0, 2, canvas.height);
      });
      requestAnimationFrame(drawSpec);
    };
    drawSpec();
  }, []);
  return <div style={{
    display: 'flex',
    width: '100%',
    height: '100%',
    padding: '90px 20px 20px 20px',
    gap: '20px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif"
  }}>
      {/* Left Column: Simulation Canvas & Spectrometer */}
      <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      overflowY: 'auto'
    }}>
        
        {/* Main Canvas Area */}
        <div style={{
        position: 'relative',
        background: 'rgba(20, 20, 30, 0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '450px',
        overflow: 'hidden'
      }}>
          <div style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10
        }}>
              <Sun className="h-5 w-5 text-yellow-400" />
              <span style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#e2e8f0'
          }}>Light Source: {lightType}</span>
          </div>
          <div style={{
          position: 'absolute',
          bottom: '15px',
          right: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10
        }}>
              <span style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#e2e8f0'
          }}>Model: {model}</span>
              <Atom className="h-5 w-5 text-purple-400" />
          </div>
          
          <div style={{
          position: 'absolute',
          left: '15px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '48px',
          height: '96px',
          borderRadius: '0 24px 24px 0',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(20,20,30,0.8)'
        }}>
              <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            boxShadow: '0 0 15px rgba(255,255,255,0.8)',
            backgroundColor: lightType === 'White' ? '#fff' : wavelengthToColor(wavelength)
          }}></div>
          </div>

          <canvas ref={canvasRef} width={600} height={400} style={{
          maxWidth: '100%',
          height: 'auto',
          filter: 'drop-shadow(0 0 15px rgba(168,85,247,0.2))'
        }} />
        </div>

        {/* Spectrometer */}
        <div style={{
        background: 'rgba(20, 20, 30, 0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '20px'
      }}>
           <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '15px'
        }}>
              <Activity className="h-5 w-5 text-cyan-400" />
              <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'white',
            margin: 0
          }}>Spectrometer</h2>
           </div>
           <div style={{
          width: '100%',
          height: '96px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative'
        }}>
              <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 8px',
            fontSize: '10px',
            color: '#94a3b8',
            marginTop: '4px',
            zIndex: 10
          }}>
                  <span>90nm (UV)</span>
                  <span>400nm</span>
                  <span>700nm (IR)</span>
              </div>
              <canvas ref={spectrometerRef} width={800} height={100} style={{
            width: '100%',
            height: '100%'
          }} />
           </div>
        </div>

      </div>

      {/* Right Column: Controls */}
      <div style={{
      width: '320px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      overflowY: 'auto'
    }}>
        
        {/* Playback Controls Card */}
        <div style={{
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
          <span style={{
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: 'rgba(255,255,255,0.5)'
        }}>Simulation State</span>
          <div style={{
          display: 'flex',
          gap: '10px'
        }}>
            <button onClick={() => setRunning(!running)} style={{
            flex: 1,
            padding: '10px',
            background: running ? '#e74c3c' : '#2ecc71',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
              {running ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => {
            state.current.photons = [];
            state.current.emittedPhotons = [];
            state.current.electronLevel = 1;
            state.current.solarRadius = 60;
          }} style={{
            flex: 1,
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}>
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div style={{
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
          <h2 style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'white',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
             <Target className="h-5 w-5 text-rose-400" /> Model Selection
          </h2>
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
             {['Billiard Ball', 'Plum Pudding', 'Classical Solar System', 'Bohr', 'de Broglie', 'Schrödinger'].map(m => <button key={m} onClick={() => setModel(m)} style={{
            textAlign: 'left',
            padding: '10px 14px',
            borderRadius: '10px',
            border: m === model ? '1px solid rgba(168,85,247,0.5)' : '1px solid transparent',
            background: m === model ? 'rgba(168,85,247,0.15)' : 'transparent',
            color: m === model ? 'white' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: m === model ? 600 : 500,
            transition: 'all 0.2s'
          }}>
                     {m}
                 </button>)}
          </div>
        </div>

        {/* Light Controls */}
        <div style={{
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
          <h2 style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'white',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
             <Sun className="h-5 w-5 text-yellow-400" /> Light Controls
          </h2>
          
          <div style={{
          display: 'flex',
          gap: '8px'
        }}>
              <button onClick={() => setLightType('White')} style={{
            flex: 1,
            padding: '8px',
            fontSize: '12px',
            borderRadius: '8px',
            border: 'none',
            background: lightType === 'White' ? '#fff' : 'rgba(255,255,255,0.05)',
            color: lightType === 'White' ? '#0f172a' : '#94a3b8',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
                  White Light
              </button>
              <button onClick={() => setLightType('Monochromatic')} style={{
            flex: 1,
            padding: '8px',
            fontSize: '12px',
            borderRadius: '8px',
            border: 'none',
            background: lightType === 'Monochromatic' ? '#a855f7' : 'rgba(255,255,255,0.05)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
                  Monochromatic
              </button>
          </div>

          {lightType === 'Monochromatic' && <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '10px'
        }}>
                  <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px'
          }}>
                      <span style={{
              color: '#94a3b8'
            }}>Wavelength</span>
                      <span style={{
              color: 'white',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>{wavelength} nm</span>
                  </div>
                  <input type="range" min="90" max="700" step="1" value={wavelength} onChange={e => setWavelength(Number(e.target.value))} style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer',
            background: `linear-gradient(to right, #a855f7 0%, #3b82f6 30%, #22c55e 60%, #eab308 80%, #ef4444 100%)`
          }} />
                  <div style={{
            fontSize: '11px',
            color: '#64748b',
            marginTop: '4px'
          }}>
                      Hint: 97nm, 102nm, 121nm excite from n=1
                  </div>
              </div>}
        </div>

        {/* Energy Levels Card */}
        <div style={{
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
           <h2 style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'white',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
             <Settings className="h-5 w-5 text-slate-400" /> Energy Levels (Bohr)
           </h2>
           <div style={{
          height: '140px',
          borderLeft: '1px solid #475569',
          paddingLeft: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#94a3b8',
          position: 'relative'
        }}>
               <div><span>n=6 (-0.38 eV)</span></div>
               <div><span>n=5 (-0.54 eV)</span></div>
               <div><span>n=4 (-0.85 eV)</span></div>
               <div><span>n=3 (-1.51 eV)</span></div>
               <div><span>n=2 (-3.40 eV)</span></div>
               <div style={{
            color: 'white',
            fontWeight: 'bold'
          }}><span>n=1 (-13.6 eV) Ground</span></div>
           </div>
        </div>
        
      </div>
    </div>;
}
export default function CustomModelsOfHydrogenAtom({
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
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomModelsOfHydrogenAtomInner />
            </div>
        </div>;
}