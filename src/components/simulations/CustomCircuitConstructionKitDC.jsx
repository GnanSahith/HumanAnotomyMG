import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Zap, ZapOff, Sliders, Activity, Power, Lightbulb, Layers, Trash2, Plus, HelpCircle, Check, Eye, Settings, Sparkles, AlertCircle, Play, Pause, Settings2 } from 'lucide-react';

// Gaussian elimination solver with pivoting for robust MNA
function solveLinearSystem(A, Z) {
  const n = Z.length;
  const mat = A.map((row, i) => [...row, Z[i]]);
  for (let i = 0; i < n; i++) {
    // Find pivot row
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(mat[k][i]) > Math.abs(mat[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    const temp = mat[i];
    mat[i] = mat[maxRow];
    mat[maxRow] = temp;

    // Check for singular matrix (or extremely close)
    if (Math.abs(mat[i][i]) < 1e-12) {
      continue;
    }

    // Row reduction
    for (let k = i + 1; k < n; k++) {
      const factor = mat[k][i] / mat[i][i];
      for (let j = i; j <= n; j++) {
        mat[k][j] -= factor * mat[i][j];
      }
    }
  }

  // Back substitution
  const X = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(mat[i][i]) < 1e-12) {
      X[i] = 0;
      continue;
    }
    let sum = mat[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= mat[i][j] * X[j];
    }
    X[i] = sum / mat[i][i];
  }
  return X;
}
let audioCtx = null;
const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};
const playSound = type => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (type === 'connect') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'burnout') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(100, now);
      osc1.frequency.linearRampToValueAtTime(20, now + 0.5);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(300, now);
      osc2.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain2.gain.setValueAtTime(0.15, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.start(now);
      osc1.stop(now + 0.5);
      osc2.start(now);
      osc2.stop(now + 0.3);
    }
  } catch (e) {
    console.warn('Web Audio API playSound failed:', e);
  }
};

