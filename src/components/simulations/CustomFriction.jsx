import React, { useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Thermometer } from 'lucide-react';

const CustomFriction = ({ onBack, title }) => {
    const canvasRef = useRef(null);
    const bookRef = useRef(null);
    const thermoRef = useRef(null);
    
    // Physics and interaction state stored in refs to prevent re-renders
    const stateRef = useRef({
        temperature: 0,
        bookX: 0,
        isDragging: false,
        lastMouseX: null
    });
    
    const requestRef = useRef();
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
        
        if (stateRef.current) {
            stateRef.current.temperature = 0;
            stateRef.current.bookX = 0;
            stateRef.current.isDragging = false;
        }
        
        updateDOM();
    };

    const updateDOM = () => {
        const s = stateRef.current;
        if (bookRef.current) {
            bookRef.current.style.transform = `translateX(${s.bookX}px)`;
            bookRef.current.style.cursor = s.isDragging ? 'grabbing' : 'grab';
        }
        if (thermoRef.current) {
            thermoRef.current.style.height = `${Math.max(10, s.temperature * 100)}%`;
        }
    };

    useEffect(() => {
        initAtoms();
        
        const animate = () => {
            const s = stateRef.current;
            
            // Cooling
            s.temperature -= 0.002;
            if (s.temperature < 0) s.temperature = 0;
            
            updateDOM();

            if (canvasRef.current && atomsRef.current.length > 0) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;

                ctx.clearRect(0, 0, width, height);
                ctx.save();
                ctx.translate(width / 2, height / 2);

                const jiggle = s.temperature * 25;
                
                atomsRef.current.forEach(atom => {
                    if (atom.detached) {
                        atom.x += atom.vx;
                        atom.y += atom.vy;
                        atom.vy += 0.5;
                    } else {
                        let bx = atom.baseX;
                        if (atom.type === 'top') bx += s.bookX;
                        
                        atom.x = bx + (Math.random() - 0.5) * jiggle;
                        atom.y = atom.baseY + (Math.random() - 0.5) * jiggle;

                        if (s.temperature > 0.95 && Math.random() < 0.05 && atom.type === 'top' && atom.baseY > -50) {
                            atom.detached = true;
                            atom.vx = (Math.random() - 0.5) * 20;
                            atom.vy = -Math.random() * 20;
                        }
                    }

                    ctx.beginPath();
                    ctx.arc(atom.x, atom.y, 14, 0, Math.PI * 2);
                    ctx.fillStyle = atom.color;
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(atom.x - 4, atom.y - 4, 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.fill();
                });
                
                ctx.restore();
            }
            requestRef.current = requestAnimationFrame(animate);
        };
        
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    const handlePointerDown = (e) => {
        e.target.setPointerCapture(e.pointerId);
        stateRef.current.isDragging = true;
        stateRef.current.lastMouseX = e.clientX;
        updateDOM();
    };

    const handlePointerMove = (e) => {
        const s = stateRef.current;
        if (!s.isDragging) return;
        
        const dx = e.clientX - s.lastMouseX;
        s.lastMouseX = e.clientX;
        
        s.bookX += dx;
        if (s.bookX > 150) s.bookX = 150;
        if (s.bookX < -150) s.bookX = -150;

        s.temperature += Math.abs(dx) * 0.005;
        if (s.temperature > 1) s.temperature = 1;
        
        updateDOM();
    };

    const handlePointerUp = (e) => {
        stateRef.current.isDragging = false;
        stateRef.current.lastMouseX = null;
        e.target.releasePointerCapture(e.pointerId);
        updateDOM();
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
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
                    onClick={initAtoms}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e74c3c', border: 'none', padding: '8px 16px', borderRadius: '100px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    <RotateCcw size={18} /> Reset
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', padding: '40px', gap: '40px', overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    
                    <div 
                        ref={bookRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
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
                            cursor: 'grab',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.3), inset 0 2px 5px rgba(255,255,255,0.3)',
                            userSelect: 'none',
                            touchAction: 'none',
                            zIndex: 2
                        }}
                    >
                        Chemistry
                    </div>

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
                </div>

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

                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <Thermometer size={48} color={'#e74c3c'} />
                    <div style={{
                        width: '30px',
                        height: '300px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255,255,255,0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div 
                            ref={thermoRef}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '10%',
                                background: 'linear-gradient(to top, #c0392b, #e74c3c)',
                                borderRadius: '20px'
                            }} 
                        />
                    </div>
                    <div style={{ fontWeight: 'bold' }}>Temperature</div>
                </div>
            </div>
        </div>
    );
};

export default CustomFriction;
