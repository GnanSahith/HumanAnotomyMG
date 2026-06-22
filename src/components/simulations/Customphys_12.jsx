import React, { useState, useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { ArrowLeft, RotateCcw, Settings, MoveHorizontal, BarChart2, Maximize, Minimize } from 'lucide-react';

function Customphys_12Inner({ onBack, title = "Hooke's Law" }) {
    // Mode states: 'single', 'parallel', 'series'
    const [mode, setMode] = useState('single');
    
    // Physics parameters
    const [springConstant1, setSpringConstant1] = useState(200); // 100 to 1000 N/m
    const [springConstant2, setSpringConstant2] = useState(200); // 100 to 1000 N/m
    const [appliedForce, setAppliedForce] = useState(0); // -100 to 100 N
    
    // Toggles
    const [showAppliedForce, setShowAppliedForce] = useState(false);
    const [showRestoringForce, setShowRestoringForce] = useState(false);
    const [showDisplacement, setShowDisplacement] = useState(false);
    const [showEquilibrium, setShowEquilibrium] = useState(false);
    const [showValues, setShowValues] = useState(false);
    const [showEnergy, setShowEnergy] = useState(false);
    
    // Derived values for UI
    const [displacement, setDisplacement] = useState(0); // in meters
    const [potentialEnergy, setPotentialEnergy] = useState(0); // in Joules
    
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const massRef = useRef(null);
    const midMassRef = useRef(null); // For series
    
    const PIXELS_PER_METER = 300; // 1m = 300px
    const WALL_X = 150;
    const EQUILIBRIUM_X = 450;
    
    useEffect(() => {
        // Initialize Matter.js Engine
        const engine = Matter.Engine.create();
        engine.world.gravity.y = 0; // No gravity for horizontal spring
        engineRef.current = engine;
        
        const mass = Matter.Bodies.rectangle(EQUILIBRIUM_X, 250, 60, 60, {
            mass: 5, // 5 kg
            frictionAir: 0.1, // Damping so it settles
            friction: 0,
            restitution: 0
        });
        massRef.current = mass;
        
        const midMass = Matter.Bodies.rectangle((WALL_X + EQUILIBRIUM_X) / 2, 250, 20, 40, {
            mass: 1, // 1 kg
            frictionAir: 0.1,
            friction: 0,
            restitution: 0
        });
        midMassRef.current = midMass;
        
        Matter.World.add(engine.world, [mass]);
        
        let reqId;
        const updatePhysics = () => {
            Matter.Engine.update(engine, 1000 / 60);
            
            // Constrain Y positions to 250
            Matter.Body.setPosition(mass, { x: mass.position.x, y: 250 });
            Matter.Body.setVelocity(mass, { x: mass.velocity.x, y: 0 });
            Matter.Body.setPosition(midMass, { x: midMass.position.x, y: 250 });
            Matter.Body.setVelocity(midMass, { x: midMass.velocity.x, y: 0 });
            
            // Calculate forces
            const m1_x = mass.position.x;
            const mid_x = midMass.position.x;
            
            // F_applied is in Newtons. Scale to Matter.js force.
            // In Matter.js, F = m * a. 
            // We'll scale force appropriately to make the simulation stable but visually responsive.
            const forceScale = 0.0005; // Tuned for Matter.js 5kg mass
            
            // Apply Hooke's Law Manually for maximum accuracy and feature parity
            let restoringForce = 0;
            let currentDisplacement = 0;
            
            if (mode === 'single') {
                const k = springConstant1;
                const x_m = (m1_x - EQUILIBRIUM_X) / PIXELS_PER_METER;
                currentDisplacement = x_m;
                
                restoringForce = -k * x_m;
                Matter.Body.applyForce(mass, mass.position, { 
                    x: (restoringForce + appliedForce) * forceScale, 
                    y: 0 
                });
                
                setPotentialEnergy(0.5 * k * x_m * x_m);
                
            } else if (mode === 'parallel') {
                const k_eq = springConstant1 + springConstant2;
                const x_m = (m1_x - EQUILIBRIUM_X) / PIXELS_PER_METER;
                currentDisplacement = x_m;
                
                restoringForce = -k_eq * x_m;
                Matter.Body.applyForce(mass, mass.position, { 
                    x: (restoringForce + appliedForce) * forceScale, 
                    y: 0 
                });
                
                setPotentialEnergy(0.5 * k_eq * x_m * x_m);
                
            } else if (mode === 'series') {
                const eq_mid = (WALL_X + EQUILIBRIUM_X) / 2;
                const x_mid_m = (mid_x - eq_mid) / PIXELS_PER_METER;
                const x_m = (m1_x - EQUILIBRIUM_X) / PIXELS_PER_METER;
                currentDisplacement = x_m;
                
                // Spring 1 (Wall to mid)
                const F_s1 = -springConstant1 * x_mid_m;
                // Spring 2 (Mid to mass)
                const ext_s2 = (m1_x - mid_x) - (EQUILIBRIUM_X - eq_mid);
                const ext_s2_m = ext_s2 / PIXELS_PER_METER;
                const F_s2 = -springConstant2 * ext_s2_m;
                
                restoringForce = F_s2; // Force exerted by spring 2 on the mass
                
                // Forces on mid mass
                Matter.Body.applyForce(midMass, midMass.position, { 
                    x: (F_s1 - F_s2) * forceScale, 
                    y: 0 
                });
                
                // Forces on main mass
                Matter.Body.applyForce(mass, mass.position, { 
                    x: (F_s2 + appliedForce) * forceScale, 
                    y: 0 
                });
                
                setPotentialEnergy(0.5 * springConstant1 * x_mid_m * x_mid_m + 0.5 * springConstant2 * ext_s2_m * ext_s2_m);
            }
            
            setDisplacement(currentDisplacement);
            drawCanvas();
            reqId = requestAnimationFrame(updatePhysics);
        };
        
        updatePhysics();
        
        return () => {
            cancelAnimationFrame(reqId);
            Matter.Engine.clear(engine);
        };
    }, [mode, springConstant1, springConstant2, appliedForce, showAppliedForce, showRestoringForce, showDisplacement, showEquilibrium, showValues]);
    
    // Change world bodies on mode switch
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;
        
        Matter.World.clear(engine.world);
        Matter.Body.setPosition(massRef.current, { x: EQUILIBRIUM_X, y: 250 });
        Matter.Body.setVelocity(massRef.current, { x: 0, y: 0 });
        
        if (mode === 'series') {
            Matter.Body.setPosition(midMassRef.current, { x: (WALL_X + EQUILIBRIUM_X) / 2, y: 250 });
            Matter.Body.setVelocity(midMassRef.current, { x: 0, y: 0 });
            Matter.World.add(engine.world, [massRef.current, midMassRef.current]);
        } else {
            Matter.World.add(engine.world, [massRef.current]);
        }
    }, [mode]);
    
    function drawCanvas() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const m_x = massRef.current.position.x;
        const mid_x = midMassRef.current?.position.x;
        
        // Draw Wall
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(WALL_X - 20, 100, 20, 300);
        
        // Draw Floor line
        ctx.beginPath();
        ctx.moveTo(WALL_X, 280);
        ctx.lineTo(width - 50, 280);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw Equilibrium Line
        if (showEquilibrium) {
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(EQUILIBRIUM_X, 150);
            ctx.lineTo(EQUILIBRIUM_X, 350);
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Helper: Draw Spring
        const drawSpring = (x1, y1, x2, y2, coils, color = '#bdc3c7', radius = 15) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + 10, y1);
            const dx = (x2 - x1 - 20) / (coils * 2);
            for (let i = 0; i < coils; i++) {
                ctx.lineTo(x1 + 10 + dx * (2 * i + 0.5), y1 - radius);
                ctx.lineTo(x1 + 10 + dx * (2 * i + 1.5), y1 + radius);
            }
            ctx.lineTo(x2 - 10, y2);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.stroke();
        };
        
        // Draw Springs based on mode
        if (mode === 'single') {
            drawSpring(WALL_X, 250, m_x - 30, 250, 10, '#3498db');
        } else if (mode === 'parallel') {
            drawSpring(WALL_X, 230, m_x - 30, 230, 10, '#3498db', 10);
            drawSpring(WALL_X, 270, m_x - 30, 270, 10, '#e74c3c', 10);
        } else if (mode === 'series') {
            drawSpring(WALL_X, 250, mid_x - 10, 250, 8, '#3498db');
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(mid_x - 10, 235, 20, 30); // Connector block
            drawSpring(mid_x + 10, 250, m_x - 30, 250, 8, '#e74c3c');
        }
        
        // Draw Mass
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(m_x - 30, 220, 60, 60);
        ctx.strokeStyle = '#d4ac0d';
        ctx.lineWidth = 4;
        ctx.strokeRect(m_x - 30, 220, 60, 60);
        
        // Draw Vectors
        const drawArrow = (x, y, force, color) => {
            if (force === 0) return;
            const arrowLength = force * 2; // Scale vector visually
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + arrowLength, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.stroke();
            
            // Arrowhead
            const dir = force > 0 ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(x + arrowLength, y);
            ctx.lineTo(x + arrowLength - dir * 10, y - 10);
            ctx.lineTo(x + arrowLength - dir * 10, y + 10);
            ctx.fillStyle = color;
            ctx.fill();
            
            if (showValues) {
                ctx.fillStyle = color;
                ctx.font = '16px Arial';
                ctx.fillText(`${Math.abs(force).toFixed(0)} N`, x + arrowLength / 2 - 15, y - 15);
            }
        };
        
        if (showAppliedForce) {
            drawArrow(m_x + 30, 250, appliedForce, '#e67e22'); // Applied force on right edge
        }
        
        if (showRestoringForce) {
            let restForce = 0;
            const x_m = (m_x - EQUILIBRIUM_X) / PIXELS_PER_METER;
            if (mode === 'single') restForce = -springConstant1 * x_m;
            else if (mode === 'parallel') restForce = -(springConstant1 + springConstant2) * x_m;
            else if (mode === 'series') restForce = -appliedForce; // In equilibrium, restoring matches applied roughly, wait exact is F_s2
            
            // Calculate exact from displacement
            if (mode === 'series') {
                const mid_x_m = (mid_x - (WALL_X + EQUILIBRIUM_X) / 2) / PIXELS_PER_METER;
                const ext_s2_m = x_m - mid_x_m;
                restForce = -springConstant2 * ext_s2_m;
            }
            
            drawArrow(m_x - 30, 250, restForce, '#9b59b6'); // Restoring force on left edge
        }
        
        if (showDisplacement) {
            ctx.beginPath();
            ctx.moveTo(EQUILIBRIUM_X, 320);
            ctx.lineTo(m_x, 320);
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Arrowhead
            if (Math.abs(m_x - EQUILIBRIUM_X) > 5) {
                const dir = m_x > EQUILIBRIUM_X ? 1 : -1;
                ctx.beginPath();
                ctx.moveTo(m_x, 320);
                ctx.lineTo(m_x - dir * 8, 312);
                ctx.lineTo(m_x - dir * 8, 328);
                ctx.fillStyle = '#2ecc71';
                ctx.fill();
            }
            
            if (showValues && Math.abs(displacement) > 0.001) {
                ctx.fillStyle = '#2ecc71';
                ctx.font = '16px Arial';
                ctx.fillText(`${displacement.toFixed(3)} m`, (EQUILIBRIUM_X + m_x)/2 - 20, 345);
            }
        }
    };
    
    return (
        <div style={{
            width: '100%', height: '100%', background: 'transparent',
            color: 'white', fontFamily: "'Inter', sans-serif",
            display: 'flex', flexDirection: 'column', paddingTop: '80px',
            position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {/* Main Simulation Area */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    padding: '20px',
                    paddingRight: '340px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                }}>
                    <div style={{ position: 'relative', width: '800px', height: '500px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}>
                    
                    {/* Energy Bar Chart Overlay */}
                    {showEnergy && (
                        <div style={{
                            position: 'absolute', top: 20, left: 20,
                            background: 'rgba(0,0,0,0.6)', padding: '15px',
                            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#bdc3c7' }}>Energy</h3>
                            <div style={{
                                width: '40px', height: '150px', background: 'rgba(255,255,255,0.1)',
                                borderRadius: '5px', position: 'relative', overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                <div style={{
                                    position: 'absolute', bottom: 0, width: '100%',
                                    height: `${Math.min(potentialEnergy * 2, 100)}%`, // Scale appropriately
                                    background: '#3498db', transition: 'height 0.1s'
                                }} />
                            </div>
                            <span style={{ marginTop: '10px', fontSize: '12px' }}>
                                {potentialEnergy.toFixed(1)} J
                            </span>
                        </div>
                    )}
                    
                    <canvas 
                        ref={canvasRef} 
                        width={800} 
                        height={500} 
                        style={{ flex: 1, width: '100%', objectFit: 'contain' }}
                    />
                    
                    {/* Bottom Controls */}
                    <div style={{
                        padding: '20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, maxWidth: '400px' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Applied Force: {appliedForce} N</span>
                            </label>
                            <input 
                                type="range" min="-100" max="100" step="1" 
                                value={appliedForce} 
                                onChange={(e) => setAppliedForce(Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', fontSize: '12px' }}>
                                <span>-100 N</span>
                                <span>0</span>
                                <span>100 N</span>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                
                {/* Right Side Panel */}
                <aside style={{
                    position: 'absolute',
                    top: '90px',
                    right: '20px',
                    width: '300px',
                    maxHeight: 'calc(100% - 180px)',
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
                    gap: '25px',
                    overflowY: 'auto'
                }}>
                    
                    {/* Mode Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Systems</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['single', 'parallel', 'series'].map((m) => (
                                <button key={m} onClick={() => setMode(m)} style={{
                                    flex: 1, padding: '8px 0', borderRadius: '6px', cursor: 'pointer',
                                    background: mode === m ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                    color: 'white', border: 'none', textTransform: 'capitalize',
                                    fontWeight: mode === m ? 'bold' : 'normal', transition: 'all 0.2s'
                                }}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Constants Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span>Spring Constant 1</span>
                                <span style={{ color: '#3498db' }}>{springConstant1} N/m</span>
                            </label>
                            <input 
                                type="range" min="100" max="1000" step="10" 
                                value={springConstant1} 
                                onChange={(e) => setSpringConstant1(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#3498db' }}
                            />
                        </div>
                        
                        {mode !== 'single' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span>Spring Constant 2</span>
                                    <span style={{ color: '#e74c3c' }}>{springConstant2} N/m</span>
                                </label>
                                <input 
                                    type="range" min="100" max="1000" step="10" 
                                    value={springConstant2} 
                                    onChange={(e) => setSpringConstant2(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#e74c3c' }}
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Visibility</h3>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showAppliedForce} onChange={e => setShowAppliedForce(e.target.checked)} style={{ accentColor: '#e67e22', width: '18px', height: '18px' }} />
                            <span>Applied Force</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showRestoringForce} onChange={e => setShowRestoringForce(e.target.checked)} style={{ accentColor: '#9b59b6', width: '18px', height: '18px' }} />
                            <span>Restoring Force</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showDisplacement} onChange={e => setShowDisplacement(e.target.checked)} style={{ accentColor: '#2ecc71', width: '18px', height: '18px' }} />
                            <span>Displacement</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showEquilibrium} onChange={e => setShowEquilibrium(e.target.checked)} style={{ accentColor: '#2ecc71', width: '18px', height: '18px' }} />
                            <span>Equilibrium Position</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showValues} onChange={e => setShowValues(e.target.checked)} style={{ accentColor: '#f1c40f', width: '18px', height: '18px' }} />
                            <span>Values</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showEnergy} onChange={e => setShowEnergy(e.target.checked)} style={{ accentColor: '#3498db', width: '18px', height: '18px' }} />
                            <span>Energy Plot</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}


export default function Customphys_12({ onBack, title }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                {onBack ? (
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                        ← Back
                    </button>
                ) : <div />}
                <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
                    {title || 'Simulation'}
                </h1>
                <div style={{ width: '100px' }}></div>
            </div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }}>
                 <Customphys_12Inner onBack={null} title={""} />
            </div>
        </div>
    );
}
