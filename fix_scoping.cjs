const fs = require('fs');
const path = require('path');

const dir = './src/components/simulations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const f of files) {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove the bad isPlayingRef block injected into inner functions
    const regex1 = /if\s*\(!isPlayingRef\.current\)\s*{\s*requestAnimationFrame\([^)]+\);\s*return;\s*}/g;
    content = content.replace(regex1, '');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed scoping in ${f}`);
    }
}
