const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const specificPrompts = {
    'phys_10_mg': 'A glowing neon 3D bell curve and scatter plot data visualization, statistics, cinematic dark background, glowing orange and blue',
    'phys_12_mg': 'A glowing neon mechanical spring attached to a weight, stretching and compressing, cinematic dark background, glowing orange and blue forces and displacement arrows',
    'phys_13_mg': 'Multiple glowing neon springs with heavy metal weights hanging from them, oscillating up and down, cinematic dark background, glowing orange and blue',
    'phys_14_mg': 'Glowing neon atoms transitioning from a structured solid crystal lattice into a chaotic floating gas, cinematic dark background, glowing orange and blue heat energy',
    'phys_15_mg': 'Glowing neon water molecules inside a sci-fi beaker, vibrating with heat energy, cinematic dark background, glowing orange and blue',
    'phys_16_mg': 'A glowing neon sealed pressure chamber filled with rapidly moving gas particles bouncing off walls, a heavy piston compressing them, cinematic dark background, glowing orange and blue',
    'phys_18_mg': 'A glowing neon mechanical turbine converting heat energy into electrical power, cinematic dark background, glowing orange and blue energy beams',
    'phys_19_mg': 'A glowing neon intense star emitting a visible spectrum of light, with a graph curve showing thermal radiation, cinematic dark background, glowing orange and blue',
    'phys_20_mg': 'A glowing neon vibrating physical string forming sine waves with a mechanical oscillator at the end, cinematic dark background, glowing orange and blue',
    'phys_21_mg': 'Glowing neon circular ripples from two point sources overlapping and creating an interference pattern, cinematic dark background, glowing orange and blue water waves',
    'phys_22_mg': 'Glowing neon sound wave compressions and rarefactions traveling through a tube from a vibrating speaker cone, cinematic dark background, glowing orange and blue',
    'phys_23_mg': 'A glowing neon complex standing wave pattern on a vibrating plate, showing distinct nodal lines, cinematic dark background, glowing orange and blue',
    'phys_24_mg': 'A glowing neon sequence of multiple sine waves adding up together to form a complex square wave, cinematic dark background, glowing orange and blue',
    'phys_30_mg': 'A glowing neon futuristic electrical circuit with a battery, resistor, and glowing current flow, cinematic dark background, glowing orange and blue voltage indicators',
    'phys_32_mg': 'A glowing neon human figure accumulating static electricity charges and discharging a bright lightning spark from a finger, cinematic dark background, glowing orange and blue',
    'phys_33_mg': 'Two glowing neon parallel conductive plates separated by a gap, storing electrical charge with a strong electric field between them, cinematic dark background, glowing orange and blue',
    'phys_34_mg': 'A glowing neon cross-section of a wire showing electrons colliding with atoms as they flow, creating electrical resistance, cinematic dark background, glowing orange and blue',
    'phys_38_mg': 'A glowing neon photon of light striking a molecular bond, causing the molecule to vibrate and absorb energy, cinematic dark background, glowing orange and blue',
    'phys_39_mg': 'A glowing neon beam of alpha particles shooting at a thin gold foil, with particles deflecting off a heavy central nucleus, cinematic dark background, glowing orange and blue',
    'phys_40_mg': 'A glowing neon Bohr model of an atom, with an electron orbiting a central proton and emitting a photon of light as it changes energy levels, cinematic dark background, glowing orange and blue',
    'phys_41_mg': 'Glowing neon light rays hitting a metallic surface, causing highly energetic electrons to be ejected from the metal, cinematic dark background, glowing orange and blue',
    'phys_42_mg': 'A glowing neon ruby rod laser emitting a powerful, concentrated beam of coherent red light bouncing between mirrors, cinematic dark background, glowing orange and blue',
    'phys_43_mg': 'A glowing neon glass tube shaped like a physics symbol, filled with glowing excited gas atoms emitting bright colorful light, cinematic dark background, glowing orange and blue',
    'phys_44_mg': 'A glowing neon microwave oven chamber with visible electromagnetic standing waves heating up molecules inside, cinematic dark background, glowing orange and blue',
    'phys_45_mg': 'A glowing neon futuristic medical MRI scanner using a strong magnetic field to image the human brain, cinematic dark background, glowing orange and blue'
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
    let data = JSON.parse(fs.readFileSync('src/data/physicsSimulations.json', 'utf8'));
    
    let updatedCount = 0;
    for (const key of Object.keys(specificPrompts)) {
        const filename = `phys_thumb_${key.replace(/-/g, '_')}_gen.jpg`;
        const dest = path.join(__dirname, 'public/thumbnails', filename);
        
        // Skip if we already successfully downloaded it (i.e. size is good and json is updated)
        let alreadyExists = false;
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000 && data[key].thumbnail.includes(filename)) {
            console.log(`Skipping ${key}, already generated.`);
            continue;
        }

        const promptText = specificPrompts[key];
        const fullPrompt = `${promptText}. Highly detailed, 3D render, photorealistic, professional lighting, cinematic, educational science illustration.`;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=800&height=450&nologo=true&seed=${Math.floor(Math.random() * 10000)}&model=flux`;
        
        console.log(`Downloading ${key}...`);
        try {
            await downloadImage(url, dest);
            
            // Check size
            const stats = fs.statSync(dest);
            if (stats.size > 1000) {
                // Update JSON immediately
                data = JSON.parse(fs.readFileSync('src/data/physicsSimulations.json', 'utf8'));
                data[key].thumbnail = `/thumbnails/${filename}`;
                fs.writeFileSync('src/data/physicsSimulations.json', JSON.stringify(data, null, 4));
                console.log(`Success: ${filename}`);
                updatedCount++;
                
                // Commit and deploy every 5 images
                if (updatedCount % 5 === 0) {
                    console.log('Committing and deploying intermediate batch...');
                    execSync('git add public/thumbnails/*.jpg src/data/physicsSimulations.json');
                    execSync('git commit -m "chore: incrementally update specific thumbnails"');
                    execSync('npx vercel deploy --prod --yes');
                    console.log('Deployed intermediate batch.');
                }
            } else {
                console.error(`File is empty: ${filename}`);
            }
            // Delay to avoid 429
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error(`Failed ${key}:`, e.message);
        }
    }
    
    // Final commit and deploy
    console.log('Final commit and deploy...');
    try {
        execSync('git add public/thumbnails/*.jpg src/data/physicsSimulations.json');
        execSync('git commit -m "chore: finish updating specific thumbnails"');
        execSync('npx vercel deploy --prod --yes');
    } catch(e) {}
    console.log('All done!');
}

main();
