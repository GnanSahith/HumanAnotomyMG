import React, { useState, useEffect, useRef } from 'react';
const CustomCoulombsLawInner = () => {
  const [q1, setQ1] = useState(1);
  const [q2, setQ2] = useState(-1);
  const [distance, setDistance] = useState(5);
  const [scaleMode, setScaleMode] = useState('macro');
  const canvasRef = useRef(null);
  const k = 8.9875517923e9;
  const elementaryCharge = 1.602176634e-19;
  const calculateForce = () => {
    let q1C, q2C, rM;
    if (scaleMode === 'macro') {
      q1C = q1 * 1e-6;
      q2C = q2 * 1e-6;
      rM = distance * 1e-2;
    } else {
      q1C = q1 * elementaryCharge;
      q2C = q2 * elementaryCharge;
      rM = distance * 1e-12;
    }
    if (rM <= 0) return {
      force: 0,
      isAttractive: false
    };
    const force = k * Math.abs(q1C * q2C) / (rM * rM);
    const isAttractive = Math.sign(q1) !== Math.sign(q2) && q1 !== 0 && q2 !== 0;
    return {
      force,
      isAttractive
    };
  };
  const {
    force,
    isAttractive
  } = calculateForce();
  const formatForce = forceVal => {
    if (forceVal === 0) return "0.00";
    if (forceVal < 0.001 || forceVal > 1000) return forceVal.toExponential(2);
    return forceVal.toFixed(2);
  };
  const formattedForce = formatForce(force);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const centerY = height / 2;
    const padding = 120;
    const usableWidth = width - 2 * padding;
    let maxDist = scaleMode === 'macro' ? 10 : 500;
    const distancePx = distance / maxDist * usableWidth;
    const x1 = padding + (usableWidth - distancePx) / 2;
    const x2 = x1 + distancePx;
    const drawParticle = (x, y, charge) => {
      ctx.beginPath();
      const radius = 24;
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = charge > 0 ? '#ef4444' : charge < 0 ? '#3b82f6' : '#9ca3af';
      ctx.fill();

      // Draw a subtle outer border or glow
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw charge label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = charge > 0 ? `+${charge}` : `${charge}`;
      ctx.fillText(label, x, y);
    };
    drawParticle(x1, centerY, q1, true);
    drawParticle(x2, centerY, q2, false);
  }, [q1, q2, distance, scaleMode]);
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    position: 'relative'
  }}>
      
      {/* Canvas View */}
      <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '20px 360px 20px 20px',
      boxSizing: 'border-box'
    }}>
        <canvas ref={canvasRef} width={800} height={250} style={{
        borderRadius: '12px',
        width: '100%',
        height: '100%',
        maxHeight: '250px',
        objectFit: 'contain'
      }} />
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '800px',
        padding: '0 20px',
        color: '#94a3b8',
        fontSize: '13px',
        fontFamily: "'Inter', sans-serif"
      }}>
          <span>q₁ Charge Node</span>
          <span>q₂ Charge Node</span>
        </div>
      </div>

      {/* Floating Control Panel */}
      <div style={{
      position: 'absolute',
      top: '90px',
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
          Simulation Controls
        </h3>

        {/* Scale Mode */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
          <label style={{
          fontSize: '11px',
          color: '#94a3b8',
          fontWeight: '600',
          letterSpacing: '0.05em'
        }}>SCALE MODE</label>
          <div style={{
          display: 'flex',
          gap: '8px',
          background: "rgba(255,255,255,0.05)",
          padding: '4px',
          borderRadius: '8px',
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
            <button onClick={() => {
            setScaleMode('macro');
            if (distance > 10) setDistance(5);
          }} style={{
            flex: 1,
            padding: '6px 12px',
            background: scaleMode === 'macro' ? '#3498db' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
              Macro
            </button>
            <button onClick={() => {
            setScaleMode('atomic');
            if (distance < 30) setDistance(100);
          }} style={{
            flex: 1,
            padding: '6px 12px',
            background: scaleMode === 'atomic' ? '#3498db' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
              Atomic
            </button>
          </div>
        </div>

        {/* q1 slider */}
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
            <span>Charge 1 (q₁):</span>
            <span style={{
            fontWeight: '600',
            color: q1 > 0 ? '#ef4444' : q1 < 0 ? '#3b82f6' : '#9ca3af'
          }}>
              {q1} {scaleMode === 'macro' ? 'µC' : 'e'}
            </span>
          </div>
          <input type="range" min="-10" max="10" step="1" value={q1} onChange={e => setQ1(parseInt(e.target.value))} style={{
          accentColor: '#3498db',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* q2 slider */}
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
            <span>Charge 2 (q₂):</span>
            <span style={{
            fontWeight: '600',
            color: q2 > 0 ? '#ef4444' : q2 < 0 ? '#3b82f6' : '#9ca3af'
          }}>
              {q2} {scaleMode === 'macro' ? 'µC' : 'e'}
            </span>
          </div>
          <input type="range" min="-10" max="10" step="1" value={q2} onChange={e => setQ2(parseInt(e.target.value))} style={{
          accentColor: '#3498db',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* Distance slider */}
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
            <span>Distance (r):</span>
            <span style={{
            fontWeight: '600',
            color: '#2ecc71'
          }}>
              {distance} {scaleMode === 'macro' ? 'cm' : 'pm'}
            </span>
          </div>
          <input type="range" min={scaleMode === 'macro' ? "1" : "30"} max={scaleMode === 'macro' ? "10" : "500"} step={scaleMode === 'macro' ? "0.1" : "5"} value={distance} onChange={e => setDistance(parseFloat(e.target.value))} style={{
          accentColor: '#2ecc71',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* Force Display */}
        <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '10px',
        padding: '12px',
        marginTop: '8px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}>
          <span style={{
          fontSize: '11px',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
            Electric Force
          </span>
          <span style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#fff',
          fontFamily: 'monospace'
        }}>
            {formattedForce} N
          </span>
          <span style={{
          fontSize: '12px',
          fontWeight: '500',
          color: force === 0 ? '#94a3b8' : isAttractive ? '#3498db' : '#ef4444',
          textTransform: 'capitalize'
        }}>
            {force === 0 ? 'No Force' : isAttractive ? 'Attractive' : 'Repulsive'}
          </span>
        </div>
      </div>
    </div>;
};
export default function CustomCoulombsLaw({
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
            
            <div style={{
      height: '80px',
      flexShrink: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      zIndex: 10
    }}>
                <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center'
      }}>                                    </div>
                <div>
                    <h1 style={{
          color: 'white',
          fontFamily: "'Inter', sans-serif",
          fontSize: '24px',
          fontWeight: '600',
          margin: 0
        }}>
                        {title || "Coulomb's Law"}
                    </h1>
                </div>
                <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        alignItems: 'center'
      }}>
                </div>
            </div>
            <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomCoulombsLawInner />
            </div>
        </div>;
}