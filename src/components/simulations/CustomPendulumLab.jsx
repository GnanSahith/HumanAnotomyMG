import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, Atom, ArrowLeft } from 'lucide-react';

export default function CustomPendulumLab({ onBack, title }) {
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Physics Parameters
    const [length, setLength] = useState(100); // cm
    const [mass, setMass] = useState(1); // kg
    const [gravity, setGravity] = useState(9.81); // m/s^2
    const [friction, setFriction] = useState(0.005); // Damping factor

    // State variables for animation
    const thetaRef = useRef(Math.PI / 4); // Initial angle (45 degrees)
    const omegaRef = useRef(0); // Angular velocity
    const lastTimeRef = useRef(0);
    const requestRef = useRef(null);

    // Visual State
    const [bobPos, setBobPos] = useState({ x: 0, y: 0 });

    const updatePhysics = (time) => {
        if (!lastTimeRef.current) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const dt = (time - lastTimeRef.current) / 1000; // Delta time in seconds
        lastTimeRef.current = time;

        // Cap dt to prevent instability if tab is inactive
        const safeDt = Math.min(dt, 0.1);
        
        // Physics Calculation (Euler integration)
        // alpha = -(g/L) * sin(theta)
        // Length in simulation is visually scaled, we treat length state as meters for math
        const L_meters = length / 100; 
        const alpha = -(gravity / L_meters) * Math.sin(thetaRef.current);
        
        omegaRef.current += alpha * safeDt;
        // Apply friction/damping
        omegaRef.current *= (1 - friction); 
        
        thetaRef.current += omegaRef.current * safeDt;

        // Calculate visual position
        // Pivot is at (0, 0) in the SVG coordinate system
        const visualL = length * 1.5; // Scale for visual representation
        setBobPos({
            x: Math.sin(thetaRef.current) * visualL,
            y: Math.cos(thetaRef.current) * visualL
        });

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(updatePhysics);
        } else {
            // Even if paused, we want to update the visual position if parameters change
            const visualL = length * 1.5;
            setBobPos({
                x: Math.sin(thetaRef.current) * visualL,
                y: Math.cos(thetaRef.current) * visualL
            });
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isPlaying, length, gravity, friction]);

    const handleReset = () => {
        setIsPlaying(false);
        thetaRef.current = Math.PI / 4;
        omegaRef.current = 0;
        const visualL = length * 1.5;
        setBobPos({
            x: Math.sin(thetaRef.current) * visualL,
            y: Math.cos(thetaRef.current) * visualL
        });
    };

    const headerButtonStyle = {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    };

    const backButtonStyle = {
        ...headerButtonStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 500
    };

    const actionButtonStyle = {
        ...headerButtonStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 600
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
            <style>{`
                .btn-back-hover:hover {
                    background: rgba(255, 55, 95, 0.8) !important;
                    border-color: #ff375f !important;
                }
                .btn-action-hover:hover {
                    background: rgba(52, 152, 219, 0.4) !important;
                    border-color: #3498db !important;
                }
            `}</style>

            {/* Top Header Bar */}
            <div style={{
                position: 'absolute', top: '20px', left: '20px', right: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                zIndex: 10
            }}>
                {/* Left Side: Back Button */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="btn-back-hover"
                            style={backButtonStyle}
                        >
                            <ArrowLeft size={16} /> Back to Library
                        </button>
                    )}
                </div>

                {/* Center: Title */}
                <h2 style={{
                    color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0
                }}>
                    {title || 'Pendulum Lab MG'}
                </h2>

                {/* Right Side: Action Buttons */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="btn-action-hover"
                        style={actionButtonStyle}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button 
                        onClick={handleReset}
                        className="btn-action-hover"
                        style={actionButtonStyle}
                    >
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            {/* Canvas / SVG Main View */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'auto'
            }}>
                {/* Background Grid for visual context */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundSize: '40px 40px',
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)'
                }}></div>

                <svg viewBox="-200 -50 400 450" preserveAspectRatio="xMidYMin meet" style={{ width: '100%', height: '100%', zIndex: 2 }}>
                    {/* Pivot Mount */}
                    <rect x="-45" y="-15" width="90" height="15" fill="rgba(255,255,255,0.1)" rx="6" />
                    <circle cx="0" cy="0" r="6" fill="#0a84ff" />
                    
                    {/* String */}
                    <line 
                        x1="0" y1="0" 
                        x2={bobPos.x} y2={bobPos.y} 
                        stroke="rgba(255,255,255,0.4)" 
                        strokeWidth="4" 
                    />
                    
                    {/* Bob (Mass) */}
                    <circle 
                        cx={bobPos.x} 
                        cy={bobPos.y} 
                        r={Math.max(15, mass * 25)} // Radius scales visually with mass
                        fill="url(#bobGradient)" 
                        filter="drop-shadow(0 10px 20px rgba(10,132,255,0.4))"
                    />
                    
                    {/* Highlight dot on bob */}
                    <circle cx={bobPos.x - (mass*5)} cy={bobPos.y - (mass*5)} r={Math.max(3, mass * 5)} fill="rgba(255,255,255,0.6)" />

                    <defs>
                        <radialGradient id="bobGradient" cx="30%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#47a1ff" />
                            <stop offset="100%" stopColor="#0a84ff" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>

            {/* Controls Floating Panel */}
            <div style={{
                position: 'absolute', right: '40px', top: '120px', bottom: '40px', width: '320px', overflowY: 'auto',
                background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                padding: '20px', borderRadius: '16px', zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif",
                display: 'flex', flexDirection: 'column', gap: '32px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                    <Settings2 size={20} />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Simulation Parameters</h3>
                </div>

                {/* Length Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>String Length (L)</label>
                        <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{length / 100} m</span>
                    </div>
                    <input 
                        type="range" 
                        min="10" max="200" 
                        value={length} 
                        onChange={(e) => setLength(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }}
                    />
                </div>

                {/* Mass Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Mass (m)</label>
                        <span style={{ fontSize: '14px', color: '#2ecc71', fontWeight: 700 }}>{mass} kg</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" max="3" step="0.1"
                        value={mass} 
                        onChange={(e) => setMass(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#2ecc71', cursor: 'pointer' }}
                    />
                </div>

                {/* Gravity Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Gravity (g)</label>
                        <span style={{ fontSize: '14px', color: '#bf5af2', fontWeight: 700 }}>{gravity} m/s²</span>
                    </div>
                    <select 
                        value={gravity}
                        onChange={(e) => setGravity(Number(e.target.value))}
                        style={{ 
                            width: '100%', padding: '12px', borderRadius: '8px', 
                            background: '#1e1e2f', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)', outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="9.81" style={{background: '#1e1e2f', color: '#fff'}}>Earth (9.81 m/s²)</option>
                        <option value="1.62" style={{background: '#1e1e2f', color: '#fff'}}>Moon (1.62 m/s²)</option>
                        <option value="24.79" style={{background: '#1e1e2f', color: '#fff'}}>Jupiter (24.79 m/s²)</option>
                        <option value="0" style={{background: '#1e1e2f', color: '#fff'}}>Zero Gravity (0 m/s²)</option>
                    </select>
                </div>

                {/* Friction Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Friction (Damping)</label>
                        <span style={{ fontSize: '14px', color: '#ff375f', fontWeight: 700 }}>{(friction * 1000).toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="0.02" step="0.001"
                        value={friction} 
                        onChange={(e) => setFriction(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#ff375f', cursor: 'pointer' }}
                    />
                </div>
                
                <div style={{ marginTop: 'auto', background: 'rgba(52, 152, 219, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#3498db', fontSize: '14px' }}>How it works</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        This simulation computes real-time angular acceleration <span style={{fontFamily: 'monospace'}}>α = -(g/L)sin(θ)</span> natively using React and SVG. 
                    </p>
                </div>
            </div>
        </div>
    );
}
