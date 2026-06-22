import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind, Atom, ArrowLeft } from 'lucide-react';

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
            posRef.current = { x: 0, y: height };
            velRef.current = { 
                vx: velocity * Math.cos(angle * Math.PI / 180), 
                vy: velocity * Math.sin(angle * Math.PI / 180) 
            };
            accRef.current = { ax: 0, ay: -gravity };
            
            const frameId = requestAnimationFrame(() => {
                setProjectilePos({ x: 0, y: height * scale });
                setVectors({ vx: velRef.current.vx, vy: velRef.current.vy, ax: 0, ay: -gravity });
                setPath([]);
                lastPathPosRef.current = { x: 0, y: height * scale };
            });
            return () => cancelAnimationFrame(frameId);
        }
    }, [velocity, angle, height, gravity, isPlaying]);

    const updatePhysicsRef = useRef();
    useEffect(() => {
        updatePhysicsRef.current = (time) => {
            if (!lastTimeRef.current) {
                lastTimeRef.current = time;
                requestRef.current = requestAnimationFrame(updatePhysicsRef.current);
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

            requestRef.current = requestAnimationFrame(updatePhysicsRef.current);
        };
    });

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(updatePhysicsRef.current);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying]);

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
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden', color: '#fff' }}>
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                zIndex: 10
            }}>
                {null}

                {null}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleReset}
                        style={{
                            background: 'rgba(52, 152, 219, 0.2)',
                            border: '1px solid rgba(52, 152, 219, 0.4)',
                            color: '#3498db',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.2s',
                            fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52, 152, 219, 0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52, 152, 219, 0.2)'; }}
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
            </div>

            {/* Left Control Panel: Display, Playback, and Pause/Launch */}
            <div style={{
                position: 'absolute',
                top: '90px',
                left: '20px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                width: '260px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif"
            }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Display
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}>
                        <input 
                            type="checkbox" 
                            checked={showVelocity} 
                            onChange={(e) => setShowVelocity(e.target.checked)} 
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3498db' }} 
                        />
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Velocity Vector <span style={{ width: '16px', height: '4px', background: '#00f0ff', borderRadius: '2px', display: 'inline-block' }}></span>
                        </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}>
                        <input 
                            type="checkbox" 
                            checked={showAcceleration} 
                            onChange={(e) => setShowAcceleration(e.target.checked)} 
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3498db' }} 
                        />
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Acceleration Vector <span style={{ width: '16px', height: '4px', background: '#ff375f', borderRadius: '2px', display: 'inline-block' }}></span>
                        </span>
                    </label>
                </div>

                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Playback
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}>
                        <input 
                            type="checkbox" 
                            checked={slowMotion} 
                            onChange={(e) => setSlowMotion(e.target.checked)} 
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3498db' }} 
                        />
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                            Slow Motion
                        </span>
                    </label>
                </div>

                <button 
                    onClick={() => {
                        if (!isPlaying && posRef.current.y <= 0 && timeRef.current > 0) handleReset(); 
                        setIsPlaying(!isPlaying);
                    }}
                    style={{
                        background: isPlaying ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                        border: `1px solid ${isPlaying ? 'rgba(231, 76, 60, 0.4)' : 'rgba(46, 204, 113, 0.4)'}`,
                        color: isPlaying ? '#e74c3c' : '#2ecc71',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: '600'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isPlaying ? 'rgba(231, 76, 60, 0.4)' : 'rgba(46, 204, 113, 0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isPlaying ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)'; }}
                >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isPlaying ? 'Pause' : 'Launch'}
                </button>
            </div>

            {/* Right Control Panel: Scrollable parameters */}
            <div style={{
                position: 'absolute',
                top: '90px',
                right: '20px',
                bottom: '20px',
                width: '320px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Parameters
                </h3>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Initial Velocity</label>
                        <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{velocity} m/s</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="40" 
                        value={velocity} 
                        onChange={(e) => setVelocity(Number(e.target.value))} 
                        style={{ width: '100%', accentColor: '#ff9f0a', cursor: 'pointer' }} 
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Launch Angle</label>
                        <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{angle}°</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={angle} 
                        onChange={(e) => setAngle(Number(e.target.value))} 
                        style={{ width: '100%', accentColor: '#ff9f0a', cursor: 'pointer' }} 
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Cannon Height</label>
                        <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{height} m</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="15" 
                        step="1" 
                        value={height} 
                        onChange={(e) => setHeight(Number(e.target.value))} 
                        style={{ width: '100%', accentColor: '#ff9f0a', cursor: 'pointer' }} 
                    />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Mass</label>
                        <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{mass} kg</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="10" 
                        step="0.1" 
                        value={mass} 
                        onChange={(e) => setMass(Number(e.target.value))} 
                        style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} 
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Diameter</label>
                        <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{diameter.toFixed(2)} m</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.05" 
                        value={diameter} 
                        onChange={(e) => setDiameter(Number(e.target.value))} 
                        style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }} 
                    />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                <div>
                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Gravity</label>
                    <select 
                        value={gravity} onChange={(e) => setGravity(Number(e.target.value))}
                        style={{ 
                            width: '100%', 
                            padding: '10px', 
                            borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.05)', 
                            color: '#fff', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            outline: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        <option value="9.81" style={{color: '#000'}}>Earth (9.81 m/s²)</option>
                        <option value="1.62" style={{color: '#000'}}>Moon (1.62 m/s²)</option>
                        <option value="24.79" style={{color: '#000'}}>Jupiter (24.79 m/s²)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}>
                        <input 
                            type="checkbox" 
                            checked={airResistance} 
                            onChange={(e) => setAirResistance(e.target.checked)} 
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3498db' }} 
                        />
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wind size={16} color="#2ecc71" /> Air Resistance
                        </span>
                    </label>

                    {airResistance && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Drag Coefficient (Cd)</label>
                                <span style={{ fontSize: '14px', color: '#2ecc71', fontWeight: 700 }}>{dragCoefficient.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="1.5" 
                                step="0.01" 
                                value={dragCoefficient} 
                                onChange={(e) => setDragCoefficient(Number(e.target.value))} 
                                style={{ width: '100%', accentColor: '#2ecc71', cursor: 'pointer' }} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* SVG Canvas Container */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: '360px', minWidth: '400px', zIndex: 1 }}>
                <svg 
                    viewBox="-400 -1050 2800 1300" 
                    preserveAspectRatio="xMidYMid meet" 
                    style={{ width: '100%', height: '100%', display: 'block' }}
                >
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
        </div>
    );
}
