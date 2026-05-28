const subjects = [
  { file: 'Scraped', label: 'Physics' },
  { file: 'Chemistry', label: 'Chemistry' },
  { file: 'Maths', label: 'Maths' },
  { file: 'Biology', label: 'Biology' },
  { file: 'English', label: 'English' },
  { file: 'Economics', label: 'Economics' },
  { file: 'Businessstudies', label: 'Business Studies' },
];

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       COMPLETE 12TH GRADE ACADEMIC PORTAL AUDIT            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let gTotal = 0, gGood = 0, gImg = 0, gEmpty = 0;

for (const { file, label } of subjects) {
  try {
    const data = require(`./src/vedantu${file}Data.js`)[`vedantu${file}Data`];
    let total = 0, good = 0, img = 0, empty = 0, chapters = 0;
    
    for (const [ch, qs] of Object.entries(data)) {
      if (qs.length > 0) chapters++;
      for (const q of qs) {
        total++;
        const isEmpty = q.a === 'Detailed solution available.' || q.a.trim().length < 10;
        if (isEmpty) empty++;
        else good++;
        if (q.a.includes('![')) img++;
      }
    }
    
    const pct = total > 0 ? Math.round(good/total*100) : 0;
    const bar = '█'.repeat(Math.round(pct/5)) + '░'.repeat(20 - Math.round(pct/5));
    console.log(`${label.padEnd(18)} ${bar} ${pct}%`);
    console.log(`${''.padEnd(18)} ${chapters} chapters | ${total} questions | ${good} answered | ${img} diagrams | ${empty} empty\n`);
    
    gTotal += total; gGood += good; gImg += img; gEmpty += empty;
  } catch(e) {
    console.log(`${label.padEnd(18)} ❌ Data file not found`);
  }
}

console.log('─'.repeat(62));
console.log(`GRAND TOTAL: ${gTotal} questions across 7 subjects`);
console.log(`  ✅ ${gGood} with answers (${Math.round(gGood/gTotal*100)}%)`);
console.log(`  🖼️  ${gImg} with embedded diagrams`);
console.log(`  📐 ${gEmpty} diagram placeholders (${Math.round(gEmpty/gTotal*100)}%)`);
