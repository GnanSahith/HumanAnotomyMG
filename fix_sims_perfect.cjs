const fs = require('fs');
const path = require('path');

const dir = './src/components/simulations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const f of files) {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Remove my bad injected block entirely!
    const badBlockRegex = /if\s*\(!isPlayingRef\.current\)\s*{\s*if\s*\(lastTimeRef\s*&&\s*lastTimeRef\.current\s*!==\s*undefined\)\s*lastTimeRef\.current\s*=\s*performance\.now\(\);\s*requestRef\.current\s*=\s*requestAnimationFrame\(updatePhysics\);\s*return;\s*}/g;
    content = content.replace(badBlockRegex, '');

    // 2. Fix Undefined canvas/rect in pointer handlers
    const injectStr = `\n    const canvas = canvasRef.current;\n    if (!canvas) return;\n    const rect = canvas.getBoundingClientRect();`;
    
    for (const handler of ['handlePointerMove =', 'handlePointerDown =', 'handlePointerUp =']) {
        if (content.includes(handler) && (content.includes('canvas.width') || content.includes('rect.width')) && !content.match(new RegExp(handler + '.*?=>\\s*{[\\s\\S]{0,100}const canvas = canvasRef\\.current'))) {
            content = content.replace(new RegExp('(' + handler + '.*?=>\\s*{)'), `$1${injectStr}`);
        }
    }

    // 3. Remove duplicate Top Bar from custom simulations
    // The top bar is usually wrapped in a div with some padding and buttons
    // The generic PhysicsSimulationView already has the title, pause, and back buttons!
    // We can just hide the internal top bar by setting display: 'none' or completely removing it.
    // Let's replace: {/* Top Bar */} \n <div style={{ ... }}> with `<div style={{ display: 'none' }}>`
    // Actually, a safer way is to match the Top Bar div and hide it.
    // In SoundWaves_mg.jsx it looks like:
    // {/* Top Bar */}
    // <div style={{
    //     padding: '16px 24px',
    content = content.replace(/\{\/\*\s*Top Bar\s*\*\/\}\s*<div\s*style=\{\{/g, '{/* Top Bar */}\n            <div style={{ display: "none",');

    // 4. Fix scoping issue in FaradaysLaw, OhmsLaw, NeonLights
    if (['CustomFaradaysLaw.jsx', 'CustomOhmsLaw.jsx', 'CustomNeonLights.jsx'].includes(f)) {
        content = content.replace(/if\s*\(!isPlayingRef\.current\)\s*{\s*requestAnimationFrame\(draw\);\s*return;\s*}/g, '');
        content = content.replace(/if\s*\(!isPlayingRef\.current\)\s*{\s*return;\s*}/g, '');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Perfectly fixed ${f}`);
    }
}
