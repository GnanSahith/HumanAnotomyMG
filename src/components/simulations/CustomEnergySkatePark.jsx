import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Play, Pause, FastForward, GripHorizontal } from 'lucide-react';

const CustomEnergySkatePark = ({ onBack, title }) => {
    const canvasRef = useRef(null);
    const barsRef = useRef(null);
    const pieRef = useRef(null);
    const requestRef = useRef();

    // UI Toggles
    const [showPieChart, setShowPieChart] = useState(true);
    const [showBarGraph, setShowBarGraph] = useState(true);
    const [showGrid, setShowGrid] = useState(false);
    
    // Sliders
    const [friction, setFriction] = useState(0); // 0 to 0.5
    const [gravity, setGravity] = useState(9.8);
    const [mass, setMass] = useState(50); // kg

    const stateRef = useRef({
        p1: { x: 100, y: 150 },
        p2: { x: 400, y: 450 },
        p3: { x: 700, y: 200 },
        skater: {
            x: 100,
            y: 150,
            vx: 0,
            vy: 0,
            vPath: 0,
            isAirborne: false,
            dragging: false
        },
        thermalEnergy: 0,
        isPlaying: true,
        dragTarget: null, // 'p1', 'p2', 'p3', or 'skater'
        lastMouseX: 0,
        lastMouseY: 0
    });

    const fitParabola = (p1, p2, p3) => {
        const denom = (p1.x - p2.x) * (p1.x - p3.x) * (p2.x - p3.x);
        if (Math.abs(denom) < 0.1) return { A: 0, B: 0, C: p1.y };
        const A = (p3.x * (p2.y - p1.y) + p2.x * (p1.y - p3.y) + p1.x * (p3.y - p2.y)) / denom;
        const B = (p3.x * p3.x * (p1.y - p2.y) + p2.x * p2.x * (p3.y - p1.y) + p1.x * p1.x * (p2.y - p3.y)) / denom;
        const C = (p2.x * p3.x * (p2.x - p3.x) * p1.y + p3.x * p1.x * (p3.x - p1.x) * p2.y + p1.x * p2.x * (p1.x - p2.x) * p3.y) / denom;
        return { A, B, C };
    };

    const updateDOM = () => {
        const s = stateRef.current;
        const sk = s.skater;
        
        // Calculate Energies
        // Max height is 0 (top of screen), ground is say 600
        const h = 600 - sk.y; 
        let pe = mass * gravity * h * 0.05; // scaled down
        if (pe < 0) pe = 0;
        
        let ke = 0;
        if (sk.isAirborne) {
            ke = 0.5 * mass * (sk.vx * sk.vx + sk.vy * sk.vy) * 0.05;
        } else {
            ke = 0.5 * mass * (sk.vPath * sk.vPath) * 0.05;
        }

        const te = s.thermalEnergy;
        const total = pe + ke + te;

        // Update Bar Graph
        if (showBarGraph) {
            const DOM_KE = document.getElementById('bar-ke');
            const DOM_PE = document.getElementById('bar-pe');
            const DOM_TE = document.getElementById('bar-te');
            const DOM_TOT = document.getElementById('bar-tot');
            
            const maxE = 150000; // arbitrary max scaling
            
            const pHeight = Math.min(100, (pe / maxE) * 100);
            const kHeight = Math.min(100, (ke / maxE) * 100);
            const tHeight = Math.min(100, (te / maxE) * 100);
            const totHeight = Math.min(100, (total / maxE) * 100);

            if (DOM_KE) {
                DOM_KE.style.height = `${kHeight}%`; // Kinetic (Green)
                DOM_PE.style.height = `${pHeight}%`; // Potential (Blue)
                DOM_TE.style.height = `${tHeight}%`; // Thermal (Red)
                DOM_TOT.style.height = `${totHeight}%`; // Total (Yellow)
            }
        }

        // We can draw Pie chart on Canvas so it tracks skater perfectly!
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawGrid = (width, height) => {
            if (!showGrid) return;
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x <= width; x += 50) {
                ctx.moveTo(x, 0); ctx.lineTo(x, height);
            }
            for (let y = 0; y <= height; y += 50) {
                ctx.moveTo(0, y); ctx.lineTo(width, y);
            }
            ctx.stroke();
        };

        const drawPieChart = (x, y, radius, pe, ke, te) => {
            if (!showPieChart) return;
            const total = pe + ke + te;
            if (total === 0) return;

            const pAng = (pe / total) * Math.PI * 2;
            const kAng = (ke / total) * Math.PI * 2;
            const tAng = (te / total) * Math.PI * 2;

            let startAngle = -Math.PI / 2;

            // Potential (Blue)
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, startAngle, startAngle + pAng);
            ctx.fillStyle = '#3498db';
            ctx.fill();
            startAngle += pAng;

            // Kinetic (Green)
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, startAngle, startAngle + kAng);
            ctx.fillStyle = '#2ecc71';
            ctx.fill();
            startAngle += kAng;

            // Thermal (Red)
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, startAngle, startAngle + tAng);
            ctx.fillStyle = '#e74c3c';
            ctx.fill();
        };

        const animate = () => {
            const width = canvas.width;
            const height = canvas.height;
            const s = stateRef.current;
            const sk = s.skater;

            // Physics Step
            if (s.isPlaying && !sk.dragging) {
                const dt = 0.5; // time step
                const { A, B, C } = fitParabola(s.p1, s.p2, s.p3);

                if (sk.isAirborne) {
                    sk.vy += gravity * 0.1 * dt; // scaled gravity
                    sk.x += sk.vx * dt;
                    sk.y += sk.vy * dt;

                    // Check collision with track
                    if (sk.x >= s.p1.x && sk.x <= s.p3.x) {
                        const trackY = A * sk.x * sk.x + B * sk.x + C;
                        if (sk.y >= trackY && sk.vy > 0) {
                            // Landed on track
                            sk.isAirborne = false;
                            sk.y = trackY;
                            const slope = 2 * A * sk.x + B;
                            const theta = Math.atan(slope);
                            // Project velocity onto track
                            sk.vPath = sk.vx * Math.cos(theta) + sk.vy * Math.sin(theta);
                            sk.vx = 0; sk.vy = 0;
                        }
                    }
                    
                    // Ground collision
                    if (sk.y > 600) {
                        sk.y = 600;
                        sk.vy = 0;
                        sk.vx *= 0.9; // friction on ground
                    }

                } else {
                    // On Track Physics
                    const slope = 2 * A * sk.x + B;
                    const theta = Math.atan(slope);
                    
                    // a = g*sin(theta)
                    let a = -gravity * 0.1 * Math.sin(theta);
                    
                    // Friction
                    if (friction > 0 && Math.abs(sk.vPath) > 0.01) {
                        const frictionAccel = friction * gravity * 0.1 * Math.cos(theta) * Math.sign(sk.vPath);
                        a -= frictionAccel;
                        
                        // Thermal energy increase (work done by friction)
                        const work = Math.abs(frictionAccel * mass * sk.vPath * dt) * 0.5;
                        s.thermalEnergy += work;
                    }

                    sk.vPath += a * dt;
                    
                    // Move along x
                    const dx = sk.vPath * Math.cos(theta) * dt;
                    sk.x += dx;
                    sk.y = A * sk.x * sk.x + B * sk.x + C;

                    // Check if flying off track
                    if (sk.x < s.p1.x || sk.x > s.p3.x) {
                        sk.isAirborne = true;
                        sk.vx = sk.vPath * Math.cos(theta);
                        sk.vy = sk.vPath * Math.sin(theta);
                        sk.vPath = 0;
                    }
                }
            }

            // Draw
            ctx.clearRect(0, 0, width, height);
            drawGrid(width, height);

            const { A, B, C } = fitParabola(s.p1, s.p2, s.p3);

            // Draw Track
            ctx.beginPath();
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#7f8c8d';
            for (let x = s.p1.x; x <= s.p3.x; x += 5) {
                const y = A * x * x + B * x + C;
                if (x === s.p1.x) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw Track Dots
            [s.p1, s.p2, s.p3].forEach((p, idx) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = s.dragTarget === `p${idx+1}` ? '#f1c40f' : '#e74c3c';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // Draw Skater
            ctx.beginPath();
            ctx.arc(sk.x, sk.y - 15, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#9b59b6';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Pie Chart
            if (showPieChart) {
                const h = 600 - sk.y; 
                let pe = mass * gravity * h * 0.05;
                if (pe < 0) pe = 0;
                let ke = sk.isAirborne ? 0.5 * mass * (sk.vx * sk.vx + sk.vy * sk.vy) * 0.05 : 0.5 * mass * (sk.vPath * sk.vPath) * 0.05;
                drawPieChart(sk.x, sk.y - 45, 20, pe, ke, s.thermalEnergy);
            }

            updateDOM();
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [showGrid, showPieChart, friction, gravity, mass, showBarGraph]);

    // Pointer Events
    const handlePointerDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const s = stateRef.current;

        s.lastMouseX = x;
        s.lastMouseY = y;

        const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (dist({x, y}, {x: s.skater.x, y: s.skater.y - 15}) < 30) {
            s.dragTarget = 'skater';
            s.skater.dragging = true;
            s.skater.vx = 0; s.skater.vy = 0; s.skater.vPath = 0;
            s.thermalEnergy = 0; // reset heat on grab
        } else if (dist({x, y}, s.p1) < 20) s.dragTarget = 'p1';
        else if (dist({x, y}, s.p2) < 20) s.dragTarget = 'p2';
        else if (dist({x, y}, s.p3) < 20) s.dragTarget = 'p3';

        if (s.dragTarget) {
            e.target.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e) => {
        const s = stateRef.current;
        if (!s.dragTarget) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (s.dragTarget === 'skater') {
            s.skater.x = x;
            s.skater.y = y + 15;
            s.skater.isAirborne = true;
        } else {
            const p = s[s.dragTarget];
            p.y = y;
            // Constrain X to maintain P1 < P2 < P3 ordering
            if (s.dragTarget === 'p1') p.x = Math.min(x, s.p2.x - 50);
            if (s.dragTarget === 'p2') p.x = Math.max(s.p1.x + 50, Math.min(x, s.p3.x - 50));
            if (s.dragTarget === 'p3') p.x = Math.max(s.p2.x + 50, x);
        }

        s.lastMouseX = x;
        s.lastMouseY = y;
    };

    const handlePointerUp = (e) => {
        const s = stateRef.current;
        if (s.dragTarget) {
            if (s.dragTarget === 'skater') {
                s.skater.dragging = false;
            }
            s.dragTarget = null;
            e.target.releasePointerCapture(e.pointerId);
        }
    };

    const handleReset = () => {
        stateRef.current.p1 = { x: 100, y: 150 };
        stateRef.current.p2 = { x: 400, y: 450 };
        stateRef.current.p3 = { x: 700, y: 200 };
        stateRef.current.skater = { x: 100, y: 150, vx: 0, vy: 0, vPath: 0, isAirborne: false, dragging: false };
        stateRef.current.thermalEnergy = 0;
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
            <style>{`
                .btn-back {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                }
                .btn-back:hover {
                    background: rgba(255, 55, 95, 0.8) !important;
                    border-color: #ff375f !important;
                    box-shadow: 0 0 15px rgba(255, 55, 95, 0.4);
                }
                .btn-reset {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                }
                .btn-reset:hover {
                    background: rgba(52, 152, 219, 0.4) !important;
                    border-color: #3498db !important;
                    box-shadow: 0 0 15px rgba(52, 152, 219, 0.4);
                }
                .btn-play-pause {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .btn-play-pause:hover {
                    background: rgba(255, 255, 255, 0.2) !important;
                    border-color: rgba(255, 255, 255, 0.4) !important;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
                }
                /* Custom styling for floating panel scrollbar */
                .floating-panel::-webkit-scrollbar {
                    width: 6px;
                }
                .floating-panel::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 3px;
                }
                .floating-panel::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                .floating-panel::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.4);
                }
            `}</style>

            {/* Top Header Bar */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button className="btn-back" onClick={onBack}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h2 style={{ margin: 0, color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{title}</h2>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-play-pause" onClick={() => stateRef.current.isPlaying = !stateRef.current.isPlaying}>
                        <Play size={20} />
                    </button>
                    <button className="btn-reset" onClick={handleReset}>
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            {/* Canvas / Main View */}
            <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: 'crosshair', background: 'radial-gradient(circle, #1a1a3a 0%, #0a0a1a 100%)', zIndex: 1 }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />

            {/* Right Controls Panel */}
            <div className="floating-panel" style={{
                position: 'absolute',
                right: '40px',
                top: '120px',
                bottom: '40px',
                width: '350px',
                overflowY: 'auto',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                
                {/* Bar Graph */}
                {showBarGraph && (
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', height: '250px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600' }}>Energy</h3>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', gap: '10px' }}>
                            {[
                                { label: 'Kinetic', color: '#2ecc71' },
                                { label: 'Potential', color: '#3498db' },
                                { label: 'Thermal', color: '#e74c3c' },
                                { label: 'Total', color: '#f1c40f' }
                            ].map((item, i) => (
                                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', height: '100%' }}>
                                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                        <div ref={barsRef} style={{ display: i===0 ? 'block' : 'none' }}></div>
                                        {/* We inject the children manually to keep React out of loop */}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Bar Containers */}
                        <div ref={barsRef} style={{ display: 'none' }}>
                            <div style={{ background: '#2ecc71', width: '40px', transition: 'none' }}></div>
                            <div style={{ background: '#3498db', width: '40px', transition: 'none' }}></div>
                            <div style={{ background: '#e74c3c', width: '40px', transition: 'none' }}></div>
                            <div style={{ background: '#f1c40f', width: '40px', transition: 'none' }}></div>
                        </div>

                        {/* Actual Rendering of Bars */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', gap: '10px', marginTop: '-185px', pointerEvents: 'none' }}>
                            <div style={{ height: '100%', width: '40px', display: 'flex', alignItems: 'flex-end' }}><div id="bar-ke" style={{ width: '100%', background: '#2ecc71', borderRadius: '4px 4px 0 0' }}></div></div>
                            <div style={{ height: '100%', width: '40px', display: 'flex', alignItems: 'flex-end' }}><div id="bar-pe" style={{ width: '100%', background: '#3498db', borderRadius: '4px 4px 0 0' }}></div></div>
                            <div style={{ height: '100%', width: '40px', display: 'flex', alignItems: 'flex-end' }}><div id="bar-te" style={{ width: '100%', background: '#e74c3c', borderRadius: '4px 4px 0 0' }}></div></div>
                            <div style={{ height: '100%', width: '40px', display: 'flex', alignItems: 'flex-end' }}><div id="bar-tot" style={{ width: '100%', background: '#f1c40f', borderRadius: '4px 4px 0 0' }}></div></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
                            <span>Kinetic</span><span>Potential</span><span>Thermal</span><span>Total</span>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                            <input type="checkbox" checked={showPieChart} onChange={e => setShowPieChart(e.target.checked)} style={{ accentColor: '#3498db' }} />
                            Pie Chart
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                            <input type="checkbox" checked={showBarGraph} onChange={e => setShowBarGraph(e.target.checked)} style={{ accentColor: '#3498db' }} />
                            Bar Graph
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} style={{ accentColor: '#3498db' }} />
                            Grid
                        </label>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <label style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Friction</label>
                                <span style={{ fontWeight: '500' }}>{friction === 0 ? 'None' : friction.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="0.5" step="0.01" value={friction} onChange={e => setFriction(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#3498db' }} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <label style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Gravity</label>
                                <span style={{ fontWeight: '500' }}>{gravity} m/s²</span>
                            </div>
                            <input type="range" min="1" max="20" step="0.1" value={gravity} onChange={e => setGravity(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#2ecc71' }} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <label style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Mass</label>
                                <span style={{ fontWeight: '500' }}>{mass} kg</span>
                            </div>
                            <input type="range" min="5" max="100" step="1" value={mass} onChange={e => setMass(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#bf5af2' }} />
                        </div>
                    </div>
                </div>

            </div>
            
            {/* We will hook the DOM refs to the actual visual bars */}
            <div style={{display: 'none'}} ref={barsRef}>
                <div id="bar-ke-ref"></div>
                <div id="bar-pe-ref"></div>
                <div id="bar-te-ref"></div>
                <div id="bar-tot-ref"></div>
            </div>
        </div>
    );
};

export default CustomEnergySkatePark;
