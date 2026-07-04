import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, ArrowLeft, Droplet, Microscope, Eye } from 'lucide-react';
export default function CustomAcidBaseSolutions({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  const [solutionType, setSolutionType] = useState('weak_acid'); // water, strong_acid, weak_acid, strong_base, weak_base
  const [concentration, setConcentration] = useState(0.01); // 0.001 to 1 M
  const [strength, setStrength] = useState(0.00001); // Ka or Kb: 10^-7 to 10^-2
  const [viewMode, setViewMode] = useState('micro'); // macro, micro
  const [showPH, setShowPH] = useState(true);
  const [canvasSize, setCanvasSize] = useState({
    width: 800,
    height: 600
  });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const particlesRef = useRef([]);
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    let observer;
    if (window.ResizeObserver && containerRef.current) {
      observer = new ResizeObserver(handleResize);
      observer.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, []);

  // pH Calculation
  const calculateEquilibrium = () => {
    let H3O = 1e-7;
    let OH = 1e-7;
    let HA = 0;
    let A_minus = 0;
    let B = 0;
    let BH_plus = 0;
    if (solutionType === 'water') {
      H3O = 1e-7;
      OH = 1e-7;
    } else if (solutionType === 'strong_acid') {
      H3O = concentration;
      A_minus = concentration;
      OH = 1e-14 / H3O;
    } else if (solutionType === 'strong_base') {
      OH = concentration;
      B = concentration;
      H3O = 1e-14 / OH;
    } else if (solutionType === 'weak_acid') {
      const Ka = strength;
      // Ka = x^2 / (C - x) => x^2 + Ka*x - Ka*C = 0
      const a = 1;
      const b = Ka;
      const c = -Ka * concentration;
      const x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      H3O = x;
      A_minus = x;
      HA = concentration - x;
      OH = 1e-14 / H3O;
    } else if (solutionType === 'weak_base') {
      const Kb = strength;
      const a = 1;
      const b = Kb;
      const c = -Kb * concentration;
      const x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      OH = x;
      BH_plus = x;
      B = concentration - x;
      H3O = 1e-14 / OH;
    }
    const pH = -Math.log10(H3O);
    return {
      H3O,
      OH,
      HA,
      A_minus,
      B,
      BH_plus,
      pH
    };
  };

  // Particle initialization
  const initParticles = () => {
    const {
      H3O,
      OH,
      HA,
      A_minus,
      B,
      BH_plus
    } = calculateEquilibrium();

    // Map concentrations to particle counts
    // Max concentration is 1. We want up to ~100 particles max for visual clarity
    const scale = 50 / Math.max(concentration, 1e-7);
    let counts = {};
    if (solutionType === 'water') {
      counts = {
        H3O: 2,
        OH: 2
      };
    } else {
      counts = {
        H3O: Math.min(100, Math.round(H3O * scale)),
        OH: Math.min(100, Math.round(OH * scale)),
        HA: Math.min(100, Math.round(HA * scale)),
        A_minus: Math.min(100, Math.round(A_minus * scale)),
        B: Math.min(100, Math.round(B * scale)),
        BH_plus: Math.min(100, Math.round(BH_plus * scale))
      };
      // Ensure at least some representation if concentration is significant
      if (H3O > 1e-6 && counts.H3O === 0) counts.H3O = 1;
      if (OH > 1e-6 && counts.OH === 0) counts.OH = 1;
    }
    const newParticles = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    // Liquid bounds
    const lx = w * 0.3;
    const ly = h * 0.4;
    const lw = w * 0.4;
    const lh = h * 0.5;
    const addType = (count, type, color, radius) => {
      for (let i = 0; i < count; i++) {
        newParticles.push({
          x: lx + radius + Math.random() * (lw - radius * 2),
          y: ly + radius + Math.random() * (lh - radius * 2),
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          type,
          color,
          radius
        });
      }
    };
    addType(counts.H3O, 'H3O+', '#ff4757', 6);
    addType(counts.OH, 'OH-', '#3742fa', 6);
    addType(counts.HA, 'HA', '#ffa502', 8);
    addType(counts.A_minus, 'A-', '#2ed573', 7);
    addType(counts.B, 'B', '#9b59b6', 8);
    addType(counts.BH_plus, 'BH+', '#f1c40f', 7);
    particlesRef.current = newParticles;
  };
  useEffect(() => {
    initParticles();
  }, [solutionType, concentration, strength]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const animate = () => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(animate);
      return;
    }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#1a1a2e');
      bgGrad.addColorStop(1, '#16213e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Beaker dimensions
      const beakerX = w * 0.3;
      const beakerY = h * 0.2;
      const beakerW = w * 0.4;
      const beakerH = h * 0.7;

      // Liquid level
      const liquidY = h * 0.4;
      const liquidH = beakerH - (liquidY - beakerY);

      // Draw liquid
      ctx.fillStyle = 'rgba(116, 185, 255, 0.2)';
      ctx.fillRect(beakerX, liquidY, beakerW, liquidH);
      if (viewMode === 'micro') {
        // Update and draw particles
        if (isPlaying) {
          particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off liquid bounds
            if (p.x - p.radius < beakerX) {
              p.x = beakerX + p.radius;
              p.vx *= -1;
            }
            if (p.x + p.radius > beakerX + beakerW) {
              p.x = beakerX + beakerW - p.radius;
              p.vx *= -1;
            }
            if (p.y - p.radius < liquidY) {
              p.y = liquidY + p.radius;
              p.vy *= -1;
            }
            if (p.y + p.radius > beakerY + beakerH) {
              p.y = beakerY + beakerH - p.radius;
              p.vy *= -1;
            }

            // Brownian motion jitter
            p.vx += (Math.random() - 0.5) * 0.2;
            p.vy += (Math.random() - 0.5) * 0.2;

            // Speed limit
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 2) {
              p.vx = p.vx / speed * 2;
              p.vy = p.vy / speed * 2;
            }
          });
        }

        // Draw particles
        particlesRef.current.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Optional: text on larger particles, but maybe too clustered. Let's do it if radius is big.
          if (p.radius >= 8) {
            ctx.fillStyle = '#fff';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.type, p.x, p.y);
          }
        });

        // Zoom lens effect to indicate micro view
        ctx.beginPath();
        ctx.arc(w - 150, 150, 80, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Microscopic View', w - 150, 250);
      }

      // Draw Beaker Glass
      ctx.beginPath();
      ctx.moveTo(beakerX, beakerY);
      ctx.lineTo(beakerX, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW, beakerY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Lip of beaker
      ctx.beginPath();
      ctx.moveTo(beakerX - 10, beakerY);
      ctx.lineTo(beakerX + 10, beakerY);
      ctx.moveTo(beakerX + beakerW - 10, beakerY);
      ctx.lineTo(beakerX + beakerW + 10, beakerY);
      ctx.stroke();

      // Draw pH meter if enabled
      if (showPH) {
        const {
          pH
        } = calculateEquilibrium();
        // Probe wire
        ctx.beginPath();
        ctx.moveTo(beakerX + 50, liquidY + 50);
        ctx.lineTo(beakerX + 50, beakerY - 50);
        ctx.lineTo(beakerX - 100, beakerY - 50);
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Probe tip
        ctx.beginPath();
        ctx.roundRect(beakerX + 45, liquidY + 10, 10, 50, 5);
        ctx.fillStyle = '#bdc3c7';
        ctx.fill();
        ctx.stroke();

        // pH Display Box
        ctx.beginPath();
        ctx.roundRect(beakerX - 220, beakerY - 80, 120, 60, 10);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 4;
        ctx.stroke();

        // pH Text
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`pH: ${pH.toFixed(2)}`, beakerX - 160, beakerY - 50);
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, viewMode, showPH, solutionType, concentration, strength]);
  const uiColors = {
    primary: '#4834d4',
    accent: '#eb4d4b',
    panel: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#f1f2f6',
    textMuted: '#a4b0be'
  };
  return <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a1a',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
      
      
      {/* 2. Full Bleed Canvas Container */}
      <div style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    }} ref={containerRef}>
          
          <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} style={{
        width: '100%',
        height: '100%',
        display: 'block',
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
              
              {/* View Toggle */}
              <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: '4px'
        }}>
                  <button onClick={() => setViewMode('macro')} style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            background: viewMode === 'macro' ? '#686de0' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '500',
            transition: '0.2s'
          }}>
                      <Eye size={18} /> Macro
                  </button>
                  <button onClick={() => setViewMode('micro')} style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            background: viewMode === 'micro' ? '#686de0' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '500',
            transition: '0.2s'
          }}>
                      <Microscope size={18} /> Micro
                  </button>
              </div>

              {/* Show pH Toggle */}
              <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px'
        }}>
                  <span style={{
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}><Droplet size={18} color="#2ecc71" /> Show pH Meter</span>
                  <input type="checkbox" checked={showPH} onChange={e => setShowPH(e.target.checked)} style={{
            width: '20px',
            height: '20px',
            cursor: 'pointer'
          }} />
              </div>

              {/* Solution Type */}
              <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
                  <label style={{
            fontSize: '14px',
            color: uiColors.textMuted,
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>Solution Type</label>
                  <select value={solutionType} onChange={e => setSolutionType(e.target.value)} style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${uiColors.border}`,
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            outline: 'none',
            cursor: 'pointer'
          }}>
                      <option value="water">Water</option>
                      <option value="strong_acid">Strong Acid</option>
                      <option value="weak_acid">Weak Acid</option>
                      <option value="strong_base">Strong Base</option>
                      <option value="weak_base">Weak Base</option>
                  </select>
              </div>

              {/* Concentration Slider */}
              {solutionType !== 'water' && <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(0,0,0,0.2)',
          padding: '16px',
          borderRadius: '8px'
        }}>
                      <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
                          <label style={{
              fontSize: '14px',
              color: uiColors.textMuted,
              fontWeight: '600'
            }}>Initial Concentration</label>
                          <span style={{
              background: '#2c3e50',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>{concentration.toExponential(2)} M</span>
                      </div>
                      <input type="range" min="-3" max="0" step="0.1" value={Math.log10(concentration)} onChange={e => setConcentration(Math.pow(10, Number(e.target.value)))} style={{
            width: '100%',
            accentColor: '#686de0'
          }} />
                      <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: uiColors.textMuted
          }}>
                          <span>10⁻³ M</span>
                          <span>1 M</span>
                      </div>
                  </div>}

              {/* Strength Slider (Weak only) */}
              {(solutionType === 'weak_acid' || solutionType === 'weak_base') && <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(0,0,0,0.2)',
          padding: '16px',
          borderRadius: '8px'
        }}>
                      <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
                          <label style={{
              fontSize: '14px',
              color: uiColors.textMuted,
              fontWeight: '600'
            }}>Strength ({solutionType === 'weak_acid' ? 'Ka' : 'Kb'})</label>
                          <span style={{
              background: '#2c3e50',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>{strength.toExponential(2)}</span>
                      </div>
                      <input type="range" min="-7" max="-2" step="0.1" value={Math.log10(strength)} onChange={e => setStrength(Math.pow(10, Number(e.target.value)))} style={{
            width: '100%',
            accentColor: '#f0932b'
          }} />
                      <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: uiColors.textMuted
          }}>
                          <span>Weaker</span>
                          <span>Stronger</span>
                      </div>
                  </div>}

              {/* Legend (Micro view) */}
              {viewMode === 'micro' && <div style={{
          marginTop: 'auto',
          background: 'rgba(0,0,0,0.3)',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${uiColors.border}`
        }}>
                      <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            color: uiColors.textMuted,
            textTransform: 'uppercase'
          }}>Particle Legend</h4>
                      <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
                          {[{
              label: 'H3O+',
              color: '#ff4757'
            }, {
              label: 'OH-',
              color: '#3742fa'
            }, {
              label: 'HA',
              color: '#ffa502'
            }, {
              label: 'A-',
              color: '#2ed573'
            }, {
              label: 'B',
              color: '#9b59b6'
            }, {
              label: 'BH+',
              color: '#f1c40f'
            }].map(item => <div key={item.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}>
                                  <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: item.color,
                border: '1px solid #fff'
              }}></div> {item.label}
                              </div>)}
                      </div>
                  </div>}
          </div>
      </div>
  </div>;
}