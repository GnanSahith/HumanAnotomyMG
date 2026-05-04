import fs from 'fs';
import path from 'path';
import { Document, NodeIO } from '@gltf-transform/core';

const ORGAN_COLORS = {
    'Liver': [0.55, 0.15, 0.12, 1.0],
    'Stomach': [0.85, 0.45, 0.4, 1.0],
    'Gallbladder': [0.4, 0.6, 0.3, 1.0],
    'Small_intestine': [0.8, 0.6, 0.5, 1.0],
    'Large_intestine': [0.7, 0.5, 0.4, 1.0],
    'Pancreas': [0.85, 0.75, 0.6, 1.0],
    'Mouth': [0.9, 0.3, 0.35, 1.0],
    'Esophagus': [0.8, 0.4, 0.4, 1.0],
    'Anus': [0.6, 0.25, 0.25, 1.0]
};

async function fixColors() {
    const io = new NodeIO();
    const modelsDir = path.join(process.cwd(), 'public/models');
    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb') && f.includes('_01') && !f.includes('Digestive System_01'));

    for (const file of files) {
        try {
            console.log(`Processing ${file}...`);
            const filePath = path.join(modelsDir, file);
            const doc = await io.read(filePath);
            
            // Determine name
            const baseName = file.replace('_01.glb', '').replace(/ /g, '_');
            const color = ORGAN_COLORS[baseName] || [0.85, 0.35, 0.3, 1.0];
            
            const materials = doc.getRoot().listMaterials();
            for (const mat of materials) {
                mat.setBaseColorFactor(color);
                mat.setRoughnessFactor(0.45);
                mat.setMetallicFactor(0.1);
            }
            
            await io.write(filePath, doc);
            console.log(`Fixed color for ${file}`);
        } catch (e) {
            console.error(`Failed on ${file}:`, e);
        }
    }
}

fixColors().catch(console.error);
