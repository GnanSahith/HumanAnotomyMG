import { useState, useEffect, useRef } from 'react';

const GAS_PROPERTIES = {
  neon: { color: '#ff3300', excitationEnergy: 40 },
  argon: { color: '#aa33ff', excitationEnergy: 50 },
  mercury: { color: '#00ffff', excitationEnergy: 60 },
  sodium: { color: '#ffcc00', excitationEnergy: 30 }
};

const CustomNeonLightsInner = ({ onBack, title }) => {
  const canvasRef = useRef(null);
  
  const [voltage, setVoltage] = useState(50);
  const [gasType, setGasType] = useState('neon');
  const [continuousFired, setContinuousFired] = useState(false);

  const state = useRef({
    electrons: [],
    atoms: [],
    photons: [],
    lastTime: 0,
    manualFireTrigger: false,
    clearTrigger: false
  });

  // Initialize atoms once
  useEffect(() => {
    const newAtoms = [];
    for(let i=0; i<40; i++) {
      newAtoms.push({
        x: 150 + Math.random() * 500,
        y: 100 + Math.random() * 400,
        excited: false,
        timer: 0
      });
    }
    state.current.atoms = newAtoms;
  }, []);

  const fireElectron = () => {
    state.current.manualFireTrigger = true;
  };

  const clearSimulation = () => {
    state.current.clearTrigger = true;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const draw = () => {
      const now = performance.now();
      if (state.current.lastTime === 0) state.current.lastTime = now;
      const dt = (now - state.current.lastTime) / 1000;
      state.current.lastTime = now;

      const s = state.current;

      if (s.clearTrigger) {
        s.electrons = [];
        s.photons = [];
        s.atoms.forEach(a => { a.excited = false; a.timer = 0; });
        s.clearTrigger = false;
      }

      // Handle firing
      if (s.manualFireTrigger || (continuousFired && Math.random() < 0.1)) {
        s.electrons.push({
          x: 100,
          y: 100 + Math.random() * 400,
          vx: (2 + (voltage / 20)) * (dt * 60 || 1), // velocity scaled by dt
          energy: voltage
        });
        s.manualFireTrigger = false;
      }

      // Update electrons
      let newElectrons = [];
      let newPhotons = [];
      const gas = GAS_PROPERTIES[gasType];

      s.electrons.forEach(e => {
        let eNextX = e.x + e.vx;
        let eNextY = e.y;
        
        // Collision with atoms
        for(let i=0; i<s.atoms.length; i++) {
          let a = s.atoms[i];
          if (!a.excited) {
            let dx = eNextX - a.x;
            let dy = eNextY - a.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 15 && e.energy >= gas.excitationEnergy) {
              a.excited = true;
              a.timer = 30 + Math.random() * 30; // frames
              e.energy -= gas.excitationEnergy;
              e.vx = (2 + (e.energy / 20)) * (dt * 60 || 1); // slow down
              break;
            }
          }
        }

        if (eNextX < 700) {
          newElectrons.push({ ...e, x: eNextX, y: eNextY });
        }
      });
      s.electrons = newElectrons;

      // Update atoms
      s.atoms.forEach(a => {
        if (a.excited) {
          a.timer -= 1;
          if (a.timer <= 0) {
            a.excited = false;
            const angle = Math.random() * Math.PI * 2;
            newPhotons.push({
              x: a.x,
              y: a.y,
              vx: Math.cos(angle) * 5 * (dt * 60 || 1),
              vy: Math.sin(angle) * 5 * (dt * 60 || 1),
              life: 100
            });
          }
        }
      });

      // Update photons
      if (newPhotons.length > 0) {
        s.photons.push(...newPhotons);
      }
      s.photons = s.photons.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 1
      })).filter(p => p.life > 0);


      // Rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Tube
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100, 50);
      ctx.lineTo(700, 50);
      ctx.moveTo(100, 550);
      ctx.lineTo(700, 550);
      ctx.stroke();

      // Draw Electrodes
      ctx.fillStyle = '#666';
      ctx.fillRect(80, 50, 20, 500); // Cathode (-)
      ctx.fillRect(700, 50, 20, 500); // Anode (+)

      // Labels
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.fillText('-', 60, 300);
      ctx.fillText('+', 730, 300);

      // Draw Atoms
      s.atoms.forEach(a => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = a.excited ? gas.color : '#444';
        ctx.fill();
        if (a.excited) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw Electrons
      ctx.fillStyle = '#00ffff';
      s.electrons.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Photons
      s.photons.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = gas.color;
        ctx.fill();
        // trail
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx*2, p.y - p.vy*2);
        ctx.strokeStyle = gas.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [voltage, gasType, continuousFired]);

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
            Back
          </button>
        ) : <div />}
        <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
          {title || 'Neon Lights Simulation'}
        </h1>
        <button 
          onClick={clearSimulation}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px',
            color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease',
            fontWeight: 600, fontFamily: "'Inter', sans-serif"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
        >
          Clear
        </button>
      </div>

      {/* Canvas / Main View */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '320px' }}>
        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(20,20,30,0.4)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{ display: 'block' }}
          />
        </div>
      </div>

      {/* Floating Control Panel */}
      <div style={{
        position: 'absolute', top: '90px', right: '20px', width: '300px',
        background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px',
        zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif",
        maxHeight: 'calc(100% - 130px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Gas Chamber Settings</label>
          
          {/* Gas Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Gas Type</span>
            <select 
              value={gasType} 
              onChange={e => setGasType(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer' }}
            >
              <option value="neon">Neon (Red)</option>
              <option value="argon">Argon (Purple)</option>
              <option value="mercury">Mercury (Blue)</option>
              <option value="sodium">Sodium (Yellow)</option>
            </select>
          </div>

          {/* Voltage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>Electric Voltage</span>
              <span style={{ color: '#3498db', fontWeight: 'bold' }}>{voltage}V</span>
            </div>
            <input 
              type="range" min="10" max="100" 
              value={voltage} onChange={e => setVoltage(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3498db' }}
            />
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Firing Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Electron Gun</label>
          
          <button 
            onClick={fireElectron}
            style={{
                background: 'rgba(52, 152, 219, 0.2)', border: '1px solid #3498db',
                color: '#3498db', padding: '10px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                transition: 'all 0.2s', width: '100%'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(52, 152, 219, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(52, 152, 219, 0.2)'}
          >
            Fire Single Electron
          </button>

          <button 
            onClick={() => setContinuousFired(!continuousFired)}
            style={{
                background: continuousFired ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                border: continuousFired ? '1px solid #e74c3c' : '1px solid #2ecc71',
                color: continuousFired ? '#e74c3c' : '#2ecc71',
                padding: '10px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                transition: 'all 0.2s', width: '100%'
            }}
          >
            {continuousFired ? 'Stop Continuous' : 'Continuous Fire'}
          </button>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>How it works</label>
          <p style={{ fontSize: '12.5px', color: '#ccc', lineHeight: '1.5', margin: '4px 0 0 0' }}>
            Adjust voltage to accelerate electrons. Collisions with gas atoms transfer energy and excite them. When returning to the ground state, they emit light (photons) of specific wavelengths.
          </p>
        </div>

      </div>
    </div>
  );
};

export default function CustomNeonLights({ onBack, title }) {
    return <CustomNeonLightsInner onBack={onBack} title={title || 'Neon Lights Simulation'} />;
}

