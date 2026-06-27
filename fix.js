const fs = require('fs');
const file = 'src/components/simulations/CustomBalloonsandStaticElectricity.jsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace('{onBack && }', '');
fs.writeFileSync(file, c);
