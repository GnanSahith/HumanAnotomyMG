import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';

export default function CustomProjectileMotion() {
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Physics Parameters
    const [velocity, setVelocity] = useState(15); // m/s
    const [angle, setAngle] = useState(45); // degrees
    const [gravity, setGravity] = useState(9.81); // m/s^2

    // State variables for animation
    const timeRef = useRef(0);
    const lastTimeRef = useRef(0);
    const requestRef = useRef(null);

    // Visual State
    const [projectilePos, setProjectilePos] = useState({ x: 0, y: 0 });
    const [path, setPath] = useState([]); // Array of {x, y} to draw the trail

    const updatePhysics = (time) => {
        if (!lastTimeRef.current) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const dt = (time - lastTimeRef.current) / 1000; // Delta time in seconds
        lastTimeRef.current = time;

        const safeDt = Math.min(dt, 0.1);
        timeRef.current += safeDt;

        const thetaRad = (angle * Math.PI) / 180;
        
        // Equations of motion
        // x = v * cos(theta) * t
        // y = v * sin(theta) * t - 0.5 * g * t^2
        const t = timeRef.current * 2; // Time scale factor for better visual speed
        const xPos = velocity * Math.cos(thetaRad) * t;
        const yPos = (velocity * Math.sin(thetaRad) * t) - (0.5 * gravity * t * t);

        // Visual scale
        const scale = 12; // pixels per meter
        const visualX = xPos * scale;
        const visualY = yPos * scale; // In SVG, up is negative, we'll invert it in the SVG coordinate system

        setProjectilePos({ x: visualX, y: visualY });
        
        // Add to path trace every few frames to save memory
        if (Math.random() > 0.5) {
            setPath(prev => [...prev, { x: visualX, y: visualY }]);
        }

        // Stop if it hits the ground (y < 0)
        if (yPos < 0 && t > 0.1) {
            setIsPlaying(false);
            setProjectilePos({ x: visualX, y: 0 });
            return;
        }

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(updatePhysics);
        } else {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isPlaying, velocity, angle, gravity]);

    const handleReset = () => {
        setIsPlaying(false);
        timeRef.current = 0;
        setProjectilePos({ x: 0, y: 0 });
        setPath([]);
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
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--accent)' }}>Projectile Motion MG</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Interactive Physics Engine (Custom Build)</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => {
                            if (!isPlaying && projectilePos.y <= 0 && timeRef.current > 0) {
                                handleReset(); // auto reset if it hit the ground already
                            }
                            setIsPlaying(!isPlaying);
                        }}
                        style={{
                            background: isPlaying ? 'rgba(255,55,95,0.2)' : 'rgba(10,132,255,0.2)',
                            color: isPlaying ? '#ff375f' : '#0a84ff',
                            border: 'none', padding: '10px 20px', borderRadius: '100px',
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            fontWeight: 600, transition: 'all 0.2s'
                        }}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        {isPlaying ? 'Pause' : 'Launch'}
                    </button>
                    <button 
                        onClick={handleReset}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            border: 'none', padding: '10px 16px', borderRadius: '100px',
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            fontWeight: 600, transition: 'all 0.2s'
                        }}
                    >
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* SVG Canvas Area */}
                <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    {/* Background Grid for visual context */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundSize: '40px 40px',
                        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)'
                    }}></div>

                    <svg width="100%" height="100%" viewBox="-100 -500 900 700" preserveAspectRatio="xMidYMid meet" style={{ position: 'relative', zIndex: 2 }}>
                        {/* Ground */}
                        <line x1="-50" y1="0" x2="800" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                        
                        {/* Launcher (Cannon visual) */}
                        <g transform={`translate(0, 0) rotate(${-angle})`}>
                            <rect x="-10" y="-10" width="40" height="20" fill="rgba(255,255,255,0.1)" rx="4" />
                            <circle cx="0" cy="0" r="12" fill="var(--accent)" />
                        </g>

                        {/* Trail */}
                        {path.map((p, i) => (
                            <circle key={i} cx={p.x} cy={-p.y} r="2" fill="rgba(10,132,255,0.4)" />
                        ))}
                        
                        {/* Projectile */}
                        <circle 
                            cx={projectilePos.x} 
                            cy={-projectilePos.y} // SVG y-axis is inverted (0 is top)
                            r="10" 
                            fill="url(#projectileGradient)" 
                            filter="drop-shadow(0 0 10px rgba(255,159,10,0.6))"
                        />
                        
                        <defs>
                            <radialGradient id="projectileGradient" cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#ffd60a" />
                                <stop offset="100%" stopColor="#ff9f0a" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>

                {/* Controls Sidebar */}
                <div style={{
                    width: '320px', background: 'rgba(0,0,0,0.3)',
                    borderLeft: '1px solid rgba(255,255,255,0.05)',
                    padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                        <Settings2 size={20} />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Simulation Parameters</h3>
                    </div>

                    {/* Velocity Control */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Initial Velocity (v)</label>
                            <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{velocity} m/s</span>
                        </div>
                        <input 
                            type="range" 
                            min="5" max="40" 
                            value={velocity} 
                            onChange={(e) => { setVelocity(Number(e.target.value)); handleReset(); }}
                            style={{ width: '100%', accentColor: '#ff9f0a' }}
                        />
                    </div>

                    {/* Angle Control */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Launch Angle (θ)</label>
                            <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{angle}°</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="90" 
                            value={angle} 
                            onChange={(e) => { setAngle(Number(e.target.value)); handleReset(); }}
                            style={{ width: '100%', accentColor: '#ff9f0a' }}
                        />
                    </div>

                    {/* Gravity Control */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Gravity (g)</label>
                            <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{gravity} m/s²</span>
                        </div>
                        <select 
                            value={gravity}
                            onChange={(e) => { setGravity(Number(e.target.value)); handleReset(); }}
                            style={{ 
                                width: '100%', padding: '12px', borderRadius: '8px', 
                                background: 'rgba(255,255,255,0.05)', color: '#fff',
                                border: '1px solid rgba(255,255,255,0.1)', outline: 'none'
                            }}
                        >
                            <option value="9.81" style={{color: '#000'}}>Earth (9.81 m/s²)</option>
                            <option value="1.62" style={{color: '#000'}}>Moon (1.62 m/s²)</option>
                            <option value="24.79" style={{color: '#000'}}>Jupiter (24.79 m/s²)</option>
                        </select>
                    </div>

                    <div style={{ marginTop: 'auto', background: 'rgba(255,159,10,0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,159,10,0.2)' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#ff9f0a', fontSize: '14px' }}>Kinematics</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                            <span style={{fontFamily: 'monospace'}}>x = v·cos(θ)t</span><br/>
                            <span style={{fontFamily: 'monospace'}}>y = v·sin(θ)t - ½gt²</span>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
