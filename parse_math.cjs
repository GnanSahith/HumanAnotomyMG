const fs = require('fs');

const markdown = `
### Algebra
#### Upper Elementary (Grades 4-5)
[Algebra as Patterns](https://www.geogebra.org/math/patterns#upper-elementary)
[Division](https://www.geogebra.org/math/division#upper-elementary)
[Equations](https://www.geogebra.org/math/equations#upper-elementary)
[Mathematical Expressions](https://www.geogebra.org/math/expressions#upper-elementary)
[Multiplication](https://www.geogebra.org/math/multiplication#upper-elementary)
[Order of Operations](https://www.geogebra.org/math/order-operations#upper-elementary)

#### Middle School (Grades 6-8)
[Equations](https://www.geogebra.org/math/equations#middle-school)
[Functions](https://www.geogebra.org/math/functions#middle-school)
[Inequalities](https://www.geogebra.org/math/inequalities#middle-school)
[Linear Regression](https://www.geogebra.org/math/linear-regression#middle-school)
[Mathematical Expressions](https://www.geogebra.org/math/expressions#middle-school)
[Percentages](https://www.geogebra.org/math/percentages#middle-school)
[Ratios and Rates](https://www.geogebra.org/math/ratios-rates#middle-school)
[Sequences and Series](https://www.geogebra.org/math/sequences-series#middle-school)
[Statistics](https://www.geogebra.org/math/statistics#middle-school)

#### High School (Grades 9-12)
[Absolute Value](https://www.geogebra.org/math/absolute-value#high-school)
[Equations](https://www.geogebra.org/math/equations#high-school)
[Exponential Functions](https://www.geogebra.org/math/exponential-functions#high-school)
[Exponents](https://www.geogebra.org/math/exponents#high-school)
[Functions](https://www.geogebra.org/math/functions#high-school)
[Inequalities](https://www.geogebra.org/math/inequalities#high-school)
[Linear Functions](https://www.geogebra.org/math/linear-functions#high-school)
[Points, Lines, Segments, Rays, and Planes](https://www.geogebra.org/math/points-lines#high-school)
[Polynomials](https://www.geogebra.org/math/polynomials#high-school)
[Quadratic Equations](https://www.geogebra.org/math/quadratic-equations#high-school)
[Quadratic Functions](https://www.geogebra.org/math/quadratic-functions#high-school)
[Sequences and Series](https://www.geogebra.org/math/sequences-series#high-school)
[Systems of Equations and Inequalities](https://www.geogebra.org/math/system-of-equations-and-inequalities#high-school)

### Geometry
#### Upper Elementary (Grades 4-5)
[Angles](https://www.geogebra.org/math/angles#upper-elementary)
[Coordinates](https://www.geogebra.org/math/coordinates#upper-elementary)
[Points, Lines, Segments, Rays, and Planes](https://www.geogebra.org/math/points-lines#upper-elementary)
[Polygons](https://www.geogebra.org/math/polygons#upper-elementary)
[Symmetry](https://www.geogebra.org/math/symmetry#upper-elementary)
[Triangles](https://www.geogebra.org/math/triangles#upper-elementary)

#### Middle School (Grades 6-8)
[Angles](https://www.geogebra.org/math/angles#middle-school)
[Congruence and Similarity](https://www.geogebra.org/math/congruence-similarity#middle-school)
[Coordinates](https://www.geogebra.org/math/coordinates#middle-school)
[Polygons](https://www.geogebra.org/math/polygons#middle-school)
[Pythagoras' Theorem](https://www.geogebra.org/math/pythagorean-theorem#middle-school)
[Rigid Transformations](https://www.geogebra.org/math/transformations#middle-school)
[Solids](https://www.geogebra.org/math/solids#middle-school)
[Triangles](https://www.geogebra.org/math/triangles#middle-school)

#### High School (Grades 9-12)
[Angles](https://www.geogebra.org/math/angles#high-school)
[Points, Lines, Segments, Rays, and Planes](https://www.geogebra.org/math/points-lines#high-school)
[Triangles](https://www.geogebra.org/math/triangles#high-school)

### Measurement
#### Upper Elementary (Grades 4-5)
[Angles](https://www.geogebra.org/math/angles#upper-elementary)
[Area](https://www.geogebra.org/math/area#upper-elementary)
[Perimeter and Circumference](https://www.geogebra.org/math/perimeter#upper-elementary)
[Units and Measurement](https://www.geogebra.org/math/units-measurement#upper-elementary)
[Volume](https://www.geogebra.org/math/volume#upper-elementary)

#### Middle School (Grades 6-8)
[Area](https://www.geogebra.org/math/area#middle-school)
[Congruence and Similarity](https://www.geogebra.org/math/congruence-similarity#middle-school)
[Perimeter and Circumference](https://www.geogebra.org/math/perimeter#middle-school)
[Pythagoras' Theorem](https://www.geogebra.org/math/pythagorean-theorem#middle-school)
[Ratios and Rates](https://www.geogebra.org/math/ratios-rates#middle-school)
[Solids](https://www.geogebra.org/math/solids#middle-school)
[Surface Area and Nets](https://www.geogebra.org/math/surface#middle-school)
[Units and Measurement](https://www.geogebra.org/math/units-measurement#middle-school)
[Volume](https://www.geogebra.org/math/volume#middle-school)

#### High School (Grades 9-12)
[Angles](https://www.geogebra.org/math/angles#high-school)
[Triangles](https://www.geogebra.org/math/triangles#high-school)
[Units and Measurement](https://www.geogebra.org/math/units-measurement#high-school)

### Number Sense
#### Upper Elementary (Grades 4-5)
[Coordinates](https://www.geogebra.org/math/coordinates#upper-elementary)
[Decimal Numbers](https://www.geogebra.org/math/decimals#upper-elementary)
[Exponents](https://www.geogebra.org/math/exponents#upper-elementary)
[Factors and Multiples](https://www.geogebra.org/math/factors-multiples#upper-elementary)
[Fraction Sense](https://www.geogebra.org/math/fraction-sense#upper-elementary)
[Natural Numbers](https://www.geogebra.org/math/natural-numbers#upper-elementary)
[Order of Operations](https://www.geogebra.org/math/order-operations#upper-elementary)
[Place Value](https://www.geogebra.org/math/place-value#upper-elementary)
[Rational Numbers](https://www.geogebra.org/math/rational-numbers#upper-elementary)

#### Middle School (Grades 6-8)
[Absolute Value](https://www.geogebra.org/math/absolute-value#middle-school)
[Addition](https://www.geogebra.org/math/addition#middle-school)
[Integers](https://www.geogebra.org/math/integers#middle-school)
[Multiplication](https://www.geogebra.org/math/multiplication#middle-school)
[Percentages](https://www.geogebra.org/math/percentages#middle-school)
[Rational Numbers](https://www.geogebra.org/math/rational-numbers#middle-school)
[Ratios and Rates](https://www.geogebra.org/math/ratios-rates#middle-school)
[Real Numbers](https://www.geogebra.org/math/real-numbers#middle-school)
[Scientific Notation of Numbers](https://www.geogebra.org/math/scientific-notation#middle-school)

#### High School (Grades 9-12)
[Complex Numbers](https://www.geogebra.org/math/complex-numbers#high-school)

### Operations
#### Upper Elementary (Grades 4-5)
[Addition](https://www.geogebra.org/math/addition#upper-elementary)
[Decimal Numbers](https://www.geogebra.org/math/decimals#upper-elementary)
[Division](https://www.geogebra.org/math/division#upper-elementary)
[Mathematical Expressions](https://www.geogebra.org/math/expressions#upper-elementary)
[Mixed Numbers](https://www.geogebra.org/math/mixed-numbers#upper-elementary)
[Multiplication](https://www.geogebra.org/math/multiplication#upper-elementary)
[Operations with Fractions](https://www.geogebra.org/math/fraction-operations#upper-elementary)
[Order of Operations](https://www.geogebra.org/math/order-operations#upper-elementary)
[Subtraction](https://www.geogebra.org/math/subtraction#upper-elementary)

#### Middle School (Grades 6-8)
[Absolute Value](https://www.geogebra.org/math/absolute-value#middle-school)
[Addition](https://www.geogebra.org/math/addition#middle-school)
[Division](https://www.geogebra.org/math/division#middle-school)
[Exponents](https://www.geogebra.org/math/exponents#middle-school)
[Integers](https://www.geogebra.org/math/integers#middle-school)
[Mathematical Expressions](https://www.geogebra.org/math/expressions#middle-school)
[Mixed Numbers](https://www.geogebra.org/math/mixed-numbers#middle-school)
[Multiplication](https://www.geogebra.org/math/multiplication#middle-school)
[Operations with Fractions](https://www.geogebra.org/math/fraction-operations#middle-school)
[Percentages](https://www.geogebra.org/math/percentages#middle-school)
[Rational Numbers](https://www.geogebra.org/math/rational-numbers#middle-school)
[Ratios and Rates](https://www.geogebra.org/math/ratios-rates#middle-school)
[Roots](https://www.geogebra.org/math/roots#middle-school)
[Scientific Notation of Numbers](https://www.geogebra.org/math/scientific-notation#middle-school)
[Subtraction](https://www.geogebra.org/math/subtraction#middle-school)

#### High School (Grades 9-12)
[Complex Numbers](https://www.geogebra.org/math/complex-numbers#high-school)
[Exponents](https://www.geogebra.org/math/exponents#high-school)
[Roots](https://www.geogebra.org/math/roots#high-school)

### Probability and Statistics
#### Upper Elementary (Grades 4-5)
[Diagrams](https://www.geogebra.org/math/diagrams#upper-elementary)

#### Middle School (Grades 6-8)
[Diagrams](https://www.geogebra.org/math/diagrams#middle-school)
[Linear Regression](https://www.geogebra.org/math/linear-regression#middle-school)
[Probability](https://www.geogebra.org/math/probability#middle-school)
[Statistical Characteristics](https://www.geogebra.org/math/statistical-characteristics#middle-school)
[Statistics](https://www.geogebra.org/math/statistics#middle-school)

#### High School (Grades 9-12)
[Linear Regression](https://www.geogebra.org/math/linear-regression#high-school)
[Standard Deviation](https://www.geogebra.org/math/standard-deviation#high-school)
[Statistics](https://www.geogebra.org/math/statistics#high-school)
`;

let result = {};
let currentCategory = null;
let currentGrade = null;

const lines = markdown.split('\n');
for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('### ')) {
        const catName = line.replace('### ', '');
        const id = catName.toLowerCase().replace(/ /g, '_').replace('and_statistics', '').replace('probability_', 'probability');
        currentCategory = id;
        result[id] = { label: catName, grades: [] };
    } else if (line.startsWith('#### ')) {
        const gradeName = line.replace('#### ', '');
        currentGrade = { title: gradeName, topics: [] };
        result[currentCategory].grades.push(currentGrade);
    } else if (line.startsWith('[')) {
        const match = line.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
            currentGrade.topics.push({
                label: match[1],
                link: match[2],
                id: match[1].toLowerCase().replace(/[^a-z0-9]/g, '_')
            });
        }
    }
}

if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data');
}
fs.writeFileSync('src/data/mathCurriculum.js', 'export const mathCurriculum = ' + JSON.stringify(result, null, 2) + ';');
