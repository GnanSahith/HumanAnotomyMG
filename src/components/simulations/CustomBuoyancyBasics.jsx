import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
const CustomBuoyancyBasics = ({
  onBack,
  title = "Buoyancy: Basics"
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // State for controls
  const [material, setMaterial] = useState('wood'); // wood, aluminum, ice, brick, custom
  const [mass, setMass] = useState(2); // kg
  const [volume, setVolume] = useState(5); // L
  
  const [fluidDensity, setFluidDensity] = useState(1.0); // Water = 1.0 kg/L
  const [activeFluid, setActiveFluid] = useState('water');
  const [customBlockDensity, setCustomBlockDensity] = useState(1.0);
  const [customFluidDensity, setCustomFluidDensity] = useState(1.0);
  const [showForces, setShowForces] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const resetSimulation = () => {
      setMaterial('wood');
      setMass(2);
      setVolume(5);
      setFluidDensity(1.0);
      setShowForces(false);
      setIsPlaying(true);
      if (simState.current) {
          simState.current.block.y = 100;
          simState.current.block.vy = 0;
          simState.current.block.isDragging = false;
      }
  };

  // Constants
  const materials = {
    wood: { name: 'Wood', density: 0.4, color: '#8B5A2B' },
    ice: { name: 'Ice', density: 0.92, color: '#ADD8E6' },
    brick: { name: 'Brick', density: 2.0, color: '#B22222' },
    aluminum: { name: 'Aluminum', density: 2.7, color: '#A9A9A9' },
    custom: { name: 'Custom', density: 1.0, color: '#f59e0b' }
  };

  const FLUIDS = {
      water: { name: 'Water', density: 1.0 },
      oil: { name: 'Oil', density: 0.92 },
      honey: { name: 'Honey', density: 1.42 },
      custom: { name: 'Custom', density: 1.0 }
  };

  // Simulation refs
  const simState = useRef({
    block: {
      x: 400,
      y: 100,
      vx: 0,
      vy: 0,
      mass: 2,
      volume: 5,
      density: 0.4,
      width: 100,
      height: 100,
      isDragging: false,
      color: materials.wood.color
    },
    liquid: {
      level: 350,
      // y coordinate of liquid surface
      density: 1.0
    },
    mouse: {
      x: 0,
      y: 0
    }
  });

  // Effect for animation and physics
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTime = performance.now();
    const G = 9.81 * 5; // scaled gravity for visual effect
    const PIXELS_PER_METER = 50;
    const updatePhysics = dt => {
      const state = simState.current;
      const block = state.block;
      const liquid = state.liquid;

      // Update block dimensions based on volume
      const side = Math.sqrt(block.volume * 2000);
      block.width = side;
      block.height = side;
      if (!block.isDragging) {
        // Calculate submerged depth
        const blockBottom = block.y + block.height / 2;
        const blockTop = block.y - block.height / 2;
        let submergedHeight = 0;
        if (blockBottom > liquid.level) {
          if (blockTop >= liquid.level) {
            submergedHeight = block.height;
          } else {
            submergedHeight = blockBottom - liquid.level;
          }
        }

        // Submerged fraction
        const submergedFraction = submergedHeight / block.height;
        const submergedVolume = block.volume * submergedFraction;

        // Forces
        const Fg = block.mass * G;
        const Fb = submergedVolume * liquid.density * G;
        const Fnet_y = Fg - Fb;

        // Acceleration
        const a = Fnet_y / block.mass;

        // Velocity
        block.vy += a * (dt / 1000);

        // Damping (fluid resistance vs air)
        if (submergedHeight > 0) {
          block.vy *= 0.95; // water damping
        } else {
          block.vy *= 0.99; // air resistance
        }

        // Position update
        block.y += block.vy * (dt / 1000) * PIXELS_PER_METER;

        // Floor collision
        if (block.y + block.height / 2 > canvas.height) {
          block.y = canvas.height - block.height / 2;
          block.vy = 0;
        }
      }
    };
    const drawArrow = (ctx, fromx, fromy, tox, toy, color) => {
      if (Math.abs(fromy - toy) < 2) return; // Too small to draw
      const headlen = 12; // length of head in pixels
      const dx = tox - fromx;
      const dy = toy - fromy;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.stroke();
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const state = simState.current;
      const block = state.block;

      // Draw Sky/Background
      const gradient = ctx.createLinearGradient(0, 0, 0, state.liquid.level);
      gradient.addColorStop(0, '#f0f9ff');
      gradient.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, state.liquid.level);

      // Draw Pool
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(0, state.liquid.level, canvas.width, canvas.height - state.liquid.level);

      // Pool Surface Line
      ctx.beginPath();
      ctx.moveTo(0, state.liquid.level);
      ctx.lineTo(canvas.width, state.liquid.level);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Block
      ctx.save();
      ctx.translate(block.x, block.y);

      // Block appearance
      ctx.fillStyle = block.color;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;

      // Block body
      ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height);
      ctx.strokeRect(-block.width / 2, -block.height / 2, block.width, block.height);

      // Highlight/Shading for 3D effect
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(-block.width / 2, -block.height / 2, block.width, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(-block.width / 2, block.height / 2 - 10, block.width, 10);

      // Text labels
      ctx.fillStyle = '#fff';
      if (block.color === '#ADD8E6') ctx.fillStyle = '#0f172a'; // dark text on light ice
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${block.mass.toFixed(1)} kg`, 0, -5);
      ctx.fillText(`${block.volume.toFixed(1)} L`, 0, 15);
      ctx.restore();

      // Draw Forces
      if (showForces) {
        const blockBottom = block.y + block.height / 2;
        const blockTop = block.y - block.height / 2;
        let submergedHeight = 0;
        if (blockBottom > state.liquid.level) {
          if (blockTop >= state.liquid.level) {
            submergedHeight = block.height;
          } else {
            submergedHeight = blockBottom - state.liquid.level;
          }
        }
        const submergedFraction = submergedHeight / block.height;
        const submergedVolume = block.volume * submergedFraction;
        const Fg = block.mass * 12; // Visual multiplier
        const Fb = submergedVolume * state.liquid.density * 12;

        // Gravity Arrow
        drawArrow(ctx, block.x, block.y, block.x, block.y + Fg, '#22c55e');

        // Buoyancy Arrow
        drawArrow(ctx, block.x, block.y, block.x, block.y - Fb, '#a855f7');
      }

      // Liquid Scale / HUD
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'left';
      const initialLiquidVol = 100;
      const blockBottom = block.y + block.height / 2;
      const submergedHeight = Math.max(0, Math.min(block.height, blockBottom - state.liquid.level));
      const submergedFraction = submergedHeight / block.height;
      const subVol = block.volume * submergedFraction;
      const currentLiquidVol = initialLiquidVol + subVol;
      ctx.fillText(`Liquid Vol: ${currentLiquidVol.toFixed(1)} L`, 20, state.liquid.level + 30);
    };
    const loop = time => {
      const dt = Math.min(time - lastTime, 32);
      lastTime = time;
      if (isPlaying) updatePhysics(dt);
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);

    // Interaction handling
    const getMousePos = e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };
    const handleMouseDown = e => {
      const pos = getMousePos(e);
      const block = simState.current.block;
      if (pos.x > block.x - block.width / 2 && pos.x < block.x + block.width / 2 && pos.y > block.y - block.height / 2 && pos.y < block.y + block.height / 2) {
        block.isDragging = true;
        block.vx = 0;
        block.vy = 0;
      }
    };
    const handleMouseMove = e => {
      const pos = getMousePos(e);
      const block = simState.current.block;
      if (block.isDragging) {
        block.x = pos.x;
        block.y = pos.y;
      }
    };
    const handleMouseUp = () => {
      const block = simState.current.block;
      block.isDragging = false;
    };
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showForces]);

  // Synchronize React State to Sim State
  useEffect(() => {
    const block = simState.current.block;
    simState.current.liquid.density = fluidDensity;
    if (material === 'custom') {
      block.mass = mass;
      block.volume = volume;
      block.density = mass / volume;
      block.color = '#f59e0b'; // Amber for custom
    } else {
      const matInfo = materials[material];
      block.color = matInfo.color;
      block.density = matInfo.density;
      block.volume = volume;
      block.mass = volume * matInfo.density;
    }
  }, [material, mass, volume, fluidDensity]);

  // Handlers for sliders
  const handleMaterialChange = e => {
    const newMat = e.target.value;
    setMaterial(newMat);
    if (newMat !== 'custom') {
      setMass(volume * materials[newMat].density);
    }
  };
  const handleVolumeChange = e => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (material !== 'custom') {
      setMass(newVol * materials[material].density);
    }
  };
  const handleMassChange = e => {
    const newMass = parseFloat(e.target.value);
    setMass(newMass);
    if (material !== 'custom') {
      setVolume(newMass / materials[material].density);
    }
  };
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
        cursor: simState.current?.isDragging ? 'grabbing' : 'grab',
      }} />
          
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
          }} value={material} onChange={e => setMaterial(e.target.value)}>
                    {Object.entries(materials).map(([key, mat]) => <option key={key} value={key} style={{
              color: '#000'
            }}>{mat.name} ({mat.density.toFixed(2)} kg/L)</option>)}
                  </select>
                  
                  {material === 'custom' && <div style={{
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
                    <input type="range" min="1" max="20" step="0.5" value={mass} onChange={e => setMass(parseFloat(e.target.value))} style={{
              width: '100%',
              accentColor: '#ff6b6b',
              cursor: 'pointer'
            }} />
                    <div style={{
              textAlign: 'right',
              fontSize: '0.95rem',
              color: '#c8d6e5',
              fontWeight: '500'
            }}>{mass.toFixed(1)} kg</div>
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
              }}>{simState.current?.volume?.toFixed(2)} L</span>
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
              }}>{simState.current?.density?.toFixed(2)} kg/L</span>
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
export default CustomBuoyancyBasics;