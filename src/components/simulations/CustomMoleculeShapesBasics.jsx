import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, ArrowLeft } from 'lucide-react';

export default function CustomMoleculeShapesBasics({ onBack, title, isPlaying: globalIsPlaying, syncPlayState }) {
    const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
    const [param1, setParam1] = useState(50);
    const [param2, setParam2] = useState(50);
    const [param3, setParam3] = useState(50);
    const [toggle, setToggle] = useState(false);
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const stateRef = useRef({ time: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const animate = () => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(animate);
      return;
    }
            if (isPlaying) {
                stateRef.current.time += 0.05;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(25, 25, 35, 0.8)';
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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setIsPlaying(!isPlaying)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isPlaying ? '#e74c3c' : '#2ecc71', border: 'none', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button onClick={() => { setIsPlaying(false); stateRef.current.time = 0; }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer' }}>
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', padding: '20px', gap: '20px', overflow: 'hidden' }}>
                <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: '100%', display: 'block', background: '#000' }} />
                </div>

                <div style={{ width: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                        <Settings2 size={20} color="#bf5af2" />
                        <h3 style={{ margin: 0 }}>Simulation Controls</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label>Primary Variable</label>
                            <span>{param1} units</span>
                        </div>
                        <input type="range" min="1" max="100" value={param1} onChange={(e) => setParam1(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label>Rate / Frequency</label>
                            <span>{param2} Hz</span>
                        </div>
                        <input type="range" min="1" max="100" value={param2} onChange={(e) => setParam2(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label>Intensity / Scale</label>
                            <span>{param3} %</span>
                        </div>
                        <input type="range" min="1" max="100" value={param3} onChange={(e) => setParam3(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label>Alternative Mode</label>
                            <span>{toggle ? 'ON' : 'OFF'}</span>
                        </div>
                        <button onClick={() => setToggle(!toggle)} style={{ padding: '10px', background: toggle ? '#bf5af2' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Toggle Mode</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
