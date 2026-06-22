import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Check, Award, Eye, EyeOff, Sparkles, HelpCircle, Columns } from 'lucide-react';

// External mutation helpers to satisfy strict react-hooks/immutability lint rules
const setProp = (obj, key, val) => {
  obj[key] = val;
};

const pushToArray = (arr, item) => {
  arr.push(item);
};

// Define the challenges for the Game Mode
const challenges = [
  // LEVEL 1: PREDICT TILT (choices: left, balance, right)
  {
    level: 1,
    type: 'predict',
    question: 'What will happen when you retract the pillars?',
    leftObjects: [{ type: 'brick', mass: 15, slot: -1.0, stackIndex: 0, label: '15 kg', width: 52, height: 36, color: '#c63b3b' }],
    rightObjects: [{ type: 'brick', mass: 10, slot: 1.5, stackIndex: 0, label: '10 kg', width: 44, height: 30, color: '#e25858' }],
    answer: 'balance', // 15 * 1.0 = 15; 10 * 1.5 = 15
    toolbox: []
  },
  {
    level: 1,
    type: 'predict',
    question: 'What will happen when you retract the pillars?',
    leftObjects: [{ type: 'brick', mass: 20, slot: -1.0, stackIndex: 0, label: '20 kg', width: 60, height: 42, color: '#a71f1f' }],
    rightObjects: [{ type: 'brick', mass: 15, slot: 1.5, stackIndex: 0, label: '15 kg', width: 52, height: 36, color: '#c63b3b' }],
    answer: 'right', // 20 * 1.0 = 20; 15 * 1.5 = 22.5. Right is heavier (torque 22.5 vs 20)
    toolbox: []
  },
  {
    level: 1,
    type: 'predict',
    question: 'What will happen when you retract the pillars?',
    leftObjects: [{ type: 'brick', mass: 10, slot: -2.0, stackIndex: 0, label: '10 kg', width: 44, height: 30, color: '#e25858' }],
    rightObjects: [{ type: 'brick', mass: 20, slot: 0.75, stackIndex: 0, label: '20 kg', width: 60, height: 42, color: '#a71f1f' }],
    answer: 'left', // 10 * 2.0 = 20; 20 * 0.75 = 15. Left is heavier.
    toolbox: []
  },
  
  // LEVEL 2: BALANCE ME (Place standard brick at correct slot)
  {
    level: 2,
    type: 'balance',
    question: 'Place the 10 kg brick to balance the seesaw!',
    leftObjects: [{ type: 'brick', mass: 20, slot: -1.0, stackIndex: 0, label: '20 kg', width: 60, height: 42, color: '#a71f1f' }],
    rightObjects: [],
    toolbox: [{ type: 'brick', mass: 10, label: '10 kg' }],
    // Target position: right slot 2.0 (torque: 20 * 1.0 = 10 * 2.0)
    checkAnswer: (objects) => {
      const placed = objects.find(o => !o.isChallenge && o.state === 'beam' && o.slot === 2.0 && o.mass === 10);
      return !!placed;
    }
  },
  {
    level: 2,
    type: 'balance',
    question: 'Place the 10 kg brick to balance the seesaw!',
    leftObjects: [],
    rightObjects: [{ type: 'person', mass: 30, slot: 0.5, stackIndex: 0, label: '30 kg', width: 32, height: 65, color: '#ffbe7e' }],
    toolbox: [{ type: 'brick', mass: 10, label: '10 kg' }],
    // Target position: left slot -1.5 (torque: 30 * 0.5 = 10 * 1.5)
    checkAnswer: (objects) => {
      const placed = objects.find(o => !o.isChallenge && o.state === 'beam' && o.slot === -1.5 && o.mass === 10);
      return !!placed;
    }
  },
  
  // LEVEL 3: MYSTERY MASS (find secret box mass)
  {
    level: 3,
    type: 'mystery',
    question: 'Find the mass of Mystery Box A!',
    leftObjects: [{ type: 'mystery', mass: 20, slot: -0.5, stackIndex: 0, label: 'A', width: 40, height: 40, color: '#c39bd3' }],
    rightObjects: [],
    toolbox: [
      { type: 'brick', mass: 5, label: '5 kg' },
      { type: 'brick', mass: 10, label: '10 kg' },
      { type: 'brick', mass: 15, label: '15 kg' }
    ],
    choices: [5, 10, 15, 20],
    answer: 20
  },
  {
    level: 3,
    type: 'mystery',
    question: 'Find the mass of Mystery Box B!',
    leftObjects: [{ type: 'mystery', mass: 10, slot: -1.5, stackIndex: 0, label: 'B', width: 45, height: 45, color: '#7fb3d5' }],
    rightObjects: [],
    toolbox: [
      { type: 'brick', mass: 5, label: '5 kg' },
      { type: 'brick', mass: 15, label: '15 kg' },
      { type: 'brick', mass: 20, label: '20 kg' }
    ],
    choices: [5, 10, 15, 20],
    answer: 10
  },
  
  // LEVEL 4: BALANCE ME COMPLEX (multiple objects, stack, etc.)
  {
    level: 4,
    type: 'balance',
    question: 'Place the 10 kg brick to balance the seesaw!',
    leftObjects: [{ type: 'brick', mass: 10, slot: -1.0, stackIndex: 0, label: '10 kg', width: 44, height: 30, color: '#e25858' }],
    rightObjects: [
      { type: 'person', mass: 20, slot: 1.0, stackIndex: 0, label: '20 kg', width: 30, height: 60, color: '#ff7ebb' },
      { type: 'brick', mass: 10, slot: 0.5, stackIndex: 0, label: '10 kg', width: 44, height: 30, color: '#e25858' }
    ],
    toolbox: [{ type: 'brick', mass: 10, label: '10 kg' }],
    // Torque Left: 10 * 1.0 = 10.
    // Torque Right: 20 * 1.0 + 10 * 0.5 = 25.
    // Left needs 15. User brick is 10kg => slot is -1.5.
    checkAnswer: (objects) => {
      const placed = objects.find(o => !o.isChallenge && o.state === 'beam' && o.slot === -1.5 && o.mass === 10);
      return !!placed;
    }
  },
  {
    level: 4,
    type: 'balance',
    question: 'Place the 10 kg brick to balance the seesaw!',
    leftObjects: [{ type: 'person', mass: 60, slot: -0.5, stackIndex: 0, label: '60 kg', width: 36, height: 85, color: '#bef781' }],
    rightObjects: [{ type: 'person', mass: 20, slot: 0.5, stackIndex: 0, label: '20 kg', width: 30, height: 60, color: '#ff7ebb' }],
    toolbox: [{ type: 'brick', mass: 10, label: '10 kg' }],
    // Torque Left: 60 * 0.5 = 30.
    // Torque Right: 20 * 0.5 = 10. Right needs 20. User brick is 10kg => slot is 2.0.
    checkAnswer: (objects) => {
      const placed = objects.find(o => !o.isChallenge && o.state === 'beam' && o.slot === 2.0 && o.mass === 10);
      return !!placed;
    }
  }
];

