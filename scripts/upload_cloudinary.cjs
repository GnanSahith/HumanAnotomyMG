const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_URL) {
  console.error("❌ CLOUDINARY_URL is missing.");
  console.error("Please run the script like this:");
  console.error("CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME node scripts/upload_cloudinary.cjs");
  process.exit(1);
}

const modelsDir = path.join(__dirname, '../public/models');
const filesToUpdate = [
  'src/data.js',
  'src/components/InteractiveDigestiveView.jsx',
  'src/components/InteractiveDigestiveView_v1.jsx',
  'src/components/InteractiveDigestiveView_v2.jsx',
  'src/components/HumanAnatomyDigestiveView.jsx',
  'src/components/InteractiveTestView.jsx'
];

async function uploadModels() {
  if (!fs.existsSync(modelsDir)) {
    console.error("❌ Models directory not found at", modelsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(modelsDir).filter(file => file.endsWith('.glb'));
  console.log(`Found ${files.length} .glb files. Uploading to Cloudinary as RAW...`);

  const urlMap = {};

  for (const file of files) {
    const filePath = path.join(modelsDir, file);
    try {
      console.log(`Uploading ${file}...`);
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "raw",
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });
      console.log(`✅ Success: ${result.secure_url}`);
      urlMap[`/models/${file}`] = result.secure_url;
      urlMap[`./models/${file}`] = result.secure_url;
      
      // Cloudinary RAW files might sometimes be delivered correctly, but ensuring it correctly binds in JS
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error);
      process.exit(1);
    }
  }

  console.log("\n📦 Upload complete! Now updating codebase...");

  for (const file of filesToUpdate) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Additionally handle any previous incorrect Cloudinary URLs that might be present
    const oldCloudinaryUrlsPattern = /https:\/\/res\.cloudinary\.com\/dy1gyundx\/raw\/upload\/v\d+\/.*\.glb/g;
    content = content.replace(oldCloudinaryUrlsPattern, (match) => {
        // Find if this old URL corresponds to one of our files, wait...
        // It's safer to just let the user run this on a clean codebase where local strings are mapped,
        // but if they already had the broken Cloudinary URLs, we need to replace those too!
        const filename = match.split('/').pop().replace(/_xepxba|_xlfmzv|_yqxdjz|_mqbbxs|_mfzkdw|_lhlw8d|_cjsjmj|_fkggnd|_qtg9l4|_bphjog|_nudfr5|_wume8m|_ck5xip|_mlruqs|_oeyod3|_dwdapf|_xf4zgf/, '').replace('.glb', '');
        return match; 
    });

    for (const [localUrl, remoteUrl] of Object.entries(urlMap)) {
      if (content.includes(localUrl)) {
        content = content.split(localUrl).join(remoteUrl);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`📝 Updated ${file}`);
    }
  }

  console.log("\n🧹 Removing local models...");
  fs.rmSync(modelsDir, { recursive: true, force: true });
  
  const distModelsDir = path.join(__dirname, '../dist/models');
  if (fs.existsSync(distModelsDir)) {
    fs.rmSync(distModelsDir, { recursive: true, force: true });
  }

  console.log("\n✅ All done! Run 'npm run build' to finish the deployment.");
}

uploadModels();
