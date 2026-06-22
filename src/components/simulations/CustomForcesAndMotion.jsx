import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, ArrowLeft } from 'lucide-react';

export default function CustomForcesAndMotion({ onBack, title }) {
    // Core Physics Parameters
    const [mass, setMass] = useState(50); // kg
    const [appliedForce, setAppliedForce] = useState(0); // N
    const [frictionMu, setFrictionMu] = useState(0.2); // Kinetic friction coefficient (0 to 0.5)
    const gravity = 9.8; // m/s^2

    // State Variables (Ref for physics loop)
    const posRef = useRef(0); // meters
    const velRef = useRef(0); // m/s
    const lastTimeRef = useRef(0);
    const requestRef = useRef(null);

    // Visual State
    const [boxX, setBoxX] = useState(0); // This will track ground/background offset instead
    const [velocityVisual, setVelocityVisual] = useState(0);
    const [frictionForceVisual, setFrictionForceVisual] = useState(0);
    const [netForceVisual, setNetForceVisual] = useState(0);

    const updatePhysics = (time) => {
        if (!lastTimeRef.current) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        const safeDt = Math.min(dt, 0.1);

        // Calculate Physics
        const normalForce = mass * gravity;
        let frictionForce = 0;
        
        // Static vs Kinetic friction logic
        if (Math.abs(velRef.current) < 0.01) {
            // Box is basically stationary
            velRef.current = 0;
            const maxStaticFriction = (frictionMu + 0.1) * normalForce; // slightly higher static friction
            
            if (Math.abs(appliedForce) <= maxStaticFriction) {
                // Not enough force to move
                frictionForce = appliedForce; // Static friction opposes perfectly
            } else {
                // Break static friction
                frictionForce = Math.sign(appliedForce) * frictionMu * normalForce;
            }
        } else {
            // Box is moving (kinetic friction)
            frictionForce = Math.sign(velRef.current) * frictionMu * normalForce;
        }

        const netForce = appliedForce - frictionForce;
        const acceleration = netForce / mass;

        velRef.current += acceleration * safeDt;
        
        // Stop completely if very slow and no net force
        if (Math.abs(velRef.current) < 0.05 && Math.abs(netForce) < 0.1) {
            velRef.current = 0;
        }

        posRef.current += velRef.current * safeDt;

        // Update visuals
        setBoxX(posRef.current * 40); // 40px per meter
        setVelocityVisual(velRef.current);
        setFrictionForceVisual(frictionForce);
        setNetForceVisual(netForce);

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    // Run physics infinitely
    useEffect(() => {
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [appliedForce, mass, frictionMu]); // Rebind if parameters change

    const handleReset = () => {
        posRef.current = 0;
        velRef.current = 0;
        setBoxX(0);
        setVelocityVisual(0);
        setAppliedForce(0);
        setFrictionForceVisual(0);
        setNetForceVisual(0);
    };

    // Helper for drawing vectors
    const renderArrow = (x, y, value, color, label, scale = 0.5, textOffset = -16) => {
        if (Math.abs(value) < 1) return null;
        
        const length = value * scale;
        const dir = Math.sign(length);
        const absLength = Math.abs(length);
        const clampedLength = Math.min(Math.max(absLength, 30), 250); // Visual bounds for arrow
        const finalX = x + (dir * clampedLength);

        return (
            <g>
                <line x1={x} y1={y} x2={finalX} y2={y} stroke={color} strokeWidth="4" markerEnd={`url(#arrowhead-${color.replace('#','')})`} />
                <text 
                    x={x + (dir * clampedLength / 2)} 
                    y={y + textOffset} 
                    fill={color} 
                    fontSize="16" 
                    fontWeight="bold" 
                    textAnchor="middle"
                    stroke="#1a1a24"
                    strokeWidth="4"
                    paintOrder="stroke"
                    style={{ userSelect: 'none' }}
                >
                    {label}
                </text>
            </g>
        );
    };

    // Background shift for infinite scroll
    const bgOffset = -(boxX % 40);
    const groundOffset = -(boxX % 200);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
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
                null

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

            {/* Left Panel: Speedometer & Info */}
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
                    Speedometer
                </h3>
                <div style={{ 
                    background: 'rgba(0,0,0,0.5)', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    textAlign: 'center',
                    marginBottom: '20px'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', fontFamily: 'monospace', color: '#00f0ff' }}>
                        {Math.abs(velocityVisual).toFixed(1)} m/s
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: '4px' }}>
                        Speed (v)
                    </div>
                </div>

                <div style={{ background: 'rgba(52, 152, 219, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#3498db', fontSize: '14px', fontWeight: '600' }}>How it works</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        Acceleration is computed based on Newton's Second Law: 
                        <span style={{ fontFamily: 'monospace', display: 'block', margin: '4px 0', color: '#3498db' }}>a = F_net / m</span>
                        Where <span style={{ fontFamily: 'monospace' }}>F_net = F_applied - F_friction</span>.
                    </p>
                </div>
            </div>

            {/* Right Panel: Controls */}
            <div style={{
                position: 'absolute',
                top: '90px',
                right: '20px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                width: '280px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif"
            }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Simulation Parameters
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Applied Force Control */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Applied Force</label>
                            <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{appliedForce} N</span>
                        </div>
                        <input 
                            type="range" 
                            min="-500" max="500" step="10"
                            value={appliedForce} 
                            onChange={(e) => setAppliedForce(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#3498db' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            <span>-500 N</span>
                            <span>0 N</span>
                            <span>500 N</span>
                        </div>
                    </div>

                    {/* Friction Control */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Friction</label>
                            <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{frictionMu > 0 ? 'Active' : 'None'}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="0.5" step="0.1"
                            value={frictionMu} 
                            onChange={(e) => setFrictionMu(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#3498db' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            <span>None</span>
                            <span>Lots</span>
                        </div>
                    </div>

                    {/* Mass Control */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Mass</label>
                            <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{mass} kg</span>
                        </div>
                        <input 
                            type="range" 
                            min="10" max="200" step="10"
                            value={mass} 
                            onChange={(e) => setMass(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#3498db' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            <span>10 kg</span>
                            <span>200 kg</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SVG Canvas Container */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: '360px', minWidth: '400px', zIndex: 1 }}>
                {/* Background Grid - scrolling dynamically */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundSize: '40px 40px',
                    backgroundPosition: `${bgOffset}px 0px`,
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    pointerEvents: 'none'
                }}></div>

                <svg 
                    viewBox="-500 -300 1000 600" 
                    preserveAspectRatio="xMidYMid meet" 
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        width: '100%', 
                        height: '100%', 
                        zIndex: 2, 
                        userSelect: 'none',
                        pointerEvents: 'none'
                    }}
                >
                    <defs>
                        <marker id="arrowhead-ff9f0a" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto">
                            <polygon points="0 0, 3 1.5, 0 3" fill="#ff9f0a" />
                        </marker>
                        <marker id="arrowhead-ff375f" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto">
                            <polygon points="0 0, 3 1.5, 0 3" fill="#ff375f" />
                        </marker>
                        <marker id="arrowhead-30d158" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto">
                            <polygon points="0 0, 3 1.5, 0 3" fill="#30d158" />
                        </marker>
                        <marker id="arrowhead-00f0ff" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto">
                            <polygon points="0 0, 3 1.5, 0 3" fill="#00f0ff" />
                        </marker>

                        <linearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8d6e63" />
                            <stop offset="100%" stopColor="#5d4037" />
                        </linearGradient>

                        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2a2a35" />
                            <stop offset="100%" stopColor="#12121A" />
                        </linearGradient>
                        
                        <pattern id="woodPattern" width="200" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${groundOffset}, 0)`}>
                            <path d="M0 10 Q 50 20 100 10 T 200 10 M0 30 Q 50 40 100 30 T 200 30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                        </pattern>
                    </defs>

                    {/* Infinite Ground */}
                    <g transform="translate(0, 100)">
                        <rect x="-1000" y="0" width="2000" height="400" fill="url(#groundGrad)" />
                        <rect x="-1000" y="0" width="2000" height="400" fill="url(#woodPattern)" />
                        <line x1="-1000" y1="0" x2="1000" y2="0" stroke="#4a4a5e" strokeWidth="8" />
                    </g>

                    {/* Static Camera - Box stays in center */}
                    <g transform="translate(0, 100)">
                        {/* Visual Pushers (always visible, interactive) */}
                        <g 
                            transform="translate(-50, -70)" 
                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                            onClick={() => setAppliedForce(prev => Math.min(prev + 50, 500))}
                        >
                            <path d="M -80 -25 L 0 -15 L 0 15 L -80 25 Z" fill={appliedForce > 0 ? "#ff9f0a" : "rgba(255,159,10,0.3)"} opacity="0.9" />
                            <text x="-40" y="5" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">PUSH &gt;</text>
                        </g>

                        <g 
                            transform="translate(50, -70)" 
                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                            onClick={() => setAppliedForce(prev => Math.max(prev - 50, -500))}
                        >
                            <path d="M 80 -25 L 0 -15 L 0 15 L 80 25 Z" fill={appliedForce < 0 ? "#ff9f0a" : "rgba(255,159,10,0.3)"} opacity="0.9" />
                            <text x="40" y="5" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">&lt; PUSH</text>
                        </g>

                        {/* The Box & Skateboard */}
                        <g transform="translate(0, 0)">
                            {/* Skateboard Wheels (spinning based on position) */}
                            <g transform="translate(-30, -10)">
                                <circle cx="0" cy="0" r="10" fill="#222" stroke="#666" strokeWidth="3" />
                                <line x1="0" y1="-10" x2="0" y2="10" stroke="#888" strokeWidth="2" transform={`rotate(${boxX * 2})`} />
                            </g>
                            <g transform="translate(30, -10)">
                                <circle cx="0" cy="0" r="10" fill="#222" stroke="#666" strokeWidth="3" />
                                <line x1="0" y1="-10" x2="0" y2="10" stroke="#888" strokeWidth="2" transform={`rotate(${boxX * 2})`} />
                            </g>
                            {/* Skateboard Board */}
                            <rect x="-60" y="-20" width="120" height="10" rx="4" fill="#ff375f" />

                            {/* The Crate */}
                            <rect x="-50" y="-120" width="100" height="100" rx="8" fill="url(#boxGrad)" stroke="#4e342e" strokeWidth="4" />
                            <text x="0" y="-55" fill="#fff" fontSize="24" fontWeight="bold" textAnchor="middle">{mass} kg</text>
                            
                            {/* Force Vectors attached to the box */}
                            {/* Applied Force (Orange) */}
                            {renderArrow(0, -160, appliedForce, '#ff9f0a', `Applied: ${Math.round(appliedForce)}N`, 0.4)}
                            
                            {/* Friction Force (Red) */}
                            {renderArrow(0, 15, frictionForceVisual, '#ff375f', `Friction: ${Math.round(frictionForceVisual)}N`, 0.4, 25)}
                            
                            {/* Net Force (Green) */}
                            {renderArrow(0, -220, netForceVisual, '#30d158', `Net: ${Math.round(netForceVisual)}N`, 0.4)}

                            {/* Velocity (Cyan) */}
                            {renderArrow(0, -280, velocityVisual * 20, '#00f0ff', `v: ${velocityVisual.toFixed(1)} m/s`, 1)}
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
}
