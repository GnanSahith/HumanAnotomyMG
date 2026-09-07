const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '.'); // Since this script runs in src/data
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js') && f.startsWith('class_'));

let totalFixed = 0;
let affectedFiles = 0;

for (const file of files) {
    const filePath = path.join(dataDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let dataObj;
    try {
        const m = content.match(/export default (\{[\s\S]*?\});/);
        if (m) {
            dataObj = eval('(' + m[1] + ')');
        } else if (content.includes('export default')) {
            const rawObjStr = content.replace('export default', '').trim().replace(/;$/, '');
            dataObj = eval('(' + rawObjStr + ')');
        }
    } catch (e) {
        console.log(`Failed to parse ${file}, skipping...`);
        continue;
    }
    
    if (!dataObj) continue;
    
    let modified = false;
    for (const ch of Object.keys(dataObj)) {
        const qas = dataObj[ch];
        if (!Array.isArray(qas)) continue;
        
        for (let i = 0; i < qas.length; i++) {
            const qa = qas[i];
            // Broad regex to catch SEO markers, pagination markers, and embedded sets
            const regex = /(Class\s+\d+\s+.*?(Question Answers|Revision Notes|Worksheet|NCERT Solutions)|Vedantu provides|After familiarising yourself with|Students can also download)/i;
            
            if (qa && typeof qa.q === 'string') {
                const matchQ = qa.q.match(regex);
                if (matchQ) {
                    const truncated = qa.q.substring(0, matchQ.index).trim();
                    if (truncated !== qa.q) {
                        qa.q = truncated;
                        modified = true;
                        totalFixed++;
                    }
                }
            }
            if (qa && typeof qa.a === 'string') {
                const matchA = qa.a.match(regex);
                if (matchA) {
                    const truncated = qa.a.substring(0, matchA.index).trim();
                    if (truncated !== qa.a) {
                        qa.a = truncated;
                        modified = true;
                        totalFixed++;
                    }
                }
            }
        }
    }
    
    if (modified) {
        const newContent = `export default ${JSON.stringify(dataObj, null, 2)};\n`;
        fs.writeFileSync(filePath, newContent, 'utf8');
        affectedFiles++;
        console.log(`Deep cleaned glitches in ${file}`);
    }
}
console.log(`Successfully deep cleaned ${totalFixed} glitches across ${affectedFiles} files!`);
