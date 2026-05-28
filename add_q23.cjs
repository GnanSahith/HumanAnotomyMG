const fs = require('fs');

let raw = fs.readFileSync('./src/vedantuScrapedData.js', 'utf8');

const q23 = `    ,
    {
      "q": "23. Two large, thin metal plates are parallel and close to each other. On their inner faces, the plates have surface charge densities of opposite signs and of magnitude $17.0 \\\\times {{10}^{-22}}C/{{m}^{2}}$. What is E: (a) in the outer region of the first plate, (b) in the outer region of the second plate, and (c) between the plates?",
      "a": "Given that,\\nSurface charge density of plate A, $\\\\sigma =17.0\\\\times {{10}^{-22}}C/{{m}^{2}}$\\nSurface charge density of plate B, $\\\\sigma =-17.0\\\\times {{10}^{-22}}C/{{m}^{2}}$\\nPermittivity of free space, ${{\\\\varepsilon }_{0}}=8.854\\\\times {{10}^{-12}}{{N}^{-1}}{{C}^{2}}{{m}^{-2}}$\\n\\na) In the outer region of the first plate, the electric fields due to the two plates are equal and opposite. The net electric field is zero.\\n$$E=0$$\\n\\nb) In the outer region of the second plate, the electric fields due to the two plates are also equal and opposite. The net electric field is zero.\\n$$E=0$$\\n\\nc) Between the plates, the electric fields due to both plates are in the same direction. The net electric field is given by the relation,\\n$$E=\\\\frac{\\\\sigma }{{{\\\\varepsilon }_{0}}}$$\\nSubstituting the given values, we get,\\n$$E=\\\\frac{17.0\\\\times {{10}^{-22}}}{8.854\\\\times {{10}^{-12}}}$$\\n$$E=1.92\\\\times {{10}^{-10}}N/C$$\\nTherefore, the electric field between the plates is $1.92\\\\times {{10}^{-10}}N/C$."
    }
  ],
  "2": [`;

raw = raw.replace('    }\n  ],\n  "2": [', q23);

fs.writeFileSync('./src/vedantuScrapedData.js', raw);
console.log("Successfully added Question 23 to Chapter 1.");
