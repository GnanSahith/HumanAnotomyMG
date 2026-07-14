const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const specificPrompts = {
    '5': 'A glowing neon beam balance weighing different objects, cinematic dark background, glowing orange and blue physical forces',
    '9': 'A glowing neon balloon rubbing against a surface, showing positive and negative static electrical charges transferring, cinematic dark background, glowing orange and blue',
    '13': 'A glowing neon intense star emitting a visible spectrum of light, with a graph curve showing thermal radiation, cinematic dark background, glowing orange and blue',
    '27': 'Two glowing neon point charges interacting with a visible electric force field between them, cinematic dark background, glowing orange and blue',
    '31': 'Glowing neon particles of different gases mixing together randomly in a futuristic chamber, cinematic dark background, glowing orange and blue',
    '33': 'A glowing neon mechanical turbine converting heat energy into electrical power, cinematic dark background, glowing orange and blue energy beams',
    '35': 'A glowing neon sequence of multiple sine waves adding up together to form a complex square wave, cinematic dark background, glowing orange and blue',
    '37': 'A glowing neon sealed pressure chamber filled with rapidly moving gas particles bouncing off walls, a heavy piston compressing them, cinematic dark background, glowing orange and blue',
    '41': 'A glowing neon atomic nucleus showing different numbers of neutrons and protons on a high-tech scale, cinematic dark background, glowing orange and blue',
    '43': 'Glowing neon molecules passing through a futuristic biological cell membrane with transport proteins, cinematic dark background, glowing orange and blue',
    '45': 'A glowing neon Bohr model of an atom, with an electron orbiting a central proton and emitting a photon of light as it changes energy levels, cinematic dark background, glowing orange and blue',
    '47': 'A glowing neon volumetric flask filled with a highly concentrated solution of glowing solute particles, cinematic dark background, glowing orange and blue',
    '49': 'A glowing neon polar molecule showing an electron cloud distortion and an electric dipole moment arrow, cinematic dark background, glowing orange and blue',
    '51': 'A glowing neon 3D molecular structure showing VSEPR theory geometries like tetrahedral and trigonal planar, cinematic dark background, glowing orange and blue',
    '53': 'A simple glowing neon 3D molecular geometry, visualizing atomic bonds and electron pairs, cinematic dark background, glowing orange and blue',
    '55': 'A glowing neon photon of light striking a molecular bond, causing the molecule to vibrate and absorb energy, cinematic dark background, glowing orange and blue',
    '57': 'A glowing neon logarithmic pH scale showing acidic to basic solutions with glowing indicator colors, cinematic dark background, glowing orange and blue',
    '59': 'A glowing neon beaker measuring the pH of a solution with a futuristic digital meter, cinematic dark background, glowing orange and blue',
    '61': 'A glowing neon superposition state of a coin spinning in a quantum state, probability waves, cinematic dark background, glowing orange and blue',
    '63': 'A glowing neon quantum wave function collapsing into a single state upon measurement, cinematic dark background, glowing orange and blue',
    '65': 'A glowing neon chemical equation showing molecular reactants assembling into new products, cinematic dark background, glowing orange and blue',
    '67': 'A glowing neon beam of alpha particles shooting at a thin gold foil, with particles deflecting off a heavy central nucleus, cinematic dark background, glowing orange and blue',
    '69': 'Glowing neon atoms transitioning from a structured solid crystal lattice into a chaotic floating gas, cinematic dark background, glowing orange and blue heat energy',
    '71': 'Glowing neon water molecules inside a sci-fi beaker, vibrating with heat energy, cinematic dark background, glowing orange and blue',
    '73': 'A glowing neon vibrating physical string forming sine waves with a mechanical oscillator at the end, cinematic dark background, glowing orange and blue'
};

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                return reject(new Error(`Status: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function main() {
    let data = JSON.parse(fs.readFileSync('src/data/chemistrySimulations.json', 'utf8'));
    
    let updatedCount = 0;
    for (const key of Object.keys(specificPrompts)) {
        if (!data[key]) continue;
        const titleSlug = data[key].title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `chem_thumb_${titleSlug}_gen.jpg`;
        const dest = path.join(__dirname, 'public/thumbnails', filename);

        // Skip if already downloaded
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000 && data[key].thumbnail.includes(filename)) {
            console.log(`Skipping ${key}, already generated.`);
            continue;
        }

        const promptText = specificPrompts[key];
        const fullPrompt = `${promptText}. Highly detailed, 3D render, photorealistic, professional lighting, cinematic, educational science illustration.`;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=800&height=450&nologo=true&seed=${Math.floor(Math.random() * 10000)}&model=flux`;
        
        console.log(`Downloading ${data[key].title}...`);
        try {
            await downloadImage(url, dest);
            
            // Check size
            const stats = fs.statSync(dest);
            if (stats.size > 1000) {
                data = JSON.parse(fs.readFileSync('src/data/chemistrySimulations.json', 'utf8'));
                data[key].thumbnail = `/thumbnails/${filename}`;
                fs.writeFileSync('src/data/chemistrySimulations.json', JSON.stringify(data, null, 4));
                console.log(`Success: ${filename}`);
                updatedCount++;
                
                // Commit and deploy every 5 images
                if (updatedCount % 5 === 0) {
                    console.log('Committing and deploying intermediate batch...');
                    execSync('git add public/thumbnails/*.jpg src/data/chemistrySimulations.json');
                    execSync('git commit -m "chore: incrementally update chemistry thumbnails"');
                    execSync('npx vercel deploy --prod --yes');
                    console.log('Deployed intermediate batch.');
                }
            } else {
                console.error(`File is empty: ${filename}`);
            }
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error(`Failed ${data[key].title}:`, e.message);
        }
    }
    
    // Final commit and deploy
    console.log('Final commit and deploy...');
    try {
        execSync('git add public/thumbnails/*.jpg src/data/chemistrySimulations.json');
        execSync('git commit -m "chore: finish updating chemistry thumbnails"');
        execSync('npx vercel deploy --prod --yes');
    } catch(e) {}
    console.log('All done!');
}

main();
