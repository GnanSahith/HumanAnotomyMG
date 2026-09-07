const fs = require('fs');
const path = require('path');

const dir = './src/components/simulations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    
    const errors = [];
    
    // Pattern 1: requestAnimationFrame(updatePhysics) inside updatePhysics
    if (content.match(/const updatePhysics = \(\) => {[\s\S]*?requestAnimationFrame\(updatePhysics\)/)) {
        errors.push("Recursive requestAnimationFrame(updatePhysics) bug");
    }
    
    // Pattern 2: undefined canvas/rect in pointer move
    if (content.match(/handlePointerMove =.*?=>.*?canvas\.width/s) && !content.match(/const canvas = canvasRef\.current/)) {
        errors.push("Undefined 'canvas' in handlePointerMove");
    }
    if (content.match(/handlePointerMove =.*?=>.*?rect\.width/s) && !content.match(/const rect = canvas/)) {
        errors.push("Undefined 'rect' in handlePointerMove");
    }
    
    // Pattern 3: lastTimeRef usage
    if (content.includes('lastTimeRef.current = performance.now()') && !content.includes('lastTimeRef.current = performance.now();') && content.includes('lastTimeRef = useRef')) {
        // Just checking if it has lastTimeRef
    }

    if (errors.length > 0) {
        console.log(`\n${f}:`);
        errors.forEach(e => console.log(`  - ${e}`));
    }
}
