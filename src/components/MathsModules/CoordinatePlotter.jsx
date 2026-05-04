import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function CoordinatePlotter() {
    const [targetCoordinate, setTargetCoordinate] = useState({ x: 3, y: -2 });
    const [userCoordinate, setUserCoordinate] = useState({ x: 0, y: 0 });
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState('playing'); // playing, checked

    const svgRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Grid constants
    const gridSize = 400; // Total width/height of the grid rendering area
    const center = gridSize / 2;
    const step = 40; // Pixels per unit
    const maxUnits = 5; // Grid goes from -5 to +5

    const generateNewTarget = () => {
        let newX, newY;
        do {
            newX = Math.floor(Math.random() * (maxUnits * 2 + 1)) - maxUnits;
            newY = Math.floor(Math.random() * (maxUnits * 2 + 1)) - maxUnits;
        } while (newX === targetCoordinate.x && newY === targetCoordinate.y);
        
        setTargetCoordinate({ x: newX, y: newY });
        setUserCoordinate({ x: 0, y: 0 });
        setGameState('playing');
    };

    const getGridCoordinate = (clientX, clientY) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        
        // Convert SVG coordinates to grid coordinates and snap to nearest integer
        let gridX = Math.round((svgP.x - center) / step);
        let gridY = Math.round((center - svgP.y) / step); // Flipped Y for Cartesian

        // Clamp to grid limits
        gridX = Math.max(-maxUnits, Math.min(maxUnits, gridX));
        gridY = Math.max(-maxUnits, Math.min(maxUnits, gridY));

        return { x: gridX, y: gridY };
    };

    const handlePointerMove = useCallback((e) => {
        if (!isDragging || gameState !== 'playing') return;
        const newCoord = getGridCoordinate(e.clientX, e.clientY);
        setUserCoordinate(newCoord);
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

    const checkAnswer = () => {
        if (userCoordinate.x === targetCoordinate.x && userCoordinate.y === targetCoordinate.y) {
            setScore(s => s + 1);
            setGameState('checked');
            setTimeout(generateNewTarget, 2000);
        } else {
            // Give a visual shake or feedback (implementing via state if needed, but for now just visual text update could suffice)
        }
    };

    // Calculate pixel positions
    const getSvgPoint = (gridX, gridY) => ({
        x: center + (gridX * step),
        y: center - (gridY * step)
    });

    const userPt = getSvgPoint(userCoordinate.x, userCoordinate.y);
    const targetPt = getSvgPoint(targetCoordinate.x, targetCoordinate.y);

    // Draw Grid Lines
    const gridLines = [];
    for (let i = -maxUnits; i <= maxUnits; i++) {
        // Vertical
        gridLines.push(
            <line key={`v${i}`} x1={center + i * step} y1={0} x2={center + i * step} y2={gridSize} 
                stroke={i === 0 ? "#ffffff" : "rgba(255,255,255,0.15)"} 
                strokeWidth={i === 0 ? 3 : 1} />
        );
        // Horizontal
        gridLines.push(
            <line key={`h${i}`} x1={0} y1={center - i * step} x2={gridSize} y2={center - i * step} 
                stroke={i === 0 ? "#ffffff" : "rgba(255,255,255,0.15)"} 
                strokeWidth={i === 0 ? 3 : 1} />
        );
        
        // Axis Labels (exclude 0 to avoid clutter at origin)
        if (i !== 0) {
            gridLines.push(
                <text key={`lx${i}`} x={center + i * step} y={center + 15} fill="#ffffff" fontSize="12" textAnchor="middle" opacity="0.7">{i}</text>
            );
            gridLines.push(
                <text key={`ly${i}`} x={center - 10} y={center - i * step + 4} fill="#ffffff" fontSize="12" textAnchor="end" opacity="0.7">{i}</text>
            );
        }
    }

    return (
        <div style={{ height: '100%', display: 'flex' }}>
            
            {/* SVG Renderer */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg ref={svgRef} viewBox={`0 0 ${gridSize} ${gridSize}`} style={{ width: '100%', maxWidth: '500px', maxHeight: '500px', touchAction: 'none' }}>
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {gridLines}

                    {/* Target Output (Only show if checked or hint mode) */}
                    {gameState === 'checked' && (
                        <>
                            <circle cx={targetPt.x} cy={targetPt.y} r={12} fill="transparent" stroke="#30d158" strokeWidth="4" />
                            <text x={targetPt.x + 15} y={targetPt.y - 15} fill="#30d158" fontSize="16" fontWeight="bold">Correct!</text>
                        </>
                    )}

                    {/* Guide Lines for User Coordinate */}
                    <line x1={center} y1={userPt.y} x2={userPt.x} y2={userPt.y} stroke="#0a84ff" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                    <line x1={userPt.x} y1={center} x2={userPt.x} y2={userPt.y} stroke="#0a84ff" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />

                    {/* User Point (Draggable) */}
                    <circle 
                        cx={userPt.x} 
                        cy={userPt.y} 
                        r={14} 
                        fill="#0a84ff" 
                        stroke="#fff" 
                        strokeWidth="3"
                        filter="url(#glow)"
                        style={{ cursor: gameState === 'playing' ? 'grab' : 'default' }}
                        onPointerDown={(e) => { 
                            if (gameState === 'playing') {
                                e.preventDefault(); 
                                setIsDragging(true); 
                            }
                        }}
                    />
                </svg>
            </div>

            {/* Interaction Panel */}
            <div style={{ width: '300px', padding: '40px 30px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '24px', color: '#fff', margin: 0 }}>Coordinates</h3>
                    <div style={{ background: 'rgba(48,209,88,0.2)', padding: '5px 12px', borderRadius: '100px', fontSize: '14px', color: '#30d158', fontWeight: 'bold' }}>
                        Score: {score}
                    </div>
                </div>
                
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', marginBottom: '30px' }}>
                    Drag the blue point to plot the requested coordinate on the Cartesian plane.
                </p>

                <div style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    padding: '24px', 
                    borderRadius: '16px', 
                    textAlign: 'center',
                    marginBottom: '40px'
                }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        Target Location
                    </div>
                    <div style={{ color: '#fff', fontSize: '48px', fontWeight: 'bold', fontFamily: 'serif', letterSpacing: '4px' }}>
                        ({targetCoordinate.x}, {targetCoordinate.y})
                    </div>
                </div>

                <div style={{ 
                    background: 'rgba(10, 132, 255, 0.1)', 
                    border: '1px solid rgba(10, 132, 255, 0.3)', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    textAlign: 'center',
                    marginBottom: '20px'
                }}>
                    <div style={{ color: '#0a84ff', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        Current Position
                    </div>
                    <div style={{ color: '#0a84ff', fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif', letterSpacing: '2px' }}>
                        ({userCoordinate.x}, {userCoordinate.y})
                    </div>
                </div>

                <div style={{ flex: 1 }}></div>

                {gameState === 'playing' ? (
                    <button 
                        onClick={checkAnswer}
                        style={{
                            padding: '16px',
                            background: (userCoordinate.x === targetCoordinate.x && userCoordinate.y === targetCoordinate.y) ? '#30d158' : '#0a84ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '18px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Place Point
                    </button>
                ) : (
                    <button 
                        disabled
                        style={{
                            padding: '16px',
                            background: 'rgba(48,209,88,0.2)',
                            color: '#30d158',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '18px',
                            fontWeight: 600,
                            cursor: 'default'
                        }}
                    >
                        Perfect!
                    </button>
                )}
            </div>
        </div>
    );
}
