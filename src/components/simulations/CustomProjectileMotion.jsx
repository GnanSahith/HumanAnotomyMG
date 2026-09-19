import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind, Atom, ArrowLeft, Settings2 } from 'lucide-react';
export default function CustomProjectileMotion({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Core Physics Parameters
  const [velocity, setVelocity] = useState(15); // m/s
  const [angle, setAngle] = useState(45); // degrees
  const [gravity, setGravity] = useState(9.81); // m/s^2
  const [height, setHeight] = useState(0); // m
  const [targetDistance, setTargetDistance] = useState(25); // m

  // Advanced Physics Parameters
  const [mass, setMass] = useState(5); // kg
  const [diameter, setDiameter] = useState(0.5); // m
  const [airResistance, setAirResistance] = useState(false);
  const [dragCoefficient, setDragCoefficient] = useState(0.47); // Sphere

  // UI/Simulation Toggles
  const [slowMotion, setSlowMotion] = useState(false);
  const [showVelocity, setShowVelocity] = useState(false);
  const [showAcceleration, setShowAcceleration] = useState(false);

  // Engine State
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const requestRef = useRef(null);
  const lastPathPosRef = useRef({
    x: 0,
    y: 0
  });
  const posRef = useRef({
    x: 0,
    y: 0
  });
  const velRef = useRef({
    vx: 0,
    vy: 0
  });
  const accRef = useRef({
    ax: 0,
    ay: 0
  });

  // Visual State
  const [projectilePos, setProjectilePos] = useState({
    x: 0,
    y: 0
  });
  const [path, setPath] = useState([]);
  const [vectors, setVectors] = useState({
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0
  });
  const scale = 12; // pixels per meter

  const handleReset = () => {
    setIsPlaying(false);
    timeRef.current = 0;
    posRef.current = {
      x: 0,
      y: height
    };
    velRef.current = {
      vx: velocity * Math.cos(angle * Math.PI / 180),
      vy: velocity * Math.sin(angle * Math.PI / 180)
    };
    accRef.current = {
      ax: 0,
      ay: -gravity
    };
    setProjectilePos({
      x: 0,
      y: height * scale
    });
    setVectors({
      vx: velRef.current.vx,
      vy: velRef.current.vy,
      ax: 0,
      ay: -gravity
    });
    setPath([]);
    lastPathPosRef.current = {
      x: 0,
      y: height * scale
    };
  };

  // Update initial position when tweaking launch parameters before firing
  useEffect(() => {
    if (!isPlaying && timeRef.current === 0) {
      posRef.current = {
        x: 0,
        y: height
      };
      velRef.current = {
        vx: velocity * Math.cos(angle * Math.PI / 180),
        vy: velocity * Math.sin(angle * Math.PI / 180)
      };
      accRef.current = {
        ax: 0,
        ay: -gravity
      };
      const frameId = requestAnimationFrame(() => {
        setProjectilePos({
          x: 0,
          y: height * scale
        });
        setVectors({
          vx: velRef.current.vx,
          vy: velRef.current.vy,
          ax: 0,
          ay: -gravity
        });
        setPath([]);
        lastPathPosRef.current = {
          x: 0,
          y: height * scale
        };
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [velocity, angle, height, gravity, isPlaying]);
  const updatePhysicsRef = useRef();
  useEffect(() => {
    updatePhysicsRef.current = time => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(updatePhysicsRef.current);
        return;
      }
      const realDt = (time - lastTimeRef.current) / 1000;
      if (realDt <= 0) {
        requestRef.current = requestAnimationFrame(updatePhysicsRef.current);
        return;
      }
      lastTimeRef.current = time;
      const safeDt = Math.min(realDt, 0.1);
      const dt = slowMotion ? safeDt * 0.4 : safeDt * 1.5;
      timeRef.current += dt;

      // Sub-step Euler integration for stability with high drag forces
      const steps = 4;
      const subDt = dt / steps;
      for (let i = 0; i < steps; i++) {
        let ax = 0;
        let ay = -gravity;
        if (airResistance) {
          const rho = 1.225; // Sea level air density
          const r_m = diameter / 2;
          const A = Math.PI * r_m * r_m;
          const v_mag = Math.hypot(velRef.current.vx, velRef.current.vy);
          if (v_mag > 0.01) {
            const F_drag = 0.5 * rho * v_mag * v_mag * dragCoefficient * A;
            const a_drag = F_drag / mass;
            ax = -a_drag * (velRef.current.vx / v_mag);
            ay -= a_drag * (velRef.current.vy / v_mag);
          }
        }
        velRef.current.vx += ax * subDt;
        velRef.current.vy += ay * subDt;
        posRef.current.x += velRef.current.vx * subDt;
        posRef.current.y += velRef.current.vy * subDt;
        accRef.current = {
          ax,
          ay
        };
        if (posRef.current.y <= 0 && timeRef.current > 0.1) {
          posRef.current.y = 0;
          break;
        }
      }
      const visualX = posRef.current.x * scale;
      const visualY = posRef.current.y * scale;
      setProjectilePos({
        x: visualX,
        y: visualY
      });
      setVectors({
        vx: velRef.current.vx,
        vy: velRef.current.vy,
        ax: accRef.current.ax,
        ay: accRef.current.ay
      });

      // Record path
      const dx = visualX - lastPathPosRef.current.x;
      const dy = visualY - lastPathPosRef.current.y;
      if (dx * dx + dy * dy > 1600) {
        lastPathPosRef.current = {
          x: visualX,
          y: visualY
        };
        setPath(prev => [...prev, {
          x: visualX,
          y: visualY
        }]);
      }
      if (posRef.current.y <= 0 && timeRef.current > 0.1) {
        setIsPlaying(false);
        return;
      }
      requestRef.current = requestAnimationFrame(updatePhysicsRef.current);
    };
  });
  useEffect(() => {
    if (isPlaying) {
      if (posRef.current.y <= 0 && timeRef.current > 0.1) {
        timeRef.current = 0;
        posRef.current = { x: 0, y: height };
        velRef.current = { 
            vx: velocity * Math.cos(angle * Math.PI / 180), 
            vy: velocity * Math.sin(angle * Math.PI / 180) 
        };
        accRef.current = { ax: 0, ay: -gravity };
        setPath([]);
        lastPathPosRef.current = { x: 0, y: height * scale };
        setProjectilePos({ x: 0, y: height * scale });
        setVectors({ vx: velRef.current.vx, vy: velRef.current.vy, ax: 0, ay: -gravity });
      }
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(updatePhysicsRef.current);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, height, velocity, angle, gravity, scale]);

  // Render Helpers for Vectors
  const renderVector = (startX, startY, compX, compY, color, scaleFactor) => {
    const vX = compX * scaleFactor;
    const vY = -compY * scaleFactor; // Invert Y for SVG
    if (Math.hypot(vX, vY) < 1) return null;
    const markerId = color === '#00f0ff' ? 'cyan' : 'red';
    return <g>
                <line x1={startX} y1={startY} x2={startX + vX} y2={startY + vY} stroke={color} strokeWidth="6" markerEnd={`url(#arrowhead-${markerId})`} />
            </g>;
  };
  
  const handleRefreshTarget = () => {
    setTargetDistance(Math.floor(Math.random() * 60) + 10);
  };

  const currentRange = Math.max(0, projectilePos.x / scale).toFixed(1);

  return <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    background: '#0a0a1a',
    overflow: 'hidden',
    color: '#fff',
    fontFamily: "'Inter', sans-serif"
  }}>
    {/* LEFT PANEL (15%) - Formula Area */}
    <div style={{ width: '15%', height: '100%', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(20,20,30,0.9)', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#3498db' }}>A Brief About Projectile Motion</h3>
        <button 
          title="Projectile motion is the motion of an object that is thrown or projected into the air and then moves under the influence of gravity alone, neglecting air resistance." 
          style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#fff', fontSize: '16px' }}
        >ℹ️</button>
      </div>
      <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.4, marginBottom: '20px' }}>
        In projectile motion, the object follows a curved path called a trajectory, which is typically parabolic when air resistance is ignored.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff' }}>Formula</h4>
        <div style={{ background: '#000', padding: '15px 10px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', overflowX: 'auto', fontFamily: 'monospace' }}>
          y = h + x tan(θ) - (gx²) / (2u² cos²θ)
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff' }}>Simulated Formula</h4>
        <div style={{ background: '#000', padding: '15px 10px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          y = {height} + x tan({angle}°) - ({gravity}x²) / (2({velocity}²) cos²{angle}°)
        </div>
      </div>
    </div>

    {/* CENTER PANEL (70%) - Simulation Area */}
    <div style={{ width: '70%', height: '100%', position: 'relative' }}>
      {/* Top Left Controls */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>{title || 'Projectile Motion'}</h2>
          <div style={{ fontSize: '14px', color: '#888' }}>Time: {timeRef.current.toFixed(2)}s</div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, display: 'flex', gap: '10px' }}>
        <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: isPlaying ? 'rgba(231,76,60,0.2)' : 'rgba(46,204,113,0.2)', color: isPlaying ? '#e74c3c' : '#2ecc71', border: `1px solid ${isPlaying ? '#e74c3c' : '#2ecc71'}`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Launch</>}
        </button>
        <button onClick={() => {
          setIsPlaying(false);
          timeRef.current = 0;
          setProjectilePos({ x: 0, y: 0 });
          setPath([]);
          setVectors({ vx: velocity * Math.cos(angle * Math.PI / 180), vy: velocity * Math.sin(angle * Math.PI / 180), ax: 0, ay: -gravity });
          posRef.current = { x: 0, y: 0 };
          velRef.current = { vx: velocity * Math.cos(angle * Math.PI / 180), vy: velocity * Math.sin(angle * Math.PI / 180) };
          handleRefreshTarget();
        }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <RotateCcw size={18} /> Reset & New Target
        </button>
      </div>
      
      {/* Simulation Distances Readout */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: '#fff', marginBottom: '8px' }}><strong>Ball Drop Distance:</strong> {currentRange} m</div>
        <div style={{ color: '#ff375f' }}><strong>Target Distance:</strong> {targetDistance} m</div>
      </div>

      <svg viewBox="-400 -1050 2800 1300" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <radialGradient id="projectileGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffd23f" />
            <stop offset="100%" stopColor="#ff9f0a" />
          </radialGradient>
          <marker id="arrowhead-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#00f0ff" /></marker>
          <marker id="arrowhead-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="#ff375f" /></marker>
          <pattern id="svgGrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" /></pattern>
        </defs>

        <clipPath id="simBoxClip"><rect x="-400" y="-1050" width="2800" height="1300" rx="24" /></clipPath>
        <g clipPath="url(#simBoxClip)">
          <rect x="-400" y="-1050" width="2800" height="1050" fill="#151522" />
          <rect x="-400" y="-1050" width="2800" height="1050" fill="url(#svgGrid)" />
          <rect x="-400" y="0" width="2800" height="250" fill="#132e1b" />
          <line x1="-400" y1="0" x2="2400" y2="0" stroke="#30d158" strokeWidth="6" />
        </g>

        <rect x="-400" y="-1050" width="2800" height="1300" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" rx="24" />
        
        {/* Target */}
        <ellipse cx={targetDistance * scale} cy="0" rx="30" ry="10" fill="rgba(255,55,95,0.3)" stroke="#ff375f" strokeWidth="4" />
        <ellipse cx={targetDistance * scale} cy="0" rx="10" ry="3" fill="#ff375f" />
        
        {/* Distance Line */}
        <line x1="0" y1="50" x2={targetDistance * scale} y2="50" stroke="#ff375f" strokeWidth="4" strokeDasharray="10 10" />
        <text x={(targetDistance * scale) / 2} y="90" fill="#ff375f" fontSize="30" textAnchor="middle">{targetDistance}m</text>

        {/* Pedestal */}
        {height > 0 && <rect x="-40" y={-(height * scale)} width="80" height={height * scale} fill="rgba(255,255,255,0.15)" rx="4" />}

        {/* Height Label */}
        <text x="-60" y={-(height * scale) / 2} fill="#fff" fontSize="30" textAnchor="end">H: {height}m</text>
        
        {/* Launcher */}
        <g transform={`translate(0, ${-(height * scale)}) rotate(${-angle})`}>
          <rect x="-30" y="-30" width="130" height="60" fill="rgba(255,255,255,0.1)" rx="12" />
          <circle cx="0" cy="0" r="38" fill="var(--accent)" />
          {/* Angle Label inside launcher */}
          <text x="0" y="10" fill="#fff" fontSize="24" textAnchor="middle" transform={`rotate(${angle})`}>{angle}°</text>
        </g>
        {/* Angle Label near launcher */}
        <text x="60" y={-(height * scale) - 60} fill="#f1c40f" fontSize="30">Angle: {angle}°</text>

        {/* Trail */}
        {path.map((p, i) => {
          const progress = i / path.length;
          return <g key={i}>
            <circle cx={p.x} cy={-p.y} r="24" fill={`rgba(0, 240, 255, ${0.05 + progress * 0.25})`} />
            <circle cx={p.x} cy={-p.y} r="6" fill={`rgba(255, 255, 255, ${0.2 + progress * 0.8})`} />
          </g>;
        })}
        
        {/* Vectors */}
        {showVelocity && renderVector(projectilePos.x, -projectilePos.y, vectors.vx, vectors.vy, '#00f0ff', 4)}
        {showAcceleration && renderVector(projectilePos.x, -projectilePos.y, vectors.ax, vectors.ay, '#ff375f', 12)}

        {/* Projectile */}
        <circle cx={projectilePos.x} cy={-projectilePos.y} r={Math.max(20, diameter * 50)} fill="url(#projectileGradient)" filter="drop-shadow(0 0 10px rgba(255,159,10,0.6))" />
        <circle cx={projectilePos.x - 8} cy={-projectilePos.y - 8} r="8" fill="rgba(255,255,255,0.6)" />
      </svg>
    </div>

    {/* RIGHT PANEL (15%) - Parameters Area */}
    <div style={{ width: '15%', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(20,20,30,0.9)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <Settings2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Parameters
      </h3>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Initial Velocity</label>
          <span style={{ fontSize: '12px', color: '#00f0ff', fontWeight: 700 }}>{velocity} m/s</span>
        </div>
        <input type="range" min="0" max="40" step="1" value={velocity} onChange={e => setVelocity(Number(e.target.value))} style={{ width: '100%', accentColor: '#00f0ff' }} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Launch Angle</label>
          <span style={{ fontSize: '12px', color: '#ff9f0a', fontWeight: 700 }}>{angle}°</span>
        </div>
        <input type="range" min="0" max="90" step="1" value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff9f0a' }} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Cannon Height</label>
          <span style={{ fontSize: '12px', color: '#a29bfe', fontWeight: 700 }}>{height} m</span>
        </div>
        <input type="range" min="0" max="20" step="1" value={height} onChange={e => setHeight(Number(e.target.value))} style={{ width: '100%', accentColor: '#a29bfe' }} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Gravity (g)</label>
          <span style={{ fontSize: '12px', color: '#ff375f', fontWeight: 700 }}>{gravity} m/s²</span>
        </div>
        <input type="range" min="1" max="25" step="0.1" value={gravity} onChange={e => setGravity(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff375f' }} />
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Projectile Mass</label>
          <span style={{ fontSize: '12px', color: '#3498db', fontWeight: 700 }}>{mass} kg</span>
        </div>
        <input type="range" min="0.1" max="10" step="0.1" value={mass} onChange={e => setMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#3498db' }} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
        <input type="checkbox" checked={airResistance} onChange={e => setAirResistance(e.target.checked)} style={{ accentColor: '#2ecc71', width: '16px', height: '16px' }} />
        <span style={{ color: airResistance ? '#2ecc71' : '#aaa' }}><Wind size={14} style={{ verticalAlign: 'middle' }} /> Air Resistance</span>
      </label>

      {airResistance && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Drag Coefficient</label>
            <span style={{ fontSize: '12px', color: '#2ecc71', fontWeight: 700 }}>{dragCoefficient.toFixed(2)}</span>
          </div>
          <input type="range" min="0.1" max="1.5" step="0.01" value={dragCoefficient} onChange={e => setDragCoefficient(Number(e.target.value))} style={{ width: '100%', accentColor: '#2ecc71' }} />
        </div>
      )}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
        <input type="checkbox" checked={showVelocity} onChange={e => setShowVelocity(e.target.checked)} style={{ accentColor: '#00f0ff', width: '16px', height: '16px' }} />
        Velocity Vectors
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
        <input type="checkbox" checked={showAcceleration} onChange={e => setShowAcceleration(e.target.checked)} style={{ accentColor: '#ff375f', width: '16px', height: '16px' }} />
        Acceleration Vectors
      </label>
    </div>
  </div>;
}
