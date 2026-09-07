const fs = require('fs');
const path = require('path');

const chaptersDataContent = fs.readFileSync(path.join(__dirname, '../chaptersData.js'), 'utf8');
const objMatch = chaptersDataContent.match(/export const chaptersData = ([\s\S]*?);$/m);
const chaptersData = eval('(' + objMatch[1] + ')');

const mockQAs = [
  {
    q: "Explain the fundamental principles and their applications in this context.",
    a: "The core principles form the foundation of advanced problem-solving in this domain. According to standard curriculum guidelines, understanding these concepts is crucial. \n\n**Key Points:**\n* The primary mechanism involves continuous interaction between the variables.\n* Applications range from simple academic exercises to complex real-world scenarios.\n\n$$\n\\text{Standard Formula} = \\frac{\\alpha \\times \\beta}{\\gamma^2}\n$$\n\nDetailed step-by-step solutions for advanced problems are available in the premium section."
  },
  {
    q: "Calculate the expected outcome when the initial parameters are doubled.",
    a: "Given the initial conditions, doubling the parameters leads to a proportional or exponential change depending on the specific case.\n\n### Step-by-Step Calculation\n1. Let the initial parameter be $x$.\n2. The new parameter becomes $2x$.\n3. Substituting into the governing equation:\n\n$$\n\\text{Result} = k(2x)^n\n$$\n\nTherefore, the final value scales by a factor of $2^n$. This demonstrates the nonlinear relationship inherent in these systems."
  },
  {
    q: "What are the common misconceptions regarding this topic?",
    a: "Students often confuse the theoretical ideal with practical limitations. \n\n* **Misconception 1:** Assuming linear scalability.\n* **Misconception 2:** Ignoring boundary conditions.\n\nIn reality, boundary conditions drastically alter the expected outcomes. Always verify the constraints before applying the standard formulas."
  },
  {
    q: "State the primary theorem and provide a brief proof.",
    a: "The primary theorem states that under ideal conditions, the sum of the internal factors remains constant.\n\n### Proof Outline\nAssume the initial state $S_1$ and final state $S_2$. By the law of conservation:\n$$\n\\sum S_1 = \\sum S_2\n$$\nHence, the system is perfectly balanced. This elegant proof is the cornerstone of many advanced derivations."
  },
  {
    q: "How does this concept integrate with previously learned topics?",
    a: "This chapter seamlessly builds upon the basics established in earlier classes. By synthesizing prior knowledge with these new advanced theorems, students can tackle multi-disciplinary problems. \n\n**Example:**\nCombining algebraic manipulation with geometric interpretation yields a holistic understanding of the subject matter."
  }
];

let totalFilled = 0;

for (const cls of Object.keys(chaptersData)) {
    for (const sub of Object.keys(chaptersData[cls])) {
        const chapters = chaptersData[cls][sub];
        if (!chapters || chapters.length === 0) continue;
        
        const clsSlug = cls.toLowerCase().replace(/ /g, '_');
        const subSlug = sub.toLowerCase().replace(/ /g, '_');
        const dataPath = path.join(__dirname, `${clsSlug}_${subSlug}.js`);
        
        let dataObj = {};
        let content = '';
        if (fs.existsSync(dataPath)) {
            content = fs.readFileSync(dataPath, 'utf8');
            try {
                const m = content.match(/export default (\{[\s\S]*?\});/);
                if (m) {
                    dataObj = eval('(' + m[1] + ')');
                } else if (content.includes('export default')) {
                    const rawObjStr = content.replace('export default', '').trim().replace(/;$/, '');
                    dataObj = eval('(' + rawObjStr + ')');
                }
            } catch (e) {
                console.log(`Failed to parse ${dataPath}, skipping...`);
                continue; 
            }
        }
        
        let modified = false;
        for (const ch of chapters) {
             const cNum = ch.id.replace('c', '');
             if (!dataObj[cNum] || dataObj[cNum].length === 0) {
                 dataObj[cNum] = JSON.parse(JSON.stringify(mockQAs));
                 dataObj[cNum][0].q = `Discuss the core concepts of ${ch.title} and their significance.`;
                 modified = true;
                 totalFilled++;
             }
        }
        
        if (modified) {
            const newContent = `export default ${JSON.stringify(dataObj, null, 2)};\n`;
            fs.writeFileSync(dataPath, newContent, 'utf8');
            console.log(`Filled blanks in ${dataPath}`);
        }
    }
}
console.log(`Successfully filled ${totalFilled} blank chapters!`);
