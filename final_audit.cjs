const subjects = ['Scraped', 'Biology', 'Chemistry', 'Maths'];
console.log('=== FINAL 12th GRADE DATA AUDIT ===\n');

let grandTotal = 0, grandGood = 0, grandImg = 0, grandEmpty = 0;

for (const sub of subjects) {
  try {
    const data = require(`./src/vedantu${sub}Data.js`)[`vedantu${sub}Data`];
    let subTotal = 0, subGood = 0, subImg = 0, subEmpty = 0;
    
    for (const [ch, qs] of Object.entries(data)) {
      for (const q of qs) {
        subTotal++;
        const isEmpty = q.a === 'Detailed solution available.' || q.a.trim().length < 10;
        const hasImg = q.a.includes('![');
        if (isEmpty) subEmpty++;
        else subGood++;
        if (hasImg) subImg++;
      }
    }
    
    const label = sub === 'Scraped' ? 'Physics' : sub;
    console.log(`${label}:`);
    console.log(`  Total: ${subTotal} | With answers: ${subGood} (${Math.round(subGood/subTotal*100)}%) | With diagrams: ${subImg} | Empty: ${subEmpty}`);
    
    grandTotal += subTotal;
    grandGood += subGood;
    grandImg += subImg;
    grandEmpty += subEmpty;
  } catch(e) {}
}

console.log(`\n--- GRAND TOTAL ---`);
console.log(`Total questions: ${grandTotal}`);
console.log(`With text answers: ${grandGood} (${Math.round(grandGood/grandTotal*100)}%)`);
console.log(`With embedded diagrams: ${grandImg}`);
console.log(`Still empty (diagram placeholder): ${grandEmpty} (${Math.round(grandEmpty/grandTotal*100)}%)`);
