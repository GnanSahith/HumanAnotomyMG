import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../src/data/mathSimulations.json');
const thumbnailDir = path.join(__dirname, '../public/thumbnails/math');

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
      } else {
        res.resume();
        reject(new Error(`Status Code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function processSimulations() {
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const sim = data[key];
    
    // Only process if it's still a pollinations.ai URL
    if (sim.thumbnail && sim.thumbnail.startsWith('https://image.pollinations.ai')) {
      const filename = `math_thumb_${key}.jpg`;
      const filepath = path.join(thumbnailDir, filename);
      
      let success = false;
      let retries = 3;
      
      while (!success && retries > 0) {
        console.log(`Downloading ${filename} (Retries left: ${retries})...`);
        try {
          await downloadImage(sim.thumbnail, filepath);
          sim.thumbnail = `/thumbnails/math/${filename}`;
          success = true;
          console.log(`Successfully downloaded ${filename}`);
          
          // Save incrementally just in case
          fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
          
          // Wait 3 seconds to avoid rate limiting
          await delay(3000); 
        } catch (err) {
          console.error(`Failed to download ${filename}:`, err.message);
          retries--;
          if (retries > 0) {
            console.log("Waiting 5 seconds before retry...");
            await delay(5000);
          }
        }
      }
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log('Finished updating mathSimulations.json with local paths!');
}

processSimulations();
