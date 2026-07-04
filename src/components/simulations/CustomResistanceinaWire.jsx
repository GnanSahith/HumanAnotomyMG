import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
const CustomResistanceInAWireInner = () => {
  const [resistivity, setResistivity] = useState(0.5); // rho in Ohm*cm
  const [length, setLength] = useState(10.0); // L in cm
  const [area, setArea] = useState(5.0); // A in cm^2
  const canvasRef = useRef(null);
  const resistance = resistivity * length / area; // R in Ohms

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const wireWidth = 20 + length / 20 * 340;
    const wireHeight = 10 + area / 15 * 130;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const startX = centerX - wireWidth / 2;
    const startY = centerY - wireHeight / 2;
    const gradient = ctx.createLinearGradient(0, startY, 0, startY + wireHeight);
    gradient.addColorStop(0, '#ccc');
    gradient.addColorStop(0.5, '#eee');
    gradient.addColorStop(1, '#999');
    ctx.fillStyle = gradient;
    ctx.fillRect(startX, startY, wireWidth, wireHeight);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, wireWidth, wireHeight);
    const dotDensity = resistivity * 2;
    const areaPixels = wireWidth * wireHeight;
    const numDots = Math.floor(areaPixels / 100 * dotDensity);
    let seed = 1;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    ctx.fillStyle = 'black';
    for (let i = 0; i < numDots; i++) {
      const dotX = startX + 5 + random() * (wireWidth - 10);
      const dotY = startY + 5 + random() * (wireHeight - 10);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [resistivity, length, area]);
  const rSize = Math.max(0.5, Math.min(3.0, 0.5 + resistance / 2));
  const rhoSize = 0.5 + resistivity;
  const lSize = 0.5 + length / 10;
  const aSize = 0.5 + area / 7.5;
  return <div style={{
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  }}>
      {/* Centered Canvas & Formula Display */}
      <div style={{
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
      width: '500px'
    }}>
        {/* Dynamic Formula Display */}
        <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '24px',
        padding: '24px',
        width: '100%',
        height: '160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        position: 'relative'
      }}>
          <div style={{
          transform: `scale(${rSize})`,
          transition: 'transform 0.2s',
          transformOrigin: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#fff',
          position: 'absolute',
          left: '60px'
        }}>
            R
          </div>
          <div style={{
          fontSize: '40px',
          fontWeight: 'bold',
          color: 'rgba(255,255,255,0.7)',
          position: 'absolute',
          left: '140px'
        }}>=</div>
          
          <div style={{
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          left: '200px'
        }}>
            <div style={{
            transform: `scale(${rhoSize})`,
            transition: 'transform 0.2s',
            transformOrigin: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ff4444',
            marginRight: '20px'
          }}>
              ρ
            </div>
            <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
              <div style={{
              transform: `scale(${lSize})`,
              transition: 'transform 0.2s',
              transformOrigin: 'bottom',
              fontSize: '40px',
              fontWeight: 'bold',
              color: '#3b82f6',
              lineHeight: '1'
            }}>
                L
              </div>
              <div style={{
              width: '60px',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.4)',
              margin: '6px 0'
            }}></div>
              <div style={{
              transform: `scale(${aSize})`,
              transition: 'transform 0.2s',
              transformOrigin: 'top',
              fontSize: '40px',
              fontWeight: 'bold',
              color: '#2ecc71',
              lineHeight: '1'
            }}>
                A
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Display */}
        <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        width: '100%',
        display: 'flex',
        justifyContent: 'center'
      }}>
          <canvas ref={canvasRef} width={400} height={200} style={{
          display: 'block',
          borderRadius: '12px'
        }} />
        </div>
      </div>

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
      gap: '18px',
      pointerEvents: 'auto'
    }}>
        <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '8px',
        margin: 0
      }}>
          Wire Parameters
        </h3>

        {/* Resistivity */}
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
            <span style={{
            color: '#ff4444',
            fontWeight: '600'
          }}>Resistivity (ρ):</span>
            <span style={{
            fontWeight: '600',
            fontFamily: 'monospace'
          }}>{resistivity.toFixed(2)} Ω·cm</span>
          </div>
          <input type="range" min="0.1" max="1.0" step="0.01" value={resistivity} onChange={e => setResistivity(parseFloat(e.target.value))} style={{
          accentColor: '#ff4444',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* Length */}
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
            <span style={{
            color: '#3b82f6',
            fontWeight: '600'
          }}>Length (L):</span>
            <span style={{
            fontWeight: '600',
            fontFamily: 'monospace'
          }}>{length.toFixed(1)} cm</span>
          </div>
          <input type="range" min="0.1" max="20.0" step="0.1" value={length} onChange={e => setLength(parseFloat(e.target.value))} style={{
          accentColor: '#3b82f6',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* Area */}
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
            <span style={{
            color: '#2ecc71',
            fontWeight: '600'
          }}>Area (A):</span>
            <span style={{
            fontWeight: '600',
            fontFamily: 'monospace'
          }}>{area.toFixed(1)} cm²</span>
          </div>
          <input type="range" min="0.1" max="15.0" step="0.1" value={area} onChange={e => setArea(parseFloat(e.target.value))} style={{
          accentColor: '#2ecc71',
          cursor: 'pointer',
          width: '100%'
        }} />
        </div>

        {/* Resistance Value Card */}
        <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '10px',
        padding: '12px',
        marginTop: '6px',
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
            Total Resistance (R)
          </span>
          <span style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#fff',
          fontFamily: 'monospace'
        }}>
            {resistance.toFixed(3)} Ω
          </span>
        </div>
      </div>
    </div>;
};
export default function CustomResistanceInAWire({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden'
  }}>
            
            <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomResistanceInAWireInner />
            </div>
        </div>;
}