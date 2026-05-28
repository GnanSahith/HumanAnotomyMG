const subjects = ['Scraped', 'Biology', 'Chemistry', 'Maths'];
let diagramOnly = 0;  // answers that are TRULY empty/useless
let mentionsFigure = 0; // answers that reference a figure but have real text
let examples = [];

for (const sub of subjects) {
  try {
    const data = require(`./src/vedantu${sub}Data.js`)[`vedantu${sub}Data`];
    for (const [ch, qs] of Object.entries(data)) {
      for (let i = 0; i < qs.length; i++) {
        const a = qs[i].a;
        const aLower = a.toLowerCase();
        
        // Truly empty/placeholder answers
        if (a === 'Detailed solution available.' || a.trim().length < 10) {
          diagramOnly++;
          if (examples.length < 5) {
            examples.push({type: 'EMPTY', subject: sub, ch, q: i+1, a: a.substring(0,100)});
          }
        }
        // Answers that mention "figure" but have real explanatory text
        else if (aLower.includes('figure') || aLower.includes('diagram') || aLower.includes('the following figure') || aLower.includes('given below')) {
          mentionsFigure++;
        }
      }
    }
  } catch(e) {}
}

console.log(`Truly empty/placeholder answers: ${diagramOnly}`);
console.log(`Answers referencing figures but with text: ${mentionsFigure}`);
console.log(`\nEmpty examples:`);
examples.forEach(e => console.log(`  [${e.subject} Ch${e.ch} Q${e.q}]: "${e.a}"`));
