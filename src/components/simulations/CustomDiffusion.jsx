import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, ArrowLeft, Target, Timer } from 'lucide-react';

export default function CustomDiffusion({ onBack, title }) {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const particlesRef = useRef([]);
    
    const [isPlaying, setIsPlaying] = useState(true);
    const [dividerRemoved, setDividerRemoved] = useState(false);
    const [showCenterOfMass, setShowCenterOfMass] = useState(false);
    const [showData, setShowData] = useState(true);
    const [showStopwatch, setShowStopwatch] = useState(false);
    const [time, setTime] = useState(0);
    const [counts, setCounts] = useState({ aLeft: 50, aRight: 0, bLeft: 0, bRight: 50 });

    const [configA, setConfigA] = useState({ count: 50, mass: 28, radius: 10, temp: 300, color: '#ff3b30' });
    const [configB, setConfigB] = useState({ count: 50, mass: 32, radius: 10, temp: 300, color: '#007aff' });

    // Refs for state accessed inside animation loop
    const stateRef = useRef({ configA, configB, dividerRemoved, showCenterOfMass, showData });
    const isPlayingRef = useRef(isPlaying);
    const frameCountRef = useRef(0);

    const canvasWidth = 600;
    const canvasHeight = 400;

    useEffect(() => {
        stateRef.current = { configA, configB, dividerRemoved, showCenterOfMass, showData };
    }, [configA, configB, dividerRemoved, showCenterOfMass, showData]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const initParticles = () => {
        let p = [];
        const hw = canvasWidth / 2;

        const addType = (config, type, startX, endX) => {
            const speed = Math.sqrt(config.temp / config.mass) * 1.5; 
            for (let i = 0; i < config.count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = config.radius;
                p.push({
                    x: startX + r + Math.random() * (endX - startX - 2 * r),
                    y: r + Math.random() * (canvasHeight - 2 * r),
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    type: type
                });
            }
        };

        addType(configA, 'A', 0, hw);
        addType(configB, 'B', hw, canvasWidth);
        
        particlesRef.current = p;
        setTime(0);
        setDividerRemoved(false);
        setCounts({
            aLeft: p.filter(part => part.type === 'A' && part.x <= hw).length,
            aRight: p.filter(part => part.type === 'A' && part.x > hw).length,
            bLeft: p.filter(part => part.type === 'B' && part.x <= hw).length,
            bRight: p.filter(part => part.type === 'B' && part.x > hw).length
        });
    };

    // On mount
    useEffect(() => {
        initParticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // Handle Config Changes dynamically
    useEffect(() => {
        const p = particlesRef.current;
        const processConfig = (config, type, startX, endX) => {
            let currentCount = p.filter(part => part.type === type).length;
            
            p.forEach(part => {
                if (part.type === type) {
                    const speed = Math.sqrt(config.temp / config.mass) * 1.5;
                    const currentSpeed = Math.sqrt(part.vx * part.vx + part.vy * part.vy);
                    if (currentSpeed > 0.001) {
                        part.vx = (part.vx / currentSpeed) * speed;
                        part.vy = (part.vy / currentSpeed) * speed;
                    } else {
                        const angle = Math.random() * Math.PI * 2;
                        part.vx = Math.cos(angle) * speed;
                        part.vy = Math.sin(angle) * speed;
                    }
                }
            });

            if (config.count > currentCount) {
                const speed = Math.sqrt(config.temp / config.mass) * 1.5;
                for (let i = 0; i < config.count - currentCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = config.radius;
                    const sX = dividerRemoved ? 0 : startX;
                    const eX = dividerRemoved ? canvasWidth : endX;
                    
                    p.push({
                        x: sX + r + Math.random() * (eX - sX - 2 * r),
                        y: r + Math.random() * (canvasHeight - 2 * r),
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        type: type
                    });
                }
            } else if (config.count < currentCount) {
                let toRemove = currentCount - config.count;
                for (let i = p.length - 1; i >= 0 && toRemove > 0; i--) {
                    if (p[i].type === type) {
                        p.splice(i, 1);
                        toRemove--;
                    }
                }
            }
        };

        const hw = canvasWidth / 2;
        processConfig(configA, 'A', 0, hw);
        processConfig(configB, 'B', hw, canvasWidth);
        setCounts({
            aLeft: p.filter(part => part.type === 'A' && part.x <= hw).length,
            aRight: p.filter(part => part.type === 'A' && part.x > hw).length,
            bLeft: p.filter(part => part.type === 'B' && part.x <= hw).length,
            bRight: p.filter(part => part.type === 'B' && part.x > hw).length
        });
    }, [configA, configB, dividerRemoved]);

    const resolveCollision = (p1, p2, m1, m2, r1, r2) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = r1 + r2;
        if (distSq < minDist * minDist && distSq > 0) {
            const distance = Math.sqrt(distSq);
            const nx = dx / distance;
            const ny = dy / distance;
            const vx = p1.vx - p2.vx;
            const vy = p1.vy - p2.vy;
            const velocityAlongNormal = vx * nx + vy * ny;

            if (velocityAlongNormal > 0) {
                const j = -(2) * velocityAlongNormal / (1 / m1 + 1 / m2);
                const impulseX = j * nx;
                const impulseY = j * ny;
                p1.vx += impulseX / m1;
                p1.vy += impulseY / m1;
                p2.vx -= impulseX / m2;
                p2.vy -= impulseY / m2;

                const overlap = minDist - distance;
                const separationX = nx * overlap * 0.51;
                const separationY = ny * overlap * 0.51;
                p1.x -= separationX;
                p1.y -= separationY;
                p2.x += separationX;
                p2.y += separationY;
            }
        }
    };

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const state = stateRef.current;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw Container
        ctx.strokeStyle = '#ffffff33';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        // Draw Divider
        if (!state.dividerRemoved) {
            ctx.beginPath();
            ctx.moveTo(canvasWidth / 2, 0);
            ctx.lineTo(canvasWidth / 2, canvasHeight);
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#ffffff66';
            ctx.stroke();
            ctx.setLineDash([]);
        }

        let cmA = { x: 0, y: 0, count: 0 };
        let cmB = { x: 0, y: 0, count: 0 };

        const p = particlesRef.current;
        for (let i = 0; i < p.length; i++) {
            const part = p[i];
            const conf = part.type === 'A' ? state.configA : state.configB;
            
            ctx.beginPath();
            ctx.arc(part.x, part.y, conf.radius, 0, Math.PI * 2);
            ctx.fillStyle = conf.color;
            ctx.fill();
            
            if (state.showCenterOfMass) {
                if (part.type === 'A') {
                    cmA.x += part.x; cmA.y += part.y; cmA.count++;
                } else {
                    cmB.x += part.x; cmB.y += part.y; cmB.count++;
                }
            }
        }

        if (state.showCenterOfMass) {
            const drawCM = (cm, color) => {
                if (cm.count === 0) return;
                const x = cm.x / cm.count;
                const y = cm.y / cm.count;
                ctx.beginPath();
                ctx.moveTo(x - 10, y);
                ctx.lineTo(x + 10, y);
                ctx.moveTo(x, y - 10);
                ctx.lineTo(x, y + 10);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.stroke();
            };
            drawCM(cmA, state.configA.color);
            drawCM(cmB, state.configB.color);
        }
    };

    const updatePhysics = () => {
        const state = stateRef.current;
        
        if (!isPlayingRef.current) {
            drawCanvas();
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const p = particlesRef.current;
        const dt = 1.0;
        const hw = canvasWidth / 2;

        setTime(t => t + 0.016);

        // Move and wall collisions
        for (let i = 0; i < p.length; i++) {
            const part = p[i];
            const conf = part.type === 'A' ? state.configA : state.configB;
            const r = conf.radius;
            
            let wasLeft = part.x <= hw;
            
            part.x += part.vx * dt;
            part.y += part.vy * dt;

            if (part.x - r < 0) {
                part.x = r;
                part.vx *= -1;
            } else if (part.x + r > canvasWidth) {
                part.x = canvasWidth - r;
                part.vx *= -1;
            }

            if (part.y - r < 0) {
                part.y = r;
                part.vy *= -1;
            } else if (part.y + r > canvasHeight) {
                part.y = canvasHeight - r;
                part.vy *= -1;
            }

            if (!state.dividerRemoved) {
                if (wasLeft && part.x + r > hw) {
                    part.x = hw - r;
                    part.vx *= -1;
                } else if (!wasLeft && part.x - r < hw) {
                    part.x = hw + r;
                    part.vx *= -1;
                }
            }
        }

        for (let i = 0; i < p.length; i++) {
            const p1 = p[i];
            const c1 = p1.type === 'A' ? state.configA : state.configB;
            for (let j = i + 1; j < p.length; j++) {
                const p2 = p[j];
                const c2 = p2.type === 'A' ? state.configA : state.configB;
                if (Math.abs(p1.x - p2.x) < c1.radius + c2.radius && 
                    Math.abs(p1.y - p2.y) < c1.radius + c2.radius) {
                    resolveCollision(p1, p2, c1.mass, c2.mass, c1.radius, c2.radius);
                }
            }
        }

        drawCanvas();

        frameCountRef.current++;
        if (state.showData && frameCountRef.current % 15 === 0) {
            setCounts({
                aLeft: p.filter(part => part.type === 'A' && part.x <= hw).length,
                aRight: p.filter(part => part.type === 'A' && part.x > hw).length,
                bLeft: p.filter(part => part.type === 'B' && part.x <= hw).length,
                bRight: p.filter(part => part.type === 'B' && part.x > hw).length
            });
        }

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const handleConfigChange = (type, key, value) => {
        if (type === 'A') setConfigA(prev => ({ ...prev, [key]: value }));
        else setConfigB(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
            {/* Top Header Bar */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {onBack && (
                        <button 
                            onClick={onBack}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontWeight: 600,
                                fontFamily: "'Inter', sans-serif"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255, 55, 95, 0.8)';
                                e.currentTarget.style.borderColor = '#ff375f';
                                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 55, 95, 0.4)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}
                    <h1 style={{
                        color: 'white',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '24px',
                        fontWeight: '600',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        margin: 0
                    }}>
                        {title || "Diffusion"}
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            color: isPlaying ? '#ff375f' : '#2ecc71',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = isPlaying ? 'rgba(255, 55, 95, 0.2)' : 'rgba(46, 204, 113, 0.2)';
                            e.currentTarget.style.borderColor = isPlaying ? '#ff375f' : '#2ecc71';
                            e.currentTarget.style.boxShadow = isPlaying ? '0 0 15px rgba(255, 55, 95, 0.2)' : '0 0 15px rgba(46, 204, 113, 0.2)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>

                    <button
                        onClick={initParticles}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(52, 152, 219, 0.4)';
                            e.currentTarget.style.borderColor = '#3498db';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        title="Reset Simulator"
                    >
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            {/* Canvas / Main View */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'relative',
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                    pointerEvents: 'auto'
                }}>
                    <canvas
                        ref={canvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        style={{
                            display: 'block',
                            background: 'rgba(20, 20, 30, 0.4)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                        }}
                    />
                    {showData && (
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '16px',
                            background: 'rgba(20, 20, 30, 0.85)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            padding: '12px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            display: 'flex',
                            gap: '24px',
                            fontFamily: "'Inter', sans-serif",
                            zIndex: 2
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(231, 76, 60, 0.3)', color: '#e74c3c', paddingBottom: '4px', marginBottom: '6px' }}>Particle A</div>
                                <div style={{ color: 'rgba(255,255,255,0.8)' }}>Left: {counts.aLeft}</div>
                                <div style={{ color: 'rgba(255,255,255,0.8)' }}>Right: {counts.aRight}</div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(52, 152, 219, 0.3)', color: '#3498db', paddingBottom: '4px', marginBottom: '6px' }}>Particle B</div>
                                <div style={{ color: 'rgba(255,255,255,0.8)' }}>Left: {counts.bLeft}</div>
                                <div style={{ color: 'rgba(255,255,255,0.8)' }}>Right: {counts.bRight}</div>
                            </div>
                        </div>
                    )}
                    {showStopwatch && (
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(20, 20, 30, 0.85)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontFamily: 'monospace',
                            color: '#bf5af2',
                            zIndex: 2
                        }}>
                            <Timer size={16} color="#bf5af2" />
                            <span>{(time * 10).toFixed(1)} ps</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Left Panel - Particle A Settings */}
            <div style={{
                position: 'absolute',
                top: '100px',
                left: '20px',
                width: '320px',
                maxHeight: 'calc(100% - 120px)',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <Target size={20} color="#e74c3c" />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Particle A</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Number</span>
                            <span style={{ color: '#e74c3c', fontFamily: 'monospace', fontWeight: 'bold' }}>{configA.count}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="200" 
                            value={configA.count}
                            onChange={(e) => handleConfigChange('A', 'count', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#e74c3c', cursor: 'pointer' }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Mass (amu)</span>
                            <span style={{ color: '#e74c3c', fontFamily: 'monospace', fontWeight: 'bold' }}>{configA.mass}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={configA.mass}
                            onChange={(e) => handleConfigChange('A', 'mass', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#e74c3c', cursor: 'pointer' }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Radius (pm)</span>
                            <span style={{ color: '#e74c3c', fontFamily: 'monospace', fontWeight: 'bold' }}>{configA.radius}</span>
                        </div>
                        <input 
                            type="range" 
                            min="5" 
                            max="30" 
                            value={configA.radius}
                            onChange={(e) => handleConfigChange('A', 'radius', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#e74c3c', cursor: 'pointer' }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Initial Temp (K)</span>
                            <span style={{ color: '#e74c3c', fontFamily: 'monospace', fontWeight: 'bold' }}>{configA.temp}</span>
                        </div>
                        <input 
                            type="range" 
                            min="50" 
                            max="600" 
                            value={configA.temp}
                            onChange={(e) => handleConfigChange('A', 'temp', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#e74c3c', cursor: 'pointer' }}
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel - Particle B Settings & Controls */}
            <div style={{
                position: 'absolute',
                top: '100px',
                right: '20px',
                width: '320px',
                maxHeight: 'calc(100% - 120px)',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto'
            }}>
                {/* Particle B Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <Target size={20} color="#3498db" />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Particle B</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Number</span>
                            <span style={{ color: '#3498db', fontFamily: 'monospace', fontWeight: 'bold' }}>{configB.count}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="200" 
                            value={configB.count}
                            onChange={(e) => handleConfigChange('B', 'count', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Mass (amu)</span>
                            <span style={{ color: '#3498db', fontFamily: 'monospace', fontWeight: 'bold' }}>{configB.mass}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={configB.mass}
                            onChange={(e) => handleConfigChange('B', 'mass', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Radius (pm)</span>
                            <span style={{ color: '#3498db', fontFamily: 'monospace', fontWeight: 'bold' }}>{configB.radius}</span>
                        </div>
                        <input 
                            type="range" 
                            min="5" 
                            max="30" 
                            value={configB.radius}
                            onChange={(e) => handleConfigChange('B', 'radius', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Initial Temp (K)</span>
                            <span style={{ color: '#3498db', fontFamily: 'monospace', fontWeight: 'bold' }}>{configB.temp}</span>
                        </div>
                        <input 
                            type="range" 
                            min="50" 
                            max="600" 
                            value={configB.temp}
                            onChange={(e) => handleConfigChange('B', 'temp', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {/* Controls Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', paddingBottom: '10px', marginTop: '10px' }}>
                    <Settings2 size={20} color="#bf5af2" />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Options</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                        onClick={() => setDividerRemoved(!dividerRemoved)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid',
                            background: dividerRemoved ? 'rgba(230, 126, 34, 0.2)' : 'rgba(191, 90, 242, 0.2)',
                            color: dividerRemoved ? '#f39c12' : '#bf5af2',
                            borderColor: dividerRemoved ? 'rgba(230, 126, 34, 0.4)' : 'rgba(191, 90, 242, 0.4)',
                            fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = dividerRemoved ? 'rgba(230, 126, 34, 0.3)' : 'rgba(191, 90, 242, 0.3)';
                            e.currentTarget.style.borderColor = dividerRemoved ? '#f39c12' : '#bf5af2';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = dividerRemoved ? 'rgba(230, 126, 34, 0.2)' : 'rgba(191, 90, 242, 0.2)';
                            e.currentTarget.style.borderColor = dividerRemoved ? 'rgba(230, 126, 34, 0.4)' : 'rgba(191, 90, 242, 0.4)';
                        }}
                    >
                        {dividerRemoved ? "Insert Divider" : "Remove Divider"}
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={showCenterOfMass}
                                onChange={(e) => setShowCenterOfMass(e.target.checked)}
                                style={{ accentColor: '#3498db', width: '16px', height: '16px', cursor: 'pointer' }} 
                            />
                            Center of Mass
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={showData}
                                onChange={(e) => setShowData(e.target.checked)}
                                style={{ accentColor: '#3498db', width: '16px', height: '16px', cursor: 'pointer' }} 
                            />
                            Data Flow
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={showStopwatch}
                                onChange={(e) => setShowStopwatch(e.target.checked)}
                                style={{ accentColor: '#3498db', width: '16px', height: '16px', cursor: 'pointer' }} 
                            />
                            Stopwatch
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
