import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Settings2, Activity, ArrowLeft, Play, Pause, Circle } from 'lucide-react';

function CustomWaveOnAStringInner({ onBack, title }) {
    // String properties
    const numPoints = 80;
    const dx = 10;
    
    // UI State
    const [mode, setMode] = useState('oscillate'); // manual, oscillate, pulse
    const [endType, setEndType] = useState('fixed'); // fixed, loose, none
    const [amplitude, setAmplitude] = useState(0.75); // 0.00 to 1.25
    const [frequency, setFrequency] = useState(1.50); // 0.00 to 3.00
    const [damping, setDamping] = useState(0.05); // 0 to 0.5
    const [tension, setTension] = useState(0.5); // 0.1 to 0.9
    const [isPlaying, setIsPlaying] = useState(true);
    const [manualY, setManualY] = useState(0);

    // Visuals
    const [points, setPoints] = useState(new Array(numPoints).fill(0));

    // Physics state
    const yRef = useRef(new Array(numPoints).fill(0));
    const yPrevRef = useRef(new Array(numPoints).fill(0));
    const timeRef = useRef(0);
    const pulseTimeRef = useRef(-1);
    const requestRef = useRef(null);
    const isPlayingRef = useRef(isPlaying);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const handleReset = () => {
        yRef.current.fill(0);
        yPrevRef.current.fill(0);
        timeRef.current = 0;
        pulseTimeRef.current = -1;
        setPoints([...yRef.current]);
        setManualY(0);
    };

    const triggerPulse = () => {
        pulseTimeRef.current = timeRef.current;
    };

    const updatePhysics = () => {
        if (!isPlayingRef.current) {
            requestRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const dt = 0.1; // small stable time step
        timeRef.current += dt;

        let y = yRef.current;
        let yPrev = yPrevRef.current;
        let yNext = new Array(numPoints).fill(0);

        const c = tension; // wave speed based on tension
        const c2 = c * c;
        const damp = damping * 0.1;

        // Update inner points
        for (let i = 1; i < numPoints - 1; i++) {
            yNext[i] = 2 * y[i] - yPrev[i] + 
                       c2 * (y[i+1] - 2 * y[i] + y[i-1]) - 
                       damp * (y[i] - yPrev[i]);
        }

        // Left Boundary (i = 0)
        let visualAmp = amplitude * 100;
        if (mode === 'oscillate') {
            yNext[0] = visualAmp * Math.sin(2 * Math.PI * frequency * (timeRef.current / 10));
        } else if (mode === 'pulse') {
            if (pulseTimeRef.current >= 0) {
                const tPulse = timeRef.current - pulseTimeRef.current;
                const width = 1.0;
                if (tPulse < width * 4) {
                    yNext[0] = visualAmp * Math.exp(-Math.pow((tPulse - width*2)*2, 2));
                } else {
                    yNext[0] = 0;
                }
            } else {
                yNext[0] = 0;
            }
        } else {
            yNext[0] = manualY;
        }

        // Right Boundary (i = numPoints - 1)
        if (endType === 'fixed') {
            yNext[numPoints - 1] = 0;
        } else if (endType === 'loose') {
            yNext[numPoints - 1] = yNext[numPoints - 2];
        } else if (endType === 'none') {
            // perfectly matched layer / absorbing boundary
            yNext[numPoints - 1] = y[numPoints - 2] + (c-1)/(c+1) * (yNext[numPoints - 2] - y[numPoints - 1]);
        }

        yPrevRef.current = [...y];
        yRef.current = [...yNext];
        
        setPoints([...yNext]);
        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, endType, amplitude, frequency, damping, tension, manualY]);

    return (
        <div style={{
            width: '100%', height: '100%',
            position: 'relative', background: '#0a0a1a', overflow: 'hidden',
            fontFamily: "'Inter', sans-serif", color: '#fff'
        }}>
            {/* Top Header Bar */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                {onBack ? (
                    <button 
                        onClick={onBack}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                ) : <div />}
                <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
                    {title || 'Wave on a String'}
                </h1>
                <button 
                    onClick={handleReset}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px',
                        color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease',
                        fontWeight: 600, fontFamily: "'Inter', sans-serif"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                >
                    <RotateCcw size={16} /> Restart
                </button>
            </div>

            {/* Canvas / Main View */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="-100 -300 900 600" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', maxWidth: '800px', maxHeight: '600px', zIndex: 2, userSelect: 'none' }}>
                    
                    {/* Center Reference Line */}
                    <line x1="0" y1="0" x2={numPoints * dx} y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="10,10" />

                    {/* The String */}
                    <path 
                        d={`M 0 ${points[0]} ` + points.map((y, i) => `L ${i * dx} ${y}`).join(' ')} 
                        fill="none" 
                        stroke="#e74c3c" 
                        strokeWidth="6" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    
                    {/* Beads */}
                    {points.map((y, i) => (
                        <circle key={i} cx={i * dx} cy={y} r={i === 0 ? 8 : 4} fill={i === 0 ? "#3498db" : (i % 10 === 0 ? "#2ecc71" : "#e74c3c")} />
                    ))}

                    {/* Right Boundary Visuals */}
                    {endType === 'fixed' && (
                        <g transform={`translate(${ (numPoints - 1) * dx }, 0)`}>
                            <rect x="-5" y="-100" width="10" height="200" fill="#8d6e63" />
                            <circle cx="0" cy="0" r="8" fill="#333" />
                        </g>
                    )}
                    {endType === 'loose' && (
                        <g transform={`translate(${ (numPoints - 1) * dx }, 0)`}>
                            <rect x="-3" y="-150" width="6" height="300" fill="#ccc" />
                            <circle cx="0" cy={points[numPoints - 1]} r="8" fill="#f1c40f" />
                        </g>
                    )}
                    
                    {/* Left Boundary Visuals */}
                    <g transform={`translate(0, ${points[0]})`}>
                        {mode === 'manual' && (
                            <g>
                                <rect x="-40" y="-10" width="40" height="20" rx="5" fill="#555" />
                                <circle cx="-30" cy="0" r="5" fill="#222" />
                                <path d="M -40 -15 C -50 -15 -50 15 -40 15 L -40 10 L -35 10 L -35 -10 L -40 -10 Z" fill="#888" />
                            </g>
                        )}
                        {mode === 'oscillate' && (
                            <g transform="translate(-30, 0)">
                                <circle cx="0" cy="0" r="15" fill="#2ecc71" />
                                <rect x="-5" y="-15" width="10" height="30" fill="#222" />
                                <line x1="0" y1="0" x2="30" y2="0" stroke="#888" strokeWidth="6" />
                            </g>
                        )}
                        {mode === 'pulse' && (
                            <g transform="translate(-30, 0)">
                                <rect x="-20" y="-20" width="40" height="40" rx="4" fill="#3498db" />
                                <circle cx="0" cy="0" r="10" fill="#fff" />
                                <line x1="0" y1="0" x2="30" y2="0" stroke="#888" strokeWidth="6" />
                            </g>
                        )}
                    </g>
                </svg>

                {/* Bottom Floating Play/Pause Controls */}
                <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', zIndex: 10 }}>
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff',
                            width: '50px', height: '50px', borderRadius: '25px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                        {isPlaying ? <Pause fill="#fff" size={20} /> : <Play fill="#fff" size={20} />}
                    </button>
                </div>
            </div>

            {/* Control Panels (floating/overlay) */}
            <div style={{
                position: 'absolute', top: '90px', right: '20px', width: '300px',
                background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px',
                zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif",
                maxHeight: 'calc(100% - 130px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                    <Settings2 size={20} />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Simulation Settings</h3>
                </div>

                {/* Boundary Conditions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Left End</label>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                        {['manual', 'oscillate', 'pulse'].map(m => (
                            <button key={m} onClick={() => setMode(m)} style={{
                                flex: 1, padding: '8px 0', border: 'none', borderRadius: '6px',
                                background: mode === m ? 'rgba(255,255,255,0.15)' : 'transparent',
                                color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer', fontWeight: mode === m ? 600 : 400,
                                textTransform: 'capitalize', fontSize: '13px', transition: 'all 0.2s'
                            }}>{m}</button>
                        ))}
                    </div>
                </div>

                {mode === 'manual' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Manual Wrench</label>
                        </div>
                        <input 
                            type="range" min="-100" max="100" step="1"
                            value={-manualY} 
                            onChange={(e) => setManualY(-Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#f1c40f' }}
                        />
                    </div>
                )}
                
                {mode === 'pulse' && (
                    <button 
                        onClick={triggerPulse}
                        style={{
                            background: 'rgba(52, 152, 219, 0.2)', border: '1px solid #3498db',
                            color: '#3498db', padding: '12px', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52, 152, 219, 0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52, 152, 219, 0.2)'; }}
                    >
                        <Circle size={16} /> Send Pulse
                    </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Right End</label>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                        {['fixed', 'loose', 'none'].map(e => (
                            <button key={e} onClick={() => setEndType(e)} style={{
                                flex: 1, padding: '8px 0', border: 'none', borderRadius: '6px',
                                background: endType === e ? 'rgba(255,255,255,0.15)' : 'transparent',
                                color: endType === e ? '#fff' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer', fontWeight: endType === e ? 600 : 400,
                                textTransform: 'capitalize', fontSize: '13px', transition: 'all 0.2s'
                            }}>{e}</button>
                        ))}
                    </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

                {/* Amplitude */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Amplitude</label>
                        <span style={{ fontSize: '14px', color: '#2ecc71', fontWeight: 700 }}>{amplitude.toFixed(2)} cm</span>
                    </div>
                    <input 
                        type="range" min="0" max="1.25" step="0.01"
                        value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#2ecc71' }}
                    />
                </div>

                {/* Frequency */}
                {mode === 'oscillate' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Frequency</label>
                            <span style={{ fontSize: '14px', color: '#3498db', fontWeight: 700 }}>{frequency.toFixed(2)} Hz</span>
                        </div>
                        <input 
                            type="range" min="0" max="3" step="0.01"
                            value={frequency} onChange={(e) => setFrequency(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#3498db' }}
                        />
                    </div>
                )}

                {/* Damping */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Damping</label>
                        <span style={{ fontSize: '14px', color: '#9b59b6', fontWeight: 700 }}>{damping === 0 ? 'None' : (damping === 0.5 ? 'Lots' : damping.toFixed(2))}</span>
                    </div>
                    <input 
                        type="range" min="0" max="0.5" step="0.01"
                        value={damping} onChange={(e) => setDamping(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#9b59b6' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        <span>None</span><span>Lots</span>
                    </div>
                </div>

                {/* Tension */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Tension</label>
                        <span style={{ fontSize: '14px', color: '#e74c3c', fontWeight: 700 }}>{tension < 0.4 ? 'Low' : tension > 0.7 ? 'High' : 'Medium'}</span>
                    </div>
                    <input 
                        type="range" min="0.1" max="0.9" step="0.1"
                        value={tension} onChange={(e) => setTension(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#e74c3c' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        <span>Low</span><span>High</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function CustomWaveOnAString({ onBack, title }) {
    return <CustomWaveOnAStringInner onBack={onBack} title={title || 'Wave on a String'} />;
}

