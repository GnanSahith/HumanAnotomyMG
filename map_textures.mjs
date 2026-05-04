import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';

async function copyTextures() {
    console.log("Ripping original textures from Master model...");
    const io = new NodeIO();
    const masterPath = path.join(process.cwd(), 'public/models/Digestive System_01.glb');
    const master = await io.read(masterPath);
    
    // Create a robust map mapping each organ name to its exact graphic material layout
    const textureMap = {};
    const nodes = master.getRoot().listNodes();
    for (const node of nodes) {
        const mesh = node.getMesh();
        if (mesh && mesh.listPrimitives().length > 0) {
            const mat = mesh.listPrimitives()[0].getMaterial();
            if (mat) {
                const tex = mat.getBaseColorTexture();
                textureMap[node.getName()] = { 
                    image: tex ? tex.getImage() : null, 
                    mimeType: tex ? tex.getMimeType() : null, 
                    mat: mat 
                };
            }
        }
    }

    const modelsDir = path.join(process.cwd(), 'public/models');
    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb') && f.includes('_01') && !f.includes('Digestive System'));

    for (const file of files) {
        try {
            const filePath = path.join(modelsDir, file);
            const doc = await io.read(filePath);
            
            // Re-bind the exact node name from the FBX base convention
            const baseName = file.replace('_01.glb', '').replace(/ /g, '_');
            const data = textureMap[baseName] || textureMap['Liver']; // Robust fallback
            
            if (data && data.mat) {
                let newTex = null;
                // Only embed a texture if the original actually had one
                if (data.image) {
                    newTex = doc.createTexture('restored_pbr_tex')
                        .setImage(data.image)
                        .setMimeType(data.mimeType);
                }
                
                const materials = doc.getRoot().listMaterials();
                for (const mat of materials) {
                    // Reset to pure white light and rely exclusively on the PBR graphic maps
                    mat.setBaseColorFactor(data.mat.getBaseColorFactor()); 
                    if (newTex) {
                        mat.setBaseColorTexture(newTex);
                    }
                    mat.setRoughnessFactor(data.mat.getRoughnessFactor());
                    mat.setMetallicFactor(data.mat.getMetallicFactor());
                }
                
                await io.write(filePath, doc);
                console.log(`Successfully cloned master aesthetic into -> ${file}`);
            }
        } catch (e) {
            console.error(`Error resolving mapping for ${file}:`, e);
        }
    }
    console.log("All PBR textures mapped perfectly.");
}
copyTextures().catch(console.error);
