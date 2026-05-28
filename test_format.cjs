const fs = require('fs');

const healText = (text) => {
    if (!text) return text;
    let t = text;
    let prev = "";
    while (t !== prev) {
      prev = t;
      t = t.replace(/([a-zA-Z])\n\s*([a-z])/g, '$1 $2');
    }
    t = t.replace(/\n\s*([.,;!?])/g, '$1');
    t = t.replace(/([a-zA-Z])\n\s*\(/g, '$1 (');
    return t;
};

const formatToMockup = (text) => {
    let cleaned = healText(text);
    cleaned = cleaned.replace(/\$\$/g, '$');
    
    let lines = cleaned.split('\n').map(l => l.trim()).filter(l => l);
    
    let out = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        let mathMatch = line.match(/\$.*?\$/g);
        let textWithoutMath = line.replace(/\$.*?\$/g, '').trim();
        if (mathMatch && textWithoutMath.length < 20 && line.includes('=') && (line.includes('\\frac') || line.includes('\\times'))) {
            line = `$$\n${line.replace(/\$/g, '')}\n$$`;
        }
        
        let isShortTerm = textWithoutMath.length > 2 && textWithoutMath.length < 45 && !/[.:;!?]$/.test(textWithoutMath);
        if (isShortTerm && !line.includes('$$') && !line.startsWith('**') && !line.startsWith('*')) {
            line = `**${line}**`;
        }
        out.push(line);
    }
    
    let result = "";
    let currentParaLength = 0;
    for (let i = 0; i < out.length; i++) {
        result += out[i];
        currentParaLength += out[i].length;
        
        if (i < out.length - 1) {
            if (out[i].startsWith('$$') || out[i+1].startsWith('$$') || 
                out[i].startsWith('* ') || out[i+1].startsWith('* ') || 
                out[i].startsWith('#') || out[i+1].startsWith('#')) {
                result += '\n\n'; 
                currentParaLength = 0;
            } else if (out[i].startsWith('**') && out[i].endsWith('**')) {
                result += ' '; 
            } else {
                if (currentParaLength > 300 && /[.!?]$/.test(out[i].replace(/\**$/, ''))) {
                    result += '\n\n';
                    currentParaLength = 0;
                } else {
                    result += ' '; 
                }
            }
        }
    }
    return result;
}

const data = require('./src/vedantuBiologyData.js').vedantuBiologyData;
console.log("FORMATTED:\n" + formatToMockup(data['2'][10].a));
