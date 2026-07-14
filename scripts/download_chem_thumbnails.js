import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../src/data/chemistrySimulations.json');
const thumbnailDir = path.join(__dirname, '../public/thumbnails');

if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else if (res.statusCode === 301 || res.statusCode === 302) {
         https.get(res.headers.location, (res2) => {
             res2.pipe(fs.createWriteStream(filepath))
               .on('error', reject)
               .once('close', () => resolve(filepath));
         }).on('error', reject);
      } else {
        res.resume();
        reject(new Error(`Status Code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function processSimulations() {
  for (let i = 0; i < data.length; i++) {
    const sim = data[i];
    
    if (sim.isNative && sim.thumbnail.includes('phet.colorado.edu')) {
      const topicName = sim.title.replace(' MG', '');
      const filename = `chem_thumb_${sim.id}.jpg`;
      const filepath = path.join(thumbnailDir, filename);
      
      const prompt = `A highly detailed glowing 3D visualization for chemistry topic: ${topicName}. Hyperrealistic 3D render with glowing neon lights, cinematic dark background, highly detailed sci-fi hologram style, educational visualization, no text.`;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
      
      let success = false;
      let retries = 3;
      
      while (!success && retries > 0) {
        console.log(`Downloading ${filename} (Retries left: ${retries})...`);
        try {
          await downloadImage(url, filepath);
          sim.thumbnail = `/thumbnails/${filename}`;
          success = true;
          console.log(`Successfully downloaded ${filename}`);
          
          fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4));
          
          await delay(2000);
        } catch (err) {
          console.error(`Failed to download ${filename}:`, err.message);
          retries--;
          if (retries > 0) {
            console.log("Waiting 3 seconds before retry...");
            await delay(3000);
          }
        }
      }
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4));
  console.log('Finished generating new chemistry thumbnails!');
}

processSimulations();
