const fs = require('fs');

// We have vedantuScrapedData.js which exports `export const vedantuScrapedData = {...}`
// Let's read it, strip the export, and eval it.
let raw = fs.readFileSync('./src/vedantuScrapedData.js', 'utf8');
raw = raw.replace('export const vedantuScrapedData = ', 'const vedantuScrapedData = ');
eval(raw);

const formatToMockup = (text) => {
    let cleaned = text.replace(/([^.?!])\n\s*(\$.*?\$)/g, '$1 $2');
    cleaned = cleaned.replace(/\$([a-zA-Z]+)\$/g, '$1');
    cleaned = cleaned.replace(/(,\s*|:\s*)\$(\s*[A-Za-z_]+\s*=\s*[^$]+)\$/g, (match, p1, p2) => {
        if (p2.includes('\\frac') || p2.includes('\\times') || p2.length > 25) {
            return `${p1}\n\n$$\n${p2}\n$$\n\n`;
        }
        return match;
    });

    let lines = cleaned.split('\n');
    let out = [];
    
    let hasGiven = false;
    let hasFormula = false;
    let hasCalc = false;
    let hasConclusion = false;
    let inBlockMath = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        let mathMatch = line.match(/\$.*?\$/g);
        let textWithoutMath = line.replace(/\$.*?\$/g, '').trim();
        if (mathMatch && textWithoutMath.length < 20 && line.includes('=') && (line.includes('\\frac') || line.includes('\\times'))) {
            line = `$$\n${line.replace(/\$/g, '')}\n$$`;
        }
        
        let lower = line.toLowerCase();
        
        if (!hasGiven && (lower.includes('given') || lower.includes('information:'))) {
            out.push('\n**Given Parameters:**\n');
            hasGiven = true;
            let cleanLine = line.replace(/We are given the following information:\s*/i, '').replace(/^Given:\s*/i, '').trim();
            if (cleanLine && cleanLine.length > 3) out.push(`* ${cleanLine}`);
            continue;
        }
        
        if (!hasFormula && (lower.includes('formula') || lower.includes('law as') || lower.includes('expression') || lower.includes('given by') || lower.includes('where,'))) {
            out.push('\n**Explanation & Formula:**\n');
            hasFormula = true;
        } else if (!hasCalc && (lower.includes('substituting') || lower.includes('substitute') || lower.includes('now,'))) {
            out.push('\n**Step-by-Step Calculation:**\n');
            hasCalc = true;
        } else if (!hasConclusion && (line.startsWith('Therefore') || line.startsWith('Hence') || line.startsWith('Thus') || line.startsWith('So,'))) {
            out.push('\n**Conclusion:**\n');
            hasConclusion = true;
        }
        
        let isBlockMathBorder = line.includes('$$');
        if (isBlockMathBorder) {
            inBlockMath = !inBlockMath;
        }
        
        if (hasGiven && !hasFormula && !hasCalc && !hasConclusion) {
            if (!inBlockMath && line.includes('=') && !line.startsWith('**') && !line.startsWith('*') && !isBlockMathBorder) {
                out.push(`* ${line}`);
                continue;
            } else if (inBlockMath || isBlockMathBorder) {
                out.push(line);
                continue;
            }
        }
        
        out.push(line);
    }
    return out.join('\n\n');
};

let ch1 = vedantuScrapedData['1'];
for (let i = 0; i < 3; i++) {
    console.log(`\n\n=== QUESTION ${i+1} ===\n`);
    console.log(ch1[i].q);
    console.log(`\n--- FORMATTED ANSWER ---\n`);
    console.log(formatToMockup(ch1[i].a));
}
