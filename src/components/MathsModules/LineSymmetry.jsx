import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function LineSymmetry() {
    const [points, setPoints] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const svgRef = useRef(null);

    const centerLine = 400; // Vertical symmetry line

    const handlePointerDown = (e) => {
        if (!svgRef.current) return;
        setIsDrawing(true);
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        
        // Start a new line segment array
        setPoints(prev => [...prev, [{ x: svgP.x, y: svgP.y }]]);
    };

    const handlePointerMove = useCallback((e) => {
        if (!isDrawing || !svgRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());

        setPoints(prev => {
            const newPoints = [...prev];
            const currentLine = newPoints[newPoints.length - 1];
            currentLine.push({ x: svgP.x, y: svgP.y });
            return newPoints;
        });
    }, [isDrawing]);

    const handlePointerUp = useCallback(() => {
        setIsDrawing(false);
    }, []);

    useEffect(() => {
        if (isDrawing) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        } else {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDrawing, handlePointerMove, handlePointerUp]);

    const clearCanvas = () => setPoints([]);

    // Path generation
    const generatePath = (linePts, reflect = false) => {
        if (linePts.length === 0) return "";
        return linePts.map((pt, i) => {
            const rx = reflect ? centerLine + (centerLine - pt.x) : pt.x;
            return `${i === 0 ? 'M' : 'L'} ${rx} ${pt.y}`;
        }).join(" ");
    };

    return (
        <div style={{ height: '100%', display: 'flex' }}>
            
            {/* SVG Renderer */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg 
                    ref={svgRef} 
                    viewBox="0 0 800 500" 
                    style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair', background: 'rgba(0,0,0,0.2)' }}
                    onPointerDown={handlePointerDown}
                >
                    <defs>
                        <filter id="glowPink">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        <filter id="glowBlue">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Symmetry Line */}
                    <line x1={centerLine} y1="0" x2={centerLine} y2="500" stroke="#ffd60a" strokeWidth="2" strokeDasharray="10 10" opacity="0.6" />

                    {/* Drawing Paths */}
                    {points.map((linePts, i) => (
                        <g key={i}>
                            {/* Original */}
                            <path d={generatePath(linePts, false)} fill="none" stroke="#0a84ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowBlue)" />
                            {/* Reflected */}
                            <path d={generatePath(linePts, true)} fill="none" stroke="#ff375f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowPink)" />
                        </g>
                    ))}
                </svg>
            </div>

            {/* Interaction Panel */}
            <div style={{ width: '340px', padding: '40px 30px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '24px', color: '#fff', margin: '0 0 10px 0' }}>Line Symmetry</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '30px' }}>
                    Draw shapes or lines anywhere on the canvas. Observe how they are perfectly reflected across the central axis of symmetry.
                </p>

                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: 'bold' }}>Legend</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '16px', height: '4px', background: '#0a84ff', borderRadius: '2px' }}></div>
                        <span style={{ color: '#fff', fontSize: '14px' }}>Original Draw</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '4px', background: '#ff375f', borderRadius: '2px' }}></div>
                        <span style={{ color: '#fff', fontSize: '14px' }}>Mirrored Reflection</span>
                    </div>
                </div>

                <div style={{ flex: 1 }}></div>

                <button 
                    onClick={clearCanvas}
                    style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '16px',
                        fontSize: '18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    Clear Canvas
                </button>
            </div>
        </div>
    );
}
