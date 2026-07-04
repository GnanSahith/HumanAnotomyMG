import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
const GRAVITY = 9.8; // m/s^2
const WATER_DENSITY = 1.0; // kg/L

export default function CustomDensity({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [mass, setMass] = useState(5); // kg
  const [volume, setVolume] = useState(5); // L
  const [fluidDensity, setFluidDensity] = useState(WATER_DENSITY); // kg/L
  const [activeFluid, setActiveFluid] = useState('water');
  const [customFluidDensity, setCustomFluidDensity] = useState(1.0);
  const [showForces, setShowForces] = useState(true);
  const [localIsPlaying, setLocalIsPlaying] = useState(true);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  
  const resetSimulation = () => {
      setMass(5);
      setVolume(5);
      setActiveFluid('water');
      setCustomFluidDensity(1.0);
      setIsPlaying(true);
      if (blockState.current) {
          blockState.current.x = 150;
          blockState.current.y = 100;
          blockState.current.vy = 0;
          blockState.current.isDragging = false;
      }
  };

  // Physics state
  const blockState = useRef({
    x: 150,
    y: 100,
    vy: 0,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0
  });
  const lastTimeRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Handle mouse events
    const handleMouseDown = e => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const baseSize = 50;
      const blockSize = Math.max(30, Math.sqrt(volume) * baseSize);
      const {
        x,
        y
      } = blockState.current;
      if (mouseX >= x && mouseX <= x + blockSize && mouseY >= y && mouseY <= y + blockSize) {
        blockState.current.isDragging = true;
        blockState.current.dragOffsetX = mouseX - x;
        blockState.current.dragOffsetY = mouseY - y;
        blockState.current.vy = 0;
      }
    };
    const handleMouseMove = e => {
      if (!blockState.current.isDragging) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      blockState.current.x = mouseX - blockState.current.dragOffsetX;
      blockState.current.y = mouseY - blockState.current.dragOffsetY;
    };
    const handleMouseUp = () => {
      blockState.current.isDragging = false;
    };
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Handle Touch Events for mobile support
    const handleTouchStart = e => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      const baseSize = 50;
      const blockSize = Math.max(30, Math.sqrt(volume) * baseSize);
      const {
        x,
        y
      } = blockState.current;
      if (mouseX >= x && mouseX <= x + blockSize && mouseY >= y && mouseY <= y + blockSize) {
        blockState.current.isDragging = true;
        blockState.current.dragOffsetX = mouseX - x;
        blockState.current.dragOffsetY = mouseY - y;
        blockState.current.vy = 0;
      }
    };
    const handleTouchMove = e => {
      if (!blockState.current.isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      blockState.current.x = mouseX - blockState.current.dragOffsetX;
      blockState.current.y = mouseY - blockState.current.dragOffsetY;
    };
    canvas.addEventListener('touchstart', handleTouchStart, {
      passive: false
    });
    window.addEventListener('touchmove', handleTouchMove, {
      passive: false
    });
    window.addEventListener('touchend', handleMouseUp);
    const updateAndDraw = time => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(updateAndDraw);
      return;
    }
      if (lastTimeRef.current != null) {
        const dt = (time - lastTimeRef.current) / 1000;
        const deltaT = Math.min(dt, 0.05);
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const waterTop = canvasHeight * 0.5;
        const floorY = canvasHeight - 40;
        const baseSize = 50;
        const blockSize = Math.max(30, Math.sqrt(volume) * baseSize);
        const density = mass / volume;

        // Physics Update
        if (!blockState.current.isDragging) {
          let forceY = mass * GRAVITY;
          const blockBottom = blockState.current.y + blockSize;
          if (blockBottom > waterTop) {
            const submergedHeight = Math.min(blockSize, blockBottom - waterTop);
            const fractionSubmerged = submergedHeight / blockSize;
            const submergedVolume = volume * fractionSubmerged;
            const buoyantForce = submergedVolume * fluidDensity * GRAVITY;
            forceY -= buoyantForce;
            const dragForce = -5 * blockState.current.vy * Math.abs(blockState.current.vy);
            forceY += dragForce;
          } else {
            const dragForce = -0.1 * blockState.current.vy * Math.abs(blockState.current.vy);
            forceY += dragForce;
          }
          const accelerationY = forceY / mass;
          blockState.current.vy += accelerationY * deltaT;
          let newY = blockState.current.y + blockState.current.vy * deltaT * 50;
          if (newY >= floorY - blockSize) {
            newY = floorY - blockSize;
            blockState.current.vy = -blockState.current.vy * 0.3;
            if (Math.abs(blockState.current.vy) < 5) blockState.current.vy = 0;
          }
          if (newY <= 0) {
            newY = 0;
            blockState.current.vy = 0;
          }
          blockState.current.y = newY;
        }

        // --- Drawing ---
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, waterTop);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvasWidth, waterTop);

        // Water
        ctx.fillStyle = 'rgba(20, 150, 220, 0.65)';
        ctx.fillRect(0, waterTop, canvasWidth, canvasHeight - waterTop - 40);
        ctx.beginPath();
        ctx.moveTo(0, waterTop);
        ctx.lineTo(canvasWidth, waterTop);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Fluid Density: ${fluidDensity.toFixed(2)} kg/L`, 15, waterTop + 25);

        // Ground
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, floorY, canvasWidth, 40);
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(canvasWidth, floorY);
        ctx.strokeStyle = '#4A3018';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Block
        let blockColor = density < 0.8 ? '#D2B48C' : density < 2 ? '#B0C4DE' : '#DAA520';
        ctx.fillStyle = blockColor;
        ctx.fillRect(blockState.current.x, blockState.current.y, blockSize, blockSize);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(blockState.current.x, blockState.current.y, blockSize, blockSize);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(`${mass.toFixed(1)} kg`, blockState.current.x + blockSize / 2, blockState.current.y + blockSize / 2 - 10);
        ctx.fillText(`${volume.toFixed(1)} L`, blockState.current.x + blockSize / 2, blockState.current.y + blockSize / 2 + 10);
        ctx.shadowBlur = 0; // reset
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(updateAndDraw);
    };
    requestRef.current = requestAnimationFrame(updateAndDraw);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [mass, volume, fluidDensity]);
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1E1E2F',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    topBar: {
      height: '60px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      backgroundColor: '#151522',
      padding: '0 20px',
      borderBottom: '1px solid #2C2C40',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      zIndex: 10
    },
    backBtn: {
      padding: '8px 16px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.2)',
      color: '#FFF',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    titleText: {
      color: '#FFF',
      fontSize: '20px',
      fontWeight: '800',
      letterSpacing: '1px',
      margin: 0
    },
    mainArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden'
    },
    canvasContainer: {
      flex: 3,
      position: 'relative',
      backgroundColor: '#87CEEB'
    },
    controls: {
      flex: 1,
      minWidth: '300px',
      maxWidth: '400px',
      backgroundColor: 'rgba(30, 30, 45, 0.95)',
      padding: '24px',
      borderLeft: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      overflowY: 'auto'
    },
    controlsTitle: {
      color: '#FFF',
      fontSize: '24px',
      fontWeight: '800',
      margin: '0 0 10px 0',
      textAlign: 'center',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
    },
    controlGroup: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      padding: '16px',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    label: {
      color: '#E0E0E0',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '12px',
      display: 'block'
    },
    buttonRow: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end'
    },
    adjustBtn: {
      backgroundColor: 'rgba(0, 122, 255, 0.8)',
      width: '44px',
      height: '44px',
      borderRadius: '22px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0,122,255,0.5)',
      color: '#FFF',
      fontSize: '24px',
      fontWeight: 'bold',
      lineHeight: '1'
    },
    infoBox: {
      marginTop: 'auto',
      padding: '20px',
      backgroundColor: 'rgba(0, 255, 150, 0.1)',
      borderRadius: '16px',
      border: '1px solid rgba(0, 255, 150, 0.3)',
      boxShadow: '0 0 10px rgba(0, 255, 150, 0.2)'
    },
    infoText: {
      color: '#FFF',
      fontSize: '16px',
      margin: '0 0 8px 0',
      fontWeight: 'bold'
    }
  };
  return (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a1a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: 'transparent', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button onClick={resetSimulation} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <RotateCcw size={18} /> Reset
              </button>
          </div>
      </div>
      
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <canvas 
            ref={canvasRef} 
            width={canvasSize.width} 
            height={canvasSize.height} 
            style={{ width: '100%', height: '100%', display: 'block', cursor: blockState.current?.isDragging ? 'grabbing' : 'grab' }} 
          />
          
          <div style={{ position: 'absolute', right: '40px', top: '20px', bottom: '20px', width: '340px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Controls</h3>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1.2px', fontSize: '0.85rem' }}>Block Properties</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.95rem' }}>Block Mass:</span>
                    <input type="range" min="1" max="20" step="0.1" value={mass} onChange={e => setMass(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ff6b6b', cursor: 'pointer' }} />
                    <div style={{ textAlign: 'right', fontSize: '0.95rem', color: '#c8d6e5', fontWeight: '500' }}>{mass.toFixed(2)} kg</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.95rem' }}>Block Volume:</span>
                    <input type="range" min="1" max="20" step="0.1" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ff6b6b', cursor: 'pointer' }} />
                    <div style={{ textAlign: 'right', fontSize: '0.95rem', color: '#c8d6e5', fontWeight: '500' }}>{volume.toFixed(2)} L</div>
                  </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1.2px', fontSize: '0.85rem' }}>Fluid Properties</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.95rem' }}>Fluid Density:</span>
                      <input type="range" min="0.1" max="3" step="0.1" value={fluidDensity} onChange={e => setFluidDensity(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ff6b6b', cursor: 'pointer' }} />
                      <div style={{ textAlign: 'right', fontSize: '0.95rem', color: '#c8d6e5', fontWeight: '500' }}>{fluidDensity.toFixed(2)} kg/L</div>
                  </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1.2px', fontSize: '0.85rem' }}>Display Settings</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: '500' }}>
                    <input type="checkbox" checked={showForces} onChange={e => setShowForces(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: '#ff6b6b' }} />
                    Show Force Vectors
                  </label>
              </div>

              <div style={{ marginTop: 'auto', textAlign: 'center', color: '#a4b0be', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Interactive: Drag the block in and out of the fluid to observe forces.
              </div>
          </div>
      </div>
  </div>
  );
};
