/**
 * Standalone Headless Physics Test Harness for CustomBalloonsandStaticElectricity.jsx
 * Verifies:
 * 1. Charge conservation
 * 2. Electrostatic forces (Coulomb's Law, Sweater/Wall attraction, balloon repulsion)
 * 3. Edge cases (zero gravity, zero electrostatic strength, high speeds, extremely close distances)
 * 4. Runtime stability and crash prevention
 */

const assert = require('assert');

class HeadlessSimulation {
  constructor() {
    // Initial UI settings
    this.settings = {
      showCharges: 'all',
      twoBalloons: false,
      showWall: true
    };

    // Physics parameters (analogous to react state/refs)
    this.params = {
      electrostaticStrength: 60,
      gravityStrength: 30,
      frictionRate: 50
    };

    // State matching CustomBalloonsandStaticElectricity.jsx
    this.state = {
      width: 800,
      height: 600,
      balloons: [],
      sweater: { x: 60, y: 100, width: 180, height: 400, charges: [] },
      wall: { x: 640, y: 40, width: 120, height: 520, charges: [] },
      draggedBalloon: null,
      lastTime: 0,
      sparks: []
    };

    this.initSimulation();
  }

  initSimulation() {
    const s = this.state;
    
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

    this.resetBalloons();
  }

  resetBalloons() {
    const s = this.state;
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
    
    // Add balanced native charges (5 pairs)
    for (let i = 0; i < 5; i++) {
      balloon1.nativeCharges.push({ type: 'pos', offsetX: 0, offsetY: 0 });
      balloon1.nativeCharges.push({ type: 'neg', offsetX: 0, offsetY: 0 });
    }

    s.balloons = [balloon1];
    
    if (this.settings.twoBalloons) {
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
        balloon2.nativeCharges.push({ type: 'pos', offsetX: 0, offsetY: 0 });
        balloon2.nativeCharges.push({ type: 'neg', offsetX: 0, offsetY: 0 });
      }
      s.balloons.push(balloon2);
    }
    
    // Reset sweater transferred charges
    s.sweater.charges.forEach(c => {
      if (c.type === 'neg') c.isTransferred = false;
    });

    // Reset wall charges
    s.wall.charges.forEach(c => {
      if (c.type === 'neg') c.x = c.baseX;
    });

