import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
const ELEMENTS = [{
  z: 0,
  symbol: '',
  name: 'Empty'
}, {
  z: 1,
  symbol: 'H',
  name: 'Hydrogen'
}, {
  z: 2,
  symbol: 'He',
  name: 'Helium'
}, {
  z: 3,
  symbol: 'Li',
  name: 'Lithium'
}, {
  z: 4,
  symbol: 'Be',
  name: 'Beryllium'
}, {
  z: 5,
  symbol: 'B',
  name: 'Boron'
}, {
  z: 6,
  symbol: 'C',
  name: 'Carbon'
}, {
  z: 7,
  symbol: 'N',
  name: 'Nitrogen'
}, {
  z: 8,
  symbol: 'O',
  name: 'Oxygen'
}, {
  z: 9,
  symbol: 'F',
  name: 'Fluorine'
}, {
  z: 10,
  symbol: 'Ne',
  name: 'Neon'
}];
const checkStability = (p, n) => {
  if (p === 0) return n === 0;
  if (p === 1) return n >= 0 && n <= 1;
  if (p === 2) return n === 1 || n === 2;
  if (p === 3) return n === 3 || n === 4;
  if (p === 4) return n === 5;
  if (p === 5) return n === 5 || n === 6;
  if (p === 6) return n === 6 || n === 7;
  if (p === 7) return n === 7 || n === 8;
  if (p === 8) return n >= 8 && n <= 10;
  if (p === 9) return n === 10;
  if (p === 10) return n >= 10 && n <= 12;
  return false; // Very simplified
};
export default function CustomBuildAnAtom({
  onBack,
  title = "Build an Atom", isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  const canvasRef = useRef(null);
  const [protons, setProtons] = useState(0);
  const [neutrons, setNeutrons] = useState(0);
  const [electrons, setElectrons] = useState(0);
  const [showStable, setShowStable] = useState(true);

  // Particles state for rendering
  const particlesRef = useRef([]);
  const dragInfoRef = useRef({
    isDragging: false,
    particleIndex: -1,
    type: null
  });

  // Physics / Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const render = () => {
    if (!isPlayingRef.current) {
      requestAnimationFrame(render);
      return;
    }
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 50;

      // Draw Orbits
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Nucleus Boundary (visual cue)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Particle Buckets
      ctx.fillStyle = 'rgba(255, 0, 85, 0.8)';
      ctx.beginPath();
      ctx.arc(150, canvas.height - 60, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 20px Inter';
      ctx.fillText('+', 150, canvas.height - 60);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '14px Inter';
      ctx.fillText('Proton', 150, canvas.height - 25);
      ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height - 60, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('Neutron', canvas.width / 2, canvas.height - 25);
      ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(canvas.width - 150, canvas.height - 60, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Inter';
      ctx.fillText('-', canvas.width - 150, canvas.height - 60);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '14px Inter';
      ctx.fillText('Electron', canvas.width - 150, canvas.height - 25);

      // Draw all active particles
      const time = Date.now() / 1000;
      particlesRef.current.forEach((p, idx) => {
        let x = p.x;
        let y = p.y;

        // If not dragging, animate their positions naturally
        if (!dragInfoRef.current.isDragging || dragInfoRef.current.particleIndex !== idx) {
          if (p.type === 'proton' || p.type === 'neutron') {
            // Jiggle in nucleus
            if (p.inNucleus) {
              const angle = p.nucleusAngle + time * 2;
              x = cx + Math.cos(angle) * p.nucleusRadius;
              y = cy + Math.sin(angle) * p.nucleusRadius;
              p.x += (x - p.x) * 0.1;
              p.y += (y - p.y) * 0.1;
            }
          } else if (p.type === 'electron') {
            if (p.inOrbit) {
              const radius = p.orbitLevel === 1 ? 60 : 120;
              const speed = p.orbitLevel === 1 ? 1.5 : 1.0;
              const angle = p.orbitAngle + time * speed;
              x = cx + Math.cos(angle) * radius;
              y = cy + Math.sin(angle) * radius;
              p.x += (x - p.x) * 0.1;
              p.y += (y - p.y) * 0.1;
            }
          }
        }
        ctx.beginPath();
        if (p.type === 'proton') {
          ctx.fillStyle = 'rgba(255, 0, 85, 0.9)';
          ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.fillText('+', p.x, p.y);
        } else if (p.type === 'neutron') {
          ctx.fillStyle = 'rgba(120, 120, 120, 0.9)';
          ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'electron') {
          ctx.fillStyle = 'rgba(0, 150, 255, 0.9)';
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.fillText('-', p.x, p.y);
        }
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Sync state with particlesRef to ensure consistency when adding from buttons
  useEffect(() => {
    let currentProtons = particlesRef.current.filter(p => p.type === 'proton' && p.inNucleus).length;
    let currentNeutrons = particlesRef.current.filter(p => p.type === 'neutron' && p.inNucleus).length;
    let currentElectrons = particlesRef.current.filter(p => p.type === 'electron' && p.inOrbit).length;
    setProtons(currentProtons);
    setNeutrons(currentNeutrons);
    setElectrons(currentElectrons);
  }, [particlesRef.current.length]); // Trigger when particles change

  const handlePointerDown = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check buckets
    if (Math.hypot(x - 150, y - (canvasRef.current.height - 60)) < 30) {
      startDraggingNew('proton', x, y);
      return;
    }
    if (Math.hypot(x - canvasRef.current.width / 2, y - (canvasRef.current.height - 60)) < 30) {
      startDraggingNew('neutron', x, y);
      return;
    }
    if (Math.hypot(x - (canvasRef.current.width - 150), y - (canvasRef.current.height - 60)) < 30) {
      startDraggingNew('electron', x, y);
      return;
    }

    // Check existing particles (in reverse so top ones are clicked first)
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      if (Math.hypot(x - p.x, y - p.y) < 15) {
        dragInfoRef.current = {
          isDragging: true,
          particleIndex: i,
          type: p.type
        };
        p.inNucleus = false;
        p.inOrbit = false;
        recountParticles();
        return;
      }
    }
  };
  const startDraggingNew = (type, x, y) => {
    const p = {
      type,
      x,
      y,
      inNucleus: false,
      inOrbit: false,
      nucleusAngle: Math.random() * Math.PI * 2,
      nucleusRadius: Math.random() * 15,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitLevel: 1
    };
    particlesRef.current.push(p);
    dragInfoRef.current = {
      isDragging: true,
      particleIndex: particlesRef.current.length - 1,
      type
    };
  };
  const handlePointerMove = e => {
    if (!dragInfoRef.current.isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const idx = dragInfoRef.current.particleIndex;
    if (idx >= 0 && idx < particlesRef.current.length) {
      particlesRef.current[idx].x = x;
      particlesRef.current[idx].y = y;
    }
  };
  const handlePointerUp = e => {
    if (!dragInfoRef.current.isDragging) return;
    const idx = dragInfoRef.current.particleIndex;
    if (idx < 0) return;
    const p = particlesRef.current[idx];
    const cx = canvasRef.current.width / 2;
    const cy = canvasRef.current.height / 2 - 50;
    const dist = Math.hypot(p.x - cx, p.y - cy);
    if (p.type === 'proton' || p.type === 'neutron') {
      if (dist < 40) {
        p.inNucleus = true;
      } else {
        particlesRef.current.splice(idx, 1);
      }
    } else if (p.type === 'electron') {
      if (dist < 150) {
        p.inOrbit = true;
        p.orbitLevel = dist < 90 ? 1 : 2;

        // Check capacity (2 in first shell, 8 in second)
        const electronsInShell1 = particlesRef.current.filter(e => e.type === 'electron' && e.inOrbit && e.orbitLevel === 1).length;
        const electronsInShell2 = particlesRef.current.filter(e => e.type === 'electron' && e.inOrbit && e.orbitLevel === 2).length;
        if (p.orbitLevel === 1 && electronsInShell1 > 2) {
          p.orbitLevel = 2; // push to shell 2
        }
        if (p.orbitLevel === 2 && electronsInShell2 > 8) {
          particlesRef.current.splice(idx, 1); // remove if full (simplified)
        }
      } else {
        particlesRef.current.splice(idx, 1);
      }
    }
    dragInfoRef.current = {
      isDragging: false,
      particleIndex: -1,
      type: null
    };
    recountParticles();
  };
  const recountParticles = () => {
    let pCount = 0,
      nCount = 0,
      eCount = 0;
    particlesRef.current.forEach(p => {
      if (p.type === 'proton' && p.inNucleus) pCount++;
      if (p.type === 'neutron' && p.inNucleus) nCount++;
      if (p.type === 'electron' && p.inOrbit) eCount++;
    });
    setProtons(pCount);
    setNeutrons(nCount);
    setElectrons(eCount);
  };
  const currentElement = ELEMENTS.find(e => e.z === protons) || {
    z: protons,
    symbol: '?',
    name: 'Unknown'
  };
  const massNumber = protons + neutrons;
  const netCharge = protons - electrons;
  const isStable = checkStability(protons, neutrons);
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: '#0a0a1a',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif"
  };
  const topBarStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 2rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)'
  };
  const mainAreaStyle = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  };
  const canvasContainerStyle = {
    flex: 2,
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at center, #1a1a3a 0%, #0a0a1a 100%)'
  };
  const controlsStyle = {
    flex: 1,
    padding: '2rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    overflowY: 'auto'
  };
  const glassBox = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)'
  };
  const periodicTileStyle = {
    width: '120px',
    height: '140px',
    margin: '0 auto',
    border: `2px solid ${protons === 0 ? '#444' : isStable ? '#00ff88' : '#ff3366'}`,
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: protons === 0 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    boxShadow: protons !== 0 ? `0 0 20px ${isStable ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)'}` : 'none'
  };
  return <div style={containerStyle}>
      <div style={topBarStyle}>
        
        
      </div>

      <div style={mainAreaStyle}>
        <div style={canvasContainerStyle}>
          <canvas ref={canvasRef} width={800} height={600} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} style={{
          touchAction: 'none',
          cursor: 'grab',
          width: "100%",
          height: "100%",
          objectFit: "contain"
        }} />
          {protons > 0 && showStable && <div style={{
          position: 'absolute',
          top: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isStable ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)',
          color: isStable ? '#00ff88' : '#ff3366',
          padding: '0.5rem 1.5rem',
          borderRadius: '20px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          border: `1px solid ${isStable ? '#00ff88' : '#ff3366'}`,
          animation: 'fadeIn 0.3s ease-out'
        }}>
              {isStable ? 'STABLE' : 'UNSTABLE'}
            </div>}
        </div>

        <div style={controlsStyle}>
          <div style={glassBox}>
            <div style={periodicTileStyle}>
              <span style={{
              fontSize: '1rem',
              opacity: 0.8
            }}>{protons}</span>
              <h2 style={{
              fontSize: '3rem',
              margin: '0.5rem 0',
              fontWeight: '800',
              color: '#fff'
            }}>{currentElement.symbol}</h2>
              <span style={{
              fontSize: '1rem',
              opacity: 0.8
            }}>{currentElement.name}</span>
            </div>
            <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            fontSize: '1.2rem'
          }}>
              <span style={{
              color: netCharge > 0 ? '#ff3366' : netCharge < 0 ? '#00ccff' : '#00ff88'
            }}>
                {netCharge > 0 ? `+${netCharge} Ion` : netCharge < 0 ? `${netCharge} Ion` : 'Neutral Atom'}
              </span>
            </div>
          </div>

          <div style={glassBox}>
            <h3 style={{
            margin: '0 0 1rem 0',
            opacity: 0.8,
            fontSize: '1rem',
            textTransform: 'uppercase'
          }}>Properties</h3>
            
            <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1rem',
            alignItems: 'center'
          }}>
              <span>Protons <span style={{
                color: '#ff0055',
                fontSize: '0.8rem'
              }}>(Z)</span></span>
              <span style={{
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>{protons}</span>
            </div>
            <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255,0,85,0.2)',
            borderRadius: '2px',
            marginBottom: '1.5rem'
          }}>
                <div style={{
              width: `${Math.min(100, protons * 10)}%`,
              height: '100%',
              background: '#ff0055',
              borderRadius: '2px',
              transition: 'width 0.3s'
            }} />
            </div>

            <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1rem',
            alignItems: 'center'
          }}>
              <span>Neutrons <span style={{
                color: '#777',
                fontSize: '0.8rem'
              }}>(N)</span></span>
              <span style={{
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>{neutrons}</span>
            </div>
             <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(120,120,120,0.2)',
            borderRadius: '2px',
            marginBottom: '1.5rem'
          }}>
                <div style={{
              width: `${Math.min(100, neutrons * 10)}%`,
              height: '100%',
              background: '#777',
              borderRadius: '2px',
              transition: 'width 0.3s'
            }} />
            </div>

            <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1rem',
            alignItems: 'center'
          }}>
              <span>Electrons <span style={{
                color: '#0096ff',
                fontSize: '0.8rem'
              }}>(e⁻)</span></span>
              <span style={{
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>{electrons}</span>
            </div>
             <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(0,150,255,0.2)',
            borderRadius: '2px',
            marginBottom: '1.5rem'
          }}>
                <div style={{
              width: `${Math.min(100, electrons * 10)}%`,
              height: '100%',
              background: '#0096ff',
              borderRadius: '2px',
              transition: 'width 0.3s'
            }} />
            </div>
            
            <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '1rem'
          }}>
                <div>
                    <div style={{
                fontSize: '0.8rem',
                opacity: 0.6
              }}>Mass Number</div>
                    <div style={{
                fontSize: '1.8rem',
                fontWeight: 'bold'
              }}>{massNumber}</div>
                </div>
                <div style={{
              textAlign: 'right'
            }}>
                    <div style={{
                fontSize: '0.8rem',
                opacity: 0.6
              }}>Net Charge</div>
                    <div style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: netCharge === 0 ? '#fff' : netCharge > 0 ? '#ff3366' : '#0096ff'
              }}>
                        {netCharge > 0 ? `+${netCharge}` : netCharge}
                    </div>
                </div>
            </div>
          </div>

          <button onClick={() => setShowStable(!showStable)} style={{
          background: showStable ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '1rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}>
            {showStable ? 'Hide Stability Indicator' : 'Show Stability Indicator'}
          </button>
          
          <button onClick={() => {
          particlesRef.current = [];
          recountParticles();
        }} style={{
          background: 'rgba(255, 51, 102, 0.1)',
          border: '1px solid rgba(255, 51, 102, 0.4)',
          color: '#ff3366',
          padding: '1rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}>
            Reset Atom
          </button>

        </div>
      </div>
      
    </div>;
}