const { performance } = require('perf_hooks');

function runStressTest() {
    const renderWidth = 250;
    const renderHeight = 250;
    const numSources = 2;
    const frequency = 0.2;
    const t = 100;
    const k = frequency * 1.5;
    
    const s1x = 125, s1y = 95;
    const s2x = 125, s2y = 155;

    // We will simulate 60 frames
    const frames = 60;
    
    const start = performance.now();
    
    for (let f = 0; f < frames; f++) {
        let currentT = t + f * frequency * 1.5;
        // Mock imageData
        const data = new Uint8Array(renderWidth * renderHeight * 4);
        
        for (let y = 0; y < renderHeight; y++) {
            for (let x = 0; x < renderWidth; x++) {
                let val = 0;
                
                let d1 = Math.sqrt((x - s1x)**2 + (y - s1y)**2);
                val += Math.sin(d1 * k - currentT);
                
                if (numSources === 2) {
                    let d2 = Math.sqrt((x - s2x)**2 + (y - s2y)**2);
                    val += Math.sin(d2 * k - currentT);
                }

                val = val / numSources;
                
                const intensity = (val + 1) / 2;
                
                const r = 10 + intensity * 40;
                const g = 50 + intensity * 150;
                const b = 150 + intensity * 105;

                const idx = (y * renderWidth + x) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }
    }
    
    const end = performance.now();
    console.log(`Stress Test: ${frames} frames computed in ${(end - start).toFixed(2)} ms`);
    console.log(`Average: ${((end - start) / frames).toFixed(2)} ms per frame`);
    
    if ((end - start) / frames > 16) {
        console.log('FAIL: Frame rendering takes longer than 16ms, which would drop FPS below 60.');
    } else {
        console.log('PASS: Performance is adequate for 60 FPS.');
    }
}

function verifyMath() {
    console.log("\nMathematical Verification:");
    const s1x = 0, s1y = 0;
    const s2x = 10, s2y = 0;
    const k = Math.PI; // lambda = 2
    const t = 0;

    // A point equidistant from both sources (x=5, y=0 => d1=5, d2=5)
    let x = 5, y = 0;
    let d1 = Math.sqrt((x - s1x)**2 + (y - s1y)**2); // 5
    let d2 = Math.sqrt((x - s2x)**2 + (y - s2y)**2); // 5
    let val = Math.sin(d1 * k - t) + Math.sin(d2 * k - t);
    console.log(`Point (${x},${y}): d1=${d1}, d2=${d2}, val=${val.toFixed(4)}. Expected constructive interference? d1*k = 5PI. sin(5PI)=0. val=0. Hmm.`);
    
    // Let's pick a point where d1=0.5 (lambda/4), d2=0.5
    // k = PI => lambda = 2.
    // If d1 = 1 => 1 * PI = PI. sin(PI) = 0.
    // Let's use k = PI / 2. => lambda = 4.
    const k2 = Math.PI / 2;
    let d1_2 = 1, d2_2 = 1; // 1 * PI/2 = PI/2 => sin(PI/2) = 1
    let val2 = Math.sin(d1_2 * k2) + Math.sin(d2_2 * k2);
    console.log(`Constructive point: val=${val2.toFixed(4)} (Expected 2.0)`);
    
    let d1_3 = 1, d2_3 = 3; // d1=1 (sin=1), d2=3 (sin(3PI/2)=-1)
    let val3 = Math.sin(d1_3 * k2) + Math.sin(d2_3 * k2);
    console.log(`Destructive point: val=${val3.toFixed(4)} (Expected 0.0)`);
}

runStressTest();
verifyMath();
