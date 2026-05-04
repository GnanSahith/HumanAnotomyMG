import React, { useState } from 'react';

export default function GeometricEntities() {
    const [activeEntity, setActiveEntity] = useState('point');

    const renderEntity = () => {
        switch (activeEntity) {
            case 'point':
                return (
                    <g>
                        <circle cx="400" cy="250" r="10" fill="#ff375f" />
                        <text x="415" y="240" fill="#fff" fontSize="24" fontFamily="serif" fontWeight="bold">A</text>
                    </g>
                );
            case 'line':
                return (
                    <g>
                        <line x1="100" y1="250" x2="700" y2="250" stroke="#0a84ff" strokeWidth="4" />
                        {/* Arrows on both ends */}
                        <polygon points="100,250 115,242 115,258" fill="#0a84ff" />
                        <polygon points="700,250 685,242 685,258" fill="#0a84ff" />
                        
                        <circle cx="300" cy="250" r="8" fill="#fff" />
                        <text x="295" y="235" fill="#fff" fontSize="24" fontFamily="serif" fontWeight="bold">A</text>
                        
                        <circle cx="500" cy="250" r="8" fill="#fff" />
                        <text x="495" y="235" fill="#fff" fontSize="24" fontFamily="serif" fontWeight="bold">B</text>
                    </g>
                );
            case 'segment':
                return (
                    <g>
                        <line x1="200" y1="250" x2="600" y2="250" stroke="#30d158" strokeWidth="4" />
                        {/* Endpoints */}
                        <circle cx="200" cy="250" r="10" fill="#30d158" stroke="#fff" strokeWidth="2" />
                        <text x="195" y="230" fill="#fff" fontSize="24" fontFamily="serif" fontWeight="bold">X</text>
                        
                        <circle cx="600" cy="250" r="10" fill="#30d158" stroke="#fff" strokeWidth="2" />
                        <text x="595" y="230" fill="#fff" fontSize="24" fontFamily="serif" fontWeight="bold">Y</text>
                    </g>
                );
            case 'ray':
                return (
                    <g>
                        <line x1="200" y1="250" x2="700" y2="250" stroke="#ffd60a" strokeWidth="4" />
                        {/* One arrow */}
                        <polygon points="700,250 685,242 685,258" fill="#ffd60a" />
                        
                        <circle cx="200" cy="250" r="10" fill="#ffd60a" stroke="#fff" strokeWidth="2" />
                        <text x="195" y="230" fill="#fff" fontSize="24" fontFamily="serif" fontWeight="bold">P</text>
                        
                        <circle cx="500" cy="250" r="8" fill="#fff" />
                        <text x="495" y="230" fill="#fff" fontSize="24" fontFamily="serif" fontWeight="bold">Q</text>
                    </g>
                );
            default: return null;
        }
    };

    const explanations = {
        point: { title: 'Point', text: 'A point marks an exact location. It has no length, width, or depth.' },
        line: { title: 'Line', text: 'A line is straight, has no thickness, and extends infinitely in both directions.' },
        segment: { title: 'Line Segment', text: 'A line segment is a part of a line bounded by two distinct end points.' },
        ray: { title: 'Ray', text: 'A ray has one endpoint and extends infinitely in one direction.' }
    };

    return (
        <div style={{ height: '100%', display: 'flex' }}>
            {/* SVG Renderer */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg viewBox="0 0 800 500" style={{ width: '100%', height: '100%' }}>
                    {renderEntity()}
                </svg>
            </div>

            {/* Interaction Panel */}
            <div style={{ width: '340px', padding: '40px 30px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '24px', color: '#fff', margin: '0 0 10px 0' }}>Geometric Entities</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '30px' }}>
                    Select an entity below to visualize defining characteristics of Euclidean geometry.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '30px' }}>
                    {[
                        { id: 'point', color: '#ff375f' },
                        { id: 'line', color: '#0a84ff' },
                        { id: 'segment', color: '#30d158' },
                        { id: 'ray', color: '#ffd60a' }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setActiveEntity(btn.id)}
                            style={{
                                padding: '16px',
                                background: activeEntity === btn.id ? `rgba(${btn.color === '#ff375f' ? '255,55,95' : btn.color === '#0a84ff' ? '10,132,255' : btn.color === '#30d158' ? '48,209,88' : '255,214,10'}, 0.2)` : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${activeEntity === btn.id ? btn.color : 'rgba(255,255,255,0.1)'}`,
                                color: activeEntity === btn.id ? btn.color : '#fff',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: activeEntity === btn.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize'
                            }}
                        >
                            {btn.id}
                        </button>
                    ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold', marginBottom: '10px' }}>
                        {explanations[activeEntity].title}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                        {explanations[activeEntity].text}
                    </div>
                </div>

                <div style={{ flex: 1 }}></div>
            </div>
        </div>
    );
}
