import { NodeIO } from '@gltf-transform/core';

async function extract() {
    const io = new NodeIO();
    const doc = await io.read('./public/models/Digestive System_01.glb');
    
    const materials = doc.getRoot().listMaterials();
    console.log(`Found ${materials.length} materials in Digestive System_01.glb`);
    for (const mat of materials) {
        console.log(`Material: ${mat.getName()}`);
        console.log(`  BaseColor:`, mat.getBaseColorFactor());
        console.log(`  Roughness:`, mat.getRoughnessFactor());
        console.log(`  Metallic:`, mat.getMetallicFactor());
        
        // Also get base color texture if it exists
        const tex = mat.getBaseColorTexture();
        if (tex) {
            console.log(`  Has BaseColorTexture: true`);
        }
    }
    
    // Check nodes for their names and materials
    const nodes = doc.getRoot().listNodes();
    console.log("\nNodes and their materials:");
    for (const node of nodes) {
        const mesh = node.getMesh();
        if (mesh) {
            const prims = mesh.listPrimitives();
            if (prims.length > 0) {
                const mat = prims[0].getMaterial();
                console.log(`Node: ${node.getName()} -> Material: ${mat ? mat.getName() : 'none'}`);
            }
        }
    }
}
extract().catch(console.error);
