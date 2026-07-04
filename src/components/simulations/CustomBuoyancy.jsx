import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback } from 'react';

// Materials configuration
const BLOCK_MATERIALS = {
  wood: {
    name: 'Wood',
    density: 0.40,
    color: '#8B5A2B'
  },
  // kg/L
  ice: {
    name: 'Ice',
    density: 0.92,
    color: '#A0E6FF'
  },
  brick: {
    name: 'Brick',
    density: 2.00,
    color: '#B22222'
  },
  aluminum: {
    name: 'Aluminum',
    density: 2.70,
    color: '#A9A9A9'
  },
  custom: {
    name: 'Custom',
    density: 1.00,
    color: '#DDA0DD'
  }
};
const FLUIDS = {
  gasoline: {
    name: 'Gasoline',
    density: 0.70,
    color: 'rgba(255, 215, 0, 0.4)'
  },
  water: {
    name: 'Water',
    density: 1.00,
    color: 'rgba(30, 144, 255, 0.5)'
  },
  honey: {
    name: 'Honey',
    density: 1.42,
    color: 'rgba(255, 165, 0, 0.6)'
  },
  custom: {
    name: 'Custom',
    density: 1.00,
    color: 'rgba(0, 206, 209, 0.5)'
  }
};
const GRAVITY = 9.8; // m/s^2
const VOLUME_TO_PIXELS = 1000; // 1 L = 1000 pixels^2 area

