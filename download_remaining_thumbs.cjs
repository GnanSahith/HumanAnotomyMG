const fs = require('fs');
const https = require('https');
const path = require('path');

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

async function processSimulations(file, prefix) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const isArray = Array.isArray(data);
    const iterable = isArray ? data : Object.keys(data);
    
    for (const item of iterable) {
        const sim = isArray ? item : data[item];
        const key = isArray ? sim.id : item;
        
        if (sim.isNative && sim.thumbnail.includes('phet.colorado.edu')) {
            const title = sim.title.replace(' MG', '').trim();
            const subject = prefix === 'chem_thumb' ? 'Chemistry' : 'Physics';
            
            // The supercharged prompt!
            const prompt = `A highly detailed sci-fi schematic diagram of ${title} (${subject}). Glowing neon UI elements in orange and blue, HUD style, cinematic dark background, technical diagram, high-tech educational visualization with text labels.`;
            
            // Note: pollinations flux model handles text very well!
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&nologo=true&seed=${Math.floor(Math.random() * 10000)}&model=flux`;
            
            const filename = `${prefix}_${key.replace('-', '_')}_gen.jpg`;
            const dest = path.join(__dirname, 'public/thumbnails', filename);
            
            console.log(`Downloading ${title}...`);
            try {
                await downloadImage(url, dest);
                sim.thumbnail = `/thumbnails/${filename}`;
                console.log(`Success: ${filename}`);
                // Small delay to prevent rate limits on pollinations
                await new Promise(r => setTimeout(r, 1500));
            } catch (e) {
                console.error(`Failed ${title}:`, e.message);
            }
        }
    }
    
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

async function main() {
    await processSimulations('src/data/physicsSimulations.json', 'phys_thumb');
    await processSimulations('src/data/chemistrySimulations.json', 'chem_thumb');
    console.log('All done!');
}

main();
