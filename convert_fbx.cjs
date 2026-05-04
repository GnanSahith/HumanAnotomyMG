const convert = require('fbx2gltf');
convert('/Users/gnansahith/Downloads/GLB_FBX Files/Anus_01.fbx', 'public/models/Anus_01.glb', ['--khr-materials-unlit']).then(
  destPath => console.log('Successfully converted:', destPath),
  error => console.error('Error during conversion:', error)
);
