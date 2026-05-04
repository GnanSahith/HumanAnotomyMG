import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function DrawingAnglesGame() {
    const [targetAngle, setTargetAngle] = useState(45);
    const [userAngle, setUserAngle] = useState(0);
    const [gameState, setGameState] = useState('playing'); // 'playing', 'checked'
    const [score, setScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [rounds, setRounds] = useState(0);

    const [isDragging, setIsDragging] = useState(false);
    const svgRef = useRef(null);

    // Geometry constants
    const ox = 400;
    const oy = 350;
    const rayLength = 300;

    const toRad = (deg) => (deg * Math.PI) / 180;

    const generateNewTarget = () => {
        // Random angle between 10 and 170
        const randomTarget = Math.floor(Math.random() * 160) + 10;
        setTargetAngle(randomTarget);
        setGameState('playing');
    };

    // Initialize game
    useEffect(() => {
        generateNewTarget();
    }, []);

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

    const handlePointerMove = useCallback((e) => {
        if (!isDragging || gameState !== 'playing') return;
        const newAngleDeg = getPointerAngle(e.clientX, e.clientY);
        const validAngle = Math.max(0, Math.min(Math.round(newAngleDeg), 180));
        setUserAngle(validAngle);
    }, [isDragging, gameState]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
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
    }, [isDragging, handlePointerMove, handlePointerUp]);

    const handleCheck = () => {
        const diff = Math.abs(targetAngle - userAngle);
        let currentScore = 0;
        
        if (diff === 0) currentScore = 100;
        else if (diff <= 2) currentScore = 95;
        else if (diff <= 5) currentScore = 80;
        else if (diff <= 10) currentScore = 60;
        else currentScore = Math.max(0, 100 - (diff * 2));

        setScore(currentScore);
        setTotalScore(prev => prev + currentScore);
        setRounds(prev => prev + 1);
        setGameState('checked');
    };

    const ptA = { x: ox + rayLength, y: oy };
    const ptUser = {
        x: ox + rayLength * Math.cos(toRad(userAngle)),
        y: oy - rayLength * Math.sin(toRad(userAngle))
    };
    const ptTarget = {
        x: ox + rayLength * Math.cos(toRad(targetAngle)),
        y: oy - rayLength * Math.sin(toRad(targetAngle))
    };

    // User Arc
    const arcRadius = 80;
    const pathUserArc = `M ${ox + arcRadius} ${oy} 
        A ${arcRadius} ${arcRadius} 0 0 0 ${ox + arcRadius * Math.cos(toRad(userAngle))} ${oy - arcRadius * Math.sin(toRad(userAngle))}`;

    return (
        <div style={{ height: '100%', display: 'flex' }}>
            
            {/* SVG Renderer */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                
                {/* Visual Feedback overlay */}
                {gameState === 'checked' && (
                    <div style={{ position: 'absolute', top: '40px', left: '0', right: '0', textAlign: 'center', zIndex: 10 }}>
                        <div style={{ 
                            display: 'inline-block', 
                            padding: '12px 30px', 
                            borderRadius: '100px', 
                            background: score > 80 ? 'rgba(48, 209, 88, 0.2)' : score > 50 ? 'rgba(255, 214, 10, 0.2)' : 'rgba(255, 55, 95, 0.2)',
                            color: score > 80 ? '#30d158' : score > 50 ? '#ffd60a' : '#ff375f',
                            border: `1px solid ${score > 80 ? '#30d158' : score > 50 ? '#ffd60a' : '#ff375f'}`,
                            fontSize: '24px', 
                            fontWeight: 'bold' 
                        }}>
                            {score}% Accuracy
                        </div>
                        <div style={{ color: '#fff', marginTop: '10px', fontSize: '18px' }}>
                            You drew {userAngle}°. The target was {targetAngle}°.
                        </div>
                    </div>
                )}

                <svg ref={svgRef} viewBox="0 0 800 500" style={{ width: '100%', height: '100%', touchAction: 'none' }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
                        </marker>
                        <marker id="arrowheadUser" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#0a84ff" />
                        </marker>
                        <marker id="arrowheadTarget" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#30d158" />
                        </marker>
                    </defs>

                    {/* Fixed Ray OA */}
                    <line x1={ox} y1={oy} x2={ptA.x} y2={ptA.y} stroke="#fff" strokeWidth="4" markerEnd="url(#arrowhead)" />
                    
                    {/* User Ray OB */}
                    <line x1={ox} y1={oy} x2={ptUser.x} y2={ptUser.y} stroke="#0a84ff" strokeWidth="4" markerEnd="url(#arrowheadUser)" />

                    {/* Draggable Anchor on User Ray */}
                    <circle 
                        cx={ox + 200 * Math.cos(toRad(userAngle))} 
                        cy={oy - 200 * Math.sin(toRad(userAngle))} 
                        r={16} 
                        fill={gameState === 'playing' ? "#0a84ff" : "rgba(10, 132, 255, 0.4)"} 
                        stroke="#fff" 
                        strokeWidth="2"
                        style={{ cursor: gameState === 'playing' ? 'grab' : 'default' }}
                        onPointerDown={(e) => { 
                            if (gameState === 'playing') {
                                e.preventDefault(); 
                                setIsDragging(true); 
                            }
                        }}
                    />

                    {/* User Arc Map */}
                    <path d={pathUserArc} fill="none" stroke="#0a84ff" strokeWidth="2" strokeDasharray="4 4" />

                    {/* Reveal Target Angle after check */}
                    {gameState === 'checked' && (
                        <>
                            <line 
                                x1={ox} y1={oy} x2={ptTarget.x} y2={ptTarget.y} 
                                stroke="#30d158" strokeWidth="3" 
                                strokeDasharray="8 8"
                                markerEnd="url(#arrowheadTarget)" 
                            />
                            <path 
                                d={`M ${ox + 60} ${oy} A 60 60 0 0 0 ${ox + 60 * Math.cos(toRad(targetAngle))} ${oy - 60 * Math.sin(toRad(targetAngle))}`} 
                                fill="none" stroke="#30d158" strokeWidth="2" 
                            />
                        </>
                    )}
                </svg>
            </div>

            {/* Interaction Panel */}
            <div style={{ width: '380px', padding: '40px 30px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '24px', color: '#fff', margin: 0 }}>Drawing Game</h3>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '100px', fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                        Avg Score: {rounds > 0 ? Math.round(totalScore / rounds) : 0}%
                    </div>
                </div>
                
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', marginBottom: '20px' }}>
                    Grab the blue point and drag it to create an angle as accurately as possible.
                </p>

                <div style={{ 
                    background: 'rgba(10, 132, 255, 0.1)', 
                    border: '1px solid rgba(10, 132, 255, 0.3)', 
                    padding: '24px', 
                    borderRadius: '16px', 
                    textAlign: 'center',
                    marginBottom: '40px'
                }}>
                    <div style={{ color: '#0a84ff', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                        Your Target
                    </div>
                    <div style={{ color: '#fff', fontSize: '48px', fontWeight: 'bold', fontFamily: 'serif' }}>
                        {targetAngle}°
                    </div>
                </div>

                <div style={{ flex: 1 }}></div>

                {gameState === 'playing' ? (
                    <button 
                        onClick={handleCheck}
                        style={{
                            padding: '18px',
                            background: '#0a84ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '18px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.3s ease'
                        }}
                    >
                        Check Accuracy
                    </button>
                ) : (
                    <button 
                        onClick={generateNewTarget}
                        style={{
                            padding: '18px',
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '18px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.3s ease'
                        }}
                    >
                        Next Round
                    </button>
                )}
            </div>
        </div>
    );
}
