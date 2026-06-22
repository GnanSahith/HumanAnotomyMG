import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, Flame, Snowflake, Atom, ArrowLeft, Droplets, Wind, Box } from 'lucide-react';

export default function CustomStatesOfMatter({ onBack, title }) {
    const [isPlaying, setIsPlaying] = useState(true);
    
    // Core Parameters
    const [substance, setSubstance] = useState('Neon');
    const [temperature, setTemperature] = useState(20); // K (relative representation)
    const [phase, setPhase] = useState('Solid');
    
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const particlesRef = useRef([]);

    // Physical constants for substances
    const substances = {
        Neon: { mass: 20, radius: 10, epsilon: 1.5, sigma: 25, color: '#ff3b30' },
        Argon: { mass: 40, radius: 12, epsilon: 2.0, sigma: 30, color: '#34c759' },
        Oxygen: { mass: 32, radius: 14, epsilon: 1.8, sigma: 32, color: '#007aff' },
        Water: { mass: 18, radius: 16, epsilon: 3.0, sigma: 35, color: '#5ac8fa' } // Simplification for water
    };

    const containerWidth = 600;
    const containerHeight = 600;
    
    // Temperature change bounds
    const MIN_TEMP = 1;
    const MAX_TEMP = 1000;

    const initParticles = (currentPhase, currentSubstance, currentTemp) => {
        const subParams = substances[currentSubstance];
        let p = [];
        const numParticles = 80;
        
        const spacing = subParams.sigma * 1.1; // equilibrium distance
        
        let tempFactor = currentTemp;

        if (currentPhase === 'Custom' && particlesRef.current && particlesRef.current.length > 0) {
            p = particlesRef.current;
        } else if (currentPhase === 'Solid') {
            tempFactor = 10;
            const cols = Math.floor(Math.sqrt(numParticles));
            const rows = Math.ceil(numParticles / cols);
            const startX = (containerWidth - cols * spacing) / 2;
            const startY = containerHeight - rows * spacing - 20;

            let count = 0;
            for (let i = 0; i < rows && count < numParticles; i++) {
                for (let j = 0; j < cols && count < numParticles; j++) {
                    p.push({
                        x: startX + j * spacing,
                        y: startY + i * spacing,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5
                    });
                    count++;
                }
            }
        } else if (currentPhase === 'Liquid') {
            tempFactor = 150;
            for (let i = 0; i < numParticles; i++) {
                p.push({
                    x: Math.random() * (containerWidth - subParams.radius * 2) + subParams.radius,
                    y: containerHeight - Math.random() * (containerHeight / 2) - subParams.radius,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4
                });
            }
        } else if (currentPhase === 'Gas') {
            tempFactor = 600;
            for (let i = 0; i < numParticles; i++) {
                p.push({
                    x: Math.random() * (containerWidth - subParams.radius * 2) + subParams.radius,
                    y: Math.random() * (containerHeight - subParams.radius * 2) + subParams.radius,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15
                });
            }
        }
        
        setTemperature(tempFactor);
        particlesRef.current = p;
    };

    useEffect(() => {
        initParticles(phase, substance, temperature);
    }, [phase, substance]);

    const updatePhysics = () => {
        if (!isPlaying) {
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const subParams = substances[substance];
        const p = particlesRef.current;
        const dt = 0.5; // time step
        
        // Reset forces
        let forces = p.map(() => ({ fx: 0, fy: 0 }));

        // Calculate Lennard-Jones forces (simplified)
        for (let i = 0; i < p.length; i++) {
            forces[i].fy += 0.05 * subParams.mass; // small gravity

            for (let j = i + 1; j < p.length; j++) {
                let dx = p[i].x - p[j].x;
                let dy = p[i].y - p[j].y;
                if (dx === 0 && dy === 0) {
                    dx = (Math.random() - 0.5) * 0.1;
                    dy = (Math.random() - 0.5) * 0.1;
                }
                let distSq = dx * dx + dy * dy;
                let trueDist = Math.sqrt(distSq);
                
                // Prevent division by zero and extreme forces
                if (distSq < 1) distSq = 1;
                
                let dist = Math.sqrt(distSq);
                
                // Only compute force if close enough (cutoff radius)
                if (dist < subParams.sigma * 3) {
                    // LJ Force derivative simplified
                    let r6 = Math.pow(subParams.sigma / dist, 6);
                    let forceMag = 24 * subParams.epsilon * (2 * r6 * r6 - r6) / dist;
                    
                    // Cap max force to avoid explosions
                    if (forceMag > 50) forceMag = 50;
                    if (forceMag < -50) forceMag = -50;
                    
                    let fx = forceMag * (dx / trueDist);
                    let fy = forceMag * (dy / trueDist);
                    
                    forces[i].fx += fx;
                    forces[i].fy += fy;
                    forces[j].fx -= fx;
                    forces[j].fy -= fy;
                }
            }
        }

        let totalKE = 0;

        // Apply forces & integrate
        for (let i = 0; i < p.length; i++) {
            // Update velocity
            p[i].vx += (forces[i].fx / subParams.mass) * dt;
            p[i].vy += (forces[i].fy / subParams.mass) * dt;
            
            // Temperature scaling (thermostat to maintain target temp)
            let currentTempEstimate = (p[i].vx * p[i].vx + p[i].vy * p[i].vy) * subParams.mass;
            totalKE += currentTempEstimate;
            
            // Apply bounds
            p[i].x += p[i].vx * dt;
            p[i].y += p[i].vy * dt;
            
            // Wall collisions with some damping
            const damping = 0.9;
            if (p[i].x < subParams.radius) {
                p[i].x = subParams.radius;
                p[i].vx *= -damping;
            } else if (p[i].x > containerWidth - subParams.radius) {
                p[i].x = containerWidth - subParams.radius;
                p[i].vx *= -damping;
            }
            
            if (p[i].y < subParams.radius) {
                p[i].y = subParams.radius;
                p[i].vy *= -damping;
            } else if (p[i].y > containerHeight - subParams.radius) {
                p[i].y = containerHeight - subParams.radius;
                p[i].vy *= -damping;
            }
        }

        // Global thermostat
        const currentAvgTemp = totalKE / p.length;
        if (currentAvgTemp > 0) {
            const scale = Math.sqrt(temperature / currentAvgTemp);
            // Apply scale gently
            const gentleScale = 1.0 + (scale - 1.0) * 0.1;
            for (let i = 0; i < p.length; i++) {
                p[i].vx *= gentleScale;
                p[i].vy *= gentleScale;
            }
        }

        renderCanvas();
        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const subParams = substances[substance];

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const p = particlesRef.current;
        
        // Draw particles
        for (let i = 0; i < p.length; i++) {
            ctx.beginPath();
            ctx.arc(p[i].x, p[i].y, subParams.radius, 0, Math.PI * 2);
            
            // Fill with radial gradient for a sphere look
            let grad = ctx.createRadialGradient(
                p[i].x - subParams.radius * 0.3, 
                p[i].y - subParams.radius * 0.3, 
                subParams.radius * 0.1,
                p[i].x, p[i].y, subParams.radius
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, subParams.color);
            
            ctx.fillStyle = grad;
            ctx.fill();
        }
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, substance, temperature]);

    // Handle Heat/Cool
    const applyHeat = () => {
        setTemperature(prev => Math.min(MAX_TEMP, prev + 50));
        setPhase('Custom');
    };
    
    const applyCool = () => {
        setTemperature(prev => Math.max(MIN_TEMP, prev - 50));
        setPhase('Custom');
    };

    const getButtonSubstanceStyle = (sub) => {
        const isSelected = substance === sub;
        const subColor = substances[sub].color;
        return {
            padding: '12px',
            borderRadius: '10px',
            cursor: 'pointer',
            background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            color: '#fff',
            border: `1px solid ${isSelected ? subColor : 'rgba(255, 255, 255, 0.08)'}`,
            boxShadow: isSelected ? `0 0 10px ${subColor}40` : 'none',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            fontFamily: "'Inter', sans-serif"
        };
    };

    const getPhaseButtonStyle = (p) => {
        const isSelected = phase === p;
        let activeColor = '#3498db';
        if (p === 'Liquid') activeColor = '#2ecc71';
        if (p === 'Gas') activeColor = '#f1c40f';

        return {
            padding: '12px',
            borderRadius: '10px',
            cursor: 'pointer',
            background: isSelected ? `${activeColor}20` : 'rgba(255, 255, 255, 0.03)',
            color: '#fff',
            border: `1px solid ${isSelected ? activeColor : 'rgba(255, 255, 255, 0.08)'}`,
            boxShadow: isSelected ? `0 0 10px ${activeColor}30` : 'none',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s ease',
            fontFamily: "'Inter', sans-serif"
        };
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a' }}>
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
                {/* Back Button */}
                {onBack ? (
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
                        <ArrowLeft size={16} /> Back
                    </button>
                ) : <div />}

                {/* Title */}
                <h1 style={{
                    color: 'white',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '24px',
                    fontWeight: '600',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Atom size={28} color="#bf5af2" style={{ filter: 'drop-shadow(0 0 8px rgba(191,90,242,0.6))' }} />
                    {title || 'States of Matter'}
                </h1>

                {/* Play/Pause & Reset Controls */}
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
                        onClick={() => initParticles(phase, substance, temperature)}
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
                    width: `${containerWidth}px`,
                    height: `${containerHeight}px`,
                    border: '4px solid rgba(255,255,255,0.15)',
                    borderTop: 'none',
                    borderRadius: '0 0 24px 24px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 100%)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    pointerEvents: 'auto'
                }}>
                    <canvas 
                        ref={canvasRef}
                        width={containerWidth}
                        height={containerHeight}
                        style={{ position: 'absolute', top: 0, left: 0, borderRadius: '0 0 20px 20px' }}
                    />
                    
                    {/* Thermometer UI in corner */}
                    <div style={{
                        position: 'absolute',
                        right: '-40px',
                        bottom: '0',
                        height: '80%',
                        width: '20px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '100%',
                            height: `${(temperature / MAX_TEMP) * 100}%`,
                            background: temperature > 300 
                                ? 'linear-gradient(180deg, #ff453a, #ff3b30)' 
                                : temperature > 100 
                                ? 'linear-gradient(180deg, #ff9f0a, #ff9500)' 
                                : 'linear-gradient(180deg, #64d2ff, #0a84ff)',
                            transition: 'height 0.3s, background 0.3s',
                            boxShadow: '0 0 10px rgba(255,255,255,0.2)'
                        }}></div>
                    </div>
                </div>
            </div>

            {/* Left Info Panel */}
            <div style={{
                position: 'absolute',
                top: '100px',
                left: '20px',
                width: '280px',
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
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <Atom size={20} color="#bf5af2" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Substance Info</h3>
                </div>
                
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Name:</span>
                        <span style={{ fontWeight: 600, color: substances[substance].color }}>{substance}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Atomic Mass:</span>
                        <span style={{ fontWeight: 600 }}>{substances[substance].mass} u</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Particle Radius:</span>
                        <span style={{ fontWeight: 600 }}>{substances[substance].radius} pm</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Interaction (ε):</span>
                        <span style={{ fontWeight: 600 }}>{substances[substance].epsilon} eV</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Size Parameter (σ):</span>
                        <span style={{ fontWeight: 600 }}>{substances[substance].sigma} pm</span>
                    </div>
                </div>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', fontSize: '13px', lineHeight: '1.4', color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>Current State: {phase}</strong>
                    {phase === 'Solid' && 'Particles are closely packed in a regular lattice structure. They vibrate about fixed positions.'}
                    {phase === 'Liquid' && 'Particles are close together but can move past each other. They have enough energy to break rigid bonds.'}
                    {phase === 'Gas' && 'Particles are far apart and move rapidly in random directions. Intermolecular forces are negligible.'}
                    {phase === 'Custom' && 'User-defined temperature state. Observe how particle motion scales with thermal energy.'}
                </div>
            </div>

            {/* Right Controls Panel */}
            <div style={{
                position: 'absolute',
                top: '100px',
                right: '20px',
                bottom: '20px',
                width: '340px',
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
                gap: '24px',
                maxHeight: 'calc(100% - 120px)',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Simulation Parameters</h3>
                </div>

                {/* Substance Selector */}
                <div>
                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, display: 'block', marginBottom: '12px' }}>Substance</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {Object.keys(substances).map(sub => (
                            <button 
                                key={sub}
                                onClick={() => setSubstance(sub)}
                                style={getButtonSubstanceStyle(sub)}
                                onMouseEnter={e => {
                                    if (substance !== sub) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (substance !== sub) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    }
                                }}
                            >
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: substances[sub].color }} />
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                {/* Phase Buttons */}
                <div>
                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, display: 'block', marginBottom: '12px' }}>State (Phase)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {['Solid', 'Liquid', 'Gas'].map(p => (
                            <button 
                                key={p}
                                onClick={() => setPhase(p)}
                                style={getPhaseButtonStyle(p)}
                                onMouseEnter={e => {
                                    if (phase !== p) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (phase !== p) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    }
                                }}
                            >
                                {p === 'Solid' && <Box size={18} color={phase === 'Solid' ? '#3498db' : '#fff'} />}
                                {p === 'Liquid' && <Droplets size={18} color={phase === 'Liquid' ? '#2ecc71' : '#fff'} />}
                                {p === 'Gas' && <Wind size={18} color={phase === 'Gas' ? '#f1c40f' : '#fff'} />}
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                {/* Temperature Control */}
                <div>
                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, display: 'block', marginBottom: '12px' }}>Temperature Control</label>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <button 
                            onMouseDown={applyCool}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                background: 'rgba(52, 152, 219, 0.1)',
                                color: '#3498db',
                                border: '1px solid rgba(52, 152, 219, 0.2)',
                                fontWeight: 600,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                fontFamily: "'Inter', sans-serif"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(52, 152, 219, 0.2)';
                                e.currentTarget.style.borderColor = 'rgba(52, 152, 219, 0.4)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(52, 152, 219, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(52, 152, 219, 0.2)';
                            }}
                        >
                            <Snowflake size={20} />
                            Cool
                        </button>
                        <button 
                            onMouseDown={applyHeat}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                background: 'rgba(231, 76, 60, 0.1)',
                                color: '#e74c3c',
                                border: '1px solid rgba(231, 76, 60, 0.2)',
                                fontWeight: 600,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                fontFamily: "'Inter', sans-serif"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)';
                                e.currentTarget.style.borderColor = 'rgba(231, 76, 60, 0.4)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(231, 76, 60, 0.2)';
                            }}
                        >
                            <Flame size={20} />
                            Heat
                        </button>
                    </div>
                    
                    {/* Temperature Slider */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Min</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{Math.round(temperature)} K</span>
                            <span>Max</span>
                        </div>
                        <input 
                            type="range"
                            min={MIN_TEMP}
                            max={MAX_TEMP}
                            value={temperature}
                            onChange={(e) => {
                                setTemperature(Number(e.target.value));
                                setPhase('Custom');
                            }}
                            style={{
                                width: '100%',
                                accentColor: '#3498db',
                                cursor: 'pointer',
                                background: 'rgba(255, 255, 255, 0.1)',
                                height: '6px',
                                borderRadius: '3px',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
