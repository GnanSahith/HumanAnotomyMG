import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, RotateCcw, Sliders, Trash2, Play, Pause, 
  Activity, Lightbulb, Battery, Eye, EyeOff, Scissors, Info
} from 'lucide-react';

// Disjoint Set Union (DSU) for grouping terminals into electrical nodes (junctions)
class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  
  find(i) {
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }
  
  union(i, j) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
      return true;
    }
    return false;
  }
}

// Distance from point (x, y) to line segment (x1, y1) - (x2, y2)
function getDistanceToSegment(x, y, x1, y1, x2, y2) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Resistor color band calculation helper
function getResistorBands(r) {
  if (r <= 0) return ['black', 'black', 'black', 'gold'];
  const exp = Math.floor(Math.log10(r));
  const normalized = r / Math.pow(10, exp);
  const digits = Math.round(normalized * 10);
  let d1 = Math.floor(digits / 10);
  let d2 = digits % 10;
  let mult = exp - 1;
  
  if (d1 > 9) {
    d1 = 1;
    d2 = 0;
    mult += 1;
  }
  
  const colors = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
  const multiplierColors = {
    '-2': 'silver',
    '-1': 'gold',
    '0': 'black',
    '1': 'brown',
    '2': 'red',
    '3': 'orange',
    '4': 'yellow',
    '5': 'green',
    '6': 'blue',
    '7': 'violet',
    '8': 'grey',
    '9': 'white'
  };
  
  const c1 = colors[d1] || 'black';
  const c2 = colors[d2] || 'black';
  const c3 = multiplierColors[mult] || 'black';
  return [c1, c2, c3, 'gold'];
}

// Gaussian elimination linear solver for G * v = i
function solveLinearSystem(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(M[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxEl) {
        maxEl = Math.abs(M[k][i]);
        maxRow = k;
      }
    }
    
    const tmp = M[maxRow];
    M[maxRow] = M[i];
    M[i] = tmp;
    
    if (Math.abs(M[i][i]) < 1e-12) {
      continue;
    }
    
    for (let k = i + 1; k < n; k++) {
      const c = -M[k][i] / M[i][i];
      for (let j = i; j < n + 1; j++) {
        if (i === j) {
          M[k][j] = 0;
        } else {
          M[k][j] += c * M[i][j];
        }
      }
    }
  }
  
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(M[i][i]) < 1e-12) {
      x[i] = 0;
      continue;
    }
    x[i] = M[i][n] / M[i][i];
    for (let k = i - 1; k >= 0; k--) {
      M[k][n] -= M[k][i] * x[i];
    }
  }
  return x;
}

