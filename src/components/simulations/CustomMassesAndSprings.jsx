/* eslint-disable react-hooks/refs */
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, Wind, Crosshair, ArrowLeft, Activity, Ruler, Timer, BarChart2 } from 'lucide-react';

export default function CustomMassesAndSprings({ onBack, title }) {
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Core Physics Parameters
    const [gravity, setGravity] = useState(9.81); // m/s^2
    const restLength = 2; // m
    
    // Multiple Springs State
    const [springs, setSprings] = useState([
        { id: 1, massValue: 1, massLabel: '1 kg', k: 10, c: 0.5, xOffset: -150 },
        { id: 2, massValue: 1, massLabel: '1 kg', k: 10, c: 0.5, xOffset: 150 }
    ]);
    const [selectedSpringId, setSelectedSpringId] = useState(1);
    
    // Unknown masses options
    const massOptions = [
        { value: 0.5, label: '0.5 kg' },
        { value: 1.0, label: '1 kg' },
        { value: 2.0, label: '2 kg' },
        { value: 0.05, label: 'Unknown A' },
        { value: 0.1, label: 'Unknown B' },
        { value: 0.25, label: 'Unknown C' }
    ];

    // UI/Simulation Toggles
    const [slowMotion, setSlowMotion] = useState(false);
    const [showVelocity, setShowVelocity] = useState(false);
    const [showForces, setShowForces] = useState(false);
    const [showEnergy, setShowEnergy] = useState(false);
    
    // Tools
    const [showStopwatch, setShowStopwatch] = useState(false);
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [stopwatchRunning, setStopwatchRunning] = useState(false);

    // Ruler
    const [rulerPos, setRulerPos] = useState({ x: 300, y: 100 });
    const isDraggingRulerRef = useRef(false);

    // Engine State
    const timeRef = useRef(0);
    const lastTimeRef = useRef(0);
    const requestRef = useRef(null);
    
    // We keep simulation state in refs to avoid re-renders during loop
    const physicsRef = useRef(springs.map(s => ({
        id: s.id,
        y: restLength + (s.massValue * gravity) / s.k,
        vy: 0,
        ay: 0,
        isDragging: false,
        thermalEnergy: 0,
        F_spring: 0,
        F_gravity: s.massValue * gravity,
        F_damping: 0,
        KE: 0,
        PE_grav: 0,
        PE_spring: 0
    })));

    // Visual State (updated via animation frame)
    const massRefs = useRef({});
    const springRefs = useRef({});
    const forceSpringRefs = useRef({});
    const forceGravRefs = useRef({});
    const velocityRefs = useRef({});
    
    const energyKeRef = useRef(null);
    const energyPegRef = useRef(null);
    const energyPesRef = useRef(null);
    const energyThRef = useRef(null);
    const energyPegLabelRef = useRef(null);

    const scale = 100; // pixels per meter

    const getSpringPathStr = (y, s) => {
        const coils = 15;
        const width = 30;
        const startY = 0;
        const endY = y * scale - 20; 
        if (endY <= startY) return "";
        const deltaY = (endY - startY) / (coils * 2);
        let pathStr = `M ${s.xOffset} ${startY}`;
        for (let i = 0; i < coils; i++) {
            pathStr += ` L ${s.xOffset + width/2} ${startY + deltaY * (2*i + 0.5)}`;
            pathStr += ` L ${s.xOffset - width/2} ${startY + deltaY * (2*i + 1.5)}`;
        }
        pathStr += ` L ${s.xOffset} ${endY}`;
        return pathStr;
    };

    const updateVisuals = () => {
        physicsRef.current.forEach(ps => {
            const s = springs.find(sp => sp.id === ps.id);
            if (!s) return;
            
            if (massRefs.current[s.id]) {
                massRefs.current[s.id].setAttribute('transform', `translate(${s.xOffset}, ${ps.y * scale})`);
            }
            if (springRefs.current[s.id]) {
                springRefs.current[s.id].setAttribute('d', getSpringPathStr(ps.y, s));
            }
            
            if (forceSpringRefs.current[s.id]) {
                const vY = ps.F_spring * 2;
                if (Math.abs(vY) < 1) {
                    forceSpringRefs.current[s.id].setAttribute('display', 'none');
                } else {
                    forceSpringRefs.current[s.id].setAttribute('display', 'inline');
                    forceSpringRefs.current[s.id].setAttribute('y1', ps.y * scale);
                    forceSpringRefs.current[s.id].setAttribute('y2', ps.y * scale + vY);
                }
            }
            if (forceGravRefs.current[s.id]) {
                const vY = ps.F_gravity * 2;
                if (Math.abs(vY) < 1) {
                    forceGravRefs.current[s.id].setAttribute('display', 'none');
                } else {
                    forceGravRefs.current[s.id].setAttribute('display', 'inline');
                    forceGravRefs.current[s.id].setAttribute('y1', ps.y * scale);
                    forceGravRefs.current[s.id].setAttribute('y2', ps.y * scale + vY);
                }
            }
            if (velocityRefs.current[s.id]) {
                const vY = ps.vy * 10;
                if (Math.abs(vY) < 1) {
                    velocityRefs.current[s.id].setAttribute('display', 'none');
                } else {
                    velocityRefs.current[s.id].setAttribute('display', 'inline');
                    velocityRefs.current[s.id].setAttribute('y1', ps.y * scale);
                    velocityRefs.current[s.id].setAttribute('y2', ps.y * scale + vY);
                }
            }
            
            if (showEnergy && s.id === selectedSpringId) {
                const maxE = 200;
                const keH = Math.max(0, Math.min((ps.KE / maxE) * 100, 100));
                const rawPeGravH = (ps.PE_grav / maxE) * 100;
                const peGravH = Math.min(Math.abs(rawPeGravH), 100);
                const peSprH = Math.max(0, Math.min((ps.PE_spring / maxE) * 100, 100));
                const thermH = Math.max(0, Math.min((ps.thermalEnergy / maxE) * 100, 100));
                
                if (energyKeRef.current) energyKeRef.current.style.height = `${keH}px`;
                
                if (energyPegRef.current) {
                    energyPegRef.current.style.height = `${peGravH}px`;
                    energyPegRef.current.style.transform = rawPeGravH < 0 ? `translateY(${peGravH}px)` : 'none';
                }
                if (energyPegLabelRef.current) {
                    energyPegLabelRef.current.style.transform = rawPeGravH < 0 ? `translateY(${peGravH}px)` : 'none';
                }
                
                if (energyPesRef.current) energyPesRef.current.style.height = `${peSprH}px`;
                if (energyThRef.current) energyThRef.current.style.height = `${thermH}px`;
            }
        });
    };

    const handleReset = () => {
        setIsPlaying(false);
        timeRef.current = 0;
        setStopwatchTime(0);
        setStopwatchRunning(false);
        
        physicsRef.current = springs.map(s => {
            const eqY = restLength + (s.massValue * gravity) / s.k;
            return {
                id: s.id,
                y: eqY,
                vy: 0,
                ay: 0,
                isDragging: false,
                thermalEnergy: 0,
                F_spring: -s.k * (eqY - restLength),
                F_gravity: s.massValue * gravity,
                F_damping: 0,
                KE: 0,
                PE_grav: 0,
                PE_spring: 0
            };
        });
        updateVisuals();
    };

    // Update equilibrium when parameters change
    useEffect(() => {
        if (!isPlaying) {
            let changed = false;
            physicsRef.current.forEach(ps => {
                if (!ps.isDragging) {
                    const s = springs.find(sp => sp.id === ps.id);
                    const newEqY = restLength + (s.massValue * gravity) / s.k;
                    if (Math.abs(ps.y - newEqY) > 0.001 || Math.abs(ps.F_gravity - s.massValue * gravity) > 0.001) {
                        changed = true;
                    }
                }
            });
            if (changed) handleReset();
        }
    }, [springs, gravity]);

    const updatePhysics = (time) => {
        if (!lastTimeRef.current) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const realDt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        if (!isPlaying && !physicsRef.current.some(p => p.isDragging)) {
            updateVisuals();
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const safeDt = Math.min(realDt, 0.1);
        const dt = slowMotion ? safeDt * 0.4 : safeDt * 1.5; 
        
        // Always increment sim time if not paused, even if dragging
        if (isPlaying) {
            timeRef.current += dt;
            if (stopwatchRunning) {
                setStopwatchTime(prev => prev + dt); 
            }
        }

        // Sub-step Euler integration
        const steps = 10;
        const subDt = dt / steps;
        
        physicsRef.current.forEach(ps => {
            const s = springs.find(sp => sp.id === ps.id);
            if (ps.isDragging || !isPlaying) return;

            let F_spring = 0;
            let F_damping = 0;
            const F_gravity = s.massValue * gravity;

            for(let i = 0; i < steps; i++) {
                F_spring = -s.k * (ps.y - restLength);
                F_damping = -s.c * ps.vy;
                const netForce = F_gravity + F_spring + F_damping;
                ps.ay = netForce / s.massValue;
                
                ps.vy += ps.ay * subDt;
                ps.y += ps.vy * subDt;
                
                ps.thermalEnergy += (s.c * ps.vy * ps.vy) * subDt;
                
                // Limit to prevent shooting off screen
                if (ps.y < 0.1) {
                    ps.y = 0.1;
                    const oldVy = ps.vy;
                    ps.vy *= -0.5; // bounce
                    const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
                    ps.thermalEnergy += dKE;
                }
                const MAX_Y = 8.0;
                if (ps.y >= MAX_Y) {
                    if (Math.abs(ps.vy) < 0.2) {
                        ps.y = MAX_Y;
                        ps.vy = 0;
                    } else {
                        ps.y = MAX_Y;
                        const oldVy = ps.vy;
                        ps.vy *= -0.5; // bounce
                        const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
                        ps.thermalEnergy += dKE;
                    }
                }
            }
            
            ps.F_spring = F_spring;
            ps.F_gravity = F_gravity;
            ps.F_damping = F_damping;
        });
        
        // Calculate energies
        physicsRef.current.forEach(ps => {
            const s = springs.find(sp => sp.id === ps.id);
            ps.KE = 0.5 * s.massValue * ps.vy * ps.vy;
            const PE_datum = 6.0;
            const h = PE_datum - ps.y; 
            ps.PE_grav = s.massValue * gravity * h;
            const x = ps.y - restLength;
            ps.PE_spring = 0.5 * s.k * x * x;
        });

        updateVisuals();

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, springs, slowMotion, gravity, stopwatchRunning, showEnergy, showForces, showVelocity, selectedSpringId]);

    // Drag handling for masses
    const svgRef = useRef(null);
    
    const handlePointerDown = (e, id) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const ps = physicsRef.current.find(p => p.id === id);
        if (ps) {
            ps.isDragging = true;
            ps.vy = 0;
            ps.thermalEnergy = 0;
            if (selectedSpringId !== id) {
                setSelectedSpringId(id);
            }
        }
    };
    
    const handlePointerMove = (e, id) => {
        const ps = physicsRef.current.find(p => p.id === id);
        if (!ps || !ps.isDragging || !svgRef.current) return;
        
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        
        let newY = svgP.y / scale;
        if (newY < 0.2) newY = 0.2;
        if (newY > 8.0) newY = 8.0;
        
        ps.y = newY;
        const s = springs.find(sp => sp.id === id);
        ps.F_spring = -s.k * (newY - restLength);
        ps.vy = 0;
        
        updateVisuals();
    };

    const handlePointerUp = (e, id) => {
        const ps = physicsRef.current.find(p => p.id === id);
        if (ps && ps.isDragging) {
            ps.isDragging = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    // Drag handling for ruler
    const rulerGRef = useRef(null);
    const handleRulerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        isDraggingRulerRef.current = true;
    };
    const handleRulerMove = (e) => {
        if (!isDraggingRulerRef.current || !svgRef.current || !rulerGRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        rulerGRef.current.setAttribute('transform', `translate(${svgP.x}, ${svgP.y})`);
    };
    const handleRulerUp = (e) => {
        if (isDraggingRulerRef.current) {
            isDraggingRulerRef.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    const updateSelectedSpring = (updates) => {
        setSprings(springs.map(s => s.id === selectedSpringId ? { ...s, ...updates } : s));
    };

    const renderSpringPath = (ps, s) => {
        return <path ref={el => springRefs.current[s.id] = el} d={getSpringPathStr(ps.y, s)} fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="4" strokeLinejoin="round" pointerEvents="none" />;
    };

    const renderVector = (startX, startY, compY, color, scaleFactor, refObj, sId) => {
        const vY = compY * scaleFactor;
        const markerId = color.replace('#', '');
        return (
            <g pointerEvents="none">
                <line ref={el => refObj.current[sId] = el} x1={startX} y1={startY} x2={startX} y2={startY + vY} stroke={color} strokeWidth="4" markerEnd={`url(#arrowhead-${markerId})`} display={Math.abs(vY) < 1 ? 'none' : 'inline'} />
            </g>
        );
    };

    const selectedSpring = springs.find(s => s.id === selectedSpringId) || springs[0];

    const panelStyle = {
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 10,
        color: 'white',
        fontFamily: "'Inter', sans-serif"
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a1a', overflow: 'hidden' }}>
            <style>{`
                .glass-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    font-size: 14px;
                    outline: none;
                }
                .back-btn:hover {
                    background: rgba(255, 55, 95, 0.8) !important;
                    border-color: #ff375f !important;
                    box-shadow: 0 0 15px rgba(255, 55, 95, 0.4);
                }
                .play-btn:hover, .reset-btn:hover {
                    background: rgba(52, 152, 219, 0.4) !important;
                    border-color: #3498db !important;
                    box-shadow: 0 0 15px rgba(52, 152, 219, 0.4);
                }
                .sim-select {
                    width: 100%;
                    padding: 12px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    outline: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .sim-select:focus {
                    border-color: #3498db;
                    background: rgba(20, 20, 30, 0.9);
                }
                .sim-select option {
                    background: #14141e;
                    color: #fff;
                }
            `}</style>

            {/* Top Header Bar */}
            <div style={{ height: '80px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    {onBack && (
                        <button onClick={onBack} className="glass-btn back-btn">
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                </div>
                <div>
                    <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', margin: 0 }}>
                        {title || 'Masses and Springs MG'}
                    </h2>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="glass-btn play-btn">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button onClick={handleReset} className="glass-btn reset-btn">
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            {/* SVG Main View */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <svg ref={svgRef} viewBox="-800 0 1600 800" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
                <defs>
                    <radialGradient id="massGradient" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#2ecc71" />
                        <stop offset="100%" stopColor="#27ae60" />
                    </radialGradient>
                    <radialGradient id="selectedMassGradient" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#3498db" />
                        <stop offset="100%" stopColor="#2980b9" />
                    </radialGradient>
                    <marker id="arrowhead-00f0ff" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#00f0ff" /></marker>
                    <marker id="arrowhead-ff375f" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#ff375f" /></marker>
                    <marker id="arrowhead-ff9f0a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#ff9f0a" /></marker>
                    <pattern id="svgGrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2"/></pattern>
                </defs>

                <rect x="-4000" y="-1000" width="8000" height="4000" fill="#0a0a1a" pointerEvents="none" />
                <rect x="-4000" y="-1000" width="8000" height="4000" fill="url(#svgGrid)" pointerEvents="none" />
                
                <rect x="-250" y="0" width="500" height="15" fill="rgba(255, 255, 255, 0.8)" rx="4" pointerEvents="none" />
                
                {springs.map((s) => {
                    const ps = physicsRef.current.find(p => p.id === s.id);
                    if (!ps) return null;
                    const isSelected = s.id === selectedSpringId;
                    return (
                        <g key={s.id}>
                            {renderSpringPath(ps, s)}
                            {showForces && renderVector(s.xOffset + 50, ps.y * scale, ps.F_spring, '#00f0ff', 2, forceSpringRefs, s.id)}
                            {showForces && renderVector(s.xOffset + 50, ps.y * scale, ps.F_gravity, '#ff375f', 2, forceGravRefs, s.id)}
                            {showVelocity && renderVector(s.xOffset - 50, ps.y * scale, ps.vy, '#ff9f0a', 10, velocityRefs, s.id)}
                            
                            <line x1={s.xOffset - 80} y1={(restLength + (s.massValue * gravity) / s.k) * scale} x2={s.xOffset + 80} y2={(restLength + (s.massValue * gravity) / s.k) * scale} stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="10, 10" pointerEvents="none" />

                            <g ref={el => massRefs.current[s.id] = el} transform={`translate(${s.xOffset}, ${ps.y * scale})`} onPointerDown={(e) => handlePointerDown(e, s.id)} onPointerMove={(e) => handlePointerMove(e, s.id)} onPointerUp={(e) => handlePointerUp(e, s.id)} onPointerCancel={(e) => handlePointerUp(e, s.id)} style={{ cursor: 'grab', touchAction: 'none' }}>
                                <rect x={-40} y="-20" width={80} height={80} fill={isSelected ? "url(#selectedMassGradient)" : "url(#massGradient)"} rx="8" filter={isSelected ? "drop-shadow(0 0 10px rgba(52,152,219,0.6))" : "drop-shadow(0 0 10px rgba(46,204,113,0.4))"} />
                                <text x="0" y={25} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" pointerEvents="none">{s.massLabel}</text>
                            </g>
                        </g>
                    );
                })}

                {/* Ruler */}
                <g ref={rulerGRef} transform={`translate(300, 100)`} onPointerDown={handleRulerDown} onPointerMove={handleRulerMove} onPointerUp={handleRulerUp} onPointerCancel={handleRulerUp} style={{ cursor: 'grab', touchAction: 'none' }}>
                    <rect x="-15" y="0" width="30" height="400" fill="#f1c40f" rx="4" />
                    {Array.from({ length: 41 }).map((_, i) => (
                        <line key={i} x1={i % 10 === 0 ? "-15" : "-5"} y1={i * 10} x2="15" y2={i * 10} stroke="#000" strokeWidth="2" />
                    ))}
                    <text x="-25" y="200" transform="rotate(-90 -25 200)" fill="#000" fontSize="16" fontWeight="bold" pointerEvents="none">Meter Stick</text>
                </g>
            </svg>

            {/* Stopwatch Overlay */}
            {showStopwatch && (
                <div style={{ ...panelStyle, position: 'absolute', left: '40px', top: '20px', width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>Stopwatch</span>
                        <button onClick={() => setShowStopwatch(false)} style={{ background: 'none', border: 'none', color: '#ff375f', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                    </div>
                    <div style={{ fontSize: '32px', fontFamily: 'monospace', color: '#3498db', textAlign: 'center', margin: '10px 0' }}>
                        {stopwatchTime.toFixed(2)} s
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setStopwatchRunning(!stopwatchRunning)} style={{ flex: 1, padding: '8px', background: stopwatchRunning ? 'rgba(255,55,95,0.2)' : 'rgba(50,215,75,0.2)', color: stopwatchRunning ? '#ff375f' : '#32d74b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                            {stopwatchRunning ? 'Stop' : 'Start'}
                        </button>
                        <button onClick={() => setStopwatchTime(0)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                            Reset
                        </button>
                    </div>
                </div>
            )}

            {/* Energy Graph Overlay */}
            {showEnergy && (
                <div style={{ ...panelStyle, position: 'absolute', left: '40px', bottom: '20px', width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>Energy Graph (Spring {selectedSpringId})</span>
                        <button onClick={() => setShowEnergy(false)} style={{ background: 'none', border: 'none', color: '#ff375f', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                    </div>
                    {(() => {
                        const ps = physicsRef.current.find(p => p.id === selectedSpringId);
                        if (!ps) return null;
                        const maxE = 200;
                        const keH = Math.max(0, Math.min((ps.KE / maxE) * 100, 100));
                        const rawPeGravH = (ps.PE_grav / maxE) * 100;
                        const peGravH = Math.min(Math.abs(rawPeGravH), 100);
                        const peSprH = Math.max(0, Math.min((ps.PE_spring / maxE) * 100, 100));
                        const thermH = Math.max(0, Math.min((ps.thermalEnergy / maxE) * 100, 100));
                        
                        return (
                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', paddingTop: '8px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div ref={energyKeRef} style={{ width: '100%', height: `${keH}px`, background: '#2ecc71', borderRadius: '2px 2px 0 0' }} />
                                    <span style={{ fontSize: '10px', color: '#aaa' }}>KE</span>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div ref={energyPegRef} style={{ width: '100%', height: `${peGravH}px`, background: '#3498db', borderRadius: '2px 2px 0 0', transform: rawPeGravH < 0 ? `translateY(${peGravH}px)` : 'none' }} />
                                    <span ref={energyPegLabelRef} style={{ fontSize: '10px', color: '#aaa', transform: rawPeGravH < 0 ? `translateY(${peGravH}px)` : 'none' }}>PEg</span>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div ref={energyPesRef} style={{ width: '100%', height: `${peSprH}px`, background: '#bf5af2', borderRadius: '2px 2px 0 0' }} />
                                    <span style={{ fontSize: '10px', color: '#aaa' }}>PEs</span>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div ref={energyThRef} style={{ width: '100%', height: `${thermH}px`, background: '#ff375f', borderRadius: '2px 2px 0 0' }} />
                                    <span style={{ fontSize: '10px', color: '#aaa' }}>Th</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Right Control Panel */}
            <div style={{ ...panelStyle, position: 'absolute', right: '40px', top: '20px', bottom: '20px', width: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                    <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Simulation Parameters</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Selected Spring</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {springs.map(s => (
                            <button key={s.id} onClick={() => setSelectedSpringId(s.id)} style={{ flex: 1, padding: '10px', background: selectedSpringId === s.id ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.05)', color: '#fff', border: selectedSpringId === s.id ? '1px solid #3498db' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600 }}>
                                Spring {s.id}
                            </button>
                        ))}
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Mass</label>
                        </div>
                        <select value={selectedSpring.massLabel} onChange={(e) => {
                            const opt = massOptions.find(o => o.label === e.target.value);
                            updateSelectedSpring({ massValue: opt.value, massLabel: opt.label });
                        }} className="sim-select">
                            {massOptions.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Spring Constant (k)</label>
                            <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{selectedSpring.k} N/m</span>
                        </div>
                        <input type="range" min="1" max="50" step="1" value={selectedSpring.k} onChange={(e) => updateSelectedSpring({ k: Number(e.target.value) })} style={{ width: '100%', accentColor: '#3498db' }} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Damping (c)</label>
                            <span style={{ fontSize: '14px', color: '#bf5af2', fontWeight: 700 }}>{selectedSpring.c} Ns/m</span>
                        </div>
                        <input type="range" min="0" max="10" step="0.1" value={selectedSpring.c} onChange={(e) => updateSelectedSpring({ c: Number(e.target.value) })} style={{ width: '100%', accentColor: '#bf5af2' }} />
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Gravity (g)</label>
                            <span style={{ fontSize: '14px', color: '#ff375f', fontWeight: 700 }}>{gravity} m/s²</span>
                        </div>
                        <select value={gravity} onChange={(e) => setGravity(Number(e.target.value))} className="sim-select">
                            <option value="9.81">Earth (9.81 m/s²)</option>
                            <option value="1.62">Moon (1.62 m/s²)</option>
                            <option value="24.79">Jupiter (24.79 m/s²)</option>
                            <option value="0">Zero Gravity (0 m/s²)</option>
                        </select>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showEnergy} onChange={(e) => setShowEnergy(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                        <span style={{ fontSize: '14px', color: '#2ecc71', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BarChart2 size={16} /> Show Energy Graph
                        </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showStopwatch} onChange={(e) => setShowStopwatch(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                        <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Timer size={16} /> Show Stopwatch
                        </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showVelocity} onChange={(e) => setShowVelocity(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                        <span style={{ fontSize: '14px', color: '#f1c40f', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Crosshair size={16} /> Velocity Vector
                        </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showForces} onChange={(e) => setShowForces(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                        <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Crosshair size={16} /> Force Vectors
                        </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '4px' }}>
                        <input type="checkbox" checked={slowMotion} onChange={(e) => setSlowMotion(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                        <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>🐢 Slow Motion Playback</span>
                    </label>
                </div>
            </div>
            </div>
        </div>
    );
}
