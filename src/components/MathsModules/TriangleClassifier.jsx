import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function TriangleClassifier() {
    // We will track the 3 vertices of the triangle
    // Start with a right-angled triangle roughly
    const [vertices, setVertices] = useState([
        { x: 300, y: 150 }, // A
        { x: 200, y: 350 }, // B
        { x: 500, y: 350 }  // C
    ]);
    
    const [draggingIdx, setDraggingIdx] = useState(null);
    const svgRef = useRef(null);

    // Calculate side lengths
    const distance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    
    // Calculate angles (in degrees) using Law of Cosines
    const calculateAngles = (a, b, c) => {
        // sides: a is opposite A, b is opp B, c is opp C
        const lawOfCosines = (sA, sB, sC) => Math.acos((sB*sB + sC*sC - sA*sA) / (2 * sB * sC)) * (180 / Math.PI);
        const angA = lawOfCosines(a, b, c);
        const angB = lawOfCosines(b, a, c);
        const angC = lawOfCosines(c, a, b);
        return [angA || 0, angB || 0, angC || 0];
    };

    // Derived metrics
    const sideA = distance(vertices[1], vertices[2]); // BC
    const sideB = distance(vertices[0], vertices[2]); // AC
    const sideC = distance(vertices[0], vertices[1]); // AB
    
    const [angA, angB, angC] = calculateAngles(sideA, sideB, sideC);

    // Classification Logic
    // Allow slight tolerance due to pixel precision
    const isClose = (val1, val2) => Math.abs(val1 - val2) < 2.0;

    let sidesClass = "Scalene";
    if (isClose(sideA, sideB) && isClose(sideB, sideC)) sidesClass = "Equilateral";
    else if (isClose(sideA, sideB) || isClose(sideB, sideC) || isClose(sideA, sideC)) sidesClass = "Isosceles";

    let anglesClass = "Acute";
    if (isClose(angA, 90) || isClose(angB, 90) || isClose(angC, 90)) anglesClass = "Right";
    else if (angA > 90.5 || angB > 90.5 || angC > 90.5) anglesClass = "Obtuse";

    const handlePointerMove = useCallback((e) => {
        if (draggingIdx === null) return;
        if (!svgRef.current) return;
        
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        
        setVertices(prev => {
            const next = [...prev];
            // Clamp within SVG reasonably
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

    const getArcPath = (vTarget, vLeft, vRight, radius, angleDeg) => {
        // Just calculating simple start/end points of arc for aesthetics
        const dx1 = vLeft.x - vTarget.x;
        const dy1 = vLeft.y - vTarget.y;
        const mag1 = Math.sqrt(dx1*dx1 + dy1*dy1);
        
        const dx2 = vRight.x - vTarget.x;
        const dy2 = vRight.y - vTarget.y;
        const mag2 = Math.sqrt(dx2*dx2 + dy2*dy2);

        if (mag1 === 0 || mag2 === 0) return "";

        const p1x = vTarget.x + (dx1 / mag1) * radius;
        const p1y = vTarget.y + (dy1 / mag1) * radius;
        const p2x = vTarget.x + (dx2 / mag2) * radius;
        const p2y = vTarget.y + (dy2 / mag2) * radius;

        // Ensure we draw the interior angle arc
        return `M ${p1x} ${p1y} A ${radius} ${radius} 0 0 ${angleDeg > 180 ? 1 : 0} ${p2x} ${p2y}`;
    };

    return (
        <div style={{ height: '100%', display: 'flex' }}>
            
            {/* SVG Renderer */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg ref={svgRef} viewBox="0 0 800 500" style={{ width: '100%', height: '100%', touchAction: 'none' }}>
                    <defs>
                        <filter id="glowGold">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Gradient Body */}
                    <path 
                        d={`M ${vertices[0].x} ${vertices[0].y} L ${vertices[1].x} ${vertices[1].y} L ${vertices[2].x} ${vertices[2].y} Z`} 
                        fill="rgba(255, 214, 10, 0.2)" 
                        stroke="rgba(255, 214, 10, 0.8)" 
                        strokeWidth="3" 
                        strokeLinejoin="round" 
                    />

                    {/* Angle Arcs (Optional visual flair) */}
                    {/* Render arcs if you want, but for now just showing angles dynamically on the panel is cleaner. */}

                    {/* Draggable Vertices */}
                    {vertices.map((v, i) => (
                        <g key={i}>
                            <circle 
                                cx={v.x} 
                                cy={v.y} 
                                r={12} 
                                fill="#ffd60a" 
                                stroke="#fff" 
                                strokeWidth="2"
                                filter="url(#glowGold)"
                                style={{ cursor: draggingIdx === i ? 'grabbing' : 'grab' }}
                                onPointerDown={(e) => { 
                                    e.preventDefault(); 
                                    setDraggingIdx(i); 
                                }}
                            />
                            <text 
                                x={v.x + 15} 
                                y={v.y - 15} 
                                fill="#ffffff" 
                                fontSize="20" 
                                fontFamily="serif" 
                                fontWeight="bold"
                                pointerEvents="none"
                            >
                                {['A', 'B', 'C'][i]}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {/* Interaction Panel */}
            <div style={{ width: '340px', padding: '40px 30px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '24px', color: '#fff', margin: '0 0 10px 0' }}>Triangle Classifier</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '30px' }}>
                    Drag the gold vertices A, B, and C to dynamically change the shape. Observe how its classification changes based on side lengths and interior angles.
                </p>

                {/* Classification Readout */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                    <div style={{ flex: 1, background: 'rgba(10, 132, 255, 0.15)', border: '1px solid rgba(10, 132, 255, 0.4)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(10, 132, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>By Sides</div>
                        <div style={{ fontSize: '18px', color: '#0a84ff', fontWeight: 'bold' }}>{sidesClass}</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255, 55, 95, 0.15)', border: '1px solid rgba(255, 55, 95, 0.4)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 55, 95, 0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>By Angles</div>
                        <div style={{ fontSize: '18px', color: '#ff375f', fontWeight: 'bold' }}>{anglesClass}</div>
                    </div>
                </div>

                {/* Detail Metrics */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontWeight: 'bold' }}>Live Measurements</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        
                        {/* Angles */}
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px' }}>Interior Angles</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '4px' }}>
                                <span>m∠A:</span> <span style={{ color: '#ffd60a' }}>{Math.round(angA)}°</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '4px' }}>
                                <span>m∠B:</span> <span style={{ color: '#ffd60a' }}>{Math.round(angB)}°</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px' }}>
                                <span>m∠C:</span> <span style={{ color: '#ffd60a' }}>{Math.round(angC)}°</span>
                            </div>
                        </div>

                        {/* Sides */}
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px' }}>Side Lengths</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '4px' }}>
                                <span>a (BC):</span> <span style={{ color: '#fff' }}>{Math.round(sideA)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '4px' }}>
                                <span>b (AC):</span> <span style={{ color: '#fff' }}>{Math.round(sideB)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px' }}>
                                <span>c (AB):</span> <span style={{ color: '#fff' }}>{Math.round(sideC)}</span>
                            </div>
                        </div>

                    </div>
                </div>

                <div style={{ flex: 1 }}></div>
            </div>
        </div>
    );
}
