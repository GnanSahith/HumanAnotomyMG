const subjects = ['Scraped', 'Biology', 'Chemistry', 'Maths'];
let bySubject = {};

for (const sub of subjects) {
  try {
    const data = require(`./src/vedantu${sub}Data.js`)[`vedantu${sub}Data`];
    let emptyCount = 0;
    let totalCount = 0;
    for (const [ch, qs] of Object.entries(data)) {
      for (let i = 0; i < qs.length; i++) {
        totalCount++;
        if (qs[i].a === 'Detailed solution available.' || qs[i].a.trim().length < 10) {
          emptyCount++;
        }
      }
    }
    bySubject[sub] = { total: totalCount, empty: emptyCount };
  } catch(e) {}
}

for (const [sub, info] of Object.entries(bySubject)) {
  console.log(`${sub}: ${info.empty}/${info.total} empty (${Math.round(info.empty/info.total*100)}%)`);
}
