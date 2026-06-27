const fs = require('fs');
const path = require('path');

const chemSims = require('./src/data/chemistrySimulations.json');
const physSims = require('./src/data/physicsSimulations.json');

const chemNative = chemSims.filter(s => s.isNative).map(s => s.id);
const physNative = Object.values(physSims).filter(s => s.isNative).map(s => s.id);

console.log("Chem Native:", chemNative.length);
console.log("Phys Native:", physNative.length);
