import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Play, Pause, FastForward } from 'lucide-react';

const SCENARIOS = {
    SUN_EARTH: 'sun_earth',
    SUN_EARTH_MOON: 'sun_earth_moon',
    EARTH_MOON: 'earth_moon',
    EARTH_SATELLITE: 'earth_satellite'
};

// Physics constants tuned for visual pleasure rather than strict realism.
// Velocities are adjusted to create stable circular/elliptical orbits.
const INITIAL_STATES = {
    [SCENARIOS.SUN_EARTH]: {
        bodies: [
            { id: 'sun', label: 'Sun', x: 0, y: 0, vx: 0, vy: 0, mass: 333000, radius: 35, color: '#f1c40f', fixed: true, path: [] },
            { id: 'earth', label: 'Earth', x: 200, y: 0, vx: 0, vy: 8.16, mass: 1, radius: 12, color: '#3498db', fixed: false, path: [] }
        ],
        G: 0.0002,
        timeScale: 1,
        daysPerTick: 0.5
    },
    [SCENARIOS.SUN_EARTH_MOON]: {
        bodies: [
            { id: 'sun', label: 'Sun', x: 0, y: 0, vx: 0, vy: 0, mass: 333000, radius: 35, color: '#f1c40f', fixed: true, path: [] },
            { id: 'earth', label: 'Earth', x: 200, y: 0, vx: 0, vy: 8.16, mass: 1000, radius: 12, color: '#3498db', fixed: false, path: [] },
            { id: 'moon', label: 'Moon', x: 230, y: 0, vx: 0, vy: 10.74, mass: 10, radius: 5, color: '#bdc3c7', fixed: false, path: [] }
        ],
        G: 0.0002,
        timeScale: 1,
        daysPerTick: 0.5
    },
    [SCENARIOS.EARTH_MOON]: {
        bodies: [
            { id: 'earth', label: 'Earth', x: 0, y: 0, vx: 0, vy: 0, mass: 100000, radius: 35, color: '#3498db', fixed: true, path: [] },
            { id: 'moon', label: 'Moon', x: 150, y: 0, vx: 0, vy: 11.5, mass: 1200, radius: 10, color: '#bdc3c7', fixed: false, path: [] }
        ],
        G: 0.00133,
        timeScale: 1,
        daysPerTick: 0.1
    },
    [SCENARIOS.EARTH_SATELLITE]: {
        bodies: [
            { id: 'earth', label: 'Earth', x: 0, y: 0, vx: 0, vy: 0, mass: 100000, radius: 35, color: '#3498db', fixed: true, path: [] },
            { id: 'satellite', label: 'Satellite', x: 100, y: 0, vx: 0, vy: 16.3, mass: 1, radius: 6, color: '#e74c3c', fixed: false, path: [] }
        ],
        G: 0.00266,
        timeScale: 1,
        daysPerTick: 0.05
    }
};

