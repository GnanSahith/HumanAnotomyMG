import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, ArrowLeft } from 'lucide-react';

function CustomBlackbodySpectrumInner() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [param1, setParam1] = useState(50);
    const [param2, setParam2] = useState(50);
    const [param3, setParam3] = useState(50);
    const [toggle, setToggle] = useState(false);
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const stateRef = useRef({ time: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const animate = () => {
            if (isPlaying) {
                stateRef.current.time += 0.05;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(10, 10, 26, 0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = 20 + param1 * 0.5;
            
            const x = cx + Math.sin(stateRef.current.time * (param2/50)) * 100;
            const y = cy + Math.cos(stateRef.current.time * (param2/50)) * 100;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = toggle ? '#e74c3c' : `hsl(${param3 * 3.6}, 80%, 60%)`;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            requestRef.current = requestAnimationFrame(animate);
        };
        
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, param1, param2, param3, toggle]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Canvas / Main View centered */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '800px', height: '600px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', background: '#070714' }}>
                    <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
            </div>

            {/* Play/Pause/Reset Floating Control Bar */}
            <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '15px', background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '12px 24px', borderRadius: '100px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isPlaying ? '#e74c3c' : '#2ecc71', border: 'none', padding: '8px 20px', borderRadius: '100px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />} {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={() => { setIsPlaying(false); stateRef.current.time = 0; }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 20px', borderRadius: '100px', color: '#fff', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                    <RotateCcw size={16} /> Reset
                </button>
            </div>

            {/* Control Panels (floating/overlay) */}
            <div style={{ position: 'absolute', top: '90px', right: '20px', width: '300px', background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <Settings2 size={20} color="#3498db" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Simulation Controls</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <label style={{ color: 'rgba(255,255,255,0.8)' }}>Primary Variable</label>
                        <span style={{ color: '#3498db', fontWeight: 'bold' }}>{param1} units</span>
                    </div>
                    <input type="range" min="1" max="100" value={param1} onChange={(e) => setParam1(Number(e.target.value))} style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <label style={{ color: 'rgba(255,255,255,0.8)' }}>Rate / Frequency</label>
                        <span style={{ color: '#3498db', fontWeight: 'bold' }}>{param2} Hz</span>
                    </div>
                    <input type="range" min="1" max="100" value={param2} onChange={(e) => setParam2(Number(e.target.value))} style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <label style={{ color: 'rgba(255,255,255,0.8)' }}>Intensity / Scale</label>
                        <span style={{ color: '#3498db', fontWeight: 'bold' }}>{param3} %</span>
                    </div>
                    <input type="range" min="1" max="100" value={param3} onChange={(e) => setParam3(Number(e.target.value))} style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <label style={{ color: 'rgba(255,255,255,0.8)' }}>Alternative Mode</label>
                        <span style={{ color: '#3498db', fontWeight: 'bold' }}>{toggle ? 'ON' : 'OFF'}</span>
                    </div>
                    <button onClick={() => setToggle(!toggle)} style={{ padding: '10px', background: toggle ? '#3498db' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>Toggle Mode</button>
                </div>
            </div>
        </div>
    );
}

export default function CustomBlackbodySpectrum({ onBack, title }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            <div style={{ height: '80px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    {onBack && (
                        <button onClick={onBack} className="glass-btn">
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                </div>
                <div>
                    <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', margin: 0 }}>
                        {title || 'Blackbody Spectrum MG'}
                    </h2>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    {/* Placeholder for global actions if any */}
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
                 <CustomBlackbodySpectrumInner />
            </div>
        </div>
    );
}
