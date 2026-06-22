import React, { useRef, useState, useEffect, useCallback } from 'react';

const MATERIALS = {
  Sodium: 2.28,
  Calcium: 2.90,
  Zinc: 4.31,
  Copper: 4.70,
  Platinum: 6.35,
};

const PLANCK_CONSTANT = 4.135667696e-15; // eV⋅s
const SPEED_OF_LIGHT = 299792458; // m/s
const CONST_HC = 1240; // eV⋅nm

// Helper to convert wavelength to RGB
const wavelengthToColor = (wavelength) => {
  let r, g, b;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380); g = 0; b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0; g = (wavelength - 440) / (490 - 440); b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0; g = 1; b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510); g = 1; b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1; g = -(wavelength - 645) / (645 - 580); b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1; g = 0; b = 0;
  } else {
    r = 0; g = 0; b = 0;
  }

  let factor;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 420 && wavelength < 700) {
    factor = 1.0;
  } else if (wavelength >= 700 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  } else {
    factor = 0.0;
  }
  
  if (wavelength < 380) { r = 0.5; g = 0; b = 0.8; factor = 0.5; }
  if (wavelength > 780) { r = 0.8; g = 0; b = 0; factor = 0.5; }

  const R = Math.round(255 * Math.pow(r * factor, 0.8));
  const G = Math.round(255 * Math.pow(g * factor, 0.8));
  const B = Math.round(255 * Math.pow(b * factor, 0.8));

  return `rgb(${R}, ${G}, ${B})`;
};

