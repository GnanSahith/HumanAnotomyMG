import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, ArrowLeft } from 'lucide-react';
function CustomBlackbodySpectrumInner() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [param1, setParam1] = useState(50);
  const [param2, setParam2] = useState(50);
  const [param3, setParam3] = useState(50);
  const [toggle, setToggle] = useState(false);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const stateRef = useRef({
    time: 0
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const animate = () => {
      if (isPlaying) {
        stateRef.current.time += 0.05;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(10, 10, 26, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 20 + param1 * 0.5;
      const x = cx + Math.sin(stateRef.current.time * (param2 / 50)) * 100;
      const y = cy + Math.cos(stateRef.current.time * (param2 / 50)) * 100;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = toggle ? '#e74c3c' : `hsl(${param3 * 3.6}, 80%, 60%)`;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, param1, param2, param3, toggle]);
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative'
  }}>
            {/* Canvas / Main View centered */}
            <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
                <div style={{
        width: '800px',
        height: '600px',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        background: '#070714'
      }}>
                    <canvas ref={canvasRef} width={800} height={600} style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: "contain"
        }} />
                </div>
            </div>

            {/* Play/Pause/Reset Floating Control Bar */}
            <div style={{
      position: 'absolute',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      display: 'flex',
      gap: '15px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      padding: '12px 24px',
      borderRadius: '100px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: isPlaying ? '#e74c3c' : '#2ecc71',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '100px',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.2s'
      }}>
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />} {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={() => {
        setIsPlaying(false);
        stateRef.current.time = 0;
      }} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '8px 20px',
        borderRadius: '100px',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s'
      }}>
                    <RotateCcw size={16} /> Reset
                </button>
            </div>

            {/* Control Panels (floating/overlay) */}
            <div style={{
      position: 'absolute',
      top: '90px',
      right: '20px',
      width: '300px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
    }}>
                <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px'
      }}>
                    <Settings2 size={20} color="#3498db" />
                    
                </div>
                <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        alignItems: 'center'
      }}>
                    {/* Placeholder for global actions if any */}
                </div>
            </div>

            <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomBlackbodySpectrumInner />
            </div>
        </div>;
}
export default CustomBlackbodySpectrumInner;