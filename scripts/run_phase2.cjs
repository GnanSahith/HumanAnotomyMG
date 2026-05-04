const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

// Cloudinary Configuration
cloudinary.config({
  cloud_name: 'dy1gyundx',
  api_key: '741492315217567',
  api_secret: '6bqRyxofbE7m09dR8ikTJUeH1dw'
});

// Import the generated curriculum links
// Since it's an ES module, we will read and parse the file manually for this script.
const curriculumFile = fs.readFileSync(path.join(__dirname, '../src/data/mathCurriculum.js'), 'utf8');
const jsonStr = curriculumFile.replace('export const mathCurriculum = ', '').replace(/;$/, '');
const mathCurriculum = JSON.parse(jsonStr);

// Output mapping JSON
const SIMULATIONS_FILE = path.join(__dirname, '../src/data/mathSimulations.json');

async function scrapeTopicPage(url) {
    try {
        console.log(`\nScraping Topic Page: ${url}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        let materials = [];
        
        // Find all material links (e.g. href="/m/hkpdxysv")
        $('a[href^="/m/"]').each((index, element) => {
            const href = $(element).attr('href');
            const id = href.replace('/m/', '');
            // Attempt to get title if available nearby
            const title = $(element).text().trim() || $(element).parent().text().trim() || id;
            
            // Only add valid IDs
            if (id && id.length > 4 && !materials.find(m => m.id === id)) {
                materials.push({ id, title: title.replace(/\n/g, '').trim().substring(0, 50) });
            }
        });
        
        console.log(`Found ${materials.length} resources in this topic.`);
        return materials;
    } catch (e) {
        console.error(`Failed to scrape ${url}: ${e.message}`);
        return [];
    }
}

async function uploadToCloudinary(materialId) {
    const downloadUrl = `https://www.geogebra.org/material/download/format/file/id/${materialId}`;
    try {
        // Cloudinary allows uploading directly from remote URLs!
        const result = await cloudinary.uploader.upload(downloadUrl, {
            resource_type: "raw",
            public_id: `math_simulations/${materialId}.ggb`,
            format: "ggb"
        });
        return result.secure_url;
    } catch (e) {
        console.error(`Cloudinary Upload Failed for ${materialId}:`, e.message);
        return null;
    }
}

async function runAutomation() {
    console.log("=========================================");
    console.log("🚀 STARTING GEO-GEBRA AUTOMATION (PHASE 2)");
    console.log("=========================================\n");

    let allSimulationsMap = {};
    let totalFound = 0;
    let totalUploaded = 0;

    // Load existing mapping if any
    if (fs.existsSync(SIMULATIONS_FILE)) {
        allSimulationsMap = JSON.parse(fs.readFileSync(SIMULATIONS_FILE, 'utf8'));
        console.log(`Loaded ${Object.keys(allSimulationsMap).length} existing mapped simulations.`);
    }

    // Gather all topic URLs from our Phase 1 curriculum
    let topicUrls = [];
    for (const catKey of Object.keys(mathCurriculum)) {
        for (const grade of mathCurriculum[catKey].grades) {
            for (const topic of grade.topics) {
                topicUrls.push({ catId: catKey, topicId: topic.id, link: topic.link });
            }
        }
    }

    console.log(`Found ${topicUrls.length} total topic categories to scrape.\n`);

    // Run for all topics!
    const topicsToRun = topicUrls;
    
    for (const topicMeta of topicsToRun) {
        const materials = await scrapeTopicPage(topicMeta.link);
        totalFound += materials.length;

        for (const material of materials) {
            console.log(`--> Processing: ${material.id} (${material.title})`);
            
            if (allSimulationsMap[material.id]) {
                console.log(`    Already uploaded. Skipping.`);
                continue;
            }

            // Upload directly to Cloudinary
            console.log(`    Uploading to Cloudinary...`);
            const secureUrl = await uploadToCloudinary(material.id);
            
            if (secureUrl) {
                console.log(`    ✅ SUCCESS: ${secureUrl}`);
                allSimulationsMap[material.id] = {
                    title: material.title,
                    url: secureUrl,
                    parentTopic: topicMeta.topicId,
                    category: topicMeta.catId
                };
                totalUploaded++;
                
                // Save incrementally
                fs.writeFileSync(SIMULATIONS_FILE, JSON.stringify(allSimulationsMap, null, 2));
            }

            // Sleep for 1 second to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log("\n=========================================");
    console.log("🎉 PHASE 2 AUTOMATION COMPLETE");
    console.log(`Total Topics Scraped: ${topicsToRun.length}`);
    console.log(`Total Materials Found: ${totalFound}`);
    console.log(`Total Successfully Uploaded: ${totalUploaded}`);
    console.log(`Mapping saved to: src/data/mathSimulations.json`);
    console.log("=========================================\n");
}

runAutomation();
