import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const DT = 0.001; // Time step for simulation

class MNA {
    constructor(nodes, components) {
        this.nodes = nodes; // Number of nodes excluding ground (node 0)
        this.components = components;
        this.A = [];
        this.b = [];
        this.x = new Array(nodes + components.filter(c => c.type === 'V').length).fill(0);
        this.numVoltageSources = 0;
        
        this.components.forEach(c => {
            if (c.type === 'V') this.numVoltageSources++;
            if (c.type === 'L') c.iPrev = 0;
        });
        
        this.size = this.nodes + this.numVoltageSources;
        for (let i = 0; i < this.size; i++) {
            this.A.push(new Array(this.size).fill(0));
            this.b.push(0);
        }
    }
    
    solve(time) {
        for (let i = 0; i < this.size; i++) {
            this.A[i].fill(0);
            this.b[i] = 0;
        }
        
        let vIndex = this.nodes;
        
        this.components.forEach(c => {
            const n1 = c.n1 - 1;
            const n2 = c.n2 - 1;
            
            if (c.type === 'R') {
                const g = 1 / c.value;
                if (n1 >= 0) { this.A[n1][n1] += g; }
                if (n2 >= 0) { this.A[n2][n2] += g; }
                if (n1 >= 0 && n2 >= 0) { this.A[n1][n2] -= g; this.A[n2][n1] -= g; }
            } else if (c.type === 'C') {
                const g = c.value / DT;
                const vPrev = (n1 >= 0 ? this.x[n1] : 0) - (n2 >= 0 ? this.x[n2] : 0);
                const iPrev = g * vPrev;
                if (n1 >= 0) { this.A[n1][n1] += g; this.b[n1] += iPrev; }
                if (n2 >= 0) { this.A[n2][n2] += g; this.b[n2] -= iPrev; }
                if (n1 >= 0 && n2 >= 0) { this.A[n1][n2] -= g; this.A[n2][n1] -= g; }
            } else if (c.type === 'L') {
                const g = DT / c.value;
                const vPrev = (n1 >= 0 ? this.x[n1] : 0) - (n2 >= 0 ? this.x[n2] : 0);
                c.iPrev = c.iPrev + g * vPrev;
                if (n1 >= 0) { this.A[n1][n1] += g; this.b[n1] -= c.iPrev; }
                if (n2 >= 0) { this.A[n2][n2] += g; this.b[n2] += c.iPrev; }
                if (n1 >= 0 && n2 >= 0) { this.A[n1][n2] -= g; this.A[n2][n1] -= g; }
            } else if (c.type === 'V') {
                const vi = vIndex++;
                const v = c.amplitude * Math.sin(2 * Math.PI * c.freq * time);
                if (n1 >= 0) { this.A[n1][vi] += 1; this.A[vi][n1] += 1; }
                if (n2 >= 0) { this.A[n2][vi] -= 1; this.A[vi][n2] -= 1; }
                this.b[vi] = v;
            }
        });
        
        this.x = this.solveLinearSystem(this.A, this.b);
        return this.x;
    }
    
    solveLinearSystem(A, b) {
        const n = b.length;
        const M = A.map((row, i) => [...row, b[i]]);
        for (let i = 0; i < n; i++) {
            let maxEl = Math.abs(M[i][i]);
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > maxEl) { maxEl = Math.abs(M[k][i]); maxRow = k; }
            }
            if (maxEl === 0) continue;
            const tmp = M[maxRow];
            M[maxRow] = M[i];
            M[i] = tmp;
            for (let k = i + 1; k < n; k++) {
                const c = -M[k][i] / M[i][i];
                for (let j = i; j < n + 1; j++) {
                    if (i === j) M[k][j] = 0;
                    else M[k][j] += c * M[i][j];
                }
            }
        }
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            if (M[i][i] === 0) continue;
            x[i] = M[i][n] / M[i][i];
            for (let k = i - 1; k >= 0; k--) {
                M[k][n] -= M[k][i] * x[i];
            }
        }
        return x;
    }
}

