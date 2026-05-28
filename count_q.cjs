const fs = require('fs');
let raw = fs.readFileSync('./src/vedantuScrapedData.js', 'utf8');
raw = raw.replace('export const vedantuScrapedData = ', 'const vedantuScrapedData = ');
eval(raw);
console.log("Chapter 1 questions:", vedantuScrapedData['1'].length);
if (vedantuScrapedData['1'].length > 0) {
    console.log("Last question:");
    console.log(vedantuScrapedData['1'][vedantuScrapedData['1'].length - 1].q);
}
