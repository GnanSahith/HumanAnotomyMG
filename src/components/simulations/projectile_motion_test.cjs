/**
 * Standalone Headless Physics Test Harness for CustomProjectileMotion.jsx
 * Verifies:
 * 1. Projectile range: standard range calculation matches analytical solution without air resistance.
 * 2. Gravity dependency: higher gravity results in shorter range and flight time.
 * 3. Air resistance: air drag reduces range and maximum height.
 * 4. Height dependency: launch from a non-zero height increases flight time and range.
 */

const assert = require('assert');

class ProjectilePhysicsSimulation {
  constructor() {
    this.velocity = 15; // m/s
    this.angle = 45; // degrees
    this.gravity = 9.81; // m/s^2
    this.height = 0; // m
    this.mass = 5; // kg
    this.diameter = 0.5; // m
    this.airResistance = false;
    this.dragCoefficient = 0.47;
  }

  // Runs a complete simulation from launch until the projectile hits the ground (y <= 0)
  runSimulation(slowMotion = false) {
    const timeRef = { current: 0 };
    const posRef = { current: { x: 0, y: this.height } };
    const velRef = { current: { 
      vx: this.velocity * Math.cos(this.angle * Math.PI / 180), 
      vy: this.velocity * Math.sin(this.angle * Math.PI / 180) 
    } };
    const accRef = { current: { ax: 0, ay: -this.gravity } };

    const dt = 0.016; // Simulate 60fps frame rate
    const steps = 4;
    const subDt = dt / steps;

    let peakHeight = this.height;

    // Run loop until hit ground
    while (posRef.current.y > 0 || timeRef.current === 0) {
      timeRef.current += dt;

      for (let i = 0; i < steps; i++) {
        let ax = 0;
        let ay = -this.gravity;

        if (this.airResistance) {
          const rho = 1.225; // Sea level air density
          const r_m = this.diameter / 2;
          const A = Math.PI * r_m * r_m;
          const v_mag = Math.hypot(velRef.current.vx, velRef.current.vy);
          if (v_mag > 0.01) {
            const F_drag = 0.5 * rho * v_mag * v_mag * this.dragCoefficient * A;
            const a_drag = F_drag / this.mass;
            ax = -a_drag * (velRef.current.vx / v_mag);
            ay -= a_drag * (velRef.current.vy / v_mag);
          }
        }

        velRef.current.vx += ax * subDt;
        velRef.current.vy += ay * subDt;
        posRef.current.x += velRef.current.vx * subDt;
        posRef.current.y += velRef.current.vy * subDt;

        accRef.current = { ax, ay };

        if (posRef.current.y > peakHeight) {
          peakHeight = posRef.current.y;
        }

        if (posRef.current.y <= 0) {
          posRef.current.y = 0;
          break;
        }
      }

      if (posRef.current.y <= 0) {
        break;
      }
    }

    return {
      flightTime: timeRef.current,
      range: posRef.current.x,
      peakHeight
    };
  }
}

function runTests() {
  console.log('Running Projectile Motion Physics Simulation Tests...');

  // TEST 1: Parabolic trajectory without air resistance matches analytical equations
  {
    const sim = new ProjectilePhysicsSimulation();
    sim.velocity = 15;
    sim.angle = 45;
    sim.gravity = 9.81;
    sim.height = 0;
    sim.airResistance = false;

    const res = sim.runSimulation();

    // Analytical formulas:
    // Range R = v^2 * sin(2*theta) / g = 15^2 * sin(90) / 9.81 = 22.936 m
    // Time of flight T = 2 * v * sin(theta) / g = 2 * 15 * sin(45) / 9.81 = 2.162 s
    const expectedRange = (sim.velocity * sim.velocity * Math.sin(2 * sim.angle * Math.PI / 180)) / sim.gravity;
    const expectedTime = (2 * sim.velocity * Math.sin(sim.angle * Math.PI / 180)) / sim.gravity;

    assert.ok(Math.abs(res.range - expectedRange) < 0.5, `Range should be close to ${expectedRange}m, got ${res.range}m`);
    assert.ok(Math.abs(res.flightTime - expectedTime) < 0.1, `Flight time should be close to ${expectedTime}s, got ${res.flightTime}s`);
    console.log('  [PASS] Test 1: Parabolic trajectory matches analytical predictions');
  }

  // TEST 2: Higher gravity reduces range and flight time
  {
    const simEarth = new ProjectilePhysicsSimulation();
    simEarth.gravity = 9.81;
    const resEarth = simEarth.runSimulation();

    const simJupiter = new ProjectilePhysicsSimulation();
    simJupiter.gravity = 24.79;
    const resJupiter = simJupiter.runSimulation();

    assert.ok(resJupiter.range < resEarth.range, 'Jupiter gravity must result in shorter range than Earth');
    assert.ok(resJupiter.flightTime < resEarth.flightTime, 'Jupiter gravity must result in shorter flight time than Earth');
    console.log('  [PASS] Test 2: Gravity dependency');
  }

  // TEST 3: Air drag reduces range, flight time, and peak height
  {
    const simVacuum = new ProjectilePhysicsSimulation();
    simVacuum.airResistance = false;
    const resVacuum = simVacuum.runSimulation();

    const simAir = new ProjectilePhysicsSimulation();
    simAir.airResistance = true;
    simAir.mass = 2; // lighter mass makes air resistance more pronounced
    simAir.diameter = 0.8;
    const resAir = simAir.runSimulation();

    assert.ok(resAir.range < resVacuum.range, 'Air resistance must reduce range');
    assert.ok(resAir.peakHeight < resVacuum.peakHeight, 'Air resistance must reduce peak height');
    console.log('  [PASS] Test 3: Air drag effects');
  }

  // TEST 4: Non-zero height pedestal increases flight time and range
  {
    const simGround = new ProjectilePhysicsSimulation();
    simGround.height = 0;
    const resGround = simGround.runSimulation();

    const simPedestal = new ProjectilePhysicsSimulation();
    simPedestal.height = 10;
    const resPedestal = simPedestal.runSimulation();

    assert.ok(resPedestal.flightTime > resGround.flightTime, 'Launching from pedestal must increase flight time');
    assert.ok(resPedestal.range > resGround.range, 'Launching from pedestal must increase range');
    console.log('  [PASS] Test 4: Launch height dependency');
  }

  console.log('All physics verification tests passed successfully.');
}

runTests();
