import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
const COLORS = {
  H: {
    fill: '#ffffff',
    stroke: '#cbd5e1',
    text: '#334155'
  },
  O: {
    fill: '#ef4444',
    stroke: '#b91c1c',
    text: '#ffffff'
  },
  C: {
    fill: '#334155',
    stroke: '#0f172a',
    text: '#ffffff'
  }
};
const RADII = {
  H: 20,
  O: 30,
  C: 35
};
const BINS = [{
  type: 'H',
  label: 'Hydrogen'
}, {
  type: 'O',
  label: 'Oxygen'
}, {
  type: 'C',
  label: 'Carbon'
}];
export default function CustomBuildAMolecule() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({
    width: 800,
    height: 600
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [atoms, setAtoms] = useState([]);
  const [targetMolecules, setTargetMolecules] = useState([{
    name: 'Water (H2O)',
    formula: {
      H: 2,
      O: 1
    },
    completed: false
  }, {
    name: 'Carbon Dioxide (CO2)',
    formula: {
      C: 1,
      O: 2
    },
    completed: false
  }, {
    name: 'Oxygen Gas (O2)',
    formula: {
      O: 2
    },
    completed: false
  }]);
  const engineState = useRef({
    atoms: [],
    draggingId: null,
    dragOffset: {
      x: 0,
      y: 0
    },
    width: 0,
    height: 0,
    bins: []
  });
  useEffect(() => {
    engineState.current.atoms = atoms;
  }, [atoms]);
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          setCanvasSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
          engineState.current.width = entry.contentRect.width;
          engineState.current.height = entry.contentRect.height;
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  const drawAtom = (ctx, x, y, type, isHighlight = false) => {
    const color = COLORS[type];
    const radius = RADII[type];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 10, x, y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, color.fill);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = isHighlight ? '#60a5fa' : color.stroke;
    ctx.lineWidth = isHighlight ? 4 : 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - radius / 3, y - radius / 3, radius / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    ctx.fillStyle = color.text;
    ctx.font = `bold ${radius}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, x, y);
  };
  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < width; i += 40) ctx.fillRect(i, 0, 1, height);
    for (let i = 0; i < height; i += 40) ctx.fillRect(0, i, width, 1);
    const binHeight = 120;
    const binY = height - binHeight;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, binY, width, binHeight);
    ctx.beginPath();
    ctx.moveTo(0, binY);
    ctx.lineTo(width, binY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const numBins = BINS.length;
    const binWidth = width / numBins;
    engineState.current.bins = BINS.map((b, i) => ({
      ...b,
      x: binWidth * i + binWidth / 2,
      y: binY + binHeight / 2,
      radius: RADII[b.type] + 10
    }));
    engineState.current.bins.forEach(bin => {
      ctx.beginPath();
      ctx.arc(bin.x, bin.y, bin.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawAtom(ctx, bin.x, bin.y, bin.type);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(bin.label, bin.x, bin.y + bin.radius + 8);
    });
    const {
      atoms: currentAtoms
    } = engineState.current;
    const drawnBonds = new Set();
    currentAtoms.forEach(atom => {
      if (atom.bonds) {
        atom.bonds.forEach(targetId => {
          const bondKey = [atom.id, targetId].sort().join('-');
          if (!drawnBonds.has(bondKey)) {
            drawnBonds.add(bondKey);
            const target = currentAtoms.find(a => a.id === targetId);
            if (target) {
              ctx.beginPath();
              ctx.moveTo(atom.x, atom.y);
              ctx.lineTo(target.x, target.y);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.lineWidth = 6;
              ctx.stroke();
            }
          }
        });
      }
    });
    currentAtoms.forEach(atom => {
      drawAtom(ctx, atom.x, atom.y, atom.type, atom.id === engineState.current.draggingId);
    });
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const renderLoop = () => {
      draw(ctx, canvasSize.width, canvasSize.height);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasSize]);
  const getMousePos = e => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  const getMolecule = (startId, allAtoms) => {
    const visited = new Set();
    const queue = [startId];
    while (queue.length > 0) {
      const curr = queue.shift();
      if (!visited.has(curr)) {
        visited.add(curr);
        const atom = allAtoms.find(a => a.id === curr);
        if (atom && atom.bonds) {
          atom.bonds.forEach(b => {
            if (!visited.has(b)) queue.push(b);
          });
        }
      }
    }
    return Array.from(visited);
  };
  const handleMouseDown = e => {
    const {
      x,
      y
    } = getMousePos(e);
    const state = engineState.current;
    for (let i = state.atoms.length - 1; i >= 0; i--) {
      const atom = state.atoms[i];
      const dx = x - atom.x;
      const dy = y - atom.y;
      if (dx * dx + dy * dy <= RADII[atom.type] * RADII[atom.type]) {
        state.draggingId = atom.id;
        state.dragOffset = {
          x: dx,
          y: dy
        };
        const newAtoms = [...state.atoms];
        newAtoms.splice(i, 1);
        newAtoms.push(atom);
        setAtoms(newAtoms);
        return;
      }
    }
    for (const bin of state.bins) {
      const dx = x - bin.x;
      const dy = y - bin.y;
      if (dx * dx + dy * dy <= bin.radius * bin.radius) {
        const newAtom = {
          id: Math.random().toString(36).substr(2, 9),
          type: bin.type,
          x: x,
          y: y,
          bonds: []
        };
        state.draggingId = newAtom.id;
        state.dragOffset = {
          x: 0,
          y: 0
        };
        setAtoms(prev => [...prev, newAtom]);
        return;
      }
    }
  };
  const handleMouseMove = e => {
    if (!engineState.current.draggingId) return;
    const {
      x,
      y
    } = getMousePos(e);
    const state = engineState.current;
    setAtoms(prevAtoms => {
      const dragAtom = prevAtoms.find(a => a.id === state.draggingId);
      if (!dragAtom) return prevAtoms;
      const moleculeIds = getMolecule(state.draggingId, prevAtoms);
      const newX = x - state.dragOffset.x;
      const newY = y - state.dragOffset.y;
      const dx = newX - dragAtom.x;
      const dy = newY - dragAtom.y;
      return prevAtoms.map(a => {
        if (moleculeIds.includes(a.id)) {
          return {
            ...a,
            x: a.x + dx,
            y: a.y + dy
          };
        }
        return a;
      });
    });
  };
  const checkCompletion = currentAtoms => {
    const unvisited = new Set(currentAtoms.map(a => a.id));
    const molecules = [];
    while (unvisited.size > 0) {
      const startId = unvisited.values().next().value;
      const moleculeIds = getMolecule(startId, currentAtoms);
      const composition = {};
      moleculeIds.forEach(id => {
        unvisited.delete(id);
        const atom = currentAtoms.find(a => a.id === id);
        composition[atom.type] = (composition[atom.type] || 0) + 1;
      });
      molecules.push(composition);
    }
    setTargetMolecules(prev => prev.map(target => {
      const isCompleted = molecules.some(comp => {
        const targetKeys = Object.keys(target.formula);
        const compKeys = Object.keys(comp);
        if (targetKeys.length !== compKeys.length) return false;
        for (const key of targetKeys) {
          if (target.formula[key] !== comp[key]) return false;
        }
        return true;
      });
      return {
        ...target,
        completed: isCompleted
      };
    }));
  };
  const handleMouseUp = e => {
    if (!engineState.current.draggingId) return;
    const state = engineState.current;
    setAtoms(prevAtoms => {
      let updatedAtoms = [...prevAtoms];
      const dragAtom = updatedAtoms.find(a => a.id === state.draggingId);
      if (!dragAtom) {
        state.draggingId = null;
        return updatedAtoms;
      }
      const binY = state.height - 120;
      if (dragAtom.y > binY) {
        const moleculeIds = getMolecule(dragAtom.id, updatedAtoms);
        updatedAtoms = updatedAtoms.filter(a => !moleculeIds.includes(a.id));
        updatedAtoms = updatedAtoms.map(a => ({
          ...a,
          bonds: a.bonds.filter(b => !moleculeIds.includes(b))
        }));
      } else {
        const SNAP_DIST = 90;
        for (const other of updatedAtoms) {
          if (other.id === dragAtom.id) continue;
          const dx = other.x - dragAtom.x;
          const dy = other.y - dragAtom.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < SNAP_DIST * SNAP_DIST) {
            if (!dragAtom.bonds.includes(other.id)) {
              dragAtom.bonds.push(other.id);
              other.bonds.push(dragAtom.id);
              const dist = Math.sqrt(distSq);
              const targetDist = RADII[dragAtom.type] + RADII[other.type] + 10;
              if (dist > 10) {
                const pullForce = (dist - targetDist) / 2;
                dragAtom.x += dx / dist * pullForce;
                dragAtom.y += dy / dist * pullForce;
              }
              break;
            }
          }
        }
      }
      setTimeout(() => checkCompletion(updatedAtoms), 0);
      return updatedAtoms;
    });
    state.draggingId = null;
  };
  const handleClear = () => {
    setAtoms([]);
    setTargetMolecules(prev => prev.map(t => ({
      ...t,
      completed: false
    })));
  };
  const handleBreakBonds = () => {
    setAtoms(prev => prev.map(a => ({
      ...a,
      bonds: []
    })));
    setTimeout(() => checkCompletion(atoms.map(a => ({
      ...a,
      bonds: []
    }))), 0);
  };
  const resetSimulation = () => {
    handleClear();
    setIsPlaying(true);
  };
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
                <button onClick={resetSimulation} style={{
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
        cursor: engineState.current.draggingId ? 'grabbing' : 'grab',
        objectFit: "contain"
      }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
            
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
          gap: '12px'
        }}>
                    <h4 style={{
            margin: 0,
            fontSize: '14px',
            color: '#e2e8f0'
          }}>Goals</h4>
                    {targetMolecules.map((mol, idx) => <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: mol.completed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${mol.completed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
          }}>
                        <span style={{
              fontSize: '14px',
              color: mol.completed ? '#4ade80' : '#cbd5e1'
            }}>{mol.name}</span>
                        {mol.completed && <span style={{
              backgroundColor: '#22c55e',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>✓</span>}
                      </div>)}
                </div>

                <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '16px'
        }}>
                    <button onClick={handleBreakBonds} style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
                      Break All Bonds
                    </button>
                    <button onClick={handleClear} style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
                      Clear Workspace
                    </button>
                    <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '8px',
            lineHeight: '1.5'
          }}>
                      <strong>Instructions:</strong> Drag atoms from the bins at the bottom onto the canvas. Bring atoms close together to form bonds. Drag a bonded molecule to the bin area to delete it.
                    </p>
                </div>
            </div>
        </div>
    </div>;
}