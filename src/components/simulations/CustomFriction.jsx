import React, { useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Thermometer } from 'lucide-react';

const CustomFriction = ({ onBack, title }) => {
    const canvasRef = useRef(null);
    const bookRef = useRef(null);
    const thermoRef = useRef(null);
    
    // Physics and interaction state stored in refs to prevent re-renders
    
    const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
        const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
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
        
        const dx = (e.clientX - s.lastMouseX) * (canvas.width / rect.width);
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
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
            <style>{`
                .glass-btn-back { transition: all 0.3s ease; }
                .glass-btn-back:hover { background: rgba(255, 55, 95, 0.8) !important; border-color: #ff375f !important; }
                .glass-btn-reset { transition: all 0.3s ease; }
                .glass-btn-reset:hover { background: rgba(52, 152, 219, 0.4) !important; border-color: #3498db !important; }
            `}</style>
            
            {/* Top Header Bar */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <button 
                    onClick={onBack}
                    className="glass-btn-back"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                >
                    <ArrowLeft size={18} /> Back
                </button>
                <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
                    {title}
                </h2>
                <button 
                    onClick={initAtoms}
                    className="glass-btn-reset"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                >
                    <RotateCcw size={18} /> Reset
                </button>
            </div>

            {/* Left Floating Control Panel (Books) */}
            <div style={{
                position: 'absolute',
                left: '40px',
                top: '120px',
                bottom: '40px',
                width: '340px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box'
            }}>
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#3498db', fontWeight: '600' }}>Friction Simulation</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                        Drag the top book back and forth to create friction and heat.
                    </p>
                </div>

                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '4px' }}>
                    <div 
                        ref={bookRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{
                            width: '260px',
                            height: '60px',
                            background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '22px',
                            cursor: 'grab',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                            userSelect: 'none',
                            touchAction: 'none',
                            zIndex: 2
                        }}
                    >
                        Chemistry
                    </div>

                    <div 
                        style={{
                            width: '260px',
                            height: '60px',
                            background: 'linear-gradient(135deg, #f1c40f, #f39c12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '22px',
                            color: '#1a1a2e',
                            marginTop: '-2px',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                            userSelect: 'none',
                            zIndex: 1
                        }}
                    >
                        Physics
                    </div>
                </div>
            </div>

            {/* Canvas / Main View */}
            <div style={{ 
                position: 'absolute', 
                inset: 0, 
                zIndex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                pointerEvents: 'none'
            }}>
               <div style={{
                   width: '400px',
                   height: '400px',
                   borderRadius: '50%',
                   background: 'rgba(10, 10, 20, 0.6)',
                   border: '4px solid rgba(52, 152, 219, 0.3)',
                   boxShadow: '0 0 40px rgba(52, 152, 219, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.8)',
                   overflow: 'hidden',
                   position: 'relative',
                   backdropFilter: 'blur(4px)',
                   pointerEvents: 'auto'
               }}>
                   
            <div style={{ position: 'absolute', top: '80px', bottom: '20px', left: '20px', right: '390px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                    width: 800, 
                    height: 600, 
                    transform: `scale(${Math.min(Math.max(windowSize.w - 410, 100) / 800, Math.max(windowSize.h - 100, 100) / 600)})`, 
                    transformOrigin: 'center center' 
                }}>
                    <canvas 
                       ref={canvasRef}
                       width={400}
                       height={400}
                       style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                   />
                </div>
            </div>
        
               </div>
            </div>

            {/* Right Floating Control Panel (Thermometer) */}
            <div style={{
                position: 'absolute',
                right: '40px',
                top: '120px',
                bottom: '40px',
                width: '140px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                zIndex: 10,
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                boxSizing: 'border-box'
            }}>
                <Thermometer size={40} color={'#ff375f'} style={{ filter: 'drop-shadow(0 0 8px rgba(255, 55, 95, 0.5))' }} />
                <div style={{
                    width: '24px',
                    flex: 1,
                    maxHeight: '260px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                }}>
                    <div 
                        ref={thermoRef}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '10%',
                            background: 'linear-gradient(to top, #ff375f, #ff7b93)',
                            borderRadius: '12px',
                            boxShadow: '0 0 10px rgba(255, 55, 95, 0.8)',
                            transition: 'height 0.1s ease'
                        }} 
                    />
                </div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Temperature</div>
            </div>
        </div>
    );
};

export default CustomFriction;
