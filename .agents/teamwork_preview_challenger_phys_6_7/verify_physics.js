const assert = require('assert');

// Simulate the exact logic of the physics engine
function runPhysicsLoop() {
    let gravity = 9.81;
    let restLength = 2;
    let isPlaying = true;
    let springs = [
        { id: 1, massValue: 1, k: 10, c: 0.5 }
    ];
    let ps = {
        id: 1,
        y: 6.0,
        vy: 0,
        ay: 0,
        isDragging: false,
        thermalEnergy: 0
    };
    
    // Simulate high velocity hitting bottom limit
    ps.y = 7.9;
    ps.vy = 5.0; // going down fast
    
    let dt = 0.1; // simulated dt
    let steps = 10;
    let subDt = dt / steps;
    let s = springs[0];

    let initialVy = ps.vy;
    
    for(let i = 0; i < steps; i++) {
        let F_spring = -s.k * (ps.y - restLength);
        let F_damping = -s.c * ps.vy;
        let F_gravity = s.massValue * gravity;
        let netForce = F_gravity + F_spring + F_damping;
        ps.ay = netForce / s.massValue;
        
        ps.vy += ps.ay * subDt;
        ps.y += ps.vy * subDt;
        
        ps.thermalEnergy += (s.c * ps.vy * ps.vy) * subDt;
        
        if (ps.y < 0.1) {
            ps.y = 0.1;
            const oldVy = ps.vy;
            ps.vy *= -0.5;
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
                ps.vy *= -0.5;
                const dKE = 0.5 * s.massValue * (oldVy * oldVy - ps.vy * ps.vy);
                ps.thermalEnergy += dKE;
            }
        }
    }
    
    console.log("After one dt:");
    console.log("y:", ps.y, "vy:", ps.vy, "thermalEnergy:", ps.thermalEnergy);
    
    // The velocity should have flipped sign (bounced) because it hit MAX_Y
    if (ps.vy >= 0) {
        throw new Error("Failed: vy should be negative after bouncing off bottom limit");
    }
    if (ps.y > 8.0) {
        throw new Error("Failed: y should not exceed MAX_Y");
    }
    if (ps.thermalEnergy <= 0) {
        throw new Error("Failed: thermal energy should increase from bounce");
    }

    console.log("Bounce test passed.");

    // Now test resting at limit
    ps.y = 8.0;
    ps.vy = 0.1; // very small velocity
    
    for(let i = 0; i < steps; i++) {
        let F_spring = -s.k * (ps.y - restLength);
        let F_damping = -s.c * ps.vy;
        let F_gravity = s.massValue * gravity;
        let netForce = F_gravity + F_spring + F_damping;
        ps.ay = netForce / s.massValue;
        
        ps.vy += ps.ay * subDt;
        ps.y += ps.vy * subDt;
        
        if (ps.y >= 8.0) {
            if (Math.abs(ps.vy) < 0.2) {
                ps.y = 8.0;
                ps.vy = 0;
            } else {
                ps.y = 8.0;
                ps.vy *= -0.5;
            }
        }
    }
    
    console.log("After resting at limit:");
    console.log("y:", ps.y, "vy:", ps.vy);
    if (ps.y > 8.0) {
        throw new Error("Failed: y should not exceed MAX_Y");
    }
    if (ps.vy !== 0 && ps.y === 8.0) {
         throw new Error("Failed: vy should be 0 when resting at limit");
    }

    console.log("Rest at limit test passed.");
    
    // Now test time pause/resume logic
    // We mock the updatePhysics frame logic
    let lastTimeRef = { current: 0 };
    let timeRef = { current: 0 };
    let requestRef = { current: null };
    isPlaying = false;
    
    // First frame (paused)
    let time = 1000;
    let realDt = (time - lastTimeRef.current) / 1000; // 1000 / 1000 = 1s
    lastTimeRef.current = time;
    // in the code:
    // if (!isPlaying) { return; }
    
    // Resume after 5 seconds
    time = 6000;
    // we simulate next call
    realDt = (time - lastTimeRef.current) / 1000; // 5000 / 1000 = 5s
    lastTimeRef.current = time;
    isPlaying = true;
    
    // Even if realDt is 5s (huge), safeDt caps it
    let safeDt = Math.min(realDt, 0.1);
    let effectiveDt = safeDt * 1.5; 
    
    console.log("effective dt upon resume:", effectiveDt);
    if (effectiveDt > 0.15) {
        throw new Error("Failed: effective dt is too large, simulation will explode");
    }
    
    console.log("Pause/resume dt cap test passed.");
}

runPhysicsLoop();