const CustomPhotoelectricEffectInner = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const [wavelength, setWavelength] = useState(400); // nm
  const [intensity, setIntensity] = useState(50); // %
  const [voltage, setVoltage] = useState(0); // V
  const [material, setMaterial] = useState('Sodium');
  const [current, setCurrent] = useState(0);

  const simState = useRef({
    photons: [], electrons: [], lastTime: 0,
    currentAccumulator: 0, currentSamples: []
  });

  const updateSimulation = useCallback((time) => {
    if (!simState.current.lastTime) simState.current.lastTime = time;
    const dt = Math.min((time - simState.current.lastTime) / 1000, 0.05);
    simState.current.lastTime = time;

    const state = simState.current;
    const canvas = canvasRef.current;
    
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      const cathodeX = 200;
      const anodeX = 600;
      const plateY = 150;
      const plateHeight = 200;
      const distance = anodeX - cathodeX;

      const workFunction = MATERIALS[material];
      const photonEnergy = CONST_HC / wavelength;
      
      if (Math.random() < (intensity / 100) * 0.5) {
        state.photons.push({
          x: 0, y: plateY + Math.random() * plateHeight, speed: 300
        });
      }

      for (let i = state.photons.length - 1; i >= 0; i--) {
        const p = state.photons[i];
        p.x += p.speed * dt;
        
        if (p.x >= cathodeX) {
          state.photons.splice(i, 1);
          
          if (photonEnergy >= workFunction) {
            const maxKE = photonEnergy - workFunction;
            const ke = Math.random() * maxKE;
            const speedX = Math.sqrt(ke) * 50; 
            const speedY = (Math.random() - 0.5) * 20;

            state.electrons.push({
              x: cathodeX + 2, y: p.y, vx: speedX, vy: speedY, ke: ke
            });
          }
        }
      }

      let electronsReached = 0;
      const accelerationX = (voltage / distance) * 5000; 

      for (let i = state.electrons.length - 1; i >= 0; i--) {
        const e = state.electrons[i];
        
        e.vx += accelerationX * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        if (e.x >= anodeX) {
          electronsReached++;
          state.electrons.splice(i, 1);
        } else if (e.x <= cathodeX) {
          state.electrons.splice(i, 1);
        } else if (e.y < 0 || e.y > height) {
          state.electrons.splice(i, 1);
        }
      }

      state.currentAccumulator += electronsReached;
      if (Math.random() < 0.1) {
        state.currentSamples.push(state.currentAccumulator);
        state.currentAccumulator = 0;
        if (state.currentSamples.length > 20) state.currentSamples.shift();
        const avgCurrent = state.currentSamples.reduce((a, b) => a + b, 0) / state.currentSamples.length;
        const measuredCurrent = (avgCurrent * 0.05).toFixed(3);
        setCurrent(measuredCurrent);
      }

      ctx.clearRect(0, 0, width, height);

      const lightColor = wavelengthToColor(wavelength);
      ctx.fillStyle = lightColor;
      ctx.globalAlpha = (intensity / 100) * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, plateY - 20);
      ctx.lineTo(cathodeX, plateY);
      ctx.lineTo(cathodeX, plateY + plateHeight);
      ctx.lineTo(0, plateY + plateHeight + 20);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.strokeStyle = '#666';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cathodeX, plateY + plateHeight); ctx.lineTo(cathodeX, 450);
      ctx.lineTo(anodeX, 450); ctx.lineTo(anodeX, plateY + plateHeight);
      ctx.stroke();

      ctx.fillStyle = '#222'; ctx.fillRect(380, 430, 40, 40);
      ctx.fillStyle = '#fff'; ctx.font = '14px Arial';
      ctx.fillText('Battery', 376, 490);
      ctx.fillText(`${voltage > 0 ? '+' : voltage < 0 ? '-' : ''}${Math.abs(voltage).toFixed(1)} V`, 380, 455);

      ctx.fillStyle = '#333'; ctx.beginPath();
      ctx.arc(anodeX, 450, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '16px Arial';
      ctx.fillText('A', anodeX, 456);

      ctx.fillStyle = '#aaa';
      ctx.fillRect(cathodeX - 10, plateY, 10, plateHeight);
      ctx.fillRect(anodeX, plateY, 10, plateHeight);
      
      ctx.fillStyle = '#fff';
      ctx.fillText(material, cathodeX - 5, plateY - 10);
      ctx.fillText('Anode', anodeX + 5, plateY - 10);

      ctx.fillStyle = lightColor;
      state.photons.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = lightColor;
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 10, p.y + Math.sin(p.x) * 4); ctx.stroke();
      });

      ctx.fillStyle = '#4444ff';
      state.electrons.forEach(e => {
        ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, Math.PI * 2); ctx.fill();
      });
    }

    requestRef.current = requestAnimationFrame(updateSimulation);
  }, [wavelength, intensity, voltage, material]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateSimulation);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updateSimulation]);

  const photonEnergy = (CONST_HC / wavelength).toFixed(2);
  const workFunction = MATERIALS[material].toFixed(2);
  const maxKE = Math.max(0, photonEnergy - workFunction).toFixed(2);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
      {/* Canvas / Main View centered */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '340px' }}>
        <div style={{ width: '800px', height: '550px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', background: '#070714' }}>
          <canvas ref={canvasRef} width={800} height={550} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Control Panels (floating/overlay) */}
      <div style={{ position: 'absolute', top: '90px', right: '20px', width: '320px', background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'calc(100% - 110px)', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', color: '#3498db' }}>Controls</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Wavelength</span>
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>{wavelength} nm</span>
          </div>
          <input 
            type="range" 
            min="200" max="850" 
            value={wavelength} 
            onChange={(e) => setWavelength(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Intensity</span>
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>{intensity}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={intensity} 
            onChange={(e) => setIntensity(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Battery Voltage</span>
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>{voltage.toFixed(2)} V</span>
          </div>
          <input 
            type="range" 
            min="-8" max="8" step="0.1" 
            value={voltage} 
            onChange={(e) => setVoltage(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Target Material</label>
          <select 
            value={material} 
            onChange={(e) => setMaterial(e.target.value)} 
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
          >
            {Object.keys(MATERIALS).map(mat => (
              <option key={mat} value={mat} style={{ background: '#1c1c28', color: 'white' }}>{mat}</option>
            ))}
          </select>
        </div>

        <h3 style={{ margin: '10px 0 0 0', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', color: '#2ecc71' }}>Metrics</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Photon Energy:</span>
            <span style={{ fontWeight: 'bold' }}>{photonEnergy} eV</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Work Function:</span>
            <span style={{ fontWeight: 'bold' }}>{workFunction} eV</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Max Electron KE:</span>
            <span style={{ fontWeight: 'bold' }}>{maxKE} eV</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(46, 204, 113, 0.1)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>Measured Current:</span>
            <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '14px' }}>{current} nA</span>
          </div>
        </div>
      </div>
    </div>
  );
};




export default function CustomPhotoelectricEffect({ onBack, title }) {
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
                 <CustomPhotoelectricEffectInner onBack={null} title={""} />
            </div>
        </div>
    );
}
