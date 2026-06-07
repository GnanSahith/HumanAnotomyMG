import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Thermometer } from 'lucide-react';

const CustomFriction = ({ onBack, title }) => {
    const canvasRef = useRef(null);
    
    // Physics and interaction state
    const [temperature, setTemperature] = useState(0); // 0 to 1
    const [bookX, setBookX] = useState(0); // offset of the top book
    const [isDragging, setIsDragging] = useState(false);
    
    const requestRef = useRef();
    const lastMouseX = useRef(null);
    const atomsRef = useRef([]);

    // Initialize atoms
    const initAtoms = () => {
        const atoms = [];
        // Yellow atoms (bottom book) - 4 rows
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 20; col++) {
                atoms.push({
                    type: 'bottom',
                    baseX: col * 30 - 300,
                    baseY: row * 30 + 15,
                    vx: 0, vy: 0,
                    x: col * 30 - 300,
                    y: row * 30 + 15,
                    color: '#f1c40f',
                    detached: false
                });
            }
        }
        // Green atoms (top book) - 4 rows
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 20; col++) {
                atoms.push({
                    type: 'top',
                    baseX: col * 30 - 300,
                    baseY: -row * 30 - 15,
                    vx: 0, vy: 0,
                    x: col * 30 - 300,
                    y: -row * 30 - 15,
                    color: '#2ecc71',
                    detached: false
                });
            }
        }
        atomsRef.current = atoms;
    };

    useEffect(() => {
        initAtoms();
    }, []);

    // Animation Loop
    const animate = () => {
        setTemperature(prev => {
            let newTemp = prev - 0.002; // Cooling
            if (newTemp < 0) newTemp = 0;
            return newTemp;
        });

        if (canvasRef.current && atomsRef.current.length > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);
            
            // Draw background lens
            ctx.save();
            ctx.translate(width / 2, height / 2);

            // Update and draw atoms
            setTemperature(currentTemp => {
                const jiggle = currentTemp * 25; // max 25px jiggle
                
                atomsRef.current.forEach(atom => {
                    if (atom.detached) {
                        atom.x += atom.vx;
                        atom.y += atom.vy;
                        atom.vy += 0.5; // gravity for detached atoms
                    } else {
                        // Base position plus jiggle
                        let bx = atom.baseX;
                        if (atom.type === 'top') bx += bookX;
                        
                        atom.x = bx + (Math.random() - 0.5) * jiggle;
                        atom.y = atom.baseY + (Math.random() - 0.5) * jiggle;

                        // Check detach condition
                        if (currentTemp > 0.95 && Math.random() < 0.05 && atom.type === 'top' && atom.baseY > -50) {
                            atom.detached = true;
                            atom.vx = (Math.random() - 0.5) * 20;
                            atom.vy = -Math.random() * 20;
                        }
                    }

                    // Draw atom
                    ctx.beginPath();
                    ctx.arc(atom.x, atom.y, 14, 0, Math.PI * 2);
                    ctx.fillStyle = atom.color;
                    ctx.fill();
                    // Atom shading
                    ctx.beginPath();
                    ctx.arc(atom.x - 4, atom.y - 4, 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.fill();
                });
                
                return currentTemp;
            });

            ctx.restore();
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [bookX]);

    const handlePointerDown = (e) => {
        setIsDragging(true);
        lastMouseX.current = e.clientX;
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouseX.current;
        lastMouseX.current = e.clientX;
        
        setBookX(prev => {
            const nextX = prev + dx;
            // Limit dragging range
            if (nextX > 150) return 150;
            if (nextX < -150) return -150;
            return nextX;
        });

        // Generate heat based on movement
        setTemperature(prev => {
            let nextTemp = prev + Math.abs(dx) * 0.005;
            if (nextTemp > 1) nextTemp = 1;
            return nextTemp;
        });
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        lastMouseX.current = null;
    };

    const handleReset = () => {
        setTemperature(0);
        setBookX(0);
        setIsDragging(false);
        initAtoms();
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
            {/* Header */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button 
                        onClick={onBack}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{title}</h2>
                </div>
                <button 
                    onClick={handleReset}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e74c3c', border: 'none', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    <RotateCcw size={18} /> Reset
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', padding: '40px', gap: '40px', overflow: 'hidden' }}>
                
                {/* Books Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    
                    {/* Chemistry Book (Top - Draggable) */}
                    <div 
                        onPointerDown={handlePointerDown}
                        style={{
                            width: '300px',
                            height: '60px',
                            background: '#2ecc71',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '24px',
                            transform: `translateX(${bookX}px)`,
                            cursor: isDragging ? 'grabbing' : 'grab',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.3), inset 0 2px 5px rgba(255,255,255,0.3)',
                            userSelect: 'none',
                            touchAction: 'none',
                            zIndex: 2
                        }}
                    >
                        Chemistry
                    </div>

                    {/* Physics Book (Bottom - Fixed) */}
                    <div 
                        style={{
                            width: '300px',
                            height: '60px',
                            background: '#f1c40f',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '24px',
                            color: '#000',
                            marginTop: '-2px',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.3), inset 0 2px 5px rgba(255,255,255,0.3)',
                            userSelect: 'none',
                            zIndex: 1
                        }}
                    >
                        Physics
                    </div>

                    {/* Magnifying connection line could go here */}
                    <div style={{
                        position: 'absolute',
                        right: '-20px',
                        top: '50%',
                        width: '80px',
                        height: '2px',
                        background: 'rgba(255,255,255,0.2)',
                        transform: 'translateY(-50%)'
                    }} />
                </div>

                {/* Magnifier / Atoms Canvas */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.4)',
                        border: '8px solid #555',
                        boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 50px rgba(0,0,0,0.8)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <canvas 
                            ref={canvasRef}
                            width={400}
                            height={400}
                            style={{ width: '100%', height: '100%', display: 'block' }}
                        />
                    </div>
                </div>

                {/* Thermometer */}
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <Thermometer size={48} color={temperature > 0.8 ? '#e74c3c' : '#bdc3c7'} />
                    <div style={{
                        width: '30px',
                        height: '300px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255,255,255,0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Red liquid */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${Math.max(10, temperature * 100)}%`,
                            background: 'linear-gradient(to top, #c0392b, #e74c3c)',
                            transition: 'height 0.1s linear',
                            borderRadius: '20px'
                        }} />
                    </div>
                    <div style={{ fontWeight: 'bold' }}>Temperature</div>
                </div>

            </div>

            {/* Global pointer handlers to allow dragging outside the book bounds */}
            {isDragging && (
                <div 
                    style={{ position: 'absolute', inset: 0, zIndex: 9999, cursor: 'grabbing' }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
            )}
        </div>
    );
};

export default CustomFriction;
