const fs = require('fs');
const path = require('path');

const dir = './src/components/simulations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const f of files) {
    const filePath = path.join(dir, f);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let useIdx = -1;
    let defIdx = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('if (!isPlayingRef.current)')) {
            useIdx = i;
        }
        if (lines[i].includes('const isPlayingRef = useRef(isPlaying)')) {
            defIdx = i;
        }
    }

    if (useIdx !== -1 && defIdx !== -1 && useIdx < defIdx) {
        console.log(f);
    }
}
