const performance = require('perf_hooks').performance;

function calculateWave(numSources, renderWidth, renderHeight, frequency, separation, frames) {
    const k = frequency * 1.5;
    const cy = renderHeight / 2;
    let s1x = renderWidth / 2;
    let s2x = renderWidth / 2;
    let s1y = cy;
    let s2y = cy;

    if (numSources === 2) {
        s1y = cy - separation / 2;
        s2y = cy + separation / 2;
    }

    let t = 0;
    
    const start = performance.now();
    for (let f = 0; f < frames; f++) {
        t += frequency * 1.5;
        
        for (let y = 0; y < renderHeight; y++) {
            for (let x = 0; x < renderWidth; x++) {
                let val = 0;
                
                let d1 = Math.sqrt((x - s1x)**2 + (y - s1y)**2);
                val += Math.sin(d1 * k - t);
                
                if (numSources === 2) {
                    let d2 = Math.sqrt((x - s2x)**2 + (y - s2y)**2);
                    val += Math.sin(d2 * k - t);
                }

                val = val / numSources;
            }
        }
    }
    const end = performance.now();
    return end - start;
}

// 1. Stress test performance
const renderWidth = 250;
const renderHeight = 250;
const frames = 60 * 10; // 10 seconds at 60fps
const timeMs = calculateWave(2, renderWidth, renderHeight, 0.2, 60, frames);
console.log(`Stress Test: 2 sources, ${renderWidth}x${renderHeight}, ${frames} frames took ${timeMs.toFixed(2)} ms`);
console.log(`Average time per frame: ${(timeMs / frames).toFixed(2)} ms`);
if (timeMs / frames > 16.66) {
    console.log("FAIL: Performance exceeds 16.66ms per frame (60fps limit).");
} else {
    console.log("PASS: Performance is within 60fps limit.");
}

// 2. Math verification (Superposition)
// For two waves: sin(A) + sin(B) = 2 * sin((A+B)/2) * cos((A-B)/2)
// Since val is divided by 2:
// val = sin((A+B)/2) * cos((A-B)/2)
let mathCorrect = true;
let maxDiff = 0;
const k = 0.2 * 1.5;
let t = 1.5; // Arbitrary time
for (let y = 0; y < 250; y += 10) {
    for (let x = 0; x < 250; x += 10) {
        let d1 = Math.sqrt((x - 125)**2 + (y - 95)**2);
        let d2 = Math.sqrt((x - 125)**2 + (y - 155)**2);
        
        let A = d1 * k - t;
        let B = d2 * k - t;
        
        let valCode = (Math.sin(A) + Math.sin(B)) / 2;
        let valMath = Math.sin((A + B) / 2) * Math.cos((A - B) / 2);
        
        let diff = Math.abs(valCode - valMath);
        if (diff > maxDiff) maxDiff = diff;
        
        if (diff > 1e-10) {
            mathCorrect = false;
        }
    }
}
console.log(`Math Verification Max Difference: ${maxDiff}`);
if (mathCorrect) {
    console.log("PASS: Superposition math is exactly equivalent to trigonometric identity.");
} else {
    console.log("FAIL: Superposition math differs from theory.");
}
