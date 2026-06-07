import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, Target, Wind, Crosshair, Atom, ArrowLeft } from 'lucide-react';

export default function CustomProjectileMotion({ onBack, title }) {
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Core Physics Parameters
    const [velocity, setVelocity] = useState(15); // m/s
    const [angle, setAngle] = useState(45); // degrees
    const [gravity, setGravity] = useState(9.81); // m/s^2
    const [height, setHeight] = useState(0); // m
    
    // Advanced Physics Parameters
    const [mass, setMass] = useState(5); // kg
    const [diameter, setDiameter] = useState(0.5); // m
    const [airResistance, setAirResistance] = useState(false);
    const [dragCoefficient, setDragCoefficient] = useState(0.47); // Sphere
    
    // UI/Simulation Toggles
    const [slowMotion, setSlowMotion] = useState(false);
    const [showVelocity, setShowVelocity] = useState(false);
    const [showAcceleration, setShowAcceleration] = useState(false);

    // Engine State
    const timeRef = useRef(0);
    const lastTimeRef = useRef(0);
    const requestRef = useRef(null);
    const lastPathPosRef = useRef({ x: 0, y: 0 });
    
    const posRef = useRef({ x: 0, y: 0 });
    const velRef = useRef({ vx: 0, vy: 0 });
    const accRef = useRef({ ax: 0, ay: 0 });

    // Visual State
    const [projectilePos, setProjectilePos] = useState({ x: 0, y: 0 });
    const [path, setPath] = useState([]); 
    const [vectors, setVectors] = useState({ vx: 0, vy: 0, ax: 0, ay: 0 });

    const scale = 12; // pixels per meter

    const handleReset = () => {
        setIsPlaying(false);
        timeRef.current = 0;
        posRef.current = { x: 0, y: height };
        velRef.current = { 
            vx: velocity * Math.cos(angle * Math.PI / 180), 
            vy: velocity * Math.sin(angle * Math.PI / 180) 
        };
        accRef.current = { ax: 0, ay: -gravity };
        
        setProjectilePos({ x: 0, y: height * scale });
        setVectors({ vx: velRef.current.vx, vy: velRef.current.vy, ax: 0, ay: -gravity });
        setPath([]);
        lastPathPosRef.current = { x: 0, y: height * scale };
    };

    // Update initial position when tweaking launch parameters before firing
    useEffect(() => {
        if (!isPlaying && timeRef.current === 0) {
            handleReset();
        }
    }, [velocity, angle, height, gravity, isPlaying]);

    const updatePhysics = (time) => {
        if (!lastTimeRef.current) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const realDt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const safeDt = Math.min(realDt, 0.1);
        const dt = slowMotion ? safeDt * 0.4 : safeDt * 1.5; 
        
        timeRef.current += dt;

        // Sub-step Euler integration for stability with high drag forces
        const steps = 4;
        const subDt = dt / steps;
        
        for(let i = 0; i < steps; i++) {
            let ax = 0;
            let ay = -gravity;
            
            if (airResistance) {
                const rho = 1.225; // Sea level air density
                const r_m = diameter / 2;
                const A = Math.PI * r_m * r_m;
                const v_mag = Math.hypot(velRef.current.vx, velRef.current.vy);
                if (v_mag > 0.01) {
                    const F_drag = 0.5 * rho * v_mag * v_mag * dragCoefficient * A;
                    const a_drag = F_drag / mass;
                    ax = -a_drag * (velRef.current.vx / v_mag);
                    ay -= a_drag * (velRef.current.vy / v_mag);
                }
            }
            
            velRef.current.vx += ax * subDt;
            velRef.current.vy += ay * subDt;
            posRef.current.x += velRef.current.vx * subDt;
            posRef.current.y += velRef.current.vy * subDt;
            
            accRef.current = { ax, ay };
            
            if (posRef.current.y <= 0) {
                posRef.current.y = 0;
                break;
            }
        }

        const visualX = posRef.current.x * scale;
        const visualY = posRef.current.y * scale; 

        setProjectilePos({ x: visualX, y: visualY });
        setVectors({ 
            vx: velRef.current.vx, vy: velRef.current.vy, 
            ax: accRef.current.ax, ay: accRef.current.ay 
        });
        
        // Record path
        const dx = visualX - lastPathPosRef.current.x;
        const dy = visualY - lastPathPosRef.current.y;
        if (dx * dx + dy * dy > 1600) { 
            lastPathPosRef.current = { x: visualX, y: visualY };
            setPath(prev => [...prev, { x: visualX, y: visualY }]);
        }

        if (posRef.current.y <= 0) {
            setIsPlaying(false);
            return;
        }

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(updatePhysics);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, airResistance, mass, diameter, dragCoefficient, slowMotion, gravity]);

    // Render Helpers for Vectors
    const renderVector = (startX, startY, compX, compY, color, scaleFactor) => {
        const vX = compX * scaleFactor;
        const vY = -compY * scaleFactor; // Invert Y for SVG
        if (Math.hypot(vX, vY) < 1) return null;
        
        const markerId = color === '#00f0ff' ? 'cyan' : 'red';
        return (
            <g>
                <line x1={startX} y1={startY} x2={startX + vX} y2={startY + vY} stroke={color} strokeWidth="6" markerEnd={`url(#arrowhead-${markerId})`} />
            </g>
        );
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '8px', background: 'rgba(191,90,242,0.2)', borderRadius: '12px', border: '1px solid rgba(191,90,242,0.3)' }}>
                        <Atom size={24} color="#bf5af2" />
                    </div>
                    <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600, color: '#fff' }}>{title || 'Projectile Motion MG'}</h2>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                        onClick={() => {
                            if (!isPlaying && posRef.current.y <= 0 && timeRef.current > 0) handleReset(); 
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
                            background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '10px 16px', 
                            borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        <RotateCcw size={18} /> Reset
                    </button>
                    {onBack && (
                        <button 
                            onClick={onBack}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '8px 16px', borderRadius: '100px',
                                color: '#fff', cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: 500,
                                marginLeft: '12px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 55, 95, 0.8)'; e.currentTarget.style.borderColor = '#ff375f'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                        >
                            <ArrowLeft size={16} /> Back to Library
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {/* SVG Canvas */}
                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    
                    <svg viewBox="-400 -1050 2800 1300" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 24, left: 24, width: 'calc(100% - 48px)', height: 'calc(100% - 48px)', zIndex: 2 }}>
                        
                        <defs>
                            <radialGradient id="projectileGradient" cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#ffd23f" />
                                <stop offset="100%" stopColor="#ff9f0a" />
                            </radialGradient>
                            
                            <marker id="arrowhead-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <polygon points="0 0, 6 3, 0 6" fill="#00f0ff" />
                            </marker>
                            <marker id="arrowhead-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <polygon points="0 0, 6 3, 0 6" fill="#ff375f" />
                            </marker>

                            <pattern id="svgGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2"/>
                            </pattern>
                        </defs>

                        {/* Simulation Physical Box (Sky & Ground) */}
                        <clipPath id="simBoxClip">
                            <rect x="-400" y="-1050" width="2800" height="1300" rx="24" />
                        </clipPath>
                        <g clipPath="url(#simBoxClip)">
                            {/* Sky */}
                            <rect x="-400" y="-1050" width="2800" height="1050" fill="#151522" />
                            {/* Sky Grid */}
                            <rect x="-400" y="-1050" width="2800" height="1050" fill="url(#svgGrid)" />
                            
                            {/* Ground */}
                            <rect x="-400" y="0" width="2800" height="250" fill="#132e1b" />
                            {/* Grass line */}
                            <line x1="-400" y1="0" x2="2400" y2="0" stroke="#30d158" strokeWidth="6" />
                        </g>

                        {/* Outer Border Stroke */}
                        <rect x="-400" y="-1050" width="2800" height="1300" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" rx="24" />
                        
                        {/* Target on ground (e.g. at 25m) */}
                        <ellipse cx={25 * scale} cy="0" rx="30" ry="10" fill="rgba(255,55,95,0.3)" stroke="#ff375f" strokeWidth="4" />
                        <ellipse cx={25 * scale} cy="0" rx="10" ry="3" fill="#ff375f" />

                        {/* Pedestal */}
                        {height > 0 && (
                            <rect x="-40" y={-(height * scale)} width="80" height={height * scale} fill="rgba(255,255,255,0.15)" rx="4" />
                        )}

                        {/* Launcher */}
                        <g transform={`translate(0, ${-(height * scale)}) rotate(${-angle})`}>
                            <rect x="-30" y="-30" width="130" height="60" fill="rgba(255,255,255,0.1)" rx="12" />
                            <circle cx="0" cy="0" r="38" fill="var(--accent)" />
                        </g>

                        {/* Trail */}
                        {path.map((p, i) => {
                            const progress = i / path.length;
                            return (
                                <g key={i}>
                                    <circle cx={p.x} cy={-p.y} r="24" fill={`rgba(0, 240, 255, ${0.05 + progress * 0.25})`} />
                                    <circle cx={p.x} cy={-p.y} r="6" fill={`rgba(255, 255, 255, ${0.2 + progress * 0.8})`} />
                                </g>
                            );
                        })}
                        
                        {/* Vectors */}
                        {showVelocity && renderVector(projectilePos.x, -projectilePos.y, vectors.vx, vectors.vy, '#00f0ff', 4)}
                        {showAcceleration && renderVector(projectilePos.x, -projectilePos.y, vectors.ax, vectors.ay, '#ff375f', 12)}

                        {/* Projectile */}
                        <circle 
                            cx={projectilePos.x} 
                            cy={-projectilePos.y}
                            r={Math.max(20, diameter * 50)} // Scale visual radius slightly by diameter
                            fill="url(#projectileGradient)" 
                            filter="drop-shadow(0 0 10px rgba(255,159,10,0.6))"
                        />
                        <circle cx={projectilePos.x - 8} cy={-projectilePos.y - 8} r="8" fill="rgba(255,255,255,0.6)" />
                    </svg>

                </div>

                {/* Controls Sidebar - Now Scrollable */}
                <div style={{
                    width: '340px', background: 'rgba(0,0,0,0.3)', borderLeft: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Simulation Parameters</h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Initial Launch Parameters */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Initial Velocity (v)</label>
                                    <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{velocity} m/s</span>
                                </div>
                                <input type="range" min="0" max="40" value={velocity} onChange={(e) => setVelocity(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff9f0a' }} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Launch Angle (θ)</label>
                                    <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{angle}°</span>
                                </div>
                                <input type="range" min="0" max="90" value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff9f0a' }} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Cannon Height (h)</label>
                                    <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{height} m</span>
                                </div>
                                <input type="range" min="0" max="15" step="1" value={height} onChange={(e) => setHeight(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff9f0a' }} />
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                        {/* Object Properties */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Mass</label>
                                    <span style={{ fontSize: '14px', color: '#0a84ff', fontWeight: 700 }}>{mass} kg</span>
                                </div>
                                <input type="range" min="0.1" max="10" step="0.1" value={mass} onChange={(e) => setMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#0a84ff' }} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Diameter</label>
                                    <span style={{ fontSize: '14px', color: '#0a84ff', fontWeight: 700 }}>{diameter.toFixed(2)} m</span>
                                </div>
                                <input type="range" min="0.1" max="1.0" step="0.05" value={diameter} onChange={(e) => setDiameter(Number(e.target.value))} style={{ width: '100%', accentColor: '#0a84ff' }} />
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                        {/* Environment & Forces */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Gravity</label>
                                    <span style={{ fontSize: '14px', color: '#30d158', fontWeight: 700 }}>{gravity} m/s²</span>
                                </div>
                                <select 
                                    value={gravity} onChange={(e) => setGravity(Number(e.target.value))}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                                >
                                    <option value="9.81" style={{color: '#000'}}>Earth (9.81 m/s²)</option>
                                    <option value="1.62" style={{color: '#000'}}>Moon (1.62 m/s²)</option>
                                    <option value="24.79" style={{color: '#000'}}>Jupiter (24.79 m/s²)</option>
                                </select>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={airResistance} onChange={(e) => setAirResistance(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Wind size={16} color="#30d158" /> Air Resistance
                                </span>
                            </label>
                            
                            {airResistance && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Drag Coefficient (Cd)</label>
                                        <span style={{ fontSize: '14px', color: '#30d158', fontWeight: 700 }}>{dragCoefficient.toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0.1" max="1.5" step="0.01" value={dragCoefficient} onChange={(e) => setDragCoefficient(Number(e.target.value))} style={{ width: '100%', accentColor: '#30d158' }} />
                                </div>
                            )}
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                        {/* Visuals & Playback */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showVelocity} onChange={(e) => setShowVelocity(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '14px', color: '#00f0ff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Crosshair size={16} /> Velocity Vector
                                </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showAcceleration} onChange={(e) => setShowAcceleration(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '14px', color: '#ff375f', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Crosshair size={16} /> Acceleration Vector
                                </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '8px' }}>
                                <input type="checkbox" checked={slowMotion} onChange={(e) => setSlowMotion(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>🐢 Slow Motion Playback</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
