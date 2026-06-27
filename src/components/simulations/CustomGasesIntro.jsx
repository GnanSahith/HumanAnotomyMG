import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useRef, useEffect, useState, useCallback } from 'react';
const CustomGasesIntro = ({
  onBack,
  title = "Gases Intro Simulation"
}) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const [temperature, setTemperature] = useState(300); // Kelvin
  const [pressure, setPressure] = useState(0); // atm

  // Physics constants
  const baseSpeed = 2; // base speed at 300K

  const addParticles = count => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newParticles = [];
    const speed = baseSpeed * Math.sqrt(temperature / 300);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      newParticles.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6,
        mass: 1
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  };
  const handleTemperatureChange = delta => {
    setTemperature(prev => {
      const newTemp = Math.max(10, prev + delta);
      // Update speeds
      const speedScale = Math.sqrt(newTemp / prev);
      particlesRef.current.forEach(p => {
        p.vx *= speedScale;
        p.vy *= speedScale;
      });
      return newTemp;
    });
  };
  const reset = () => {
    particlesRef.current = [];
    setTemperature(300);
    setPressure(0);
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();
    let pressureAccumulator = 0;
    const update = time => {
      const dt = Math.min((time - lastTime) / 16, 2); // normalize to ~60fps, cap at 2x
      lastTime = time;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      // Update positions and wall collisions
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wall collisions
        if (p.x - p.radius < 0) {
          p.x = p.radius;
          p.vx *= -1;
          pressureAccumulator += Math.abs(p.vx * p.mass);
        } else if (p.x + p.radius > canvas.width) {
          p.x = canvas.width - p.radius;
          p.vx *= -1;
          pressureAccumulator += Math.abs(p.vx * p.mass);
        }
        if (p.y - p.radius < 0) {
          p.y = p.radius;
          p.vy *= -1;
          pressureAccumulator += Math.abs(p.vy * p.mass);
        } else if (p.y + p.radius > canvas.height) {
          p.y = canvas.height - p.radius;
          p.vy *= -1;
          pressureAccumulator += Math.abs(p.vy * p.mass);
        }
      }

      // Particle collisions
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const minDist = p1.radius + p2.radius;
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlapping particles
            const overlap = minDist - dist;
            p1.x += nx * overlap * 0.5;
            p1.y += ny * overlap * 0.5;
            p2.x -= nx * overlap * 0.5;
            p2.y -= ny * overlap * 0.5;
            const vx = p1.vx - p2.vx;
            const vy = p1.vy - p2.vy;
            const velAlongNormal = vx * nx + vy * ny;
            if (velAlongNormal < 0) {
              const impulse = -(2 * velAlongNormal) / (1 / p1.mass + 1 / p2.mass);
              p1.vx += impulse * nx / p1.mass;
              p1.vy += impulse * ny / p1.mass;
              p2.vx -= impulse * nx / p2.mass;
              p2.vy -= impulse * ny / p2.mass;
            }
          }
        }
      }

      // Draw particles
      ctx.fillStyle = '#60a5fa'; // Blue color for particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.stroke();
      }
      animationRef.current = requestAnimationFrame(update);
    };
    animationRef.current = requestAnimationFrame(update);

    // Pressure update interval
    const pressureInterval = setInterval(() => {
      const area = 2 * (canvas.width + canvas.height);
      const measuredPressure = pressureAccumulator / area * 0.1; // scaling factor
      setPressure(measuredPressure);
      pressureAccumulator = 0;
    }, 500);
    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(pressureInterval);
    };
  }, []);
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: '"Inter", "Roboto", sans-serif',
      overflow: 'hidden'
    },
    topBar: {
      display: 'flex',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: '#1e293b',
      borderBottom: '1px solid #334155',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginRight: '20px',
      transition: 'background-color 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    title: {
      fontSize: '24px',
      margin: 0,
      fontWeight: '600',
      letterSpacing: '0.5px'
    },
    mainArea: {
      display: 'flex',
      flex: 1,
      padding: '24px',
      gap: '24px'
    },
    canvasContainer: {
      flex: 2,
      backgroundColor: '#1e293b',
      borderRadius: '16px',
      border: '2px solid #334155',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)'
    },
    canvas: {
      width: '100%',
      height: '100%',
      borderRadius: '14px'
    },
    controlsPanel: {
      flex: 1,
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    controlSection: {
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    },
    gauge: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      fontSize: '18px',
      fontWeight: '500'
    },
    gaugeValue: {
      fontSize: '26px',
      color: '#4ade80',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      textShadow: '0 0 10px rgba(74, 222, 128, 0.3)'
    },
    btnGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px'
    },
    actionBtn: {
      flex: 1,
      padding: '14px',
      backgroundColor: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '16px',
      transition: 'all 0.2s',
      textAlign: 'center',
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
    },
    heatBtn: {
      backgroundColor: '#ef4444'
    },
    coolBtn: {
      backgroundColor: '#3b82f6'
    },
    resetBtn: {
      backgroundColor: '#64748b',
      marginTop: 'auto'
    }
  };
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({
    width: 800,
    height: 600
  });
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  return <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a1a',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
        
        {/* 1. Transparent Header (NO BACK BUTTONS, NO TITLES) */}
        {/* Move Play/Pause and Reset buttons here, floated to the right */}
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
                <button onClick={reset} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600
        }}>
                    Reset
                </button>
            </div>
        </div>
        
        {/* 2. Full Bleed Canvas Container */}
        <div style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    }} ref={containerRef}>
            
            {/* THE CANVAS */}
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
        gap: '24px',
        color: '#fff'
      }}>
                
                <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '12px'
        }}>
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
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px'
          }}>
                    <span style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)'
            }}>Pressure:</span>
                    <span style={{
              fontSize: '16px',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>{pressure.toFixed(1)} atm</span>
                  </div>
                  
                  <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px'
          }}>
                    <span style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)'
            }}>Temperature:</span>
                    <span style={{
              fontSize: '16px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: '#f87171'
            }}>{Math.round(temperature)} K</span>
                  </div>
                </div>
                
                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                  <h3 style={{
            margin: 0,
            fontSize: '14px',
            color: '#cbd5e1',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Add Particles</h3>
                  <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
                    <span style={{
              fontSize: '14px',
              color: '#94a3b8'
            }}>Count: {particlesRef.current.length}</span>
                    <button style={{
              padding: '8px 16px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }} onClick={() => addParticles(50)}>
                      + Pump 50
                    </button>
                  </div>
                </div>
                
                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                  <h3 style={{
            margin: 0,
            fontSize: '14px',
            color: '#cbd5e1',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Heat Control</h3>
                  <div style={{
            display: 'flex',
            gap: '12px'
          }}>
                    <button style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }} onClick={() => handleTemperatureChange(50)}>
                      Heat
                    </button>
                    <button style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#3b82f6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }} onClick={() => handleTemperatureChange(-50)}>
                      Cool
                    </button>
                  </div>
                </div>
                
            </div>
        </div>
    </div>;
};
export default CustomGasesIntro;