export default function CustomCircuitConstructionKitAC({ onBack, title }) {
    const [time, setTime] = useState(0);
    const canvasRef = useRef(null);
    const [running, setRunning] = useState(true);
    const [components, setComponents] = useState([
        { id: 1, type: 'V', n1: 1, n2: 0, amplitude: 5, freq: 1, label: 'AC Source' },
        { id: 2, type: 'R', n1: 1, n2: 2, value: 5, label: 'Resistor' },
        { id: 3, type: 'L', n1: 2, n2: 3, value: 1, label: 'Inductor' },
        { id: 4, type: 'C', n1: 3, n2: 0, value: 0.1, label: 'Capacitor' }
    ]);
    const mnaRef = useRef(null);
    const timeRef = useRef(0);
    const dataRef = useRef([]);

    useEffect(() => {
        mnaRef.current = new MNA(3, components);
        timeRef.current = 0;
        dataRef.current = [];
        setTime(0);
    }, [components]);

    useEffect(() => {
        let animationFrameId;
        const tick = () => {
            if (running && mnaRef.current) {
                for (let i = 0; i < 10; i++) {
                    timeRef.current += DT;
                    const x = mnaRef.current.solve(timeRef.current);
                    
                    if (i === 9) {
                        dataRef.current.push({
                            t: timeRef.current,
                            v1: x[0],
                            v2: x[1],
                            v3: x[2],
                            i: x[3] // Current from voltage source
                        });
                        if (dataRef.current.length > 400) {
                            dataRef.current.shift();
                        }
                    }
                }
                setTime(timeRef.current);
                draw();
            }
            animationFrameId = requestAnimationFrame(tick);
        };
        tick();
        return () => cancelAnimationFrame(animationFrameId);
    }, [running]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const data = dataRef.current;
        if (data.length === 0) return;
        
        const drawGraph = (yFunc, color, label, yOffset, scale) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            for (let i = 0; i < data.length; i++) {
                const x = (i / 400) * width;
                const y = yOffset - yFunc(data[i]) * scale;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.font = '14px Arial';
            ctx.fillText(label, 10, yOffset - 40);
            
            ctx.beginPath();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.moveTo(0, yOffset);
            ctx.lineTo(width, yOffset);
            ctx.stroke();
        };

        drawGraph(d => d.v1, '#ff5555', 'Source Voltage (V)', height / 4, 10);
        drawGraph(d => d.v3, '#55ff55', 'Capacitor Voltage (V)', height / 4, 10);
        drawGraph(d => -d.i, '#5555ff', 'Circuit Current (I)', 3 * height / 4, 50);
    };

    const updateComponent = (index, field, value) => {
        const newComponents = [...components];
        newComponents[index][field] = parseFloat(value);
        setComponents(newComponents);
    };

    const handleReset = () => {
        setComponents([
            { id: 1, type: 'V', n1: 1, n2: 0, amplitude: 5, freq: 1, label: 'AC Source' },
            { id: 2, type: 'R', n1: 1, n2: 2, value: 5, label: 'Resistor' },
            { id: 3, type: 'L', n1: 2, n2: 3, value: 1, label: 'Inductor' },
            { id: 4, type: 'C', n1: 3, n2: 0, value: 0.1, label: 'Capacitor' }
        ]);
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <style>{`
                .glass-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    color: white;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .glass-btn:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-1px); }
                .glass-btn:active { transform: translateY(1px); }
                .glass-btn-blue { background: rgba(52, 152, 219, 0.15); border-color: rgba(52, 152, 219, 0.3); color: #3498db; }
                .glass-btn-blue:hover { background: rgba(52, 152, 219, 0.25); }
                .reset-btn { background: rgba(231, 76, 60, 0.2); border-color: rgba(231, 76, 60, 0.3); color: #e74c3c; }
                .reset-btn:hover { background: rgba(231, 76, 60, 0.3); }
            `}</style>

            {/* Standardized Header */}
            <div style={{ height: '80px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    {onBack && (
                        <button onClick={onBack} className="glass-btn">
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                </div>
                <div>
                    <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', margin: 0 }}>
                        {title || 'Circuit Construction Kit AC MG'}
                    </h2>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    <button onClick={handleReset} className="glass-btn reset-btn">
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', zIndex: 1, pointerEvents: 'auto', padding: '20px 380px 20px 20px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={500} 
                    style={{ 
                        width: '100%',
                        height: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'auto',
                        background: '#050510',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }} 
                />

            {/* Control Panel */}
            <div style={{
                position: 'absolute',
                top: '90px',
                right: '20px',
                width: '340px',
                bottom: '20px',
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
                gap: '15px'
            }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Controls</h3>
                
                <button 
                    onClick={() => setRunning(!running)} 
                    className="ds-btn-glass"
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {running ? 'Pause' : 'Resume'}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {components.map((c, i) => (
                        <div key={c.id} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#e2e8f0' }}>{c.label}</div>
                            {c.type === 'V' && (
                                <>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                                            <span>Amplitude (V)</span>
                                            <span style={{ fontFamily: 'monospace', color: '#3498db', fontWeight: 'bold' }}>{c.amplitude} V</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0"
                                            max="20"
                                            step="0.5"
                                            value={c.amplitude} 
                                            onChange={e => updateComponent(i, 'amplitude', e.target.value)} 
                                            style={{ 
                                                width: '100%', 
                                                accentColor: '#3498db',
                                                cursor: 'pointer'
                                            }} 
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                                            <span>Frequency (Hz)</span>
                                            <span style={{ fontFamily: 'monospace', color: '#3498db', fontWeight: 'bold' }}>{c.freq} Hz</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0.1"
                                            max="5"
                                            step="0.1"
                                            value={c.freq} 
                                            onChange={e => updateComponent(i, 'freq', e.target.value)} 
                                            style={{ 
                                                width: '100%', 
                                                accentColor: '#3498db',
                                                cursor: 'pointer'
                                            }} 
                                        />
                                    </div>
                                </>
                            )}
                            {c.type === 'R' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                                        <span>Resistance (Ω)</span>
                                        <span style={{ fontFamily: 'monospace', color: '#3498db', fontWeight: 'bold' }}>{c.value} Ω</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1"
                                        max="50"
                                        step="1"
                                        value={c.value} 
                                        onChange={e => updateComponent(i, 'value', e.target.value)} 
                                        style={{ 
                                            width: '100%', 
                                            accentColor: '#3498db',
                                            cursor: 'pointer'
                                        }} 
                                    />
                                </div>
                            )}
                            {c.type === 'L' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                                        <span>Inductance (H)</span>
                                        <span style={{ fontFamily: 'monospace', color: '#3498db', fontWeight: 'bold' }}>{c.value} H</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.1"
                                        max="5"
                                        step="0.1"
                                        value={c.value} 
                                        onChange={e => updateComponent(i, 'value', e.target.value)} 
                                        style={{ 
                                            width: '100%', 
                                            accentColor: '#3498db',
                                            cursor: 'pointer'
                                        }} 
                                    />
                                </div>
                            )}
                            {c.type === 'C' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                                        <span>Capacitance (F)</span>
                                        <span style={{ fontFamily: 'monospace', color: '#3498db', fontWeight: 'bold' }}>{c.value} F</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.01"
                                        max="0.5"
                                        step="0.01"
                                        value={c.value} 
                                        onChange={e => updateComponent(i, 'value', e.target.value)} 
                                        style={{ 
                                            width: '100%', 
                                            accentColor: '#3498db',
                                            cursor: 'pointer'
                                        }} 
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Time:</span>
                    <span style={{ fontFamily: 'monospace', color: '#3498db', fontWeight: 'bold' }}>{time.toFixed(3)} s</span>
                </div>
            </div>
            </div>
        </div>
    );
}

