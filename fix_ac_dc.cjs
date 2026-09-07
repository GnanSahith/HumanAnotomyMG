const fs = require('fs');
const path1 = 'src/components/simulations/CustomCircuitConstructionKitAC.jsx';
let content1 = fs.readFileSync(path1, 'utf8');

// Add labelOffset to drawGraph
content1 = content1.replace(
  /const drawGraph = \(yFunc, color, label, yOffset, scale\) => {/,
  'const drawGraph = (yFunc, color, label, yOffset, scale, labelOffset = 0) => {'
);

// Use labelOffset in fillText
content1 = content1.replace(
  /ctx\.fillText\(label, 10, yOffset - 40\);/,
  'ctx.fillText(label, 10, yOffset - 40 + labelOffset);'
);

// Fix overlapping labels and scale
content1 = content1.replace(
  /drawGraph\(d => d\.v1, '#ff5555', 'Source Voltage \(V\)', height \/ 4, 10\);/,
  'drawGraph(d => d.v1, \'#ff5555\', \'Source Voltage (V)\', height / 4, 10, 0);'
);
content1 = content1.replace(
  /drawGraph\(d => d\.v3, '#55ff55', 'Capacitor Voltage \(V\)', height \/ 4, 10\);/,
  'drawGraph(d => d.v3, \'#55ff55\', \'Capacitor Voltage (V)\', height / 4, 10, 20);'
);
content1 = content1.replace(
  /drawGraph\(d => -d\.i, '#5555ff', 'Circuit Current \(I\)', 3 \* height \/ 4, 50\);/,
  'drawGraph(d => -d.i, \'#5555ff\', \'Circuit Current (I)\', 3 * height / 4, 20, 0);'
);

fs.writeFileSync(path1, content1, 'utf8');
