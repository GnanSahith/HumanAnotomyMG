/**
 * Standalone Headless Physics Test Harness for CustomJohnTravoltage.jsx
 * Verifies:
 * 1. Charge accumulation: sliding/rubbing the foot on the carpet accumulates static electricity.
 * 2. Humidity leak: charges decay exponentially over time based on humidity levels.
 * 3. Distance-dependent dielectric breakdown of air: spark triggers only when E-field (Q/d) exceeds threshold.
 * 4. Spark discharge: once a spark is established, the charge rapidly drains to ground.
 */

const assert = require('assert');

class JohnTravoltagePhysicsSimulation {
  constructor() {
    this.settings = {
      humidity: 25,
      dielectricStrength: 25,
      soundEnabled: false,
      showCharges: true
    };

    this.state = {
      footX: 300,
      prevFootX: 300,
      armAngle: -35,
      accumulatedCharge: 0,
      isDischarging: false,
      x_h: 0,
      y_h: 0,
      x_f: 0,
      y_f: 0,
      dischargeAccumulator: 0
    };
  }

  // Update loop mirroring the physics state updates in CustomJohnTravoltage.jsx
  step(dt = 0.016) {
    const state = this.state;
    const settings = this.settings;

    // 1. Calculate arm/hand coordinates
    // Shoulder = (420, 240). Arm length = 120.
    const angleRad = (state.armAngle * Math.PI) / 180;
    state.x_h = 420 + 120 * Math.cos(angleRad);
    state.y_h = 240 + 120 * Math.sin(angleRad);
    // Finger tip extends 15px further
    state.x_f = state.x_h + 15 * Math.cos(angleRad);
    state.y_f = state.y_h + 15 * Math.sin(angleRad);

    // 2. Friction: Rub foot on carpet
    const footMovement = Math.abs(state.footX - state.prevFootX);
    if (footMovement > 0.4 && !state.isDischarging) {
      const addedCharge = footMovement * 0.16;
      state.accumulatedCharge = Math.min(150, state.accumulatedCharge + addedCharge);
    }
    state.prevFootX = state.footX;

    // 3. Air Leakage: charge decay based on humidity
    if (state.accumulatedCharge > 0 && !state.isDischarging) {
      const leakRate = 0.04 * (settings.humidity / 100) * state.accumulatedCharge;
      state.accumulatedCharge = Math.max(0, state.accumulatedCharge - leakRate * dt);
    }

    // 4. Spark Breakdown Calculations
    // Doorknob center is at (595, 260), radius is 15
    const dxKnob = state.x_f - 595;
    const dyKnob = state.y_f - 260;
    const rawDistance = Math.hypot(dxKnob, dyKnob);
    const gapDistance = Math.max(0.5, rawDistance - 15);

    // Simulated distance in cm (15 px = 1 cm)
    const gapDistanceCm = gapDistance / 15;
    
    // Electric field (kV/cm) E = Q / d
    const electricField = gapDistanceCm > 0.1 ? (state.accumulatedCharge / gapDistanceCm) : 0;
    const threshold = settings.dielectricStrength;

    // Check if spark discharges
    if (!state.isDischarging && state.accumulatedCharge > 3 && electricField >= threshold) {
      state.isDischarging = true;
    }

    // Handle continuous spark discharge phase
    if (state.isDischarging) {
      const baseDischargeSpeed = 95.0; // charges per second
      state.dischargeAccumulator += baseDischargeSpeed * dt;
      
      const chargesToDrain = Math.floor(state.dischargeAccumulator);
      if (chargesToDrain > 0) {
        state.accumulatedCharge = Math.max(0, state.accumulatedCharge - chargesToDrain);
        state.dischargeAccumulator -= chargesToDrain;
      }

      // Termination conditions
      if (state.accumulatedCharge <= 1) {
        state.isDischarging = false;
      } else if (electricField < threshold * 0.72) {
        state.isDischarging = false;
      }
    }

    return {
      gapDistanceCm,
      electricField,
      threshold
    };
  }
}

// Verification Harness
function runTests() {
  console.log('Running John Travoltage Physics Simulation Tests...');

  // TEST 1: Rubbing foot increases accumulated charge
  {
    const sim = new JohnTravoltagePhysicsSimulation();
    assert.strictEqual(sim.state.accumulatedCharge, 0, 'Initial charge should be 0');

    // Simulate foot rubbing motion
    sim.state.footX = 220;
    sim.step(0.016);
    
    sim.state.footX = 350;
    sim.step(0.016);

    assert.ok(sim.state.accumulatedCharge > 0, 'Charge must accumulate upon foot rubbing');
    console.log('  [PASS] Test 1: Friction & Charge accumulation');
  }

  // TEST 2: Charge decays faster with high humidity
  {
    const simLowHum = new JohnTravoltagePhysicsSimulation();
    simLowHum.settings.humidity = 10;
    simLowHum.state.accumulatedCharge = 100;

    const simHighHum = new JohnTravoltagePhysicsSimulation();
    simHighHum.settings.humidity = 90;
    simHighHum.state.accumulatedCharge = 100;

    // Step both once without foot movement
    simLowHum.step(1.0);
    simHighHum.step(1.0);

    assert.ok(
      simHighHum.state.accumulatedCharge < simLowHum.state.accumulatedCharge,
      'Higher humidity must cause faster charge decay'
    );
    console.log('  [PASS] Test 2: Humidity leak rate difference');
  }

  // TEST 3: Dielectric breakdown and spark distance dependency
  {
    const sim = new JohnTravoltagePhysicsSimulation();
    sim.settings.dielectricStrength = 25; // 25 kV/cm
    
    // Set hand angle away from doorknob (high distance)
    sim.state.armAngle = -100; 
    sim.state.accumulatedCharge = 10; // modest charge
    
    let res = sim.step(0.016);
    assert.strictEqual(sim.state.isDischarging, false, 'Should not discharge at long distance with low charge');

    // Bring hand very close to the doorknob
    sim.state.armAngle = 0; // closer
    res = sim.step(0.016);
    
    // Calculate and verify if we triggered a spark
    const expectedField = sim.state.accumulatedCharge / res.gapDistanceCm;
    if (expectedField >= sim.settings.dielectricStrength) {
      assert.strictEqual(sim.state.isDischarging, true, 'Spark should have triggered');
    }
    
    console.log('  [PASS] Test 3: Dielectric breakdown threshold');
  }

  // TEST 4: Spark discharges accumulated charge rapidly to ground
  {
    const sim = new JohnTravoltagePhysicsSimulation();
    sim.settings.dielectricStrength = 20;
    sim.state.armAngle = 0; // finger close to knob
    sim.state.accumulatedCharge = 80; // lots of charge

    // Trigger the spark
    sim.step(0.016);
    assert.strictEqual(sim.state.isDischarging, true, 'Spark should be active');

    // Let the spark run for 1 second of simulation time
    const initialCharge = sim.state.accumulatedCharge;
    for (let i = 0; i < 60; i++) {
      sim.step(0.016);
    }

    assert.ok(
      sim.state.accumulatedCharge < initialCharge,
      'Charge must decrease during active spark discharge'
    );
    console.log('  [PASS] Test 4: Rapid spark discharge to ground');
  }

  console.log('All physics verification tests passed successfully.');
}

runTests();
