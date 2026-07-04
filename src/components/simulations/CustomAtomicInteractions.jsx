import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
const CustomAtomicInteractions = ({
  onBack,
  title = "Atomic Interactions"
}) => {
  const [epsilon, setEpsilon] = useState(1.0); // Depth of potential well
  const [sigma, setSigma] = useState(2.0); // Distance at which potential is zero
  const [distance, setDistance] = useState(2.5); // Current distance between atoms

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({
    width: 800,
    height: 600
  });
  const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Constants for colors
  const colors = {
    atom1: '#ff4b4b',
    atom2: '#4b9eff',
    graphLine: '#00e5ff',
    graphHighlight: '#ffeb3b',
    grid: 'rgba(255, 255, 255, 0.05)',
    text: '#ffffff'
  };
  const drawSimulation = (ctx, width, height) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Graph Area (left part) and Atom Area (bottom/top)
    const atomAreaHeight = height * 0.4;
    const graphAreaHeight = height * 0.6;

    // Draw Atoms
    const atomRadius = 30;
    const fixedAtomX = width * 0.2;
    const atomY = atomAreaHeight / 2;
    // Scale distance for visual
    const visualDistanceScale = 80;
    const movableAtomX = fixedAtomX + distance * visualDistanceScale;

    // Fixed Atom Glow
    const fixedGlow = ctx.createRadialGradient(fixedAtomX, atomY, atomRadius * 0.5, fixedAtomX, atomY, atomRadius * 1.5);
    fixedGlow.addColorStop(0, 'rgba(255, 75, 75, 0.5)');
    fixedGlow.addColorStop(1, 'rgba(255, 75, 75, 0)');
    ctx.fillStyle = fixedGlow;
    ctx.beginPath();
    ctx.arc(fixedAtomX, atomY, atomRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Fixed Atom
    ctx.beginPath();
    ctx.arc(fixedAtomX, atomY, atomRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.atom1;
    ctx.fill();
    const grad1 = ctx.createRadialGradient(fixedAtomX - 10, atomY - 10, 5, fixedAtomX, atomY, atomRadius);
    grad1.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad1;
    ctx.fill();

    // Movable Atom Glow
    const movableGlow = ctx.createRadialGradient(movableAtomX, atomY, atomRadius * 0.5, movableAtomX, atomY, atomRadius * 1.5);
    movableGlow.addColorStop(0, 'rgba(75, 158, 255, 0.5)');
    movableGlow.addColorStop(1, 'rgba(75, 158, 255, 0)');
    ctx.fillStyle = movableGlow;
    ctx.beginPath();
    ctx.arc(movableAtomX, atomY, atomRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Movable Atom
    ctx.beginPath();
    ctx.arc(movableAtomX, atomY, atomRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.atom2;
    ctx.fill();
    const grad2 = ctx.createRadialGradient(movableAtomX - 10, atomY - 10, 5, movableAtomX, atomY, atomRadius);
    grad2.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad2;
    ctx.fill();

    // Draw Forces
    const force = 24 * epsilon / distance * (2 * Math.pow(sigma / distance, 12) - Math.pow(sigma / distance, 6));
    if (Math.abs(force) > 0.05) {
      const forceScale = 15;
      const forceVisual = Math.max(-120, Math.min(120, force * forceScale));
      const drawArrow = (fromX, fromY, toX, toY, color) => {
        const headlen = 10;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();
      };
      const arrowColor = force > 0 ? '#ffeb3b' : '#00e5ff'; // Yellow for repulsive, Cyan for attractive

      // Force on movable atom
      drawArrow(movableAtomX, atomY, movableAtomX + forceVisual, atomY, arrowColor);

      // Force on fixed atom
      drawArrow(fixedAtomX, atomY, fixedAtomX - forceVisual, atomY, arrowColor);

      // Label forces
      ctx.fillStyle = arrowColor;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(force > 0 ? 'Repulsive Force' : 'Attractive Force', width / 2, atomY - 60);
    }

    // Draw Potential Energy Graph
    const graphYBase = height * 0.75; // 0 potential energy line
    const graphXBase = fixedAtomX; // r=0 line

    // Draw Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(graphXBase, atomAreaHeight + 20);
    ctx.lineTo(graphXBase, height - 30); // y-axis
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(graphXBase - 30, graphYBase);
    ctx.lineTo(width - 40, graphYBase); // x-axis
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Potential Energy (V)', graphXBase + 15, atomAreaHeight + 40);
    ctx.textAlign = 'right';
    ctx.fillText('Distance (r)', width - 50, graphYBase - 15);

    // Plot Curve
    ctx.beginPath();
    ctx.strokeStyle = colors.graphLine;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    let first = true;
    for (let r = sigma * 0.82; r < (width - graphXBase) / visualDistanceScale; r += 0.02) {
      const v = 4 * epsilon * (Math.pow(sigma / r, 12) - Math.pow(sigma / r, 6));
      const px = graphXBase + r * visualDistanceScale;
      const vScale = 80;
      const py = graphYBase - v * vScale;
      if (py > height - 10) continue;
      if (py < atomAreaHeight + 10) continue;
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }

    // Add glow to the line
    ctx.shadowBlur = 10;
    ctx.shadowColor = colors.graphLine;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw current distance marker on graph
    const currentV = 4 * epsilon * (Math.pow(sigma / distance, 12) - Math.pow(sigma / distance, 6));
    const currentPx = graphXBase + distance * visualDistanceScale;
    const currentPy = graphYBase - currentV * 80;

    // Dashed line from atom to graph point
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.moveTo(movableAtomX, atomY + atomRadius + 10);
    ctx.lineTo(currentPx, currentPy);
    ctx.stroke();
    ctx.setLineDash([]);

    // The point
    ctx.beginPath();
    ctx.arc(currentPx, currentPy, 8, 0, Math.PI * 2);
    ctx.fillStyle = colors.graphHighlight;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Draw point glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.graphHighlight;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Display Energy Value
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`V = ${currentV.toFixed(2)}`, currentPx + 15, currentPy);
  };
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
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    const render = () => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(render);
      return;
    }
      if (canvasSize.width > 0 && canvasSize.height > 0) {
        drawSimulation(ctx, canvasSize.width, canvasSize.height);
      }
      animationId = requestAnimationFrame(render);
    };
    if (isPlaying) {
      render();
    } else {
      if (canvasSize.width > 0 && canvasSize.height > 0) {
        drawSimulation(ctx, canvasSize.width, canvasSize.height);
      }
    }
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [distance, epsilon, sigma, canvasSize, isPlaying]);
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
                
                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
                  <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
                    <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              color: '#cbd5e1',
              fontWeight: 500
            }}>
                      <span>Atomic Distance (r)</span>
                      <span style={{
                color: '#38bdf8',
                fontWeight: 700
              }}>{distance.toFixed(2)}</span>
                    </label>
                    <input type="range" min={sigma * 0.85} max="10" step="0.01" value={distance} onChange={e => setDistance(parseFloat(e.target.value))} style={{
              width: '100%',
              accentColor: '#00e5ff'
            }} />
                  </div>

                  <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
                    <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              color: '#cbd5e1',
              fontWeight: 500
            }}>
                      <span>Interaction Strength (ε)</span>
                      <span style={{
                color: '#38bdf8',
                fontWeight: 700
              }}>{epsilon.toFixed(2)}</span>
                    </label>
                    <input type="range" min="0.1" max="3.0" step="0.1" value={epsilon} onChange={e => setEpsilon(parseFloat(e.target.value))} style={{
              width: '100%',
              accentColor: '#00e5ff'
            }} />
                  </div>

                  <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
                    <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              color: '#cbd5e1',
              fontWeight: 500
            }}>
                      <span>Atom Diameter (σ)</span>
                      <span style={{
                color: '#38bdf8',
                fontWeight: 700
              }}>{sigma.toFixed(2)}</span>
                    </label>
                    <input type="range" min="1.0" max="4.0" step="0.1" value={sigma} onChange={e => {
              const newSigma = parseFloat(e.target.value);
              setSigma(newSigma);
              if (distance < newSigma * 0.85) {
                setDistance(newSigma * 0.85);
              }
            }} style={{
              width: '100%',
              accentColor: '#00e5ff'
            }} />
                  </div>
                </div>

                <div style={{
          marginTop: 'auto',
          padding: '16px',
          background: 'rgba(56, 189, 248, 0.05)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '12px'
        }}>
                  <p style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#94a3b8'
          }}>
                    <strong>Lennard-Jones Potential:</strong>
                    <span style={{
              display: 'block',
              marginTop: '8px',
              fontFamily: 'monospace',
              color: '#e2e8f0',
              background: 'rgba(0,0,0,0.3)',
              padding: '8px',
              borderRadius: '6px',
              textAlign: 'center'
            }}>V(r) = 4ε [ (σ/r)¹² - (σ/r)⁶ ]</span>
                  </p>
                  <p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#94a3b8'
          }}>
                    Adjust the <strong>distance</strong> to observe intermolecular forces. Notice how the atoms repel strongly when pushed too close, and attract weakly at moderate distances.
                  </p>
                </div>
                
            </div>
        </div>
    </div>;
};
export default CustomAtomicInteractions;