// Convert resistance to standard 3-band color code
const getResistorColors = value => {
  const colorMap = ['#000000',
  // black 0
  '#8b5a2b',
  // brown 1
  '#ef4444',
  // red 2
  '#f97316',
  // orange 3
  '#eab308',
  // yellow 4
  '#22c55e',
  // green 5
  '#3b82f6',
  // blue 6
  '#a855f7',
  // violet 7
  '#6b7280',
  // grey 8
  '#ffffff' // white 9
  ];
  if (value < 0.1) return ['#000000', '#000000', '#000000'];
  const str = value.toExponential(1); // e.g. "4.7e+1"
  const matches = str.match(/^(\d)\.(\d)e\+?(-?\d+)$/);
  if (!matches) return ['#8b5a2b', '#000000', '#000000'];
  const d1 = parseInt(matches[1]);
  const d2 = parseInt(matches[2]);
  const exp = parseInt(matches[3]);
  const multExp = exp - 1;
  let multColor = '#000000';
  if (multExp === -1) multColor = '#ffd700'; // gold multiplier
  else if (multExp === -2) multColor = '#c0c0c0'; // silver multiplier
  else if (multExp >= 0 && multExp <= 9) multColor = colorMap[multExp];
  return [colorMap[d1], colorMap[d2], multColor];
};
export default function CustomCircuitConstructionKitDC({
  onBack,
  title
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const wasSnappedRef = useRef(false);

  // States
  const [components, setComponents] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [dragging, setDragging] = useState(null); // { type, compId, termNum, offsetX, offsetY }

  // UI controls
  const [currentFlowType, setCurrentFlowType] = useState('electrons'); // 'electrons', 'conventional', 'none'
  const [isSchematic, setIsSchematic] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showVoltmeter, setShowVoltmeter] = useState(false);
  const [showAmmeter, setShowAmmeter] = useState(false);

  // Tool probe positions
  const [voltmeterBox, setVoltmeterBox] = useState({
    x: 620,
    y: 350
  });
  const [voltmeterRed, setVoltmeterRed] = useState({
    x: 600,
    y: 450
  });
  const [voltmeterBlack, setVoltmeterBlack] = useState({
    x: 670,
    y: 450
  });
  const [ammeterProbe, setAmmeterProbe] = useState({
    x: 620,
    y: 250
  });

  // Simulation warnings / notifications
  const [burnoutNotice, setBurnoutNotice] = useState(null);

  // Presets definition
  const loadPreset = presetName => {
    setSelectedCompId(null);
    setBurnoutNotice(null);
    if (presetName === 'simple') {
      setComponents([{
        id: 'bat_1',
        type: 'battery',
        x1: 200,
        y1: 400,
        x2: 350,
        y2: 400,
        value: 9,
        label: 'Battery',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_1',
        type: 'wire',
        x1: 350,
        y1: 400,
        x2: 500,
        y2: 400,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'sw_1',
        type: 'switch',
        x1: 500,
        y1: 400,
        x2: 500,
        y2: 250,
        value: 0,
        label: 'Switch',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'bulb_1',
        type: 'bulb',
        x1: 500,
        y1: 250,
        x2: 350,
        y2: 250,
        value: 10,
        label: 'Light Bulb',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'res_1',
        type: 'resistor',
        x1: 350,
        y1: 250,
        x2: 200,
        y2: 250,
        value: 10,
        label: 'Resistor',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_2',
        type: 'wire',
        x1: 200,
        y1: 250,
        x2: 200,
        y2: 400,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }]);
    } else if (presetName === 'series') {
      setComponents([{
        id: 'bat_1',
        type: 'battery',
        x1: 150,
        y1: 400,
        x2: 300,
        y2: 400,
        value: 12,
        label: 'Battery',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_1',
        type: 'wire',
        x1: 300,
        y1: 400,
        x2: 450,
        y2: 400,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'sw_1',
        type: 'switch',
        x1: 450,
        y1: 400,
        x2: 550,
        y2: 400,
        value: 0,
        label: 'Switch',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_2',
        type: 'wire',
        x1: 550,
        y1: 400,
        x2: 550,
        y2: 250,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'bulb_1',
        type: 'bulb',
        x1: 550,
        y1: 250,
        x2: 400,
        y2: 250,
        value: 10,
        label: 'Bulb 1',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'bulb_2',
        type: 'bulb',
        x1: 400,
        y1: 250,
        x2: 250,
        y2: 250,
        value: 10,
        label: 'Bulb 2',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_3',
        type: 'wire',
        x1: 250,
        y1: 250,
        x2: 150,
        y2: 250,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_4',
        type: 'wire',
        x1: 150,
        y1: 250,
        x2: 150,
        y2: 400,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }]);
    } else if (presetName === 'parallel') {
      setComponents([{
        id: 'bat_1',
        type: 'battery',
        x1: 150,
        y1: 450,
        x2: 300,
        y2: 450,
        value: 9,
        label: 'Battery',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_1',
        type: 'wire',
        x1: 300,
        y1: 450,
        x2: 500,
        y2: 450,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'sw_1',
        type: 'switch',
        x1: 500,
        y1: 450,
        x2: 500,
        y2: 300,
        value: 0,
        label: 'Switch',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_2',
        type: 'wire',
        x1: 500,
        y1: 300,
        x2: 500,
        y2: 150,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'bulb_1',
        type: 'bulb',
        x1: 500,
        y1: 300,
        x2: 350,
        y2: 300,
        value: 10,
        label: 'Bulb 1',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'bulb_2',
        type: 'bulb',
        x1: 500,
        y1: 150,
        x2: 350,
        y2: 150,
        value: 10,
        label: 'Bulb 2',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_3',
        type: 'wire',
        x1: 350,
        y1: 150,
        x2: 350,
        y2: 300,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_4',
        type: 'wire',
        x1: 350,
        y1: 300,
        x2: 150,
        y2: 300,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_5',
        type: 'wire',
        x1: 150,
        y1: 300,
        x2: 150,
        y2: 450,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }]);
    } else if (presetName === 'short') {
      setComponents([{
        id: 'bat_1',
        type: 'battery',
        x1: 200,
        y1: 400,
        x2: 350,
        y2: 400,
        value: 9,
        label: 'Battery',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_1',
        type: 'wire',
        x1: 350,
        y1: 400,
        x2: 500,
        y2: 400,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'bulb_1',
        type: 'bulb',
        x1: 500,
        y1: 400,
        x2: 500,
        y2: 250,
        value: 10,
        label: 'Bulb',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_2',
        type: 'wire',
        x1: 500,
        y1: 250,
        x2: 200,
        y2: 250,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      }, {
        id: 'wire_3',
        type: 'wire',
        x1: 200,
        y1: 250,
        x2: 200,
        y2: 400,
        value: 0,
        label: 'Wire',
        isOpen: false,
        isBurnedOut: false
      },
      // Short-circuit bypass switch (parallel to the bulb)
      {
        id: 'sw_short',
        type: 'switch',
        x1: 350,
        y1: 400,
        x2: 350,
        y2: 250,
        value: 0,
        label: 'Bypass Switch',
        isOpen: true,
        isBurnedOut: false
      }]);
    } else {
      setComponents([]);
    }
  };

  // Load default preset on mount
  useEffect(() => {
    loadPreset('simple');
  }, []);

  // Distance to segment helper
  const distanceToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  };

  // Dynamic solver
  const solveCircuit = useCallback(compList => {
    // 1. Collect all terminals
    const terminals = [];
    compList.forEach(c => {
      terminals.push({
        compId: c.id,
        num: 1,
        x: c.x1,
        y: c.y1
      });
      terminals.push({
        compId: c.id,
        num: 2,
        x: c.x2,
        y: c.y2
      });
    });

    // 2. Union-Find to group terminals into nodes
    const parent = {};
    const find = id => {
      if (parent[id] === undefined) parent[id] = id;
      if (parent[id] === id) return id;
      return parent[id] = find(parent[id]);
    };
    const union = (id1, id2) => {
      const r1 = find(id1);
      const r2 = find(id2);
      if (r1 !== r2) parent[r1] = r2;
    };
    const getTermKey = (compId, num) => `${compId}_${num}`;

    // Snap distance is 5px for unioning
    for (let i = 0; i < terminals.length; i++) {
      for (let j = i + 1; j < terminals.length; j++) {
        const t1 = terminals[i];
        const t2 = terminals[j];
        if (Math.hypot(t1.x - t2.x, t1.y - t2.y) < 5) {
          union(getTermKey(t1.compId, t1.num), getTermKey(t2.compId, t2.num));
        }
      }
    }

    // Group terms into unique nodes
    const nodeGroups = {};
    terminals.forEach(t => {
      const key = getTermKey(t.compId, t.num);
      const root = find(key);
      if (!nodeGroups[root]) nodeGroups[root] = [];
      nodeGroups[root].push(key);
    });
    const nodeRoots = Object.keys(nodeGroups);
    const K = nodeRoots.length; // Total physical nodes

    if (K <= 1) {
      return {
        voltages: {},
        currents: {},
        getNodeId: () => 0,
        K
      };
    }

    // Choose Ground Node (Node 0). Find negative terminal of battery.
    let groundRoot = null;
    for (let c of compList) {
      if (c.type === 'battery' && !c.isBurnedOut) {
        groundRoot = find(getTermKey(c.id, 2));
        break;
      }
    }
    if (!groundRoot && nodeRoots.length > 0) {
      groundRoot = nodeRoots[0];
    }
    const rootToNodeIndex = {};
    let indexCounter = 1;
    nodeRoots.forEach(root => {
      if (root === groundRoot) {
        rootToNodeIndex[root] = 0;
      } else {
        rootToNodeIndex[root] = indexCounter++;
      }
    });
    const getNodeId = (compId, num) => {
      const key = getTermKey(compId, num);
      const root = find(key);
      return rootToNodeIndex[root] ?? 0;
    };

    // Voltage sources
    const activeBatteries = compList.filter(c => c.type === 'battery' && !c.isBurnedOut);
    const M = activeBatteries.length;
    const S = K - 1 + M;
    const A = Array.from({
      length: S
    }, () => new Array(S).fill(0));
    const Z = new Array(S).fill(0);

    // Shunts to ground to prevent singular matrices in open sub-circuits
    const gShunt = 1e-9;
    for (let i = 1; i < K; i++) {
      A[i - 1][i - 1] += gShunt;
    }

    // Add passives (resistors, bulbs, wires, closed switches)
    compList.forEach(c => {
      if (c.isBurnedOut) return;
      let R = null;
      if (c.type === 'resistor' || c.type === 'bulb') {
        R = c.value;
      } else if (c.type === 'wire' || c.type === 'switch' && !c.isOpen) {
        R = 0.02; // small resistance for wire/closed switch
      }
      if (R !== null) {
        const a = getNodeId(c.id, 1);
        const b = getNodeId(c.id, 2);
        const g = 1 / R;
        if (a > 0) A[a - 1][a - 1] += g;
        if (b > 0) A[b - 1][b - 1] += g;
        if (a > 0 && b > 0) {
          A[a - 1][b - 1] -= g;
          A[b - 1][a - 1] -= g;
        }
      }
    });

    // Add Batteries
    activeBatteries.forEach((bat, idx) => {
      const a = getNodeId(bat.id, 1); // positive
      const b = getNodeId(bat.id, 2); // negative
      const row = K - 1 + idx;
      const col = K - 1 + idx;
      const V = bat.value;
      const Rint = 0.1; // battery internal resistance

      if (a > 0 && a !== b) A[row][a - 1] = 1;
      if (b > 0 && a !== b) A[row][b - 1] = -1;
      A[row][col] = -Rint; // V_a - V_b - I_bat * Rint = V
      Z[row] = V;
      if (a > 0) A[a - 1][col] += 1;
      if (b > 0) A[b - 1][col] -= 1;
    });

    // Solve system
    const X = solveLinearSystem(A, Z);

    // Extract node voltages
    const nodeVoltages = {
      0: 0
    };
    for (let i = 1; i < K; i++) {
      nodeVoltages[i] = X[i - 1];
    }

    // Calculate currents
    const currents = {};
    compList.forEach(c => {
      if (c.isBurnedOut) {
        currents[c.id] = 0;
        return;
      }
      if (c.type === 'resistor' || c.type === 'bulb') {
        const a = getNodeId(c.id, 1);
        const b = getNodeId(c.id, 2);
        currents[c.id] = (nodeVoltages[a] - nodeVoltages[b]) / c.value;
      } else if (c.type === 'wire' || c.type === 'switch' && !c.isOpen) {
        const a = getNodeId(c.id, 1);
        const b = getNodeId(c.id, 2);
        currents[c.id] = (nodeVoltages[a] - nodeVoltages[b]) / 0.02;
      } else if (c.type === 'switch' && c.isOpen) {
        currents[c.id] = 0;
      }
    });

    // Batteries currents from X
    activeBatteries.forEach((bat, idx) => {
      const col = K - 1 + idx;
      // Conventional current flows from negative (-) to positive (+) internally in a discharging battery,
      // which is opposite of X[col] (current leaving positive terminal).
      currents[bat.id] = -X[col];
    });
    return {
      voltages: nodeVoltages,
      currents,
      getNodeId,
      K
    };
  }, []);

  // Compute circuit state
  const circuitState = solveCircuit(components);

  // Monitor burnout limits
  useEffect(() => {
    let burnoutOccurred = false;
    let burnedCompName = '';
    const updated = components.map(c => {
      if (c.isBurnedOut) return c;
      const current = circuitState.currents[c.id] || 0;
      const power = current * current * (c.type === 'battery' ? 0.1 : c.value || 0.02);
      let limit = Infinity;
      if (c.type === 'bulb') limit = 35; // Bulb power limit 35W
      if (c.type === 'resistor') limit = 25; // Resistor limit 25W
      if (c.type === 'wire') limit = 150; // Wire fuses at 150W
      if (c.type === 'switch') limit = 150; // Switch fuses at 150W

      if (power > limit) {
        burnoutOccurred = true;
        burnedCompName = c.label;
        return {
          ...c,
          isBurnedOut: true
        };
      }
      return c;
    });
    if (burnoutOccurred) {
      playSound('burnout');
      setComponents(updated);
      setBurnoutNotice(`${burnedCompName} burned out due to excessive power!`);
    }
  }, [components, circuitState, solveCircuit]);

  // Add component handler
  const handleAddComponent = type => {
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 400;
    const cy = canvas ? canvas.height / 2 : 300;
    let newComp = {
      id: `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      x1: cx - 60,
      y1: cy,
      x2: cx + 60,
      y2: cy,
      isOpen: false,
      isBurnedOut: false
    };
    switch (type) {
      case 'wire':
        newComp.value = 0;
        newComp.label = 'Wire';
        break;
      case 'battery':
        newComp.value = 9; // 9V default
        newComp.label = 'Battery';
        break;
      case 'resistor':
        newComp.value = 10; // 10 ohms
        newComp.label = 'Resistor';
        break;
      case 'bulb':
        newComp.value = 10; // 10 ohms
        newComp.label = 'Light Bulb';
        break;
      case 'switch':
        newComp.value = 0;
        newComp.isOpen = true; // Switch starts open
        newComp.label = 'Switch';
        break;
      default:
        return;
    }
    setComponents(prev => [...prev, newComp]);
    setSelectedCompId(newComp.id);
  };
  const getMouseCoordinates = e => {
    const canvas = canvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    const renderedWidth = canvas.width * scale;
    const renderedHeight = canvas.height * scale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    return {
      x,
      y
    };
  };

  // Mouse handlers
  const handleMouseDown = e => {
    const {
      x,
      y
    } = getMouseCoordinates(e);

    // 1. Drag red probe
    if (showVoltmeter && Math.hypot(x - voltmeterRed.x, y - voltmeterRed.y) < 20) {
      setDragging({
        type: 'voltmeterRed'
      });
      return;
    }

    // 2. Drag black probe
    if (showVoltmeter && Math.hypot(x - voltmeterBlack.x, y - voltmeterBlack.y) < 20) {
      setDragging({
        type: 'voltmeterBlack'
      });
      return;
    }

    // 3. Drag voltmeter box
    if (showVoltmeter && x >= voltmeterBox.x && x <= voltmeterBox.x + 150 && y >= voltmeterBox.y && y <= voltmeterBox.y + 80) {
      setDragging({
        type: 'voltmeterBox',
        offsetX: x - voltmeterBox.x,
        offsetY: y - voltmeterBox.y
      });
      return;
    }

    // 4. Drag ammeter probe
    if (showAmmeter && Math.hypot(x - ammeterProbe.x, y - ammeterProbe.y) < 25) {
      setDragging({
        type: 'ammeterProbe',
        offsetX: x - ammeterProbe.x,
        offsetY: y - ammeterProbe.y
      });
      return;
    }

    // 5. Drag component terminals
    for (let c of components) {
      if (Math.hypot(x - c.x1, y - c.y1) < 14) {
        setDragging({
          type: 'terminal',
          compId: c.id,
          termNum: 1
        });
        setSelectedCompId(c.id);
        const tx = c.x1;
        const ty = c.y1;
        wasSnappedRef.current = components.some(other => {
          if (other.id === c.id) return false;
          return Math.hypot(tx - other.x1, ty - other.y1) < 1 || Math.hypot(tx - other.x2, ty - other.y2) < 1;
        });
        return;
      }
      if (Math.hypot(x - c.x2, y - c.y2) < 14) {
        setDragging({
          type: 'terminal',
          compId: c.id,
          termNum: 2
        });
        setSelectedCompId(c.id);
        const tx = c.x2;
        const ty = c.y2;
        wasSnappedRef.current = components.some(other => {
          if (other.id === c.id) return false;
          return Math.hypot(tx - other.x1, ty - other.y1) < 1 || Math.hypot(tx - other.x2, ty - other.y2) < 1;
        });
        return;
      }
    }

    // 6. Drag component body
    for (let c of components) {
      if (distanceToSegment(x, y, c.x1, c.y1, c.x2, c.y2) < 14) {
        setDragging({
          type: 'body',
          compId: c.id,
          startX1: c.x1,
          startY1: c.y1,
          startX2: c.x2,
          startY2: c.y2,
          clickX: x,
          clickY: y
        });
        setSelectedCompId(c.id);
        return;
      }
    }

    // Deselect if clicking on canvas background
    setSelectedCompId(null);
  };
  const handleMouseMove = e => {
    if (!dragging) return;
    const {
      x,
      y
    } = getMouseCoordinates(e);
    if (dragging.type === 'voltmeterRed') {
      setVoltmeterRed({
        x: Math.max(10, Math.min(790, x)),
        y: Math.max(10, Math.min(590, y))
      });
    } else if (dragging.type === 'voltmeterBlack') {
      setVoltmeterBlack({
        x: Math.max(10, Math.min(790, x)),
        y: Math.max(10, Math.min(590, y))
      });
    } else if (dragging.type === 'voltmeterBox') {
      setVoltmeterBox({
        x: Math.max(0, Math.min(650, x - dragging.offsetX)),
        y: Math.max(0, Math.min(520, y - dragging.offsetY))
      });
    } else if (dragging.type === 'ammeterProbe') {
      setAmmeterProbe({
        x: Math.max(10, Math.min(790, x)),
        y: Math.max(10, Math.min(590, y))
      });
    } else if (dragging.type === 'terminal') {
      const {
        compId,
        termNum
      } = dragging;
      let targetX = x;
      let targetY = y;
      let snapped = false;

      // Snap to other terminals
      for (let c of components) {
        if (c.id === compId) continue;
        if (Math.hypot(x - c.x1, y - c.y1) < 18) {
          targetX = c.x1;
          targetY = c.y1;
          snapped = true;
          break;
        }
        if (Math.hypot(x - c.x2, y - c.y2) < 18) {
          targetX = c.x2;
          targetY = c.y2;
          snapped = true;
          break;
        }
      }
      if (snapped && !wasSnappedRef.current) {
        playSound('connect');
      }
      wasSnappedRef.current = snapped;

      // Grid snapping if enabled
      if (!snapped && snapToGrid) {
        const grid = 20;
        targetX = Math.round(x / grid) * grid;
        targetY = Math.round(y / grid) * grid;
      }

      // Constrain inside canvas
      targetX = Math.max(10, Math.min(790, targetX));
      targetY = Math.max(10, Math.min(590, targetY));
      setComponents(prev => prev.map(c => {
        if (c.id === compId) {
          return termNum === 1 ? {
            ...c,
            x1: targetX,
            y1: targetY
          } : {
            ...c,
            x2: targetX,
            y2: targetY
          };
        }
        return c;
      }));
    } else if (dragging.type === 'body') {
      const {
        compId,
        startX1,
        startY1,
        startX2,
        startY2,
        clickX,
        clickY
      } = dragging;
      let dx = x - clickX;
      let dy = y - clickY;
      let tx1 = startX1 + dx;
      let ty1 = startY1 + dy;
      let tx2 = startX2 + dx;
      let ty2 = startY2 + dy;
      if (snapToGrid) {
        const grid = 20;
        tx1 = Math.round(tx1 / grid) * grid;
        ty1 = Math.round(ty1 / grid) * grid;
        tx2 = Math.round(tx2 / grid) * grid;
        ty2 = Math.round(ty2 / grid) * grid;
      }

      // Clamp components inside boundaries
      const minX = Math.min(tx1, tx2);
      const maxX = Math.max(tx1, tx2);
      const minY = Math.min(ty1, ty2);
      const maxY = Math.max(ty1, ty2);
      if (minX < 10) {
        const diff = 10 - minX;
        tx1 += diff;
        tx2 += diff;
      }
      if (maxX > 790) {
        const diff = 790 - maxX;
        tx1 += diff;
        tx2 += diff;
      }
      if (minY < 10) {
        const diff = 10 - minY;
        ty1 += diff;
        ty2 += diff;
      }
      if (maxY > 590) {
        const diff = 590 - maxY;
        ty1 += diff;
        ty2 += diff;
      }
      setComponents(prev => prev.map(c => {
        if (c.id === compId) {
          return {
            ...c,
            x1: tx1,
            y1: ty1,
            x2: tx2,
            y2: ty2
          };
        }
        return c;
      }));
    }
  };
  const handleResetAll = () => {
    setComponents([]);
    setSelectedCompId(null);
    setCurrentFlowType('electrons');
    setIsSchematic(false);
    setShowVoltmeter(false);
    setShowAmmeter(false);
    setVoltmeterBox({
      x: 620,
      y: 350
    });
    setVoltmeterRed({
      x: 600,
      y: 450
    });
    setVoltmeterBlack({
      x: 670,
      y: 450
    });
    setAmmeterProbe({
      x: 620,
      y: 250
    });
    setBurnoutNotice(null);
  };
  const handleMouseUp = e => {
    if (dragging && dragging.type === 'body') {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const dist = Math.hypot(x - dragging.clickX, y - dragging.clickY);

        // Knife switch toggled if not dragged much
        if (dist < 4) {
          const c = components.find(comp => comp.id === dragging.compId);
          if (c && c.type === 'switch' && !c.isBurnedOut) {
            playSound('click');
            setComponents(prev => prev.map(comp => {
              if (comp.id === c.id) {
                return {
                  ...comp,
                  isOpen: !comp.isOpen
                };
              }
              return comp;
            }));
          }
        }
      }
    }
    setDragging(null);
  };

  // Touch support
  const handleTouchStart = e => {
    if (e.touches.length === 1) {
      handleMouseDown(e.touches[0]);
    }
  };
  const handleTouchMove = e => {
    if (e.touches.length === 1) {
      handleMouseMove(e.touches[0]);
    }
  };
  const handleTouchEnd = e => {
    handleMouseUp(e);
  };

  // Disconnect selected component
  const handleDisconnect = () => {
    if (!selectedCompId) return;
    setComponents(prev => prev.map(c => {
      if (c.id === selectedCompId) {
        // Displace the coordinates slightly to unsnap
        return {
          ...c,
          x1: c.x1 + 15,
          y1: c.y1 + 15,
          x2: c.x2 - 15,
          y2: c.y2 - 15
        };
      }
      return c;
    }));
  };

  // Delete selected component
  const handleDelete = () => {
    if (!selectedCompId) return;
    setComponents(prev => prev.filter(c => c.id !== selectedCompId));
    setSelectedCompId(null);
  };

  // Replace / repair burned out component
  const handleRepair = () => {
    if (!selectedCompId) return;
    setComponents(prev => prev.map(c => {
      if (c.id === selectedCompId) {
        return {
          ...c,
          isBurnedOut: false
        };
      }
      return c;
    }));
    setBurnoutNotice(null);
  };

  // Selected component getter
  const selectedComp = components.find(c => c.id === selectedCompId);

  // Voltmeter reading calculation
  let voltmeterReading = null;
  let voltmeterSnapRed = null;
  let voltmeterSnapBlack = null;
  if (showVoltmeter) {
    let closestRedNode = null;
    let closestBlackNode = null;
    let minRedDist = 35;
    let minBlackDist = 35;

    // Search closest terminals
    components.forEach(c => {
      const n1 = circuitState.getNodeId(c.id, 1);
      const n2 = circuitState.getNodeId(c.id, 2);
      const dRed1 = Math.hypot(voltmeterRed.x - c.x1, voltmeterRed.y - c.y1);
      const dRed2 = Math.hypot(voltmeterRed.x - c.x2, voltmeterRed.y - c.y2);
      const dBlack1 = Math.hypot(voltmeterBlack.x - c.x1, voltmeterBlack.y - c.y1);
      const dBlack2 = Math.hypot(voltmeterBlack.x - c.x2, voltmeterBlack.y - c.y2);
      if (dRed1 < minRedDist) {
        minRedDist = dRed1;
        closestRedNode = n1;
        voltmeterSnapRed = {
          x: c.x1,
          y: c.y1
        };
      }
      if (dRed2 < minRedDist) {
        minRedDist = dRed2;
        closestRedNode = n2;
        voltmeterSnapRed = {
          x: c.x2,
          y: c.y2
        };
      }
      if (dBlack1 < minBlackDist) {
        minBlackDist = dBlack1;
        closestBlackNode = n1;
        voltmeterSnapBlack = {
          x: c.x1,
          y: c.y1
        };
      }
      if (dBlack2 < minBlackDist) {
        minBlackDist = dBlack2;
        closestBlackNode = n2;
        voltmeterSnapBlack = {
          x: c.x2,
          y: c.y2
        };
      }
    });
    if (closestRedNode !== null && closestBlackNode !== null) {
      const vRed = circuitState.voltages[closestRedNode] || 0;
      const vBlack = circuitState.voltages[closestBlackNode] || 0;
      voltmeterReading = vRed - vBlack;
    }
  }

  // Ammeter reading calculation
  let ammeterReading = 0;
  let hoveredCompId = null;
  if (showAmmeter) {
    let minHoverDist = 22;
    components.forEach(c => {
      const dist = distanceToSegment(ammeterProbe.x, ammeterProbe.y, c.x1, c.y1, c.x2, c.y2);
      if (dist < minHoverDist) {
        minHoverDist = dist;
        hoveredCompId = c.id;
      }
    });
    if (hoveredCompId) {
      ammeterReading = Math.abs(circuitState.currents[hoveredCompId] || 0);
    }
  }

  // Draw simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Grid Background
      ctx.fillStyle = '#0f172a'; // slate-900 background
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(51, 65, 85, 0.4)'; // slate-700 grid dots
      const gridSpacing = 20;
      for (let x = gridSpacing; x < width; x += gridSpacing) {
        for (let y = gridSpacing; y < height; y += gridSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Helper to draw Flame/Charred effect
      const drawFlame = (cx, cy, scale = 1) => {
        const time = Date.now() / 100;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        // Charcoal backing
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Flames
        const h = 20 + Math.sin(time) * 4;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)'; // Red
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(-14, 10, -10, -5, 0, -h);
        ctx.bezierCurveTo(10, -5, 14, 10, 0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(249, 115, 22, 0.95)'; // Orange
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.bezierCurveTo(-9, 8, -6, -3, 0, -h * 0.7);
        ctx.bezierCurveTo(6, -3, 9, 8, 0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(253, 224, 71, 1)'; // Yellow Core
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.bezierCurveTo(-5, 5, -3, 2, 0, -h * 0.4);
        ctx.bezierCurveTo(3, 2, 5, 5, 0, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      // 2. Draw Connections Highlight
      const joints = {};
      components.forEach(c => {
        const k1 = `${c.x1},${c.y1}`;
        const k2 = `${c.x2},${c.y2}`;
        joints[k1] = (joints[k1] || 0) + 1;
        joints[k2] = (joints[k2] || 0) + 1;
      });

      // Highlight joint points
      Object.keys(joints).forEach(key => {
        const [xStr, yStr] = key.split(',');
        const px = parseFloat(xStr);
        const py = parseFloat(yStr);
        const count = joints[key];
        if (count > 1) {
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; // Neon green circle ring
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#22c55e'; // green dot inside
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Open terminal warning
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'; // Orange dotted circle ring
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 3. Draw All Components
      components.forEach(c => {
        const dx = c.x2 - c.x1;
        const dy = c.y2 - c.y1;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const current = circuitState.currents[c.id] || 0;
        ctx.save();
        ctx.translate(c.x1, c.y1);
        ctx.rotate(angle);

        // Highlight if selected
        if (c.id === selectedCompId) {
          ctx.strokeStyle = '#38bdf8'; // sky blue outline
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.roundRect(-8, -22, len + 16, 44, 8);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (isSchematic) {
          // ==================== SCHEMATIC VIEW ====================
          ctx.strokeStyle = '#94a3b8'; // slate-400
          ctx.lineWidth = 3.5;
          if (c.type === 'wire') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();
          } else if (c.type === 'battery') {
            // Lines to the battery symbol
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len / 2 - 8, 0);
            ctx.moveTo(len / 2 + 8, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

            // Battery plates symbol
            ctx.strokeStyle = '#38bdf8'; // battery positive cyan/blue
            ctx.beginPath();
            ctx.moveTo(len / 2 + 8, -15);
            ctx.lineTo(len / 2 + 8, 15); // positive plate (long)
            ctx.stroke();
            ctx.strokeStyle = '#64748b'; // negative grey
            ctx.lineWidth = 5.5;
            ctx.beginPath();
            ctx.moveTo(len / 2 - 8, -8);
            ctx.lineTo(len / 2 - 8, 8); // negative plate (short/thick)
            ctx.stroke();

            // Labelling signs
            ctx.fillStyle = '#38bdf8';
            ctx.font = '11px sans-serif';
            ctx.fillText('+', len / 2 + 12, -8);
            ctx.fillStyle = '#64748b';
            ctx.fillText('-', len / 2 - 18, -8);
          } else if (c.type === 'resistor') {
            // Wires to resistor
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len / 2 - 25, 0);
            ctx.moveTo(len / 2 + 25, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

            // Zig-zag symbol
            ctx.strokeStyle = '#f43f5e'; // Resistor pinkish-red
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(len / 2 - 25, 0);
            const peakCount = 5;
            const step = 50 / (peakCount * 2);
            for (let i = 0; i < peakCount * 2; i++) {
              const rx = len / 2 - 25 + (i + 0.5) * step;
              const ry = (i % 2 === 0 ? -1 : 1) * 10;
              ctx.lineTo(rx, ry);
            }
            ctx.lineTo(len / 2 + 25, 0);
            ctx.stroke();
          } else if (c.type === 'bulb') {
            // Wires to bulb
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len / 2 - 16, 0);
            ctx.moveTo(len / 2 + 16, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

            // Bulb glowing yellow radial background in schematic
            if (!c.isBurnedOut && Math.abs(current) > 0.01) {
              const power = current * current * c.value;
              const glowRad = Math.min(45, 12 + Math.sqrt(power) * 7);
              const grad = ctx.createRadialGradient(len / 2, 0, 5, len / 2, 0, glowRad);
              grad.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
              grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(len / 2, 0, glowRad, 0, Math.PI * 2);
              ctx.fill();
            }

            // Circle with cross inside
            ctx.strokeStyle = '#eab308'; // yellow
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(len / 2, 0, 15, 0, Math.PI * 2);
            ctx.stroke();

            // Loop inside
            ctx.beginPath();
            ctx.moveTo(len / 2 - 10.6, -10.6);
            ctx.lineTo(len / 2 + 10.6, 10.6);
            ctx.moveTo(len / 2 + 10.6, -10.6);
            ctx.lineTo(len / 2 - 10.6, 10.6);
            ctx.stroke();
          } else if (c.type === 'switch') {
            // Wires
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len / 2 - 15, 0);
            ctx.moveTo(len / 2 + 15, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

            // Circular terminals
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(len / 2 - 15, 0, 4, 0, Math.PI * 2);
            ctx.arc(len / 2 + 15, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Lever
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(len / 2 - 15, 0);
            if (c.isOpen) {
              ctx.lineTo(len / 2 + 10, -16); // angled up
            } else {
              ctx.lineTo(len / 2 + 15, 0); // flat closed
            }
            ctx.stroke();
          }
        } else {
          // ==================== REALISTIC VIEW ====================
          if (c.type === 'wire') {
            // Blue/Grey textured wire
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();
          } else if (c.type === 'battery') {
            // Lead wire lines
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len / 2 - 25, 0);
            ctx.moveTo(len / 2 + 25, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

            // Battery body cylinder
            // Negative side (black/grey)
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(len / 2 - 25, -12, 35, 24, {
              tl: 4,
              bl: 4,
              tr: 0,
              br: 0
            });
            ctx.fill();

            // Positive side (gold/orange)
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.roundRect(len / 2 + 10, -12, 12, 24, {
              tl: 0,
              bl: 0,
              tr: 4,
              br: 4
            });
            ctx.fill();

            // Positive metal tip nub
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(len / 2 + 22, -4, 4, 8, 2);
            ctx.fill();

            // Labels
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('-', len / 2 - 18, 3);
            ctx.fillText('+', len / 2 + 13, 3);
          } else if (c.type === 'resistor') {
            // Leads
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len / 2 - 25, 0);
            ctx.moveTo(len / 2 + 25, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

            // Resistor body cylinder (ceramic/beige)
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.roundRect(len / 2 - 25, -9, 50, 18, 5);
            ctx.fill();

            // Color bands
            if (!c.isBurnedOut) {
              const bands = getResistorColors(c.value);
              // Band 1
              ctx.fillStyle = bands[0];
              ctx.fillRect(len / 2 - 18, -9, 4, 18);
              // Band 2
              ctx.fillStyle = bands[1];
              ctx.fillRect(len / 2 - 8, -9, 4, 18);
              // Band 3 (Multiplier)
              ctx.fillStyle = bands[2];
              ctx.fillRect(len / 2 + 2, -9, 4, 18);
              // Band 4 (Tolerance: Gold)
              ctx.fillStyle = '#fbbf24';
              ctx.fillRect(len / 2 + 12, -9, 4, 18);
            } else {
              // Charred black/grey body if burned out
              ctx.fillStyle = '#0f172a';
              ctx.beginPath();
              ctx.roundRect(len / 2 - 25, -9, 50, 18, 5);
              ctx.fill();
            }
          } else if (c.type === 'bulb') {
            // Leads
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len / 2 - 15, 0);
            ctx.moveTo(len / 2 + 15, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();
            const glowIntensity = Math.abs(current);
            // Draw glow behind the bulb if functioning
            if (!c.isBurnedOut && glowIntensity > 0.01) {
              const power = current * current * c.value;
              const glowRad = Math.min(70, 15 + Math.sqrt(power) * 9);
              const grad = ctx.createRadialGradient(len / 2, 0, 4, len / 2, 0, glowRad);
              grad.addColorStop(0, 'rgba(253, 224, 71, 0.7)');
              grad.addColorStop(0.3, 'rgba(253, 224, 71, 0.35)');
              grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(len / 2, 0, glowRad, 0, Math.PI * 2);
              ctx.fill();

              // Draw outward yellow rays
              ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
              ctx.lineWidth = 1.5;
              const rayCount = 8;
              for (let i = 0; i < rayCount; i++) {
                const rayAngle = i / rayCount * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(len / 2 + Math.cos(rayAngle) * 16, Math.sin(rayAngle) * 16);
                ctx.lineTo(len / 2 + Math.cos(rayAngle) * (16 + glowRad * 0.4), Math.sin(rayAngle) * (16 + glowRad * 0.4));
                ctx.stroke();
              }
            }

            // Bulb metal socket base
            ctx.fillStyle = '#64748b';
            ctx.fillRect(len / 2 - 10, -8, 20, 16);
            ctx.fillStyle = '#475569';
            ctx.fillRect(len / 2 - 10, -6, 2, 12);
            ctx.fillRect(len / 2 + 8, -6, 2, 12);

            // Glass bulb circle outline
            ctx.strokeStyle = c.isBurnedOut ? '#1e293b' : 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.fillStyle = c.isBurnedOut ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(len / 2, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Filament support stems
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(len / 2 - 5, 8);
            ctx.lineTo(len / 2 - 3, -2);
            ctx.moveTo(len / 2 + 5, 8);
            ctx.lineTo(len / 2 + 3, -2);
            ctx.stroke();

            // Bulb Filament wire
            if (c.isBurnedOut) {
              // Broken filament (charred)
              ctx.strokeStyle = '#ef4444';
              ctx.beginPath();
              ctx.moveTo(len / 2 - 3, -2);
              ctx.quadraticCurveTo(len / 2 - 2, -5, len / 2 - 4, -8);
              ctx.moveTo(len / 2 + 3, -2);
              ctx.quadraticCurveTo(len / 2 + 2, -5, len / 2 + 4, -8);
              ctx.stroke();
            } else {
              // Intact filament glowing proportional to current
              ctx.strokeStyle = glowIntensity > 0.05 ? '#fef08a' : '#f59e0b';
              ctx.lineWidth = glowIntensity > 0.05 ? 2.5 : 1.2;
              ctx.beginPath();
              ctx.moveTo(len / 2 - 3, -2);
              ctx.bezierCurveTo(len / 2 - 2, -9, len / 2 + 2, -9, len / 2 + 3, -2);
              ctx.stroke();
            }
          } else if (c.type === 'switch') {
            // Contacts
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len / 2 - 20, 0);
            ctx.moveTo(len / 2 + 20, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

            // Circular metallic contact rivets
            ctx.fillStyle = '#94a3b8';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(len / 2 - 20, 0, 5, 0, Math.PI * 2);
            ctx.arc(len / 2 + 20, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Handle knife lever
            ctx.strokeStyle = '#d97706'; // copper blade
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(len / 2 - 20, 0);
            if (c.isOpen) {
              ctx.lineTo(len / 2 + 10, -20); // knife angled up
              ctx.stroke();

              // Red insulated grip tip
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(len / 2 + 4, -16);
              ctx.lineTo(len / 2 + 12, -22);
              ctx.stroke();
            } else {
              ctx.lineTo(len / 2 + 20, 0); // knife closed
              ctx.stroke();

              // Grip tip
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(len / 2 + 14, 0);
              ctx.lineTo(len / 2 + 22, 0);
              ctx.stroke();
            }
          }
        }

        // 4. Electron / Conventional Current flow animation
        if (currentFlowType !== 'none' && !c.isBurnedOut && Math.abs(current) > 0.005) {
          const speedMultiplier = 40; // speed of electron flow
          const time = Date.now() / 1000;
          const dotSpacing = 28;

          // Speed matches current magnitude
          const speed = current * speedMultiplier;

          // Particle direction:
          // Electrons flow opposite to conventional current (from negative to positive terminal).
          // If current > 0 (flows terminal 1 -> 2), electrons flow 2 -> 1.
          const isElectronDir = currentFlowType === 'electrons';
          const directionFactor = isElectronDir ? -1 : 1;
          ctx.fillStyle = isElectronDir ? '#22d3ee' : '#fbbf24'; // cyan for e-, gold for conventional
          const particleCount = Math.floor(len / dotSpacing);
          const startOffset = time * speed * directionFactor % dotSpacing;
          for (let i = 0; i <= particleCount; i++) {
            let px = (i * dotSpacing + startOffset) % len;
            if (px < 0) px += len;
            ctx.beginPath();
            ctx.arc(px, 0, isElectronDir ? 3.5 : 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw visual indicator for electron '-' sign
            if (isElectronDir) {
              ctx.fillStyle = '#0891b2';
              ctx.fillRect(px - 1.5, -0.5, 3, 1);
              ctx.fillStyle = '#22d3ee';
            }
          }
        }

        // Draw component labels & values
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        let valText = '';
        if (c.type === 'battery') valText = `${c.value.toFixed(1)} V`;
        if (c.type === 'resistor' || c.type === 'bulb') valText = `${c.value.toFixed(1)} \u03A9`;
        if (c.isBurnedOut) valText = 'BURNED OUT';
        ctx.fillText(c.label, len / 2, 28);
        if (valText) {
          ctx.fillText(valText, len / 2, 40);
        }

        // 5. Draw Flame / Burnout animation
        if (c.isBurnedOut) {
          drawFlame(len / 2, 0, 1.1);
        }
        ctx.restore();
      });

      // 4. Draw Voltmeter Wires and Probes
      if (showVoltmeter) {
        const boxCenterX = voltmeterBox.x + 75;
        const boxCenterY = voltmeterBox.y + 40;

        // Draw red probe wire
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'; // red
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(boxCenterX - 30, boxCenterY);
        ctx.bezierCurveTo(boxCenterX - 30, boxCenterY + 120, voltmeterRed.x, voltmeterRed.y - 100, voltmeterRed.x, voltmeterRed.y);
        ctx.stroke();

        // Draw black probe wire
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.9)'; // black/dark slate
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(boxCenterX + 30, boxCenterY);
        ctx.bezierCurveTo(boxCenterX + 30, boxCenterY + 120, voltmeterBlack.x, voltmeterBlack.y - 100, voltmeterBlack.x, voltmeterBlack.y);
        ctx.stroke();

        // Draw snapping connection guides if probes are close to nodes
        if (voltmeterSnapRed) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(voltmeterSnapRed.x, voltmeterSnapRed.y, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (voltmeterSnapBlack) {
          ctx.strokeStyle = 'rgba(74, 85, 104, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(voltmeterSnapBlack.x, voltmeterSnapBlack.y, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Red Probe tip
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(voltmeterRed.x, voltmeterRed.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(voltmeterRed.x, voltmeterRed.y);
        ctx.lineTo(voltmeterRed.x, voltmeterRed.y - 15); // metal pin tip
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', voltmeterRed.x, voltmeterRed.y + 0.5);

        // Draw Black Probe tip
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(voltmeterBlack.x, voltmeterBlack.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(voltmeterBlack.x, voltmeterBlack.y);
        ctx.lineTo(voltmeterBlack.x, voltmeterBlack.y - 15); // metal tip
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('-', voltmeterBlack.x, voltmeterBlack.y);

        // Draw Voltmeter Box (glassmorphism look)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(voltmeterBox.x, voltmeterBox.y, 150, 80, 10);
        ctx.fill();
        ctx.stroke();

        // LCD Screen
        ctx.fillStyle = '#022c22'; // deep green background
        ctx.beginPath();
        ctx.roundRect(voltmeterBox.x + 15, voltmeterBox.y + 15, 120, 32, 4);
        ctx.fill();

        // Reading Text
        ctx.fillStyle = '#34d399'; // neon green display text
        ctx.font = 'bold 16px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const readingString = voltmeterReading !== null ? `${voltmeterReading.toFixed(2)} V` : '--- V';
        ctx.fillText(readingString, voltmeterBox.x + 75, voltmeterBox.y + 31);

        // Box label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px sans-serif';
        ctx.fillText('VOLTMETER', voltmeterBox.x + 75, voltmeterBox.y + 64);
      }

      // 5. Draw Ammeter Probe
      if (showAmmeter) {
        // Handle snap highlight
        if (hoveredCompId) {
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(ammeterProbe.x, ammeterProbe.y, 28, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Loop Sensor (circular ring)
        ctx.strokeStyle = hoveredCompId ? '#22c55e' : '#64748b'; // green if active
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(ammeterProbe.x, ammeterProbe.y, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Handle body
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(ammeterProbe.x - 6, ammeterProbe.y + 22, 12, 30, 3);
        ctx.fill();

        // Digital display box
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(ammeterProbe.x - 30, ammeterProbe.y - 10, 60, 20, 4);
        ctx.fill();

        // Display text
        ctx.fillStyle = '#22d3ee'; // Cyan text
        ctx.font = 'bold 11px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${ammeterReading.toFixed(2)} A`, ammeterProbe.x, ammeterProbe.y);
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [components, circuitState, showVoltmeter, voltmeterReading, voltmeterBox, voltmeterRed, voltmeterBlack, voltmeterSnapRed, voltmeterSnapBlack, showAmmeter, ammeterReading, ammeterProbe, hoveredCompId, currentFlowType, isSchematic, selectedCompId]);
  return <div ref={containerRef} className="text-slate-100 font-sans selection:bg-sky-500 selection:text-white" style={{
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
        .ds-sidebar-item {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: all 0.2s ease !important;
        }
        .ds-sidebar-item:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
      `}</style>

      {/* Canvas */}
      <div style={{
      flex: 1,
      position: 'relative',
      zIndex: 1,
      pointerEvents: 'auto',
      padding: '20px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        <canvas ref={canvasRef} width={800} height={600} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        pointerEvents: 'auto',
        background: '#050510',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }} />
      </div>

      {/* Help Overlay HUD */}
      <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      width: '280px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '16px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      pointerEvents: 'none',
      fontSize: '12px'
    }} className="space-y-1.5">
        <div className="font-semibold text-slate-200 flex items-center space-x-1">
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>Interactive Controls</span>
        </div>
        <div>• Drag component <span className="text-sky-300">body</span> to translate.</div>
        <div>• Drag endpoints <span className="text-sky-300">(dashed rings)</span> to route.</div>
        <div>• Snap endpoints together to establish joints.</div>
        <div>• Click switches to toggle open/closed.</div>
        <div>• Double-click is disabled; use sidebar to delete.</div>
      </div>

      {/* Burnout alarm */}
      {burnoutNotice && <div style={{
      position: 'absolute',
      top: '100px',
      left: '20px',
      width: '280px',
      background: 'rgba(127, 29, 29, 0.8)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '16px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px'
    }} className="animate-pulse flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-red-100">Component Burned Out!</div>
            <div>{burnoutNotice}</div>
            <div className="text-[10px] text-red-300 mt-1">Select the component and click "Repair" to restore.</div>
          </div>
        </div>}

      {/* Control Sidebar (Floating Aside Panel) */}
      <aside style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '320px',
      maxHeight: 'calc(100% - 110px)',
      overflowY: 'auto',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      color: 'white',
      zIndex: 10,
      pointerEvents: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
        {/* Section 1: Component Palette */}
        <div className="pb-4 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Components</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleAddComponent('wire')} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item">
              <div className="w-3 h-3 rounded-full" />
              <span>Wire</span>
            </button>
            <button onClick={() => handleAddComponent('battery')} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Battery</span>
            </button>
            <button onClick={() => handleAddComponent('resistor')} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Resistor</span>
            </button>
            <button onClick={() => handleAddComponent('bulb')} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>Light Bulb</span>
            </button>
            <button onClick={() => handleAddComponent('switch')} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition ds-sidebar-item">
              <Power className="w-4 h-4 text-indigo-400" />
              <span>Switch</span>
            </button>
          </div>
        </div>

        {/* Section 2: Interactive Tools */}
        <div className="pb-4 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Measurement Tools</span>
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition" style={{
            background: 'rgba(20, 20, 30, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            color: 'white'
          }}>
              <span className="text-xs text-slate-200 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Enable Voltmeter</span>
              </span>
              <input type="checkbox" checked={showVoltmeter} onChange={e => {
              setShowVoltmeter(e.target.checked);
              if (e.target.checked) {
                setVoltmeterBox({
                  x: 580,
                  y: 120
                });
                setVoltmeterRed({
                  x: 550,
                  y: 220
                });
                setVoltmeterBlack({
                  x: 620,
                  y: 220
                });
              }
            }} className="rounded border-slate-600 focus:ring-[#3498db] focus:ring-offset-slate-900 w-4 h-4" style={{
              accentColor: '#3498db',
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }} />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition" style={{
            background: 'rgba(20, 20, 30, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            color: 'white'
          }}>
              <span className="text-xs text-slate-200 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Enable Ammeter</span>
              </span>
              <input type="checkbox" checked={showAmmeter} onChange={e => {
              setShowAmmeter(e.target.checked);
              if (e.target.checked) {
                setAmmeterProbe({
                  x: 600,
                  y: 150
                });
              }
            }} className="rounded border-slate-600 focus:ring-[#3498db] focus:ring-offset-slate-900 w-4 h-4" style={{
              accentColor: '#3498db',
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }} />
            </label>
          </div>
        </div>

        {/* Section 3: Visual Settings */}
        <div className="pb-4 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
            <Eye className="w-4 h-4 text-violet-400" />
            <span>Simulation Options</span>
          </h3>
          <div className="space-y-4">
            {/* Flow Visualizer Selection */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">Current Flow Visuals</label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border border-white/10">
                <button onClick={() => setCurrentFlowType('electrons')} className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'electrons' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
                  Electrons
                </button>
                <button onClick={() => setCurrentFlowType('conventional')} className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'conventional' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
                  Conventional
                </button>
                <button onClick={() => setCurrentFlowType('none')} className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${currentFlowType === 'none' ? 'bg-white/10 text-slate-200' : 'text-slate-400 hover:text-slate-200'}`}>
                  None
                </button>
              </div>
            </div>

            {/* View toggle */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">Display View Mode</label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg border border-white/10">
                <button onClick={() => setIsSchematic(false)} className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${!isSchematic ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  Realistic
                </button>
                <button onClick={() => setIsSchematic(true)} className={`text-[10px] py-1 px-1.5 rounded font-medium transition ${isSchematic ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  Schematic
                </button>
              </div>
            </div>

            {/* Grid lock toggle */}
            <label className="flex items-center justify-between p-1 cursor-pointer">
              <span className="text-xs text-slate-300">Lock to Grid (20px)</span>
              <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} style={{
              accentColor: '#3498db'
            }} className="rounded border-slate-700 focus:ring-[#3498db] focus:ring-offset-slate-900 w-4 h-4" />
            </label>
          </div>
        </div>

        {/* Section 4: Component Editor */}
        <div className="flex-1">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center space-x-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Component Editor</span>
          </h3>

          {selectedComp ? <div className="space-y-4 p-3 border border-white/10 rounded-xl">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Type</div>
                <div className="text-sm font-bold capitalize text-white flex items-center space-x-1.5 mt-0.5">
                  {selectedComp.type === 'bulb' && <Lightbulb className="w-4 h-4 text-yellow-400" />}
                  {selectedComp.type === 'battery' && <Zap className="w-4 h-4 text-amber-500" />}
                  {selectedComp.type === 'resistor' && <Sliders className="w-4 h-4 text-rose-500" />}
                  {selectedComp.type === 'wire' && <div className="w-2.5 h-2.5 rounded-full" />}
                  {selectedComp.type === 'switch' && <Power className="w-4 h-4 text-indigo-400" />}
                  <span>{selectedComp.type}</span>
                </div>
              </div>

              {/* Status indicator */}
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Status</div>
                {selectedComp.isBurnedOut ? <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 mt-1">
                    <ZapOff className="w-3 h-3" />
                    <span>FUSED / BURNED OUT</span>
                  </span> : selectedComp.type === 'switch' ? <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-1 ${selectedComp.isOpen ? 'bg-indigo-950/80 border-indigo-800 text-indigo-300' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'}`}>
                    {selectedComp.isOpen ? 'OPEN' : 'CLOSED'}
                  </span> : <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 mt-1">
                    <Check className="w-3 h-3" />
                    <span>FUNCTIONAL</span>
                  </span>}
              </div>

              {/* Value adjustment slider */}
              {['battery', 'resistor', 'bulb'].includes(selectedComp.type) && <div>
                  <label className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                    <span>
                      {selectedComp.type === 'battery' ? 'Voltage (V)' : 'Resistance (\u03A9)'}
                    </span>
                    <span className="text-white font-mono px-1.5 py-0.5 rounded text-[11px]" style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                color: 'white'
              }}>
                      {selectedComp.value.toFixed(1)}
                      {selectedComp.type === 'battery' ? ' V' : ' \u03A9'}
                    </span>
                  </label>
                  <input type="range" min={selectedComp.type === 'battery' ? '0.0' : '0.5'} max={selectedComp.type === 'battery' ? '120.0' : '100.0'} step={selectedComp.type === 'battery' ? '1.0' : '0.5'} value={selectedComp.value} disabled={selectedComp.isBurnedOut} onChange={e => {
              const val = parseFloat(e.target.value);
              setComponents(prev => prev.map(c => {
                if (c.id === selectedCompId) {
                  return {
                    ...c,
                    value: val
                  };
                }
                return c;
              }));
            }} style={{
              accentColor: '#3498db'
            }} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" />
                </div>}

              {/* Action buttons */}
              <div className="flex flex-col space-y-2 pt-2">
                {selectedComp.isBurnedOut && <button onClick={handleRepair} className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Repair Component</span>
                  </button>}

                <button onClick={handleDisconnect} className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg text-slate-300 text-xs font-semibold ds-sidebar-item" title="Separate endpoints to break snaps">
                  <span>Unsnap Terminals</span>
                </button>

                <button onClick={handleDelete} className="flex items-center justify-center space-x-1 w-full px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold transition">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete Component</span>
                </button>
              </div>
            </div> : <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-white/10 rounded-xl text-slate-500">
              <Sliders className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-xs">Select a component on the canvas to configure parameters, delete, or disconnect it.</p>
            </div>}
        </div>
      </aside>
    </div>;
}