const fs = require('fs');
const filePath = 'src/components/simulations/CustomMoleculesandLight.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const drawFunctions = `
const drawSpring = (ctx, x1, y1, x2, y2, coils, radius, color) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = radius;
    ctx.lineCap = 'round';
    ctx.stroke();
};

const drawDoubleBondSpring = (ctx, x1, y1, x2, y2, color) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * 4;
    const ny = dx / len * 4;
    drawSpring(ctx, x1 + nx, y1 + ny, x2 + nx, y2 + ny, 9, 4, color);
    drawSpring(ctx, x1 - nx, y1 - ny, x2 - nx, y2 - ny, 9, 4, color);
};

const drawTripleBondSpring = (ctx, x1, y1, x2, y2, color) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * 6;
    const ny = dx / len * 6;
    drawSpring(ctx, x1, y1, x2, y2, 9, 4, color);
    drawSpring(ctx, x1 + nx, y1 + ny, x2 + nx, y2 + ny, 9, 4, color);
    drawSpring(ctx, x1 - nx, y1 - ny, x2 - nx, y2 - ny, 9, 4, color);
};
`;

content = content.replace(/const draw = \(state, canvas, ctx, draggedIndex = null\) => {/, drawFunctions + '\nconst draw = (state, canvas, ctx, draggedIndex = null) => {');

// Fix the ref initialization warning/error:
content = content.replace(/if \(\!stateRef\.current\) \{[\s\S]*?stateRef\.current\.molecule\.atoms = getMoleculeLayout\('Water', \d+, \d+\);\n  \}/, 
`  if (!stateRef.current) {
    const initialMolecule = getInitialMoleculeState('Water');
    stateRef.current = {
      isPlaying: true,
      lastTime: 0,
      vibrationTimer: 0,
      rotationAngle: 0,
      molecule: initialMolecule,
      photons: [],
      emissionTimer: 0
    };
    // The exact layout will be updated in the effect once canvas is measured.
  }`);

fs.writeFileSync(filePath, content, 'utf8');
