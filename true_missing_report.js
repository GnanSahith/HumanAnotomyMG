import fs from 'fs';
import { chaptersData } from './src/chaptersData.js';

let missing = [];

for (const [className, subjects] of Object.entries(chaptersData)) {
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
                console.log(`Error parsing ${fileName}`);
            }
        }
        
        for (const ch of chapters) {
            // ch.id is like 'c1', 'c2'
            const chNum = ch.id.replace('c', '');
            
            // Try different key formats
            let q_list = data[`chapter-${chNum}`] || data[`chapter${chNum}`] || data[chNum];
            
            let valid = 0;
            if (q_list && Array.isArray(q_list)) {
                for (const qa of q_list) {
                    const qLower = (qa.q || '').toLowerCase();
                    const isSeo = qLower.includes('cbse class') || qLower.includes('ncert solutions') || qLower.includes('important questions');
                    const isMissing = qa.a === 'Detailed solution available.' || (qa.a || '').trim().length < 10;
                    if (!isSeo && !isMissing) {
                        valid++;
                    }
                }
            }
            
            if (valid === 0) {
                missing.push({ class: parseInt(classNum), subject: subjectName, chapter: parseInt(chNum) });
            }
        }
    }
}

missing.sort((a, b) => {
    if (a.class !== b.class) return a.class - b.class;
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.chapter - b.chapter;
});

let md = `# Comprehensive Missing Chapters Report\n\n`;
md += `Total Missing: ${missing.length}\n\n`;
md += `| Class | Subject | Chapter |\n`;
md += `|---|---|---|\n`;
for (const m of missing) {
    md += `| ${m.class} | ${m.subject} | ${m.chapter} |\n`;
}

fs.writeFileSync('/Users/gnansahith/.gemini/antigravity/brain/107ca816-07af-44c0-91ad-17ea12d689b1/true_missing_report.md', md);
console.log(`Found ${missing.length} missing chapters across the entire curriculum.`);
