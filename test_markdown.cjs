const fs = require('fs');

const text = `Repulsive force of magnitude, $F=6\\times {{10}^{-3}}N$
Charge on the first sphere, $q_1 = 2 \\times 10^{-7}C$
Charge on the second sphere, $q_2 = 3 \\times 10^{-7}C$
Distance between the spheres, $r=30cm=0.3m$
Electrostatic force between the two spheres is given by Coulomb’s law as, $F=\\frac{1}{4\\pi {{\\varepsilon }_{0}}}\\frac{{{q}_{1}}{{q}_{2}}}{{{r}^{2}}}$
Where, $\\varepsilon _{0}$ is the permittivity of free space and, $\\frac{1}{4\\pi {\\varepsilon _{0}}}=9\\times 10^{9}$
Now on substituting the given values, Coulomb’s law becomes, $F=\\frac{9\\times {{10}^{9}}\\times 2\\times {{10}^{-7}}\\times 3\\times {{10}^{-7}}}{{{\\left( 0.3 \\right)}^{2}}}$
Therefore, we found the electrostatic force between the given charged spheres to be $F=6\\times {{10}^{-3}}N$.`;

const formatToMockup = (text) => {
    let cleaned = text.replace(/([^.?!])\n\s*(\$.*?\$)/g, '$1 $2');
    cleaned = cleaned.replace(/\$([a-zA-Z]+)\$/g, '$1');
    cleaned = cleaned.replace(/(,\s*|:\s*)\$(\s*[A-Za-z_]+\s*=\s*[^$]+)\$/g, (match, p1, p2) => {
        if (p2.includes('\\frac') || p2.includes('\\times') || p2.length > 25) {
            return `${p1}\n\n$$$$\n${p2}\n$$$$\n\n`;
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
            line = `$$$$\n${line.replace(/\$/g, '')}\n$$$$`;
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
        
        if (line.includes('$$$$')) {
            inBlockMath = !inBlockMath;
        }
        
        if (hasGiven && !hasFormula && !hasCalc && !hasConclusion) {
            if (!inBlockMath && line.includes('=') && !line.startsWith('**') && !line.startsWith('*') && !line.includes('$$$$')) {
                out.push(`* ${line}`);
                continue;
            } else if (inBlockMath || line.includes('$$$$')) {
                out.push(line);
                continue;
            }
        }
        
        out.push(line);
    }
    return out.join('\n\n');
};

console.log(formatToMockup(text));
