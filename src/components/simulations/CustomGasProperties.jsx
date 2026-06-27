import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Pause, RotateCcw, Settings2, Flame, Snowflake, ArrowLeft, Wind, Maximize, Minimize } from 'lucide-react';
export default function CustomGasProperties({
  onBack,
  title
}) {
  const [isPlaying, setIsPlaying] = useState(true);

  // Core Parameters
  const [temperature, setTemperature] = useState(300); // K
  const [volumeWidth, setVolumeWidth] = useState(400); // Container width
  const [heavyParticles, setHeavyParticles] = useState(50);
  const [lightParticles, setLightParticles] = useState(50);
  const [pressure, setPressure] = useState(0); // Display pressure

  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const particlesRef = useRef([]);
  const wallCollisionsRef = useRef([]); // Track collisions to calculate pressure
  const lastTimeRef = useRef(performance.now());
  const containerHeight = 400;
  const maxContainerWidth = 600;
  const minContainerWidth = 200;

  // Particle constants
  const HEAVY_MASS = 28; // e.g. N2
  const HEAVY_RADIUS = 12;
  const HEAVY_COLOR = '#0a84ff';
  const LIGHT_MASS = 4; // e.g. He
  const LIGHT_RADIUS = 8;
  const LIGHT_COLOR = '#ff375f';
  const initParticles = () => {
    let p = [];

    // Add Heavy Particles
    for (let i = 0; i < heavyParticles; i++) {
      p.push({
        x: Math.random() * (volumeWidth - HEAVY_RADIUS * 2) + HEAVY_RADIUS,
        y: Math.random() * (containerHeight - HEAVY_RADIUS * 2) + HEAVY_RADIUS,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        mass: HEAVY_MASS,
        radius: HEAVY_RADIUS,
        color: HEAVY_COLOR
      });
    }

    // Add Light Particles
    for (let i = 0; i < lightParticles; i++) {
      p.push({
        x: Math.random() * (volumeWidth - LIGHT_RADIUS * 2) + LIGHT_RADIUS,
        y: Math.random() * (containerHeight - LIGHT_RADIUS * 2) + LIGHT_RADIUS,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        mass: LIGHT_MASS,
        radius: LIGHT_RADIUS,
        color: LIGHT_COLOR
      });
    }
    particlesRef.current = p;
    wallCollisionsRef.current = [];
    scaleVelocitiesToTemperature(p, temperature);
  };
  const scaleVelocitiesToTemperature = (p, targetTemp) => {
    if (p.length === 0) return;
    let totalKE = 0;
    for (let i = 0; i < p.length; i++) {
      totalKE += 0.5 * p[i].mass * (p[i].vx * p[i].vx + p[i].vy * p[i].vy);
    }
    const currentTemp = totalKE / p.length || 1;
    const scale = Math.sqrt(targetTemp / currentTemp);
    for (let i = 0; i < p.length; i++) {
      p[i].vx *= scale;
      p[i].vy *= scale;
    }
  };
  useEffect(() => {
    initParticles();
  }, [heavyParticles, lightParticles]);

  // Apply temperature changes dynamically
  useEffect(() => {
    scaleVelocitiesToTemperature(particlesRef.current, temperature);
  }, [temperature]);
  const updatePhysics = time => {
    if (!isPlaying) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(updatePhysics);
      return;
    }
    const dt = Math.min((time - lastTimeRef.current) / 16, 2); // Cap dt
    lastTimeRef.current = time;
    const p = particlesRef.current;
    let momentumChange = 0;

    // Move and collide with walls
    for (let i = 0; i < p.length; i++) {
      p[i].x += p[i].vx * dt;
      p[i].y += p[i].vy * dt;

      // Wall collisions
      if (p[i].x < p[i].radius) {
        p[i].x = p[i].radius;
        p[i].vx *= -1;
        momentumChange += 2 * p[i].mass * Math.abs(p[i].vx);
      } else if (p[i].x > volumeWidth - p[i].radius) {
        p[i].x = volumeWidth - p[i].radius;
        p[i].vx *= -1;
        momentumChange += 2 * p[i].mass * Math.abs(p[i].vx);
      }
      if (p[i].y < p[i].radius) {
        p[i].y = p[i].radius;
        p[i].vy *= -1;
        momentumChange += 2 * p[i].mass * Math.abs(p[i].vy);
      } else if (p[i].y > containerHeight - p[i].radius) {
        p[i].y = containerHeight - p[i].radius;
        p[i].vy *= -1;
        momentumChange += 2 * p[i].mass * Math.abs(p[i].vy);
      }
    }

    // Particle-Particle Collisions (O(n^2) optimized slightly)
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        let dx = p[j].x - p[i].x;
        let dy = p[j].y - p[i].y;
        let distSq = dx * dx + dy * dy;
        let minDist = p[i].radius + p[j].radius;
        if (distSq < minDist * minDist) {
          let dist = Math.sqrt(distSq);
          if (dist === 0) continue;

          // Normal vector
          let nx = dx / dist;
          let ny = dy / dist;

          // Relative velocity
          let dvx = p[j].vx - p[i].vx;
          let dvy = p[j].vy - p[i].vy;

          // Velocity along normal
          let velAlongNormal = dvx * nx + dvy * ny;

          // Do not resolve if velocities are separating
          if (velAlongNormal > 0) continue;

          // Restitution (elastic)
          let e = 1.0;

          // Impulse scalar
          let jImpulse = -(1 + e) * velAlongNormal;
          jImpulse /= 1 / p[i].mass + 1 / p[j].mass;

          // Apply impulse
          let impulseX = jImpulse * nx;
          let impulseY = jImpulse * ny;
          p[i].vx -= 1 / p[i].mass * impulseX;
          p[i].vy -= 1 / p[i].mass * impulseY;
          p[j].vx += 1 / p[j].mass * impulseX;
          p[j].vy += 1 / p[j].mass * impulseY;

          // Positional correction to prevent sticking
          let percent = 0.8; // penetration percentage to correct
          let slop = 0.1; // penetration allowance
          let penetration = minDist - dist;
          let correctionMagnitude = Math.max(penetration - slop, 0.0) / (1 / p[i].mass + 1 / p[j].mass) * percent;
          let cx = nx * correctionMagnitude;
          let cy = ny * correctionMagnitude;
          p[i].x -= 1 / p[i].mass * cx;
          p[i].y -= 1 / p[i].mass * cy;
          p[j].x += 1 / p[j].mass * cx;
          p[j].y += 1 / p[j].mass * cy;
        }
      }
    }

    // Pressure calculation (running average)
    wallCollisionsRef.current.push(momentumChange);
    if (wallCollisionsRef.current.length > 30) wallCollisionsRef.current.shift();
    let avgMomentum = wallCollisionsRef.current.reduce((a, b) => a + b, 0) / wallCollisionsRef.current.length;
    // P = F/A ~ avgMomentum / Area (proportional to volumeWidth)
    let calcPressure = avgMomentum * 10 / (volumeWidth * containerHeight);
    setPressure(calcPressure.toFixed(2));
    renderCanvas();
    requestRef.current = requestAnimationFrame(updatePhysics);
  };
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const p = particlesRef.current;
    for (let i = 0; i < p.length; i++) {
      ctx.beginPath();
      ctx.arc(p[i].x, p[i].y, p[i].radius, 0, Math.PI * 2);
      let grad = ctx.createRadialGradient(p[i].x - p[i].radius * 0.3, p[i].y - p[i].radius * 0.3, p[i].radius * 0.1, p[i].x, p[i].y, p[i].radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, p[i].color);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Draw the right wall to show volume
    ctx.beginPath();
    ctx.moveTo(volumeWidth, 0);
    ctx.lineTo(volumeWidth, containerHeight);
    ctx.strokeStyle = '#bf5af2';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw volume indicator handle
    ctx.fillStyle = '#bf5af2';
    ctx.fillRect(volumeWidth - 10, containerHeight / 2 - 20, 20, 40);
  };
  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, volumeWidth]); // Re-bind if isPlaying or volumeWidth changes

  const applyHeat = () => setTemperature(prev => Math.min(1000, prev + 50));
  const applyCool = () => setTemperature(prev => Math.max(50, prev - 50));
  const increaseVolume = () => setVolumeWidth(prev => Math.min(maxContainerWidth, prev + 50));
  const decreaseVolume = () => {
    setVolumeWidth(prev => {
      const newVol = Math.max(minContainerWidth, prev - 50);
      // Push particles inside new boundary
      particlesRef.current.forEach(p => {
        if (p.x > newVol - p.radius) p.x = newVol - p.radius;
      });
      return newVol;
    });
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
                <button onClick={() => setIsPlaying(!isPlaying)} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          color: isPlaying ? '#ff375f' : '#2ecc71',
          cursor: 'pointer',
          fontWeight: 600
        }}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={initParticles} style={{
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
                    <RotateCcw size={18} /> Reset
                </button>
            </div>
        </div>
        
        {/* 2. Full Bleed Canvas Container */}
        <div style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    }} ref={containerRef}>
            
            {/* Canvas Area Container */}
            <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: '400px'
      }}>
                <div style={{
          position: 'relative',
          width: `${maxContainerWidth}px`,
          height: `${containerHeight}px`,
          border: '4px solid rgba(255,255,255,0.2)',
          borderRight: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 100%)',
          borderRadius: '12px 0 0 12px',
          overflow: 'hidden'
        }}>
                    
                    {/* THE CANVAS */}
                    {/* The internal rendering uses maxContainerWidth / containerHeight as the physical boundaries, but we should make sure the canvas itself is sized based on its layout or container dimensions. However, keeping the internal canvas width/height synced with maxContainerWidth is fine for this specific simulation logic, so we will use maxContainerWidth but could use canvasSize if we want full bleed. But the logic heavily depends on maxContainerWidth. Let's use maxContainerWidth / containerHeight for canvas, wrapped in the flexible container to not break logic. Or we can just resize canvas and adapt logic. Since prompt says "dynamically set the canvas internal resolution", let's use canvasSize.width, height, and we'll change the bounding box to match the container. Wait, if we change the canvas size, the physics boundaries need to update. Let's keep it maxContainerWidth for canvas since it's a "box" simulation. */}
                    <canvas ref={canvasRef} width={maxContainerWidth} height={containerHeight} style={{
            width: '100%',
            height: '100%',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: "contain"
          }} />
                    
                    {/* Pressure Gauge */}
                    <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.05)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)'
          }}>
                        Pressure: {pressure} atm
                    </div>
                </div>
            </div>
            
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
                    <Settings color="rgba(255,255,255,0.7)" size={20} />
                    <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600
          }}>Controls</h3>
                </div>
                
                <h3 style={{
          margin: '0 0 5px 0',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>Volume Control</h3>
                <div style={{
          display: 'flex',
          gap: '10px'
        }}>
                    <button onClick={decreaseVolume} style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '600'
          }}>
                        <Minimize size={18} /> Shrink
                    </button>
                    <button onClick={increaseVolume} style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '600'
          }}>
                        <Maximize size={18} /> Expand
                    </button>
                </div>

                <hr style={{
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          margin: 0
        }} />

                <h3 style={{
          margin: '0 0 5px 0',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>Particles</h3>
                <div>
                    <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
                        <span style={{
              fontSize: '14px',
              color: '#0a84ff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500
            }}>
                            <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#0a84ff'
              }}></div> Heavy
                        </span>
                        <span style={{
              fontSize: '14px',
              color: '#0a84ff',
              fontWeight: 700
            }}>{heavyParticles}</span>
                    </div>
                    <input type="range" min="0" max="150" value={heavyParticles} onChange={e => setHeavyParticles(parseInt(e.target.value))} style={{
            width: '100%',
            accentColor: '#0a84ff',
            cursor: 'pointer'
          }} />
                </div>
                <div>
                    <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
                        <span style={{
              fontSize: '14px',
              color: '#ff375f',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500
            }}>
                            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ff375f'
              }}></div> Light
                        </span>
                        <span style={{
              fontSize: '14px',
              color: '#ff375f',
              fontWeight: 700
            }}>{lightParticles}</span>
                    </div>
                    <input type="range" min="0" max="150" value={lightParticles} onChange={e => setLightParticles(parseInt(e.target.value))} style={{
            width: '100%',
            accentColor: '#ff375f',
            cursor: 'pointer'
          }} />
                </div>

                <hr style={{
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          margin: 0
        }} />

                <h3 style={{
          margin: '0 0 5px 0',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>Temperature</h3>
                <div style={{
          display: 'flex',
          gap: '12px'
        }}>
                    <button onMouseDown={applyCool} style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            cursor: 'pointer',
            background: 'rgba(10,132,255,0.1)',
            color: '#0a84ff',
            border: '1px solid rgba(10,132,255,0.3)',
            fontWeight: '600',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
                        <Snowflake size={24} /> Cool
                    </button>
                    <button onMouseDown={applyHeat} style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            cursor: 'pointer',
            background: 'rgba(255,59,48,0.1)',
            color: '#ff3b30',
            border: '1px solid rgba(255,59,48,0.3)',
            fontWeight: '600',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
                        <Flame size={24} /> Heat
                    </button>
                </div>
                
                <div style={{
          background: 'transparent',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
                    <div style={{
            fontSize: '24px',
            fontWeight: '600',
            fontFamily: 'monospace'
          }}>
                        {Math.round(temperature)} K
                    </div>
                </div>

            </div>
        </div>
    </div>;
}