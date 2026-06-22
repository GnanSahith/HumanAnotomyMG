import { useState, useEffect } from 'react';
import { Waves, Play, Pause, RotateCcw, Activity, Sliders, Square, Triangle, Zap } from 'lucide-react';

const HARMONICS = 11;

function CustomFourierMakingWavesInner({ onBack, title }) {
  const [amplitudes, setAmplitudes] = useState(() => {
    const initAmps = Array(HARMONICS).fill(0);
    initAmps[0] = 1;
    return initAmps;
  });
  const [playing, setPlaying] = useState(true);
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    let animationFrame;
    let lastTime = performance.now();
    
    const animate = (time) => {
      if (playing) {
        const delta = (time - lastTime) / 1000;
        setTimeOffset((prev) => prev + delta * 2);
      }
      lastTime = time;
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [playing]);

  const handleAmplitudeChange = (index, value) => {
    const newAmplitudes = [...amplitudes];
    newAmplitudes[index] = parseFloat(value);
    setAmplitudes(newAmplitudes);
  };

  const applyPreset = (type) => {
    const newAmplitudes = Array(HARMONICS).fill(0);
    for (let i = 0; i < HARMONICS; i++) {
      const n = i + 1;
      if (type === 'square') {
        if (n % 2 !== 0) newAmplitudes[i] = 1 / n;
      } else if (type === 'triangle') {
        if (n % 2 !== 0) newAmplitudes[i] = (Math.pow(-1, (n - 1) / 2)) / (n * n);
      } else if (type === 'sawtooth') {
        newAmplitudes[i] = Math.pow(-1, n + 1) / n;
      } else if (type === 'sine') {
        if (n === 1) newAmplitudes[i] = 1;
      }
    }
    setAmplitudes(newAmplitudes);
  };

  const resetSimulation = () => {
    setTimeOffset(0);
    applyPreset('sine');
  };

  const width = 800;
  const height = 200;
  const numPoints = 200;
  
  const generatePath = (harmonicIndex = null) => {
    let path = '';
    const scaleY = height / 4;
    const centerY = height / 2;
    
    for (let i = 0; i <= numPoints; i++) {
      const xStr = (i / numPoints) * width;
      const t = (i / numPoints) * Math.PI * 4 - timeOffset;
      
      let y = 0;
      if (harmonicIndex !== null) {
        y = amplitudes[harmonicIndex] * Math.sin((harmonicIndex + 1) * t);
      } else {
        for (let j = 0; j < HARMONICS; j++) {
          y += amplitudes[j] * Math.sin((j + 1) * t);
        }
      }
      
      const yStr = centerY - y * scaleY;
      
      if (i === 0) path += `M ${xStr} ${yStr} `;
      else path += `L ${xStr} ${yStr} `;
    }
    return path;
  };

  const colors = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#16a085',
    '#3498db', '#2980b9', '#9b59b6', '#8e44ad', '#d35400'
  ];

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
            <RotateCcw size={16} /> Back
          </button>
        ) : <div />}
        <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
          {title || 'Fourier: Making Waves'}
        </h1>
        <button 
          onClick={resetSimulation}
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
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      {/* Canvas / Main View */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', padding: '90px 340px 90px 40px' }}>
        
        {/* Sum of Waves */}
        <div style={{ width: '100%', maxWidth: '800px', background: 'rgba(20, 20, 30, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Activity className="h-4 w-4 text-cyan-400" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Sum of Waves</span>
          </div>
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
              <path
                d={generatePath()}
                fill="none"
                stroke="#3498db"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Individual Harmonics */}
        <div style={{ width: '100%', maxWidth: '800px', background: 'rgba(20, 20, 30, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Waves className="h-4 w-4 text-purple-400" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Individual Harmonics</span>
          </div>
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
              <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
              {amplitudes.map((amp, idx) => Math.abs(amp) > 0.01 && (
                <path
                  key={idx}
                  d={generatePath(idx)}
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="2"
                  strokeOpacity={0.7}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Bottom Floating Play/Pause */}
        <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', zIndex: 10 }}>
          <button 
            onClick={() => setPlaying(!playing)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff',
              width: '50px', height: '50px', borderRadius: '25px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            {playing ? <Pause fill="#fff" size={20} /> : <Play fill="#fff" size={20} />}
          </button>
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
        
        {/* Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Presets</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={() => applyPreset('sine')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
              <Activity size={14} className="text-cyan-400" /> Sine
            </button>
            <button onClick={() => applyPreset('square')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
              <Square size={14} className="text-amber-400" /> Square
            </button>
            <button onClick={() => applyPreset('triangle')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
              <Triangle size={14} className="text-purple-400" /> Triangle
            </button>
            <button onClick={() => applyPreset('sawtooth')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
              <Zap size={14} className="text-red-400" /> Sawtooth
            </button>
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Harmonics sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Harmonics Amplitudes</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {amplitudes.map((amp, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: colors[idx % colors.length], fontWeight: 'bold' }}>Harmonic {idx + 1}</span>
                  <span style={{ fontFamily: 'monospace' }}>{amp.toFixed(2)}</span>
                </div>
                <input
                  type="range" min="-1" max="1" step="0.01"
                  value={amp} onChange={(e) => handleAmplitudeChange(idx, e.target.value)}
                  style={{ width: '100%', accentColor: colors[idx % colors.length] }}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CustomFourierMakingWaves({ onBack, title }) {
    return <CustomFourierMakingWavesInner onBack={onBack} title={title || 'Fourier: Making Waves'} />;
}
