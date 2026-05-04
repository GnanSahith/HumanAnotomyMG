import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function PolygonExplorer() {
    // We will track the vertices of a hexagon initially
    const generateHexagon = () => {
        const cx = 400, cy = 250, r = 150;
        return Array.from({ length: 6 }).map((_, i) => ({
            x: cx + r * Math.cos((i * 60) * Math.PI / 180),
            y: cy + r * Math.sin((i * 60) * Math.PI / 180)
        }));
    };

    const [vertices, setVertices] = useState(generateHexagon());
    const [draggingIdx, setDraggingIdx] = useState(null);
    const svgRef = useRef(null);

    const handlePointerMove = useCallback((e) => {
        if (draggingIdx === null) return;
        if (!svgRef.current) return;
        
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        
        setVertices(prev => {
            const next = [...prev];
            next[draggingIdx] = { 
                x: Math.max(20, Math.min(780, svgP.x)), 
                y: Math.max(20, Math.min(480, svgP.y)) 
            };
            return next;
        });
    }, [draggingIdx]);

    const handlePointerUp = useCallback(() => {
        setDraggingIdx(null);
    }, []);

    useEffect(() => {
        if (draggingIdx !== null) {
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
    }, [draggingIdx, handlePointerMove, handlePointerUp]);

    const polygonPath = vertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x} ${v.y}`).join(" ") + " Z";

    // Polygon properties
    const numSides = vertices.length;
    const isRegular = false; // It dynamic, mostly irregular when dragged

    // Sum of interior angles is (n-2) * 180
    const sumInteriorAngles = (numSides - 2) * 180;

    const resetShape = (sides) => {
        const cx = 400, cy = 250, r = 150;
        const angleStep = 360 / sides;
        setVertices(Array.from({ length: sides }).map((_, i) => ({
            x: cx + r * Math.cos((i * angleStep - 90) * Math.PI / 180), // -90 to point upwards
            y: cy + r * Math.sin((i * angleStep - 90) * Math.PI / 180)
        })));
    };

    return (
        <div style={{ height: '100%', display: 'flex' }}>
            
            {/* SVG Renderer */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg ref={svgRef} viewBox="0 0 800 500" style={{ width: '100%', height: '100%', touchAction: 'none' }}>
                    <defs>
                        <filter id="glowHex">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Polygon Body */}
                    <path 
                        d={polygonPath} 
                        fill="rgba(175, 82, 222, 0.2)" 
                        stroke="#af52de" 
                        strokeWidth="4" 
                        strokeLinejoin="round" 
                    />

                    {/* Draggable Vertices */}
                    {vertices.map((v, i) => (
                        <circle 
                            key={i}
                            cx={v.x} 
                            cy={v.y} 
                            r={12} 
                            fill="#af52de" 
                            stroke="#fff" 
                            strokeWidth="2"
                            filter="url(#glowHex)"
                            style={{ cursor: draggingIdx === i ? 'grabbing' : 'grab' }}
                            onPointerDown={(e) => { 
                                e.preventDefault(); 
                                setDraggingIdx(i); 
                            }}
                        />
                    ))}
                </svg>
            </div>

            {/* Interaction Panel */}
            <div style={{ width: '340px', padding: '40px 30px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '24px', color: '#fff', margin: '0 0 10px 0' }}>Polygon Explorer</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '30px' }}>
                    Drag the vertices to shape the polygon. Observe how the sum of all interior angles remains constant based solely on the number of sides.
                </p>

                <div style={{ background: 'rgba(175, 82, 222, 0.1)', border: '1px solid rgba(175, 82, 222, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#af52de', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 'bold' }}>Properties</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '16px', marginBottom: '8px' }}>
                        <span>Sides (n):</span> <span style={{ fontWeight: 600 }}>{numSides}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '16px', marginBottom: '8px' }}>
                        <span>Sum of Interior Angles:</span> <span style={{ fontWeight: 600 }}>{sumInteriorAngles}°</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: '10px' }}>
                        Formula: (n - 2) × 180°
                    </div>
                </div>

                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: 'bold' }}>Change Shape</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        { n: 3, label: 'Triangle' },
                        { n: 4, label: 'Quadrilateral' },
                        { n: 5, label: 'Pentagon' },
                        { n: 6, label: 'Hexagon' },
                        { n: 8, label: 'Octagon' }
                    ].map(shape => (
                        <button
                            key={shape.n}
                            onClick={() => resetShape(shape.n)}
                            style={{
                                padding: '12px',
                                background: numSides === shape.n ? 'rgba(175, 82, 222, 0.3)' : 'rgba(255,255,255,0.05)',
                                color: numSides === shape.n ? '#fff' : 'rgba(255,255,255,0.7)',
                                border: `1px solid ${numSides === shape.n ? '#af52de' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '12px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {shape.label}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1 }}></div>
            </div>
        </div>
    );
}
