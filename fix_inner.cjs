const fs = require('fs');

const filesToFix = ['CustomFaradaysLaw.jsx', 'CustomOhmsLaw.jsx', 'CustomNeonLights.jsx'];

for (const f of filesToFix) {
    const path = `./src/components/simulations/${f}`;
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        
        // Remove the bad isPlayingRef checks
        content = content.replace(/if\s*\(!isPlayingRef\.current\)\s*{\s*requestAnimationFrame\(draw\);\s*return;\s*}/g, '');
        content = content.replace(/if\s*\(!isPlayingRef\.current\)\s*{\s*return;\s*}/g, '');
        content = content.replace(/if\s*\(typeof isPlayingRef === "undefined" \|\| !isPlayingRef \|\| !isPlayingRef\.current\)\s*return;/g, '');

        fs.writeFileSync(path, content, 'utf8');
        console.log(`Fixed inner component scoping issue for ${f}`);
    }
}
