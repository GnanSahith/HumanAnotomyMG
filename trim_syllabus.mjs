import fs from 'fs';
import { chaptersData } from './chaptersData.mjs';

let trimmedChaptersData = {};
let removedCount = 0;

for (const [className, subjects] of Object.entries(chaptersData)) {
    trimmedChaptersData[className] = {};
    const classNum = className.replace('Class ', '');
    
    for (const [subjectName, chapters] of Object.entries(subjects)) {
        const subjectSlug = subjectName.toLowerCase().replace(/ /g, '_');
        const fileName = `src/data/class_${classNum}_${subjectSlug}.js`;
        
        let data = {};
        if (fs.existsSync(fileName)) {
            let content = fs.readFileSync(fileName, 'utf-8');
            content = content.replace('export default ', '').trim();
            if (content.endsWith(';')) content = content.slice(0, -1);
            try {
                data = JSON.parse(content);
            } catch (e) { 
                console.error(`Error parsing ${fileName}`);
            }
        }
        
        let validChapters = [];
        for (const ch of chapters) {
            const chNum = ch.id.replace('c', '');
            let q_list = data[`chapter-${chNum}`] || data[`chapter${chNum}`] || data[chNum];
            
            let valid = 0;
            if (q_list && Array.isArray(q_list)) {
                for (const qa of q_list) {
                    const qLower = (qa.q || '').toLowerCase();
                    const isSeo = qLower.includes('cbse class') || qLower.includes('ncert solutions') || qLower.includes('important questions');
                    const isMissing = qa.a === 'Detailed solution available.' || (qa.a || '').trim().length < 10;
                    if (!isSeo && !isMissing) valid++;
                }
            }
            if (valid > 0) {
                validChapters.push(ch);
            } else {
                removedCount++;
                console.log(`Removed: ${className} - ${subjectName} - ${ch.title} (Chapter ${chNum})`);
            }
        }
        trimmedChaptersData[className][subjectName] = validChapters;
    }
}

const finalJs = `export const chaptersData = ${JSON.stringify(trimmedChaptersData, null, 2)};\n`;

// Write to both .js and .mjs
fs.writeFileSync('src/chaptersData.js', finalJs);
fs.writeFileSync('chaptersData.mjs', finalJs);
console.log(`\nSuccessfully removed ${removedCount} defunct chapters.`);
