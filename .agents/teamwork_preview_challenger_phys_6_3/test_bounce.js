const fs = require('fs');

function testSimulation() {
    const s = { massValue: 1, k: 50, c: 0 };
    const gravity = 9.81;
    const restLength = 2;
    
    let ps = {
        y: 8,
        vy: 0,
        ay: 0,
        thermalEnergy: 0,
    };
    
    const steps = 10;
    const dt = 0.1; // 100ms
    const subDt = dt / steps;
    
    console.log("Initial state:", ps);
    
    let logs = [];
    
    for (let frame = 0; frame < 20; frame++) {
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
                ps.vy *= -0.5; // bounce
                console.log(`Bounced! frame=${frame}, i=${i}`);
            }
        }
        
        let KE = 0.5 * s.massValue * ps.vy * ps.vy;
        let h = 8 - ps.y;
        let PE_grav = s.massValue * gravity * h;
        let x = ps.y - restLength;
        let PE_spring = 0.5 * s.k * x * x;
        let TotalE = KE + PE_grav + PE_spring + ps.thermalEnergy;
        
        logs.push(`Frame ${frame}: y=${ps.y.toFixed(3)}, vy=${ps.vy.toFixed(3)}, TE=${TotalE.toFixed(3)}`);
    }
    
    console.log(logs.join('\n'));
}

testSimulation();