const CustomGravityAndOrbits = ({ onBack, title }) => {
    const [scenario, setScenario] = useState(SCENARIOS.SUN_EARTH);
    const [gravityEnabled, setGravityEnabled] = useState(true);
    
    // Toggles
    const [showGravityForce, setShowGravityForce] = useState(true);
    const [showVelocity, setShowVelocity] = useState(false);
    const [showPath, setShowPath] = useState(true);
    const [showGrid, setShowGrid] = useState(false);

    // Controls
    const [isPlaying, setIsPlaying] = useState(true);
    const [isFastForward, setIsFastForward] = useState(false);
    const [daysPassed, setDaysPassed] = useState(0);

    const requestRef = useRef();
    const canvasRef = useRef(null);
    const stateRef = useRef({ ...JSON.parse(JSON.stringify(INITIAL_STATES[SCENARIOS.SUN_EARTH])) });

    // Handle resetting the simulation
    const handleReset = () => {
        stateRef.current = JSON.parse(JSON.stringify(INITIAL_STATES[scenario]));
        setDaysPassed(0);
        setIsPlaying(true);
    };

    // Change scenario
    useEffect(() => {
        handleReset();
    }, [scenario]);

    const updatePhysics = () => {
        if (!isPlaying) return;

        const state = stateRef.current;
        const bodies = state.bodies;
        
        // Number of substeps for physics accuracy (especially important for 3-body)
        const substeps = isFastForward ? 20 : 5;
        const dt = 1.0 / substeps;

        for (let step = 0; step < substeps; step++) {
            // 1. Calculate forces/accelerations for all bodies
            const accelerations = bodies.map(() => ({ ax: 0, ay: 0 }));

            if (gravityEnabled) {
                for (let i = 0; i < bodies.length; i++) {
                    for (let j = i + 1; j < bodies.length; j++) {
                        const b1 = bodies[i];
                        const b2 = bodies[j];

                        const dx = b2.x - b1.x;
                        const dy = b2.y - b1.y;
                        const distSq = dx * dx + dy * dy;
                        const dist = Math.sqrt(distSq);

                        if (dist > (b1.radius + b2.radius) * 0.1) { // Avoid infinite force at singularity
                            const forceMag = state.G * (b1.mass * b2.mass) / distSq;
                            
                            const fx = forceMag * (dx / dist);
                            const fy = forceMag * (dy / dist);

                            accelerations[i].ax += fx / b1.mass;
                            accelerations[i].ay += fy / b1.mass;
                            
                            accelerations[j].ax -= fx / b2.mass;
                            accelerations[j].ay -= fy / b2.mass;
                        }
                    }
                }
            }

            // 2. Update velocities and positions
            for (let i = 0; i < bodies.length; i++) {
                if (!bodies[i].fixed) {
                    bodies[i].vx += accelerations[i].ax * dt;
                    bodies[i].vy += accelerations[i].ay * dt;
                    
                    bodies[i].x += bodies[i].vx * dt;
                    bodies[i].y += bodies[i].vy * dt;
                }
            }
        }

        // Add to path trace (throttle it to save performance)
        bodies.forEach(b => {
            if (!b.fixed && showPath) {
                if (b.path.length === 0 || 
                    Math.abs(b.path[b.path.length - 1].x - b.x) > 2 ||
                    Math.abs(b.path[b.path.length - 1].y - b.y) > 2) {
                    
                    b.path.push({ x: b.x, y: b.y });
                    if (b.path.length > 300) {
                        b.path.shift();
                    }
                }
            } else if (!showPath && b.path.length > 0) {
                b.path = []; // clear path if turned off
            }
        });

        setDaysPassed(prev => prev + state.daysPerTick * (isFastForward ? 4 : 1));
    };

    const draw = (ctx, width, height) => {
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(width / 2, height / 2);

        const state = stateRef.current;
        const bodies = state.bodies;

        // Draw Grid
        if (showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            const step = 50;
            ctx.beginPath();
            for (let x = -width/2; x < width/2; x += step) {
                ctx.moveTo(x, -height/2);
                ctx.lineTo(x, height/2);
            }
            for (let y = -height/2; y < height/2; y += step) {
                ctx.moveTo(-width/2, y);
                ctx.lineTo(width/2, y);
            }
            ctx.stroke();
        }

        // Draw paths
        if (showPath) {
            bodies.forEach(b => {
                if (b.path.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(b.path[0].x, b.path[0].y);
                    for (let i = 1; i < b.path.length; i++) {
                        ctx.lineTo(b.path[i].x, b.path[i].y);
                    }
                    ctx.strokeStyle = b.color;
                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            });
        }

        // Draw Bodies
        bodies.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.color;
            if (b.id === 'sun') {
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#FFCC00';
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw label
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, b.x, b.y + b.radius + 15);
        });

        // Draw Vectors
        bodies.forEach((b1, i) => {
            if (b1.fixed) return;

            // Gravity Force Vector
            if (showGravityForce && gravityEnabled) {
                // Calculate net force vector
                let netFx = 0, netFy = 0;
                bodies.forEach((b2, j) => {
                    if (i !== j) {
                        const dx = b2.x - b1.x;
                        const dy = b2.y - b1.y;
                        const distSq = dx * dx + dy * dy;
                        const dist = Math.sqrt(distSq);
                        if (dist > 0) {
                            const forceMag = state.G * (b1.mass * b2.mass) / distSq;
                            netFx += forceMag * (dx / dist);
                            netFy += forceMag * (dy / dist);
                        }
                    }
                });

                const forceMag = Math.sqrt(netFx*netFx + netFy*netFy);
                if (forceMag > 0) {
                    const arrowLength = Math.min(100, Math.max(30, forceMag * (scenario === SCENARIOS.SUN_EARTH_MOON ? 50 : 200)));
                    const endX = b1.x + (netFx / forceMag) * arrowLength;
                    const endY = b1.y + (netFy / forceMag) * arrowLength;
                    
                    ctx.beginPath();
                    ctx.moveTo(b1.x, b1.y);
                    ctx.lineTo(endX, endY);
                    ctx.strokeStyle = 'rgba(231, 76, 60, 0.9)'; // Red
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    // Arrow head
                    ctx.beginPath();
                    const angle = Math.atan2(netFy, netFx);
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - 8 * Math.cos(angle - Math.PI / 6), endY - 8 * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(endX - 8 * Math.cos(angle + Math.PI / 6), endY - 8 * Math.sin(angle + Math.PI / 6));
                    ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
                    ctx.fill();
                }
            }

            // Velocity Vector
            if (showVelocity) {
                const vMag = Math.sqrt(b1.vx * b1.vx + b1.vy * b1.vy);
                if (vMag > 0.1) {
                    const scale = (scenario === SCENARIOS.SUN_EARTH_MOON && b1.id === 'moon') ? 3 : 5;
                    const endX = b1.x + b1.vx * scale;
                    const endY = b1.y + b1.vy * scale;

                    ctx.beginPath();
                    ctx.moveTo(b1.x, b1.y);
                    ctx.lineTo(endX, endY);
                    ctx.strokeStyle = 'rgba(46, 204, 113, 0.9)'; // Green
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                    
                    // Arrow head
                    ctx.beginPath();
                    const angle = Math.atan2(b1.vy, b1.vx);
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - 8 * Math.cos(angle - Math.PI / 6), endY - 8 * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(endX - 8 * Math.cos(angle + Math.PI / 6), endY - 8 * Math.sin(angle + Math.PI / 6));
                    ctx.fillStyle = 'rgba(46, 204, 113, 0.9)';
                    ctx.fill();
                }
            }
        });

        ctx.restore();
    };

    const handlePointerDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const bodies = stateRef.current.bodies;
        // Check backwards to grab the top-most drawn body if they overlap
        for (let i = bodies.length - 1; i >= 0; i--) {
            const b = bodies[i];
            const dx = mouseX - b.x;
            const dy = mouseY - b.y;
            // Increase grab radius slightly to make grabbing easier
            if (dx * dx + dy * dy <= (b.radius + 10) * (b.radius + 10)) {
                stateRef.current.draggingId = b.id;
                // Temporarily pause physics if dragging so it doesn't fight the user
                setIsPlaying(false);
                break;
            }
        }
    };

    const handlePointerMove = (e) => {
        if (!stateRef.current.draggingId) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const body = stateRef.current.bodies.find(b => b.id === stateRef.current.draggingId);
        if (body) {
            body.x = mouseX;
            body.y = mouseY;
            // Clear path since it teleported
            body.path = [];
            // If dragging the earth, maybe clear the moon's path too to avoid weird lines
            if (body.id === 'earth') {
                stateRef.current.bodies.forEach(b => { if (b.id !== 'sun') b.path = []; });
            }
        }
    };

    const handlePointerUp = () => {
        if (stateRef.current.draggingId) {
            stateRef.current.draggingId = null;
            // Resume if it was playing
            setIsPlaying(true);
        }
    };

    // Animation Loop
    const animate = () => {
        updatePhysics();
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
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
    }, [isPlaying, isFastForward, gravityEnabled, showPath, showGravityForce, showVelocity, showGrid, scenario]);

    // UI Helper Components
    const CheckboxItem = ({ label, checked, onChange, colorIndicator }) => (
        <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            padding: '4px 0'
        }}>
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)} 
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3498db' }}
            />
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {label}
                {colorIndicator && (
                    <span style={{ width: '16px', height: '4px', background: colorIndicator, borderRadius: '2px', display: 'inline-block' }}></span>
                )}
            </span>
        </label>
    );

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

            {/* Left Panel: Toggles and Time */}
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
                    <CheckboxItem label="Gravity Force" checked={showGravityForce} onChange={setShowGravityForce} colorIndicator="rgba(231, 76, 60, 0.9)" />
                    <CheckboxItem label="Velocity" checked={showVelocity} onChange={setShowVelocity} colorIndicator="rgba(46, 204, 113, 0.9)" />
                    <CheckboxItem label="Path" checked={showPath} onChange={setShowPath} />
                    <CheckboxItem label="Grid" checked={showGrid} onChange={setShowGrid} />
                </div>

                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Simulation Time
                </h3>
                <div style={{ 
                    background: 'rgba(0,0,0,0.5)', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    textAlign: 'center',
                    marginBottom: '15px'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', fontFamily: 'monospace' }}>
                        {Math.floor(daysPassed)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Earth Days</div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => { setIsPlaying(!isPlaying); setIsFastForward(false); }}
                        style={{
                            background: isPlaying && !isFastForward ? '#3498db' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                        {isPlaying && !isFastForward ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button 
                        onClick={() => { setIsPlaying(true); setIsFastForward(true); }}
                        style={{
                            background: isFastForward ? '#f1c40f' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                        <FastForward size={20} />
                    </button>
                </div>
            </div>

            {/* Right Panel: Scenarios */}
            <div style={{
                position: 'absolute',
                top: '90px',
                right: '20px',
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
                    Scenarios
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {[
                        { id: SCENARIOS.SUN_EARTH, label: 'Sun and Earth' },
                        { id: SCENARIOS.SUN_EARTH_MOON, label: 'Sun, Earth, and Moon' },
                        { id: SCENARIOS.EARTH_MOON, label: 'Earth and Moon' },
                        { id: SCENARIOS.EARTH_SATELLITE, label: 'Earth and Satellite' }
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => setScenario(s.id)}
                            style={{
                                background: scenario === s.id ? 'rgba(52, 152, 219, 0.4)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${scenario === s.id ? '#3498db' : 'rgba(255,255,255,0.1)'}`,
                                color: 'white',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                fontSize: '14px'
                            }}
                            onMouseEnter={e => { if (scenario !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={e => { if (scenario !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Global Properties
                </h3>
                
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
            </div>

            {/* Canvas Container */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <canvas 
                    ref={canvasRef}
                    style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
            </div>
        </div>
    );
};

export default CustomGravityAndOrbits;
