const fs = require('fs');
let r = fs.readFileSync('./src/vedantuScrapedData.js', 'utf8').replace('export const ', 'const ');
eval(r);
for(let i=1; i<=14; i++) {
  console.log('Ch ' + i + ': ' + (vedantuScrapedData[i] ? vedantuScrapedData[i].length : 0));
}
