const subjects = ['Scraped', 'Biology', 'Chemistry', 'Maths'];
let total = 0;
let diagramCount = 0;
let examples = [];

for (const sub of subjects) {
  try {
    const data = require(`./src/vedantu${sub}Data.js`)[`vedantu${sub}Data`];
    for (const [ch, qs] of Object.entries(data)) {
      for (let i = 0; i < qs.length; i++) {
        total++;
        const a = qs[i].a.toLowerCase();
        const q = qs[i].q.toLowerCase();
        // Detect diagram-only or near-empty answers
        const isDiagram = (
          a.includes('diagram') ||
          a.includes('figure') ||
          a.includes('draw') ||
          a === 'detailed solution available.' ||
          a.length < 15 ||
          (q.includes('draw') && a.length < 100) ||
          (q.includes('diagram') && a.length < 100) ||
          (q.includes('label') && a.length < 100)
        );
        if (isDiagram) {
          diagramCount++;
          if (examples.length < 8) {
            examples.push({
              subject: sub, chapter: ch, qNum: i+1,
              qPreview: qs[i].q.substring(0, 80),
              aPreview: qs[i].a.substring(0, 120),
              aLen: qs[i].a.length
            });
          }
        }
      }
    }
  } catch(e) {}
}

console.log(`Total questions: ${total}`);
console.log(`Diagram/empty answers: ${diagramCount}`);
console.log(`\nExamples:`);
examples.forEach(e => {
  console.log(`\n[${e.subject} Ch${e.chapter} Q${e.qNum}] (ans length: ${e.aLen})`);
  console.log(`  Q: ${e.qPreview}...`);
  console.log(`  A: ${e.aPreview}...`);
});
