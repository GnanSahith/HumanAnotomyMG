import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, Flame, Snowflake, ArrowLeft, Wind, Maximize, Minimize } from 'lucide-react';

export default function CustomGasProperties({ onBack, title }) {
    const [isPlaying, setIsPlaying] = useState(true);
    
    // Core Parameters
    const [temperature, setTemperature] = useState(300); // K
    const [volumeWidth, setVolumeWidth] = useState(400); // Container width
    const [heavyParticles, setHeavyParticles] = useState(50);
    const [lightParticles, setLightParticles] = useState(50);
    const [pressure, setPressure] = useState(0); // Display pressure
    
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const particlesRef = useRef([]);
    const wallCollisionsRef = useRef([]); // Track collisions to calculate pressure
    const lastTimeRef = useRef(performance.now());

    const containerHeight = 400;
    const maxContainerWidth = 600;
    const minContainerWidth = 200;
    
    // Particle constants
    const HEAVY_MASS = 28; // e.g. N2
    const HEAVY_RADIUS = 12;
    const HEAVY_COLOR = '#0a84ff';
    
    const LIGHT_MASS = 4;  // e.g. He
    const LIGHT_RADIUS = 8;
    const LIGHT_COLOR = '#ff375f';

    const initParticles = () => {
        let p = [];
        
        // Add Heavy Particles
        for (let i = 0; i < heavyParticles; i++) {
            p.push({
                x: Math.random() * (volumeWidth - HEAVY_RADIUS * 2) + HEAVY_RADIUS,
                y: Math.random() * (containerHeight - HEAVY_RADIUS * 2) + HEAVY_RADIUS,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                mass: HEAVY_MASS,
                radius: HEAVY_RADIUS,
                color: HEAVY_COLOR
            });
        }
        
        // Add Light Particles
        for (let i = 0; i < lightParticles; i++) {
            p.push({
                x: Math.random() * (volumeWidth - LIGHT_RADIUS * 2) + LIGHT_RADIUS,
                y: Math.random() * (containerHeight - LIGHT_RADIUS * 2) + LIGHT_RADIUS,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                mass: LIGHT_MASS,
                radius: LIGHT_RADIUS,
                color: LIGHT_COLOR
            });
        }
        
        particlesRef.current = p;
        wallCollisionsRef.current = [];
        scaleVelocitiesToTemperature(p, temperature);
    };

    const scaleVelocitiesToTemperature = (p, targetTemp) => {
        if (p.length === 0) return;
        let totalKE = 0;
        for (let i = 0; i < p.length; i++) {
            totalKE += 0.5 * p[i].mass * (p[i].vx * p[i].vx + p[i].vy * p[i].vy);
        }
        const currentTemp = totalKE / p.length || 1;
        const scale = Math.sqrt(targetTemp / currentTemp);
        
        for (let i = 0; i < p.length; i++) {
            p[i].vx *= scale;
            p[i].vy *= scale;
        }
    };

    useEffect(() => {
        initParticles();
    }, [heavyParticles, lightParticles]);

    // Apply temperature changes dynamically
    useEffect(() => {
        scaleVelocitiesToTemperature(particlesRef.current, temperature);
    }, [temperature]);

    const updatePhysics = (time) => {
        if (!isPlaying) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const dt = Math.min((time - lastTimeRef.current) / 16, 2); // Cap dt
        lastTimeRef.current = time;
        const p = particlesRef.current;
        
        let momentumChange = 0;

        // Move and collide with walls
        for (let i = 0; i < p.length; i++) {
            p[i].x += p[i].vx * dt;
            p[i].y += p[i].vy * dt;
            
            // Wall collisions
            if (p[i].x < p[i].radius) {
                p[i].x = p[i].radius;
                p[i].vx *= -1;
                momentumChange += 2 * p[i].mass * Math.abs(p[i].vx);
            } else if (p[i].x > volumeWidth - p[i].radius) {
                p[i].x = volumeWidth - p[i].radius;
                p[i].vx *= -1;
                momentumChange += 2 * p[i].mass * Math.abs(p[i].vx);
            }
            
            if (p[i].y < p[i].radius) {
                p[i].y = p[i].radius;
                p[i].vy *= -1;
                momentumChange += 2 * p[i].mass * Math.abs(p[i].vy);
            } else if (p[i].y > containerHeight - p[i].radius) {
                p[i].y = containerHeight - p[i].radius;
                p[i].vy *= -1;
                momentumChange += 2 * p[i].mass * Math.abs(p[i].vy);
            }
        }

        // Particle-Particle Collisions (O(n^2) optimized slightly)
        for (let i = 0; i < p.length; i++) {
            for (let j = i + 1; j < p.length; j++) {
                let dx = p[j].x - p[i].x;
                let dy = p[j].y - p[i].y;
                let distSq = dx * dx + dy * dy;
                let minDist = p[i].radius + p[j].radius;
                
                if (distSq < minDist * minDist) {
                    let dist = Math.sqrt(distSq);
                    if (dist === 0) continue;
                    
                    // Normal vector
                    let nx = dx / dist;
                    let ny = dy / dist;
                    
                    // Relative velocity
                    let dvx = p[j].vx - p[i].vx;
                    let dvy = p[j].vy - p[i].vy;
                    
                    // Velocity along normal
                    let velAlongNormal = dvx * nx + dvy * ny;
                    
                    // Do not resolve if velocities are separating
                    if (velAlongNormal > 0) continue;
                    
                    // Restitution (elastic)
                    let e = 1.0;
                    
                    // Impulse scalar
                    let jImpulse = -(1 + e) * velAlongNormal;
                    jImpulse /= (1 / p[i].mass + 1 / p[j].mass);
                    
                    // Apply impulse
                    let impulseX = jImpulse * nx;
                    let impulseY = jImpulse * ny;
                    
                    p[i].vx -= (1 / p[i].mass) * impulseX;
                    p[i].vy -= (1 / p[i].mass) * impulseY;
                    p[j].vx += (1 / p[j].mass) * impulseX;
                    p[j].vy += (1 / p[j].mass) * impulseY;
                    
                    // Positional correction to prevent sticking
                    let percent = 0.8; // penetration percentage to correct
                    let slop = 0.1; // penetration allowance
                    let penetration = minDist - dist;
                    let correctionMagnitude = Math.max(penetration - slop, 0.0) / (1 / p[i].mass + 1 / p[j].mass) * percent;
                    let cx = nx * correctionMagnitude;
                    let cy = ny * correctionMagnitude;
                    
                    p[i].x -= (1 / p[i].mass) * cx;
                    p[i].y -= (1 / p[i].mass) * cy;
                    p[j].x += (1 / p[j].mass) * cx;
                    p[j].y += (1 / p[j].mass) * cy;
                }
            }
        }

        // Pressure calculation (running average)
        wallCollisionsRef.current.push(momentumChange);
        if (wallCollisionsRef.current.length > 30) wallCollisionsRef.current.shift();
        
        let avgMomentum = wallCollisionsRef.current.reduce((a, b) => a + b, 0) / wallCollisionsRef.current.length;
        // P = F/A ~ avgMomentum / Area (proportional to volumeWidth)
        let calcPressure = (avgMomentum * 10) / (volumeWidth * containerHeight);
        setPressure(calcPressure.toFixed(2));

        renderCanvas();
        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const p = particlesRef.current;
        
        for (let i = 0; i < p.length; i++) {
            ctx.beginPath();
            ctx.arc(p[i].x, p[i].y, p[i].radius, 0, Math.PI * 2);
            
            let grad = ctx.createRadialGradient(
                p[i].x - p[i].radius * 0.3, 
                p[i].y - p[i].radius * 0.3, 
                p[i].radius * 0.1,
                p[i].x, p[i].y, p[i].radius
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, p[i].color);
            
            ctx.fillStyle = grad;
            ctx.fill();
        }
        
        // Draw the right wall to show volume
        ctx.beginPath();
        ctx.moveTo(volumeWidth, 0);
        ctx.lineTo(volumeWidth, containerHeight);
        ctx.strokeStyle = '#bf5af2';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw volume indicator handle
        ctx.fillStyle = '#bf5af2';
        ctx.fillRect(volumeWidth - 10, containerHeight / 2 - 20, 20, 40);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, volumeWidth]); // Re-bind if isPlaying or volumeWidth changes

    const applyHeat = () => setTemperature(prev => Math.min(1000, prev + 50));
    const applyCool = () => setTemperature(prev => Math.max(50, prev - 50));
    
    const increaseVolume = () => setVolumeWidth(prev => Math.min(maxContainerWidth, prev + 50));
    const decreaseVolume = () => {
        setVolumeWidth(prev => {
            const newVol = Math.max(minContainerWidth, prev - 50);
            // Push particles inside new boundary
            particlesRef.current.forEach(p => {
                if (p.x > newVol - p.radius) p.x = newVol - p.radius;
            });
            return newVol;
        });
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
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ padding: '8px', background: 'rgba(191,90,242,0.2)', borderRadius: '12px', border: '1px solid rgba(191,90,242,0.3)', display: 'flex', alignItems: 'center' }}>
                        <Wind size={24} color="#bf5af2" />
                    </div>
                    {title || 'Gas Properties MG'}
                </h2>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={initParticles}
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

            {/* Left Control Panel: Playback and Volume */}
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
                    Playback
                </h3>
                
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
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
                        fontWeight: '600',
                        marginBottom: '20px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isPlaying ? 'rgba(231, 76, 60, 0.4)' : 'rgba(46, 204, 113, 0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isPlaying ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)'; }}
                >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isPlaying ? 'Pause' : 'Play'}
                </button>

                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Volume Control
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                        onClick={decreaseVolume}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            transition: 'all 0.2s',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '600'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Minimize size={18} /> Shrink
                    </button>
                    <button 
                        onClick={increaseVolume}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            transition: 'all 0.2s',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '600'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Maximize size={18} /> Expand
                    </button>
                </div>
            </div>

            {/* Right Control Panel: Particles and Temperature */}
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
                    Particles
                </h3>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#0a84ff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0a84ff' }}></div> Heavy
                        </span>
                        <span style={{ fontSize: '14px', color: '#0a84ff', fontWeight: 700 }}>{heavyParticles}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="150" 
                        value={heavyParticles} 
                        onChange={e => setHeavyParticles(parseInt(e.target.value))} 
                        style={{ width: '100%', accentColor: '#0a84ff', cursor: 'pointer' }} 
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#ff375f', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff375f' }}></div> Light
                        </span>
                        <span style={{ fontSize: '14px', color: '#ff375f', fontWeight: 700 }}>{lightParticles}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="150" 
                        value={lightParticles} 
                        onChange={e => setLightParticles(parseInt(e.target.value))} 
                        style={{ width: '100%', accentColor: '#ff375f', cursor: 'pointer' }} 
                    />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Temperature
                </h3>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onMouseDown={applyCool}
                        style={{
                            flex: 1, 
                            padding: '16px', 
                            borderRadius: '12px', 
                            cursor: 'pointer',
                            background: 'rgba(10,132,255,0.1)', 
                            color: '#0a84ff', 
                            border: '1px solid rgba(10,132,255,0.3)',
                            fontWeight: '600', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(10,132,255,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,132,255,0.1)'; }}
                    >
                        <Snowflake size={24} /> Cool
                    </button>
                    <button 
                        onMouseDown={applyHeat}
                        style={{
                            flex: 1, 
                            padding: '16px', 
                            borderRadius: '12px', 
                            cursor: 'pointer',
                            background: 'rgba(255,59,48,0.1)', 
                            color: '#ff3b30', 
                            border: '1px solid rgba(255,59,48,0.3)',
                            fontWeight: '600', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.1)'; }}
                    >
                        <Flame size={24} /> Heat
                    </button>
                </div>
                
                <div style={{ 
                    background: 'rgba(0,0,0,0.5)', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', fontFamily: 'monospace' }}>
                        {Math.round(temperature)} K
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Temperature</div>
                </div>
            </div>

            {/* Canvas Area Container */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#050508'
            }}>
                <div style={{
                    position: 'relative',
                    width: `${maxContainerWidth}px`,
                    height: `${containerHeight}px`,
                    border: '4px solid rgba(255,255,255,0.2)',
                    borderRight: 'none',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 100%)',
                    borderRadius: '12px 0 0 12px',
                    overflow: 'hidden'
                }}>
                    <canvas 
                        ref={canvasRef}
                        width={maxContainerWidth}
                        height={containerHeight}
                        style={{ position: 'absolute', top: 0, left: 0 }}
                    />
                    
                    {/* Pressure Gauge */}
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(20, 20, 30, 0.8)',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        Pressure: {pressure} atm
                    </div>
                </div>
            </div>
        </div>
    );
}
