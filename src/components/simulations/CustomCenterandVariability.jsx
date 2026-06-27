import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Trash2, Plus, Sliders, BarChart3, Shuffle, Info, Settings, BookOpen, ChevronDown, HelpCircle, Sparkles, Check, Play, Pause, Settings2 } from 'lucide-react';

/**
 * CustomCenterandVariability Simulation
 * 
 * An interactive statistical workspace where users can manipulate data points 
 * and observe the corresponding metrics in real-time.
 * 
 * Mathematics involved:
 * 1. Mean (Balance Point): μ = (Σ x_i) / N
 * 2. Median: Middle value of sorted data
 * 3. Mode: Most frequent value(s)
 * 4. Range: Max - Min
 * 5. Standard Deviation (SD): σ = sqrt(Σ (x_i - μ)² / N) (Population) & s = sqrt(Σ (x_i - μ)² / (N-1)) (Sample)
 * 6. Mean Absolute Deviation (MAD): MAD = Σ |x_i - μ| / N
 * 7. Box Plot: Five-number summary (Min, Q1, Median, Q3, Max)
 */

// Helper to generate unique IDs outside the component render path
const generateId = prefix => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

// Helper to generate a random value outside the component render path
const getRandomValue = rangeMax => {
  return Math.floor(Math.random() * (rangeMax + 1));
};

