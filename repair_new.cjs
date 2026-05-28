const fs = require('fs');

const subjects = ['English', 'Economics', 'Businessstudies'];

for (const sub of subjects) {
    const filename = `./src/vedantu${sub}Data.js`;
    if (!fs.existsSync(filename)) continue;
    
    let raw = fs.readFileSync(filename, 'utf8');
    const varName = `vedantu${sub}Data`;
    raw = raw.replace(`export const ${varName} = `, `global.data = `);
    eval(raw);
    
    let count = 0;
    
    for (const [chNum, questions] of Object.entries(global.data)) {
        for (let qObj of questions) {
            if (qObj.a === "Detailed solution available.") {
                let splitParts = qObj.q.split(/\n\s*ANS\s*[:.]\s*|\n\s*Ans\s*[:.]\s*|\n\s*Answer\s*[:.]\s*/i);
                if (splitParts.length > 1) {
                    qObj.q = splitParts[0].trim();
                    qObj.a = splitParts.slice(1).join('\nAns: ').trim();
                    count++;
                }
            }
        }
    }
    
    if (count > 0) {
        const jsContent = `export const ${varName} = ` + JSON.stringify(global.data, null, 2) + ";";
        fs.writeFileSync(filename, jsContent, 'utf8');
        console.log(`Repaired ${count} questions in ${sub}!`);
    } else {
        console.log(`No repairs needed for ${sub}.`);
    }
}