const CustomBuoyancy = ({
  onBack,
  title = "Buoyancy Simulation"
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
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
  const containerRef = useRef(null);
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  const resetSimulation = () => {
    blockRef.current.x = 400;
    blockRef.current.y = 100;
    blockRef.current.vx = 0;
    blockRef.current.vy = 0;
  };

  // State for Controls
  const [activeMaterial, setActiveMaterial] = useState('wood');
  const [activeFluid, setActiveFluid] = useState('water');
  const [customBlockDensity, setCustomBlockDensity] = useState(1.0);
  const [customFluidDensity, setCustomFluidDensity] = useState(1.0);
  const [blockMass, setBlockMass] = useState(5); // kg
  const [showForces, setShowForces] = useState(true);

  // Physics State (managed in refs to avoid re-renders during loop)
  const blockRef = useRef({
    x: 400,
    y: 100,
    vx: 0,
    vy: 0,
    mass: 5,
    volume: 5 / BLOCK_MATERIALS['wood'].density,
    density: BLOCK_MATERIALS['wood'].density,
    color: BLOCK_MATERIALS['wood'].color,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0
  });
  const fluidRef = useRef({
    density: FLUIDS['water'].density,
    color: FLUIDS['water'].color,
    baseLevel: 400,
    // Base y level of fluid
    currentLevel: 400
  });

  // Handlers for UI changes
  useEffect(() => {
    const block = blockRef.current;
    let density = BLOCK_MATERIALS[activeMaterial].density;
    if (activeMaterial === 'custom') density = customBlockDensity;
    block.density = density;
    block.volume = blockMass / density;
    block.color = BLOCK_MATERIALS[activeMaterial].color;
    block.mass = blockMass;
  }, [activeMaterial, customBlockDensity, blockMass]);
  useEffect(() => {
    const fluid = fluidRef.current;
    let density = FLUIDS[activeFluid].density;
    if (activeFluid === 'custom') density = customFluidDensity;
    fluid.density = density;
    fluid.color = FLUIDS[activeFluid].color;
  }, [activeFluid, customFluidDensity]);

  // Physics Loop
  const updatePhysics = dt => {
    const block = blockRef.current;
    const fluid = fluidRef.current;

    // Calculate block dimensions
    const sideLength = Math.sqrt(block.volume * VOLUME_TO_PIXELS);
    const halfSide = sideLength / 2;
    if (!block.isDragging) {
      let forceY = block.mass * GRAVITY;
      const blockBottom = block.y + halfSide;
      const blockTop = block.y - halfSide;
      let submergedFraction = 0;
      if (blockBottom > fluid.currentLevel) {
        if (blockTop >= fluid.currentLevel) {
          submergedFraction = 1;
        } else {
          submergedFraction = (blockBottom - fluid.currentLevel) / sideLength;
        }
      }
      const submergedVolume = block.volume * submergedFraction;
      const buoyancyForce = submergedVolume * fluid.density * GRAVITY;
      forceY -= buoyancyForce;
      const damping = submergedFraction > 0 ? 3.0 : 0.5;
      forceY -= block.vy * damping;
      const ay = forceY / block.mass;
      block.vy += ay * dt;
      block.y += block.vy * dt * 10;
      if (block.y + halfSide > 600) {
        block.y = 600 - halfSide;
        block.vy *= -0.5;
      }
    }
    const blockBottom = block.y + halfSide;
    const blockTop = block.y - halfSide;
    const sideLength_2 = Math.sqrt(block.volume * VOLUME_TO_PIXELS);
    let subFrac = 0;
    if (blockBottom > fluid.baseLevel) {
      if (blockTop >= fluid.baseLevel) {
        subFrac = 1;
      } else {
        subFrac = (blockBottom - fluid.baseLevel) / sideLength_2;
      }
    }
    const submergedArea = subFrac * (block.volume * VOLUME_TO_PIXELS);
    fluid.currentLevel = fluid.baseLevel - submergedArea / 800;
  };

  // Render Loop
  const render = (ctx, canvas) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const block = blockRef.current;
    const fluid = fluidRef.current;
    const sideLength = Math.sqrt(block.volume * VOLUME_TO_PIXELS);
    const halfSide = sideLength / 2;

    // Draw Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#eef2f3');
    bgGradient.addColorStop(1, '#8e9eab');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Tank lines
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, fluid.baseLevel);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, fluid.baseLevel);
    ctx.stroke();

    // Draw Fluid
    ctx.fillStyle = fluid.color;
    ctx.fillRect(0, fluid.currentLevel, canvas.width, canvas.height - fluid.currentLevel);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, fluid.currentLevel);
    ctx.lineTo(canvas.width, fluid.currentLevel);
    ctx.stroke();

    // Draw Block
    ctx.fillStyle = block.color;
    // rounded rect for nicer look
    ctx.beginPath();
    ctx.roundRect(block.x - halfSide, block.y - halfSide, sideLength, sideLength, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${block.mass.toFixed(1)} kg`, block.x, block.y);
    ctx.shadowBlur = 0;

    // Draw Forces
    if (showForces && !block.isDragging) {
      let submergedFraction = 0;
      const blockBottom = block.y + halfSide;
      const blockTop = block.y - halfSide;
      if (blockBottom > fluid.currentLevel) {
        if (blockTop >= fluid.currentLevel) submergedFraction = 1;else submergedFraction = (blockBottom - fluid.currentLevel) / sideLength;
      }
      const F_g = block.mass * GRAVITY;
      const F_b = block.volume * submergedFraction * fluid.density * GRAVITY;
      const forceScale = 2;
      if (F_g > 0) {
        ctx.strokeStyle = '#ff4757';
        ctx.fillStyle = '#ff4757';
        ctx.lineWidth = 4;
        drawArrow(ctx, block.x + 20, block.y, block.x + 20, block.y + F_g * forceScale);
      }
      if (F_b > 0) {
        ctx.strokeStyle = '#1e90ff';
        ctx.fillStyle = '#1e90ff';
        ctx.lineWidth = 4;
        drawArrow(ctx, block.x - 20, block.y, block.x - 20, block.y - F_b * forceScale);
      }
    }
  };
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headlen = 12;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();
    const loop = time => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(loop);
      return;
    }
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      if (isPlaying) updatePhysics(dt);
      render(ctx, canvas);
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [showForces]);

  // Event Handlers
  const handlePointerDown = e => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const block = blockRef.current;
    const sideLength = Math.sqrt(block.volume * VOLUME_TO_PIXELS);
    const halfSide = sideLength / 2;
    if (x >= block.x - halfSide && x <= block.x + halfSide && y >= block.y - halfSide && y <= block.y + halfSide) {
      block.isDragging = true;
      block.dragOffsetX = x - block.x;
      block.dragOffsetY = y - block.y;
      block.vy = 0;
    }
  };
  const handlePointerMove = e => {
    const block = blockRef.current;
    if (!block.isDragging) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    block.x = x - block.dragOffsetX;
    block.y = y - block.dragOffsetY;
    const sideLength = Math.sqrt(block.volume * VOLUME_TO_PIXELS);
    const halfSide = sideLength / 2;
    if (block.x - halfSide < 0) block.x = halfSide;
    if (block.x + halfSide > canvas.width) block.x = canvas.width - halfSide;
    if (block.y - halfSide < 0) block.y = halfSide;
    if (block.y + halfSide > canvas.height) block.y = canvas.height - halfSide;
  };
  const handlePointerUp = () => {
    const block = blockRef.current;
    block.isDragging = false;
  };

  // Modern UI Styles
  return <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a1a',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
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
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button onClick={resetSimulation} style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
                  <RotateCcw size={18} /> Reset
              </button>
          </div>
      </div>
      
      <div ref={containerRef} style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    }}>
          <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: blockRef.current?.isDragging ? 'grabbing' : 'grab',
        objectFit: "contain"
      }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerOut={handlePointerUp} />
          
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
          background: "rgba(255,255,255,0.05)",
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: "blur(12px)"
        }}>
                  <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: '#ff6b6b',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontSize: '0.85rem'
          }}>Block Properties</label>
                  <select style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            marginBottom: '12px',
            fontSize: '1rem',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none'
          }} value={activeMaterial} onChange={e => setActiveMaterial(e.target.value)}>
                    {Object.entries(BLOCK_MATERIALS).map(([key, mat]) => <option key={key} value={key} style={{
              color: '#000'
            }}>{mat.name} ({mat.density.toFixed(2)} kg/L)</option>)}
                  </select>
                  
                  {activeMaterial === 'custom' && <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px'
          }}>
                      <span style={{
              fontSize: '0.95rem'
            }}>Custom Density:</span>
                      <input type="range" min="0.1" max="5" step="0.1" value={customBlockDensity} onChange={e => setCustomBlockDensity(parseFloat(e.target.value))} style={{
              width: '100%',
              accentColor: '#ff6b6b',
              cursor: 'pointer'
            }} />
                      <div style={{
              textAlign: 'right',
              fontSize: '0.95rem',
              color: '#c8d6e5',
              fontWeight: '500'
            }}>{customBlockDensity.toFixed(2)} kg/L</div>
                  </div>}

                  <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px'
          }}>
                    <span style={{
              fontSize: '0.95rem',
              marginTop: '8px'
            }}>Block Mass:</span>
                    <input type="range" min="1" max="20" step="0.5" value={blockMass} onChange={e => setBlockMass(parseFloat(e.target.value))} style={{
              width: '100%',
              accentColor: '#ff6b6b',
              cursor: 'pointer'
            }} />
                    <div style={{
              textAlign: 'right',
              fontSize: '0.95rem',
              color: '#c8d6e5',
              fontWeight: '500'
            }}>{blockMass.toFixed(1)} kg</div>
                  </div>
                  
                  <div style={{
            marginTop: '20px',
            paddingTop: '10px'
          }}>
                    <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '8px 0',
              fontSize: '0.95rem'
            }}>
                      <span style={{
                color: '#a4b0be'
              }}>Volume:</span>
                      <span style={{
                fontWeight: '600'
              }}>{blockRef.current?.volume?.toFixed(2)} L</span>
                    </div>
                    <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '8px 0',
              fontSize: '0.95rem'
            }}>
                      <span style={{
                color: '#a4b0be'
              }}>Density:</span>
                      <span style={{
                fontWeight: '600'
              }}>{blockRef.current?.density?.toFixed(2)} kg/L</span>
                    </div>
                  </div>
              </div>

              <div style={{
          background: "rgba(255,255,255,0.05)",
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: "blur(12px)"
        }}>
                  <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: '#ff6b6b',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontSize: '0.85rem'
          }}>Fluid Properties</label>
                  <select style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            marginBottom: '12px',
            fontSize: '1rem',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none'
          }} value={activeFluid} onChange={e => setActiveFluid(e.target.value)}>
                    {Object.entries(FLUIDS).map(([key, fluid]) => <option key={key} value={key} style={{
              color: '#000'
            }}>{fluid.name} ({fluid.density.toFixed(2)} kg/L)</option>)}
                  </select>
                  
                  {activeFluid === 'custom' && <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px'
          }}>
                      <span style={{
              fontSize: '0.95rem'
            }}>Custom Density:</span>
                      <input type="range" min="0.5" max="3" step="0.1" value={customFluidDensity} onChange={e => setCustomFluidDensity(parseFloat(e.target.value))} style={{
              width: '100%',
              accentColor: '#ff6b6b',
              cursor: 'pointer'
            }} />
                      <div style={{
              textAlign: 'right',
              fontSize: '0.95rem',
              color: '#c8d6e5',
              fontWeight: '500'
            }}>{customFluidDensity.toFixed(2)} kg/L</div>
                  </div>}
              </div>

              <div style={{
          background: "rgba(255,255,255,0.05)",
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: "blur(12px)"
        }}>
                  <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: '#ff6b6b',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontSize: '0.85rem'
          }}>Display Settings</label>
                  <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '1.05rem',
            fontWeight: '500'
          }}>
                    <input type="checkbox" checked={showForces} onChange={e => setShowForces(e.target.checked)} style={{
              width: '22px',
              height: '22px',
              accentColor: '#ff6b6b'
            }} />
                    Show Force Vectors
                  </label>
              </div>

              <div style={{
          marginTop: 'auto',
          textAlign: 'center',
          color: '#a4b0be',
          fontSize: '0.9rem',
          fontStyle: 'italic'
        }}>
                  Interactive: Drag the block in and out of the fluid to observe forces.
              </div>
          </div>
      </div>
  </div>;
};
export default CustomBuoyancy;