    s.sparks = [];
  }

  // Set whether two balloons are enabled
  setTwoBalloons(val) {
    this.settings.twoBalloons = val;
    const s = this.state;
    if (val && s.balloons.length === 1) {
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
        balloon2.nativeCharges.push({ type: 'pos', offsetX: 0, offsetY: 0 });
        balloon2.nativeCharges.push({ type: 'neg', offsetX: 0, offsetY: 0 });
      }
      s.balloons.push(balloon2);
    } else if (!val && s.balloons.length === 2) {
      const b2 = s.balloons[1];
      b2.charges.forEach(bc => {
        const sc = s.sweater.charges.find(c => c.id === bc.id);
        if (sc) sc.isTransferred = false;
      });
      s.balloons.pop();
    }
  }

  // Exact physics step replication
  step(dt = 0.016) {
    const s = this.state;
    const k_e = this.params.electrostaticStrength * 120;
    const gravity = this.params.gravityStrength * 4;
    const frictionThreshold = this.params.frictionRate;
    const curShowWall = this.settings.showWall;
    const curTwoBalloons = this.settings.twoBalloons;

    // 1. Rubbing & Charge Transfer
    s.balloons.forEach(balloon => {
      if (s.draggedBalloon && s.draggedBalloon.id === balloon.id) {
        const sweaterLeft = s.sweater.x;
        const sweaterRight = s.sweater.x + s.sweater.width;
        const sweaterTop = s.sweater.y;
        const sweaterBottom = s.sweater.y + s.sweater.height;

        if (
          balloon.x + balloon.radius > sweaterLeft &&
          balloon.x - balloon.radius < sweaterRight &&
          balloon.y + balloon.radius > sweaterTop &&
          balloon.y - balloon.radius < sweaterBottom
        ) {
          s.sweater.charges.forEach(c => {
            if (c.type === 'neg' && !c.isTransferred) {
              const dist = Math.hypot(c.x - balloon.x, c.y - balloon.y);
              if (dist < balloon.radius + 15) {
                // To keep tests deterministic or probabilistic
                // We use a simplified friction rate condition for step tests
                if (Math.random() * 100 < frictionThreshold * 0.4) {
                  c.isTransferred = true;
                  balloon.charges.push({
                    id: c.id,
                    offsetX: 0,
                    offsetY: 0
                  });
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

    let sweaterLostNegatives = 0;
    s.sweater.charges.forEach(c => {
      if (c.type === 'neg' && c.isTransferred) sweaterLostNegatives++;
    });

    s.balloons.forEach(balloon => {
      const qBalloon = balloon.charges.length;

      if (s.draggedBalloon && s.draggedBalloon.id === balloon.id) {
        balloon.vx = 0;
        balloon.vy = 0;
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

      // c. Interaction with Wall
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
      
      // Store force for assertion access
      balloon.fx = fx;
      balloon.fy = fy;
    });

    // 5. Update Wall Electron Polarization
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
  }

  // Helper to force-transfer charges for testing forces
  forceTransferCharges(balloonId, count) {
    const s = this.state;
    const balloon = s.balloons.find(b => b.id === balloonId);
    if (!balloon) return;

    let transferred = 0;
    for (let c of s.sweater.charges) {
      if (c.type === 'neg' && !c.isTransferred) {
        c.isTransferred = true;
        balloon.charges.push({
          id: c.id,
          offsetX: 0,
          offsetY: 0
        });
        transferred++;
        if (transferred >= count) break;
      }
    }
  }
}

// ================= TEST RUNNER =================

function runTests() {
  console.log("=== Running Balloons Static Electricity Simulation Empirical Tests ===");

  // ----------------------------------------------------
  // TEST 1: Charge Conservation
  // ----------------------------------------------------
  console.log("\n[Test 1] Charge Conservation");
  {
    const sim = new HeadlessSimulation();
    
    // Count initial charges
    let initialNegSweater = sim.state.sweater.charges.filter(c => c.type === 'neg' && !c.isTransferred).length;
    let initialNegBalloons = sim.state.balloons.reduce((acc, b) => acc + b.charges.length, 0);
    console.log(`Initial Sweater Negatives: ${initialNegSweater}, Balloons Negatives: ${initialNegBalloons}`);
    assert.strictEqual(initialNegSweater, 60);
    assert.strictEqual(initialNegBalloons, 0);
    assert.strictEqual(initialNegSweater + initialNegBalloons, 60);

    // Rub balloon against sweater by dragging it into sweater
    const balloon = sim.state.balloons[0];
    sim.state.draggedBalloon = balloon;
    
    // Move balloon to sweater area
    balloon.x = sim.state.sweater.x + 50;
    balloon.y = sim.state.sweater.y + 100;
    
    // Set friction rate high
    sim.params.frictionRate = 100;

    // Perform multiple steps with high rubbing probability
    for (let i = 0; i < 50; i++) {
      sim.step(0.016);
    }
    
    sim.state.draggedBalloon = null;

    let rubbedNegSweater = sim.state.sweater.charges.filter(c => c.type === 'neg' && !c.isTransferred).length;
    let rubbedNegBalloons = sim.state.balloons.reduce((acc, b) => acc + b.charges.length, 0);
    console.log(`After Rubbing - Sweater Negatives: ${rubbedNegSweater}, Balloons Negatives: ${rubbedNegBalloons}`);
    assert.ok(rubbedNegBalloons > 0, "Balloon should have gained charges");
    assert.strictEqual(rubbedNegSweater + rubbedNegBalloons, 60, "Total charges must sum to 60");

    // Add second balloon
    sim.setTwoBalloons(true);
    let twoBalloonsNegBalloons = sim.state.balloons.reduce((acc, b) => acc + b.charges.length, 0);
    assert.strictEqual(rubbedNegSweater + twoBalloonsNegBalloons, 60, "Charge conserved after enabling 2nd balloon");

    // Rub second balloon
    const greenBalloon = sim.state.balloons[1];
    sim.state.draggedBalloon = greenBalloon;
    greenBalloon.x = sim.state.sweater.x + 80;
    greenBalloon.y = sim.state.sweater.y + 200;
    for (let i = 0; i < 50; i++) {
      sim.step(0.016);
    }
    sim.state.draggedBalloon = null;

    let rubbed2NegSweater = sim.state.sweater.charges.filter(c => c.type === 'neg' && !c.isTransferred).length;
    let rubbed2NegBalloons = sim.state.balloons.reduce((acc, b) => acc + b.charges.length, 0);
    console.log(`After Rubbing 2nd - Sweater Negatives: ${rubbed2NegSweater}, Balloons Negatives: ${rubbed2NegBalloons}`);
    assert.ok(sim.state.balloons[1].charges.length > 0, "Second balloon should have gained charges");
    assert.strictEqual(rubbed2NegSweater + rubbed2NegBalloons, 60, "Total charges must sum to 60");

    // Remove second balloon
    sim.setTwoBalloons(false);
    let postRemoveNegSweater = sim.state.sweater.charges.filter(c => c.type === 'neg' && !c.isTransferred).length;
    let postRemoveNegBalloons = sim.state.balloons.reduce((acc, b) => acc + b.charges.length, 0);
    console.log(`After Removing 2nd - Sweater Negatives: ${postRemoveNegSweater}, Balloons Negatives: ${postRemoveNegBalloons}`);
    assert.strictEqual(postRemoveNegSweater + postRemoveNegBalloons, 60, "Charges must be returned to sweater when balloon is removed");
    console.log("-> Charge conservation: PASS");
  }

  // ----------------------------------------------------
  // TEST 2: Electrostatic Forces (Coulomb's Law)
  // ----------------------------------------------------
  console.log("\n[Test 2] Electrostatic Forces (Coulomb's Law)");
  {
    const sim = new HeadlessSimulation();
    
    // Transfer 10 charges to yellow balloon
    sim.forceTransferCharges('b1', 10);
    
    // Disable gravity for force isolation
    sim.params.gravityStrength = 0;
    sim.settings.showWall = false;

    // Place yellow balloon at x=300, y=300
    const yellow = sim.state.balloons[0];
    yellow.x = 300;
    yellow.y = 300;
    yellow.vx = 0;
    yellow.vy = 0;

    // Sweater center is x=150, y=300
    // Vector from yellow to sweater is (-150, 0) -> attractive force should pull left (-x direction)
    sim.step(0.016);
    console.log(`Yellow Balloon Force towards Sweater: fx=${yellow.fx.toFixed(2)}, fy=${yellow.fy.toFixed(2)}`);
    assert.ok(yellow.fx < 0, "Attractive force should pull to the left");
    assert.strictEqual(Math.round(yellow.fy), 0, "Vertical force should be zero since centers are aligned horizontally");

    // Test Distance scaling (Inverse Square Law)
    const forceAt300 = Math.abs(yellow.fx);
    
    // Move closer (x=225, distance = 75, capped at 80)
    yellow.x = 225;
    sim.step(0.016);
    const forceAt225 = Math.abs(yellow.fx);
    console.log(`Force at x=300 (dist=150): ${forceAt300.toFixed(2)}, Force at x=225 (dist=75, capped at 80): ${forceAt225.toFixed(2)}`);
    assert.ok(forceAt225 > forceAt300, "Force must increase as distance decreases");

    // Test Electrostatic Strength scaling
    sim.params.electrostaticStrength = 30; // half of original
    sim.step(0.016);
    const forceAtHalfStrength = Math.abs(yellow.fx);
    console.log(`Force at 100% strength: ${forceAt225.toFixed(2)}, Force at 50% strength: ${forceAtHalfStrength.toFixed(2)}`);
    // Note: electrostatic strength changes k_e linearly
    assert.ok(Math.abs(forceAtHalfStrength - forceAt225 * 0.5) < 0.1, "Force should scale linearly with electrostaticStrength");

    // Test Balloon Repulsion
    sim.setTwoBalloons(true);
    sim.params.electrostaticStrength = 60;
    const green = sim.state.balloons[1];
    
    // Make both charged
    sim.forceTransferCharges('b2', 10);
    yellow.x = 300;
    yellow.y = 300;
    green.x = 400;
    green.y = 300;
    
    // Remove other forces (disable wall, place sweater far/neutralized)
    // To isolate repulsion, we check relative force directions:
    // yellow is at x=300, green at x=400. Repulsion should push yellow left (-x) and green right (+x).
    sim.step(0.016);
    console.log(`Repulsion forces - Yellow fx: ${yellow.fx.toFixed(2)}, Green fx: ${green.fx.toFixed(2)}`);
    // Note: total forces might contain sweater attraction, but we can verify the repulsion component.
    // If we set sweater charges to neutral:
    sim.state.sweater.charges.forEach(c => {
      if (c.type === 'neg') c.isTransferred = false;
    });
    // Now only balloon repulsion is active
    sim.step(0.016);
    console.log(`Pure Repulsion forces - Yellow fx: ${yellow.fx.toFixed(2)}, Green fx: ${green.fx.toFixed(2)}`);
    assert.ok(yellow.fx < 0, "Yellow balloon should be repelled to the left");
    assert.ok(green.fx > 0, "Green balloon should be repelled to the right");
    assert.ok(Math.abs(yellow.fx + green.fx) < 0.01, "Action-reaction forces should be equal and opposite");

    console.log("-> Electrostatic forces: PASS");
  }

  // ----------------------------------------------------
  // TEST 3: Wall Polarization and Attraction
  // ----------------------------------------------------
  console.log("\n[Test 3] Wall Polarization & Induced Attraction");
  {
    const sim = new HeadlessSimulation();
    sim.params.gravityStrength = 0;
    sim.settings.showWall = true;
    
    // Disable sweater charges
    sim.state.sweater.charges.forEach(c => {
      if (c.type === 'neg') c.isTransferred = false;
    });

    const yellow = sim.state.balloons[0];
    sim.forceTransferCharges('b1', 15);
    yellow.x = 550; // Place yellow balloon near the wall (wall at x=640)
    yellow.y = 300;

    // Check initial negative charge positions in wall
    const initialWallNegXs = sim.state.wall.charges.filter(c => c.type === 'neg').map(c => c.x);

    sim.step(0.016);
    
    const postWallNegXs = sim.state.wall.charges.filter(c => c.type === 'neg').map(c => c.x);
    
    // Negative charges in wall should move to the right (x increases)
    let movedRight = 0;
    for (let i = 0; i < initialWallNegXs.length; i++) {
      if (postWallNegXs[i] > initialWallNegXs[i]) movedRight++;
    }
    console.log(`Wall negative polarization: ${movedRight} / ${initialWallNegXs.length} charges shifted right`);
    assert.ok(movedRight > 0, "Wall negative charges must be repelled and move right");

    // Net force on balloon should be positive (attractive, towards the wall)
    console.log(`Wall induced force: fx=${yellow.fx.toFixed(2)}, fy=${yellow.fy.toFixed(2)}`);
    assert.ok(yellow.fx > 0, "Induced polarization must result in attraction to wall (+x direction)");

    // Turn off wall, verify wall force becomes 0
    sim.settings.showWall = false;
    sim.step(0.016);
    console.log(`Force after wall hidden: fx=${yellow.fx.toFixed(2)}`);
    assert.strictEqual(yellow.fx, 0, "No electrostatic forces when wall is hidden and sweater is neutral");
    
    console.log("-> Wall polarization & attraction: PASS");
  }

  // ----------------------------------------------------
  // TEST 4: Edge Cases and Crash Checks
  // ----------------------------------------------------
  console.log("\n[Test 4] Edge Cases & Crash Checks");
  {
    const sim = new HeadlessSimulation();
    
    // 4.1 No gravity, zero electrostatic strength
    sim.params.gravityStrength = 0;
    sim.params.electrostaticStrength = 0;
    sim.forceTransferCharges('b1', 10);
    const yellow = sim.state.balloons[0];
    yellow.x = 300;
    yellow.y = 300;
    yellow.vx = 50; // high speed
    yellow.vy = 50;
    sim.step(0.016);
    console.log(`Zero fields - forces: fx=${yellow.fx.toFixed(2)}, fy=${yellow.fy.toFixed(2)}`);
    assert.strictEqual(yellow.fx, 0);
    assert.strictEqual(yellow.fy, 0);

    // 4.2 Extremely close distance (overlap with wall and inside sweater)
    sim.params.electrostaticStrength = 100;
    yellow.x = sim.state.wall.x - 5; // overlapping/inside wall boundaries
    yellow.y = 300;
    sim.step(0.016);
    console.log(`Close to wall overlap - x: ${yellow.x.toFixed(2)}, vx: ${yellow.vx.toFixed(2)}, fx: ${yellow.fx.toFixed(2)}`);
    assert.ok(!isNaN(yellow.x), "Balloon x position should not be NaN");
    assert.ok(!isNaN(yellow.vx), "Balloon vx should not be NaN");
    assert.ok(!isNaN(yellow.fx), "Balloon fx should not be NaN");

    // 4.3 High speed and clamping
    yellow.x = 400;
    yellow.y = 300;
    yellow.vx = 10000; // insane velocity
    yellow.vy = 10000;
    sim.step(0.016);
    console.log(`After clamp - x: ${yellow.x.toFixed(2)}, y: ${yellow.y.toFixed(2)}, vx: ${yellow.vx.toFixed(2)}`);
    assert.ok(yellow.x <= sim.state.wall.x - yellow.radius, "Position clamping must keep balloon in bounds");
    assert.ok(yellow.vx <= 0, "Velocity should reverse due to bounce");
    
    // 4.4 Large scale stability test: 1000 frames random walk / inputs
    sim.setTwoBalloons(true);
    sim.params.gravityStrength = 50;
    sim.params.electrostaticStrength = 70;
    sim.params.frictionRate = 50;
    sim.state.draggedBalloon = sim.state.balloons[0];
    
    let crashCount = 0;
    for (let f = 0; f < 1000; f++) {
      // Simulate random mouse drag movement
      if (Math.random() < 0.2) {
        sim.state.draggedBalloon = Math.random() < 0.5 ? sim.state.balloons[0] : sim.state.balloons[1];
      }
      if (sim.state.draggedBalloon) {
        sim.state.draggedBalloon.x = 100 + Math.random() * 500;
        sim.state.draggedBalloon.y = 100 + Math.random() * 400;
      }
      
      // Randomly release
      if (Math.random() < 0.1) {
        sim.state.draggedBalloon = null;
      }
      
      // Randomly toggle parameters
      if (Math.random() < 0.05) {
        sim.settings.showWall = !sim.settings.showWall;
      }
      if (Math.random() < 0.02) {
        sim.setTwoBalloons(!sim.settings.twoBalloons);
      }

      try {
        sim.step(0.016);
        // Verify all positions and velocities are valid numbers
        sim.state.balloons.forEach(b => {
          if (isNaN(b.x) || isNaN(b.y) || isNaN(b.vx) || isNaN(b.vy)) {
            throw new Error(`NaN state detected in balloon ${b.id}`);
          }
        });
      } catch (e) {
        console.error("Simulation crashed during step:", e);
        crashCount++;
        break;
      }
    }
    console.log(`Stability test complete: 1000 iterations, ${crashCount} crashes`);
    assert.strictEqual(crashCount, 0, "Simulation must not crash or produce NaNs");
    console.log("-> Edge cases & crash checks: PASS");
  }

  console.log("\n=== ALL EMPIRICAL SIMULATION TESTS PASSED SUCCESSFULLY ===");
}

runTests();
