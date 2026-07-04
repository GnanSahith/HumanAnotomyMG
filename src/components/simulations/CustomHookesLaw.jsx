import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Info, Settings, Sparkles, LineChart, BookOpen, Layers, Zap, Play, Pause, Settings2 } from 'lucide-react';

/**
 * CustomHookesLaw Physics Simulation Component
 * 
 * Physics Equations Used:
 * 1. Hooke's Law: F_spring = -k * x
 * 2. Applied Force: F_applied = k * x
 * 3. Elastic Potential Energy: U = 0.5 * k * x^2
 * 4. Series Springs: 1/k_eq = 1/k_1 + 1/k_2 => k_eq = (k_1 * k_2) / (k_1 + k_2)
 * 5. Parallel Springs: k_eq = k_1 + k_2
 * 
 * Visualization features:
 * - Spring stiffness k changes the coil thickness (wire diameter).
 * - Real-time force vs displacement linear plot.
 * - Real-time potential energy parabola plot.
 * - Interactive mouse/touch dragging of spring handle.
 * - Physics vectors (Force, Displacement) and values.
 */
function CustomHookesLawInner({
  onBack,
  title
}) {
  // Navigation & Tabs
  const [tab, setTab] = useState('intro'); // 'intro' | 'systems' | 'energy'
  const [infoTab, setInfoTab] = useState('controls'); // 'controls' | 'theory'

  // Intro & Energy Tab State
  const [k, setK] = useState(200); // Spring Constant, N/m (100 to 1000)
  const [appliedForce, setAppliedForce] = useState(0); // Applied Force, N (-100 to 100)

  // Systems Tab State
  const [systemType, setSystemType] = useState('series'); // 'series' | 'parallel'
  const [k1, setK1] = useState(200); // Spring 1 Constant, N/m
  const [k2, setK2] = useState(400); // Spring 2 Constant, N/m
  const [appliedForceSystems, setAppliedForceSystems] = useState(0); // Applied Force, N

  // Checkbox Overlay Toggles
  const [showAppliedForce, setShowAppliedForce] = useState(true);
  const [showSpringForce, setShowSpringForce] = useState(true);
  const [showDisplacement, setShowDisplacement] = useState(true);
  const [showEquilibrium, setShowEquilibrium] = useState(true);
  const [showValues, setShowValues] = useState(true);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);

  // ==========================================
  // PHYSICS CALCULATIONS
  // ==========================================

  // Intro & Energy calculations
  const displacement = appliedForce / k; // meters (ranges -1.0 to 1.0)
  const springForce = -appliedForce;
  const potentialEnergy = 0.5 * k * displacement ** 2;

  // Systems Calculations
  // Series
  const keqSeries = k1 * k2 / (k1 + k2);
  const displacementSeries = appliedForceSystems / keqSeries;
  const displacement1 = appliedForceSystems / k1;
  const displacement2 = appliedForceSystems / k2;
  const springForceSeries = -appliedForceSystems;
  const energySeries = 0.5 * keqSeries * displacementSeries ** 2;
  const energy1Series = 0.5 * k1 * displacement1 ** 2;
  const energy2Series = 0.5 * k2 * displacement2 ** 2;

  // Parallel
  const keqParallel = k1 + k2;
  const displacementParallel = appliedForceSystems / keqParallel;
  const springForceParallel = -appliedForceSystems;
  const energyParallel = 0.5 * keqParallel * displacementParallel ** 2;
  const force1Parallel = k1 * displacementParallel;
  const force2Parallel = k2 * displacementParallel;
  const energy1Parallel = 0.5 * k1 * displacementParallel ** 2;
  const energy2Parallel = 0.5 * k2 * displacementParallel ** 2;

  // Active state variables based on active Tab
  const activeKeq = tab === 'systems' ? systemType === 'series' ? keqSeries : keqParallel : k;
  const activeDisplacement = tab === 'systems' ? systemType === 'series' ? displacementSeries : displacementParallel : displacement;
  const activeAppliedForce = tab === 'systems' ? appliedForceSystems : appliedForce;
  const activeSpringForce = -activeAppliedForce;
  const activeEnergy = tab === 'systems' ? systemType === 'series' ? energySeries : energyParallel : potentialEnergy;

  // ==========================================
  // INTERACTIVE DRAGGING MECHANICAL LOGIC
  // ==========================================

  const handleStartDrag = e => {
    e.preventDefault();
    if (!svgRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = svgRef.current.getBoundingClientRect();
    // Map screen X to SVG viewBox X coordinate (SVG viewBox goes from 0 to 800 width)
    const relativeX = (clientX - rect.left) / rect.width * 800;
    let targetX = 0;
    if (tab === 'intro' || tab === 'energy') {
      targetX = 400 + displacement * 180; // X_eq = 400, scale = 180px per meter
    } else if (tab === 'systems') {
      if (systemType === 'series') {
        targetX = 420 + displacementSeries * 100; // X_eq = 420, scale = 100px per meter in series
      } else {
        targetX = 400 + displacementParallel * 180; // X_eq = 400, scale = 180px per meter
      }
    }

    // If user clicks within 50px of the handle, begin dragging
    if (Math.abs(relativeX - targetX) < 55) {
      setIsDragging(true);
    }
  };
  const handleDrag = e => {
    if (!isDragging || !svgRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width * 800;
    if (tab === 'intro' || tab === 'energy') {
      // Scale: 1 meter = 180 pixels. X_eq = 400
      const xNew = (relativeX - 400) / 180;
      // Clamp displacement to [-1.0, 1.0] meters
      const clampedX = Math.max(-1.0, Math.min(1.0, xNew));
      const fNew = k * clampedX;
      // Clamp force to [-100, 100] N
      const clampedF = Math.max(-100, Math.min(100, fNew));
      setAppliedForce(Math.round(clampedF));
    } else if (tab === 'systems') {
      if (systemType === 'series') {
        // Scale: 1 meter = 100 pixels. X_eq = 420
        const xNew = (relativeX - 420) / 100;
        const clampedX = Math.max(-2.0, Math.min(2.0, xNew));
        const fNew = keqSeries * clampedX;
        const clampedF = Math.max(-100, Math.min(100, fNew));
        setAppliedForceSystems(Math.round(clampedF));
      } else {
        // Scale: 1 meter = 180 pixels. X_eq = 400
        const xNew = (relativeX - 400) / 180;
        const clampedX = Math.max(-1.0, Math.min(1.0, xNew));
        const fNew = keqParallel * clampedX;
        const clampedF = Math.max(-100, Math.min(100, fNew));
        setAppliedForceSystems(Math.round(clampedF));
      }
    }
  };
  const handleEndDrag = () => {
    setIsDragging(false);
  };

  // Attach window event listener to release drag even if mouse lifts outside SVG boundary
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleEndDrag);
      window.addEventListener('touchend', handleEndDrag);
    }
    return () => {
      window.removeEventListener('mouseup', handleEndDrag);
      window.removeEventListener('touchend', handleEndDrag);
    };
  }, [isDragging]);

  // Reset parameters to their default configuration
  const handleReset = () => {
    setK(200);
    setAppliedForce(0);
    setK1(200);
    setK2(400);
    setAppliedForceSystems(0);
    setSystemType('series');
    setShowAppliedForce(true);
    setShowSpringForce(true);
    setShowDisplacement(true);
    setShowEquilibrium(true);
    setShowValues(true);
    setIsDragging(false);
  };

  // ==========================================
  // SPRING GENERATOR METHOD
  // ==========================================

  /**
   * Generates a 3D-like helix SVG path string representing a spring
   */
  const drawHelixSpring = (startX, startY, endX, endY, coils = 16, radius = 22) => {
    const lead = 20; // straight lead wire
    const xStart = startX + lead;
    const xEnd = endX - lead;
    const length = xEnd - xStart;

    // We adjust resolution of spring drawing based on compression state
    const steps = coils * 12;
    const path = [`M ${startX} ${startY}`, `L ${xStart} ${startY}`];
    for (let i = 0; i <= steps; i++) {
      const theta = i / steps * coils * 2 * Math.PI;
      // Add a slight projection offset in X to simulate 3D curvature
      const x = xStart + i / steps * length + Math.sin(theta) * 5;
      const y = startY + Math.cos(theta) * radius;
      path.push(`L ${x} ${y}`);
    }
    path.push(`L ${xEnd} ${startY}`);
    path.push(`L ${endX} ${endY}`);
    return path.join(' ');
  };
  return <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'transparent',
    color: '#f1f5f9',
    position: 'relative',
    fontFamily: "'Inter', sans-serif",
    overflow: 'hidden',
    paddingTop: '80px'
  }}>
      
      {/* Background Decorative Neon Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* ==========================================
          HEADER SECTION
          ========================================== */}
      

      {/* ==========================================
          MAIN CONTAINER
          ========================================== */}
      <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'none'
    }}>
        
        {/* LEFT PANEL: Interactive Screen & Plots (8 Columns) */}
        <section style={{
        position: 'absolute',
        inset: 0,
        padding: '20px',
        paddingRight: '340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto'
      }}>
          
          {/* Main Simulation Viewport */}
          <div className="relative rounded-2xl border border-slate-800 /60 backdrop-blur-md shadow-2xl p-4 flex flex-col overflow-hidden">
            
            {/* Viewport Indicator */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 border border-slate-800 px-3 py-1 rounded-full text-xs font-mono text-purple-400" style={{
            background: 'rgba(20, 20, 30, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            color: 'white'
          }}>
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              Interactive Physics Sandbox
            </div>

            {/* SVG Visualizer */}
            <div className="relative w-full aspect-[8/4] rounded-xl border border-slate-900/60 overflow-hidden select-none">
              
              {/* Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
              
              <svg ref={svgRef} viewBox="0 0 800 400" className="w-full h-full relative z-10 cursor-crosshair" onMouseDown={handleStartDrag} onMouseMove={handleDrag} onTouchStart={handleStartDrag} onTouchMove={handleDrag}>
                {/* SVG Definitions */}
                <defs>
                  {/* Springs Cylindrical Gradient */}
                  <linearGradient id="springMetalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="30%" stopColor="#cbd5e1" />
                    <stop offset="70%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>

                  {/* Wood Hatch Pattern for Fixed Wall */}
                  <pattern id="wallPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="3" height="10" fill="#334155" />
                    <rect x="3" width="7" height="10" fill="#1e293b" />
                  </pattern>

                  {/* Arrow Marker Definitions */}
                  <marker id="arrow-applied" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                  </marker>
                  <marker id="arrow-spring" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" />
                  </marker>
                  <marker id="arrow-displacement" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                  </marker>
                </defs>

                {/* GROUND AND FIXED WALL */}
                {/* Ground Line */}
                <line x1="100" y1="300" x2="750" y2="300" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
                <line x1="100" y1="303" x2="750" y2="303" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                
                {/* Wall Anchor */}
                <rect x="70" y="80" width="30" height="240" fill="url(#wallPattern)" rx="4" />
                <line x1="100" y1="80" x2="100" y2="320" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />

                {/* ==================== INTRO & ENERGY MODE ==================== */}
                {(tab === 'intro' || tab === 'energy') && <g>
                    {/* Equilibrium Marker Line */}
                    {showEquilibrium && <g>
                        <line x1="400" y1="60" x2="400" y2="320" stroke="#475569" strokeWidth="2" strokeDasharray="6,6" />
                        <text x="400" y="50" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold">Equilibrium</text>
                      </g>}

                    {/* Spring Element */}
                    <path d={drawHelixSpring(100, 200, 400 + displacement * 180, 200, 16, 24)} fill="none" stroke="url(#springMetalGrad)" strokeWidth={3 + k / 180} strokeLinecap="round" strokeLinejoin="round" />

                    {/* Draggable Handle Block */}
                    <g transform={`translate(${400 + displacement * 180}, 160)`}>
                      {/* Metal plate */}
                      <rect x="-10" y="0" width="20" height="80" fill="#94a3b8" rx="2" stroke="#475569" strokeWidth="2" />
                      {/* Grab ring */}
                      <circle cx="20" cy="40" r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="3" className="cursor-grab hover:fill-purple-950 hover:stroke-purple-400 transition-colors" />
                      <circle cx="20" cy="40" r="6" fill={isDragging ? "#a855f7" : "#64748b"} />
                      {/* Connector hook */}
                      <path d="M 0 40 L 10 40" stroke="#475569" strokeWidth="4" />
                    </g>

                    {/* VECTORS OVERLAYS */}
                    {/* Displacement Vector (Green) */}
                    {showDisplacement && Math.abs(displacement) > 0.01 && <g>
                        <line x1="400" y1="280" x2={400 + displacement * 180} y2="280" stroke="#10b981" strokeWidth="5" markerEnd="url(#arrow-displacement)" />
                        {showValues && <text x={400 + displacement * 180 / 2} y="270" fill="#10b981" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            x = {displacement.toFixed(3)} m
                          </text>}
                      </g>}

                    {/* Applied Force Vector (Orange) */}
                    {showAppliedForce && Math.abs(appliedForce) > 1 && <g>
                        <line x1={400 + displacement * 180 + (displacement >= 0 ? 10 : -10)} y1="130" x2={400 + displacement * 180 + (displacement >= 0 ? 10 : -10) + appliedForce * 1.5} y2="130" stroke="#f59e0b" strokeWidth="5" markerEnd="url(#arrow-applied)" />
                        {showValues && <text x={400 + displacement * 180 + appliedForce * 0.75} y="118" fill="#f59e0b" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            F_app = {appliedForce.toFixed(0)} N
                          </text>}
                      </g>}

                    {/* Spring Force Vector (Pink) */}
                    {showSpringForce && Math.abs(springForce) > 1 && <g>
                        <line x1={400 + displacement * 180 + (displacement >= 0 ? -10 : 10)} y1="200" x2={400 + displacement * 180 + (displacement >= 0 ? -10 : 10) + springForce * 1.5} y2="200" stroke="#ec4899" strokeWidth="5" markerEnd="url(#arrow-spring)" />
                        {showValues && <text x={400 + displacement * 180 + springForce * 0.75} y="188" fill="#ec4899" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            F_sp = {springForce.toFixed(0)} N
                          </text>}
                      </g>}
                  </g>}

                {/* ==================== SYSTEMS MODE (SERIES) ==================== */}
                {tab === 'systems' && systemType === 'series' && <g>
                    {/* Equilibrium Line */}
                    {showEquilibrium && <g>
                        <line x1="420" y1="60" x2="420" y2="320" stroke="#475569" strokeWidth="2" strokeDasharray="6,6" />
                        <text x="420" y="50" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold">Equilibrium</text>
                      </g>}

                    {/* Spring 1 (Wall to Mid) */}
                    <path d={drawHelixSpring(100, 200, 260 + displacement1 * 100, 200, 12, 22)} fill="none" stroke="url(#springMetalGrad)" strokeWidth={3 + k1 / 180} strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Connection Hook ring */}
                    <circle cx={260 + displacement1 * 100} cy="200" r="10" fill="#334155" stroke="#cbd5e1" strokeWidth="2" />
                    <text x={260 + displacement1 * 100} y="180" fill="#94a3b8" fontSize="11" textAnchor="middle">k1</text>

                    {/* Spring 2 (Mid to Handle) */}
                    <path d={drawHelixSpring(260 + displacement1 * 100, 200, 420 + displacementSeries * 100, 200, 12, 22)} fill="none" stroke="url(#springMetalGrad)" strokeWidth={3 + k2 / 180} strokeLinecap="round" strokeLinejoin="round" />
                    <text x={340 + (displacement1 + displacementSeries) * 50} y="180" fill="#94a3b8" fontSize="11" textAnchor="middle">k2</text>

                    {/* Handle block */}
                    <g transform={`translate(${420 + displacementSeries * 100}, 160)`}>
                      <rect x="-10" y="0" width="20" height="80" fill="#94a3b8" rx="2" stroke="#475569" strokeWidth="2" />
                      <circle cx="20" cy="40" r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="3" className="cursor-grab hover:fill-purple-950 hover:stroke-purple-400 transition-colors" />
                      <circle cx="20" cy="40" r="6" fill={isDragging ? "#a855f7" : "#64748b"} />
                      <path d="M 0 40 L 10 40" stroke="#475569" strokeWidth="4" />
                    </g>

                    {/* VECTORS OVERLAYS */}
                    {/* Displacement Vector (Green) */}
                    {showDisplacement && Math.abs(displacementSeries) > 0.01 && <g>
                        <line x1="420" y1="280" x2={420 + displacementSeries * 100} y2="280" stroke="#10b981" strokeWidth="5" markerEnd="url(#arrow-displacement)" />
                        {showValues && <text x={420 + displacementSeries * 100 / 2} y="270" fill="#10b981" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            x_total = {displacementSeries.toFixed(3)} m
                          </text>}
                      </g>}

                    {/* Applied Force Vector (Orange) */}
                    {showAppliedForce && Math.abs(appliedForceSystems) > 1 && <g>
                        <line x1={420 + displacementSeries * 100 + (displacementSeries >= 0 ? 10 : -10)} y1="130" x2={420 + displacementSeries * 100 + (displacementSeries >= 0 ? 10 : -10) + appliedForceSystems * 1.5} y2="130" stroke="#f59e0b" strokeWidth="5" markerEnd="url(#arrow-applied)" />
                        {showValues && <text x={420 + displacementSeries * 100 + appliedForceSystems * 0.75} y="118" fill="#f59e0b" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            F_app = {appliedForceSystems.toFixed(0)} N
                          </text>}
                      </g>}

                    {/* Spring Force Vector (Pink) */}
                    {showSpringForce && Math.abs(springForceSeries) > 1 && <g>
                        <line x1={420 + displacementSeries * 100 + (displacementSeries >= 0 ? -10 : 10)} y1="200" x2={420 + displacementSeries * 100 + (displacementSeries >= 0 ? -10 : 10) + springForceSeries * 1.5} y2="200" stroke="#ec4899" strokeWidth="5" markerEnd="url(#arrow-spring)" />
                        {showValues && <text x={420 + displacementSeries * 100 + springForceSeries * 0.75} y="188" fill="#ec4899" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            F_sp = {springForceSeries.toFixed(0)} N
                          </text>}
                      </g>}
                  </g>}

                {/* ==================== SYSTEMS MODE (PARALLEL) ==================== */}
                {tab === 'systems' && systemType === 'parallel' && <g>
                    {/* Equilibrium Line */}
                    {showEquilibrium && <g>
                        <line x1="400" y1="60" x2="400" y2="320" stroke="#475569" strokeWidth="2" strokeDasharray="6,6" />
                        <text x="400" y="50" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold">Equilibrium</text>
                      </g>}

                    {/* Spring 1 (Top) */}
                    <path d={drawHelixSpring(100, 140, 400 + displacementParallel * 180, 140, 16, 18)} fill="none" stroke="url(#springMetalGrad)" strokeWidth={3 + k1 / 180} strokeLinecap="round" strokeLinejoin="round" />
                    <text x="250" y="115" fill="#94a3b8" fontSize="12" textAnchor="middle">k1 = {k1} N/m</text>

                    {/* Spring 2 (Bottom) */}
                    <path d={drawHelixSpring(100, 260, 400 + displacementParallel * 180, 260, 16, 18)} fill="none" stroke="url(#springMetalGrad)" strokeWidth={3 + k2 / 180} strokeLinecap="round" strokeLinejoin="round" />
                    <text x="250" y="295" fill="#94a3b8" fontSize="12" textAnchor="middle">k2 = {k2} N/m</text>

                    {/* Connector Bar linking both springs */}
                    <g transform={`translate(${400 + displacementParallel * 180}, 110)`}>
                      <rect x="-10" y="0" width="20" height="180" fill="#64748b" rx="4" stroke="#475569" strokeWidth="2" />
                      {/* Pull handle ring in middle */}
                      <circle cx="20" cy="90" r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="3" className="cursor-grab hover:fill-purple-950 hover:stroke-purple-400 transition-colors" />
                      <circle cx="20" cy="90" r="6" fill={isDragging ? "#a855f7" : "#64748b"} />
                      <path d="M 0 90 L 10 90" stroke="#475569" strokeWidth="4" />
                    </g>

                    {/* VECTORS OVERLAYS */}
                    {/* Displacement Vector (Green) */}
                    {showDisplacement && Math.abs(displacementParallel) > 0.01 && <g>
                        <line x1="400" y1="320" x2={400 + displacementParallel * 180} y2="320" stroke="#10b981" strokeWidth="5" markerEnd="url(#arrow-displacement)" />
                        {showValues && <text x={400 + displacementParallel * 180 / 2} y="310" fill="#10b981" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            x = {displacementParallel.toFixed(3)} m
                          </text>}
                      </g>}

                    {/* Applied Force Vector (Orange) */}
                    {showAppliedForce && Math.abs(appliedForceSystems) > 1 && <g>
                        <line x1={400 + displacementParallel * 180 + (displacementParallel >= 0 ? 10 : -10)} y1="200" x2={400 + displacementParallel * 180 + (displacementParallel >= 0 ? 10 : -10) + appliedForceSystems * 1.5} y2="200" stroke="#f59e0b" strokeWidth="5" markerEnd="url(#arrow-applied)" />
                        {showValues && <text x={400 + displacementParallel * 180 + appliedForceSystems * 0.75} y="188" fill="#f59e0b" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            F_app = {appliedForceSystems.toFixed(0)} N
                          </text>}
                      </g>}

                    {/* Spring Force Vector (Pink) */}
                    {showSpringForce && Math.abs(springForceParallel) > 1 && <g>
                        <line x1={400 + displacementParallel * 180 + (displacementParallel >= 0 ? -10 : 10)} y1="240" x2={400 + displacementParallel * 180 + (displacementParallel >= 0 ? -10 : 10) + springForceParallel * 1.5} y2="240" stroke="#ec4899" strokeWidth="5" markerEnd="url(#arrow-spring)" />
                        {showValues && <text x={400 + displacementParallel * 180 + springForceParallel * 0.75} y="228" fill="#ec4899" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="#020617" strokeWidth="3" paintOrder="stroke">
                            F_sp = {springForceParallel.toFixed(0)} N
                          </text>}
                      </g>}
                  </g>}
              </svg>
            </div>
            
            {/* Visual Readouts under the playground */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
              <div className="/40 border border-slate-900 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Equivalent Constant (k_eq)</div>
                <div className="text-lg font-bold font-mono text-purple-400">
                  {activeKeq.toFixed(1)} <span className="text-xs text-slate-400">N/m</span>
                </div>
              </div>
              <div className="/40 border border-slate-900 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Displacement (x)</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {activeDisplacement.toFixed(3)} <span className="text-xs text-slate-400">m</span>
                </div>
              </div>
              <div className="/40 border border-slate-900 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Applied Force (F)</div>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {activeAppliedForce.toFixed(1)} <span className="text-xs text-slate-400">N</span>
                </div>
              </div>
              <div className="/40 border border-slate-900 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Spring Force (F_sp)</div>
                <div className="text-lg font-bold font-mono text-pink-400">
                  {activeSpringForce.toFixed(1)} <span className="text-xs text-slate-400">N</span>
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME CHARTS AND PLOTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Force vs Displacement */}
            <div className="border border-slate-800 /60 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <LineChart size={16} className="text-amber-500" />
                Force vs. Displacement Linear Plot
              </div>
              
              <div className="w-full aspect-[4/3] border border-slate-900 rounded-xl p-2 relative overflow-hidden select-none">
                <svg viewBox="0 0 260 200" className="w-full h-full">
                  <clipPath id="forceGraphClip">
                    <rect x="30" y="20" width="200" height="150" />
                  </clipPath>

                  {/* Horizontal Gridlines */}
                  <line x1="30" y1="20" x2="230" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="30" y1="57.5" x2="230" y2="57.5" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="30" y1="95" x2="230" y2="95" stroke="#334155" strokeWidth="1.5" /> {/* X axis origin */}
                  <line x1="30" y1="132.5" x2="230" y2="132.5" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="30" y1="170" x2="230" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />

                  {/* Vertical Gridlines */}
                  <line x1="30" y1="20" x2="30" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="80" y1="20" x2="80" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="130" y1="20" x2="130" y2="170" stroke="#334155" strokeWidth="1.5" /> {/* Y axis origin */}
                  <line x1="180" y1="20" x2="180" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="230" y1="20" x2="230" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />

                  {/* Axis Label markings */}
                  {/* Y-axis Labels (Force) */}
                  <text x="25" y="24" fill="#64748b" fontSize="9" textAnchor="end">100</text>
                  <text x="25" y="61" fill="#64748b" fontSize="9" textAnchor="end">50</text>
                  <text x="25" y="98" fill="#64748b" fontSize="9" textAnchor="end">0</text>
                  <text x="25" y="136" fill="#64748b" fontSize="9" textAnchor="end">-50</text>
                  <text x="25" y="173" fill="#64748b" fontSize="9" textAnchor="end">-100</text>
                  <text x="12" y="95" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 12 95)">Force F (N)</text>

                  {/* X-axis Labels (Displacement) */}
                  <text x="30" y="184" fill="#64748b" fontSize="9" textAnchor="middle">-1.0</text>
                  <text x="80" y="184" fill="#64748b" fontSize="9" textAnchor="middle">-0.5</text>
                  <text x="130" y="184" fill="#64748b" fontSize="9" textAnchor="middle">0</text>
                  <text x="180" y="184" fill="#64748b" fontSize="9" textAnchor="middle">0.5</text>
                  <text x="230" y="184" fill="#64748b" fontSize="9" textAnchor="middle">1.0</text>
                  <text x="130" y="196" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">Displacement x (m)</text>

                  {/* F = k_eq * x line */}
                  <line x1={130 - 1.0 * 100} y1={95 + activeKeq * -1.0 * 0.75} x2={130 + 1.0 * 100} y2={95 + activeKeq * 1.0 * 0.75} stroke="#f59e0b" strokeWidth="2.5" clipPath="url(#forceGraphClip)" />

                  {/* Highlight current point indicator lines */}
                  <g clipPath="url(#forceGraphClip)">
                    <line x1={130 + activeDisplacement * 100} y1="95" x2={130 + activeDisplacement * 100} y2={95 - activeAppliedForce * 0.75} stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="130" y1={95 - activeAppliedForce * 0.75} x2={130 + activeDisplacement * 100} y2={95 - activeAppliedForce * 0.75} stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                    
                    {/* Current state dot */}
                    <circle cx={130 + activeDisplacement * 100} cy={95 - activeAppliedForce * 0.75} r="6" fill="#ec4899" stroke="#f1f5f9" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Chart 2: Elastic Potential Energy Parabola */}
            <div className="border border-slate-800 /60 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Zap size={16} className="text-purple-400" />
                Elastic Potential Energy Parabolic Curve
              </div>

              <div className="w-full aspect-[4/3] border border-slate-900 rounded-xl p-2 relative overflow-hidden select-none">
                <svg viewBox="0 0 260 200" className="w-full h-full">
                  <clipPath id="energyGraphClip">
                    <rect x="35" y="20" width="195" height="150" />
                  </clipPath>

                  {/* Horizontal Gridlines (U: 0 to 500J) */}
                  {/* scale: 500 Joules = 150 pixels => 1 Joule = 0.3 pixels. Origin at Y=170 */}
                  <line x1="35" y1="20" x2="230" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="35" y1="50" x2="230" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="35" y1="80" x2="230" y2="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="35" y1="110" x2="230" y2="110" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="35" y1="140" x2="230" y2="140" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="35" y1="170" x2="230" y2="170" stroke="#334155" strokeWidth="1.5" /> {/* X origin */}

                  {/* Vertical Gridlines */}
                  <line x1="35" y1="20" x2="35" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="83.75" y1="20" x2="83.75" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="132.5" y1="20" x2="132.5" y2="170" stroke="#334155" strokeWidth="1.5" /> {/* Y origin */}
                  <line x1="181.25" y1="20" x2="181.25" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="230" y1="20" x2="230" y2="170" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />

                  {/* Y-axis Labels (Energy U in Joules) */}
                  <text x="30" y="24" fill="#64748b" fontSize="9" textAnchor="end">500</text>
                  <text x="30" y="54" fill="#64748b" fontSize="9" textAnchor="end">400</text>
                  <text x="30" y="84" fill="#64748b" fontSize="9" textAnchor="end">300</text>
                  <text x="30" y="114" fill="#64748b" fontSize="9" textAnchor="end">200</text>
                  <text x="30" y="144" fill="#64748b" fontSize="9" textAnchor="end">100</text>
                  <text x="30" y="173" fill="#64748b" fontSize="9" textAnchor="end">0</text>
                  <text x="12" y="95" fill="#a855f7" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 12 95)">Energy U (J)</text>

                  {/* X-axis Labels (Displacement) */}
                  <text x="35" y="184" fill="#64748b" fontSize="9" textAnchor="middle">-1.0</text>
                  <text x="83.75" y="184" fill="#64748b" fontSize="9" textAnchor="middle">-0.5</text>
                  <text x="132.5" y="184" fill="#64748b" fontSize="9" textAnchor="middle">0</text>
                  <text x="181.25" y="184" fill="#64748b" fontSize="9" textAnchor="middle">0.5</text>
                  <text x="230" y="184" fill="#64748b" fontSize="9" textAnchor="middle">1.0</text>
                  <text x="132.5" y="196" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">Displacement x (m)</text>

                  {/* Dynamic Parabola plot: U = 0.5 * k_eq * x^2 */}
                  {(() => {
                  const steps = 30;
                  const points = [];
                  for (let i = 0; i <= steps; i++) {
                    // x goes from -1.0 to 1.0
                    const xVal = -1.0 + i / steps * 2.0;
                    const uVal = 0.5 * activeKeq * xVal ** 2;
                    const svgX = 132.5 + xVal * 97.5; // X scale
                    const svgY = 170 - uVal * 0.3; // Y scale (0.3px per Joule)
                    points.push(`${svgX},${svgY}`);
                  }
                  return <path d={`M ${points.join(' L ')}`} fill="none" stroke="#a855f7" strokeWidth="2.5" clipPath="url(#energyGraphClip)" />;
                })()}

                  {/* Dotted helper lines linking dot to axes */}
                  <g clipPath="url(#energyGraphClip)">
                    <line x1={132.5 + activeDisplacement * 97.5} y1="170" x2={132.5 + activeDisplacement * 97.5} y2={170 - activeEnergy * 0.3} stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="35" y1={170 - activeEnergy * 0.3} x2={132.5 + activeDisplacement * 97.5} y2={170 - activeEnergy * 0.3} stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />

                    {/* Current state dot */}
                    <circle cx={132.5 + activeDisplacement * 97.5} cy={170 - activeEnergy * 0.3} r="6" fill="#a855f7" stroke="#f1f5f9" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>
            </div>

          </div>
        </section>

        {/* RIGHT PANEL: Sleek Glassmorphic Controls Sidebar (4 Columns) */}
        <section style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '300px',
        maxHeight: 'calc(100% - 40px)',
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        zIndex: 10,
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        gap: '20px',
        padding: '20px'
      }}>
          
          {/* Simulation Tabs Selectors */}
          <div className="grid grid-cols-3 gap-2 p-1 /80 border border-slate-800 rounded-xl">
            <button onClick={() => {
            setTab('intro');
            handleReset();
          }} className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${tab === 'intro' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
              Intro
            </button>
            <button onClick={() => {
            setTab('systems');
            handleReset();
          }} className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${tab === 'systems' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
              Systems
            </button>
            <button onClick={() => {
            setTab('energy');
            handleReset();
          }} className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${tab === 'energy' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
              Energy
            </button>
          </div>

          {/* Core Controls Panel */}
          <div className="border border-slate-800 /60 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-6">
            
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings size={18} className="text-purple-400" />
              <h3 className="font-semibold text-slate-200">Simulation Settings</h3>
            </div>

            {/* TAB-SPECIFIC CONTROLS */}
            {tab === 'intro' && <div className="flex flex-col gap-5">
                {/* k slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Spring Constant (k)</span>
                    <span className="text-purple-400 font-mono font-bold">{k} N/m</span>
                  </div>
                  <input type="range" min="100" max="1000" step="50" value={k} onChange={e => setK(parseInt(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>100 N/m</span>
                    <span>550 N/m</span>
                    <span>1000 N/m</span>
                  </div>
                </div>

                {/* Force slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Applied Force (F_app)</span>
                    <span className="text-amber-500 font-mono font-bold">{appliedForce} N</span>
                  </div>
                  <input type="range" min="-100" max="100" step="5" value={appliedForce} onChange={e => setAppliedForce(parseInt(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-100 N (Push)</span>
                    <span>0 N</span>
                    <span>100 N (Pull)</span>
                  </div>
                </div>
              </div>}

            {tab === 'systems' && <div className="flex flex-col gap-5">
                {/* Series vs Parallel toggle */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">System Configuration</label>
                  <div className="grid grid-cols-2 gap-2 p-1 border border-slate-800 rounded-lg" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                    <button onClick={() => {
                  setSystemType('series');
                  setAppliedForceSystems(0);
                }} className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${systemType === 'series' ? ' text-purple-400' : 'text-slate-500'}`}>
                      Series Springs
                    </button>
                    <button onClick={() => {
                  setSystemType('parallel');
                  setAppliedForceSystems(0);
                }} className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${systemType === 'parallel' ? ' text-purple-400' : 'text-slate-500'}`}>
                      Parallel Springs
                    </button>
                  </div>
                </div>

                {/* k1 slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Spring Constant 1 (k_1)</span>
                    <span className="text-purple-400 font-mono font-bold">{k1} N/m</span>
                  </div>
                  <input type="range" min="100" max="1000" step="50" value={k1} onChange={e => setK1(parseInt(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                </div>

                {/* k2 slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Spring Constant 2 (k_2)</span>
                    <span className="text-purple-400 font-mono font-bold">{k2} N/m</span>
                  </div>
                  <input type="range" min="100" max="1000" step="50" value={k2} onChange={e => setK2(parseInt(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                </div>

                {/* Force slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Applied Force (F_app)</span>
                    <span className="text-amber-500 font-mono font-bold">{appliedForceSystems} N</span>
                  </div>
                  <input type="range" min="-100" max="100" step="5" value={appliedForceSystems} onChange={e => setAppliedForceSystems(parseInt(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-100 N</span>
                    <span>0 N</span>
                    <span>100 N</span>
                  </div>
                </div>
                
                {/* System Breakdown using all individual spring values */}
                <div className="border border-slate-800 rounded-xl p-3 flex flex-col gap-2 mt-2" style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }}>
                  <div className="text-xs text-purple-300 font-bold uppercase tracking-wider">System Breakdown</div>
                  {systemType === 'series' ? <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="/80 p-2 rounded border border-slate-900/60">
                        <div className="text-slate-400">Spring 1 Ext (x1)</div>
                        <div className="font-mono font-bold text-emerald-400">{displacement1.toFixed(3)} m</div>
                      </div>
                      <div className="/80 p-2 rounded border border-slate-900/60">
                        <div className="text-slate-400">Spring 2 Ext (x2)</div>
                        <div className="font-mono font-bold text-emerald-400">{displacement2.toFixed(3)} m</div>
                      </div>
                      <div className="/80 p-2 rounded border border-slate-900/60">
                        <div className="text-slate-400">Spring 1 Energy (U1)</div>
                        <div className="font-mono font-bold text-purple-400">{energy1Series.toFixed(3)} J</div>
                      </div>
                      <div className="/80 p-2 rounded border border-slate-900/60">
                        <div className="text-slate-400">Spring 2 Energy (U2)</div>
                        <div className="font-mono font-bold text-purple-400">{energy2Series.toFixed(3)} J</div>
                      </div>
                    </div> : <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="/80 p-2 rounded border border-slate-900/60">
                        <div className="text-slate-400">Spring 1 Force (F1)</div>
                        <div className="font-mono font-bold text-amber-500">{force1Parallel.toFixed(1)} N</div>
                      </div>
                      <div className="/80 p-2 rounded border border-slate-900/60">
                        <div className="text-slate-400">Spring 2 Force (F2)</div>
                        <div className="font-mono font-bold text-amber-500">{force2Parallel.toFixed(1)} N</div>
                      </div>
                      <div className="/80 p-2 rounded border border-slate-900/60">
                        <div className="text-slate-400">Spring 1 Energy (U1)</div>
                        <div className="font-mono font-bold text-purple-400">{energy1Parallel.toFixed(3)} J</div>
                      </div>
                      <div className="/80 p-2 rounded border border-slate-900/60">
                        <div className="text-slate-400">Spring 2 Energy (U2)</div>
                        <div className="font-mono font-bold text-purple-400">{energy2Parallel.toFixed(3)} J</div>
                      </div>
                    </div>}
                </div>
              </div>}

            {tab === 'energy' && <div className="flex flex-col gap-5">
                {/* k slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Spring Constant (k)</span>
                    <span className="text-purple-400 font-mono font-bold">{k} N/m</span>
                  </div>
                  <input type="range" min="100" max="1000" step="50" value={k} onChange={e => setK(parseInt(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                </div>

                {/* Force slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Applied Force (F_app)</span>
                    <span className="text-amber-500 font-mono font-bold">{appliedForce} N</span>
                  </div>
                  <input type="range" min="-100" max="100" step="5" value={appliedForce} onChange={e => setAppliedForce(parseInt(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                </div>

                {/* Dynamic Energy Bar Chart Indicator */}
                <div className="border border-slate-800 rounded-xl p-4 flex flex-col gap-3" style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-300 font-medium">Elastic Potential Energy (U)</span>
                    <span className="font-mono text-purple-400 font-bold">{activeEnergy.toFixed(3)} Joules</span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="w-full h-4 rounded-full border border-slate-800 overflow-hidden relative shadow-inner">
                    {/* Fill */}
                    <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-150 shadow-[0_0_8px_rgba(168,85,247,0.5)]" style={{
                  width: `${Math.min(100, activeEnergy / 500 * 100)}%`
                }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>0 J</span>
                    <span>250 J</span>
                    <span>500 J (Max Scale)</span>
                  </div>
                </div>
              </div>}

            {/* TOGGLES / OVERLAYS CHECKBOXES */}
            <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
              <label className="text-xs text-slate-400 font-medium mb-1">Visual Overlays</label>
              
              {/* Applied Force check */}
              <label className="flex items-center gap-3 cursor-pointer group text-sm select-none">
                <input type="checkbox" checked={showAppliedForce} onChange={e => setShowAppliedForce(e.target.checked)} className="rounded border-slate-700 text-purple-600 focus:ring-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                <span className="text-slate-300 group-hover:text-white transition-colors">Applied Force Vector</span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 ml-auto" />
              </label>

              {/* Spring Force check */}
              <label className="flex items-center gap-3 cursor-pointer group text-sm select-none">
                <input type="checkbox" checked={showSpringForce} onChange={e => setShowSpringForce(e.target.checked)} className="rounded border-slate-700 text-purple-600 focus:ring-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                <span className="text-slate-300 group-hover:text-white transition-colors">Spring Force Vector</span>
                <span className="w-3 h-3 rounded-full bg-pink-500/80 ml-auto" />
              </label>

              {/* Displacement check */}
              <label className="flex items-center gap-3 cursor-pointer group text-sm select-none">
                <input type="checkbox" checked={showDisplacement} onChange={e => setShowDisplacement(e.target.checked)} className="rounded border-slate-700 text-purple-600 focus:ring-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                <span className="text-slate-300 group-hover:text-white transition-colors">Displacement Vector</span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 ml-auto" />
              </label>

              {/* Equilibrium check */}
              <label className="flex items-center gap-3 cursor-pointer group text-sm select-none">
                <input type="checkbox" checked={showEquilibrium} onChange={e => setShowEquilibrium(e.target.checked)} className="rounded border-slate-700 text-purple-600 focus:ring-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                <span className="text-slate-300 group-hover:text-white transition-colors">Equilibrium Marker</span>
                <span className="w-3 h-1 border-t-2 border-dashed border-slate-500 ml-auto" />
              </label>

              {/* Values check */}
              <label className="flex items-center gap-3 cursor-pointer group text-sm select-none">
                <input type="checkbox" checked={showValues} onChange={e => setShowValues(e.target.checked)} className="rounded border-slate-700 text-purple-600 focus:ring-purple-500" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }} />
                <span className="text-slate-300 group-hover:text-white transition-colors">Show Numeric Values</span>
                <span className="text-[10px] font-mono text-purple-400 ml-auto border border-purple-500/30 px-1.5 py-0.5 rounded">F = kx</span>
              </label>
            </div>
          </div>

          {/* LOWER ACCORDION: Explanations & Theory (Controls vs Theory) */}
          <div className="border border-slate-800 /60 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4">
            
            <div className="flex border-b border-slate-800 gap-4">
              <button onClick={() => setInfoTab('controls')} className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${infoTab === 'controls' ? 'border-purple-500 text-purple-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Simulation Tips
              </button>
              <button onClick={() => setInfoTab('theory')} className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${infoTab === 'theory' ? 'border-purple-500 text-purple-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Physics Theory
              </button>
            </div>

            {infoTab === 'controls' && <div className="text-xs text-slate-300 flex flex-col gap-2.5 leading-relaxed font-normal">
                <p>💡 <span className="text-purple-400 font-semibold">Interactive dragging:</span> Click and hold the steel ring or handle at the end of the spring inside the sandbox, and drag left or right to dynamically apply force.</p>
                <p>💡 <span className="text-purple-400 font-semibold">Equivalent spring constants:</span> Try switching configuration modes in the Systems tab. Notice how series springs are weaker (longer overall displacement) and parallel springs are stiffer.</p>
                <p>💡 <span className="text-purple-400 font-semibold">Vectors:</span> Turn on overlays to see the mathematical directions. The restoring spring force vector always points opposite to the displacement arrow.</p>
              </div>}

            {infoTab === 'theory' && <div className="text-xs text-slate-300 flex flex-col gap-3 leading-relaxed font-normal">
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1">Hooke's Law:</h4>
                  <p className="font-mono text-purple-300 /80 p-1.5 rounded text-[11px] text-center border border-slate-900">
                    F_sp = -k * x
                  </p>
                  <p className="mt-1.5">Where <strong className="text-purple-400">k</strong> is the spring stiffness constant (N/m), and <strong className="text-emerald-400">x</strong> is displacement from the natural equilibrium position (meters).</p>
                </div>
                
                <div className="border-t border-slate-900 pt-2.5">
                  <h4 className="font-semibold text-slate-200 mb-1">Equivalent Springs (Series):</h4>
                  <p className="font-mono text-purple-300 /80 p-1.5 rounded text-[11px] text-center border border-slate-900">
                    k_eq = (k1 * k2) / (k1 + k2)
                  </p>
                  <p className="mt-1.5">When springs are attached end-to-end, they experience the same applied force but cumulative displacement.</p>
                </div>

                <div className="border-t border-slate-900 pt-2.5">
                  <h4 className="font-semibold text-slate-200 mb-1">Equivalent Springs (Parallel):</h4>
                  <p className="font-mono text-purple-300 /80 p-1.5 rounded text-[11px] text-center border border-slate-900">
                    k_eq = k1 + k2
                  </p>
                  <p className="mt-1.5">Parallel springs share the exact same displacement, and the total force is the sum of the individual forces.</p>
                </div>

                <div className="border-t border-slate-900 pt-2.5">
                  <h4 className="font-semibold text-slate-200 mb-1">Elastic Potential Energy:</h4>
                  <p className="font-mono text-purple-300 /80 p-1.5 rounded text-[11px] text-center border border-slate-900">
                    U = 0.5 * k * x^2
                  </p>
                  <p className="mt-1.5">Calculates the work stored in the spring deformation. Graphically represented as a parabola.</p>
                </div>
              </div>}
          </div>
        </section>
      </div>
    </div>;
}
export default function CustomHookesLaw({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden'
  }}>
            
            <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <CustomHookesLawInner onBack={null} title={""} />
            </div>
        </div>;
}