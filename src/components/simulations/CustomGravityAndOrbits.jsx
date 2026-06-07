import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const CustomGravityAndOrbits = ({ onBack, title }) => {
    // We maintain state for UI sliders
    const [starMass, setStarMass] = useState(330000); // Earth masses (Sun is approx 333,000x Earth)
    const [planetMass, setPlanetMass] = useState(1); // Earth mass
    const [gravityEnabled, setGravityEnabled] = useState(true);
    
    const requestRef = useRef();
    const canvasRef = useRef(null);

    // Physics state kept in ref to avoid re-renders during the loop
    const stateRef = useRef({
        G: 0.1, // Adjusted gravitational constant for visual scale
        dt: 0.1,
        star: {
            x: 0, 
            y: 0, 
            mass: 330000, 
            radius: 40,
            color: '#FFCC00'
        },
        planet: {
            x: 250, 
            y: 0,
            vx: 0,
            vy: 8, // initial velocity tangent to star
            mass: 1,
            radius: 15,
            color: '#3498db',
            path: [] // Store previous positions to draw the orbit path
        }
    });

    // Handle resetting the simulation
    const handleReset = () => {
        stateRef.current.planet = {
            x: 250, 
            y: 0,
            vx: 0,
            vy: 8,
            mass: planetMass,
            radius: 15,
            color: '#3498db',
            path: []
        };
        stateRef.current.star.mass = starMass;
    };

    // Update stateRef when UI sliders change
    useEffect(() => {
        stateRef.current.star.mass = starMass;
    }, [starMass]);

    useEffect(() => {
        stateRef.current.planet.mass = planetMass;
    }, [planetMass]);

    const updatePhysics = () => {
        const state = stateRef.current;
        const star = state.star;
        const planet = state.planet;

        if (gravityEnabled) {
            // Calculate distance
            const dx = star.x - planet.x;
            const dy = star.y - planet.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // Avoid division by zero or super extreme forces
            if (dist > star.radius + planet.radius) {
                // F = G * M1 * M2 / r^2
                // a = F / m = G * M1 / r^2  (acceleration doesn't depend on planet mass)
                const acceleration = (state.G * star.mass) / distSq;
                
                const ax = acceleration * (dx / dist);
                const ay = acceleration * (dy / dist);

                planet.vx += ax * state.dt;
                planet.vy += ay * state.dt;
            } else {
                // Collision! Let's just bounce or absorb? For orbit sim, maybe just inelastic stop
                planet.vx = 0;
                planet.vy = 0;
            }
        }

        // Update position
        planet.x += planet.vx * state.dt;
        planet.y += planet.vy * state.dt;

        // Add to path trace (throttle it to every few frames to save performance)
        if (state.planet.path.length === 0 || 
            Math.abs(state.planet.path[state.planet.path.length - 1].x - planet.x) > 2 ||
            Math.abs(state.planet.path[state.planet.path.length - 1].y - planet.y) > 2) {
            
            state.planet.path.push({ x: planet.x, y: planet.y });
            // Limit path length
            if (state.planet.path.length > 500) {
                state.planet.path.shift();
            }
        }
    };

    const draw = (ctx, width, height) => {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Translate to center
        ctx.save();
        ctx.translate(width / 2, height / 2);

        const state = stateRef.current;
        
        // Draw path
        if (state.planet.path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(state.planet.path[0].x, state.planet.path[0].y);
            for (let i = 1; i < state.planet.path.length; i++) {
                ctx.lineTo(state.planet.path[i].x, state.planet.path[i].y);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw Star
        ctx.beginPath();
        ctx.arc(state.star.x, state.star.y, state.star.radius, 0, Math.PI * 2);
        ctx.fillStyle = state.star.color;
        // Add a glow
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#FFCC00';
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw Planet
        ctx.beginPath();
        ctx.arc(state.planet.x, state.planet.y, state.planet.radius, 0, Math.PI * 2);
        ctx.fillStyle = state.planet.color;
        ctx.fill();

        // Draw Force Vector (Gravity)
        if (gravityEnabled) {
            const dx = state.star.x - state.planet.x;
            const dy = state.star.y - state.planet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > state.star.radius + state.planet.radius) {
                const forceMag = (state.G * state.star.mass * state.planet.mass) / (dist * dist);
                // Scale force for visual length
                const arrowLength = Math.min(100, forceMag * 5); 
                
                ctx.beginPath();
                ctx.moveTo(state.planet.x, state.planet.y);
                const endX = state.planet.x + (dx / dist) * arrowLength;
                const endY = state.planet.y + (dy / dist) * arrowLength;
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Arrow head
                ctx.beginPath();
                const angle = Math.atan2(dy, dx);
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX - 10 * Math.cos(angle - Math.PI / 6), endY - 10 * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(endX - 10 * Math.cos(angle + Math.PI / 6), endY - 10 * Math.sin(angle + Math.PI / 6));
                ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
                ctx.fill();
            }
        }

        // Draw Velocity Vector
        ctx.beginPath();
        ctx.moveTo(state.planet.x, state.planet.y);
        const vLength = Math.sqrt(state.planet.vx * state.planet.vx + state.planet.vy * state.planet.vy);
        const scale = 5; // velocity scale
        const vEndX = state.planet.x + state.planet.vx * scale;
        const vEndY = state.planet.y + state.planet.vy * scale;
        ctx.lineTo(vEndX, vEndY);
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Velocity arrow head
        ctx.beginPath();
        const vAngle = Math.atan2(state.planet.vy, state.planet.vx);
        ctx.moveTo(vEndX, vEndY);
        ctx.lineTo(vEndX - 10 * Math.cos(vAngle - Math.PI / 6), vEndY - 10 * Math.sin(vAngle - Math.PI / 6));
        ctx.lineTo(vEndX - 10 * Math.cos(vAngle + Math.PI / 6), vEndY - 10 * Math.sin(vAngle + Math.PI / 6));
        ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
        ctx.fill();

        ctx.restore();
    };

    // Animation Loop
    const animate = () => {
        updatePhysics();
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Handle DPI scaling
            const rect = canvas.getBoundingClientRect();
            if (canvas.width !== rect.width * window.devicePixelRatio || canvas.height !== rect.height * window.devicePixelRatio) {
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = rect.height * window.devicePixelRatio;
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            }

            draw(ctx, rect.width, rect.height);
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gravityEnabled]); // Re-bind if gravity changes

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a' }}>
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
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
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 55, 95, 0.8)'; e.currentTarget.style.borderColor = '#ff375f'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                >
                    <ArrowLeft size={16} /> Back to Library
                </button>

                <h2 style={{
                    margin: 0,
                    color: 'white',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '24px',
                    fontWeight: '600',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>{title}</h2>

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

            {/* Controls Panel */}
            <div style={{
                position: 'absolute',
                top: '90px',
                right: '20px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                width: '300px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif"
            }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Orbital Properties
                </h3>

                {/* Star Mass */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Star Mass</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{starMass.toLocaleString()} Earths</span>
                    </div>
                    <input 
                        type="range" 
                        min="10000" 
                        max="600000" 
                        step="10000"
                        value={starMass} 
                        onChange={(e) => setStarMass(parseInt(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#f1c40f' }} 
                    />
                </div>

                {/* Planet Mass */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Planet Mass</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{planetMass} Earths</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="10" 
                        step="0.1"
                        value={planetMass} 
                        onChange={(e) => setPlanetMass(parseFloat(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#3498db' }} 
                    />
                </div>

                {/* Gravity Toggle */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }} onClick={() => setGravityEnabled(!gravityEnabled)}>
                    <div style={{ 
                        width: '40px', 
                        height: '24px', 
                        background: gravityEnabled ? '#2ecc71' : 'rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        position: 'relative',
                        transition: 'background 0.3s'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '2px',
                            left: gravityEnabled ? '18px' : '2px',
                            width: '20px',
                            height: '20px',
                            background: 'white',
                            borderRadius: '50%',
                            transition: 'left 0.3s'
                        }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Gravity {gravityEnabled ? 'ON' : 'OFF'}</span>
                </div>

                {/* Legend */}
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        <div style={{ width: '12px', height: '3px', background: 'rgba(231, 76, 60, 0.8)' }}></div>
                        Gravity Force
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        <div style={{ width: '12px', height: '3px', background: 'rgba(46, 204, 113, 0.8)' }}></div>
                        Velocity
                    </div>
                </div>
            </div>

            {/* Canvas Container */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <canvas 
                    ref={canvasRef}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                />
            </div>
        </div>
    );
};

export default CustomGravityAndOrbits;
