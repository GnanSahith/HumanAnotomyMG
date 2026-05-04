import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function AdjacentAngles() {
    const [activeTab, setActiveTab] = useState('adding');

    // Math logic states
    const [angleB_adding, setAngleB_adding] = useState(51);
    const [angleC_adding, setAngleC_adding] = useState(142);
    
    const [angleB_missing, setAngleB_missing] = useState(45);
    const [angleC_missing, setAngleC_missing] = useState(142);

    // Active working references based on Tab
    const angleB = activeTab === 'adding' ? angleB_adding : angleB_missing;
    const angleC = activeTab === 'adding' ? angleC_adding : angleC_missing;
    
    // Dragging state
    const [activeDrag, setActiveDrag] = useState(null); // 'B' or 'C'
    const svgRef = useRef(null);

    // Geometry constants
    const ox = 400;
    const oy = 350;
    const rayLength = 320;
    const arcRadiusC = 250;
    const arcRadiusB = 80;

    // Helper: Convert degrees to radians
    const toRad = (deg) => (deg * Math.PI) / 180;

    // Helper: Polar to Cartesian (SVG flipped Y)
    const getPoint = (radius, angleDeg) => {
        const rad = toRad(angleDeg);
        return {
            x: ox + radius * Math.cos(rad),
            y: oy - radius * Math.sin(rad)
        };
    };

    // Calculate mouse angle relative to origin
    const getPointerAngle = (clientX, clientY) => {
        if (!svgRef.current) return 0;
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        
        const dx = svgP.x - ox;
        const dy = oy - svgP.y; // Flipped Y
        let deg = Math.atan2(dy, dx) * (180 / Math.PI);
        if (deg < 0) deg += 360;
        return deg;
    };

    // Global drag handlers
    const handlePointerMove = useCallback((e) => {
        if (!activeDrag) return;
        const newAngleDeg = getPointerAngle(e.clientX, e.clientY);
        let validAngle = Math.round(newAngleDeg);

        if (activeTab === 'adding') {
            if (activeDrag === 'B') {
                validAngle = Math.max(10, Math.min(validAngle, angleC_adding - 10));
                setAngleB_adding(validAngle);
            } else if (activeDrag === 'C') {
                validAngle = Math.max(angleB_adding + 10, Math.min(validAngle, 170));
                setAngleC_adding(validAngle);
            }
        } else if (activeTab === 'missing') {
            if (activeDrag === 'C') {
                validAngle = Math.max(angleB_missing + 10, Math.min(validAngle, 170));
                setAngleC_missing(validAngle);
            }
        }
    }, [activeDrag, activeTab, angleB_adding, angleC_adding, angleB_missing]);

    const handlePointerUp = useCallback(() => {
        setActiveDrag(null);
    }, []);

    useEffect(() => {
        if (activeDrag) {
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
    }, [activeDrag, handlePointerMove, handlePointerUp]);

    // Derived Points
    const ptA = getPoint(rayLength, 0);
    const ptB = getPoint(arcRadiusC, angleB); 
    const ptBExt = getPoint(rayLength, angleB);
    const ptC = getPoint(arcRadiusC, angleC);
    const ptCExt = getPoint(rayLength, angleC);

    // Arcs SVG Paths
    const arcBEnd = getPoint(arcRadiusB, angleB);
    const pathAOB = `M ${ox} ${oy} L ${ox + arcRadiusB} ${oy} A ${arcRadiusB} ${arcRadiusB} 0 0 0 ${arcBEnd.x} ${arcBEnd.y} Z`;
    const arcCEnd = getPoint(arcRadiusC, angleC);
    const pathAOC = `M ${ox + arcRadiusC} ${oy} A ${arcRadiusC} ${arcRadiusC} 0 0 0 ${arcCEnd.x} ${arcCEnd.y}`;

    // Angle text positions (bisecting the angle)
    const posAOBText = getPoint(arcRadiusB + 40, angleB / 2);
    const posAOCText = getPoint(arcRadiusC + 35, angleC / 2);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Main Interactive Screen with Scroll Bug FIXED (overflowY: auto) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '0 20px 40px 20px', alignItems: 'center' }}>
                
                <div style={{ color: '#fff', fontSize: '24px', fontWeight: 500, alignSelf: 'flex-start', marginLeft: '10%', marginBottom: '20px' }}>
                    {activeTab === 'adding' 
                        ? 'Drag the points to explore missing angles measures.' 
                        : 'Type the known angle into the equation to calculate the missing angle.'}
                </div>

                {/* SVG Renderer */}
                <div style={{ width: '100%', maxWidth: '800px', height: '400px', flexShrink: 0, position: 'relative' }}>
                    <svg 
                        ref={svgRef} 
                        viewBox="0 0 800 450" 
                        style={{ width: '100%', height: '100%', touchAction: 'none' }}
                    >
                        <defs>
                            <marker id="arrowheadLight" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
                            </marker>
                        </defs>

                        {/* Angle Fills & Arcs */}
                        <path d={pathAOB} fill="#7b61ff" opacity="0.8" />
                        <path d={pathAOC} fill="none" stroke="#e67300" strokeWidth="4" />

                        {/* Rays */}
                        <line x1={ox} y1={oy} x2={ptA.x} y2={ptA.y} stroke="#fff" strokeWidth="4" markerEnd="url(#arrowheadLight)" />
                        <line x1={ox} y1={oy} x2={ptBExt.x} y2={ptBExt.y} stroke="#fff" strokeWidth="4" markerEnd="url(#arrowheadLight)" />
                        <line x1={ox} y1={oy} x2={ptCExt.x} y2={ptCExt.y} stroke="#fff" strokeWidth="4" markerEnd="url(#arrowheadLight)" />

                        {/* Draggable Points */}
                        {activeTab === 'adding' && (
                            <circle 
                                cx={ptB.x} cy={ptB.y} r={12} fill="#7b61ff" stroke="#fff" strokeWidth="2"
                                style={{ cursor: 'grab', opacity: activeDrag === 'B' ? 0.8 : 1 }}
                                onPointerDown={(e) => { e.preventDefault(); setActiveDrag('B'); }}
                            />
                        )}
                        <circle 
                            cx={ptC.x} cy={ptC.y} r={12} fill="#7b61ff" stroke="#fff" strokeWidth="2"
                            style={{ cursor: 'grab', opacity: activeDrag === 'C' ? 0.8 : 1 }}
                            onPointerDown={(e) => { e.preventDefault(); setActiveDrag('C'); }}
                        />

                        {/* Labels */}
                        <text x={ox - 20} y={oy + 25} fill="#fff" fontSize="24" fontFamily="serif" fontStyle="italic">O</text>
                        <text x={ptA.x + 15} y={ptA.y + 8} fill="#fff" fontSize="24" fontFamily="serif" fontStyle="italic">A</text>
                        <text x={ptBExt.x + 10} y={ptBExt.y - 10} fill="#8a8ee6" fontSize="24" fontFamily="serif" fontStyle="italic">B</text>
                        <text x={ptCExt.x - 20} y={ptCExt.y - 15} fill="#8a8ee6" fontSize="24" fontFamily="serif" fontStyle="italic">C</text>

                        {/* Dynamic Angle Text */}
                        <text x={posAOBText.x} y={posAOBText.y + 8} fill="#fff" fontSize="24" fontFamily="sans-serif">{angleB}°</text>
                        <text x={posAOCText.x} y={posAOCText.y} fill="#e67300" fontSize="24" fontFamily="sans-serif">{angleC}°</text>
                    </svg>
                </div>

                {/* Mathematical Proof Panel */}
                <div style={{ 
                    marginTop: '20px', 
                    display: 'grid', 
                    gridTemplateColumns: 'minmax(150px, 1fr) auto minmax(150px, 1fr)', 
                    gap: '15px 30px', 
                    alignItems: 'center', 
                    fontSize: '28px', 
                    fontFamily: 'serif', 
                    letterSpacing: '1px',
                    width: '100%',
                    maxWidth: '500px'
                }}>
                    
                    {/* Line 1 */}
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#fff' }}>m∠BOC + </span>
                        <span style={{ color: '#8a8ee6' }}>m∠AOB</span>
                    </div>
                    <div style={{ color: '#fff' }}>=</div>
                    <div style={{ color: '#e67300', textAlign: 'left' }}>{angleC}°</div>

                    {/* Line 2 with Input Support */}
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span style={{ color: '#fff', marginRight: '8px' }}>m∠BOC +</span>
                        {activeTab === 'adding' ? (
                            <span style={{ color: '#8a8ee6' }}>{angleB}°</span>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(138, 142, 230, 0.4)' }}>
                                <input 
                                    type="number" 
                                    value={angleB}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        const clamped = Math.max(1, Math.min(val, angleC - 1));
                                        setAngleB_missing(clamped);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#8a8ee6', fontSize: '28px', fontFamily: 'serif', width: '50px', textAlign: 'center', outline: 'none' }}
                                />
                                <span style={{ color: '#8a8ee6' }}>°</span>
                            </div>
                        )}
                    </div>
                    <div style={{ color: '#fff' }}>=</div>
                    <div style={{ color: '#e67300', textAlign: 'left' }}>{angleC}°</div>

                    {/* Line 3 */}
                    <div style={{ textAlign: 'right', color: '#fff' }}>
                        -{angleB}°
                    </div>
                    <div style={{ color: '#fff' }}>=</div>
                    <div style={{ color: '#fff', textAlign: 'left' }}>-{angleB}°</div>

                    {/* Divider Line (spans across the grid) */}
                    <div style={{ gridColumn: '1 / span 3', height: '1px', backgroundColor: '#fff', margin: '5px 0', opacity: 0.5 }}></div>

                    {/* Final Answer Line */}
                    <div style={{ textAlign: 'right', color: '#fff' }}>
                        m∠BOC
                    </div>
                    <div style={{ color: '#fff' }}>=</div>
                    <div style={{ color: '#fff', textAlign: 'left' }}>{angleC - angleB}°</div>

                </div>

            </div>
        </div>
    );
}