// Helper to build preset distributions outside the component render path
const getPresetData = (presetName, maxVal) => {
  let values = [];
  if (maxVal === 10) {
    switch (presetName) {
      case 'symmetrical':
        values = [3, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9];
        break;
      case 'uniform':
        values = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
        break;
      case 'skewed':
        values = [1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5, 6, 7, 8, 10];
        break;
      case 'bimodal':
        values = [2, 2, 2, 2, 3, 3, 7, 7, 8, 8, 8, 8];
        break;
      case 'random':
        for (let i = 0; i < 15; i++) {
          values.push(Math.floor(Math.random() * 9) + 1);
        }
        break;
      default:
        values = [5];
    }
  } else {
    switch (presetName) {
      case 'symmetrical':
        values = [6, 7, 8, 8, 9, 9, 9, 10, 10, 10, 10, 10, 11, 11, 11, 12, 12, 13, 14];
        break;
      case 'uniform':
        values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
        break;
      case 'skewed':
        values = [2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 7, 8, 9, 11, 13, 15, 18, 20];
        break;
      case 'bimodal':
        values = [3, 4, 4, 5, 5, 5, 6, 6, 14, 14, 15, 15, 15, 16, 16, 17];
        break;
      case 'random':
        for (let i = 0; i < 20; i++) {
          values.push(Math.floor(Math.random() * 17) + 2);
        }
        break;
      default:
        values = [10];
    }
  }
  return values.map((val, idx) => ({
    id: `dot-${presetName}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
    value: val
  }));
};

// Helper to calculate all statistical metrics for a dataset
const calculateStats = points => {
  if (!points || points.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      modes: [],
      min: 0,
      max: 0,
      rangeSpan: 0,
      sd: 0,
      sampleSD: 0,
      mad: 0,
      q1: 0,
      q2: 0,
      q3: 0,
      iqr: 0
    };
  }

  // Sort values ascending
  const values = points.map(p => p.value).sort((a, b) => a - b);
  const count = values.length;

  // Mean
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  // Median (Q2)
  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

  // Mode
  const freqs = {};
  let maxFreq = 0;
  values.forEach(v => {
    freqs[v] = (freqs[v] || 0) + 1;
    if (freqs[v] > maxFreq) {
      maxFreq = freqs[v];
    }
  });
  let modes = [];
  if (maxFreq > 1) {
    // Mode only makes sense if there are repeating values
    modes = Object.keys(freqs).map(Number).filter(key => freqs[key] === maxFreq);
  }

  // Min, Max, Range
  const min = values[0];
  const max = values[count - 1];
  const rangeSpan = max - min;

  // Variance & Standard Deviation
  const varianceSum = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const sd = Math.sqrt(varianceSum / count); // Population SD
  const sampleSD = count > 1 ? Math.sqrt(varianceSum / (count - 1)) : 0; // Sample SD

  // Mean Absolute Deviation (MAD)
  const madSum = values.reduce((acc, val) => acc + Math.abs(val - mean), 0);
  const mad = madSum / count;

  // Box Plot / Quartiles (Exclusive method)
  let lowerHalf, upperHalf;
  if (count % 2 === 0) {
    lowerHalf = values.slice(0, mid);
    upperHalf = values.slice(mid);
  } else {
    lowerHalf = values.slice(0, mid);
    upperHalf = values.slice(mid + 1);
  }
  const getMedianOf = arr => {
    if (arr.length === 0) return 0;
    const h = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[h] : (arr[h - 1] + arr[h]) / 2;
  };
  const q1 = lowerHalf.length > 0 ? getMedianOf(lowerHalf) : min;
  const q2 = median;
  const q3 = upperHalf.length > 0 ? getMedianOf(upperHalf) : max;
  const iqr = q3 - q1;
  return {
    count,
    mean,
    median,
    modes,
    min,
    max,
    rangeSpan,
    sd,
    sampleSD,
    mad,
    q1,
    q2,
    q3,
    iqr
  };
};
function CustomCenterandVariabilityInner({
  onBack,
  title
}) {
  // Config states
  const [rangeMax, setRangeMax] = useState(10); // can be 10 or 20

  // Initialize dataPoints directly with default symmetrical preset for range 10
  const [dataPoints, setDataPoints] = useState(() => getPresetData('symmetrical', 10));

  // Overlay Toggles
  const [showMean, setShowMean] = useState(true);
  const [showMedian, setShowMedian] = useState(true);
  const [showMode, setShowMode] = useState(true);
  const [showRange, setShowRange] = useState(false);
  const [showSD, setShowSD] = useState(false);
  const [showMAD, setShowMAD] = useState(false);
  const [showBoxPlot, setShowBoxPlot] = useState(false);

  // UI Panels states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'theory'

  // Drag and Drop State
  const [draggingDotId, setDraggingDotId] = useState(null);
  const [pointerPos, setPointerPos] = useState({
    x: 0,
    y: 0
  });
  const svgRef = useRef(null);

  // Dynamic radius of dots depending on the axis range to avoid overlap
  const R = rangeMax === 10 ? 14 : 9;

  // Preset distributions builder
  const loadPreset = useCallback((presetName, maxVal = rangeMax) => {
    const points = getPresetData(presetName, maxVal);
    setDataPoints(points);
  }, [rangeMax]);

  // Handle range change inside the event handler to prevent cascading render in useEffect
  const handleRangeChange = newRange => {
    setRangeMax(newRange);
    const points = getPresetData('symmetrical', newRange);
    setDataPoints(points);
  };

  // Statistics calculation memo
  const stats = useMemo(() => calculateStats(dataPoints), [dataPoints]);

  // Stable vertical stacking of dots: sorted by ID so stack indices don't change erratically
  const stackedPoints = useMemo(() => {
    const counts = {};
    const sortedPoints = [...dataPoints].sort((a, b) => a.id.localeCompare(b.id));
    return sortedPoints.map(p => {
      const v = p.value;

      // If this dot is being dragged, exclude it from regular stacking so that
      // other dots in its current column collapse nicely while dragging.
      if (p.id === draggingDotId) {
        return {
          ...p,
          stackIndex: 0
        };
      }
      if (counts[v] === undefined) {
        counts[v] = 0;
      } else {
        counts[v]++;
      }
      return {
        ...p,
        stackIndex: counts[v]
      };
    });
  }, [dataPoints, draggingDotId]);

  // Drag handlers
  const handlePointerDown = (e, dot) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDraggingDotId(dot.id);
    setPointerPos({
      x,
      y
    });
    e.target.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = e => {
    if (!draggingDotId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPointerPos({
      x,
      y
    });

    // Calculate nearest integer column based on horizontal cursor coordinate
    const relativeX = x - 50; // left margin of 50px
    const spacing = 700 / rangeMax; // width is 700px
    let newValue = Math.round(relativeX / spacing);
    newValue = Math.max(0, Math.min(rangeMax, newValue));

    // Update value of the dragged dot in real-time
    setDataPoints(prev => prev.map(p => {
      if (p.id === draggingDotId) {
        return {
          ...p,
          value: newValue
        };
      }
      return p;
    }));
  };
  const handlePointerUp = e => {
    if (!draggingDotId) return;
    e.target.releasePointerCapture(e.pointerId);

    // Delete condition: if dragged to the top-right trash area or dragged far outside vertically
    const isTrash = pointerPos.x > 710 && pointerPos.y < 70;
    const isOutOfVertical = pointerPos.y < 5 || pointerPos.y > 435;
    if (isTrash || isOutOfVertical) {
      setDataPoints(prev => prev.filter(p => p.id !== draggingDotId));
    }
    setDraggingDotId(null);
  };

  // Click to add a new dot at a column
  const handleAddDotAt = value => {
    const currentCount = dataPoints.filter(p => p.value === value).length;
    if (currentCount >= 15) return; // Limit to 15 dots per stack to prevent vertical overflow

    const newId = generateId('dot-added');
    setDataPoints(prev => [...prev, {
      id: newId,
      value
    }]);
  };

  // Add a random dot to the simulation
  const handleAddRandomDot = () => {
    const val = getRandomValue(rangeMax);
    handleAddDotAt(val);
  };

  // Clear all data points
  const handleClearAll = () => {
    setDataPoints([]);
  };

  // Reset all to default (symmetrical preset, standard overlays)
  const handleResetAll = () => {
    setRangeMax(10);
    setShowMean(true);
    setShowMedian(true);
    setShowMode(true);
    setShowRange(false);
    setShowSD(false);
    setShowMAD(false);
    setShowBoxPlot(false);
    const points = getPresetData('symmetrical', 10);
    setDataPoints(points);
  };

  // Delete dot directly via double click
  const handleDoubleClick = dotId => {
    setDataPoints(prev => prev.filter(p => p.id !== dotId));
  };

  // Delete dot directly via right-click
  const handleContextMenu = (e, dotId) => {
    e.preventDefault();
    setDataPoints(prev => prev.filter(p => p.id !== dotId));
  };

  // Calculations for positioning SVG elements
  const spacing = 700 / rangeMax;
  const getXCoord = val => 50 + val * spacing;

  // Guidelines representing 0 to rangeMax columns
  const columns = Array.from({
    length: rangeMax + 1
  }, (_, i) => i);

  // Determine if a column is a mode
  const isColumnMode = val => {
    return showMode && stats.modes.includes(val);
  };

  // Determine if mouse is over the trash area during a drag
  const isOverTrash = draggingDotId && pointerPos.x > 710 && pointerPos.y < 70;
  return <div className="text-white font-sans flex flex-col h-full w-full" style={{
    overflowY: 'auto',
    padding: '20px'
  }}>
      {/* Main Workspace Layout */}
      <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
        
        {/* Top: Interactive SVG Workspace */}
        <div className="flex flex-col space-y-6">
          
          {/* Main Simulation Plot Container */}
          <div className="border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            
            {/* SVG Interactive Workspace */}
            <div className="relative border border-white/5 rounded-xl /80 overflow-hidden select-none">
              <svg ref={svgRef} viewBox="0 0 800 440" className="w-full h-auto max-h-[440px]" onPointerMove={handlePointerMove}>
                {/* 1. Draw Grid Guides and Column Add Targets */}
                {columns.map(val => {
                const cx = getXCoord(val);
                const isMode = isColumnMode(val);
                return <g key={val}>
                      {/* Vertical Grid Line */}
                      <line x1={cx} y1={50} x2={cx} y2={280} stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1.5" />
                      
                      {/* Mode Glow Column Highlight */}
                      {isMode && <rect x={cx - spacing / 2 + 2} y={50} width={spacing - 4} height={230} fill="rgba(234, 179, 8, 0.06)" stroke="rgba(234, 179, 8, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" rx="4" />}

                      {/* Click Target Rect to add a new dot to this column */}
                      <rect x={cx - spacing / 2} y={50} width={spacing} height={230} fill="transparent" className="cursor-cell hover:fill-white/[0.03] transition-colors" onPointerDown={e => {
                    // Prevent triggering if clicked on a dot
                    if (e.target.tagName !== 'circle') {
                      handleAddDotAt(val);
                    }
                  }}>
                        <title>Click to add dot at {val}</title>
                      </rect>
                    </g>;
              })}

                {/* 2. Mode Header Labels */}
                {showMode && stats.count > 0 && stats.modes.map(modeVal => {
                const cx = getXCoord(modeVal);
                return <g key={`mode-label-${modeVal}`} className="pointer-events-none">
                      <rect x={cx - 18} y={32} width={36} height={14} rx="3" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" strokeWidth="0.5" />
                      <text x={cx} y={42} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fef08a">
                        MODE
                      </text>
                    </g>;
              })}

                {/* 3. Box-and-Whisker Plot Overlay */}
                {showBoxPlot && stats.count > 0 && <g className="box-plot-group">
                    {/* Horizontal Line for whiskers */}
                    <line x1={getXCoord(stats.min)} y1={35} x2={getXCoord(stats.max)} y2={35} stroke="#c084fc" strokeWidth="2.5" />
                    {/* Minimum Tick */}
                    <line x1={getXCoord(stats.min)} y1={28} x2={getXCoord(stats.min)} y2={42} stroke="#c084fc" strokeWidth="2.5" />
                    {/* Maximum Tick */}
                    <line x1={getXCoord(stats.max)} y1={28} x2={getXCoord(stats.max)} y2={42} stroke="#c084fc" strokeWidth="2.5" />
                    {/* Interquartile Range (IQR) Box */}
                    <rect x={getXCoord(stats.q1)} y={20} width={getXCoord(stats.q3) - getXCoord(stats.q1)} height={30} fill="rgba(168, 85, 247, 0.25)" stroke="#a855f7" strokeWidth="2.5" rx="3" />
                    {/* Median Line inside Box */}
                    <line x1={getXCoord(stats.q2)} y1={20} x2={getXCoord(stats.q2)} y2={50} stroke="#3b82f6" strokeWidth="3.5" />
                    
                    {/* Box Plot Labels */}
                    <text x={getXCoord(stats.min)} y={15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#d8b4fe">{stats.min}</text>
                    <text x={getXCoord(stats.q1)} y={15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#d8b4fe">{stats.q1}</text>
                    <text x={getXCoord(stats.q2)} y={62} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#60a5fa">Med: {stats.q2}</text>
                    <text x={getXCoord(stats.q3)} y={15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#d8b4fe">{stats.q3}</text>
                    <text x={getXCoord(stats.max)} y={15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#d8b4fe">{stats.max}</text>
                  </g>}

                {/* 4. X-Axis and Labels */}
                <line x1={50} y1={280} x2={750} y2={280} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                
                {columns.map(val => {
                const cx = getXCoord(val);
                return <g key={`axis-label-${val}`} className="pointer-events-none">
                      <line x1={cx} y1={280} x2={cx} y2={287} stroke="#475569" strokeWidth="2" />
                      <text x={cx} y={302} textAnchor="middle" fontSize="11" fontWeight="semibold" fill="#94a3b8">
                        {val}
                      </text>
                    </g>;
              })}

                {/* 5. Median Pointer Indicator */}
                {showMedian && stats.count > 0 && <g className="pointer-events-none">
                    <line x1={getXCoord(stats.median)} y1={65} x2={getXCoord(stats.median)} y2={280} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
                    <path d={`M ${getXCoord(stats.median)},245 L ${getXCoord(stats.median)},278 M ${getXCoord(stats.median) - 6},270 L ${getXCoord(stats.median)},278 L ${getXCoord(stats.median) + 6},270`} stroke="#2563eb" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x={getXCoord(stats.median) - 35} y={223} width={70} height={18} rx="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                    <text x={getXCoord(stats.median)} y={235} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#93c5fd">
                      Median: {stats.median}
                    </text>
                  </g>}

                {/* 6. Mean Fulcrum / Balance Point Indicator */}
                {showMean && stats.count > 0 && <g>
                    {/* Vertical guideline */}
                    <line x1={getXCoord(stats.mean)} y1={50} x2={getXCoord(stats.mean)} y2={280} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" className="pointer-events-none" />
                    {/* Fulcrum Triangle */}
                    <polygon points={`${getXCoord(stats.mean)},280 ${getXCoord(stats.mean) - 14},300 ${getXCoord(stats.mean) + 14},300`} fill="#10b981" stroke="#047857" strokeWidth="1.5" />
                    {/* Balance point label */}
                    <rect x={getXCoord(stats.mean) - 40} y={304} width={80} height={18} rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                    <text x={getXCoord(stats.mean)} y={316} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#a7f3d0">
                      Mean: {stats.mean.toFixed(2)}
                    </text>
                  </g>}

                {/* 7. Spread Indicators under the axis */}
                {/* 7a. Range Bracket */}
                {showRange && stats.count > 0 && <g className="pointer-events-none">
                    <line x1={getXCoord(stats.min)} y1={335} x2={getXCoord(stats.max)} y2={335} stroke="#f43f5e" strokeWidth="2.5" />
                    <line x1={getXCoord(stats.min)} y1={330} x2={getXCoord(stats.min)} y2={340} stroke="#f43f5e" strokeWidth="2.5" />
                    <line x1={getXCoord(stats.max)} y1={330} x2={getXCoord(stats.max)} y2={340} stroke="#f43f5e" strokeWidth="2.5" />
                    <text x={getXCoord((stats.min + stats.max) / 2)} y={352} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fda4af">
                      Range Span: {stats.rangeSpan} ({stats.min} to {stats.max})
                    </text>
                  </g>}

                {/* 7b. Standard Deviation Bar */}
                {showSD && stats.count > 0 && <g className="pointer-events-none">
                    <line x1={getXCoord(Math.max(0, stats.mean - stats.sd))} y1={370} x2={getXCoord(Math.min(rangeMax, stats.mean + stats.sd))} y2={370} stroke="#06b6d4" strokeWidth="3.5" />
                    <line x1={getXCoord(Math.max(0, stats.mean - stats.sd))} y1={364} x2={getXCoord(Math.max(0, stats.mean - stats.sd))} y2={376} stroke="#06b6d4" strokeWidth="2" />
                    <line x1={getXCoord(Math.min(rangeMax, stats.mean + stats.sd))} y1={364} x2={getXCoord(Math.min(rangeMax, stats.mean + stats.sd))} y2={376} stroke="#06b6d4" strokeWidth="2" />
                    <circle cx={getXCoord(stats.mean)} cy={370} r="4" fill="#22d3ee" stroke="#0891b2" strokeWidth="1" />
                    <text x={getXCoord(stats.mean)} y={387} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#a5f3fc">
                      SD (Mean ± 1σ): [{(stats.mean - stats.sd).toFixed(2)}, {(stats.mean + stats.sd).toFixed(2)}] (σ = {stats.sd.toFixed(2)})
                    </text>
                  </g>}

                {/* 7c. Mean Absolute Deviation (MAD) Bar */}
                {showMAD && stats.count > 0 && <g className="pointer-events-none">
                    <line x1={getXCoord(Math.max(0, stats.mean - stats.mad))} y1={410} x2={getXCoord(Math.min(rangeMax, stats.mean + stats.mad))} y2={410} stroke="#e11d48" strokeWidth="3.5" strokeDasharray="2 2" />
                    <line x1={getXCoord(Math.max(0, stats.mean - stats.mad))} y1={404} x2={getXCoord(Math.max(0, stats.mean - stats.mad))} y2={416} stroke="#e11d48" strokeWidth="2" />
                    <line x1={getXCoord(Math.min(rangeMax, stats.mean + stats.mad))} y1={404} x2={getXCoord(Math.min(rangeMax, stats.mean + stats.mad))} y2={416} stroke="#e11d48" strokeWidth="2" />
                    <circle cx={getXCoord(stats.mean)} cy={410} r="3.5" fill="#fb7185" stroke="#be123c" strokeWidth="1" />
                    <text x={getXCoord(stats.mean)} y={427} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fecdd3">
                      MAD Range: [{(stats.mean - stats.mad).toFixed(2)}, {(stats.mean + stats.mad).toFixed(2)}] (MAD = {stats.mad.toFixed(2)})
                    </text>
                  </g>}

                {/* 8. Drag and Drop Interactive Dots */}
                {stackedPoints.map(dot => {
                const isDragging = dot.id === draggingDotId;

                // Coordinate evaluation
                let cx, cy;
                if (isDragging) {
                  cx = pointerPos.x;
                  cy = pointerPos.y;
                } else {
                  cx = getXCoord(dot.value);
                  // Dots stack vertically upwards from the X axis line (y=280)
                  // The first dot sits at 280 - R. The second at 280 - 3R, etc.
                  // Adding a 2px vertical gap to make them render nicely.
                  cy = 280 - R - dot.stackIndex * (2 * R + 2);
                }
                return <g key={dot.id}>
                      <circle cx={cx} cy={cy} r={R} fill={isDragging ? '#f43f5e' : isColumnMode(dot.value) ? '#eab308' : '#3b82f6'} stroke={isDragging ? '#ffe4e6' : isColumnMode(dot.value) ? '#fef08a' : '#93c5fd'} strokeWidth={isDragging ? 2.5 : 1.5} className={`cursor-grab active:cursor-grabbing transition-colors duration-150 drop-shadow-md`} onPointerDown={e => handlePointerDown(e, dot)} onPointerUp={handlePointerUp} onDoubleClick={() => handleDoubleClick(dot.id)} onContextMenu={e => handleContextMenu(e, dot.id)}>
                        <title>
                          {isDragging ? 'Dragging...' : `Value: ${dot.value}\n• Double-click or Right-click to remove\n• Drag horizontally to move`}
                        </title>
                      </circle>
                      {/* Inside numerical tag for large dots */}
                      {rangeMax === 10 && !isDragging && <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff" className="pointer-events-none select-none">
                          {dot.value}
                        </text>}
                    </g>;
              })}

                {/* 9. Visual Trash Bin Overlay */}
                {draggingDotId && <g transform="translate(730, 15)" className={`transition-all duration-200 ${isOverTrash ? 'text-red-500 scale-105' : 'text-slate-500'}`}>
                    <rect width="54" height="54" rx="12" fill={isOverTrash ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.7)'} stroke={isOverTrash ? '#ef4444' : '#475569'} strokeWidth={isOverTrash ? 2 : 1.5} />
                    <foreignObject x="15" y="15" width="24" height="24">
                      <Trash2 size={24} className={isOverTrash ? 'text-red-500 animate-bounce' : 'text-slate-400'} />
                    </foreignObject>
                    <text x="27" y="62" fontSize="7" fontWeight="bold" textAnchor="middle" fill={isOverTrash ? '#f87171' : '#94a3b8'}>
                      TRASH
                    </text>
                  </g>}
              </svg>

              {/* Empty state alert */}
              {stats.count === 0 && <div className="absolute inset-0 flex flex-col items-center justify-center /60 backdrop-blur-sm pointer-events-none">
                  <BarChart3 className="text-slate-500 animate-pulse mb-3" size={48} />
                  <p className="text-sm text-slate-400 font-semibold">Workspace is empty!</p>
                  <p className="text-xs text-slate-500 mt-1">Click columns below or select a Preset distribution to load data.</p>
                </div>}
            </div>

            {/* Quick Helper Guideline */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>Click column grid to add dot</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span>Drag dots to change values</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Double-click / drag off to delete</span>
              </div>
            </div>

          </div>

          {/* Educational Dashboard / Stats Display Tabs */}
          <div className="border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl flex-1 flex flex-col" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            <div className="flex /50 border-b border-white/10">
              <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 text-center text-sm font-semibold transition-all cursor-pointer border-b-2 ${activeTab === 'summary' ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Statistical Analysis
              </button>
              <button onClick={() => setActiveTab('theory')} className={`flex-1 py-3 text-center text-sm font-semibold transition-all cursor-pointer border-b-2 ${activeTab === 'theory' ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Math Formula & Concepts
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-[280px]">
              {activeTab === 'summary' ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Mean block */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Mean (μ)</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1">
                      {stats.count > 0 ? stats.mean.toFixed(3) : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-2">The center of gravity (balance point)</span>
                  </div>

                  {/* Median block */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Median (Q2)</span>
                    <span className="text-2xl font-black text-blue-400 mt-1">
                      {stats.count > 0 ? stats.median.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-2">The middle value dividing data 50/50</span>
                  </div>

                  {/* Mode block */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Mode</span>
                    <span className="text-2xl font-black text-yellow-400 mt-1 truncate">
                      {stats.modes.length > 0 ? stats.modes.join(', ') : 'None'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-2">Value(s) with highest count</span>
                  </div>

                  {/* Data count block */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Data Size (N)</span>
                    <span className="text-2xl font-black text-purple-400 mt-1">
                      {stats.count}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-2">Total dots currently on axis</span>
                  </div>

                  {/* Standard Deviation block */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between col-span-1" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Std Dev (σ)</span>
                    <span className="text-xl font-bold text-cyan-400 mt-1">
                      {stats.count > 0 ? `Pop: ${stats.sd.toFixed(2)}` : 'N/A'}
                    </span>
                    <span className="text-xs text-cyan-500 mt-0.5">
                      {stats.count > 1 ? `Sam: ${stats.sampleSD.toFixed(2)}` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Average spread from the mean</span>
                  </div>

                  {/* MAD block */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">MAD</span>
                    <span className="text-xl font-bold text-rose-400 mt-1">
                      {stats.count > 0 ? stats.mad.toFixed(2) : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-2">Mean Absolute Deviation</span>
                  </div>

                  {/* Quartiles block */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between col-span-2" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Quartiles & IQR</span>
                    <div className="grid grid-cols-3 gap-1 mt-1 text-xs font-mono">
                      <div>Q1: <span className="text-purple-400">{stats.count > 0 ? stats.q1.toFixed(1) : 'N/A'}</span></div>
                      <div>Q3: <span className="text-purple-400">{stats.count > 0 ? stats.q3.toFixed(1) : 'N/A'}</span></div>
                      <div>IQR: <span className="text-purple-400">{stats.count > 0 ? stats.iqr.toFixed(1) : 'N/A'}</span></div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2">IQR represents the middle 50% range</span>
                  </div>
                </div> : <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px',
              lineHeight: '1.6',
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              padding: '20px',
              borderRadius: '16px'
            }}>
                  <h4 style={{
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '12px',
                margin: 0
              }}>
                    <Info size={18} color="#3498db" /> Math Formula & Concepts
                  </h4>
                  
                  <div>
                    <h5 style={{
                  color: '#3498db',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontSize: '15px'
                }}>1. Mean (Arithmetic Average)</h5>
                    <p style={{
                  margin: '0 0 12px 0'
                }}>Calculates the balance point of the system. If you imagine the axis as a see-saw and each dot as a block of equal weight, the mean is where the fulcrum must be placed to keep it perfectly level.</p>
                    <code style={{
                  display: 'block',
                  padding: '12px',
                  background: 'rgba(20, 20, 30, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#2ecc71',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>Formula: μ = (Σ x_i) / N</code>
                  </div>
                  <hr style={{
                border: 'none',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                margin: 0
              }} />
                  <div>
                    <h5 style={{
                  color: '#3498db',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontSize: '15px'
                }}>2. Median (Q2 / Middle Value)</h5>
                    <p style={{
                  margin: '0 0 12px 0'
                }}>The value dividing the sorted dataset exactly in half. Unlike the mean, the median is highly resistant to extreme outliers.</p>
                    <code style={{
                  display: 'block',
                  padding: '12px',
                  background: 'rgba(20, 20, 30, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#2ecc71',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>Formula: Value at index (N+1)/2 if N is odd; average of two middle values if N is even.</code>
                  </div>
                  <hr style={{
                border: 'none',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                margin: 0
              }} />
                  <div>
                    <h5 style={{
                  color: '#3498db',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontSize: '15px'
                }}>3. Standard Deviation (σ)</h5>
                    <p style={{
                  margin: '0 0 12px 0'
                }}>Measures standard variability. Tells you how far data points typically sit from the mean. Roughly 68% of normal data falls within 1 SD.</p>
                    <code style={{
                  display: 'block',
                  padding: '12px',
                  background: 'rgba(20, 20, 30, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#2ecc71',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>Population Formula: σ = √[ Σ(x_i - μ)² / N ]</code>
                  </div>
                  <hr style={{
                border: 'none',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                margin: 0
              }} />
                  <div>
                    <h5 style={{
                  color: '#3498db',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontSize: '15px'
                }}>4. Mean Absolute Deviation (MAD)</h5>
                    <p style={{
                  margin: '0 0 12px 0'
                }}>Similar to Standard Deviation, MAD represents the average of absolute deviations from the mean. It is simpler to calculate and has no squaring step.</p>
                    <code style={{
                  display: 'block',
                  padding: '12px',
                  background: 'rgba(20, 20, 30, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#2ecc71',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>Formula: MAD = [ Σ|x_i - μ| ] / N</code>
                  </div>
                </div>}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Sliders, Preset Toggles & Controls */}
        <div className="space-y-6">
          
          {/* Preset distributions panel */}
          <section className="border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Sparkles size={16} className="text-sky-400" />
              <h2 className="font-bold text-sm text-slate-200">Distribution Presets</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button onClick={() => loadPreset('symmetrical')} className="py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl font-semibold transition-all cursor-pointer" style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }}>
                Symmetrical
              </button>
              <button onClick={() => loadPreset('uniform')} className="py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl font-semibold transition-all cursor-pointer" style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }}>
                Uniform
              </button>
              <button onClick={() => loadPreset('skewed')} className="py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl font-semibold transition-all cursor-pointer" style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }}>
                Skewed Right
              </button>
              <button onClick={() => loadPreset('bimodal')} className="py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl font-semibold transition-all cursor-pointer" style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }}>
                Bimodal
              </button>
              <button onClick={() => loadPreset('random')} className="py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 rounded-xl font-semibold transition-all cursor-pointer col-span-2 flex items-center justify-center gap-1.5">
                <Shuffle size={12} />
                Generate Random
              </button>
            </div>
          </section>

          {/* Interactive overlays selector */}
          <section className="border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Sliders size={16} className="text-sky-400" />
              <h2 className="font-bold text-sm text-slate-200">Interactive Overlays</h2>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              
              {/* Box Plot Switch */}
              <label className="flex items-center justify-between p-2 /40 rounded-xl border border-white/5 cursor-pointer hover:/60 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
                  <span>Box-and-Whisker Plot</span>
                </span>
                <input type="checkbox" checked={showBoxPlot} onChange={e => setShowBoxPlot(e.target.checked)} className="accent-purple-500" />
              </label>

              {/* Mean Switch */}
              <label className="flex items-center justify-between p-2 /40 rounded-xl border border-white/5 cursor-pointer hover:/60 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                  <span>Mean Fulcrum & Line</span>
                </span>
                <input type="checkbox" checked={showMean} onChange={e => setShowMean(e.target.checked)} className="accent-emerald-500" />
              </label>

              {/* Median Switch */}
              <label className="flex items-center justify-between p-2 /40 rounded-xl border border-white/5 cursor-pointer hover:/60 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                  <span>Median Pointer & Line</span>
                </span>
                <input type="checkbox" checked={showMedian} onChange={e => setShowMedian(e.target.checked)} className="accent-blue-500" />
              </label>

              {/* Mode Switch */}
              <label className="flex items-center justify-between p-2 /40 rounded-xl border border-white/5 cursor-pointer hover:/60 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500"></span>
                  <span>Highlight Mode Stacks</span>
                </span>
                <input type="checkbox" checked={showMode} onChange={e => setShowMode(e.target.checked)} className="accent-yellow-500" />
              </label>

              {/* Range Switch */}
              <label className="flex items-center justify-between p-2 /40 rounded-xl border border-white/5 cursor-pointer hover:/60 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  <span>Range Indicator Bar</span>
                </span>
                <input type="checkbox" checked={showRange} onChange={e => setShowRange(e.target.checked)} className="accent-rose-500" />
              </label>

              {/* Standard Deviation Switch */}
              <label className="flex items-center justify-between p-2 /40 rounded-xl border border-white/5 cursor-pointer hover:/60 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
                  <span>Standard Deviation (SD)</span>
                </span>
                <input type="checkbox" checked={showSD} onChange={e => setShowSD(e.target.checked)} className="accent-cyan-500" />
              </label>

              {/* MAD Switch */}
              <label className="flex items-center justify-between p-2 /40 rounded-xl border border-white/5 cursor-pointer hover:/60 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400"></span>
                  <span>MAD Indicator Bar</span>
                </span>
                <input type="checkbox" checked={showMAD} onChange={e => setShowMAD(e.target.checked)} className="accent-rose-400" />
              </label>

            </div>
          </section>

          {/* Settings / Manipulation panel */}
          <section className="border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Settings size={16} className="text-sky-400" />
              <h2 className="font-bold text-sm text-slate-200">Workspace Settings</h2>
            </div>

            <div className="space-y-4">
              {/* Range Toggle */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-semibold block">Axis Value Range:</span>
                <div className="grid grid-cols-2 gap-2 /60 p-1 border border-white/5 rounded-xl">
                  <button onClick={() => handleRangeChange(10)} className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${rangeMax === 10 ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                    0 to 10
                  </button>
                  <button onClick={() => handleRangeChange(20)} className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${rangeMax === 20 ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                    0 to 20
                  </button>
                </div>
              </div>

              {/* Data Manipulation Buttons */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <button onClick={handleAddRandomDot} className="w-full py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                  <Plus size={14} />
                  Add Random Dot
                </button>
                
                <button onClick={handleClearAll} className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <Trash2 size={14} />
                  Clear Workspace
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Footer / Educational attribution */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-white/5">
        Interactive Center and Variability Lab • Built with React and SVG Vector Drawing
      </footer>

      {/* educational information modal */}
      {showInfoModal && <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6" style={{
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        color: 'white'
      }}>
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2 bg-sky-500/20 ring-1 ring-sky-500/30 rounded-xl">
                <BookOpen className="text-sky-400" size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">How to Use the Statistics Workspace</h2>
            </div>

            <div className="space-y-4 text-slate-300 text-xs leading-relaxed max-h-[350px] overflow-y-auto pr-2">
              <section className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5" style={{
            background: 'rgba(20, 20, 30, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            color: 'white'
          }}>
                <h3 className="font-bold text-white text-sm">Manipulating Data Points</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-400 mt-1">
                  <li><strong className="text-slate-200">Add Dot:</strong> Hover over the SVG grid and click anywhere in a column to add a dot at the top of that stack.</li>
                  <li><strong className="text-slate-200">Drag Dot:</strong> Drag any dot horizontally to move it to a different column. You will see all statistics update in real-time as you slide the dot.</li>
                  <li><strong className="text-slate-200">Delete Dot:</strong> Double-click a dot, right-click it, or drag it into the TRASH BIN in the top-right corner to remove it.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-white text-sm">Statistical Metrics Explained</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                  <div className="p-2.5 /40 rounded-lg border border-white/5">
                    <strong className="text-emerald-400 block text-xs">Mean (μ - Green Triangle)</strong>
                    The balance point of the data. Represents the sum of all values divided by count. If every dot had equal weight on a board, this is where it would sit perfectly level.
                  </div>

                  <div className="p-2.5 /40 rounded-lg border border-white/5">
                    <strong className="text-blue-400 block text-xs">Median (Med - Blue Pointer)</strong>
                    The middle value of the sorted data. Divides the data set so that 50% of values are below it and 50% are above. It is not skewed by outliers.
                  </div>

                  <div className="p-2.5 /40 rounded-lg border border-white/5">
                    <strong className="text-yellow-400 block text-xs">Mode (Mode - Yellow Outline)</strong>
                    The value that appears most frequently. A dataset can have one mode, multiple modes (bimodal/multimodal), or no mode if no values repeat.
                  </div>

                  <div className="p-2.5 /40 rounded-lg border border-white/5">
                    <strong className="text-cyan-400 block text-xs">Std Deviation (σ - Cyan Bracket)</strong>
                    Measures standard variability. Tells you how far data points typically sit from the mean. Roughly 68% of normal data falls within 1 SD.
                  </div>

                  <div className="p-2.5 /40 rounded-lg border border-white/5 col-span-1 md:col-span-2">
                    <strong className="text-purple-400 block text-xs">Box-and-Whisker Plot</strong>
                    Displays a five-number summary: Min, Quartile 1 (Q1), Median (Q2), Quartile 3 (Q3), and Max. The box holds the middle 50% of the dataset, and the whiskers show the total range of the data.
                  </div>
                </div>
              </section>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button onClick={() => setShowInfoModal(false)} className="bg-white hover: active: text-slate-900 font-bold px-6 py-2.5 rounded-full transition-all text-xs cursor-pointer">
                Got it!
              </button>
            </div>
          </div>
        </div>}

    </div>;
}
export default function CustomCenterandVariability({
  onBack,
  title
}) {
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}>
            <style>{`
                .glass-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    color: white;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .glass-btn:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-1px); }
                .glass-btn:active { transform: translateY(1px); }
                .glass-btn-blue { background: rgba(52, 152, 219, 0.15); border-color: rgba(52, 152, 219, 0.3); color: #3498db; }
                .glass-btn-blue:hover { background: rgba(52, 152, 219, 0.25); }
                .reset-btn { background: rgba(231, 76, 60, 0.2); border-color: rgba(231, 76, 60, 0.3); color: #e74c3c; }
                .reset-btn:hover { background: rgba(231, 76, 60, 0.3); }
            `}</style>

            {/* Standardized Header */}
            <div style={{
      height: '80px',
      flexShrink: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      zIndex: 10
    }}>
                 <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center'
      }}>
                     {onBack && <button onClick={onBack} className="glass-btn">
                             <ArrowLeft size={16} /> Back
                         </button>}
                 </div>
                 <div>
                     <h2 style={{
          color: 'white',
          fontFamily: "'Inter', sans-serif",
          fontSize: '24px',
          fontWeight: '600',
          margin: 0
        }}>
                         {title || 'Center and Variability MG'}
                     </h2>
                 </div>
                 <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        alignItems: 'center'
      }}>
                     {/* Placeholder for flex alignment. Inner component has reset button? Let's check inner component. */}
                 </div>
            </div>

            <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
                 <CustomCenterandVariabilityInner onBack={null} title={""} />
            </div>
        </div>;
}