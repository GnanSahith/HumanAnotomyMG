import React, { useState, useEffect, useRef } from 'react';
import { Waves, Play, Pause, RotateCcw, Activity, Sliders, Square, Triangle, Zap, ArrowLeft, Settings2 } from 'lucide-react';
const HARMONICS = 11;
function CustomFourierMakingWavesInner({
  onBack,
  title
}) {
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
    const animate = time => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(animate);
      return;
    }
      if (playing) {
        const delta = (time - lastTime) / 1000;
        setTimeOffset(prev => prev + delta * 2);
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
  const applyPreset = type => {
    const newAmplitudes = Array(HARMONICS).fill(0);
    for (let i = 0; i < HARMONICS; i++) {
      const n = i + 1;
      if (type === 'square') {
        if (n % 2 !== 0) newAmplitudes[i] = 1 / n;
      } else if (type === 'triangle') {
        if (n % 2 !== 0) newAmplitudes[i] = Math.pow(-1, (n - 1) / 2) / (n * n);
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
      const xStr = i / numPoints * width;
      const t = i / numPoints * Math.PI * 4 - timeOffset;
      let y = 0;
      if (harmonicIndex !== null) {
        y = amplitudes[harmonicIndex] * Math.sin((harmonicIndex + 1) * t);
      } else {
        for (let j = 0; j < HARMONICS; j++) {
          y += amplitudes[j] * Math.sin((j + 1) * t);
        }
      }
      const yStr = centerY - y * scaleY;
      if (i === 0) path += `M ${xStr} ${yStr} `;else path += `L ${xStr} ${yStr} `;
    }
    return path;
  };
  const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#16a085', '#3498db', '#2980b9', '#9b59b6', '#8e44ad', '#d35400'];
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a1a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        
        
        {/* 2. Full Bleed Canvas Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }} ref={containerRef}>
            
            {/* THE CANVAS / SVG Container */}
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', paddingRight: '400px' }}>
                {/* Sum of Waves */}
                <div style={{ width: '100%', maxWidth: '800px', background: 'rgba(20, 20, 30, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Activity className="h-4 w-4 text-cyan-400" />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Sum of Waves</span>
                    </div>
                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                            <path d={generatePath()} fill="none" stroke="#3498db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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
                            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                            {amplitudes.map((amp, idx) => Math.abs(amp) > 0.01 && <path key={idx} d={generatePath(idx)} fill="none" stroke={colors[idx % colors.length]} strokeWidth="2" strokeOpacity={0.7} />)}
                        </svg>
                    </div>
                </div>
            </div>
            
            {/* 3. Floating Right Control Panel */}
            <div style={{ position: 'absolute', right: '40px', top: '20px', bottom: '20px', width: '340px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', color: '#fff' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                    <Activity size={20} color="rgba(255,255,255,0.7)" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Controls</h3>
                </div>
                
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
                                    <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>{amp.toFixed(2)}</span>
                                </div>
                                <input type="range" min="-1" max="1" step="0.01" value={amp} onChange={e => handleAmplitudeChange(idx, e.target.value)} style={{ width: '100%', accentColor: colors[idx % colors.length] }} />
                            </div>
                        ))}
                    </div>
                </div>
                
            </div>
        </div>
    </div>
  );
}
export default function CustomFourierMakingWaves({
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
  return <CustomFourierMakingWavesInner onBack={onBack} title={title || 'Fourier: Making Waves'} />;
}