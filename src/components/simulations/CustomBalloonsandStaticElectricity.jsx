import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Zap, 
  Sparkles, 
  Sliders, 
  Info, 
  Settings 
} from 'lucide-react';

export default function CustomBalloonsandStaticElectricity({ onBack, title }) {
  const canvasRef = useRef(null);

  // User interface states
  const [showCharges, setShowCharges] = useState('all'); // 'all', 'none', 'differences'
  const [twoBalloons, setTwoBalloons] = useState(false);
  const [showWall, setShowWall] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [isResetHovered, setIsResetHovered] = useState(false);

  // Physics parameter states (linked to refs for the simulation loop)
  const [electrostaticStrength, setElectrostaticStrength] = useState(60); // 0 to 100
  const [gravityStrength, setGravityStrength] = useState(30); // 0 to 100
  const [frictionRate, setFrictionRate] = useState(50); // 0 to 100

  // Telemetry states for the stats panel
  const [yellowChargeCount, setYellowChargeCount] = useState(0);
  const [greenChargeCount, setGreenChargeCount] = useState(0);
  const [sweaterChargeCount, setSweaterChargeCount] = useState(0);
  const [netForceYellow, setNetForceYellow] = useState(0);
  const [netForceGreen, setNetForceGreen] = useState(0);

  // Settings ref to allow canvas loop to read reactive settings without re-binding effects
  const settingsRef = useRef({
    showCharges: 'all',
    twoBalloons: false,
    showWall: true
  });

  // Parameters ref for the physics loop
  const paramsRef = useRef({
    electrostaticStrength: 60,
    gravityStrength: 30,
    frictionRate: 50
  });

  // Sync react settings and parameters state with refs
  useEffect(() => {
    settingsRef.current.showCharges = showCharges;
  }, [showCharges]);

  useEffect(() => {
    settingsRef.current.twoBalloons = twoBalloons;
  }, [twoBalloons]);

  useEffect(() => {
    settingsRef.current.showWall = showWall;
  }, [showWall]);

  useEffect(() => {
    paramsRef.current.electrostaticStrength = electrostaticStrength;
    paramsRef.current.gravityStrength = gravityStrength;
    paramsRef.current.frictionRate = frictionRate;
  }, [electrostaticStrength, gravityStrength, frictionRate]);

  // Simulation state
  const stateRef = useRef({
    width: 1100,
    height: 750,
    balloons: [],
    sweater: { x: 80, y: 150, width: 180, height: 400, charges: [] },
    wall: { x: 600, y: 120, width: 120, height: 520, charges: [] },
    draggedBalloon: null,
    lastTime: performance.now(),
    sparks: [], // Spark effects: {x, y, vx, vy, alpha, size, color}
  });

  // Reset/Initialize balloons
  const resetBalloons = useCallback(() => {
    const s = stateRef.current;
    const balloon1 = {
      id: 'b1',
      x: 380,
      y: 260,
      vx: 0,
      vy: 0,
      radius: 42,
      color: 'yellow',
      charges: [],
      nativeCharges: []
    };
    
    // Add balanced native charges (5 pairs) to make it initially neutral
    for (let i = 0; i < 5; i++) {
      balloon1.nativeCharges.push({ type: 'pos', offsetX: (Math.random() - 0.5) * 44, offsetY: (Math.random() - 0.5) * 44 });
      balloon1.nativeCharges.push({ type: 'neg', offsetX: (Math.random() - 0.5) * 44, offsetY: (Math.random() - 0.5) * 44 });
    }

    s.balloons = [balloon1];
    
    if (settingsRef.current.twoBalloons) {
      const balloon2 = {
        id: 'b2',
        x: 420,
        y: 380,
        vx: 0,
        vy: 0,
        radius: 42,
        color: 'green',
        charges: [],
        nativeCharges: []
      };
      for (let i = 0; i < 5; i++) {
        balloon2.nativeCharges.push({ type: 'pos', offsetX: (Math.random() - 0.5) * 44, offsetY: (Math.random() - 0.5) * 44 });
        balloon2.nativeCharges.push({ type: 'neg', offsetX: (Math.random() - 0.5) * 44, offsetY: (Math.random() - 0.5) * 44 });
      }
      s.balloons.push(balloon2);
    }
    
    // Reset sweater transferred charges
    s.sweater.charges.forEach(c => {
      if (c.type === 'neg') c.isTransferred = false;
    });

    // Reset wall charges to original spots
    s.wall.charges.forEach(c => {
      if (c.type === 'neg') c.x = c.baseX;
    });

    s.sparks = [];

    // Sync state counts
    setYellowChargeCount(0);
    setGreenChargeCount(0);
    setSweaterChargeCount(0);
    setNetForceYellow(0);
    setNetForceGreen(0);
  }, []);

  // Initialize sweater and wall charges
  const initSimulation = useCallback(() => {
    const s = stateRef.current;
    
    // Init sweater charges: 6 columns x 10 rows
    const sweaterCharges = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 10; j++) {
        const x = s.sweater.x + 20 + i * 28;
        const y = s.sweater.y + 25 + j * 38;
        sweaterCharges.push({
          id: `s_${i}_${j}`,
          x: x,
          y: y,
          type: 'pos'
        });
        sweaterCharges.push({
          id: `s_n_${i}_${j}`,
          x: x,
          y: y,
          type: 'neg',
          isTransferred: false
        });
      }
    }
    s.sweater.charges = sweaterCharges;

    // Init wall charges: 3 columns x 13 rows
    const wallCharges = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 13; j++) {
        const x = s.wall.x + 25 + i * 35;
        const y = s.wall.y + 25 + j * 39;
        wallCharges.push({
          x: x,
          y: y,
          type: 'pos',
          baseX: x
        });
        wallCharges.push({
          x: x,
          y: y,
          type: 'neg',
          baseX: x
        });
      }
    }
    s.wall.charges = wallCharges;

    resetBalloons();
  }, [resetBalloons]);

  // Handle balloon toggling
  useEffect(() => {
    const s = stateRef.current;
    if (twoBalloons && s.balloons.length === 1) {
      const balloon2 = {
        id: 'b2',
        x: 420,
        y: 380,
        vx: 0,
        vy: 0,
        radius: 42,
        color: 'green',
        charges: [],
        nativeCharges: []
      };
      for (let i = 0; i < 5; i++) {
        balloon2.nativeCharges.push({ type: 'pos', offsetX: (Math.random() - 0.5) * 44, offsetY: (Math.random() - 0.5) * 44 });
        balloon2.nativeCharges.push({ type: 'neg', offsetX: (Math.random() - 0.5) * 44, offsetY: (Math.random() - 0.5) * 44 });
      }
      s.balloons.push(balloon2);
    } else if (!twoBalloons && s.balloons.length === 2) {
      // Return charges to sweater
      const b2 = s.balloons[1];
      b2.charges.forEach(bc => {
        const sc = s.sweater.charges.find(c => c.id === bc.id);
        if (sc) sc.isTransferred = false;
      });
      s.balloons.pop();
    }
  }, [twoBalloons]);

  // Run initial setup
  useEffect(() => {
    initSimulation();
  }, [initSimulation]);

  // Main Loop
  useEffect(() => {
    let animationFrameId;

    const drawChargeMarker = (ctx, x, y, type) => {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = type === 'pos' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type === 'pos' ? '+' : '-', x, y);
    };

    const render = () => {
      const s = stateRef.current;
      const now = performance.now();
      const dt = Math.min((now - s.lastTime) / 1000, 0.03); // cap dt to avoid physics explosions
      s.lastTime = now;

      // Get parameters
      const k_e = paramsRef.current.electrostaticStrength * 120; // scale factor
      const gravity = paramsRef.current.gravityStrength * 4; // scale factor
      const frictionThreshold = paramsRef.current.frictionRate;
      const curShowWall = settingsRef.current.showWall;
      const curShowCharges = settingsRef.current.showCharges;
      const curTwoBalloons = settingsRef.current.twoBalloons;

      // 1. Rubbing & Charge Transfer
      s.balloons.forEach(balloon => {
        if (s.draggedBalloon && s.draggedBalloon.id === balloon.id) {
          // Rubbing against sweater?
          const sweaterLeft = s.sweater.x;
          const sweaterRight = s.sweater.x + s.sweater.width;
          const sweaterTop = s.sweater.y;
          const sweaterBottom = s.sweater.y + s.sweater.height;

          // Is balloon overlapping with sweater?
          if (
            balloon.x + balloon.radius > sweaterLeft &&
            balloon.x - balloon.radius < sweaterRight &&
            balloon.y + balloon.radius > sweaterTop &&
            balloon.y - balloon.radius < sweaterBottom
          ) {
            // Transfer charge based on friction probability
            s.sweater.charges.forEach(c => {
              if (c.type === 'neg' && !c.isTransferred) {
                const dist = Math.hypot(c.x - balloon.x, c.y - balloon.y);
                if (dist < balloon.radius + 15) {
                  // High chance of transfer if friction rate allows
                  if (Math.random() * 100 < frictionThreshold * 0.4) {
                    c.isTransferred = true;
                    balloon.charges.push({
                      id: c.id,
                      offsetX: (Math.random() - 0.5) * balloon.radius * 1.4,
                      offsetY: (Math.random() - 0.5) * balloon.radius * 1.4
                    });

                    // Add spark particle effects
                    for (let p = 0; p < 4; p++) {
                      const angle = Math.random() * Math.PI * 2;
                      const speed = 1 + Math.random() * 3;
                      s.sparks.push({
                        x: c.x,
                        y: c.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        alpha: 1.0,
                        size: 2 + Math.random() * 3,
                        color: balloon.color === 'yellow' ? '#fde047' : '#2dd4bf'
                      });
                    }
                  }
                }
              }
            });
          }
        }
      });

      // 2. Electrostatic and Gravitational Forces
      const yellow = s.balloons.find(b => b.id === 'b1');
      const green = s.balloons.find(b => b.id === 'b2');

      // Count how many negative charges are transferred
      let sweaterLostNegatives = 0;
      s.sweater.charges.forEach(c => {
        if (c.type === 'neg' && c.isTransferred) sweaterLostNegatives++;
      });

      s.balloons.forEach(balloon => {
        // Net charge = negative charges on balloon
        const qBalloon = balloon.charges.length;

        if (s.draggedBalloon && s.draggedBalloon.id === balloon.id) {
          balloon.vx = 0;
          balloon.vy = 0;
          if (balloon.id === 'b1') setNetForceYellow(0);
          else setNetForceGreen(0);
          return;
        }

        let fx = 0;
        let fy = 0;

        // a. Gravity
        fy += gravity * 1.2;

        // b. Attraction to sweater
        if (qBalloon > 0 && sweaterLostNegatives > 0) {
          const sweaterCenter = { 
            x: s.sweater.x + s.sweater.width / 2, 
            y: s.sweater.y + s.sweater.height / 2 
          };
          const dx = sweaterCenter.x - balloon.x;
          const dy = sweaterCenter.y - balloon.y;
          const dist = Math.max(Math.hypot(dx, dy), 80);
          
          const force = (k_e * qBalloon * (sweaterLostNegatives * 0.5)) / (dist * dist);
          fx += force * (dx / dist);
          fy += force * (dy / dist);
        }

        // c. Interaction with Wall (Polarization & Induced Attraction)
        if (curShowWall) {
          const wallX = s.wall.x;
          const dxWall = wallX - balloon.x;
          
          if (qBalloon > 0 && dxWall > 0) {
            s.wall.charges.forEach(wc => {
              const dist = Math.hypot(wc.x - balloon.x, wc.y - balloon.y);
              const r = Math.max(dist, 60);
              const coulomb = (k_e * qBalloon * 0.15) / (r * r);
              
              if (wc.type === 'pos') {
                fx += coulomb * ((wc.x - balloon.x) / dist);
                fy += coulomb * ((wc.y - balloon.y) / dist);
              } else {
                fx -= coulomb * ((wc.x - balloon.x) / dist);
                fy -= coulomb * ((wc.y - balloon.y) / dist);
              }
            });
          }
        }

        // d. Repulsion between balloons
        if (curTwoBalloons && yellow && green) {
          const other = balloon.id === 'b1' ? green : yellow;
          const qOther = other.charges.length;

          if (qBalloon > 0 && qOther > 0) {
            const dx = balloon.x - other.x;
            const dy = balloon.y - other.y;
            const dist = Math.max(Math.hypot(dx, dy), balloon.radius * 2);
            
            const force = (k_e * qBalloon * qOther * 1.5) / (dist * dist);
            fx += force * (dx / dist);
            fy += force * (dy / dist);
          }
        }

        // 3. Update Velocities and Positions
        balloon.vx += fx * dt;
        balloon.vy += fy * dt;
        
        balloon.vx *= 0.96;
        balloon.vy *= 0.96;

        balloon.x += balloon.vx * dt * 50;
        balloon.y += balloon.vy * dt * 50;

        // 4. Bound Checks and Collisions
        const rightLimit = curShowWall ? s.wall.x - balloon.radius : s.width - balloon.radius;
        if (balloon.x < balloon.radius) {
          balloon.x = balloon.radius;
          balloon.vx *= -0.4;
        }
        if (balloon.x > rightLimit) {
          balloon.x = rightLimit;
          balloon.vx *= -0.4;
        }
        if (balloon.y < balloon.radius) {
          balloon.y = balloon.radius;
          balloon.vy *= -0.4;
        }
        if (balloon.y > s.height - balloon.radius) {
          balloon.y = s.height - balloon.radius;
          balloon.vy *= -0.4;
        }

        // Jitter prevention
        if (Math.abs(balloon.vx) < 0.08) balloon.vx = 0;
        if (Math.abs(balloon.vy) < 0.08) balloon.vy = 0;

        // Telemetry update
        const totalForceMag = Math.round(Math.hypot(fx, fy) * 0.1);
        if (balloon.id === 'b1') setNetForceYellow(totalForceMag);
        else setNetForceGreen(totalForceMag);
      });

      // 5. Update Wall Electron Polarization (repelled by nearby negative balloons)
      if (curShowWall) {
        s.wall.charges.forEach(c => {
          if (c.type === 'neg') {
            let totalRepulsionX = 0;
            s.balloons.forEach(balloon => {
              const qBalloon = balloon.charges.length;
              if (qBalloon > 0) {
                const dx = c.baseX - balloon.x;
                const dy = c.y - balloon.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 350 && dx > 0) {
                  totalRepulsionX += (qBalloon * 2400) / (dist * dist);
                }
              }
            });
            
            const targetX = c.baseX + Math.min(totalRepulsionX, 50);
            c.x += (targetX - c.x) * 0.12;
          }
        });
      }

      // 6. Update Sparks
      s.sparks.forEach(spark => {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.alpha -= 0.04;
      });
      s.sparks = s.sparks.filter(spark => spark.alpha > 0);

      // Sync state counts
      setYellowChargeCount(yellow ? yellow.charges.length : 0);
      setGreenChargeCount(green ? green.charges.length : 0);
      setSweaterChargeCount(sweaterLostNegatives);

      // 7. Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, s.width, s.height);
        
        // Background laboratory grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 40; x < s.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, s.height);
          ctx.stroke();
        }
        for (let y = 40; y < s.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(s.width, y);
          ctx.stroke();
        }

        // 1. Draw Sweater
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.15)';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 3.5;
        
        ctx.beginPath();
        ctx.roundRect(s.sweater.x, s.sweater.y + 40, s.sweater.width, s.sweater.height - 40, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
        ctx.beginPath();
        ctx.roundRect(s.sweater.x - 35, s.sweater.y + 50, 35, 200, 12);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(s.sweater.x + s.sweater.width, s.sweater.y + 50, 35, 200, 12);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.sweater.x + s.sweater.width / 2, s.sweater.y + 40, 35, Math.PI, 0, true);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.stroke();
        ctx.restore();

        // 2. Draw Wall
        if (curShowWall) {
          ctx.save();
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.05)';
          
          const wallGrad = ctx.createLinearGradient(s.wall.x, s.wall.y, s.wall.x + s.wall.width, s.wall.y);
          wallGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
          wallGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
          wallGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
          
          ctx.fillStyle = wallGrad;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(s.wall.x, s.wall.y, s.wall.width, s.wall.height, 18);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1;
          for (let wY = s.wall.y + 30; wY < s.wall.y + s.wall.height; wY += 30) {
            ctx.beginPath();
            ctx.moveTo(s.wall.x, wY);
            ctx.lineTo(s.wall.x + s.wall.width, wY);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 3. Draw Sweater Charges
        if (curShowCharges !== 'none') {
          s.sweater.charges.forEach(c => {
            if (curShowCharges === 'all') {
              if (c.type === 'pos') {
                drawChargeMarker(ctx, c.x, c.y, 'pos');
              } else if (c.type === 'neg' && !c.isTransferred) {
                drawChargeMarker(ctx, c.x, c.y, 'neg');
              }
            } else if (curShowCharges === 'differences') {
              if (c.type === 'pos') {
                const correspondingNeg = s.sweater.charges.find(nc => nc.id === `s_n_${c.id.slice(2)}`);
                if (correspondingNeg && correspondingNeg.isTransferred) {
                  drawChargeMarker(ctx, c.x, c.y, 'pos');
                }
              }
            }
          });
        }

        // 4. Draw Wall Charges
        if (curShowWall && curShowCharges !== 'none') {
          s.wall.charges.forEach(c => {
            if (curShowCharges === 'all') {
              drawChargeMarker(ctx, c.x, c.y, c.type);
            } else if (curShowCharges === 'differences') {
              // polarization induction markers
              drawChargeMarker(ctx, c.x, c.y, c.type);
            }
          });
        }

        // 5. Draw Balloons
        s.balloons.forEach(balloon => {
          ctx.save();
          
          // Balloon string
          ctx.beginPath();
          ctx.moveTo(balloon.x, balloon.y + balloon.radius);
          ctx.bezierCurveTo(
            balloon.x - 8, balloon.y + balloon.radius + 20, 
            balloon.x + 8, balloon.y + balloon.radius + 40, 
            balloon.x, balloon.y + balloon.radius + 65
          );
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          const grad = ctx.createRadialGradient(
            balloon.x - balloon.radius * 0.3, 
            balloon.y - balloon.radius * 0.3, 
            balloon.radius * 0.1, 
            balloon.x, 
            balloon.y, 
            balloon.radius
          );

          if (balloon.color === 'yellow') {
            grad.addColorStop(0, '#fffeeb');
            grad.addColorStop(0.25, '#fde047');
            grad.addColorStop(1, '#a16207');
            ctx.shadowColor = 'rgba(253, 224, 71, 0.25)';
          } else {
            grad.addColorStop(0, '#e6fffa');
            grad.addColorStop(0.25, '#2dd4bf');
            grad.addColorStop(1, '#0f766e');
            ctx.shadowColor = 'rgba(45, 212, 191, 0.25)';
          }

          ctx.shadowBlur = 25;
          ctx.fillStyle = grad;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Knot
          ctx.beginPath();
          ctx.moveTo(balloon.x, balloon.y + balloon.radius - 2);
          ctx.lineTo(balloon.x - 6, balloon.y + balloon.radius + 7);
          ctx.lineTo(balloon.x + 6, balloon.y + balloon.radius + 7);
          ctx.closePath();
          ctx.fillStyle = balloon.color === 'yellow' ? '#ca8a04' : '#0d9488';
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          if (curShowCharges !== 'none') {
            if (curShowCharges === 'all') {
              balloon.nativeCharges.forEach(c => {
                drawChargeMarker(ctx, balloon.x + c.offsetX, balloon.y + c.offsetY, c.type);
              });
            }
            balloon.charges.forEach(c => {
              drawChargeMarker(ctx, balloon.x + c.offsetX, balloon.y + c.offsetY, 'neg');
            });
          }
        });

        // 6. Draw Sparks
        s.sparks.forEach(spark => {
          ctx.save();
          ctx.globalAlpha = spark.alpha;
          ctx.shadowBlur = 10;
          ctx.shadowColor = spark.color;
          ctx.fillStyle = spark.color;
          
          ctx.beginPath();
          ctx.moveTo(spark.x, spark.y - spark.size);
          ctx.lineTo(spark.x + spark.size / 2, spark.y - spark.size / 2);
          ctx.lineTo(spark.x + spark.size, spark.y);
          ctx.lineTo(spark.x + spark.size / 2, spark.y + spark.size / 2);
          ctx.lineTo(spark.x, spark.y + spark.size);
          ctx.lineTo(spark.x - spark.size / 2, spark.y + spark.size / 2);
          ctx.lineTo(spark.x - spark.size, spark.y);
          ctx.lineTo(spark.x - spark.size / 2, spark.y - spark.size / 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Event Handlers for Dragging
  const getMouseCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the actual rendered dimensions with objectFit: contain
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    const renderedWidth = canvas.width * scale;
    const renderedHeight = canvas.height * scale;
    
    // Calculate the letterbox offsets
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    
    return { x, y };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getMouseCoordinates(e);

    const s = stateRef.current;
    
    // Select balloon that is clicked (traverse in reverse so top is selected first)
    for (let i = s.balloons.length - 1; i >= 0; i--) {
      const b = s.balloons[i];
      if (Math.hypot(b.x - x, b.y - y) <= b.radius + 15) {
        s.draggedBalloon = b;
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    const s = stateRef.current;
    if (s.draggedBalloon) {
      let { x, y } = getMouseCoordinates(e);
      
      // Clamp within boundaries
      const rightLimit = settingsRef.current.showWall ? s.wall.x - s.draggedBalloon.radius : s.width - s.draggedBalloon.radius;
      x = Math.max(s.draggedBalloon.radius, Math.min(rightLimit, x));
      y = Math.max(s.draggedBalloon.radius, Math.min(s.height - s.draggedBalloon.radius, y));

      s.draggedBalloon.x = x;
      s.draggedBalloon.y = y;
      s.draggedBalloon.vx = 0;
      s.draggedBalloon.vy = 0;
    }
  };

  const handleMouseUp = () => {
    stateRef.current.draggedBalloon = null;
  };

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

  const handleResetEverything = () => {
    resetBalloons();
    setElectrostaticStrength(60);
    setGravityStrength(30);
    setFrictionRate(50);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
      <div style={{ height: '80px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
         <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
             {onBack && (
                 <button onClick={onBack} className="glass-btn">
                     <ArrowLeft size={16} /> Back
                 </button>
             )}
         </div>
         <div>
             <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', margin: 0 }}>
                 {title || 'Balloons & Static Electricity MG'}
             </h2>
         </div>
         <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
             <button onClick={handleResetEverything} className="glass-btn reset-btn">
                 <RotateCcw size={18} /> Reset All
             </button>
             <button onClick={() => setShowInfoModal(true)} className="glass-btn glass-btn-blue">
                 <Info size={18} /> Theory
             </button>
         </div>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1, pointerEvents: 'auto', padding: '20px 360px 20px 340px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Main View: Canvas */}
      <canvas
        ref={canvasRef}
        width={1100}
        height={750}
        style={{ width: '100%', height: '100%', maxHeight: '100%', zIndex: 1, objectFit: 'contain', cursor: 'grab', background: '#0a0a1a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />

      {/* Instruction tooltip in simulation corner */}
      <div 
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          padding: '16px',
          borderRadius: '12px',
          zIndex: 10,
          color: 'white',
          fontFamily: "'Inter', sans-serif",
          maxWidth: '300px'
        }}
      >
        <span style={{ color: '#3498db', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', marginBottom: '4px' }}>
          <Sparkles size={14} /> Instructions:
        </span>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
          Drag the balloons to rub them on the sweater and transfer negative charges. Release them to observe attraction, repulsion, and polarization.
        </p>
      </div>

      {/* Control Panel: Simulation Controls */}
      <section 
        style={{
          position: 'absolute',
          right: '20px',
          top: '100px',
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
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
          <Settings size={18} style={{ color: '#3498db' }} />
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>Simulation Controls</h2>
        </div>

        {/* Charge Display Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visuals: Show Charges</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'differences', label: 'Net' },
              { id: 'none', label: 'None' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setShowCharges(opt.id)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: showCharges === opt.id ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
                  color: showCharges === opt.id ? '#3498db' : 'rgba(255, 255, 255, 0.6)',
                  boxShadow: showCharges === opt.id ? '0 0 0 1px rgba(52, 152, 219, 0.4)' : 'none'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Environment Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifySpaceBetween: 'space-between', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>Wall Interaction</span>
            <button
              onClick={() => setShowWall(!showWall)}
              style={{
                position: 'relative',
                display: 'inline-flex',
                height: '24px',
                width: '44px',
                alignItems: 'center',
                borderRadius: '9999px',
                transition: 'background-color 0.2s ease',
                cursor: 'pointer',
                border: 'none',
                background: showWall ? '#3498db' : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <span 
                style={{
                  display: 'inline-block',
                  height: '16px',
                  width: '16px',
                  transform: showWall ? 'translateX(24px)' : 'translateX(4px)',
                  borderRadius: '9999px',
                  background: 'white',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifySpaceBetween: 'space-between', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>Second Balloon</span>
            <button
              onClick={() => setTwoBalloons(!twoBalloons)}
              style={{
                position: 'relative',
                display: 'inline-flex',
                height: '24px',
                width: '44px',
                alignItems: 'center',
                borderRadius: '9999px',
                transition: 'background-color 0.2s ease',
                cursor: 'pointer',
                border: 'none',
                background: twoBalloons ? '#3498db' : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <span 
                style={{
                  display: 'inline-block',
                  height: '16px',
                  width: '16px',
                  transform: twoBalloons ? 'translateX(24px)' : 'translateX(4px)',
                  borderRadius: '9999px',
                  background: 'white',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </button>
          </div>
        </div>

        {/* Physics Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} style={{ color: '#3498db' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>Physics Parameters</h3>
          </div>

          {/* Electrostatic Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Electrostatic Strength (k_e)</span>
              <span style={{ color: '#3498db', fontWeight: '600' }}>{electrostaticStrength}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={electrostaticStrength}
              onChange={(e) => setElectrostaticStrength(Number(e.target.value))}
              style={{ accentColor: '#3498db', cursor: 'pointer', width: '100%' }}
            />
          </div>

          {/* Gravity Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Gravity Strength</span>
              <span style={{ color: '#3498db', fontWeight: '600' }}>{gravityStrength}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={gravityStrength}
              onChange={(e) => setGravityStrength(Number(e.target.value))}
              style={{ accentColor: '#3498db', cursor: 'pointer', width: '100%' }}
            />
          </div>

          {/* Friction Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Friction Charge Transfer</span>
              <span style={{ color: '#3498db', fontWeight: '600' }}>{frictionRate}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={frictionRate}
              onChange={(e) => setFrictionRate(Number(e.target.value))}
              style={{ accentColor: '#3498db', cursor: 'pointer', width: '100%' }}
            />
          </div>
        </div>

        {/* Reset Balloon Charges Button */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
          <button
            onClick={resetBalloons}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            Reset Balloon Charges
          </button>
        </div>
      </section>

      {/* Stats Panel: Electrostatic Charge Stats */}
      <section 
        style={{
          position: 'absolute',
          left: '20px',
          top: '100px',
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
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
          <Zap size={18} style={{ color: '#3498db' }} />
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>Electrostatic Charge Stats</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.8)' }}>
            <span>Sweater Net Charge:</span>
            <span style={{ fontFamily: 'monospace', color: '#ff5555', fontWeight: '600' }}>+{sweaterChargeCount}e</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.8)' }}>
            <span>Yellow Balloon Net Charge:</span>
            <span style={{ fontFamily: 'monospace', color: '#f1c40f', fontWeight: '600' }}>-{yellowChargeCount}e</span>
          </div>
          {twoBalloons && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.8)' }}>
              <span>Green Balloon Net Charge:</span>
              <span style={{ fontFamily: 'monospace', color: '#2ecc71', fontWeight: '600' }}>-{greenChargeCount}e</span>
            </div>
          )}
          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.8)' }}>
            <span>Yellow Net Force:</span>
            <span style={{ fontFamily: 'monospace', color: 'white' }}>{netForceYellow} mN</span>
          </div>
          {twoBalloons && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.8)' }}>
              <span>Green Net Force:</span>
              <span style={{ fontFamily: 'monospace', color: 'white' }}>{netForceGreen} mN</span>
            </div>
          )}
        </div>
      </section>

      </div> {/* End Main View Container */}

      {/* Educational Information Modal */}
      {showInfoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6', background: 'rgba(20, 20, 30, 0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: '24px', borderRadius: '16px', maxWidth: '550px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', fontFamily: "'Inter', sans-serif" }}>
            <h4 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', margin: 0 }}>
              <Info size={22} color="#3498db" /> How Static Electricity Works
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              <div>
                <h5 style={{ color: '#3498db', fontWeight: '600', margin: '0 0 8px 0', fontSize: '15px' }}>1. Friction and Charge Transfer</h5>
                <p style={{ margin: '0 0 12px 0' }}>Objects are normally electrically neutral, containing equal positive and negative charges. When you rub the balloon against the sweater, the friction causes mobile electrons (negative charges) to transfer from the sweater's wool fibers to the balloon. The balloon gets a net negative charge, leaving the sweater with a net positive charge.</p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />
              <div>
                <h5 style={{ color: '#3498db', fontWeight: '600', margin: '0 0 8px 0', fontSize: '15px' }}>2. Attraction and Repulsion</h5>
                <p style={{ margin: '0 0 12px 0' }}>Opposite charges attract each other, and like charges repel. The negatively charged balloon is attracted to the positively charged sweater. If you introduce a second balloon and rub it as well, the two negative balloons will repel each other, pushing apart in mid-air.</p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />
              <div>
                <h5 style={{ color: '#3498db', fontWeight: '600', margin: '0 0 8px 0', fontSize: '15px' }}>3. Polarization / Induction</h5>
                <p style={{ margin: '0 0 12px 0' }}>When you bring the negative balloon near the neutral wall, it repels the mobile electrons on the surface of the wall, pushing them deeper inside. This polarization leaves the surface of the wall with a positive charge. The balloon is then attracted to the wall because the positive wall surface is closer than the repelled electrons.</p>
              </div>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowInfoModal(false)} className="glass-btn glass-btn-blue">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
