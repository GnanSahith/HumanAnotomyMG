const fs = require('fs');
const { execSync } = require('child_process');

const subjects = [
  { name: 'Physics', file: './src/data/physicsSimulations.json' },
  { name: 'Chemistry', file: './src/data/chemistrySimulations.json' },
  { name: 'Mathematics', file: './src/data/mathSimulations.json' }
];

const tempDir = './public/simulations_export';
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

for (const sub of subjects) {
    let csvContent = "Simulation Name\n";
    if (fs.existsSync(sub.file)) {
        const data = JSON.parse(fs.readFileSync(sub.file, 'utf8'));
        for (const key of Object.keys(data)) {
            if (data[key] && data[key].title) {
                const title = data[key].title.replace(/"/g, '""');
                csvContent += `"${title}"\n`;
            }
        }
    }
    fs.writeFileSync(`${tempDir}/${sub.name}.csv`, csvContent);
}

// Zip them up
execSync(`cd ./public/simulations_export && zip -r ../simulations.zip ./*.csv`);
// Clean up the folder
execSync(`rm -rf ./public/simulations_export`);
console.log('Successfully created simulations.zip in public folder.');
