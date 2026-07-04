import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
const CustomChargesAndFieldsInner = () => {
  const canvasRef = useRef(null);
  const [charges, setCharges] = useState([]);
  const [draggingCharge, setDraggingCharge] = useState(null);
  const [gridSize, setGridSize] = useState(40);
  const k = 8.987e9; // Coulomb's constant
  const scale = 1e-9; // scale factor for charges (nC to C)

  const calculateElectricField = useCallback((x, y) => {
    let Ex = 0;
    let Ey = 0;
    let V = 0;
    charges.forEach(charge => {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      if (r > 1) {
        const E = k * charge.q * scale / r2;
        Ex += E * (dx / r);
        Ey += E * (dy / r);
        V += k * charge.q * scale / r;
      }
    });
    return {
      Ex,
      Ey,
      V
    };
  }, [charges]);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw field vectors
    for (let x = gridSize / 2; x < width; x += gridSize) {
      for (let y = gridSize / 2; y < height; y += gridSize) {
        if (charges.length === 0) continue;
        const {
          Ex,
          Ey
        } = calculateElectricField(x, y);
        const magnitude = Math.sqrt(Ex * Ex + Ey * Ey);
        if (magnitude > 0) {
          const arrowLength = Math.min(gridSize * 0.8, Math.max(10, Math.log10(magnitude + 1) * 5));
          const normalizedEx = Ex / magnitude;
          const normalizedEy = Ey / magnitude;
          const opacity = Math.min(1, Math.max(0.2, magnitude / 50));
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(x, y);
          const endX = x + normalizedEx * arrowLength;
          const endY = y + normalizedEy * arrowLength;
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Arrow head
          ctx.beginPath();
          ctx.arc(endX, endY, 2, 0, Math.PI * 2);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }
    }

    // Draw charges
    charges.forEach(charge => {
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, 15, 0, 2 * Math.PI);
      ctx.fillStyle = charge.q > 0 ? '#ff4444' : '#4444ff';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '20px Arial';
      ctx.fillText(charge.q > 0 ? '+' : '-', charge.x, charge.y);
    });
  }, [charges, gridSize, calculateElectricField]);
  useEffect(() => {
    draw();
  }, [draw]);
  const getMouseCoordinates = e => {
    const canvas = canvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    const renderedWidth = canvas.width * scale;
    const renderedHeight = canvas.height * scale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    return {
      x,
      y
    };
  };
  const handleMouseDown = e => {
    const {
      x,
      y
    } = getMouseCoordinates(e);
    const clickedCharge = charges.find(c => {
      const dx = c.x - x;
      const dy = c.y - y;
      return dx * dx + dy * dy <= 225;
    });
    if (clickedCharge) {
      setDraggingCharge(clickedCharge.id);
    }
  };
  const handleMouseMove = e => {
    if (draggingCharge !== null) {
      const {
        x,
        y
      } = getMouseCoordinates(e);
      setCharges(charges.map(c => c.id === draggingCharge ? {
        ...c,
        x,
        y
      } : c));
    }
  };
  const handleMouseUp = () => {
    setDraggingCharge(null);
  };
  const addCharge = q => {
    setCharges([...charges, {
      id: Date.now() + Math.random(),
      x: canvasRef.current.width / 2 + (Math.random() - 0.5) * 50,
      y: canvasRef.current.height / 2 + (Math.random() - 0.5) * 50,
      q
    }]);
  };
  const clearAll = () => {
    setCharges([]);
  };
  return <div style={{
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 360px 20px 20px',
    boxSizing: 'border-box'
  }}>
      {/* Main View: Canvas */}
      <canvas ref={canvasRef} width={800} height={600} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      cursor: 'crosshair',
      pointerEvents: 'auto',
      zIndex: 1,
      background: '#0a0a1a',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }} />

      {/* Floating Control Panel */}
      <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '320px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      pointerEvents: 'auto'
    }}>
        <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '8px',
        margin: 0
      }}>
          Charges & Fields
        </h3>

        {/* Charge Controls */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
          <label style={{
          fontSize: '11px',
          color: '#94a3b8',
          fontWeight: '600',
          letterSpacing: '0.05em'
        }}>ADD CHARGES</label>
          <button onClick={() => addCharge(1)} style={{
          padding: '10px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          color: '#ef4444',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }} onMouseEnter={e => {
          e.currentTarget.style.background = '#ef4444';
          e.currentTarget.style.color = '#fff';
        }} onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
          e.currentTarget.style.color = '#ef4444';
        }}>
            <span>+</span> Positive Charge (+1 nC)
          </button>
          
          <button onClick={() => addCharge(-1)} style={{
          padding: '10px',
          background: 'rgba(52, 152, 219, 0.2)',
          border: '1px solid rgba(52, 152, 219, 0.4)',
          borderRadius: '8px',
          color: '#3498db',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }} onMouseEnter={e => {
          e.currentTarget.style.background = '#3498db';
          e.currentTarget.style.color = '#fff';
        }} onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(52, 152, 219, 0.2)';
          e.currentTarget.style.color = '#3498db';
        }}>
            <span>-</span> Negative Charge (-1 nC)
          </button>
        </div>

        {/* Grid Spacing Slider */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px'
        }}>
            <span>Grid Resolution:</span>
            <span style={{
            fontWeight: '600',
            color: '#2ecc71'
          }}>{gridSize}px</span>
          </div>
          <input type="range" min="20" max="100" step="5" value={gridSize} onChange={e => setGridSize(parseInt(e.target.value))} style={{
          accentColor: '#2ecc71',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* Clear Button */}
        <button onClick={clearAll} style={{
        padding: '10px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#ff4d4d',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }} onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255, 77, 77, 0.2)';
        e.currentTarget.style.border = '1px solid rgba(255, 77, 77, 0.4)';
      }} onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      }}>
          Clear All Charges
        </button>

        {/* Legend / Instructions */}
        <div style={{
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '12px',
        color: '#94a3b8',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        lineHeight: '1.4'
      }}>
          <div>• <strong>Drag</strong> charges around the field.</div>
          <div>• Grid arrows represent <strong>Electric Field vectors</strong> (brightness represents magnitude).</div>
        </div>
      </div>
    </div>;
};
export default function CustomChargesAndFields({
  onBack,
  title
}) {
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}>
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
                .glass-btn:active { transform: translateY(1px); }
                .glass-btn-blue { background: rgba(52, 152, 219, 0.15); border-color: rgba(52, 152, 219, 0.3); color: #3498db; }
                .glass-btn-blue:hover { background: rgba(52, 152, 219, 0.25); }
                .reset-btn { background: rgba(231, 76, 60, 0.2); border-color: rgba(231, 76, 60, 0.3); color: #e74c3c; }
                .reset-btn:hover { background: rgba(231, 76, 60, 0.3); }
            `}</style>

            {/* Standardized Header */}
            

            <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomChargesAndFieldsInner />
            </div>
        </div>;
}