const fs = require('fs');

const subjects = ['Scraped', 'Biology', 'Chemistry', 'Maths'];

for (const sub of subjects) {
    const filename = `./src/vedantu${sub}Data.js`;
    if (!fs.existsSync(filename)) continue;
    
    let raw = fs.readFileSync(filename, 'utf8');
    raw = raw.replace(`export const vedantu${sub}Data = `, `global.data = `);
    eval(raw);
    
    let count = 0;
    
    for (const [chNum, questions] of Object.entries(global.data)) {
        for (let qObj of questions) {
            if (qObj.a === "Detailed solution available.") {
                // The answer is stuck inside qObj.q!
                // Let's use a very forgiving regex to split it
                // e.g. ANS \n : or Ans. or Ans\n:
                let splitParts = qObj.q.split(/\n\s*ANS\s*:?|\n\s*Ans\.?\s*:?|\n\s*ans\s*:?/i);
                
                // If it split successfully into more than 1 part
                if (splitParts.length > 1) {
                    qObj.q = splitParts[0].trim();
                    // Join the rest back together in case 'Ans' appeared in the answer
                    qObj.a = splitParts.slice(1).join('\nAns: ').trim();
                    count++;
                } else {
                    // Try without newline constraint, just ' Ans :'
                    splitParts = qObj.q.split(/\s+ANS\s*:|\s+Ans\.\s+|\s+Ans\s*:/i);
                    if (splitParts.length > 1 && splitParts[0].length < 1500) {
                        qObj.q = splitParts[0].trim();
                        qObj.a = splitParts.slice(1).join(' Ans: ').trim();
                        count++;
                    }
                }
            }
        }
    }
    
    if (count > 0) {
        const jsContent = `export const vedantu${sub}Data = ` + JSON.stringify(global.data, null, 2) + ";";
        fs.writeFileSync(filename, jsContent, 'utf8');
        console.log(`Repaired ${count} questions in ${sub}!`);
    } else {
        console.log(`No repairs needed for ${sub}.`);
    }
}