export default function CustomCircuitConstructionKitDCVirtualLab({ onBack, title }) {
  // --- Simulation Settings and States ---
  const [representation, setRepresentation] = useState('lifelike'); // 'lifelike' | 'schematic'
  const [showElectrons, setShowElectrons] = useState(true);
  const [showValues, setShowValues] = useState(true);
  
  const [voltmeterEnabled, setVoltmeterEnabled] = useState(true);
  const [ammeterEnabled, setAmmeterEnabled] = useState(true);
  
  const [activeTab, setActiveTab] = useState('components'); // 'components' | 'tools' | 'settings'
  
  // React components state
  const [components, setComponents] = useState([
    { id: '1', type: 'battery', x1: 150, y1: 150, x2: 270, y2: 150, value: 9, label: 'Battery' },
    { id: '2', type: 'resistor', x1: 270, y1: 150, x2: 390, y2: 150, value: 10, label: 'Resistor' },
    { id: '3', type: 'wire', x1: 390, y1: 150, x2: 390, y2: 270, label: 'Wire' },
    { id: '4', type: 'lightbulb', x1: 390, y1: 270, x2: 270, y2: 270, value: 10, label: 'Light Bulb' },
    { id: '5', type: 'switch', x1: 270, y1: 270, x2: 150, y2: 270, isOpen: false, label: 'Switch' },
    { id: '6', type: 'wire', x1: 150, y1: 270, x2: 150, y2: 150, label: 'Wire' }
  ]);
  
  const [selectedId, setSelectedId] = useState(null);
  const [selectedJunction, setSelectedJunction] = useState(null); // { x, y }
  
  // Real-time calculated values
  const [voltmeterValue, setVoltmeterValue] = useState(0);
  const [ammeterValue, setAmmeterValue] = useState(0);
  
  // Canvas & interaction refs
  const canvasRef = useRef(null);
  const componentsRef = useRef(components);
  const selectedIdRef = useRef(null);
  const selectedJunctionRef = useRef(null);
  const representationRef = useRef(representation);
  const showElectronsRef = useRef(showElectrons);
  const showValuesRef = useRef(showValues);
  const voltmeterEnabledRef = useRef(voltmeterEnabled);
  const ammeterEnabledRef = useRef(ammeterEnabled);
  
  // Probes state (coordinates and connections)
  // Voltmeter starts docked in the sidebar bench area (x > 620)
  const redProbeRef = useRef({ x: 740, y: 120, isDragged: false, snappedTo: null });
  const blackProbeRef = useRef({ x: 670, y: 120, isDragged: false, snappedTo: null });
  // Ammeter starts docked in the sidebar bench area
  const ammeterProbeRef = useRef({ x: 700, y: 340, isDragged: false, snappedTo: null });
  
  const draggedElementRef = useRef(null); // dragging target

  // Sync state to refs for animation loop
  useEffect(() => { componentsRef.current = components; }, [components]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { selectedJunctionRef.current = selectedJunction; }, [selectedJunction]);
  useEffect(() => { representationRef.current = representation; }, [representation]);
  useEffect(() => { showElectronsRef.current = showElectrons; }, [showElectrons]);
  useEffect(() => { showValuesRef.current = showValues; }, [showValues]);
  useEffect(() => { voltmeterEnabledRef.current = voltmeterEnabled; }, [voltmeterEnabled]);
  useEffect(() => { ammeterEnabledRef.current = ammeterEnabled; }, [ammeterEnabled]);

  // --- Solver Logic ---
  const solveCircuit = (comps) => {
    const M = comps.length;
    if (M === 0) return { voltages: [], junctionsCount: 0, rootToJunctionId: {} };
    
    // 1. Group terminals using DSU
    // Terminal 1 is 2*idx, Terminal 2 is 2*idx + 1
    const dsu = new DSU(2 * M);
    
    for (let i = 0; i < 2 * M; i++) {
      const cI = comps[Math.floor(i / 2)];
      const isTI1 = i % 2 === 0;
      const xI = isTI1 ? cI.x1 : cI.x2;
      const yI = isTI1 ? cI.y1 : cI.y2;
      
      for (let j = i + 1; j < 2 * M; j++) {
        const cJ = comps[Math.floor(j / 2)];
        const isTJ1 = j % 2 === 0;
        const xJ = isTJ1 ? cJ.x1 : cJ.x2;
        const yJ = isTJ1 ? cJ.y1 : cJ.y2;
        
        // Connect terminals if they overlap (within 3px snapping margin)
        if (Math.abs(xI - xJ) < 3 && Math.abs(yI - yJ) < 3) {
          dsu.union(i, j);
        }
      }
    }
    
    // Map DSU roots to junction IDs 0..K-1
    const roots = new Set();
    for (let i = 0; i < 2 * M; i++) {
      roots.add(dsu.find(i));
    }
    
    const rootToJunctionId = {};
    let junctionCount = 0;
    roots.forEach(root => {
      rootToJunctionId[root] = junctionCount++;
    });
    
    const K = junctionCount;
    if (K === 0) return { voltages: [], junctionsCount: 0, rootToJunctionId: {} };
    
    // Choose ground junction (negative terminal of the first battery found, or junction 0)
    let groundJunction = 0;
    for (let i = 0; i < M; i++) {
      if (comps[i].type === 'battery') {
        const t1Index = 2 * i; // negative terminal (T1)
        groundJunction = rootToJunctionId[dsu.find(t1Index)];
        break;
      }
    }
    
    // Build Nodal Conductance Matrix G and current vector iVec
    const G = Array.from({ length: K }, () => Array(K).fill(0));
    const iVec = Array(K).fill(0);
    
    // GMIN to ground for stability on isolated/floating nodes
    const GMIN = 1e-9;
    for (let j = 0; j < K; j++) {
      G[j][j] += GMIN;
    }
    
    // Fill conductances & equivalent current sources
    comps.forEach((c, idx) => {
      const A = rootToJunctionId[dsu.find(2 * idx)]; // T1 (negative/left)
      const B = rootToJunctionId[dsu.find(2 * idx + 1)]; // T2 (positive/right)
      
      if (A === B) return; // shorted component
      
      let g = 0;
      if (c.type === 'resistor') {
        g = 1 / c.value;
      } else if (c.type === 'lightbulb') {
        g = 1 / c.value;
      } else if (c.type === 'wire') {
        g = 1 / 0.05; // 0.05 ohm wire resistance
      } else if (c.type === 'switch') {
        g = c.isOpen ? 1e-9 : 1 / 0.05; // open: 1e9 ohm, closed: 0.05 ohm
      } else if (c.type === 'battery') {
        const R_int = 0.1; // 0.1 ohm battery internal resistance
        g = 1 / R_int;
        // Norton equivalent current source: V_batt/R_int flowing from negative to positive inside battery
        iVec[B] += c.value / R_int;
        iVec[A] -= c.value / R_int;
      }
      
      G[A][A] += g;
      G[B][B] += g;
      G[A][B] -= g;
      G[B][A] -= g;
    });
    
    // Enforce ground junction constraint (V_ground = 0)
    for (let j = 0; j < K; j++) {
      G[groundJunction][j] = 0;
    }
    G[groundJunction][groundJunction] = 1;
    iVec[groundJunction] = 0;
    
    // Solve system
    const voltages = solveLinearSystem(G, iVec);
    
    // Calculate branch currents & store voltages on components
    comps.forEach((c, idx) => {
      const A = rootToJunctionId[dsu.find(2 * idx)];
      const B = rootToJunctionId[dsu.find(2 * idx + 1)];
      const vA = voltages[A] || 0;
      const vB = voltages[B] || 0;
      
      c.v1 = vA;
      c.v2 = vB;
      
      if (A === B) {
        c.current = 0;
        return;
      }
      
      if (c.type === 'resistor') {
        c.current = (vA - vB) / c.value;
      } else if (c.type === 'lightbulb') {
        c.current = (vA - vB) / c.value;
      } else if (c.type === 'wire') {
        c.current = (vA - vB) / 0.05;
      } else if (c.type === 'switch') {
        c.current = c.isOpen ? 0 : (vA - vB) / 0.05;
      } else if (c.type === 'battery') {
        c.current = (vA - vB + c.value) / 0.1;
      }
    });
    
    return { voltages, junctionCount, rootToJunctionId, dsu };
  };

  // --- Real-time Animation Loop & Drawing ---
  useEffect(() => {
    let animId;
    let t = 0;
    
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const reps = representationRef.current;
      const showElect = showElectronsRef.current;
      const showVal = showValuesRef.current;
      const voltOn = voltmeterEnabledRef.current;
      const ammOn = ammeterEnabledRef.current;
      const comps = componentsRef.current;
      const selId = selectedIdRef.current;
      const selJunc = selectedJunctionRef.current;
      
      // 1. Solve current circuit state
      const { voltages, rootToJunctionId, dsu } = solveCircuit(comps);
      
      // 2. Draw Circuit Construction Grid
      ctx.fillStyle = '#0f172a'; // Dark slate-900 background
      ctx.fillRect(0, 0, 620, 500);
      
      // Draw GRID dots (20px gap)
      ctx.fillStyle = '#1e293b'; 
      for (let x = 20; x < 620; x += 20) {
        for (let y = 20; y < 500; y += 20) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }
      
      // 3. Draw Tool Bench background
      ctx.fillStyle = '#111827'; // Darker slate-950
      ctx.fillRect(620, 0, 180, 500);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(620, 0);
      ctx.lineTo(620, 500);
      ctx.stroke();
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TOOL BENCH', 710, 25);
      
      // 4. Draw Circuit Components
      comps.forEach((c, idx) => {
        const dx = c.x2 - c.x1;
        const dy = c.y2 - c.y1;
        const L = Math.sqrt(dx * dx + dy * dy);
        const theta = Math.atan2(dy, dx);
        
        ctx.save();
        ctx.translate(c.x1, c.y1);
        ctx.rotate(theta);
        
        if (reps === 'lifelike') {
          // --- LIFELIKE RENDERING ---
          if (c.type === 'wire') {
            // Insulated wire body
            ctx.strokeStyle = '#ca8a04'; // yellow-brown insulated sleeve
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
            
            // Copper connectors
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.arc(L, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(2, -3, 3, 6);
            ctx.fillRect(L - 5, -3, 3, 6);
            
          } else if (c.type === 'battery') {
            const bodyL = L - 16;
            // Cylindrical gradient body
            const grad = ctx.createLinearGradient(8, -10, 8, 10);
            grad.addColorStop(0, '#334155');
            grad.addColorStop(0.3, '#1e293b');
            grad.addColorStop(0.7, '#0f172a');
            grad.addColorStop(1, '#334155');
            ctx.fillStyle = grad;
            ctx.fillRect(8, -10, bodyL, 20);
            
            // Gold ring label area
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(8 + bodyL * 0.15, -10, bodyL * 0.35, 20);
            
            // Terminals (silver cap/base)
            ctx.fillStyle = '#94a3b8'; // negative cap
            ctx.fillRect(8, -10, 3, 20);
            ctx.fillRect(8 + bodyL, -10, 3, 20);
            
            // Positive gold button
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(8 + bodyL + 3, -5, 5, 10);
            
            // Labels
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px sans-serif';
            ctx.fillText('-', 14, 3);
            ctx.fillText('+', 8 + bodyL - 8, 3);
            
            if (showVal) {
              ctx.fillStyle = '#000000';
              ctx.font = '9px sans-serif';
              ctx.fillText(`${c.value}V`, 8 + bodyL * 0.22, 3);
            }
            
          } else if (c.type === 'resistor') {
            const bodyL = L / 2;
            const bodyStart = L / 4;
            
            // Silver leads
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(bodyStart, 0);
            ctx.moveTo(bodyStart + bodyL, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
            
            // Beige resistor cylinder body
            const bodyGrad = ctx.createLinearGradient(bodyStart, -8, bodyStart, 8);
            bodyGrad.addColorStop(0, '#fed7aa'); // orange-200
            bodyGrad.addColorStop(0.5, '#ffedd5'); // orange-100
            bodyGrad.addColorStop(1, '#fed7aa');
            ctx.fillStyle = bodyGrad;
            
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(bodyStart, -8, bodyL, 16, 4);
            } else {
              ctx.rect(bodyStart, -8, bodyL, 16);
            }
            ctx.fill();
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Render color bands
            const stripes = getResistorBands(c.value);
            const stripeW = 3.5;
            const stripePositions = [
              bodyStart + bodyL * 0.2,
              bodyStart + bodyL * 0.4,
              bodyStart + bodyL * 0.6,
              bodyStart + bodyL * 0.8
            ];
            stripes.forEach((color, i) => {
              ctx.fillStyle = color === 'gold' ? '#d97706' : color === 'silver' ? '#cbd5e1' : color;
              ctx.fillRect(stripePositions[i] - stripeW / 2, -8, stripeW, 16);
            });
            
            if (showVal) {
              ctx.fillStyle = '#94a3b8';
              ctx.font = '9px sans-serif';
              ctx.fillText(`${c.value}Ω`, L / 2 - 8, -12);
            }
            
          } else if (c.type === 'lightbulb') {
            const bulbCenter = L / 2;
            
            // Leads
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(bulbCenter - 14, 0);
            ctx.moveTo(bulbCenter + 14, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
            
            // Radial Light Glow behind bulb
            if (c.current && Math.abs(c.current) > 1e-4) {
              const powerVal = Math.min(1, Math.abs(c.current) / 1.5);
              const glowGrad = ctx.createRadialGradient(bulbCenter, 0, 8, bulbCenter, 0, 25 + powerVal * 35);
              glowGrad.addColorStop(0, `rgba(253, 224, 71, ${0.45 * powerVal})`);
              glowGrad.addColorStop(0.5, `rgba(253, 224, 71, ${0.15 * powerVal})`);
              glowGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
              ctx.fillStyle = glowGrad;
              ctx.beginPath();
              ctx.arc(bulbCenter, 0, 25 + powerVal * 35, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Metallic screw base
            ctx.fillStyle = '#64748b';
            ctx.fillRect(bulbCenter - 8, -6, 16, 12);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(bulbCenter - 8, -3); ctx.lineTo(bulbCenter + 8, -3);
            ctx.moveTo(bulbCenter - 8, 1); ctx.lineTo(bulbCenter + 8, 1);
            ctx.stroke();
            
            // Glass envelope outline
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(bulbCenter, -12, 14, Math.PI * 0.15, Math.PI * 0.85, true);
            ctx.stroke();
            
            // Filament
            const isGlowing = c.current && Math.abs(c.current) > 1e-4;
            ctx.strokeStyle = isGlowing ? '#ea580c' : '#94a3b8';
            ctx.lineWidth = isGlowing ? 2.5 : 1.2;
            ctx.beginPath();
            ctx.moveTo(bulbCenter - 4, -6);
            ctx.lineTo(bulbCenter - 2, -14);
            ctx.lineTo(bulbCenter + 2, -14);
            ctx.lineTo(bulbCenter + 4, -6);
            ctx.stroke();
            
            if (showVal) {
              ctx.fillStyle = '#94a3b8';
              ctx.font = '9px sans-serif';
              ctx.fillText(`${c.value}Ω`, bulbCenter - 8, 18);
            }
            
          } else if (c.type === 'switch') {
            // Wood block base
            ctx.fillStyle = '#78350f';
            ctx.fillRect(L / 4, -4, L / 2, 8);
            
            // Metal contact points
            ctx.fillStyle = '#ca8a04';
            ctx.beginPath();
            ctx.arc(L / 3, 0, 4, 0, Math.PI * 2);
            ctx.arc(2 * L / 3, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Copper lever arm
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(L / 3, 0);
            if (c.isOpen) {
              ctx.lineTo(L / 3 + (L / 3) * Math.cos(-Math.PI / 6), (L / 3) * Math.sin(-Math.PI / 6));
            } else {
              ctx.lineTo(2 * L / 3, 0);
            }
            ctx.stroke();
            
            // Leads
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(L / 3, 0);
            ctx.moveTo(2 * L / 3, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
          }
        } else {
          // --- SCHEMATIC RENDERING (Circuit Symbols) ---
          ctx.strokeStyle = '#38bdf8'; // Sky blue schematics
          ctx.lineWidth = 2.5;
          ctx.fillStyle = '#38bdf8';
          
          if (c.type === 'wire') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
          } else if (c.type === 'battery') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(L / 2 - 6, 0);
            ctx.moveTo(L / 2 + 6, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
            
            // Neg plate (short, thick)
            ctx.beginPath();
            ctx.moveTo(L / 2 - 6, -12);
            ctx.lineTo(L / 2 - 6, 12);
            ctx.lineWidth = 5;
            ctx.stroke();
            
            // Pos plate (long, thin)
            ctx.beginPath();
            ctx.moveTo(L / 2 + 6, -20);
            ctx.lineTo(L / 2 + 6, 20);
            ctx.lineWidth = 1.8;
            ctx.stroke();
            
            if (showVal) {
              ctx.fillStyle = '#64748b';
              ctx.font = '9px monospace';
              ctx.fillText(`${c.value}V`, L / 2 - 12, -24);
            }
          } else if (c.type === 'resistor') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(L / 4, 0);
            
            const zigW = (L / 2) / 6;
            for (let i = 0; i < 6; i++) {
              const zx = L / 4 + (i + 0.5) * zigW;
              const zy = (i % 2 === 0) ? -8 : 8;
              ctx.lineTo(zx, zy);
            }
            
            ctx.lineTo(3 * L / 4, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
            
            if (showVal) {
              ctx.fillStyle = '#64748b';
              ctx.font = '9px monospace';
              ctx.fillText(`${c.value}Ω`, L / 2 - 10, -14);
            }
          } else if (c.type === 'lightbulb') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(L / 2 - 12, 0);
            ctx.moveTo(L / 2 + 12, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
            
            // Circle
            ctx.beginPath();
            ctx.arc(L / 2, 0, 12, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner loops/cross
            ctx.beginPath();
            ctx.moveTo(L / 2 - 8, -8);
            ctx.lineTo(L / 2 + 8, 8);
            ctx.moveTo(L / 2 - 8, 8);
            ctx.lineTo(L / 2 + 8, -8);
            ctx.stroke();
            
            if (showVal) {
              ctx.fillStyle = '#64748b';
              ctx.font = '9px monospace';
              ctx.fillText(`${c.value}Ω`, L / 2 - 10, 22);
            }
          } else if (c.type === 'switch') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(L / 3, 0);
            ctx.moveTo(2 * L / 3, 0);
            ctx.lineTo(L, 0);
            ctx.stroke();
            
            // Junction terminals
            ctx.beginPath();
            ctx.arc(L / 3, 0, 3, 0, Math.PI * 2);
            ctx.arc(2 * L / 3, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(L / 3, 0);
            if (c.isOpen) {
              ctx.lineTo(L / 3 + (L / 3) * Math.cos(-Math.PI / 6), (L / 3) * Math.sin(-Math.PI / 6));
            } else {
              ctx.lineTo(2 * L / 3, 0);
            }
            ctx.stroke();
          }
        }
        
        // 5. Draw Animated Electrons
        if (showElect && c.current && Math.abs(c.current) > 1e-4) {
          const spacing = 22;
          // Electron speed proportional to current magnitude (capped for display stability)
          const vel = -c.current * 1.5;
          const offset = (t * vel) % spacing;
          
          let startX = offset;
          while (startX < 0) startX += spacing;
          startX = startX % spacing;
          
          ctx.fillStyle = '#06b6d4'; // bright cyan
          for (let x = startX; x < L; x += spacing) {
            ctx.beginPath();
            ctx.arc(x, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Minus sign on electrons
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x - 1.5, 0);
            ctx.lineTo(x + 1.5, 0);
            ctx.stroke();
          }
        }
        
        ctx.restore();
        
        // 6. Highlight selected component on canvas
        if (c.id === selId) {
          ctx.save();
          ctx.strokeStyle = '#eab308'; // glowing yellow highlight
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          
          // Draw bounding rectangle enclosing the component line
          ctx.beginPath();
          const padding = 15;
          ctx.moveTo(c.x1 - padding, c.y1 - padding);
          ctx.lineTo(c.x2 + padding, c.y2 - padding);
          ctx.lineTo(c.x2 + padding, c.y2 + padding);
          ctx.lineTo(c.x1 - padding, c.y1 + padding);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      });
      
      // 5. Render Terminal Junction Handles
      // Collate terminal coordinates to count overlaps
      const coordsMap = {};
      comps.forEach((c, idx) => {
        const t1Key = `${c.x1.toFixed(1)},${c.y1.toFixed(1)}`;
        const t2Key = `${c.x2.toFixed(1)},${c.y2.toFixed(1)}`;
        
        if (!coordsMap[t1Key]) coordsMap[t1Key] = [];
        coordsMap[t1Key].push({ id: c.id, term: 1, x: c.x1, y: c.y1 });
        
        if (!coordsMap[t2Key]) coordsMap[t2Key] = [];
        coordsMap[t2Key].push({ id: c.id, term: 2, x: c.x2, y: c.y2 });
      });
      
      Object.keys(coordsMap).forEach(key => {
        const list = coordsMap[key];
        const { x, y } = list[0];
        
        // If coordinate lies in construction area, draw handle
        if (x <= 620) {
          const isJuncSelected = selJunc && Math.abs(selJunc.x - x) < 3 && Math.abs(selJunc.y - y) < 3;
          
          if (list.length === 1) {
            // Disconnected terminal (dotted border ring)
            ctx.strokeStyle = '#ef4444'; // Red alarm
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // Connected junction (solid grey/blue circular hub)
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          
          // Selection highlight ring
          if (isJuncSelected) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
      
      // 6. Voltmeter Probes Solving & Drawing
      if (voltOn) {
        const redP = redProbeRef.current;
        const blackP = blackProbeRef.current;
        
        // Match probes to nearest junctions
        let vRed = 0;
        let vBlack = 0;
        let redSnapped = false;
        let blackSnapped = false;
        
        Object.keys(coordsMap).forEach(key => {
          const list = coordsMap[key];
          const { x, y } = list[0];
          const tIdx = list[0].term === 1 ? 2 * comps.findIndex(c => c.id === list[0].id) : 2 * comps.findIndex(c => c.id === list[0].id) + 1;
          const junctionId = rootToJunctionId[dsu.find(tIdx)];
          const volt = voltages[junctionId] || 0;
          
          // Red Probe Snap Check
          if (Math.abs(redP.x - x) < 22 && Math.abs(redP.y - y) < 22 && !redP.isDragged) {
            redP.x = x;
            redP.y = y;
            vRed = volt;
            redSnapped = true;
          }
          
          // Black Probe Snap Check
          if (Math.abs(blackP.x - x) < 22 && Math.abs(blackP.y - y) < 22 && !blackP.isDragged) {
            blackP.x = x;
            blackP.y = y;
            vBlack = volt;
            blackSnapped = true;
          }
        });
        
        // Update display reading
        const diff = vRed - vBlack;
        setVoltmeterValue(diff);
        
        // Draw wires hanging from display (sagging quadratics)
        // Voltmeter display base is at (710, 80)
        // Red probe wire
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // Red transparent wire
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(710, 95);
        ctx.quadraticCurveTo((710 + redP.x) / 2, Math.max(95, redP.y) + 40, redP.x, redP.y);
        ctx.stroke();
        
        // Black probe wire
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)'; // Black transparent wire
        ctx.beginPath();
        ctx.moveTo(710, 95);
        ctx.quadraticCurveTo((710 + blackP.x) / 2, Math.max(95, blackP.y) + 40, blackP.x, blackP.y);
        ctx.stroke();
        
        // Draw Voltmeter display box
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(660, 45, 100, 50, 6);
        else ctx.rect(660, 45, 100, 50);
        ctx.fill();
        ctx.stroke();
        
        // Digital Screen
        ctx.fillStyle = '#020617';
        ctx.fillRect(670, 52, 80, 20);
        ctx.fillStyle = '#22c55e'; // Green digits
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${diff.toFixed(2)} V`, 710, 66);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px sans-serif';
        ctx.fillText('VOLTMETER', 710, 88);
        
        // Draw Probes
        // Red probe
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(redP.x, redP.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.fillText('V+', redP.x, redP.y + 2.5);
        
        // Black probe
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(blackP.x, blackP.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.fillText('V-', blackP.x, blackP.y + 2.5);
        
        // Snapped highlights
        if (redSnapped) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(redP.x, redP.y, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (blackSnapped) {
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(blackP.x, blackP.y, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      // 7. Ammeter Probes Solving & Drawing
      if (ammOn) {
        const ammP = ammeterProbeRef.current;
        let currVal = 0;
        let snapped = false;
        
        // Sensor check: closest component center
        comps.forEach(c => {
          const centerX = (c.x1 + c.x2) / 2;
          const centerY = (c.y1 + c.y2) / 2;
          const dist = Math.hypot(ammP.x - centerX, ammP.y - centerY);
          
          if (dist < 32 && !ammP.isDragged) {
            ammP.x = centerX;
            ammP.y = centerY;
            currVal = Math.abs(c.current || 0);
            snapped = true;
          }
        });
        
        setAmmeterValue(currVal);
        
        // Sagging grey ammeter wire
        // Ammeter display base at (710, 300)
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(710, 315);
        ctx.quadraticCurveTo((710 + ammP.x) / 2, Math.max(315, ammP.y) + 45, ammP.x, ammP.y);
        ctx.stroke();
        
        // Ammeter display box
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(660, 265, 100, 50, 6);
        else ctx.rect(660, 265, 100, 50);
        ctx.fill();
        ctx.stroke();
        
        // Digital Screen
        ctx.fillStyle = '#020617';
        ctx.fillRect(670, 272, 80, 20);
        ctx.fillStyle = '#06b6d4'; // Cyan digits
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${currVal.toFixed(2)} A`, 710, 286);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px sans-serif';
        ctx.fillText('AMMETER', 710, 308);
        
        // Draw loop sensor probe (Cyan ring with crosshairs)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ammP.x, ammP.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        
        // Crosshair lines
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ammP.x - 18, ammP.y); ctx.lineTo(ammP.x + 18, ammP.y);
        ctx.moveTo(ammP.x, ammP.y - 18); ctx.lineTo(ammP.x, ammP.y + 18);
        ctx.stroke();
        
        if (snapped) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(ammP.x, ammP.y, 19, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      animId = requestAnimationFrame(draw);
    };
    
    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  // --- Drag and Drop Mouse Handlers
  const getMouseCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    const renderedWidth = canvas.width * scale;
    const renderedHeight = canvas.height * scale;
    
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const mx = (clientX - rect.left - offsetX) / scale;
    const my = (clientY - rect.top - offsetY) / scale;
    
    return { mx, my };
  };

  const handleMouseDown = (e) => {
    const { mx, my } = getMouseCoordinates(e);
    
    // 1. Check Probes (Voltmeter & Ammeter)
    if (showMeters) {
      // Voltmeter probes
      if (Math.hypot(mx - redProbeRef.current.x, my - redProbeRef.current.y) < 20) {
        draggedElementRef.current = { type: 'voltmeter-red' };
        redProbeRef.current.isDragged = true;
        return;
      }
      if (Math.hypot(mx - blackProbeRef.current.x, my - blackProbeRef.current.y) < 20) {
        draggedElementRef.current = { type: 'voltmeter-black' };
        blackProbeRef.current.isDragged = true;
        return;
      }
      
      // Ammeter probe
      if (Math.hypot(mx - ammeterProbeRef.current.x, my - ammeterProbeRef.current.y) < 25) {
        draggedElementRef.current = { type: 'ammeter-probe' };
        ammeterProbeRef.current.isDragged = true;
        return;
      }
    }
    
    // 2. Terminal Clicks
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      // Check Terminal 1 (negative/start)
      if (Math.hypot(mx - c.x1, my - c.y1) < 12) {
        const shared = [];
        // Gather all other terminals joined at this exact spot
        components.forEach(comp => {
          if (Math.abs(comp.x1 - c.x1) < 1 && Math.abs(comp.y1 - c.y1) < 1) {
            shared.push({ id: comp.id, termIndex: 1 });
          }
          if (Math.abs(comp.x2 - c.x1) < 1 && Math.abs(comp.y2 - c.y1) < 1) {
            shared.push({ id: comp.id, termIndex: 2 });
          }
        });
        
        draggedElementRef.current = { 
          type: 'terminal', 
          id: c.id, 
          termIndex: 1, 
          shared 
        };
        setSelectedJunction({ x: c.x1, y: c.y1 });
        setSelectedId(c.id);
        return;
      }
      
      // Check Terminal 2 (positive/end)
      if (Math.hypot(mx - c.x2, my - c.y2) < 12) {
        const shared = [];
        components.forEach(comp => {
          if (Math.abs(comp.x1 - c.x2) < 1 && Math.abs(comp.y1 - c.y2) < 1) {
            shared.push({ id: comp.id, termIndex: 1 });
          }
          if (Math.abs(comp.x2 - c.x2) < 1 && Math.abs(comp.y2 - c.y2) < 1) {
            shared.push({ id: comp.id, termIndex: 2 });
          }
        });
        
        draggedElementRef.current = { 
          type: 'terminal', 
          id: c.id, 
          termIndex: 2, 
          shared 
        };
        setSelectedJunction({ x: c.x2, y: c.y2 });
        setSelectedId(c.id);
        return;
      }
    }
    
    // 3. Component Body clicks
    let closestComponent = null;
    let minDist = 18;
    components.forEach(c => {
      const dist = getDistanceToSegment(mx, my, c.x1, c.y1, c.x2, c.y2);
      if (dist < minDist) {
        minDist = dist;
        closestComponent = c;
      }
    });
    
    if (closestComponent) {
      draggedElementRef.current = {
        type: 'component',
        id: closestComponent.id,
        offsetX1: closestComponent.x1 - mx,
        offsetY1: closestComponent.y1 - my,
        offsetX2: closestComponent.x2 - mx,
        offsetY2: closestComponent.y2 - my,
        startX: mx,
        startY: my
      };
      setSelectedId(closestComponent.id);
      setSelectedJunction(null);
      return;
    }
    
    // Clear selection if clicking empty canvas
    setSelectedId(null);
    setSelectedJunction(null);
  };

  const handleMouseMove = (e) => {
    if (!draggedElementRef.current) return;
    const { mx, my } = getMouseCoordinates(e);
    
    const drag = draggedElementRef.current;
    
    // Constraint bounds: Keep dragging within canvas
    const cy = Math.max(5, Math.min(canvas.height - 5, my));
    
    if (drag.type === 'voltmeter-red') {
      redProbeRef.current.x = cx;
      redProbeRef.current.y = cy;
      
    } else if (drag.type === 'voltmeter-black') {
      blackProbeRef.current.x = cx;
      blackProbeRef.current.y = cy;
      
    } else if (drag.type === 'ammeter-probe') {
      ammeterProbeRef.current.x = cx;
      ammeterProbeRef.current.y = cy;
      
    } else if (drag.type === 'component') {
      // Move component (both terminals offset by delta)
      const updated = components.map(c => {
        if (c.id === drag.id) {
          return {
            ...c,
            x1: cx + drag.offsetX1,
            y1: cy + drag.offsetY1,
            x2: cx + drag.offsetX2,
            y2: cy + drag.offsetY2
          };
        }
        return c;
      });
      setComponents(updated);
      
    } else if (drag.type === 'terminal') {
      // 1. Move all connected terminals in unison
      let targetX = cx;
      let targetY = cy;
      
      // 2. Perform snapping to any OTHER terminal NOT in the shared list
      let snapTarget = null;
      let snapDist = 18;
      
      components.forEach(comp => {
        const belongsToShared1 = drag.shared.some(s => s.id === comp.id && s.termIndex === 1);
        const belongsToShared2 = drag.shared.some(s => s.id === comp.id && s.termIndex === 2);
        
        if (!belongsToShared1) {
          const d = Math.hypot(cx - comp.x1, cy - comp.y1);
          if (d < snapDist) {
            snapDist = d;
            snapTarget = { x: comp.x1, y: comp.y1 };
          }
        }
        if (!belongsToShared2) {
          const d = Math.hypot(cx - comp.x2, cy - comp.y2);
          if (d < snapDist) {
            snapDist = d;
            snapTarget = { x: comp.x2, y: comp.y2 };
          }
        }
      });
      
      if (snapTarget) {
        targetX = snapTarget.x;
        targetY = snapTarget.y;
      }
      
      // 3. Update the coordinates
      const updated = components.map(c => {
        let nC = { ...c };
        const has1 = drag.shared.some(s => s.id === c.id && s.termIndex === 1);
        const has2 = drag.shared.some(s => s.id === c.id && s.termIndex === 2);
        
        if (has1) {
          nC.x1 = targetX;
          nC.y1 = targetY;
        }
        if (has2) {
          nC.x2 = targetX;
          nC.y2 = targetY;
        }
        return nC;
      });
      
      setComponents(updated);
      setSelectedJunction({ x: targetX, y: targetY });
    }
  };

  const handleMouseUp = (e) => {
    const drag = draggedElementRef.current;
    if (!drag) return;
    
    const { mx } = getMouseCoordinates(e);
    
    // If voltmeter/ammeter probes released in the tool bench, dock them back
    if (drag.type === 'voltmeter-red' || drag.type === 'voltmeter-black') {
      redProbeRef.current.isDragged = false;
      blackProbeRef.current.isDragged = false;
      
      if (mx > 620) {
        redProbeRef.current = { x: 740, y: 120, isDragged: false, snappedTo: null };
        blackProbeRef.current = { x: 670, y: 120, isDragged: false, snappedTo: null };
      }
    } else if (drag.type === 'ammeter-probe') {
      ammeterProbeRef.current.isDragged = false;
      
      if (mx > 620) {
        ammeterProbeRef.current = { x: 700, y: 340, isDragged: false, snappedTo: null };
      }
    } else if (drag.type === 'component') {
      // If switch is clicked (no substantial drag movement), toggle its state
      const c = components.find(comp => comp.id === drag.id);
      if (c && c.type === 'switch') {
        if (Math.abs(mx - drag.startX) < 4) {
          const updated = components.map(comp => {
            if (comp.id === drag.id) {
              return { ...comp, isOpen: !comp.isOpen };
            }
            return comp;
          });
          setComponents(updated);
        }
      }
    }
    
    draggedElementRef.current = null;
  };

  // --- Component Management Handlers ---
  const handleAddComponent = (type) => {
    const spawnX1 = 180 + (components.length * 15) % 150;
    const spawnY1 = 180 + (components.length * 15) % 150;
    
    const newComp = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      x1: spawnX1,
      y1: spawnY1,
      x2: spawnX1 + 120,
      y2: spawnY1,
      value: type === 'battery' ? 9 : 10, // Default 9V battery, 10 ohm resistor/bulb
      isOpen: type === 'switch' ? true : undefined,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    };
    
    const updated = [...components, newComp];
    setComponents(updated);
    setSelectedId(newComp.id);
    setSelectedJunction(null);
  };

  const handleDeleteComponent = (id) => {
    const updated = components.filter(c => c.id !== id);
    setComponents(updated);
    if (selectedId === id) setSelectedId(null);
  };

  const handleUpdateComponentValue = (id, val) => {
    const updated = components.map(c => {
      if (c.id === id) {
        return { ...c, value: val };
      }
      return c;
    });
    setComponents(updated);
  };

  const handleSplitJunction = () => {
    if (!selectedJunction) return;
    const { x, y } = selectedJunction;
    
    // Find all terminals at this coordinate
    const matching = [];
    components.forEach(c => {
      if (Math.abs(c.x1 - x) < 3 && Math.abs(c.y1 - y) < 3) matching.push({ id: c.id, termIndex: 1 });
      if (Math.abs(c.x2 - x) < 3 && Math.abs(c.y2 - y) < 3) matching.push({ id: c.id, termIndex: 2 });
    });
    
    if (matching.length <= 1) return;
    
    // Fan terminals outward radially to break connection
    const updated = components.map(c => {
      let nC = { ...c };
      matching.forEach(({ id, termIndex }, index) => {
        if (c.id === id) {
          const theta = (2 * Math.PI * index) / matching.length;
          const shiftX = 22 * Math.cos(theta);
          const shiftY = 22 * Math.sin(theta);
          
          if (termIndex === 1) {
            nC.x1 = x + shiftX;
            nC.y1 = y + shiftY;
          } else {
            nC.x2 = x + shiftX;
            nC.y2 = y + shiftY;
          }
        }
      });
      return nC;
    });
    
    setComponents(updated);
    setSelectedJunction(null);
  };

  const handleReset = () => {
    const defaultComponents = [
      { id: '1', type: 'battery', x1: 150, y1: 150, x2: 270, y2: 150, value: 9, label: 'Battery' },
      { id: '2', type: 'resistor', x1: 270, y1: 150, x2: 390, y2: 150, value: 10, label: 'Resistor' },
      { id: '3', type: 'wire', x1: 390, y1: 150, x2: 390, y2: 270, label: 'Wire' },
      { id: '4', type: 'lightbulb', x1: 390, y1: 270, x2: 270, y2: 270, value: 10, label: 'Light Bulb' },
      { id: '5', type: 'switch', x1: 270, y1: 270, x2: 150, y2: 270, isOpen: false, label: 'Switch' },
      { id: '6', type: 'wire', x1: 150, y1: 270, x2: 150, y2: 150, label: 'Wire' }
    ];
    setComponents(defaultComponents);
    setSelectedId(null);
    setSelectedJunction(null);
    
    redProbeRef.current = { x: 740, y: 120, isDragged: false, snappedTo: null };
    blackProbeRef.current = { x: 670, y: 120, isDragged: false, snappedTo: null };
    ammeterProbeRef.current = { x: 700, y: 340, isDragged: false, snappedTo: null };
  };

  const handleSetRepresentation = (rep) => {
    setRepresentation(rep);
  };

  // Find currently selected component details
  const selectedComponent = components.find(c => c.id === selectedId);

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        background: '#0a0a1a' 
      }} 
      className="select-none overflow-hidden text-white font-sans"
    >
      <style>{`
        .glass-btn {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          color: white !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          border-radius: 8px !important;
          padding: 10px 20px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .glass-btn-back:hover {
          background: rgba(255, 55, 95, 0.8) !important;
          border-color: #ff375f !important;
        }
        .glass-btn-reset:hover {
          background: rgba(52, 152, 219, 0.4) !important;
          border-color: #3498db !important;
        }
        .ds-slider {
          accent-color: #3498db !important;
        }
      `}</style>

      {/* Top Header Panel */}
      
      
      {/* Canvas Wrapper */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          zIndex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <div className="rounded-2xl border border-slate-850 overflow-hidden shadow-2xl" style={{ pointerEvents: 'auto', position: 'relative',  background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className="cursor-crosshair block"
          />
        </div>
      </div>
      
      {/* Left Side Drawer - Component Box */}
      <aside 
        style={{ 
          position: 'absolute', 
          top: '100px', 
          left: '20px', 
          bottom: '20px', 
          width: '280px',
          background: 'rgba(20, 20, 30, 0.8)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(12px)', 
          padding: '20px', 
          borderRadius: '16px', 
          zIndex: 10, 
          color: 'white', 
          fontFamily: "'Inter', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto',
          pointerEvents: 'auto'
        }}
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Add Elements</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'wire', label: 'Wire', color: 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-300', icon: MinusIcon },
              { type: 'battery', label: 'Battery', color: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300', icon: Battery },
              { type: 'resistor', label: 'Resistor', color: 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-300', icon: Activity },
              { type: 'lightbulb', label: 'Light Bulb', color: 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300', icon: Lightbulb },
              { type: 'switch', label: 'Switch', color: 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300', icon: Sliders }
            ].map(item => (
              <button
                key={item.type}
                onClick={() => handleAddComponent(item.type)}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all hover:scale-103 active:scale-97 text-center font-medium ${item.color}`}
              >
                <item.icon size={22} className="stroke-[2]" />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-8 p-4 rounded-xl border border-slate-800/80" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
              <Info size={14} className="text-[#3498db]" />
              Quick Tips
            </div>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Drag element terminals near each other to snap and connect.</li>
              <li>Drag the middle of an element to disconnect and move it.</li>
              <li>Click a junction hub to select and separate wires.</li>
              <li>Click on a switch to open/close its gate.</li>
            </ul>
          </div>
        </div>
        
        <div className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-4 mt-6">
          Physics Simulator: Nodal Admittance Equation Solver (NA)
        </div>
      </aside>
      
      {/* Right Side Drawer - Inspector & Display Options */}
      <aside 
        style={{ 
          position: 'absolute', 
          top: '100px', 
          right: '20px', 
          bottom: '20px', 
          width: '320px',
          background: 'rgba(20, 20, 30, 0.8)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(12px)', 
          padding: '20px', 
          borderRadius: '16px', 
          zIndex: 10, 
          color: 'white', 
          fontFamily: "'Inter', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto',
          pointerEvents: 'auto'
        }}
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-800/60 pb-1.5 gap-4">
            {['inspector', 'tools', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${activeTab === tab ? 'text-[#3498db] border-b border-[#3498db]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Tab Contents */}
          {activeTab === 'inspector' && (
            <div className="space-y-4">
              {selectedComponent ? (
                <div className="space-y-4 p-4 rounded-xl border border-slate-800/80" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-200 capitalize text-sm">{selectedComponent.type} Editor</h3>
                    <button
                      onClick={() => handleDeleteComponent(selectedComponent.id)}
                      className="text-red-400 hover:text-red-300 p-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all"
                      title="Delete Element"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  
                  {/* Variable adjustment slider */}
                  {(selectedComponent.type === 'battery' || selectedComponent.type === 'resistor' || selectedComponent.type === 'lightbulb') && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span>
                          {selectedComponent.type === 'battery' ? 'Voltage (V)' : 'Resistance (Ω)'}
                        </span>
                        <span className="text-[#3498db] font-mono">
                          {selectedComponent.value} {selectedComponent.type === 'battery' ? 'V' : 'Ω'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={selectedComponent.type === 'battery' ? 0 : 0.5}
                        max={selectedComponent.type === 'battery' ? 120 : 200}
                        step={selectedComponent.type === 'battery' ? 1 : 0.5}
                        value={selectedComponent.value}
                        onChange={(e) => handleUpdateComponentValue(selectedComponent.id, parseFloat(e.target.value))}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer ds-slider" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                      />
                    </div>
                  )}
                  
                  {selectedComponent.type === 'switch' && (
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-xs text-slate-400 font-semibold">Switch State:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedComponent.isOpen ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {selectedComponent.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>
                  )}
                  
                  {/* Real-time metrics */}
                  <div className="border-t border-slate-800/80 pt-3 mt-3 space-y-1.5 text-xs text-slate-400 font-medium">
                    <div className="flex justify-between">
                      <span>Terminal 1 Voltage:</span>
                      <span className="font-mono text-slate-200">{(selectedComponent.v1 || 0).toFixed(2)} V</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Terminal 2 Voltage:</span>
                      <span className="font-mono text-slate-200">{(selectedComponent.v2 || 0).toFixed(2)} V</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/40 pt-1.5 mt-1.5">
                      <span>Branch Current:</span>
                      <span className="font-mono text-[#3498db]">{(selectedComponent.current || 0).toFixed(3)} A</span>
                    </div>
                  </div>
                </div>
              ) : selectedJunction ? (
                <div className="space-y-4 p-4 rounded-xl border border-slate-800/80" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                  <h3 className="font-bold text-slate-200 text-sm">Junction Hub</h3>
                  <p className="text-xs text-slate-400">A node where multiple terminals meet and share electrical potential.</p>
                  
                  <button
                    onClick={handleSplitJunction}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-300 font-semibold text-xs rounded-xl transition-all"
                  >
                    <Scissors size={14} />
                    Split Junction Wires
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-8">
                  Select an element or connected junction in the builder to inspect details and modify properties.
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800/80 space-y-3" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                <h3 className="font-bold text-slate-200 text-sm mb-1">Meters Bench</h3>
                
                {/* Voltmeter Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Voltmeter Tool</span>
                  <button
                    onClick={() => setVoltmeterEnabled(!voltmeterEnabled)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${voltmeterEnabled ? 'bg-[#3498db]' : ''}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${voltmeterEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                {/* Ammeter Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Ammeter Sensor</span>
                  <button
                    onClick={() => setAmmeterEnabled(!ammeterEnabled)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${ammeterEnabled ? 'bg-[#3498db]' : ''}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ammeterEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              
              {/* Simulated Meter Readings */}
              <div className="space-y-3">
                {voltmeterEnabled && (
                  <div className="p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                    <span className="text-slate-400 font-semibold">Voltmeter probe diff:</span>
                    <span className="font-mono font-bold text-green-400 text-sm">{voltmeterValue.toFixed(2)} V</span>
                  </div>
                )}
                {ammeterEnabled && (
                  <div className="p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                    <span className="text-slate-400 font-semibold">Ammeter current:</span>
                    <span className="font-mono font-bold text-[#3498db] text-sm">{ammeterValue.toFixed(2)} A</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800/80 space-y-4" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                <h3 className="font-bold text-slate-200 text-sm">Visual Toggles</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 font-semibold">Show Electron Flow</span>
                    <span className="text-[10px] text-slate-500">Animates moving charge carriers</span>
                  </div>
                  <button
                    onClick={() => setShowElectrons(!showElectrons)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${showElectrons ? 'bg-[#3498db]' : ''}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showElectrons ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 font-semibold">Show Value Labels</span>
                    <span className="text-[10px] text-slate-500">Displays text overlay on components</span>
                  </div>
                  <button
                    onClick={() => setShowValues(!showValues)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${showValues ? 'bg-[#3498db]' : ''}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showValues ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 p-4 rounded-xl border border-slate-850 text-xs text-slate-400 space-y-1.5 font-medium shadow-inner">
          <h4 className="font-bold text-slate-300 text-[10px] uppercase tracking-wider mb-1">General Info</h4>
          <div className="flex justify-between">
            <span>Elements count:</span>
            <span className="font-mono text-slate-200">{components.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Circuit Nodes (K):</span>
            <span className="font-mono text-slate-200">{solveCircuit(components).junctionCount}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

// Simple custom inline icons for components drawer in the sidebar
function MinusIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  );
}