export default function CustomBalancingAct({ onBack, title }) {
  // Mode selection and controls
  const [currentMode, setCurrentMode] = useState('intro'); // 'intro' | 'lab' | 'game'
  const [activeCategory, setActiveCategory] = useState('bricks'); // 'bricks' | 'people' | 'mystery'
  
  // Simulation Toggles
  const [showForces, setShowForces] = useState(false);
  const [showMarks, setShowMarks] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [pillarsOn, setPillarsOn] = useState(true);
  
  // Game Mode state
  const [gameLevel, setGameLevel] = useState(null); // null means level select
  const [gameScore, setGameScore] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState('question'); // 'question' | 'checking' | 'correct' | 'incorrect'
  const [gamePrediction, setGamePrediction] = useState(null); // 'left' | 'balance' | 'right'
  const [mysteryMassGuess, setMysteryMassGuess] = useState(null);
  const [gameMessage, setGameMessage] = useState('');

  // Refs for animation & canvas interactions
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  // Constants
  const cx = 400;
  const cy = 320;
  const beamThickness = 12;
  const scale = 150; // 150 pixels per meter
  
  // Physics State held in Ref to achieve lock-step 60fps
  const simStateRef = useRef({
    objects: [],
    theta: 0,
    omega: 0,
    pillarsOn: true,
    mouse: { x: 0, y: 0, isDown: false },
    draggedObject: null,
    hoveredSlot: null,
    checkFrameCount: 0,
    stars: []
  });

  // Keep ref physics variables synchronized with React state toggles
  useEffect(() => {
    setProp(simStateRef.current, 'pillarsOn', pillarsOn);
  }, [pillarsOn]);

  // Reset the simulation helper
  const resetSimulation = useCallback((clearPlacedObjects = true) => {
    const state = simStateRef.current;
    setProp(state, 'theta', 0);
    setProp(state, 'omega', 0);
    setProp(state, 'hoveredSlot', null);
    setProp(state, 'draggedObject', null);
    setProp(state, 'checkFrameCount', 0);
    setProp(state, 'stars', []);
    setPillarsOn(true);
    setProp(state, 'pillarsOn', true);

    if (clearPlacedObjects) {
      setProp(state, 'objects', []);
    } else {
      // Return custom user-placed objects to toolbox, keep challenge objects
      setProp(state, 'objects', state.objects.filter(obj => obj.isChallenge));
      // Ensure challenge objects are set back to their starting position
      state.objects.forEach(obj => {
        if (obj.state === 'beam') {
          setProp(obj, 'stackIndex', 0);
        }
      });
    }
  }, []);

  // Switch modes and reset state
  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    setGameLevel(null);
    setChallengeIndex(0);
    setGamePhase('question');
    setGamePrediction(null);
    setMysteryMassGuess(null);
    setGameMessage('');
    resetSimulation(true);
  };

  // Get current challenge definition
  const getActiveChallenge = useCallback(() => {
    if (currentMode !== 'game' || gameLevel === null) return null;
    const levelChallenges = challenges.filter(c => c.level === gameLevel);
    return levelChallenges[challengeIndex % levelChallenges.length];
  }, [currentMode, gameLevel, challengeIndex]);

  // Get active shelf items
  const getShelfItems = useCallback(() => {
    if (currentMode === 'intro') {
      return [
        { type: 'brick', mass: 5, label: '5 kg', width: 36, height: 24, color: '#ff7b7b', cx: 160 },
        { type: 'brick', mass: 10, label: '10 kg', width: 44, height: 30, color: '#e25858', cx: 320 },
        { type: 'brick', mass: 15, label: '15 kg', width: 52, height: 36, color: '#c63b3b', cx: 480 },
        { type: 'brick', mass: 20, label: '20 kg', width: 60, height: 42, color: '#a71f1f', cx: 640 }
      ];
    } else if (currentMode === 'lab') {
      if (activeCategory === 'bricks') {
        return [
          { type: 'brick', mass: 5, label: '5 kg', width: 36, height: 24, color: '#ff7b7b', cx: 160 },
          { type: 'brick', mass: 10, label: '10 kg', width: 44, height: 30, color: '#e25858', cx: 320 },
          { type: 'brick', mass: 15, label: '15 kg', width: 52, height: 36, color: '#c63b3b', cx: 480 },
          { type: 'brick', mass: 20, label: '20 kg', width: 60, height: 42, color: '#a71f1f', cx: 640 }
        ];
      } else if (activeCategory === 'people') {
        return [
          { type: 'person', mass: 20, label: 'Child (20 kg)', width: 30, height: 60, color: '#ff7ebb', cx: 160 },
          { type: 'person', mass: 30, label: 'Boy (30 kg)', width: 32, height: 65, color: '#ffbe7e', cx: 320 },
          { type: 'person', mass: 60, label: 'Woman (60 kg)', width: 36, height: 85, color: '#bef781', cx: 480 },
          { type: 'person', mass: 80, label: 'Man (80 kg)', width: 40, height: 95, color: '#81bef7', cx: 640 }
        ];
      } else { // mystery boxes
        return [
          { type: 'mystery', mass: 5, label: 'A', width: 40, height: 40, color: '#c39bd3', cx: 120 },
          { type: 'mystery', mass: 10, label: 'B', width: 45, height: 45, color: '#7fb3d5', cx: 240 },
          { type: 'mystery', mass: 15, label: 'C', width: 50, height: 50, color: '#76d7c4', cx: 380 },
          { type: 'mystery', mass: 20, label: 'D', width: 55, height: 55, color: '#f9e79f', cx: 520 },
          { type: 'mystery', mass: 30, label: 'E', width: 60, height: 60, color: '#f5b041', cx: 660 }
        ];
      }
    } else {
      // Game Mode active challenge shelf
      const challenge = getActiveChallenge();
      if (!challenge || !challenge.toolbox) return [];
      return challenge.toolbox.map((tb, idx) => {
        const count = challenge.toolbox.length;
        const step = 600 / (count + 1);
        const itemCx = 100 + (idx + 1) * step;
        
        let width = 40, height = 30, color = '#ff7b7b';
        if (tb.type === 'brick') {
          if (tb.mass === 5) { width = 36; height = 24; color = '#ff7b7b'; }
          else if (tb.mass === 10) { width = 44; height = 30; color = '#e25858'; }
          else if (tb.mass === 15) { width = 52; height = 36; color = '#c63b3b'; }
          else if (tb.mass === 20) { width = 60; height = 42; color = '#a71f1f'; }
        } else if (tb.type === 'person') {
          if (tb.mass === 20) { width = 30; height = 60; color = '#ff7ebb'; }
          else if (tb.mass === 30) { width = 32; height = 65; color = '#ffbe7e'; }
          else if (tb.mass === 60) { width = 36; height = 85; color = '#bef781'; }
          else if (tb.mass === 80) { width = 40; height = 95; color = '#81bef7'; }
        }
        return {
          type: tb.type,
          mass: tb.mass,
          label: tb.label || `${tb.mass} kg`,
          width,
          height,
          color,
          cx: itemCx
        };
      });
    }
  }, [currentMode, activeCategory, getActiveChallenge]);

  // Load a challenge setup into simulation state
  const loadChallenge = useCallback((level, index) => {
    const levelChallenges = challenges.filter(c => c.level === level);
    const challenge = levelChallenges[index % levelChallenges.length];
    if (!challenge) return;

    resetSimulation(true);
    
    // Convert challenge pre-placed objects
    const placed = [];
    challenge.leftObjects.forEach(obj => {
      pushToArray(placed, {
        id: 'challenge_l_' + Math.random().toString(36).substr(2, 9),
        ...obj,
        state: 'beam',
        isChallenge: true
      });
    });
    challenge.rightObjects.forEach(obj => {
      pushToArray(placed, {
        id: 'challenge_r_' + Math.random().toString(36).substr(2, 9),
        ...obj,
        state: 'beam',
        isChallenge: true
      });
    });
    
    setProp(simStateRef.current, 'objects', placed);
    setGamePhase('question');
    setGamePrediction(null);
    setMysteryMassGuess(null);
    setGameMessage('');
  }, [resetSimulation]);

  // Start checking game mode challenge answer
  const handleCheckAnswer = () => {
    const challenge = getActiveChallenge();
    if (!challenge) return;

    if (challenge.type === 'predict' && !gamePrediction) {
      setGameMessage('Please select a prediction first!');
      return;
    }
    if (challenge.type === 'mystery' && !mysteryMassGuess) {
      setGameMessage('Please select a mass first!');
      return;
    }

    setGamePhase('checking');
    setGameMessage('Checking balance...');
    setPillarsOn(false); // Let the seesaw swing!
    setProp(simStateRef.current, 'pillarsOn', false);
    setProp(simStateRef.current, 'checkFrameCount', 0);
  };

  const handleNextChallenge = () => {
    const levelChallenges = challenges.filter(c => c.level === gameLevel);
    if (challengeIndex + 1 < levelChallenges.length) {
      setChallengeIndex(prev => prev + 1);
      loadChallenge(gameLevel, challengeIndex + 1);
    } else {
      // Completed level
      setGameLevel(null);
      setChallengeIndex(0);
      setGamePhase('question');
    }
  };

  const handleTryAgain = () => {
    loadChallenge(gameLevel, challengeIndex);
  };

  // Height offset for stacked objects
  const getObjectStackOffset = (obj, objects) => {
    let offset = 0;
    objects.forEach(other => {
      if (other.state === 'beam' && other.slot === obj.slot && other.stackIndex < obj.stackIndex) {
        offset += other.height;
      }
    });
    return offset;
  };

  // Drag and Drop Event listeners
  const getMouseCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const my = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { mx, my };
  };

  const handleMouseDown = (e) => {
    const { mx, my } = getMouseCoordinates(e);

    const state = simStateRef.current;
    setProp(state.mouse, 'isDown', true);
    setProp(state.mouse, 'x', mx);
    setProp(state.mouse, 'y', my);

    // Check click on active objects
    let clicked = null;
    for (let i = state.objects.length - 1; i >= 0; i--) {
      const obj = state.objects[i];
      if (obj.isChallenge) continue; // static challenge objects

      if (obj.state === 'beam') {
        const rx = (mx - cx) * Math.cos(state.theta) + (my - cy) * Math.sin(state.theta);
        const ry = -((mx - cx) * Math.sin(state.theta) - (my - cy) * Math.cos(state.theta));

        const slotX = obj.slot * scale;
        const stackOffset = getObjectStackOffset(obj, state.objects);
        const bottomY = beamThickness / 2 + stackOffset;
        const topY = bottomY + obj.height;

        if (rx >= slotX - obj.width / 2 && rx <= slotX + obj.width / 2 &&
            ry >= bottomY && ry <= topY) {
          clicked = obj;
          break;
        }
      } else if (obj.state === 'ground') {
        if (mx >= obj.x - obj.width / 2 && mx <= obj.x + obj.width / 2 &&
            my >= obj.y - obj.height / 2 && my <= obj.y + obj.height / 2) {
          clicked = obj;
          break;
        }
      }
    }

    if (clicked) {
      setProp(state, 'draggedObject', clicked);
      if (clicked.state === 'beam') {
        const slot = clicked.slot;
        const idx = clicked.stackIndex;
        // Shift lower stacks down
        state.objects.forEach(other => {
          if (other.state === 'beam' && other.slot === slot && other.stackIndex > idx) {
            setProp(other, 'stackIndex', other.stackIndex - 1);
          }
        });
      }
      setProp(clicked, 'state', 'dragging');
      setProp(clicked, 'x', mx);
      setProp(clicked, 'y', my);
      return;
    }

    // Check click on bottom shelf toolbox items
    if (my >= 450 && my <= 550) {
      const shelfItems = getShelfItems();
      for (const item of shelfItems) {
        if (mx >= item.cx - 30 && mx <= item.cx + 30) {
          // Generate unique ID locally inside event response to keep render pure
          const randId = 'obj_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
          const newObj = {
            id: randId,
            type: item.type,
            mass: item.mass,
            width: item.width,
            height: item.height,
            color: item.color,
            label: item.label,
            state: 'dragging',
            x: mx,
            y: my,
            vx: 0,
            vy: 0,
            slot: 0,
            stackIndex: 0
          };
          pushToArray(state.objects, newObj);
          setProp(state, 'draggedObject', newObj);
          break;
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    const { mx, my } = getMouseCoordinates(e);

    const state = simStateRef.current;
    setProp(state.mouse, 'x', mx);
    setProp(state.mouse, 'y', my);

    if (state.draggedObject) {
      const obj = state.draggedObject;
      setProp(obj, 'x', mx);
      setProp(obj, 'y', my);

      // Check proximity to beam
      const dx = mx - cx;
      const dy = my - cy;
      const rx = dx * Math.cos(state.theta) + dy * Math.sin(state.theta);
      const ry = -(dx * Math.sin(state.theta) - dy * Math.cos(state.theta));

      if (rx >= -300 && rx <= 300 && ry >= -40 && ry <= 80) {
        // Highlighting nearest slot
        const slots = [-2.0, -1.75, -1.5, -1.25, -1.0, -0.75, -0.5, -0.25, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
        let nearest = null;
        let minDist = Infinity;
        slots.forEach(slot => {
          const slotX = slot * scale;
          const dist = Math.abs(rx - slotX);
          if (dist < minDist) {
            minDist = dist;
            nearest = slot;
          }
        });

        if (minDist < 25) {
          setProp(state, 'hoveredSlot', nearest);
        } else {
          setProp(state, 'hoveredSlot', null);
        }
      } else {
        setProp(state, 'hoveredSlot', null);
      }
    }
  };

  const handleMouseUp = () => {
    const state = simStateRef.current;
    setProp(state.mouse, 'isDown', false);

    if (state.draggedObject) {
      const obj = state.draggedObject;
      if (state.hoveredSlot !== null) {
        // Place on beam
        setProp(obj, 'state', 'beam');
        setProp(obj, 'slot', state.hoveredSlot);
        
        const stackCount = state.objects.filter(o => o.state === 'beam' && o.slot === state.hoveredSlot && o.id !== obj.id).length;
        setProp(obj, 'stackIndex', stackCount);
      } else if (state.mouse.y > 450) {
        // Dragged back to toolbox, remove
        setProp(state, 'objects', state.objects.filter(o => o.id !== obj.id));
      } else {
        // Fall down to ground
        setProp(obj, 'state', 'ground');
        setProp(obj, 'vx', 0);
        setProp(obj, 'vy', 0);
      }
      setProp(state, 'draggedObject', null);
      setProp(state, 'hoveredSlot', null);
    }
  };

  // Mobile Touch handlers wrapper
  const handleTouchStart = (e) => {
    if (e.touches.length > 0) {
      handleMouseDown(e.touches[0]);
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length > 0) {
      handleMouseMove(e.touches[0]);
    }
  };
  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Main Canvas updates loop
  useEffect(() => {
    let running = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Inside effect, define rendering and local visual helpers to prevent dependencies pollution
    const drawBrickLocal = (c, x, y, w, h, mass, label, showLab) => {
      c.fillStyle = '#e74c3c';
      c.beginPath();
      c.roundRect(x, y, w, h, 4);
      c.fill();
      c.strokeStyle = '#c0392b';
      c.lineWidth = 2;
      c.stroke();

      // Brick mortar lines
      c.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y + h / 2);
      c.lineTo(x + w, y + h / 2);
      c.moveTo(x + w / 3, y);
      c.lineTo(x + w / 3, y + h / 2);
      c.moveTo(x + w * 2 / 3, y + h / 2);
      c.lineTo(x + w * 2 / 3, y + h);
      c.stroke();

      if (showLab) {
        c.fillStyle = '#ffffff';
        c.font = 'bold 10px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(label, x + w / 2, y + h / 2);
      }
    };

    const drawPersonLocal = (c, rx, ry, w, h, label, mass, showLab) => {
      let shirtColor = '#ff2d55';
      let pantsColor = '#007aff';
      let skinTone = '#ffdbac';
      let hairColor = '#8d5524';
      
      if (mass === 20) {
        shirtColor = '#e84393';
        pantsColor = '#0984e3';
      } else if (mass === 30) {
        shirtColor = '#fdcb6e';
        pantsColor = '#2d3436';
        hairColor = '#e17055';
      } else if (mass === 60) {
        shirtColor = '#00b894';
        pantsColor = '#6c5ce7';
        hairColor = '#ffeaa7';
      } else if (mass === 80) {
        shirtColor = '#d63031';
        pantsColor = '#2d3436';
        hairColor = '#2d3436';
      }

      // Legs
      c.strokeStyle = pantsColor;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(rx - w * 0.15, ry);
      c.lineTo(rx - w * 0.1, ry - h * 0.35);
      c.moveTo(rx + w * 0.15, ry);
      c.lineTo(rx + w * 0.1, ry - h * 0.35);
      c.stroke();

      // Torso (shirt)
      c.fillStyle = shirtColor;
      c.beginPath();
      c.roundRect(rx - w * 0.28, ry - h * 0.72, w * 0.56, h * 0.38, 4);
      c.fill();
      c.strokeStyle = '#1e272e';
      c.lineWidth = 1.5;
      c.stroke();

      // Arms
      c.strokeStyle = skinTone;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(rx - w * 0.28, ry - h * 0.68);
      c.lineTo(rx - w * 0.42, ry - h * 0.45);
      c.moveTo(rx + w * 0.28, ry - h * 0.68);
      c.lineTo(rx + w * 0.42, ry - h * 0.45);
      c.stroke();

      // Head
      const headRadius = h * 0.11;
      const headY = ry - h * 0.83;
      c.fillStyle = skinTone;
      c.beginPath();
      c.arc(rx, headY, headRadius, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#1e272e';
      c.lineWidth = 1.5;
      c.stroke();

      // Hair
      c.fillStyle = hairColor;
      if (mass === 20) { // Ponytail
        c.beginPath();
        c.arc(rx - headRadius * 0.8, headY - headRadius * 0.1, headRadius * 0.55, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(rx, headY - headRadius * 0.7, headRadius, Math.PI, 0);
        c.fill();
      } else if (mass === 60) { // Long hair
        c.beginPath();
        c.rect(rx - headRadius * 0.9, headY - headRadius * 0.2, headRadius * 1.8, headRadius * 1.3);
        c.fill();
        c.beginPath();
        c.arc(rx, headY - headRadius * 0.6, headRadius * 1.1, Math.PI, 0);
        c.fill();
      } else {
        c.beginPath();
        c.arc(rx, headY - headRadius * 0.6, headRadius * 1.1, Math.PI * 1.1, Math.PI * 1.9);
        c.fill();
      }

      // Smile
      c.strokeStyle = '#1e272e';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(rx, headY + headRadius * 0.25, headRadius * 0.4, 0.1 * Math.PI, 0.9 * Math.PI);
      c.stroke();

      if (showLab) {
        c.fillStyle = '#ffffff';
        c.font = 'bold 9px sans-serif';
        c.textAlign = 'center';
        c.fillText(label, rx, headY - headRadius * 1.5);
      }
    };

    const drawMysteryBoxLocal = (c, x, y, w, h, label, mass, showLab) => {
      c.fillStyle = '#d35400';
      c.fillRect(x, y, w, h);
      c.strokeStyle = '#8e2f00';
      c.lineWidth = 3;
      c.strokeRect(x, y, w, h);

      // Diagonal planks
      c.strokeStyle = '#a04000';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 2, y + 2);
      c.lineTo(x + w - 2, y + h - 2);
      c.moveTo(x + w - 2, y + 2);
      c.lineTo(x + 2, y + h - 2);
      c.stroke();

      // Big "?" or label
      c.fillStyle = '#ffffff';
      c.font = `bold ${Math.round(h * 0.5)}px sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('?', x + w / 2, y + h / 2);

      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.font = 'bold 10px monospace';
      c.fillText(`Box ${label}`, x + w / 2, y + 10);

      if (showLab) {
        c.fillStyle = '#2ecc71';
        c.font = 'bold 10px sans-serif';
        c.fillText(`${mass} kg`, x + w / 2, y + h - 8);
      }
    };

    const drawArrowLocal = (c, x1, y1, x2, y2, color, width) => {
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();

      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 6;
      c.beginPath();
      c.moveTo(x2, y2);
      c.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      c.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      c.closePath();
      c.fill();
    };

    const drawObjectLocal = (c, lx, ly, obj) => {
      const isMystery = obj.type === 'mystery';
      const showObjLabel = showLabels && (!isMystery || (currentMode !== 'game' && showLabels));
      
      if (obj.type === 'brick') {
        drawBrickLocal(c, lx - obj.width / 2, ly - obj.height, obj.width, obj.height, obj.mass, obj.label, showObjLabel);
      } else if (obj.type === 'person') {
        drawPersonLocal(c, lx, ly, obj.width, obj.height, obj.label, obj.mass, showObjLabel);
      } else if (obj.type === 'mystery') {
        drawMysteryBoxLocal(c, lx - obj.width / 2, ly - obj.height, obj.width, obj.height, obj.label, obj.mass, showObjLabel);
      }

      // Force vector overlay
      if (showForces) {
        c.save();
        c.translate(lx, ly - obj.height / 2);
        c.rotate(-simStateRef.current.theta); // Align vertical straight down
        const forceLength = obj.mass * 2.2;
        drawArrowLocal(c, 0, 0, 0, forceLength, '#e67e22', 2.5);
        
        c.fillStyle = '#e67e22';
        c.font = 'bold 10px monospace';
        c.textAlign = 'left';
        c.fillText(` ${Math.round(obj.mass * 9.81)} N`, 6, forceLength - 2);
        c.restore();
      }
    };

    const drawObjectGlobalLocal = (c, obj) => {
      if (obj.type === 'brick') {
        drawBrickLocal(c, obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height, obj.mass, obj.label, showLabels);
      } else if (obj.type === 'person') {
        drawPersonLocal(c, obj.x, obj.y + obj.height / 2, obj.width, obj.height, obj.label, obj.mass, showLabels);
      } else if (obj.type === 'mystery') {
        drawMysteryBoxLocal(c, obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height, obj.label, obj.mass, showLabels);
      }
    };

    const drawBeamLocalInside = (c) => {
      // Metal Plank
      const plankGrad = c.createLinearGradient(0, -beamThickness / 2, 0, beamThickness / 2);
      plankGrad.addColorStop(0, '#1e1e38');
      plankGrad.addColorStop(0.5, '#3d3d7a');
      plankGrad.addColorStop(1, '#121224');
      c.fillStyle = plankGrad;
      c.fillRect(-300, -beamThickness / 2, 600, beamThickness);
      
      c.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      c.lineWidth = 1;
      c.strokeRect(-300, -beamThickness / 2, 600, beamThickness);

      // Tick marks
      const ticks = [-2.0, -1.75, -1.5, -1.25, -1.0, -0.75, -0.5, -0.25, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
      ticks.forEach(slot => {
        const sx = slot * scale;
        c.strokeStyle = '#3498db'; // neon blue ticks
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(sx, -beamThickness / 2);
        c.lineTo(sx, -beamThickness / 2 - 8);
        c.stroke();

        if (showMarks) {
          c.fillStyle = 'rgba(255, 255, 255, 0.7)';
          c.font = 'bold 9px monospace';
          c.textAlign = 'center';
          c.fillText(`${Math.abs(slot).toFixed(2)}m`, sx, -beamThickness / 2 - 12);
        }
      });
    };

    const drawStandInside = (c) => {
      const standGrad = c.createLinearGradient(370, 0, 430, 0);
      standGrad.addColorStop(0, '#15152b');
      standGrad.addColorStop(0.5, '#2e2e5c');
      standGrad.addColorStop(1, '#101020');
      c.fillStyle = standGrad;
      
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + 30, 440);
      c.lineTo(cx - 30, 440);
      c.closePath();
      c.fill();

      c.strokeStyle = '#2c2c54';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + 30, 440);
      c.lineTo(cx - 30, 440);
      c.closePath();
      c.stroke();

      // Center pivot cap
      c.fillStyle = '#3498db';
      c.beginPath();
      c.arc(cx, cy, 6, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#2980b9';
      c.stroke();
    };

    const drawPillarsInside = (c, raised) => {
      const targetY = raised ? cy : 410;
      const drawColumn = (px) => {
        const colGrad = c.createLinearGradient(px - 10, 0, px + 10, 0);
        colGrad.addColorStop(0, '#101020');
        colGrad.addColorStop(0.5, '#2e2e5c');
        colGrad.addColorStop(1, '#101020');
        c.fillStyle = colGrad;
        c.fillRect(px - 10, targetY, 20, 440 - targetY);

        c.strokeStyle = '#2c2c54';
        c.lineWidth = 1;
        c.strokeRect(px - 10, targetY, 20, 440 - targetY);

        // Support cap
        c.fillStyle = '#e74c3c';
        c.fillRect(px - 12, targetY, 24, 5);
        c.strokeRect(px - 12, targetY, 24, 5);
      };

      drawColumn(cx - 150);
      drawColumn(cx + 150);
    };

    const drawBubbleLevelInside = (c, theta) => {
      const bx = cx;
      const by = 28;
      const bw = 120;
      const bh = 16;

      // Body
      c.fillStyle = '#0b0b18';
      c.beginPath();
      c.roundRect(bx - bw / 2, by - bh / 2, bw, bh, bh / 2);
      c.fill();
      c.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      c.lineWidth = 2;
      c.stroke();

      // Fluid background
      const fluidGrad = c.createLinearGradient(0, by - bh/2, 0, by + bh/2);
      fluidGrad.addColorStop(0, 'rgba(52, 152, 219, 0.2)');
      fluidGrad.addColorStop(1, 'rgba(52, 152, 219, 0.05)');
      c.fillStyle = fluidGrad;
      c.beginPath();
      c.roundRect(bx - bw / 2 + 2, by - bh / 2 + 2, bw - 4, bh - 4, (bh - 4) / 2);
      c.fill();

      // Goalmarks
      c.strokeStyle = 'rgba(52, 152, 219, 0.6)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(bx - 10, by - bh / 2 + 2);
      c.lineTo(bx - 10, by + bh / 2 - 2);
      c.moveTo(bx + 10, by - bh / 2 + 2);
      c.lineTo(bx + 10, by + bh / 2 - 2);
      c.stroke();

      // Bubble position
      const maxOffset = 45;
      const offset = -theta * (maxOffset / 0.35); // opposite of tilt
      const bubbleX = Math.max(bx - maxOffset, Math.min(bx + maxOffset, bx + offset));

      c.fillStyle = '#3498db';
      c.beginPath();
      c.arc(bubbleX, by, 5, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      c.stroke();
    };

    const drawGridInside = (c) => {
      c.save();
      c.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      c.lineWidth = 1;
      c.setLineDash([4, 4]);

      const ticks = [-2.0, -1.75, -1.5, -1.25, -1.0, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
      ticks.forEach(slot => {
        const gx = cx + slot * scale;
        c.beginPath();
        c.moveTo(gx, 50);
        c.lineTo(gx, 440);
        c.stroke();
      });

      c.restore();
    };

    const drawShelfInside = (c) => {
      // Glass shelf background
      c.fillStyle = 'rgba(10, 10, 26, 0.6)';
      c.fillRect(0, 450, 800, 100);
      c.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, 450);
      c.lineTo(800, 450);
      c.stroke();

      // Rack bar (glow style)
      c.strokeStyle = 'rgba(52, 152, 219, 0.3)';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(40, 520);
      c.lineTo(760, 520);
      c.stroke();

      const items = getShelfItems();
      items.forEach(item => {
        if (item.type === 'brick') {
          drawBrickLocal(c, item.cx - item.width / 2, 505 - item.height / 2, item.width, item.height, item.mass, item.label, true);
        } else if (item.type === 'person') {
          drawPersonLocal(c, item.cx, 505 + item.height / 2, item.width, item.height, item.label, item.mass, true);
        } else if (item.type === 'mystery') {
          drawMysteryBoxLocal(c, item.cx - item.width / 2, 505 - item.height / 2, item.width, item.height, item.label, item.mass, false);
        }
      });
    };

    const drawStarShapeInside = (c, scx, scy, spikes, outerRadius, innerRadius) => {
      let rot = (Math.PI / 2) * 3;
      let sx = scx;
      let sy = scy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(scx, scy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        sx = scx + Math.cos(rot) * outerRadius;
        sy = scy + Math.sin(rot) * outerRadius;
        c.lineTo(sx, sy);
        rot += step;

        sx = scx + Math.cos(rot) * innerRadius;
        sy = scy + Math.sin(rot) * innerRadius;
        c.lineTo(sx, sy);
        rot += step;
      }
      c.lineTo(scx, scy - outerRadius);
      c.closePath();
      c.fill();
    };

    const drawVictoryStarsInside = (c) => {
      const state = simStateRef.current;
      state.stars.forEach(star => {
        setProp(star, 'vy', star.vy + star.gravity);
        setProp(star, 'x', star.x + star.vx);
        setProp(star, 'y', star.y + star.vy);
        setProp(star, 'angle', star.angle + star.spin);

        c.save();
        c.translate(star.x, star.y);
        c.rotate(star.angle);
        c.fillStyle = '#f1c40f';
        drawStarShapeInside(c, 0, 0, 5, star.size, star.size / 2.2);
        c.restore();
      });

      // Clean old stars
      setProp(state, 'stars', state.stars.filter(s => s.y < 550));
    };

    const update = () => {
      if (!running) return;

      const state = simStateRef.current;
      const dt = 1 / 60;

      // 1. Physics Engine
      let totalTorque = 0;
      let totalI = 15; // beam inertia

      if (!state.pillarsOn) {
        state.objects.forEach(obj => {
          if (obj.state === 'beam') {
            const r = obj.slot;
            const stackOffset = getObjectStackOffset(obj, state.objects);
            const h = (beamThickness / 2 + obj.height / 2 + stackOffset) / scale;

            // Torque = m * g * (r * cos(theta) - h * sin(theta))
            const torque = obj.mass * 9.81 * (r * Math.cos(state.theta) - h * Math.sin(state.theta));
            totalTorque += torque;
            totalI += obj.mass * (r * r + h * h);
          }
        });

        // seesaw equation of motion
        const alpha = totalTorque / totalI;
        setProp(state, 'omega', state.omega + alpha * dt);
        setProp(state, 'omega', state.omega * 0.985); // friction damping
        setProp(state, 'theta', state.theta + state.omega * dt);

        // Ground limits checks
        const maxAngle = 0.35;
        if (state.theta > maxAngle) {
          setProp(state, 'theta', maxAngle);
          if (state.omega > 0) {
            setProp(state, 'omega', -state.omega * 0.15); // restitution
            if (Math.abs(state.omega) < 0.02) setProp(state, 'omega', 0);
          }
        } else if (state.theta < -maxAngle) {
          setProp(state, 'theta', -maxAngle);
          if (state.omega < 0) {
            setProp(state, 'omega', -state.omega * 0.15);
            if (Math.abs(state.omega) < 0.02) setProp(state, 'omega', 0);
          }
        }
      } else {
        setProp(state, 'theta', 0);
        setProp(state, 'omega', 0);
      }

      // Gravity on falling items
      state.objects.forEach(obj => {
        if (obj.state === 'ground' && obj.y < 440 - obj.height / 2) {
          setProp(obj, 'vy', obj.vy + 9.81 * dt * 200); // falling gravity scale
          setProp(obj, 'y', obj.y + obj.vy * dt);
          if (obj.y >= 440 - obj.height / 2) {
            setProp(obj, 'y', 440 - obj.height / 2);
            setProp(obj, 'vy', 0);
          }
        }
      });

      // 2. Render Scene
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#060612');
      bgGrad.addColorStop(0.7, '#0f0f26');
      bgGrad.addColorStop(1, '#05050f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Angle overlay directly on canvas to avoid accessing refs during React render
      ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
      ctx.beginPath();
      ctx.roundRect(16, 16, 120, 36, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SEESAW ANGLE', 24, 28);

      ctx.fillStyle = '#3498db';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${(state.theta * (180 / Math.PI)).toFixed(1)}°`, 24, 44);

      // Grid helper lines
      if (showMarks) {
        drawGridInside(ctx);
      }

      // Ground render
      ctx.fillStyle = '#080811';
      ctx.fillRect(0, 440, canvas.width, canvas.height - 440);
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 440);
      ctx.lineTo(canvas.width, 440);
      ctx.stroke();

      // Stand & pillars
      drawStandInside(ctx);
      drawPillarsInside(ctx, state.pillarsOn);

      // Rotate seesaw coordinate space
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(state.theta);
      
      drawBeamLocalInside(ctx);

      // Draw active beam objects
      state.objects.forEach(obj => {
        if (obj.state === 'beam') {
          const rx = obj.slot * scale;
          const stackOffset = getObjectStackOffset(obj, state.objects);
          const ry = -(beamThickness / 2 + stackOffset);
          drawObjectLocal(ctx, rx, ry, obj);
        }
      });

      // Draw ghost shadow helper
      if (state.draggedObject && state.hoveredSlot !== null) {
        const rx = state.hoveredSlot * scale;
        const tempOffset = state.objects.filter(o => o.state === 'beam' && o.slot === state.hoveredSlot && o.id !== state.draggedObject.id).reduce((sum, o) => sum + o.height, 0);
        const ry = -(beamThickness / 2 + tempOffset);
        
        ctx.globalAlpha = 0.35;
        drawObjectLocal(ctx, rx, ry, state.draggedObject);
        ctx.globalAlpha = 1.0;
      }
      ctx.restore();

      // Draw off-beam objects
      state.objects.forEach(obj => {
        if (obj.state === 'ground' || obj.state === 'dragging') {
          drawObjectGlobalLocal(ctx, obj);
        }
      });

      // Draw level bubble & shelf rack
      drawBubbleLevelInside(ctx, state.theta);
      drawShelfInside(ctx);

      if (currentMode === 'game' && gamePhase === 'correct') {
        drawVictoryStarsInside(ctx);
      }

      // Game state check when seesaw has swung & settled
      if (currentMode === 'game' && gamePhase === 'checking') {
        setProp(state, 'checkFrameCount', state.checkFrameCount + 1);
        // Wait 120 frames (2 seconds) for integration to settle
        if (state.checkFrameCount >= 120) {
          const challenge = getActiveChallenge();
          if (challenge) {
            let userIsCorrect = false;
            
            // Check direction of tilt
            let finalTilt = 'balance';
            if (state.theta > 0.05) finalTilt = 'right';
            else if (state.theta < -0.05) finalTilt = 'left';

            if (challenge.type === 'predict') {
              userIsCorrect = (finalTilt === gamePrediction);
            } else if (challenge.type === 'balance') {
              userIsCorrect = (finalTilt === 'balance' && challenge.checkAnswer(state.objects));
            } else if (challenge.type === 'mystery') {
              userIsCorrect = (finalTilt === 'balance' && mysteryMassGuess === challenge.answer);
            }

            if (userIsCorrect) {
              setGamePhase('correct');
              setGameScore(prev => prev + 2);
              setGameMessage('Excellent! Correct Answer! (+2 Stars)');
              
              // Launch victory stars explosion
              setProp(state, 'stars', []);
              for (let i = 0; i < 30; i++) {
                pushToArray(state.stars, {
                  x: cx + (Math.random() - 0.5) * 80,
                  y: 180 + (Math.random() - 0.5) * 40,
                  vx: (Math.random() - 0.5) * 6,
                  vy: -Math.random() * 5 - 2,
                  gravity: 0.14,
                  size: Math.random() * 5 + 6,
                  angle: Math.random() * Math.PI,
                  spin: (Math.random() - 0.5) * 0.1
                });
              }
            } else {
              setGamePhase('incorrect');
              setGameMessage('Oops! That is incorrect. Let\'s try again!');
            }
          }
        }
      }

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => {
      running = false;
      cancelAnimationFrame(requestRef.current);
    };
  }, [currentMode, activeCategory, showForces, showMarks, showLabels, gamePhase, gamePrediction, mysteryMassGuess, challengeIndex, getActiveChallenge, getShelfItems]);

  // Handle Level Selection
  const selectLevel = (level) => {
    setGameLevel(level);
    setChallengeIndex(0);
    loadChallenge(level, 0);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }} className="flex flex-col select-none font-sans text-white h-full">
      <style>{`
        .glass-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .glass-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .play-btn { background: rgba(46, 204, 113, 0.2); border-color: rgba(46, 204, 113, 0.3); color: #2ecc71; }
        .play-btn:hover { background: rgba(46, 204, 113, 0.3); }
        .reset-btn { background: rgba(231, 76, 60, 0.2); border-color: rgba(231, 76, 60, 0.3); color: #e74c3c; }
        .reset-btn:hover { background: rgba(231, 76, 60, 0.3); }
        
        .sim-select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          appearance: none;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sim-select:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .sim-select:focus {
          border-color: #3498db;
          background: rgba(20, 20, 30, 0.9);
        }
        .sim-select option {
          background: #14141e;
          color: #fff;
        }

        .glass-btn-blue:hover {
          background: rgba(52, 152, 219, 0.4) !important;
          border-color: #3498db !important;
          box-shadow: 0 0 12px rgba(52, 152, 219, 0.3);
        }
        
        /* Custom scrollbar styling for floating controls panel */
        .controls-panel-responsive::-webkit-scrollbar {
          width: 6px;
        }
        .controls-panel-responsive::-webkit-scrollbar-track {
          background: transparent;
        }
        .controls-panel-responsive::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .controls-panel-responsive::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Responsive layout tweaks */
        @media (max-width: 1200px) {
          .canvas-container-responsive {
            position: relative !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            margin-top: 120px !important;
            margin-bottom: 20px !important;
            padding: 20px !important;
          }
          .controls-panel-responsive {
            position: relative !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            max-width: 500px !important;
            margin: 0 auto 40px auto !important;
          }
        }
      `}</style>

      {/* Header controls bar */}
      <div style={{ height: '80px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              {onBack && (
                  <button onClick={onBack} className="glass-btn back-btn">
                      <ArrowLeft size={16} /> Back
                  </button>
              )}
          </div>
          <div>
              <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', margin: 0 }}>
                  {title || 'Balancing Act MG'}
              </h2>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => resetSimulation(true)} className="glass-btn reset-btn">
                  <RotateCcw size={18} /> Reset
              </button>
          </div>
      </div>

      {/* Main Workspace viewport */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Canvas display wrapper - Full Screen Left Side */}
        <div 
          style={{
            position: 'absolute',
            left: 0,
            right: '380px',
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
          className="canvas-container-responsive"
        >
          <div 
            style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            className="overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '800 / 550' }}
              className="cursor-grab active:cursor-grabbing touch-none block shadow-xl"
            />

            {/* Interactive Lab toolbox items selection tabs */}
            {currentMode === 'lab' && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 10,
                  background: 'rgba(20, 20, 30, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 12px',
                  borderRadius: '30px'
                }}
              >
                <button 
                  onClick={() => setActiveCategory('bricks')} 
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer glass-btn-blue"
                  style={{
                    background: activeCategory === 'bricks' ? 'rgba(52, 152, 219, 0.4)' : 'transparent',
                    border: activeCategory === 'bricks' ? '1px solid #3498db' : '1px solid transparent',
                    color: activeCategory === 'bricks' ? 'white' : '#94a3b8'
                  }}
                >
                  Bricks Shelf
                </button>
                <button 
                  onClick={() => setActiveCategory('people')} 
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer glass-btn-blue"
                  style={{
                    background: activeCategory === 'people' ? 'rgba(52, 152, 219, 0.4)' : 'transparent',
                    border: activeCategory === 'people' ? '1px solid #3498db' : '1px solid transparent',
                    color: activeCategory === 'people' ? 'white' : '#94a3b8'
                  }}
                >
                  People Shelf
                </button>
                <button 
                  onClick={() => setActiveCategory('mystery')} 
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer glass-btn-blue"
                  style={{
                    background: activeCategory === 'mystery' ? 'rgba(52, 152, 219, 0.4)' : 'transparent',
                    border: activeCategory === 'mystery' ? '1px solid #3498db' : '1px solid transparent',
                    color: activeCategory === 'mystery' ? 'white' : '#94a3b8'
                  }}
                >
                  Mystery Boxes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Floating Control panel */}
        <div 
          style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            bottom: '20px',
            width: '340px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            zIndex: 10,
            background: 'rgba(20, 20, 30, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '20px',
            borderRadius: '16px',
            color: 'white',
            fontFamily: "'Inter', sans-serif"
          }}
          className="controls-panel-responsive scrollbar-hide"
        >
          {currentMode !== 'game' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="font-bold text-base text-slate-200">Simulation Controls</h2>
              </div>

              {/* Pillars support raising toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Pillars Support</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPillarsOn(true)}
                    style={{ flex: 1, padding: '10px', background: pillarsOn ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.05)', color: '#fff', border: pillarsOn ? '1px solid #3498db' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Columns size={16} /> Locked Flat
                  </button>
                  <button
                    onClick={() => setPillarsOn(false)}
                    style={{ flex: 1, padding: '10px', background: !pillarsOn ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.05)', color: '#fff', border: !pillarsOn ? '1px solid #3498db' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Play size={16} /> Free Swing
                  </button>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

              {/* Overlays checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: '4px' }}>Visual Overlays</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showForces} onChange={(e) => setShowForces(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Show Force Vectors (Gravity)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showMarks} onChange={(e) => setShowMarks(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Show Ruler Level Marks</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>Show Mass Labels</span>
                  </label>
                </div>
              </div>

              {/* Info tip panel */}
              <div className="/50 rounded-xl p-3 border border-white/5 space-y-2 text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-purple-300 block flex items-center gap-1"><HelpCircle size={13} /> Lab Tip</span>
                <p>Drag blocks, people, or mystery boxes from the shelf at the bottom. If dropped near the seesaw, they snap to placement ticks. Stack multiple items on top of each other at the same slot!</p>
              </div>
            </div>
          ) : (
            /* GAME MODE SECTION PANEL */
            <section 
              style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                borderRadius: '16px',
                color: 'white',
                fontFamily: "'Inter', sans-serif"
              }}
              className="space-y-6"
            >
              {gameLevel === null ? (
                /* Level Select Screen */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h2 className="font-bold text-base text-slate-200">Select Game Level</h2>
                    <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                      <Sparkles size={12} /> {gameScore} Stars
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">Solve these physics torque balancing puzzles to earn stars! Each correct challenge awards +2 stars.</p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => selectLevel(1)}
                      className="glass-btn glass-btn-blue flex flex-col items-center justify-center p-4 rounded-xl group"
                      style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span className="font-bold text-lg text-white group-hover:text-[#3498db] transition-colors">Level 1</span>
                      <span className="text-[10px] text-slate-400 mt-1">Predict Tilt</span>
                    </button>

                    <button 
                      onClick={() => selectLevel(2)}
                      className="glass-btn glass-btn-blue flex flex-col items-center justify-center p-4 rounded-xl group"
                      style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span className="font-bold text-lg text-white group-hover:text-[#3498db] transition-colors">Level 2</span>
                      <span className="text-[10px] text-slate-400 mt-1">Balance Seesaw</span>
                    </button>

                    <button 
                      onClick={() => selectLevel(3)}
                      className="glass-btn glass-btn-blue flex flex-col items-center justify-center p-4 rounded-xl group"
                      style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span className="font-bold text-lg text-white group-hover:text-[#3498db] transition-colors">Level 3</span>
                      <span className="text-[10px] text-slate-400 mt-1">Mystery Mass</span>
                    </button>

                    <button 
                      onClick={() => selectLevel(4)}
                      className="glass-btn glass-btn-blue flex flex-col items-center justify-center p-4 rounded-xl group"
                      style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span className="font-bold text-lg text-white group-hover:text-[#3498db] transition-colors">Level 4</span>
                      <span className="text-[10px] text-slate-400 mt-1">Complex Balance</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Challenge display */
                <div className="space-y-6">
                  {/* Challenge Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Level {gameLevel} — Challenge {challengeIndex + 1}</span>
                      <h3 className="font-bold text-sm text-slate-200 mt-0.5">Torque Puzzle</h3>
                    </div>
                    <button
                      onClick={() => setGameLevel(null)}
                      className="text-xs glass-btn glass-btn-blue"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px'
                      }}
                    >
                      Exit Level
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div className="/50 border border-white/5 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-200 leading-relaxed flex items-start gap-1.5">
                      <HelpCircle size={15} className="text-[#3498db] shrink-0 mt-0.5" />
                      {getActiveChallenge()?.question}
                    </p>
                  </div>

                  {/* Level 1: Prediction choices buttons */}
                  {getActiveChallenge()?.type === 'predict' && gamePhase === 'question' && (
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Make your prediction:</label>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setGamePrediction('left')}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer glass-btn-blue"
                          style={{
                            background: gamePrediction === 'left' ? 'rgba(52, 152, 219, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                            borderColor: gamePrediction === 'left' ? '#3498db' : 'rgba(255, 255, 255, 0.1)',
                            color: gamePrediction === 'left' ? '#3498db' : 'white',
                          }}
                        >
                          Seesaw will tilt Left (Counterclockwise)
                        </button>
                        <button
                          onClick={() => setGamePrediction('balance')}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer glass-btn-blue"
                          style={{
                            background: gamePrediction === 'balance' ? 'rgba(52, 152, 219, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                            borderColor: gamePrediction === 'balance' ? '#3498db' : 'rgba(255, 255, 255, 0.1)',
                            color: gamePrediction === 'balance' ? '#3498db' : 'white',
                          }}
                        >
                          Seesaw will Balance horizontally
                        </button>
                        <button
                          onClick={() => setGamePrediction('right')}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer glass-btn-blue"
                          style={{
                            background: gamePrediction === 'right' ? 'rgba(52, 152, 219, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                            borderColor: gamePrediction === 'right' ? '#3498db' : 'rgba(255, 255, 255, 0.1)',
                            color: gamePrediction === 'right' ? '#3498db' : 'white',
                          }}
                        >
                          Seesaw will tilt Right (Clockwise)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Level 3: Mystery Mass Guesses */}
                  {getActiveChallenge()?.type === 'mystery' && gamePhase === 'question' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guess Box Mass:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {getActiveChallenge()?.choices.map(choice => (
                          <button
                            key={choice}
                            onClick={() => setMysteryMassGuess(choice)}
                            className="py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer glass-btn-blue"
                            style={{
                              background: mysteryMassGuess === choice ? 'rgba(52, 152, 219, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                              borderColor: mysteryMassGuess === choice ? '#3498db' : 'rgba(255, 255, 255, 0.1)',
                              color: mysteryMassGuess === choice ? '#3498db' : 'white',
                            }}
                          >
                            {choice} kg
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback messaging banner */}
                  {gameMessage && (
                    <div className={`p-3 rounded-xl border text-xs leading-normal flex items-start gap-2 ${
                      gamePhase === 'correct' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      gamePhase === 'incorrect' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-purple-500/10 border-purple-500/20 text-purple-400'
                    }`}>
                      {gamePhase === 'correct' && <Award size={15} className="shrink-0" />}
                      <span>{gameMessage}</span>
                    </div>
                  )}

                  {/* Action verification buttons */}
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    {gamePhase === 'question' && (
                      <button
                        onClick={handleCheckAnswer}
                        className="w-full py-3 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 glass-btn-blue"
                        style={{
                          background: 'rgba(52, 152, 219, 0.6)',
                          borderColor: '#3498db',
                          boxShadow: '0 0 15px rgba(52, 152, 219, 0.3)'
                        }}
                      >
                        <Check size={14} /> Check Answer
                      </button>
                    )}

                    {gamePhase === 'checking' && (
                      <button
                        disabled
                        className="w-full py-3 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-not-allowed flex items-center justify-center gap-1.5" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                      >
                        <RotateCcw size={14} className="animate-spin" /> Verifying Balance...
                      </button>
                    )}

                    {gamePhase === 'correct' && (
                      <button
                        onClick={handleNextChallenge}
                        className="w-full py-3 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        style={{
                          background: 'rgba(46, 204, 113, 0.6)',
                          border: '1px solid #2ecc71',
                          boxShadow: '0 0 15px rgba(46, 204, 113, 0.3)'
                        }}
                      >
                        Next Challenge
                      </button>
                    )}

                    {gamePhase === 'incorrect' && (
                      <button
                        onClick={handleTryAgain}
                        className="w-full py-3 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        style={{
                          background: 'rgba(231, 76, 60, 0.6)',
                          border: '1px solid #e74c3c',
                          boxShadow: '0 0 15px rgba(231, 76, 60, 0.3)'
                        }}
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Educational Formula Reference Box */}
          <section 
            style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              padding: '20px',
              borderRadius: '16px',
              color: 'white',
              fontFamily: "'Inter', sans-serif"
            }}
            className="space-y-4"
          >
            <h3 className="font-bold text-sm text-slate-200 border-b border-white/5 pb-2">Physics Reference</h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-400">
              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Rotational Torque</span>
                <code className="text-purple-300 font-mono text-[11px]">Torque (τ) = F × d = (m × g) × d</code>
                <p className="mt-1">Where <code className="font-mono">d</code> is the distance from the pivot, <code className="font-mono">m</code> is the mass, and <code className="font-mono">g</code> is gravity (9.81 m/s²).</p>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Condition for Balance</span>
                <code className="text-purple-300 font-mono text-[11px]">Σ τ_left = Σ τ_right</code>
                <p className="mt-1">For a seesaw to remain perfectly horizontal, the sum of all counterclockwise torques on the left must equal the sum of all clockwise torques on the right.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
