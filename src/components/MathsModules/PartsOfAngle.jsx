import React, { useState } from 'react';

export default function PartsOfAngle() {
    const [highlight, setHighlight] = useState(null);

    // Geometry constants
    const ox = 400;
    const oy = 350;
    const rayLength = 300;
    const arcRadius = 100;
    const angleDeg = 50;

    const toRad = (deg) => (deg * Math.PI) / 180;

    const ptA = { x: ox + rayLength, y: oy };
    const ptB = {
        x: ox + rayLength * Math.cos(toRad(angleDeg)),
        y: oy - rayLength * Math.sin(toRad(angleDeg))
    };

    const arcEnd = {
        x: ox + arcRadius * Math.cos(toRad(angleDeg)),
        y: oy - arcRadius * Math.sin(toRad(angleDeg))
    };

    // Interior Arc Path
    const pathInterior = `M ${ox} ${oy} L ${ox + arcRadius} ${oy} A ${arcRadius} ${arcRadius} 0 0 0 ${arcEnd.x} ${arcEnd.y} Z`;

    // Exterior Arc Path (Reflex angle)
    const arcExtEnd = { ...arcEnd }; // It's the same coordinate, but swept the long way
    const pathExterior = `M ${ox} ${oy} L ${arcExtEnd.x} ${arcExtEnd.y} A ${arcRadius} ${arcRadius} 0 1 1 ${ox + arcRadius} ${oy} Z`;

    const highlightStyle = (part) => ({
        transition: 'all 0.3s ease',
        filter: highlight === part ? 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' : 'none',
        opacity: highlight && highlight !== part ? 0.3 : 1
    });

    return (
        <div style={{ height: '100%', display: 'flex' }}>
            
            {/* SVG Renderer */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg viewBox="0 0 800 500" style={{ width: '100%', height: '100%' }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
                        </marker>
                    </defs>

                    {/* Exterior Fill */}
                    <path 
                        d={pathExterior} 
                        fill={highlight === 'exterior' ? 'rgba(230, 115, 0, 0.4)' : 'transparent'} 
                        stroke={highlight === 'exterior' ? '#e67300' : 'rgba(255,255,255,0.1)'} 
                        strokeWidth="2"
                        style={highlightStyle('exterior')}
                    />

                    {/* Interior Fill */}
                    <path 
                        d={pathInterior} 
                        fill={highlight === 'interior' ? 'rgba(123, 97, 255, 0.6)' : 'rgba(123, 97, 255, 0.2)'} 
                        style={highlightStyle('interior')}
                    />

                    {/* Rays */}
                    <line 
                        x1={ox} y1={oy} x2={ptA.x} y2={ptA.y} 
                        stroke={highlight === 'rays' ? '#ffd60a' : '#fff'} 
                        strokeWidth={highlight === 'rays' ? 6 : 4} 
                        markerEnd="url(#arrowhead)" 
                        style={highlightStyle('rays')}
                    />
                    <line 
                        x1={ox} y1={oy} x2={ptB.x} y2={ptB.y} 
                        stroke={highlight === 'rays' ? '#ffd60a' : '#fff'} 
                        strokeWidth={highlight === 'rays' ? 6 : 4} 
                        markerEnd="url(#arrowhead)" 
                        style={highlightStyle('rays')}
                    />

                    {/* Vertex */}
                    <circle 
                        cx={ox} cy={oy} r={8} 
                        fill={highlight === 'vertex' ? '#ff375f' : '#fff'} 
                        stroke={highlight === 'vertex' ? 'rgba(255, 55, 95, 0.5)' : 'none'}
                        strokeWidth="10"
                        style={highlightStyle('vertex')}
                    />

                    {/* Labels */}
                    <text x={ox - 25} y={oy + 25} fill="#fff" fontSize="24" fontFamily="serif">O</text>
                    <text x={ptA.x + 15} y={ptA.y + 8} fill="#fff" fontSize="24" fontFamily="serif">A</text>
                    <text x={ptB.x + 10} y={ptB.y - 10} fill="#fff" fontSize="24" fontFamily="serif">B</text>
                </svg>
            </div>

            {/* Interaction Panel */}
            <div style={{ width: '300px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#fff' }}>Identify Parts</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '20px' }}>
                    Hover over the buttons below to visually highlight the corresponding features of the angle.
                </p>

                {['Vertex', 'Rays', 'Interior', 'Exterior'].map(part => {
                    const id = part.toLowerCase();
                    return (
                        <button
                            key={id}
                            onMouseEnter={() => setHighlight(id)}
                            onMouseLeave={() => setHighlight(null)}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: highlight === id ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
                                border: highlight === id ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 600,
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: highlight === id ? 'translateX(-10px)' : 'none'
                            }}
                        >
                            {part}
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
