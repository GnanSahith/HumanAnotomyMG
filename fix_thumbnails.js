const fs = require('fs');
const path = './src/data/mathSimulations.json';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/A%20professional%20educational%20illustration/g, 'A%20highly%20detailed%20glowing%203D%20visualization');
data = data.replace(/%20Vector%20art%20style%2C%20flat%20colors%2C%20clean%20design%2C%20highly%20educational%2C%20no%20text\./g, '%20Hyperrealistic%203D%20render%20with%20glowing%20neon%20lights%2C%20cinematic%20dark%20background%2C%20highly%20detailed%20sci-fi%20hologram%20style%2C%20educational%20visualization%2C%20no%20text.');

fs.writeFileSync(path, data);
console.log('Replaced thumbnail prompts in mathSimulations.json');
