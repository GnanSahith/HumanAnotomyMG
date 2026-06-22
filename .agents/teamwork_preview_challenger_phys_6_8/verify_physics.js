const assert = require('assert');

function simulateStep(ps, s, dt, gravity) {
    const steps = 10;
    const subDt = dt / steps;
    
    for(let i = 0; i < steps; i++) {
        let F_spring = -s.k * (ps.y - s.restLength);
        let F_damping = -s.c * ps.vy;
        let F_gravity = s.massValue * gravity;
        
        let netForce = F_gravity + F_spring + F_damping;
        ps.ay = netForce / s.massValue;
        
        ps.vy += ps.ay * subDt;
        ps.y += ps.vy * subDt;
        
        ps.thermalEnergy += (s.c * ps.vy * ps.vy) * subDt;
        
        // Limit to prevent shooting off screen
        if (ps.y < 0.1) {
            ps.y = 0.1;
            const oldVy = ps.vy;
            ps.vy *= -0.5; // bounce
            const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
            ps.thermalEnergy += dKE;
        }
        const MAX_Y = 8.0;
        if (ps.y >= MAX_Y) {
            if (Math.abs(ps.vy) < 0.2) {
                ps.y = MAX_Y;
                ps.vy = 0;
            } else {
                ps.y = MAX_Y;
                const oldVy = ps.vy;
                ps.vy *= -0.5; // bounce
                const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
                ps.thermalEnergy += dKE;
            }
        }
    }
}

function runTests() {
    const s = { k: 10, c: 0.5, massValue: 1, restLength: 2 };
    const gravity = 9.81;

    // Test 1: Bouncing on bottom limit
    let ps1 = { y: 7.9, vy: 5, thermalEnergy: 0 }; // Going down fast
    simulateStep(ps1, s, 0.1, gravity);
    console.log("Test 1 (Bottom Bounce):", ps1);
    assert(ps1.y <= 8.0, "y should be clamped to 8.0");
    assert(ps1.vy < 0, "vy should be reversed (bounce)");

    // Test 2: Resting on bottom limit
    let ps2 = { y: 7.99, vy: 0.1, thermalEnergy: 0 }; // Going down very slow
    simulateStep(ps2, s, 0.1, gravity);
    console.log("Test 2 (Bottom Stick):", ps2);
    assert(ps2.y === 8.0, "y should be exactly 8.0");
    assert(ps2.vy === 0, "vy should be exactly 0 (sticking)");

    // Test 3: Top limit bounce
    let ps3 = { y: 0.2, vy: -5, thermalEnergy: 0 }; // Going up fast
    simulateStep(ps3, s, 0.1, gravity);
    console.log("Test 3 (Top Bounce):", ps3);
    assert(ps3.y >= 0.1, "y should be clamped to 0.1");
    assert(ps3.vy > 0, "vy should be reversed (bounce)");

    console.log("All physics sub-step tests passed.");
}

runTests();
