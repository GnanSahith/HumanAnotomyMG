const fs = require('fs');
const path = require('path');

const dir = './src/components/simulations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const f of files) {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // FIX 1: Exponential growth in updatePhysics
    // Replace: requestRef.current = requestAnimationFrame(updatePhysics);
    // With nothing (just let it return)
    content = content.replace(/requestRef\.current\s*=\s*requestAnimationFrame\(updatePhysics\);/g, '/* removed recursive RAF */');

    // FIX 2: Missing isPlayingRef
    // If we use isPlayingRef but it's not defined via useRef
    if (content.includes('isPlayingRef.current') && !content.includes('isPlayingRef = useRef')) {
        // Find where to insert it. Usually after canvasRef = useRef or inside the component body
        content = content.replace(/(const canvasRef = useRef\(.*?\);)/, '$1\n  const isPlayingRef = useRef(true);');
        // If canvasRef wasn't found, try graphCanvasRef or state
        if (original === content) {
            content = content.replace(/(const \[.*?\] = useState\(.*?\);)/, '$1\n  const isPlayingRef = useRef(true);');
        }
    }
    
    // FIX 3: Undefined canvas/rect in pointer handlers
    // Match handlePointerMove = (e) => { ... canvas.width ... rect.width }
    // We will inject: const canvas = canvasRef.current; if(!canvas) return; const rect = canvas.getBoundingClientRect();
    const injectStr = `\n    const canvas = canvasRef.current;\n    if (!canvas) return;\n    const rect = canvas.getBoundingClientRect();`;
    
    // For handlePointerMove
    if (content.includes('handlePointerMove =') && (content.includes('canvas.width') || content.includes('rect.width')) && !content.match(/handlePointerMove =.*?=>\s*{[\s\S]{0,100}const canvas = canvasRef\.current/)) {
        content = content.replace(/(handlePointerMove =.*?=>\s*{)/, `$1${injectStr}`);
    }

    // For handlePointerDown
    if (content.includes('handlePointerDown =') && (content.includes('canvas.width') || content.includes('rect.width')) && !content.match(/handlePointerDown =.*?=>\s*{[\s\S]{0,100}const canvas = canvasRef\.current/)) {
        content = content.replace(/(handlePointerDown =.*?=>\s*{)/, `$1${injectStr}`);
    }

    // For handlePointerUp
    if (content.includes('handlePointerUp =') && (content.includes('canvas.width') || content.includes('rect.width')) && !content.match(/handlePointerUp =.*?=>\s*{[\s\S]{0,100}const canvas = canvasRef\.current/)) {
        content = content.replace(/(handlePointerUp =.*?=>\s*{)/, `$1${injectStr}`);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${f}`);
    }
}
