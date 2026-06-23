import { useState, useEffect, useRef } from 'react';

const CustomFaradaysLawInner = ({ onBack, title }) => {
  const canvasRef = useRef(null);
  const graphCanvasRef = useRef(null);
  
  const [turns, setTurns] = useState(3);
  const [area, setArea] = useState(50);
  const [strength, setStrength] = useState(100);

  const state = useRef({
    magnetX: 200,
    magnetY: 200,
    isDragging: false,
    lastX: 200,
    lastTime: 0,
    velocity: 0,
    emf: 0,
    emfHistory: new Array(300).fill(0)
  });

  const [isDraggingState, setIsDraggingState] = useState(false);

  useEffect(() => {
    state.current.lastTime = performance.now();
  }, []);

  const getMouseCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    const displayedWidth = canvas.width * scale;
    const displayedHeight = canvas.height * scale;
    
    const offsetX = (rect.width - displayedWidth) / 2;
    const offsetY = (rect.height - displayedHeight) / 2;
    
    const mx = (clientX - rect.left - offsetX) / scale;
    const my = (clientY - rect.top - offsetY) / scale;
    
    return { mx, my };
  };

  const handleMouseDown = (e) => {
    const { mx: x, my: y } = getMouseCoordinates(e);
    
    const mx = state.current.magnetX;
    const my = state.current.magnetY;
    if (x >= mx - 80 && x <= mx + 80 && y >= my - 30 && y <= my + 30) {
      state.current.isDragging = true;
      setIsDraggingState(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!state.current.isDragging) return;
    const { mx: x } = getMouseCoordinates(e);
    state.current.magnetX = x;
  };

  const handleMouseUp = () => {
    state.current.isDragging = false;
    setIsDraggingState(false);
  };

  const handleMouseLeave = () => {
    state.current.isDragging = false;
    setIsDraggingState(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const graphCanvas = graphCanvasRef.current;
    const graphCtx = graphCanvas.getContext('2d');
    let animationFrameId;

    const draw = () => {
      const now = performance.now();
      const dt = (now - state.current.lastTime) / 1000;
      state.current.lastTime = now;

      if (dt > 0) {
        state.current.velocity = (state.current.magnetX - state.current.lastX) / dt;
        state.current.lastX = state.current.magnetX;
      } else {
        state.current.velocity = 0;
      }

      const coilX = canvas.width / 2;
      const x = state.current.magnetX - coilX;
      
      const sigma = 80;
      const B = strength;
      const A = area;
      const v = state.current.velocity;
      
      const expFactor = Math.exp(-(x * x) / (2 * sigma * sigma));
      let currentEmf = turns * B * A * ((x * v) / (sigma * sigma)) * expFactor;
      currentEmf = currentEmf * 0.0005;

      state.current.emf = state.current.emf * 0.8 + currentEmf * 0.2;

      state.current.emfHistory.push(state.current.emf);
      if (state.current.emfHistory.length > 300) {
        state.current.emfHistory.shift();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const mx = state.current.magnetX;
      const my = state.current.magnetY;
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.2)';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        ctx.beginPath();
        ctx.ellipse(mx, my, 120 + Math.abs(i) * 30, 40 + Math.abs(i) * 20, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      const coilRadius = 30 + area * 0.5;
      ctx.save();
      ctx.strokeStyle = '#cd7f32';
      ctx.lineWidth = 4;
      for (let i = 0; i < turns; i++) {
        ctx.beginPath();
        const offset = (i - turns / 2) * 8;
        ctx.ellipse(coilX + offset, my, 15, coilRadius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      const magW = 160;
      const magH = 60;
      const magLeft = mx - magW / 2;
      const magTop = my - magH / 2;

      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(magLeft, magTop, magW / 2, magH);
      
      ctx.fillStyle = '#3498db';
      ctx.fillRect(mx, magTop, magW / 2, magH);

      ctx.shadowColor = 'transparent';

      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', mx - magW / 4, my);
      ctx.fillText('S', mx + magW / 4, my);
      ctx.restore();

      const galvoX = coilX;
      const galvoY = my + coilRadius + 80;
      ctx.save();
      ctx.strokeStyle = '#333';
      ctx.fillStyle = '#222';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(galvoX, galvoY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(galvoX, galvoY, 35, Math.PI, 0);
      ctx.stroke();

      ctx.save();
      ctx.translate(galvoX, galvoY);
      const maxAngle = Math.PI / 4;
      const targetAngle = Math.max(-maxAngle, Math.min(maxAngle, (state.current.emf / 50) * maxAngle));
      ctx.rotate(targetAngle);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -32);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(galvoX, galvoY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const bulbX = coilX;
      const bulbY = my - coilRadius - 100;
      ctx.save();
      const brightness = Math.min(1, Math.abs(state.current.emf) / 20);
      
      if (brightness > 0.05) {
        const gradient = ctx.createRadialGradient(bulbX, bulbY, 15, bulbX, bulbY, 80);
        gradient.addColorStop(0, `rgba(255, 255, 100, ${brightness * 0.6})`);
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 100, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = brightness > 0.1 ? '#fff7a0' : '#444';
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.fillRect(bulbX - 10, bulbY + 15, 20, 15);
      ctx.strokeRect(bulbX - 10, bulbY + 15, 20, 15);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(coilX - 15, my - coilRadius);
      ctx.lineTo(coilX - 15, bulbY + 30);
      ctx.moveTo(coilX + 15, my - coilRadius);
      ctx.lineTo(coilX + 15, bulbY + 30);
      
      ctx.moveTo(coilX - 15, my + coilRadius);
      ctx.lineTo(coilX - 15, galvoY - 30);
      ctx.moveTo(coilX + 15, my + coilRadius);
      ctx.lineTo(coilX + 15, galvoY - 30);
      ctx.stroke();
      ctx.restore();

      // Draw Graph
      graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
      const gw = graphCanvas.width;
      const gh = graphCanvas.height;
      const midY = gh / 2;
      
      graphCtx.strokeStyle = 'rgba(255,255,255,0.1)';
      graphCtx.setLineDash([5, 5]);
      graphCtx.beginPath();
      graphCtx.moveTo(0, midY);
      graphCtx.lineTo(gw, midY);
      graphCtx.stroke();
      graphCtx.setLineDash([]);

      graphCtx.strokeStyle = '#3498db';
      graphCtx.lineWidth = 2;
      graphCtx.beginPath();
      
      const history = state.current.emfHistory;
      for (let i = 0; i < history.length; i++) {
        const hx = (i / history.length) * gw;
        const hy = midY - (history[i] / 100) * (gh / 2);
        if (i === 0) graphCtx.moveTo(hx, hy);
        else graphCtx.lineTo(hx, hy);
      }
      graphCtx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [turns, area, strength]);

  const handleResetMagnet = () => {
    state.current.magnetX = 200;
    state.current.velocity = 0;
    state.current.emf = 0;
    state.current.emfHistory.fill(0);
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative', background: '#0a0a1a', overflow: 'hidden',
      fontFamily: "'Inter', sans-serif", color: '#fff',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Top Header Bar */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', right: '340px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        {onBack ? (
          <button 
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
          >
            Back
          </button>
        ) : <div />}
        <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
          {title || "Faraday's Law of Induction"}
        </h1>
        <button 
          onClick={handleResetMagnet}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px',
            color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease',
            fontWeight: 600, fontFamily: "'Inter', sans-serif"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
        >
          Reset Magnet
        </button>
      </div>

      {/* Canvas / Main View */}
      <div style={{ flex: 1, padding: '90px 340px 20px 20px', boxSizing: 'border-box', position: 'relative', zIndex: 1, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        
        {/* Main Canvas View */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 1, minHeight: '300px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(20,20,30,0.4)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', cursor: isDraggingState ? 'grabbing' : 'grab' }}
          />
        </div>
        
        {/* Graph view */}
        <div style={{ width: '100%', maxWidth: '800px', height: '140px', flexShrink: 0, padding: '16px', background: 'rgba(20,20,30,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', backdropFilter: 'blur(8px)', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>EMF vs Time (Oscilloscope)</span>
          <canvas 
            ref={graphCanvasRef} 
            width={800} 
            height={100} 
            style={{ display: 'block', width: '100%', height: 'calc(100% - 25px)', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* Floating Control Panel */}
      <div style={{
        position: 'absolute', top: '20px', right: '20px', width: '300px',
        background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px',
        zIndex: 10, color: 'white', fontFamily: "'Inter', sans-serif",
        maxHeight: 'calc(100% - 40px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box'
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>System Controls</label>
          
          {/* Turns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>Number of Turns (N)</span>
              <span style={{ color: '#3498db', fontWeight: 'bold' }}>{turns}</span>
            </div>
            <input 
              type="range" min="1" max="10" step="1" 
              value={turns} onChange={(e) => setTurns(Number(e.target.value))} 
              style={{ width: '100%', accentColor: '#3498db' }}
            />
          </div>

          {/* Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>Coil Area (A)</span>
              <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{area}</span>
            </div>
            <input 
              type="range" min="20" max="100" step="1" 
              value={area} onChange={(e) => setArea(Number(e.target.value))} 
              style={{ width: '100%', accentColor: '#2ecc71' }}
            />
          </div>

          {/* Strength */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>Magnetic Strength (B)</span>
              <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{strength}</span>
            </div>
            <input 
              type="range" min="10" max="300" step="10" 
              value={strength} onChange={(e) => setStrength(Number(e.target.value))} 
              style={{ width: '100%', accentColor: '#e74c3c' }}
            />
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Physics and Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Physics & Guide</label>
          <p style={{ fontSize: '12.5px', color: '#ccc', lineHeight: '1.5', margin: '4px 0 0 0' }}>
            Drag the magnet back and forth through the copper coil to induce electric current.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', marginTop: '6px' }}>
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>Faraday's Law:</span>
            <div style={{ fontSize: '14px', margin: '6px 0', textAlign: 'center', fontFamily: 'monospace', color: '#2ecc71', fontWeight: 'bold' }}>
              EMF = -N (dΦ / dt)
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
              EMF is proportional to turn count N and the rate of change of magnetic flux (Φ) over time.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default function CustomFaradaysLaw({ onBack, title }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <style>{`
                .glass-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    color: white;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .glass-btn:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-1px); }
            `}</style>
            <div style={{ height: '80px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    {onBack && (
                        <button onClick={onBack} className="glass-btn">
                            ← Back
                        </button>
                    )}
                </div>
                <div>
                    <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', margin: 0 }}>
                        {title || "Faraday's Law of Induction"}
                    </h1>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                </div>
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
                 <CustomFaradaysLawInner onBack={null} title={""} />
            </div>
        </div>
    );
}
