import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
const elementsData = {
  0: {
    symbol: '',
    name: 'Empty'
  },
  1: {
    symbol: 'H',
    name: 'Hydrogen'
  },
  2: {
    symbol: 'He',
    name: 'Helium'
  },
  3: {
    symbol: 'Li',
    name: 'Lithium'
  },
  4: {
    symbol: 'Be',
    name: 'Beryllium'
  },
  5: {
    symbol: 'B',
    name: 'Boron'
  },
  6: {
    symbol: 'C',
    name: 'Carbon'
  },
  7: {
    symbol: 'N',
    name: 'Nitrogen'
  },
  8: {
    symbol: 'O',
    name: 'Oxygen'
  },
  9: {
    symbol: 'F',
    name: 'Fluorine'
  },
  10: {
    symbol: 'Ne',
    name: 'Neon'
  }
};
const getStability = (protons, neutrons) => {
  if (protons === 0 && neutrons === 0) return 'Empty';
  if (protons === 0 && neutrons > 0) return 'Unstable';
  if (protons > 10) return 'Unknown';
  const stableIsotopes = {
    1: [0, 1],
    2: [1, 2],
    3: [3, 4],
    4: [5],
    5: [5, 6],
    6: [6, 7],
    7: [7, 8],
    8: [8, 9, 10],
    9: [10],
    10: [10, 11, 12]
  };
  const isStable = stableIsotopes[protons]?.includes(neutrons);
  return isStable ? 'Stable' : 'Unstable';
};
export default function CustomBuildANucleus() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({
    width: 600,
    height: 500
  });
  const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  const [protons, setProtons] = useState(0);
  const [neutrons, setNeutrons] = useState(0);
  const [particles, setParticles] = useState([]);
  const particleRadius = 15;
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          setCanvasSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  const handleAddProton = () => {
    if (protons >= 10) return;
    setProtons(p => p + 1);
    addParticle('proton');
  };
  const handleRemoveProton = () => {
    if (protons <= 0) return;
    setProtons(p => p - 1);
    removeParticle('proton');
  };
  const handleAddNeutron = () => {
    if (neutrons >= 12) return;
    setNeutrons(n => n + 1);
    addParticle('neutron');
  };
  const handleRemoveNeutron = () => {
    if (neutrons <= 0) return;
    setNeutrons(n => n - 1);
    removeParticle('neutron');
  };
  const addParticle = type => {
    const {
      width,
      height
    } = canvasSize;
    const newParticle = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: width / 2 + (Math.random() - 0.5) * 40,
      y: height / 2 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    };
    setParticles(prev => [...prev, newParticle]);
  };
  const removeParticle = type => {
    setParticles(prev => {
      const idx = prev.findLastIndex(p => p.type === type);
      if (idx !== -1) {
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      }
      return prev;
    });
  };
  const handleReset = () => {
    setProtons(0);
    setNeutrons(0);
    setParticles([]);
    setIsPlaying(true);
  };
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();
    const render = time => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(render);
      return;
    }
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const canvas = canvasRef.current;
      if (canvas && isPlaying) {
        const ctx = canvas.getContext('2d');
        const {
          width,
          height
        } = canvasSize;
        ctx.clearRect(0, 0, width, height);
        setParticles(prevParticles => {
          const newParticles = prevParticles.map(p => ({
            ...p
          }));
          const centerX = width / 2;
          const centerY = height / 2;
          for (let i = 0; i < newParticles.length; i++) {
            let p1 = newParticles[i];
            const dxCenter = centerX - p1.x;
            const dyCenter = centerY - p1.y;
            const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
            p1.vx += dxCenter / (distCenter + 1) * 0.5;
            p1.vy += dyCenter / (distCenter + 1) * 0.5;
            for (let j = i + 1; j < newParticles.length; j++) {
              let p2 = newParticles[j];
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const minDistance = particleRadius * 2;
              if (dist < minDistance && dist > 0) {
                const force = (minDistance - dist) * 0.1;
                const fx = dx / dist * force;
                const fy = dy / dist * force;
                p1.vx += fx;
                p1.vy += fy;
                p2.vx -= fx;
                p2.vy -= fy;
              }
            }
            p1.vx *= 0.85;
            p1.vy *= 0.85;
            p1.x += p1.vx;
            p1.y += p1.vy;
          }
          newParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, particleRadius, 0, 2 * Math.PI);
            ctx.fillStyle = p.type === 'proton' ? '#ef4444' : '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = p.type === 'proton' ? '#b91c1c' : '#1d4ed8';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(p.x - 4, p.y - 4, particleRadius * 0.3, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.type === 'proton' ? '+' : '', p.x, p.y);
          });
          return newParticles;
        });
      } else if (canvas && !isPlaying) {
        // Just draw current state if paused
        const ctx = canvas.getContext('2d');
        const {
          width,
          height
        } = canvasSize;
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, particleRadius, 0, 2 * Math.PI);
          ctx.fillStyle = p.type === 'proton' ? '#ef4444' : '#3b82f6';
          ctx.fill();
          ctx.strokeStyle = p.type === 'proton' ? '#b91c1c' : '#1d4ed8';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x - 4, p.y - 4, particleRadius * 0.3, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.type === 'proton' ? '+' : '', p.x, p.y);
        });
      }
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasSize, isPlaying, particles]); // Re-bind on isPlaying change

  const symbol = elementsData[protons]?.symbol || '';
  const elementName = elementsData[protons]?.name || 'Unknown';
  const massNumber = protons + neutrons;
  const stability = getStability(protons, neutrons);
  return <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a1a',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
        
        {/* 1. Transparent Header */}
        <div style={{
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      background: 'transparent',
      zIndex: 10
    }}>
            <div style={{
        display: 'flex',
        gap: '12px'
      }}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={handleReset} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
                    <RotateCcw size={18} /> Reset
                </button>
            </div>
        </div>
        
        {/* 2. Full Bleed Canvas Container */}
        <div ref={containerRef} style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    }}>
            
            <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
        objectFit: "contain"
      }} />
            
            {/* 3. Floating Right Control Panel */}
            <div style={{
        position: 'absolute',
        right: '40px',
        top: '20px',
        bottom: '20px',
        width: '340px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#fff'
      }}>
                
                <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '12px'
        }}>
                    <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                    <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600
          }}>Controls</h3>
                </div>
                
                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
                    <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
                        <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
                            <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ef4444'
              }}></div>
                            <span>Protons</span>
                        </div>
                        <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
                            <button onClick={handleRemoveProton} style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>-</button>
                            <span style={{
                width: '20px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>{protons}</span>
                            <button onClick={handleAddProton} style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#ef4444',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>+</button>
                        </div>
                    </div>
                    
                    <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
                        <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
                            <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#3b82f6'
              }}></div>
                            <span>Neutrons</span>
                        </div>
                        <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
                            <button onClick={handleRemoveNeutron} style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                color: '#3b82f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>-</button>
                            <span style={{
                width: '20px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>{neutrons}</span>
                            <button onClick={handleAddNeutron} style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#3b82f6',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>+</button>
                        </div>
                    </div>
                </div>

                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '16px'
        }}>
                    <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600
          }}>Properties</h3>
                    
                    <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
                        <span style={{
              color: '#94a3b8',
              fontSize: '14px'
            }}>Element</span>
                        <span style={{
              fontWeight: 600
            }}>{elementName} {symbol && `(${symbol})`}</span>
                    </div>
                    
                    <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
                        <span style={{
              color: '#94a3b8',
              fontSize: '14px'
            }}>Mass Number (A)</span>
                        <span style={{
              fontWeight: 600
            }}>{massNumber}</span>
                    </div>
                    
                    <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
                        <span style={{
              color: '#94a3b8',
              fontSize: '14px'
            }}>Stability</span>
                        <span style={{
              fontWeight: 600,
              color: stability === 'Stable' ? '#4ade80' : stability === 'Unstable' ? '#f87171' : '#94a3b8'
            }}>{stability}</span>
                    </div>

                    {protons > 0 && <div style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.3)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
                            <div style={{
              position: 'relative',
              display: 'inline-block'
            }}>
                                <span style={{
                position: 'absolute',
                top: '-10px',
                left: '-20px',
                fontSize: '12px',
                color: '#94a3b8'
              }}>{massNumber}</span>
                                <span style={{
                position: 'absolute',
                bottom: '-10px',
                left: '-20px',
                fontSize: '12px',
                color: '#94a3b8'
              }}>{protons}</span>
                                <span style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#38bdf8',
                lineHeight: 1
              }}>{symbol}</span>
                            </div>
                        </div>}
                </div>

            </div>
        </div>
    </div>;
}