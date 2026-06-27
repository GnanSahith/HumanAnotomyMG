import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

// Solute data
const solutes = {
  DrinkMix: {
    name: 'Drink Mix',
    color: [220, 50, 50],
    maxConcentration: 5.0
  },
  CobaltIINitrate: {
    name: 'Cobalt (II) Nitrate',
    color: [200, 50, 50],
    maxConcentration: 5.0
  },
  CobaltIIChloride: {
    name: 'Cobalt (II) Chloride',
    color: [255, 100, 150],
    maxConcentration: 4.3
  },
  PotassiumDichromate: {
    name: 'Potassium Dichromate',
    color: [255, 140, 0],
    maxConcentration: 0.5
  },
  PotassiumChromate: {
    name: 'Potassium Chromate',
    color: [255, 255, 0],
    maxConcentration: 3.3
  },
  NickelIIChloride: {
    name: 'Nickel (II) Chloride',
    color: [0, 200, 100],
    maxConcentration: 5.0
  },
  CopperIISulfate: {
    name: 'Copper (II) Sulfate',
    color: [0, 150, 255],
    maxConcentration: 1.4
  },
  PotassiumPermanganate: {
    name: 'Potassium Permanganate',
    color: [150, 0, 200],
    maxConcentration: 0.5
  }
};
export default function CustomConcentration({
  onBack,
  title = "Concentration"
}) {
  // State
  const [solute, setSolute] = useState('DrinkMix');
  const [soluteForm, setSoluteForm] = useState('solid'); // 'solid' or 'liquid'
  const [isPlaying, setIsPlaying] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [volume, setVolume] = useState(0.5); // Liters, max 1.0, min 0.0
  const [moles, setMoles] = useState(0.0); // Moles of solute
  const [isEvaporating, setIsEvaporating] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const maxVolume = 1.0;
  const particlesRef = useRef([]);

  const resetSimulation = () => {
      setSolute('DrinkMix');
      setSoluteForm('solid');
      setVolume(0.5);
      setMoles(0.0);
      setIsEvaporating(false);
      setIsPlaying(true);
      if (particlesRef.current) {
          particlesRef.current = [];
      }
  };
  const currentSolute = solutes[solute];
  const concentration = volume > 0 ? moles / volume : 0;
  const isSaturated = concentration >= currentSolute.maxConcentration;
  const dissolvedMoles = isSaturated ? currentSolute.maxConcentration * volume : moles;
  const precipitatedMoles = moles - dissolvedMoles;
  const displayConcentration = volume > 0 ? dissolvedMoles / volume : 0;

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Beaker properties
      const beakerX = 150;
      const beakerY = 100;
      const beakerW = 300;
      const beakerH = 300;
      const beakerBottom = beakerY + beakerH;

      // Draw Liquid
      if (volume > 0) {
        const liquidH = volume / maxVolume * beakerH * 0.8; // Max volume fills 80% of beaker
        const liquidY = beakerBottom - liquidH;

        // Color calculation based on concentration
        const intensity = Math.min(1, displayConcentration / currentSolute.maxConcentration);
        const r = Math.round(220 + (currentSolute.color[0] - 220) * intensity);
        const g = Math.round(240 + (currentSolute.color[1] - 240) * intensity);
        const b = Math.round(255 + (currentSolute.color[2] - 255) * intensity);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.fillRect(beakerX, liquidY, beakerW, liquidH);

        // Draw top surface of liquid (ellipse for 3D effect)
        ctx.beginPath();
        ctx.ellipse(beakerX + beakerW / 2, liquidY, beakerW / 2, 15, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
        ctx.fill();

        // Draw precipitate if saturated
        if (precipitatedMoles > 0) {
          ctx.fillStyle = `rgb(${currentSolute.color.join(',')})`;
          const numParticles = Math.min(100, precipitatedMoles * 50);
          for (let i = 0; i < numParticles; i++) {
            const px = beakerX + 10 + (Math.sin(i * 12.3) * 0.5 + 0.5) * (beakerW - 20);
            const py = beakerBottom - 2 - (Math.cos(i * 7.7) * 0.5 + 0.5) * 10;
            ctx.fillRect(px, py, 4, 4);
          }
        }
      }

      // Draw Beaker
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Left wall
      ctx.moveTo(beakerX, beakerY);
      ctx.lineTo(beakerX, beakerBottom);
      // Bottom
      ctx.lineTo(beakerX + beakerW, beakerBottom);
      // Right wall
      ctx.lineTo(beakerX + beakerW, beakerY);
      ctx.stroke();

      // Beaker markings
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('1/2 L', beakerX - 10, beakerBottom - 0.5 / maxVolume * beakerH * 0.8);
      ctx.beginPath();
      ctx.moveTo(beakerX, beakerBottom - 0.5 / maxVolume * beakerH * 0.8);
      ctx.lineTo(beakerX + 20, beakerBottom - 0.5 / maxVolume * beakerH * 0.8);
      ctx.stroke();

      // Tap lines
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(beakerX - 80, beakerY - 50, 100, 20); // water tap pipe
      ctx.fillRect(beakerX + beakerW, beakerBottom - 20, 40, 20); // drain tap pipe
    };
    let animationId;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [volume, displayConcentration, currentSolute, precipitatedMoles]);

  // Evaporation effect
  useEffect(() => {
    let interval;
    if (isEvaporating && volume > 0) {
      interval = setInterval(() => {
        setVolume(v => Math.max(0, v - 0.005));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isEvaporating, volume]);
  const addSolute = () => {
    if (soluteForm === 'solid') {
      setMoles(m => m + 0.1);
    } else {
      if (volume < maxVolume) {
        setVolume(v => Math.min(maxVolume, v + 0.05));
        setMoles(m => m + 0.05 * currentSolute.maxConcentration);
      }
    }
  };
  const addWater = () => {
    setVolume(v => Math.min(maxVolume, v + 0.05));
  };
  const removeLiquid = () => {
    setVolume(v => {
      const newV = Math.max(0, v - 0.05);
      if (v > 0) {
        const fraction = newV / v;
        setMoles(m => m * fraction);
      }
      return newV;
    });
  };
  const removeSoluteOnly = () => {
    setMoles(0);
    setVolume(0);
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
          />
          
          <div style={{ position: 'absolute', right: '40px', top: '20px', bottom: '20px', width: '340px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  <Settings2 size={20} color="rgba(255,255,255,0.7)" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Controls</h3>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1.2px', fontSize: '0.85rem' }}>Solute</label>
                  <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', marginBottom: '12px', fontSize: '1rem', outline: 'none', cursor: 'pointer', appearance: 'none' }} value={solute} onChange={e => setSolute(e.target.value)}>
                    {Object.entries(solutes).map(([key, sol]) => <option key={key} value={key} style={{ color: '#000' }}>{sol.name}</option>)}
                  </select>
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="radio" name="soluteForm" value="solid" checked={soluteForm === 'solid'} onChange={() => setSoluteForm('solid')} style={{ accentColor: '#ff6b6b' }} />
                          Solid
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="radio" name="soluteForm" value="liquid" checked={soluteForm === 'liquid'} onChange={() => setSoluteForm('liquid')} style={{ accentColor: '#ff6b6b' }} />
                          Liquid
                      </label>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.95rem' }}>Add Solute (Moles):</span>
                    <input type="range" min="0" max="2" step="0.05" value={moles} onChange={e => setMoles(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ff6b6b', cursor: 'pointer' }} />
                    <div style={{ textAlign: 'right', fontSize: '0.95rem', color: '#c8d6e5', fontWeight: '500' }}>{moles.toFixed(2)} mol</div>
                  </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1.2px', fontSize: '0.85rem' }}>Solution</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.95rem' }}>Volume:</span>
                      <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ff6b6b', cursor: 'pointer' }} />
                      <div style={{ textAlign: 'right', fontSize: '0.95rem', color: '#c8d6e5', fontWeight: '500' }}>{volume.toFixed(2)} L</div>
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: '500' }}>
                    <input type="checkbox" checked={isEvaporating} onChange={e => setIsEvaporating(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: '#ff6b6b' }} />
                    Evaporate
                  </label>
              </div>
          </div>
      </div>
  </div>
  );
};
