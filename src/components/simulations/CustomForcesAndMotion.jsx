import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, ArrowLeft, Play, Pause, Settings2 } from 'lucide-react';
export default function CustomForcesAndMotion({
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
  const [mass, setMass] = useState(50); // kg
  const [appliedForce, setAppliedForce] = useState(0); // N
  const [frictionMu, setFrictionMu] = useState(0.2); // Kinetic friction coefficient (0 to 0.5)
  const gravity = 9.8; // m/s^2

  // State Variables (Ref for physics loop)
  const posRef = useRef(0); // meters
  const velRef = useRef(0); // m/s
  const lastTimeRef = useRef(0);
  const requestRef = useRef(null);

  // Visual State
  const [boxX, setBoxX] = useState(0); // This will track ground/background offset instead
  const [velocityVisual, setVelocityVisual] = useState(0);
  const [frictionForceVisual, setFrictionForceVisual] = useState(0);
  const [netForceVisual, setNetForceVisual] = useState(0);
  const updatePhysics = time => {
    
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(updatePhysics);
      return;
    }
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    const safeDt = Math.min(dt, 0.1);

    // Calculate Physics
    const normalForce = mass * gravity;
    let frictionForce = 0;

    // Static vs Kinetic friction logic
    if (Math.abs(velRef.current) < 0.01) {
      // Box is basically stationary
      velRef.current = 0;
      const maxStaticFriction = (frictionMu + 0.1) * normalForce; // slightly higher static friction

      if (Math.abs(appliedForce) <= maxStaticFriction) {
        // Not enough force to move
        frictionForce = appliedForce; // Static friction opposes perfectly
      } else {
        // Break static friction
        frictionForce = Math.sign(appliedForce) * frictionMu * normalForce;
      }
    } else {
      // Box is moving (kinetic friction)
      frictionForce = Math.sign(velRef.current) * frictionMu * normalForce;
    }
    const netForce = appliedForce - frictionForce;
    const acceleration = netForce / mass;
    velRef.current += acceleration * safeDt;

    // Stop completely if very slow and no net force
    if (Math.abs(velRef.current) < 0.05 && Math.abs(netForce) < 0.1) {
      velRef.current = 0;
    }
    posRef.current += velRef.current * safeDt;

    // Update visuals
    setBoxX(posRef.current * 40); // 40px per meter
    setVelocityVisual(velRef.current);
    setFrictionForceVisual(frictionForce);
    setNetForceVisual(netForce);
    requestRef.current = requestAnimationFrame(updatePhysics);
  };

  // Run physics infinitely
  useEffect(() => {
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [appliedForce, mass, frictionMu]); // Rebind if parameters change

  const handleReset = () => {
    posRef.current = 0;
    velRef.current = 0;
    setBoxX(0);
    setVelocityVisual(0);
    setAppliedForce(0);
    setFrictionForceVisual(0);
    setNetForceVisual(0);
  };

  // Helper for drawing vectors
  const renderArrow = (x, y, value, color, label, scale = 0.5, textOffset = -16) => {
    if (Math.abs(value) < 1) return null;
    const length = value * scale;
    const dir = Math.sign(length);
    const absLength = Math.abs(length);
    const clampedLength = Math.min(Math.max(absLength, 30), 250); // Visual bounds for arrow
    const finalX = x + dir * clampedLength;
    return <g>
                <line x1={x} y1={y} x2={finalX} y2={y} stroke={color} strokeWidth="4" markerEnd={`url(#arrowhead-${color.replace('#', '')})`} />
                <text x={x + dir * clampedLength / 2} y={y + textOffset} fill={color} fontSize="16" fontWeight="bold" textAnchor="middle" stroke="#1a1a24" strokeWidth="4" paintOrder="stroke" style={{
        userSelect: 'none'
      }}>
                    {label}
                </text>
            </g>;
  };

  // Background shift for infinite scroll
  const bgOffset = -(boxX % 40);
  const groundOffset = -(boxX % 200);
  
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
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#ff9f0a' }}>A Brief About Force and Motion</h3>
        <button 
          title="Force is a push or pull that can change the motion, direction, or shape of an object.
Motion is the change in position of an object with respect to time." 
          style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#fff', fontSize: '16px' }}
        >ℹ️</button>
      </div>
      
      <div style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.4, marginBottom: '20px' }}>
        <strong style={{color: '#fff'}}>Simple example: Imagine pushing a box:</strong><br/>
        • When you push the box, you apply a force.<br/>
        • The box starts moving — this is motion.<br/>
        • If you push harder, the box may accelerate.<br/>
        • If you stop pushing, friction may slow the box down and eventually stop it.
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff' }}>Formula</h4>
        <div style={{ background: '#000', padding: '15px 10px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', fontFamily: 'monospace' }}>
          a = F_net / m
          <div style={{ fontSize: '11px', marginTop: '5px', color: '#888' }}>Where F_net = F_applied - F_friction</div>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff' }}>Simulated Formula</h4>
        <div style={{ background: '#000', padding: '15px 10px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          F_net = {Math.round(appliedForce)} - {Math.round(frictionForceVisual)} = {Math.round(netForceVisual)} N<br/><br/>
          a = {Math.round(netForceVisual)} / {mass} = {(netForceVisual / mass).toFixed(2)} m/s²
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
          <h2 style={{ margin: 0, fontSize: '20px' }}>{title || 'Forces and Motion'}</h2>
          <div style={{ fontSize: '14px', color: '#888' }}>Mass: {mass}kg</div>
        </div>
      </div>

      {/* Background Grid - scrolling dynamically */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundSize: '40px 40px', backgroundPosition: `${bgOffset}px 0px`, backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', pointerEvents: 'none', zIndex: 0 }}></div>

      <svg viewBox="-500 -300 1000 600" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 2, userSelect: 'none', pointerEvents: 'none' }}>
        <defs>
          <marker id="arrowhead-ff9f0a" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto"><polygon points="0 0, 3 1.5, 0 3" fill="#ff9f0a" /></marker>
          <marker id="arrowhead-ff375f" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto"><polygon points="0 0, 3 1.5, 0 3" fill="#ff375f" /></marker>
          <marker id="arrowhead-30d158" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto"><polygon points="0 0, 3 1.5, 0 3" fill="#30d158" /></marker>
          <marker id="arrowhead-00f0ff" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto"><polygon points="0 0, 3 1.5, 0 3" fill="#00f0ff" /></marker>
          <linearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8d6e63" /><stop offset="100%" stopColor="#5d4037" /></linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2a2a35" /><stop offset="100%" stopColor="#12121A" /></linearGradient>
          <pattern id="woodPattern" width="200" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${groundOffset}, 0)`}><path d="M0 10 Q 50 20 100 10 T 200 10 M0 30 Q 50 40 100 30 T 200 30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" /></pattern>
          <pattern id="hazardStripe" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="20" fill="#f1c40f"/><rect x="10" width="10" height="20" fill="#222"/></pattern>
        </defs>

        <g transform="translate(0, 100)">
          <rect x="-1000" y="0" width="2000" height="400" fill="url(#groundGrad)" />
          <rect x="-1000" y="0" width="2000" height="400" fill="url(#woodPattern)" />
          <line x1="-1000" y1="0" x2="1000" y2="0" stroke="#4a4a5e" strokeWidth="8" />
        </g>

        <g transform="translate(0, 100)">
          <g transform="translate(-50, -70)" style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => setAppliedForce(prev => Math.min(prev + 50, 500))}>
            <path d="M -80 -25 L 0 -15 L 0 15 L -80 25 Z" fill={appliedForce > 0 ? "#ff9f0a" : "rgba(255,159,10,0.3)"} opacity="0.9" />
            <text x="-40" y="5" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">PUSH &gt;</text>
          </g>

          <g transform="translate(50, -70)" style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => setAppliedForce(prev => Math.max(prev - 50, -500))}>
            <path d="M 80 -25 L 0 -15 L 0 15 L 80 25 Z" fill={appliedForce < 0 ? "#ff9f0a" : "rgba(255,159,10,0.3)"} opacity="0.9" />
            <text x="40" y="5" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">&lt; PUSH</text>
          </g>

          <g transform="translate(0, 0)">
            <g transform="translate(-30, -10)">
              <circle cx="0" cy="0" r="10" fill="#222" stroke="#666" strokeWidth="3" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#888" strokeWidth="2" transform={`rotate(${boxX * 2})`} />
            </g>
            <g transform="translate(30, -10)">
              <circle cx="0" cy="0" r="10" fill="#222" stroke="#666" strokeWidth="3" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#888" strokeWidth="2" transform={`rotate(${boxX * 2})`} />
            </g>
            <rect x="-60" y="-20" width="120" height="10" rx="4" fill="#ff375f" />
            
            {/* The Industrial Metal Box on Wheels */}
            {/* Trolley Base */}
            <rect x="-80" y="-30" width="160" height="15" rx="5" fill="url(#hazardStripe)" stroke="#2c3e50" strokeWidth="3" />
            
            {/* Trolley Wheels */}
            <g transform="translate(-50, -10)">
              <circle cx="0" cy="0" r="16" fill="#2c3e50" stroke="#7f8c8d" strokeWidth="4" />
              <circle cx="0" cy="0" r="6" fill="#f1c40f" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="#bdc3c7" strokeWidth="3" transform={`rotate(${boxX * 1.5})`} />
            </g>
            <g transform="translate(50, -10)">
              <circle cx="0" cy="0" r="16" fill="#2c3e50" stroke="#7f8c8d" strokeWidth="4" />
              <circle cx="0" cy="0" r="6" fill="#f1c40f" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="#bdc3c7" strokeWidth="3" transform={`rotate(${boxX * 1.5})`} />
            </g>
            
            {/* Main Metal Box */}
            <rect x="-60" y="-130" width="120" height="100" rx="12" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="4" />
            <rect x="-50" y="-120" width="100" height="80" rx="8" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="2" />
            <path d="M -40 -110 L 40 -110 M -40 -100 L 40 -100 M -40 -90 L 40 -90" stroke="#bdc3c7" strokeWidth="4" strokeLinecap="round" />
            
            {/* Side handles/bumpers */}
            <rect x="-70" y="-95" width="10" height="30" rx="5" fill="#3498db" stroke="#2980b9" strokeWidth="3" />
            <rect x="60" y="-95" width="10" height="30" rx="5" fill="#e74c3c" stroke="#c0392b" strokeWidth="3" />

            {/* Mass Label */}
            <rect x="-35" y="-75" width="70" height="30" rx="6" fill="#2c3e50" />
            <text x="0" y="-55" fill="#fff" fontSize="18" fontWeight="bold" textAnchor="middle">{mass} kg</text>
            
            {renderArrow(0, -160, appliedForce, '#ff9f0a', `Applied: ${Math.round(appliedForce)}N`, 0.4)}
            {renderArrow(0, 15, frictionForceVisual, '#ff375f', `Friction: ${Math.round(frictionForceVisual)}N`, 0.4, 25)}
            {renderArrow(0, -220, netForceVisual, '#30d158', `Net: ${Math.round(netForceVisual)}N`, 0.4)}
            {renderArrow(0, -280, velocityVisual * 20, '#00f0ff', `v: ${velocityVisual.toFixed(1)} m/s`, 1)}
          </g>
        </g>
      </svg>
    </div>

    {/* RIGHT PANEL (15%) - Parameters Area */}
    <div style={{ width: '15%', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(20,20,30,0.9)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <Settings2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Controls
      </h3>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Applied Force</label>
          <span style={{ fontSize: '12px', color: '#ff9f0a', fontWeight: 700 }}>{appliedForce} N</span>
        </div>
        <input type="range" min="-500" max="500" step="10" value={appliedForce} onChange={e => setAppliedForce(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff9f0a' }} />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setAppliedForce(0)} style={{ flex: 1, padding: '8px', background: 'rgba(255,159,10,0.2)', color: '#ff9f0a', border: '1px solid rgba(255,159,10,0.4)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
          Stop Pushing
        </button>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '5px 0' }}></div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Object Mass</label>
          <span style={{ fontSize: '12px', color: '#3498db', fontWeight: 700 }}>{mass} kg</span>
        </div>
        <input type="range" min="10" max="200" step="5" value={mass} onChange={e => setMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#3498db' }} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Surface Friction</label>
          <span style={{ fontSize: '12px', color: '#ff375f', fontWeight: 700 }}>{frictionMu.toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="0.8" step="0.05" value={frictionMu} onChange={e => setFrictionMu(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff375f' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginTop: '4px' }}>
          <span>Ice</span>
          <span>Wood</span>
          <span>Rubber</span>
        </div>
      </div>
      
      <div style={{ marginTop: 'auto' }}>
        <button onClick={() => {
          setAppliedForce(0);
          setMass(50);
          setFrictionMu(0.3);
          velRef.current = 0;
          posRef.current = 0;
        }} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
          Reset All
        </button>
      </div>
    </div>
  </div>;
}
