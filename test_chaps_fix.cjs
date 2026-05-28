const fs = require('fs');
let r = fs.readFileSync('./src/vedantuScrapedData.js', 'utf8').replace('export const vedantuScrapedData', 'global.vedantuScrapedData');
eval(r);
for(let i=1; i<=14; i++) {
  console.log('Ch ' + i + ': ' + (global.vedantuScrapedData[i] ? global.vedantuScrapedData[i].length : 0));
}
