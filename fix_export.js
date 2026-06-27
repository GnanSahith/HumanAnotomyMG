const fs = require('fs');
const file = 'src/components/simulations/CustomBlackbodySpectrum.jsx';
let content = fs.readFileSync(file, 'utf8');
content += '\nexport default CustomBlackbodySpectrumInner;\n';
fs.writeFileSync(file, content);
