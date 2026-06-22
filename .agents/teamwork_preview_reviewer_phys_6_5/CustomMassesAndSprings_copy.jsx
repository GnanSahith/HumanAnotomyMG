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
    const [simState, setSimState] = useState(physicsRef.current);

    const scale = 100; // pixels per meter

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
        setSimState([...physicsRef.current]);
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
                if (ps.y > MAX_Y) {
                    ps.y = MAX_Y;
                    const oldVy = ps.vy;
                    ps.vy *= -0.5; // bounce
                    const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
                    ps.thermalEnergy += dKE;
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

        setSimState([...physicsRef.current]);

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, springs, slowMotion, gravity, stopwatchRunning]);

    // Drag handling for masses
    const svgRef = useRef(null);
    
    const handlePointerDown = (e, id) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const ps = physicsRef.current.find(p => p.id === id);
        if (ps) {
            ps.isDragging = true;
            ps.vy = 0;
            ps.thermalEnergy = 0;
            setSelectedSpringId(id);
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
        
        ps.y = newY;
        const s = springs.find(sp => sp.id === id);
        ps.F_spring = -s.k * (newY - restLength);
        ps.vy = 0;
        
        setSimState([...physicsRef.current]);
    };

    const handlePointerUp = (e, id) => {
        const ps = physicsRef.current.find(p => p.id === id);
        if (ps && ps.isDragging) {
            ps.isDragging = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    // Drag handling for ruler
    const handleRulerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        isDraggingRulerRef.current = true;
    };
    const handleRulerMove = (e) => {
        if (!isDraggingRulerRef.current || !svgRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        setRulerPos({ x: svgP.x, y: svgP.y });
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
        const coils = 15;
        const width = 30;
        const startY = 0;
        const endY = ps.y * scale - 20; 
        if (endY <= startY) return null;
        const deltaY = (endY - startY) / (coils * 2);
        let pathStr = `M ${s.xOffset} ${startY}`;
        for (let i = 0; i < coils; i++) {
            pathStr += ` L ${s.xOffset + width/2} ${startY + deltaY * (2*i + 0.5)}`;
            pathStr += ` L ${s.xOffset - width/2} ${startY + deltaY * (2*i + 1.5)}`;
        }
        pathStr += ` L ${s.xOffset} ${endY}`;
        return <path d={pathStr} fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="4" strokeLinejoin="round" />;
    };

    const renderVector = (startX, startY, compY, color, scaleFactor) => {
        const vY = compY * scaleFactor;
        if (Math.abs(vY) < 1) return null;
        const markerId = color.replace('#', '');
        return (
            <g>
                <line x1={startX} y1={startY} x2={startX} y2={startY + vY} stroke={color} strokeWidth="4" markerEnd={`url(#arrowhead-${markerId})`} />
            </g>
        );
    };

    const selectedSpring = springs.find(s => s.id === selectedSpringId) || springs[0];

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #12121A 0%, #0a0a0f 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    {onBack && (
                        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}>
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <div style={{ padding: '8px', background: 'rgba(50,215,75,0.2)', borderRadius: '12px', border: '1px solid rgba(50,215,75,0.3)' }}><Activity size={24} color="#32d74b" /></div>
                    <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600, color: '#fff' }}>{title || 'Masses and Springs MG'}</h2>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: isPlaying ? 'rgba(255,55,95,0.2)' : 'rgba(10,132,255,0.2)', color: isPlaying ? '#ff375f' : '#0a84ff', border: 'none', padding: '10px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button onClick={handleReset} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    <svg ref={svgRef} viewBox="-400 0 800 800" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 24, left: 24, width: 'calc(100% - 48px)', height: 'calc(100% - 48px)', zIndex: 2 }}>
                        <defs>
                            <radialGradient id="massGradient" cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#32d74b" />
                                <stop offset="100%" stopColor="#28a745" />
                            </radialGradient>
                            <radialGradient id="selectedMassGradient" cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#0a84ff" />
                                <stop offset="100%" stopColor="#005bb5" />
                            </radialGradient>
                            <marker id="arrowhead-00f0ff" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#00f0ff" /></marker>
                            <marker id="arrowhead-ff375f" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#ff375f" /></marker>
                            <marker id="arrowhead-ff9f0a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#ff9f0a" /></marker>
                            <pattern id="svgGrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2"/></pattern>
                        </defs>

                        <rect x="-400" y="0" width="800" height="800" fill="#151522" />
                        <rect x="-400" y="0" width="800" height="800" fill="url(#svgGrid)" />
                        <rect x="-400" y="0" width="800" height="800" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" rx="24" />
                        
                        <rect x="-250" y="0" width="500" height="15" fill="#ffffff" rx="4" />
                        
                        {springs.map((s) => {
                            const ps = simState.find(p => p.id === s.id);
                            if (!ps) return null;
                            const isSelected = s.id === selectedSpringId;
                            return (
                                <g key={s.id}>
                                    {renderSpringPath(ps, s)}
                                    {showForces && renderVector(s.xOffset + 50, ps.y * scale, ps.F_spring, '#00f0ff', 2)}
                                    {showForces && renderVector(s.xOffset + 50, ps.y * scale, ps.F_gravity, '#ff375f', 2)}
                                    {showVelocity && renderVector(s.xOffset - 50, ps.y * scale, ps.vy, '#ff9f0a', 10)}
                                    
                                    <line x1={s.xOffset - 80} y1={(restLength + (s.massValue * gravity) / s.k) * scale} x2={s.xOffset + 80} y2={(restLength + (s.massValue * gravity) / s.k) * scale} stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10, 10" />

                                    <g transform={`translate(${s.xOffset}, ${ps.y * scale})`} onPointerDown={(e) => handlePointerDown(e, s.id)} onPointerMove={(e) => handlePointerMove(e, s.id)} onPointerUp={(e) => handlePointerUp(e, s.id)} onPointerCancel={(e) => handlePointerUp(e, s.id)} style={{ cursor: 'grab', touchAction: 'none' }}>
                                        <rect x={-40} y="-20" width={80} height={80} fill={isSelected ? "url(#selectedMassGradient)" : "url(#massGradient)"} rx="8" filter={isSelected ? "drop-shadow(0 0 10px rgba(10,132,255,0.6))" : "drop-shadow(0 0 10px rgba(50,215,75,0.4))"} />
                                        <text x="0" y={25} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" pointerEvents="none">{s.massLabel}</text>
                                    </g>
                                </g>
                            );
                        })}

                        {/* Ruler */}
                        <g transform={`translate(${rulerPos.x}, ${rulerPos.y})`} onPointerDown={handleRulerDown} onPointerMove={handleRulerMove} onPointerUp={handleRulerUp} onPointerCancel={handleRulerUp} style={{ cursor: 'grab', touchAction: 'none' }}>
                            <rect x="-15" y="0" width="30" height="400" fill="#facc15" rx="4" />
                            {Array.from({ length: 41 }).map((_, i) => (
                                <line key={i} x1={i % 10 === 0 ? "-15" : "-5"} y1={i * 10} x2="15" y2={i * 10} stroke="#000" strokeWidth="2" />
                            ))}
                            <text x="-25" y="200" transform="rotate(-90 -25 200)" fill="#000" fontSize="16" fontWeight="bold" pointerEvents="none">Meter Stick</text>
                        </g>

                    </svg>

                    {/* Stopwatch Overlay */}
                    {showStopwatch && (
                        <div style={{ position: 'absolute', top: 40, right: 40, zIndex: 10, background: 'rgba(20,20,30,0.9)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>Stopwatch</span>
                                <button onClick={() => setShowStopwatch(false)} style={{ background: 'none', border: 'none', color: '#ff375f', cursor: 'pointer' }}>✕</button>
                            </div>
                            <div style={{ fontSize: '32px', fontFamily: 'monospace', color: '#00f0ff', textAlign: 'center' }}>
                                {stopwatchTime.toFixed(2)} s
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setStopwatchRunning(!stopwatchRunning)} style={{ flex: 1, padding: '8px', background: stopwatchRunning ? 'rgba(255,55,95,0.2)' : 'rgba(50,215,75,0.2)', color: stopwatchRunning ? '#ff375f' : '#32d74b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                    {stopwatchRunning ? 'Stop' : 'Start'}
                                </button>
                                <button onClick={() => setStopwatchTime(0)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Energy Graph Overlay */}
                    {showEnergy && (
                        <div style={{ position: 'absolute', bottom: 40, left: 40, zIndex: 10, background: 'rgba(20,20,30,0.9)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '12px', width: '250px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>Energy Graph (Spring {selectedSpringId})</span>
                                <button onClick={() => setShowEnergy(false)} style={{ background: 'none', border: 'none', color: '#ff375f', cursor: 'pointer' }}>✕</button>
                            </div>
                            {(() => {
                                const ps = simState.find(p => p.id === selectedSpringId);
                                if (!ps) return null;
                                const maxE = 200; // arbitrary scale
                                const keH = Math.max(0, Math.min((ps.KE / maxE) * 100, 100));
                                const rawPeGravH = (ps.PE_grav / maxE) * 100;
                                const peGravH = Math.min(Math.abs(rawPeGravH), 100);
                                const peSprH = Math.max(0, Math.min((ps.PE_spring / maxE) * 100, 100));
                                const thermH = Math.max(0, Math.min((ps.thermalEnergy / maxE) * 100, 100));
                                
                                return (
                                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', paddingTop: '8px' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '100%', height: `${keH}px`, background: '#32d74b', transition: 'height 0.05s' }} />
                                            <span style={{ fontSize: '10px', color: '#aaa' }}>KE</span>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '100%', height: `${peGravH}px`, background: '#0a84ff', transition: 'height 0.05s', transform: rawPeGravH < 0 ? `translateY(${peGravH}px)` : 'none' }} />
                                            <span style={{ fontSize: '10px', color: '#aaa', transform: rawPeGravH < 0 ? `translateY(${peGravH}px)` : 'none' }}>PEg</span>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '100%', height: `${peSprH}px`, background: '#00f0ff', transition: 'height 0.05s' }} />
                                            <span style={{ fontSize: '10px', color: '#aaa' }}>PEs</span>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '100%', height: `${thermH}px`, background: '#ff375f', transition: 'height 0.05s' }} />
                                            <span style={{ fontSize: '10px', color: '#aaa' }}>Th</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div style={{ width: '340px', background: 'rgba(0,0,0,0.3)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Simulation Parameters</h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Selected Spring</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {springs.map(s => (
                                    <button key={s.id} onClick={() => setSelectedSpringId(s.id)} style={{ flex: 1, padding: '8px', background: selectedSpringId === s.id ? 'rgba(10,132,255,0.3)' : 'rgba(255,255,255,0.1)', color: '#fff', border: selectedSpringId === s.id ? '1px solid #0a84ff' : '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }}>
                                        Spring {s.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Mass</label>
                                </div>
                                <select value={selectedSpring.massLabel} onChange={(e) => {
                                    const opt = massOptions.find(o => o.label === e.target.value);
                                    updateSelectedSpring({ massValue: opt.value, massLabel: opt.label });
                                }} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}>
                                    {massOptions.map(opt => <option key={opt.label} value={opt.label} style={{color: '#000'}}>{opt.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Spring Constant (k)</label>
                                    <span style={{ fontSize: '14px', color: '#00f0ff', fontWeight: 700 }}>{selectedSpring.k} N/m</span>
                                </div>
                                <input type="range" min="1" max="50" step="1" value={selectedSpring.k} onChange={(e) => updateSelectedSpring({ k: Number(e.target.value) })} style={{ width: '100%', accentColor: '#00f0ff' }} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Damping (c)</label>
                                    <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 700 }}>{selectedSpring.c} Ns/m</span>
                                </div>
                                <input type="range" min="0" max="10" step="0.1" value={selectedSpring.c} onChange={(e) => updateSelectedSpring({ c: Number(e.target.value) })} style={{ width: '100%', accentColor: '#ff9f0a' }} />
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Gravity (g)</label>
                                    <span style={{ fontSize: '14px', color: '#ff375f', fontWeight: 700 }}>{gravity} m/s²</span>
                                </div>
                                <select value={gravity} onChange={(e) => setGravity(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}>
                                    <option value="9.81" style={{color: '#000'}}>Earth (9.81 m/s²)</option>
                                    <option value="1.62" style={{color: '#000'}}>Moon (1.62 m/s²)</option>
                                    <option value="24.79" style={{color: '#000'}}>Jupiter (24.79 m/s²)</option>
                                    <option value="0" style={{color: '#000'}}>Zero Gravity (0 m/s²)</option>
                                </select>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showEnergy} onChange={(e) => setShowEnergy(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '14px', color: '#32d74b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <BarChart2 size={16} /> Show Energy Graph
                                </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showStopwatch} onChange={(e) => setShowStopwatch(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '14px', color: '#00f0ff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Timer size={16} /> Show Stopwatch
                                </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showVelocity} onChange={(e) => setShowVelocity(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '14px', color: '#ff9f0a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Crosshair size={16} /> Velocity Vector
                                </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showForces} onChange={(e) => setShowForces(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '14px', color: '#00f0ff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Crosshair size={16} /> Force Vectors
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
