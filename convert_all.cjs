const path = require('path');
const fs = require('fs');
const convert = require('fbx2gltf');

const srcDir = '/Users/gnansahith/Downloads/GLB_FBX Files';
const destDir = path.join(__dirname, 'public/models');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

(async () => {
  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith('.fbx')) {
      const name = path.basename(file, '.fbx');
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, name + '.glb');
      try {
        await convert(srcPath, destPath);
        console.log('Converted:', name);
      } catch (e) {
        console.error('Failed to convert:', name, e);
      }
    } else if (file === 'Digestive System_01.glb') {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      console.log('Copied:', file);
    }
  }
})();
