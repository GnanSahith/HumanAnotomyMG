import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings2, ArrowLeft, Activity, Ruler, Timer, BarChart2, BookOpen, Info, HelpCircle } from 'lucide-react';

function CustomMassesandSpringsBasicsInner({ onBack, title }) {
    // ----------------------------------------------------
    // State Variables (React-controlled for UI settings)
    // ----------------------------------------------------
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedMode, setSpeedMode] = useState('normal'); // 'normal' | 'slow'
    const [springConstant, setSpringConstant] = useState(5); // Slider scale 1-10
    const [dampingPreset, setDampingPreset] = useState('friction'); // 'none' | 'friction' | 'lots'
    const [dampingValue, setDampingValue] = useState(0.15); // Physical value
    const [gravityPreset, setGravityPreset] = useState('earth'); // 'moon' | 'earth' | 'jupiter' | 'custom'
    const [gravityValue, setGravityValue] = useState(9.81); // m/s^2
    const [showNaturalLength, setShowNaturalLength] = useState(true);
    const [showEquilibrium, setShowEquilibrium] = useState(true);
    const [showRuler, setShowRuler] = useState(false);
    const [showStopwatch, setShowStopwatch] = useState(false);
    const [showGraph, setShowGraph] = useState(true);
    const [stopwatchRunning, setStopwatchRunning] = useState(false);

    const [activeTab, setActiveTab] = useState('theory'); // 'theory' | 'energy' | 'activities'

    // ----------------------------------------------------
    // Refs for Physics State (Direct manipulation at 60fps)
    // ----------------------------------------------------
    const canvasRef = useRef(null);
    const graphCanvasRef = useRef(null);
    const stopwatchDOMRef = useRef(null);
    
    // DOM Refs for Energy Bars & Values (Direct updates to avoid React render lag)
    const domRefs = useRef({
        keBar: null, peElasBar: null, peGravBar: null, thermalBar: null, totalBar: null,
        keVal: null, peElasVal: null, peGravVal: null, thermalVal: null, totalVal: null
    });

    // Physical Constants and State
    const L0 = 0.9; // Natural length of the spring in meters
    const yRef = useRef(0.9); // Current bottom coordinate of the spring in meters
    const vyRef = useRef(0.0); // Velocity of the attached mass in m/s
    const thermalEnergyRef = useRef(0.0); // Accumulated heat energy (Joule)
    const stopwatchTimeRef = useRef(0.0); // Stopwatch elapsed simulation time

    // Interactive Drag State
    const draggedWeightIdRef = useRef(null);
    const isDraggingAttachedRef = useRef(false);
    const isDraggingRulerRef = useRef(false);
    
    const dragOffsetXRef = useRef(0);
    const dragOffsetYRef = useRef(0);
    const rulerXRef = useRef(350);
    const rulerYRef = useRef(120);
    const rulerOffsetXRef = useRef(0);
    const rulerOffsetYRef = useRef(0);

    // Weights configuration & positions
    // Initially, weights reside at their home coordinates on the rack.
    const rackWeightsRef = useRef([
        { id: 1, mass: 0.05, labelText: '50g', color: '#ff9f0a', x: 100, y: 620, homeX: 100, homeY: 620, radius: 20, height: 35, isReturning: false },
        { id: 2, mass: 0.10, labelText: '100g', color: '#30d158', x: 220, y: 620, homeX: 220, homeY: 620, radius: 26, height: 45, isReturning: false },
        { id: 3, mass: 0.25, labelText: '250g', color: '#ff3b30', x: 340, y: 620, homeX: 340, homeY: 620, radius: 34, height: 60, isReturning: false }
    ]);
    const attachedWeightRef = useRef(null);

    // History for the Oscilloscope Graph
    const historyRef = useRef([]);

    // Sync state/refs for the tick loop
    const isPlayingRef = useRef(isPlaying);
    const speedModeRef = useRef(speedMode);
    const springConstantRef = useRef(springConstant);
    const gravityValueRef = useRef(gravityValue);
    const dampingValueRef = useRef(dampingValue);
    const stopwatchRunningRef = useRef(stopwatchRunning);
    const showGraphRef = useRef(showGraph);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { speedModeRef.current = speedMode; }, [speedMode]);
    useEffect(() => { springConstantRef.current = springConstant; }, [springConstant]);
    useEffect(() => { gravityValueRef.current = gravityValue; }, [gravityValue]);
    useEffect(() => { dampingValueRef.current = dampingValue; }, [dampingValue]);
    useEffect(() => { stopwatchRunningRef.current = stopwatchRunning; }, [stopwatchRunning]);
    useEffect(() => { showGraphRef.current = showGraph; }, [showGraph]);

    // Darken colors for realistic radial shadows
    const darkenColor = (hex, percent) => {
        const num = parseInt(hex.replace("#",""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = (num >> 8 & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
    };

    // ----------------------------------------------------
    // Preset Handlers
    // ----------------------------------------------------
    const handleDampingChange = (preset) => {
        setDampingPreset(preset);
        let val = 0.15;
        if (preset === 'none') val = 0.0;
        else if (preset === 'lots') val = 0.65;
        setDampingValue(val);
    };

    const handleGravityChange = (preset) => {
        setGravityPreset(preset);
        let val = 9.81;
        if (preset === 'moon') val = 1.62;
        else if (preset === 'jupiter') val = 24.79;
        setGravityValue(val);
    };

    const handleReset = () => {
        setIsPlaying(false);
        setSpeedMode('normal');
        setSpringConstant(5);
        setDampingPreset('friction');
        setDampingValue(0.15);
        setGravityPreset('earth');
        setGravityValue(9.81);
        setShowNaturalLength(true);
        setShowEquilibrium(true);
        setShowRuler(false);
        setShowStopwatch(false);
        setStopwatchRunning(false);
        
        yRef.current = 0.9;
        vyRef.current = 0.0;
        thermalEnergyRef.current = 0.0;
        stopwatchTimeRef.current = 0.0;
        historyRef.current = [];
        
        attachedWeightRef.current = null;
        rackWeightsRef.current.forEach(w => {
            w.x = w.homeX;
            w.y = w.homeY;
            w.isReturning = false;
        });

        rulerXRef.current = 350;
        rulerYRef.current = 120;

        if (stopwatchDOMRef.current) {
            stopwatchDOMRef.current.textContent = "00:00.00";
        }
        updateEnergyBars();
    };

    const handleToggleStopwatch = () => {
        setStopwatchRunning(!stopwatchRunning);
    };

    const handleResetStopwatch = () => {
        setStopwatchRunning(false);
        stopwatchRunningRef.current = false;
        stopwatchTimeRef.current = 0.0;
        if (stopwatchDOMRef.current) {
            stopwatchDOMRef.current.textContent = "00:00.00";
        }
    };

    // ----------------------------------------------------
    // Drag-and-Drop Pointer Event Handlers
    // ----------------------------------------------------
    const handlePointerDown = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        // 1. Check if clicked on ruler
        if (showRuler) {
            const rx = rulerXRef.current;
            const ry = rulerYRef.current;
            const rw = 50;
            const rh = 300;
            if (mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh) {
                isDraggingRulerRef.current = true;
                rulerOffsetXRef.current = mx - rx;
                rulerOffsetYRef.current = my - ry;
                canvas.setPointerCapture(e.pointerId);
                return;
            }
        }

        // 2. Check if clicked on attached weight
        if (attachedWeightRef.current) {
            const w = attachedWeightRef.current;
            const yEnd = 60 + yRef.current * 200;
            const wy = yEnd + w.height / 2 + 5;
            const wx = 250;
            const dist = Math.sqrt((mx - wx) * (mx - wx) + (my - wy) * (my - wy));
            if (dist <= w.radius + 15) {
                isDraggingAttachedRef.current = true;
                dragOffsetYRef.current = my - yEnd;
                vyRef.current = 0.0;
                canvas.setPointerCapture(e.pointerId);
                return;
            }
        }

        // 3. Check if clicked on rack weight
        for (let i = 0; i < rackWeightsRef.current.length; i++) {
            const w = rackWeightsRef.current[i];
            if (attachedWeightRef.current && attachedWeightRef.current.id === w.id) {
                continue;
            }
            const dist = Math.sqrt((mx - w.x) * (mx - w.x) + (my - w.y) * (my - w.y));
            if (dist <= w.radius + 12) {
                draggedWeightIdRef.current = w.id;
                dragOffsetXRef.current = mx - w.x;
                dragOffsetYRef.current = my - w.y;
                w.isReturning = false;
                canvas.setPointerCapture(e.pointerId);
                return;
            }
        }
    };

    const handlePointerMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        if (isDraggingRulerRef.current) {
            rulerXRef.current = Math.max(0, Math.min(canvas.width - 50, mx - rulerOffsetXRef.current));
            rulerYRef.current = Math.max(0, Math.min(canvas.height - 300, my - rulerOffsetYRef.current));
            return;
        }

        if (isDraggingAttachedRef.current) {
            const yEnd = my - dragOffsetYRef.current;
            let newY = (yEnd - 60) / 200;
            // Limit range: 0.15m to 2.8m
            newY = Math.max(0.15, Math.min(2.8, newY));
            yRef.current = newY;
            vyRef.current = 0.0;

            // Detach if dragged far horizontally
            if (Math.abs(mx - 250) > 90) {
                const w = attachedWeightRef.current;
                w.x = mx;
                w.y = my;
                draggedWeightIdRef.current = w.id;
                dragOffsetXRef.current = 0;
                dragOffsetYRef.current = 0;
                attachedWeightRef.current = null;
                isDraggingAttachedRef.current = false;
                yRef.current = 0.9;
                vyRef.current = 0.0;
            }
            return;
        }

        if (draggedWeightIdRef.current !== null) {
            const w = rackWeightsRef.current.find(wt => wt.id === draggedWeightIdRef.current);
            if (w) {
                w.x = Math.max(0, Math.min(canvas.width, mx - dragOffsetXRef.current));
                w.y = Math.max(0, Math.min(canvas.height, my - dragOffsetYRef.current));
            }
        }
    };

    const handlePointerUp = (e) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.releasePointerCapture(e.pointerId);
        }

        isDraggingRulerRef.current = false;
        
        if (isDraggingAttachedRef.current) {
            isDraggingAttachedRef.current = false;
            return;
        }

        if (draggedWeightIdRef.current !== null) {
            const w = rackWeightsRef.current.find(wt => wt.id === draggedWeightIdRef.current);
            if (w) {
                const yEnd = 60 + yRef.current * 200;
                const topX = w.x;
                const topY = w.y - w.height / 2;
                const dist = Math.sqrt((topX - 250) * (topX - 250) + (topY - yEnd) * (topY - yEnd));

                if (dist < 45) {
                    // Snap onto hook
                    if (attachedWeightRef.current) {
                        // Return previous weight
                        attachedWeightRef.current.isReturning = true;
                    }
                    attachedWeightRef.current = w;
                    yRef.current = Math.max(0.15, Math.min(2.8, (w.y - w.height / 2 - 65) / 200));
                    vyRef.current = 0.0;
                    thermalEnergyRef.current = 0.0;
                } else {
                    w.isReturning = true;
                }
            }
            draggedWeightIdRef.current = null;
        }
    };

    // ----------------------------------------------------
    // Physics Updates
    // ----------------------------------------------------
    const updatePhysics = (dt) => {
        if (attachedWeightRef.current === null) return;
        if (isDraggingAttachedRef.current) return;

        const m = attachedWeightRef.current.mass;
        const k = 4.0 + springConstantRef.current * 2.2; // mapping spring constant
        const g = gravityValueRef.current;
        const c = dampingValueRef.current;

        // Sub-stepping for integration stability (Euler-Cromer method)
        const subSteps = 10;
        const subDt = dt / subSteps;

        for (let i = 0; i < subSteps; i++) {
            const x = yRef.current - L0;
            const F_spring = -k * x;
            const F_gravity = m * g;
            const F_damping = -c * vyRef.current;
            const F_net = F_spring + F_gravity + F_damping;

            const acc = F_net / m;
            vyRef.current += acc * subDt;
            yRef.current += vyRef.current * subDt;

            // Thermal work = damping force * velocity * dt
            thermalEnergyRef.current += Math.max(0.0, c * vyRef.current * vyRef.current * subDt);
        }

        // Keep position in bounds (ceiling & lower limit bounce)
        if (yRef.current < 0.15) {
            yRef.current = 0.15;
            vyRef.current = -vyRef.current * 0.3; // bounce energy loss
        }
        if (yRef.current > 2.8) {
            yRef.current = 2.8;
            vyRef.current = -vyRef.current * 0.3;
        }
    };

    const updateWeightsAnimation = () => {
        rackWeightsRef.current.forEach(w => {
            if (attachedWeightRef.current && attachedWeightRef.current.id === w.id) {
                // Pin attached weight to the bottom hook
                const yEnd = 60 + yRef.current * 200;
                w.x = 250;
                w.y = yEnd + w.height / 2 + 5;
            } else if (w.isReturning) {
                const dx = w.homeX - w.x;
                const dy = w.homeY - w.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    w.x += (dx / dist) * Math.min(dist, 12);
                    w.y += (dy / dist) * Math.min(dist, 12);
                } else {
                    w.x = w.homeX;
                    w.y = w.homeY;
                    w.isReturning = false;
                }
            }
        });
    };

    // ----------------------------------------------------
    // Rendering Logic (Canvas drawings)
    // ----------------------------------------------------
    const drawMainCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // 1. Draw Grid Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // 2. Draw Natural Length Reference Line (Cyan)
        if (showNaturalLength) {
            const yNat = 60 + L0 * 200;
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(30, yNat);
            ctx.lineTo(w - 30, yNat);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#00f0ff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('NATURAL LENGTH', 35, yNat - 6);
        }

        // 3. Draw Equilibrium Position Reference Line (Green)
        if (showEquilibrium && attachedWeightRef.current) {
            const m = attachedWeightRef.current.mass;
            const k = 4.0 + springConstantRef.current * 2.2;
            const g = gravityValueRef.current;
            const yEq = L0 + (m * g) / k;
            const yEqPx = 60 + yEq * 200;

            ctx.strokeStyle = 'rgba(48, 209, 88, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(30, yEqPx);
            ctx.lineTo(w - 30, yEqPx);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#30d158';
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('EQUILIBRIUM POSITION', 35, yEqPx + 14);
        }

        // 4. Draw Spring Coil
        const yEnd = 60 + yRef.current * 200;
        const springTop = 60;
        const coilStart = 85;
        const coilEnd = yEnd - 12;

        ctx.strokeStyle = '#8e8e93';
        // Thickness adapts based on Spring Constant strength
        ctx.lineWidth = 2.5 + springConstantRef.current * 0.45; 
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(250, springTop);
        ctx.lineTo(250, coilStart);

        const numCoils = 15;
        const coilHeight = coilEnd - coilStart;
        const stepsPerCoil = 30;
        const totalSteps = numCoils * stepsPerCoil;
        const radius = 18;

        for (let i = 0; i <= totalSteps; i++) {
            const fraction = i / totalSteps;
            const cy = coilStart + fraction * coilHeight;
            const angle = fraction * Math.PI * 2 * numCoils;
            const cx = 250 + Math.sin(angle) * radius;
            ctx.lineTo(cx, cy);
        }
        ctx.lineTo(250, coilEnd);
        ctx.lineTo(250, yEnd);
        ctx.stroke();

        // Draw spring bottom hook
        ctx.strokeStyle = '#a1a1b5';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(250, yEnd + 5, 5, -Math.PI / 2, Math.PI * 0.75);
        ctx.stroke();

        // 5. Draw Ceiling Support
        ctx.fillStyle = '#1c1c1e';
        ctx.strokeStyle = '#3a3a3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(50, 48, 400, 12);
        ctx.fill();
        ctx.stroke();

        // Ceiling stripes
        ctx.strokeStyle = '#48484a';
        ctx.lineWidth = 1.5;
        for (let x = 60; x < 450; x += 15) {
            ctx.beginPath();
            ctx.moveTo(x, 48);
            ctx.lineTo(x + 10, 60);
            ctx.stroke();
        }

        // 6. Draw Hanging Rack base
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(40, 595, 420, 95);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WEIGHT RACK', 250, 680);

        // 7. Draw Weights
        rackWeightsRef.current.forEach(wt => {
            const { x, y, radius, height, color, labelText } = wt;
            ctx.save();
            
            // Draw weight hook
            ctx.strokeStyle = '#d1d1d6';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x, y - height / 2 - 4, 4, 0, Math.PI * 2);
            ctx.stroke();

            // 3D cylindrical gradient body
            const gradient = ctx.createRadialGradient(x - radius / 3, y - height / 4, radius / 8, x, y, radius * 1.2);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.2, color);
            gradient.addColorStop(1, darkenColor(color, 50));

            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#1c1c1e';
            ctx.lineWidth = 1.5;

            // Draw rounded cylinder body
            ctx.beginPath();
            ctx.moveTo(x - radius, y - height / 2 + 5);
            ctx.quadraticCurveTo(x - radius, y - height / 2, x - radius + 5, y - height / 2);
            ctx.lineTo(x + radius - 5, y - height / 2);
            ctx.quadraticCurveTo(x + radius, y - height / 2, x + radius, y - height / 2 + 5);
            ctx.lineTo(x + radius, y + height / 2 - 5);
            ctx.quadraticCurveTo(x + radius, y + height / 2, x + radius - 5, y + height / 2);
            ctx.lineTo(x - radius + 5, y + height / 2);
            ctx.quadraticCurveTo(x - radius, y + height / 2, x - radius, y + height / 2 - 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Highlight top lip
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - radius + 3, y - height / 2 + 2);
            ctx.lineTo(x + radius - 3, y - height / 2 + 2);
            ctx.stroke();

            // Text Label
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 3;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, x, y);
            ctx.restore();
        });

        // 8. Draw Ruler
        if (showRuler) {
            const rx = rulerXRef.current;
            const ry = rulerYRef.current;
            const rw = 50;
            const rh = 300;

            ctx.save();
            ctx.fillStyle = 'rgba(253, 224, 71, 0.18)';
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(rx, ry, rw, rh);
            ctx.fill();
            ctx.stroke();

            // Drag indicator block at top
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.rect(rx, ry, rw, 16);
            ctx.fill();

            ctx.fillStyle = '#1c1c1e';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DRAG ME', rx + rw / 2, ry + 11);

            // Tick marks every 10 pixels (let's say representing centimeters)
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.9)';
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            
            const startY = ry + 16;
            const endY = ry + rh - 4;
            const gap = 10;
            const numTicks = Math.floor((endY - startY) / gap);

            for (let i = 0; i <= numTicks; i++) {
                const ty = startY + i * gap;
                ctx.beginPath();
                ctx.lineWidth = 1;
                
                if (i % 10 === 0) {
                    ctx.moveTo(rx, ty);
                    ctx.lineTo(rx + 18, ty);
                    ctx.stroke();
                    ctx.fillText((i).toString(), rx + 22, ty);
                } else if (i % 5 === 0) {
                    ctx.moveTo(rx, ty);
                    ctx.lineTo(rx + 12, ty);
                    ctx.stroke();
                } else {
                    ctx.moveTo(rx, ty);
                    ctx.lineTo(rx + 7, ty);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    };

    const drawGraph = () => {
        const canvas = graphCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#08080c';
        ctx.fillRect(0, 0, w, h);

        // Subtle grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Center equilibrium line
        const centerY = h / 2;
        ctx.strokeStyle = 'rgba(48, 209, 88, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Plot displacement curve
        const history = historyRef.current;
        if (history.length > 1) {
            ctx.strokeStyle = '#30d158'; // Green trace
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const startX = w - history.length;
            ctx.moveTo(startX, centerY - history[0] * 125);
            for (let i = 1; i < history.length; i++) {
                const px = startX + i;
                const py = centerY - history[i] * 125;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        // Headings
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('DISPLACEMENT (y - yEq) vs TIME', 12, 16);
    };

    // ----------------------------------------------------
    // Update Energy Values on DOM Refs
    // ----------------------------------------------------
    const updateEnergyBars = () => {
        if (attachedWeightRef.current === null) {
            ['ke', 'peElas', 'peGrav', 'thermal', 'total'].forEach(type => {
                if (domRefs.current[type + 'Bar']) domRefs.current[type + 'Bar'].style.height = '0%';
                if (domRefs.current[type + 'Val']) domRefs.current[type + 'Val'].textContent = '0.00 J';
            });
            return;
        }

        const m = attachedWeightRef.current.mass;
        const k = 4.0 + springConstantRef.current * 2.2;
        const g = gravityValueRef.current;
        const y = yRef.current;
        const vy = vyRef.current;

        const ke = 0.5 * m * vy * vy;
        const peElas = 0.5 * k * (y - L0) * (y - L0);
        // Datum set at 3.2m to ensure gravitational potential is always positive
        const peGrav = m * g * Math.max(0.0, 3.2 - y); 
        const thermal = thermalEnergyRef.current;
        const total = ke + peElas + peGrav + thermal;

        // Auto-scale energy bars relative to max energy seen plus margin
        const maxEnergy = Math.max(8.0, total * 1.15);

        const kePct = (ke / maxEnergy) * 100;
        const peElasPct = (peElas / maxEnergy) * 100;
        const peGravPct = (peGrav / maxEnergy) * 100;
        const thermalPct = (thermal / maxEnergy) * 100;
        const totalPct = (total / maxEnergy) * 100;

        if (domRefs.current.keBar) domRefs.current.keBar.style.height = `${Math.min(100, kePct)}%`;
        if (domRefs.current.peElasBar) domRefs.current.peElasBar.style.height = `${Math.min(100, peElasPct)}%`;
        if (domRefs.current.peGravBar) domRefs.current.peGravBar.style.height = `${Math.min(100, peGravPct)}%`;
        if (domRefs.current.thermalBar) domRefs.current.thermalBar.style.height = `${Math.min(100, thermalPct)}%`;
        if (domRefs.current.totalBar) domRefs.current.totalBar.style.height = `${Math.min(100, totalPct)}%`;

        if (domRefs.current.keVal) domRefs.current.keVal.textContent = `${ke.toFixed(2)} J`;
        if (domRefs.current.peElasVal) domRefs.current.peElasVal.textContent = `${peElas.toFixed(2)} J`;
        if (domRefs.current.peGravVal) domRefs.current.peGravVal.textContent = `${peGrav.toFixed(2)} J`;
        if (domRefs.current.thermalVal) domRefs.current.thermalVal.textContent = `${thermal.toFixed(2)} J`;
        if (domRefs.current.totalVal) domRefs.current.totalVal.textContent = `${total.toFixed(2)} J`;
    };

    // ----------------------------------------------------
    // Continuous 60fps Loop Effect
    // ----------------------------------------------------
    useEffect(() => {
        let requestID;
        let lastTime = performance.now();

        const loop = (now) => {
            let dt = (now - lastTime) / 1000;
            lastTime = now;

            // Cap elapsed time to avoid giant steps on tab backgrounding
            dt = Math.min(dt, 0.1);

            const speedMultiplier = speedModeRef.current === 'slow' ? 0.22 : 1.0;
            const simDt = dt * speedMultiplier;

            // Update Physics
            if (isPlayingRef.current) {
                updatePhysics(simDt);

                // Increment stopwatch
                if (stopwatchRunningRef.current) {
                    stopwatchTimeRef.current += simDt;
                    if (stopwatchDOMRef.current) {
                        const time = stopwatchTimeRef.current;
                        const min = Math.floor(time / 60).toString().padStart(2, '0');
                        const sec = Math.floor(time % 60).toString().padStart(2, '0');
                        const ms = Math.floor((time * 100) % 100).toString().padStart(2, '0');
                        stopwatchDOMRef.current.textContent = `${min}:${sec}.${ms}`;
                    }
                }
            }

            // Animate weights returning to rack
            updateWeightsAnimation();

            // Render canvases
            drawMainCanvas();
            if (showGraphRef.current) {
                drawGraph();
            }

            // Accumulate Graph history
            const m = attachedWeightRef.current ? attachedWeightRef.current.mass : 0;
            const k = 4.0 + springConstantRef.current * 2.2;
            const g = gravityValueRef.current;
            const yEq = L0 + (m * g) / k;
            const displacement = attachedWeightRef.current ? yRef.current - yEq : 0;

            if (isPlayingRef.current) {
                historyRef.current.push(displacement);
                if (historyRef.current.length > 400) {
                    historyRef.current.shift();
                }
            }

            // Render energy readouts
            updateEnergyBars();

            requestID = requestAnimationFrame(loop);
        };

        requestID = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestID);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ----------------------------------------------------
    // JSX Render
    // ----------------------------------------------------
    return (
        <div className="w-full h-full flex flex-col bg-transparent text-white font-sans" style={{ paddingTop: '80px', height: '100%', overflowY: 'auto' }}>
            {/* Header controls bar */}
            <div className="flex justify-end items-center px-6 py-4 border-b border-white/5 bg-white/[0.01] backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    {/* Play/Pause control */}
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition cursor-pointer shadow-lg ${
                            isPlaying 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/35' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/35'
                        }`}
                    >
                        {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
                        {isPlaying ? 'Pause Simulation' : 'Run Simulation'}
                    </button>

                    {/* Speed Selector */}
                    <div className="flex bg-white/5 rounded-full p-1 border border-white/10" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                        <button
                            onClick={() => setSpeedMode('normal')}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                                speedMode === 'normal' ? 'bg-[#00f0ff] text-black shadow-md' : 'text-white/60 hover:text-white'
                            }`}
                        >
                            Normal Speed
                        </button>
                        <button
                            onClick={() => setSpeedMode('slow')}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                                speedMode === 'slow' ? 'bg-[#00f0ff] text-black shadow-md' : 'text-white/60 hover:text-white'
                            }`}
                        >
                            Slow Motion
                        </button>
                    </div>

                    {/* Reset All */}
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-white/80 hover:text-white" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                    >
                        <RotateCcw size={16} /> Reset Lab
                    </button>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_370px] gap-6 p-6 min-h-0">
                
                {/* 1. Left Panel: Vertical Energy Chart */}
                <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 backdrop-blur-xl h-full min-h-[500px]">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                        <BarChart2 size={18} className="text-[#00f0ff]" />
                        <h3 className="font-semibold text-sm tracking-wider uppercase text-white/70">Energy Plotter</h3>
                    </div>

                    {/* Energy bar visualizer container */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
                        {/* Kinetic Energy Bar */}
                        <div className="flex flex-col items-center h-full justify-end w-[16%] relative group">
                            <div className="absolute bottom-full mb-1 text-[9px] font-mono text-emerald-400 bg-[#0c0c14] border border-white/10 rounded px-1 hidden group-hover:block" ref={el => domRefs.current.keVal = el}>0.00 J</div>
                            <div className="w-full bg-emerald-500 rounded-t shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all duration-75" ref={el => domRefs.current.keBar = el} style={{ height: '0%' }}></div>
                            <span className="text-[10px] text-white/50 mt-2 font-medium">KE</span>
                        </div>

                        {/* PE Elastic Bar */}
                        <div className="flex flex-col items-center h-full justify-end w-[16%] relative group">
                            <div className="absolute bottom-full mb-1 text-[9px] font-mono text-[#00f0ff] bg-[#0c0c14] border border-white/10 rounded px-1 hidden group-hover:block" ref={el => domRefs.current.peElasVal = el}>0.00 J</div>
                            <div className="w-full bg-[#00f0ff] rounded-t shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all duration-75" ref={el => domRefs.current.peElasBar = el} style={{ height: '0%' }}></div>
                            <span className="text-[10px] text-white/50 mt-2 font-medium">PE el</span>
                        </div>

                        {/* PE Gravitational Bar */}
                        <div className="flex flex-col items-center h-full justify-end w-[16%] relative group">
                            <div className="absolute bottom-full mb-1 text-[9px] font-mono text-amber-500 bg-[#0c0c14] border border-white/10 rounded px-1 hidden group-hover:block" ref={el => domRefs.current.peGravVal = el}>0.00 J</div>
                            <div className="w-full bg-amber-500 rounded-t shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all duration-75" ref={el => domRefs.current.peGravBar = el} style={{ height: '0%' }}></div>
                            <span className="text-[10px] text-white/50 mt-2 font-medium">PE g</span>
                        </div>

                        {/* Thermal Energy Bar */}
                        <div className="flex flex-col items-center h-full justify-end w-[16%] relative group">
                            <div className="absolute bottom-full mb-1 text-[9px] font-mono text-rose-400 bg-[#0c0c14] border border-white/10 rounded px-1 hidden group-hover:block" ref={el => domRefs.current.thermalVal = el}>0.00 J</div>
                            <div className="w-full bg-rose-500 rounded-t shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all duration-75" ref={el => domRefs.current.thermalBar = el} style={{ height: '0%' }}></div>
                            <span className="text-[10px] text-white/50 mt-2 font-medium">Th</span>
                        </div>

                        {/* Total Energy Bar */}
                        <div className="flex flex-col items-center h-full justify-end w-[18%] relative group border-l border-white/10 pl-2">
                            <div className="absolute bottom-full mb-1 text-[9px] font-mono text-yellow-300 bg-[#0c0c14] border border-white/10 rounded px-1 hidden group-hover:block" ref={el => domRefs.current.totalVal = el}>0.00 J</div>
                            <div className="w-full bg-yellow-400 rounded-t shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all duration-75" ref={el => domRefs.current.totalBar = el} style={{ height: '0%' }}></div>
                            <span className="text-[10px] text-yellow-200 mt-2 font-bold">Total</span>
                        </div>
                    </div>

                    {/* Detailed Energy Legend */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-2.5" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                        <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1.5 text-white/60">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Kinetic (KE)
                            </span>
                            <span className="font-mono font-bold" ref={el => domRefs.current.keVal = el}>0.00 J</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1.5 text-white/60">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]"></span> Elastic PE (PE el)
                            </span>
                            <span className="font-mono font-bold" ref={el => domRefs.current.peElasVal = el}>0.00 J</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1.5 text-white/60">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Gravity PE (PE g)
                            </span>
                            <span className="font-mono font-bold" ref={el => domRefs.current.peGravVal = el}>0.00 J</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1.5 text-white/60">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Thermal (Th)
                            </span>
                            <span className="font-mono font-bold" ref={el => domRefs.current.thermalVal = el}>0.00 J</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2 font-semibold text-yellow-300">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Total Energy
                            </span>
                            <span className="font-mono" ref={el => domRefs.current.totalVal = el}>0.00 J</span>
                        </div>
                    </div>
                </div>

                {/* 2. Center Panel: Active Lab Canvas */}
                <div className="flex flex-col gap-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4 relative overflow-hidden items-center justify-center">
                    
                    {/* Draggable Stopwatch Widget Overlay */}
                    {showStopwatch && (
                        <div className="absolute top-6 right-6 bg-[#181824]/90 backdrop-blur-md border border-white/15 rounded-xl p-3.5 flex flex-col items-center gap-2 shadow-2xl z-20 w-44">
                            <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold tracking-wider uppercase">
                                <Timer size={13} /> Simulation Timer
                            </div>
                            <div ref={stopwatchDOMRef} className="text-2xl font-mono font-bold text-white tracking-widest px-3 py-1 rounded border border-white/5 w-full text-center">
                                00:00.00
                            </div>
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={handleToggleStopwatch}
                                    className={`flex-1 text-[10px] font-bold py-1 px-2 rounded cursor-pointer transition ${
                                        stopwatchRunning
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                    }`}
                                >
                                    {stopwatchRunning ? 'Stop' : 'Start'}
                                </button>
                                <button
                                    onClick={handleResetStopwatch}
                                    className="flex-1 bg-white/5 text-white/70 hover:text-white border border-white/10 text-[10px] font-bold py-1 px-2 rounded cursor-pointer transition" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Canvas Frame */}
                    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={700}
                            style={{
                                width: '100%',
                                height: '100%',
                                maxHeight: '640px',
                                background: '#0a0a0f',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'block',
                                touchAction: 'none'
                            }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                        />
                    </div>
                </div>

                {/* 3. Right Panel: Lab Settings & Controls */}
                <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1">
                    
                    {/* Spring Constants Control */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                            <Settings2 size={16} className="text-[#00f0ff]" />
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-white/70">Spring Constant</h4>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-white/40">Stiffness (k)</span>
                            <span className="font-mono text-[#00f0ff] font-bold">{(4.0 + springConstant * 2.2).toFixed(1)} N/m</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={springConstant}
                            onChange={(e) => setSpringConstant(Number(e.target.value))}
                            className="w-full accent-[#00f0ff] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/30 font-semibold uppercase px-1">
                            <span>Small (Soft)</span>
                            <span>Medium</span>
                            <span>Large (Stiff)</span>
                        </div>
                    </div>

                    {/* Damping Control */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                            <Activity size={16} className="text-[#00f0ff]" />
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-white/70">Frictional Damping</h4>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-white/40">Friction Coeff. (c)</span>
                            <span className="font-mono text-[#00f0ff] font-bold">{dampingValue.toFixed(2)} N·s/m</span>
                        </div>
                        
                        {/* Preset Buttons */}
                        <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-lg border border-white/10" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                            {['none', 'friction', 'lots'].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => handleDampingChange(d)}
                                    className={`py-1 px-2 rounded capitalize text-xs font-semibold cursor-pointer transition ${
                                        dampingPreset === d 
                                        ? 'bg-[#00f0ff] text-black shadow' 
                                        : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    {d === 'friction' ? 'Medium' : d}
                                </button>
                            ))}
                        </div>

                        {/* Custom Slider */}
                        <input
                            type="range"
                            min="0"
                            max="1.2"
                            step="0.05"
                            value={dampingValue}
                            onChange={(e) => {
                                setDampingValue(Number(e.target.value));
                                setDampingPreset('custom');
                            }}
                            className="w-full accent-[#00f0ff] cursor-pointer"
                        />
                    </div>

                    {/* Gravity Control */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                            <Info size={16} className="text-[#00f0ff]" />
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-white/70">System Gravity</h4>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-white/40">Acceleration (g)</span>
                            <span className="font-mono text-[#00f0ff] font-bold">{gravityValue.toFixed(2)} m/s²</span>
                        </div>

                        {/* Preset buttons */}
                        <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-lg border border-white/10" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', color: 'white' }}>
                            {['moon', 'earth', 'jupiter'].map((g) => (
                                <button
                                    key={g}
                                    onClick={() => handleGravityChange(g)}
                                    className={`py-1 px-2 rounded capitalize text-xs font-semibold cursor-pointer transition ${
                                        gravityPreset === g 
                                        ? 'bg-[#00f0ff] text-black shadow' 
                                        : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        {/* Custom slider */}
                        <input
                            type="range"
                            min="0"
                            max="28"
                            step="0.1"
                            value={gravityValue}
                            onChange={(e) => {
                                setGravityValue(Number(e.target.value));
                                setGravityPreset('custom');
                            }}
                            className="w-full accent-[#00f0ff] cursor-pointer"
                        />
                    </div>

                    {/* Checkboxes & Displays */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3.5 backdrop-blur-xl">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                            <Ruler size={16} className="text-[#00f0ff]" />
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-white/70">Display Elements</h4>
                        </div>
                        
                        <label className="flex items-center gap-3 text-xs text-white/75 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showNaturalLength}
                                onChange={(e) => setShowNaturalLength(e.target.checked)}
                                className="w-4 h-4 accent-[#00f0ff] rounded border-white/10"
                            />
                            Natural Length (Cyan line)
                        </label>

                        <label className="flex items-center gap-3 text-xs text-white/75 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showEquilibrium}
                                onChange={(e) => setShowEquilibrium(e.target.checked)}
                                className="w-4 h-4 accent-[#00f0ff] rounded border-white/10"
                            />
                            Equilibrium Position (Green line)
                        </label>

                        <label className="flex items-center gap-3 text-xs text-white/75 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showRuler}
                                onChange={(e) => setShowRuler(e.target.checked)}
                                className="w-4 h-4 accent-[#00f0ff] rounded border-white/10"
                            />
                            Mobile Measurement Ruler
                        </label>

                        <label className="flex items-center gap-3 text-xs text-white/75 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showStopwatch}
                                onChange={(e) => setShowStopwatch(e.target.checked)}
                                className="w-4 h-4 accent-[#00f0ff] rounded border-white/10"
                            />
                            Lab Stopwatch
                        </label>

                        <label className="flex items-center gap-3 text-xs text-white/75 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showGraph}
                                onChange={(e) => setShowGraph(e.target.checked)}
                                className="w-4 h-4 accent-[#00f0ff] rounded border-white/10"
                            />
                            Displacement Oscilloscope
                        </label>
                    </div>

                    {/* Oscilloscope Container */}
                    {showGraph && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-xl h-48">
                            <div className="w-full flex-1 rounded-lg overflow-hidden border border-white/15">
                                <canvas
                                    ref={graphCanvasRef}
                                    width={330}
                                    height={140}
                                    className="w-full h-full block"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Educational Drawer (Theory & Labs) */}
            <div className="mx-6 mb-8 mt-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-xl">
                <div className="flex border-b border-white/10 mb-4 gap-2">
                    <button
                        onClick={() => setActiveTab('theory')}
                        className={`pb-2.5 px-4 font-semibold text-xs uppercase tracking-wider transition border-b-2 cursor-pointer ${
                            activeTab === 'theory' ? 'border-[#00f0ff] text-[#00f0ff]' : 'border-transparent text-white/50 hover:text-white'
                        }`}
                    >
                        <span className="flex items-center gap-1.5"><BookOpen size={14} /> Physics Theory</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('energy')}
                        className={`pb-2.5 px-4 font-semibold text-xs uppercase tracking-wider transition border-b-2 cursor-pointer ${
                            activeTab === 'energy' ? 'border-[#00f0ff] text-[#00f0ff]' : 'border-transparent text-white/50 hover:text-white'
                        }`}
                    >
                        <span className="flex items-center gap-1.5"><HelpCircle size={14} /> Energy Conservation</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('activities')}
                        className={`pb-2.5 px-4 font-semibold text-xs uppercase tracking-wider transition border-b-2 cursor-pointer ${
                            activeTab === 'activities' ? 'border-[#00f0ff] text-[#00f0ff]' : 'border-transparent text-white/50 hover:text-white'
                        }`}
                    >
                        <span className="flex items-center gap-1.5"><Info size={14} /> Lab Exercises</span>
                    </button>
                </div>

                {activeTab === 'theory' && (
                    <div className="text-sm text-white/70 leading-relaxed flex flex-col gap-3">
                        <p>
                            A mass suspended from a spring experiences <strong>Simple Harmonic Motion (SHM)</strong>. 
                            The physics of this system is governed by two fundamental laws:
                        </p>
                        <ul className="list-disc pl-5 flex flex-col gap-2">
                            <li>
                                <strong>Hooke's Law:</strong> The restoring force exerted by the spring is directly proportional 
                                to the displacement: <span className="text-[#00f0ff] font-mono">F_spring = -k · x</span>, where 
                                <span className="font-semibold"> k</span> is the spring constant and <span className="font-semibold">x = y - L0</span> is the stretch.
                            </li>
                            <li>
                                <strong>Newton's Second Law:</strong> The net force equals mass times acceleration: 
                                <span className="text-[#00f0ff] font-mono">F_net = F_spring + F_gravity + F_damping = m · a</span>.
                            </li>
                        </ul>
                        <p>
                            Combining these yields the classical differential equation:
                            <span className="block my-2 text-center text-emerald-400 font-mono py-2 rounded border border-white/5">
                                m · d²y/dt² + c · dy/dt + k · (y - L0) = m · g
                            </span>
                            Where <span className="font-mono text-emerald-400">c</span> is the damping coefficient (friction), 
                            <span className="font-mono text-emerald-400">m</span> is the attached mass, and <span className="font-mono text-emerald-400">g</span> is gravity.
                        </p>
                    </div>
                )}

                {activeTab === 'energy' && (
                    <div className="text-sm text-white/70 leading-relaxed flex flex-col gap-3">
                        <p>
                            In an ideal system with <strong>no damping (friction = 0)</strong>, mechanical energy is perfectly conserved. 
                            Energy continuously converts between three states:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
                            <div className="p-3 rounded-lg border border-white/5">
                                <span className="text-emerald-400 font-bold block text-xs tracking-wider uppercase mb-1">Kinetic Energy (KE)</span>
                                Energy due to velocity. Max at equilibrium position where velocity is highest.
                                <span className="block mt-2 font-mono text-xs text-white/40">KE = 0.5 · m · v²</span>
                            </div>
                            <div className="p-3 rounded-lg border border-white/5">
                                <span className="text-[#00f0ff] font-bold block text-xs tracking-wider uppercase mb-1">Elastic PE (PE el)</span>
                                Potential energy stored in the stretched or compressed spring. Max at peak displacements.
                                <span className="block mt-2 font-mono text-xs text-white/40">PE_el = 0.5 · k · x²</span>
                            </div>
                            <div className="p-3 rounded-lg border border-white/5">
                                <span className="text-amber-400 font-bold block text-xs tracking-wider uppercase mb-1">Gravitational PE (PE g)</span>
                                Potential energy due to vertical height relative to a bottom datum.
                                <span className="block mt-2 font-mono text-xs text-white/40">PE_g = m · g · h</span>
                            </div>
                        </div>
                        <p>
                            When <strong>Damping (Friction)</strong> is present, mechanical energy is converted to <strong>Thermal Energy (Th)</strong>. 
                            The sum of KE + PE_el + PE_g + Thermal remains constant, representing total conservation of energy!
                        </p>
                    </div>
                )}

                {activeTab === 'activities' && (
                    <div className="text-sm text-white/70 leading-relaxed flex flex-col gap-3">
                        <p>Try these experiments in the virtual laboratory to check the laws of motion:</p>
                        <ol className="list-decimal pl-5 flex flex-col gap-2.5">
                            <li>
                                <strong>Determine Hooke's Constant (k):</strong> Attach a weight (e.g., 250g) to the spring. Let the system come to complete rest. 
                                Turn on the <strong>Measurement Ruler</strong>, align 0 with the Cyan line (Natural Length), and read the static deflection (y) to the Green line (Equilibrium). 
                                Calculate: <span className="text-[#00f0ff] font-mono font-semibold">k = (m · g) / y</span>.
                            </li>
                            <li>
                                <strong>Calculate the Oscillation Period (T):</strong> Set damping to <strong>None</strong> and drag the 250g weight down to release it. 
                                Enable the <strong>Stopwatch</strong>. Measure the time it takes to complete 10 full cycles (up and down), and divide by 10. 
                                Compare your result with the formula: <span className="text-[#00f0ff] font-mono font-semibold">T = 2π · √(m / k)</span>.
                            </li>
                            <li>
                                <strong>Observe Gravitational Effects:</strong> Observe how the equilibrium position changes when you move from <strong>Moon</strong> gravity to <strong>Jupiter</strong> gravity. 
                                Does the oscillation frequency change under different gravity settings? (Check the formula: does <span className="font-mono">T</span> depend on <span className="font-mono">g</span>?)
                            </li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}


export default function CustomMassesandSpringsBasics({ onBack, title }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                {onBack ? (
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                        ← Back
                    </button>
                ) : <div />}
                <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
                    {title || 'Simulation'}
                </h1>
                <div style={{ width: '100px' }}></div>
            </div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }}>
                 <CustomMassesandSpringsBasicsInner onBack={null} title={""} />
            </div>
        </div>
    );
}
