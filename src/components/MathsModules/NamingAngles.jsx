import React, { useState } from 'react';

export default function NamingAngles() {
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState(false);

    // Geometry constants
    const ox = 400; // Vertex B
    const oy = 350;
    const rayLength = 250;
    const angleDeg = 60;

    const toRad = (deg) => (deg * Math.PI) / 180;

    const ptA = { x: ox + rayLength, y: oy }; // Ray BA
    const ptC = {
        x: ox + rayLength * Math.cos(toRad(angleDeg)),
        y: oy - rayLength * Math.sin(toRad(angleDeg))
    }; // Ray BC

    const possibleNames = ['∠ABC', '∠CBA', '∠B', '∠BAC', '∠BCA', '∠CAB'];
    const correctNames = ['∠ABC', '∠CBA', '∠B'];

    const toggleSelect = (name) => {
        if (checked) setChecked(false);
        if (selected.includes(name)) {
            setSelected(selected.filter(n => n !== name));
        } else {
            setSelected([...selected, name]);
        }
    };

    const isCorrectSelection = (name) => correctNames.includes(name);

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

                    {/* Rays */}
                    <line x1={ox} y1={oy} x2={ptA.x} y2={ptA.y} stroke="#fff" strokeWidth="4" markerEnd="url(#arrowhead)" />
                    <line x1={ox} y1={oy} x2={ptC.x} y2={ptC.y} stroke="#fff" strokeWidth="4" markerEnd="url(#arrowhead)" />

                    {/* Points */}
                    <circle cx={ox} cy={oy} r={6} fill="#ff375f" />
                    <circle cx={ptA.x - 30} cy={ptA.y} r={6} fill="#0a84ff" />
                    <circle cx={ptC.x - 30 * Math.cos(toRad(angleDeg))} cy={ptC.y + 30 * Math.sin(toRad(angleDeg))} r={6} fill="#0a84ff" />

                    {/* Labels */}
                    <text x={ox - 25} y={oy + 25} fill="#ff375f" fontSize="28" fontFamily="serif" fontWeight="bold">B</text>
                    <text x={ptA.x - 30} y={ptA.y + 25} fill="#0a84ff" fontSize="28" fontFamily="serif">A</text>
                    <text x={ptC.x - 45 * Math.cos(toRad(angleDeg))} cy={ptC.y + 45 * Math.sin(toRad(angleDeg))} y={ptC.y - 10} fill="#0a84ff" fontSize="28" fontFamily="serif">C</text>

                    {/* Angle Arc */}
                    <path d={`M ${ox + 60} ${oy} A 60 60 0 0 0 ${ox + 60 * Math.cos(toRad(angleDeg))} ${oy - 60 * Math.sin(toRad(angleDeg))}`} fill="none" stroke="#7b61ff" strokeWidth="3" />
                </svg>
            </div>

            {/* Interaction Panel */}
            <div style={{ width: '380px', padding: '40px 30px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#fff' }}>Name the Angle</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', marginBottom: '30px' }}>
                    Select all the mathematically correct ways to name the geometry shown on the left.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                    {possibleNames.map(name => {
                        const isSelected = selected.includes(name);
                        let bg = isSelected ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0,0,0,0.3)';
                        let border = isSelected ? '1px solid #0a84ff' : '1px solid rgba(255,255,255,0.1)';
                        
                        if (checked && isSelected) {
                            if (isCorrectSelection(name)) {
                                bg = 'rgba(48, 209, 88, 0.3)'; // Green
                                border = '1px solid #30d158';
                            } else {
                                bg = 'rgba(255, 55, 95, 0.3)'; // Red
                                border = '1px solid #ff375f';
                            }
                        } else if (checked && !isSelected && isCorrectSelection(name)) {
                            // Missed correct answer
                            border = '1px dashed #30d158';
                        }

                        return (
                            <button
                                key={name}
                                onClick={() => toggleSelect(name)}
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: bg,
                                    border: border,
                                    color: '#fff',
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    fontFamily: 'serif',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>

                <div style={{ flex: 1 }}></div>

                <button 
                    onClick={() => setChecked(true)}
                    disabled={selected.length === 0}
                    style={{
                        padding: '18px',
                        background: selected.length > 0 ? '#0a84ff' : 'rgba(255,255,255,0.1)',
                        color: selected.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '18px',
                        fontWeight: 600,
                        cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
                        transition: 'background 0.3s ease'
                    }}
                >
                    {checked ? 'Checked!' : 'Check Answers'}
                </button>
                
                {checked && (
                    <div style={{ marginTop: '15px', textAlign: 'center', color: selected.every(n => isCorrectSelection(n)) && selected.length === correctNames.length ? '#30d158' : '#ff375f', fontWeight: 600 }}>
                        {selected.every(n => isCorrectSelection(n)) && selected.length === correctNames.length 
                            ? 'Perfect! All correct names selected.' 
                            : 'Not quite. Check the dashed green borders for missed names!'}
                    </div>
                )}
            </div>
        </div>
    );
}
