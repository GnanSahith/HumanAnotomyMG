import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, Activity, ArrowLeft, Volume2, Radio } from 'lucide-react';

export default function CustomSoundWaves({ onBack, title, isPlaying: globalIsPlaying, syncPlayState }) {
    const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
    
    // Core Parameters
    const [frequency, setFrequency] = useState(5);
    const [amplitude, setAmplitude] = useState(1.0);
    
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const timeRef = useRef(0);
    const imageDataRef = useRef(null);

    const containerWidth = 600;
    const containerHeight = 600;

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        if (!imageDataRef.current || imageDataRef.current.width !== width || imageDataRef.current.height !== height) {
            imageDataRef.current = ctx.createImageData(width, height);
        }

        const imgData = imageDataRef.current;
        const data = imgData.data;
        const cx = width / 2;
        const cy = height / 2;

        const time = timeRef.current;
        const f = frequency * 0.02; // Scale frequency for better visual
        const amp = amplitude * 255;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // wave equation: sin(k * r - w * t)
                const val = Math.sin(dist * f - time * frequency * 0.1);
                
                const intensity = (val + 1) / 2; // 0 to 1
                const c = intensity * amp;

                const index = (y * width + x) * 4;
                // Tinting the wave with the primary color #bf5af2 (191, 90, 242)
                data[index] = (c * 191) / 255;
                data[index + 1] = (c * 90) / 255;
                data[index + 2] = (c * 242) / 255;
                data[index + 3] = 255;
            }
        }

        ctx.putImageData(imgData, 0, 0);
    };

    const updatePhysics = () => {
    if (!isPlayingRef.current) {
      if (lastTimeRef && lastTimeRef.current !== undefined) lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(updatePhysics);
      return;
    }
        if (!isPlaying) {
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        timeRef.current += 0.1;
        renderCanvas();

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, frequency, amplitude]);

    const resetSimulation = () => {
        setFrequency(5);
        setAmplitude(1.0);
        timeRef.current = 0;
        if (!isPlaying) {
            renderCanvas();
        }
    };

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(180deg, #12121A 0%, #0a0a0f 100%)',
            color: '#fff', position: 'relative', overflow: 'hidden'
        }}>
            {/* Top Bar */}
            <div style={{
                padding: '16px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)'
            }}>
                {/* Left Side: Back Button */}
                

                {/* Center: Title & Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <div style={{ padding: '8px', background: 'rgba(191,90,242,0.2)', borderRadius: '12px', border: '1px solid rgba(191,90,242,0.3)' }}>
                        <Radio size={24} color="#bf5af2" />
                    </div>
                    <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600, color: '#fff' }}>{title || 'Sound Waves MG'}</h2>
                </div>

                {/* Right Side: Controls */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        style={{
                            background: isPlaying ? 'rgba(255,55,95,0.2)' : 'rgba(10,132,255,0.2)',
                            color: isPlaying ? '#ff375f' : '#0a84ff',
                            border: 'none', padding: '10px 20px', borderRadius: '100px',
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            fontWeight: 600, transition: 'all 0.2s'
                        }}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button 
                        onClick={resetSimulation}
                        style={{
                            background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '10px 16px', 
                            borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {/* Visual Canvas */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                    <div style={{
                        position: 'relative',
                        width: `${containerWidth}px`,
                        height: `${containerHeight}px`,
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#000'
                    }}>
                        <canvas 
                            ref={canvasRef}
                            width={containerWidth}
                            height={containerHeight}
                            style={{ position: 'absolute', top: 0, left: 0 }}
                        />
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div style={{
                    width: '340px', background: 'rgba(0,0,0,0.3)', borderLeft: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Simulation Parameters</h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Frequency Control */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Frequency</label>
                                <span style={{ fontSize: '14px', color: '#bf5af2', fontWeight: 600 }}>{frequency.toFixed(1)} Hz</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" max="10" step="0.1" 
                                value={frequency}
                                onChange={(e) => setFrequency(parseFloat(e.target.value))}
                                style={{
                                    width: '100%', cursor: 'pointer', accentColor: '#bf5af2'
                                }}
                            />
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                        {/* Amplitude Control */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Amplitude</label>
                                <span style={{ fontSize: '14px', color: '#0a84ff', fontWeight: 600 }}>{Math.round(amplitude * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.05" 
                                value={amplitude}
                                onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                                style={{
                                    width: '100%', cursor: 'pointer', accentColor: '#0a84ff'
                                }}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
