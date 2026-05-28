const fs = require('fs');
let raw = fs.readFileSync('./src/vedantuScrapedData.js', 'utf8');
raw = raw.replace('export const vedantuScrapedData = ', 'const vedantuScrapedData = ');
eval(raw);
console.log(Object.keys(vedantuScrapedData));
