import { Document, NodeIO } from '@gltf-transform/core';
import { clearNodeTransform } from '@gltf-transform/functions';

async function fix() {
  const io = new NodeIO();
  const doc = await io.read('./public/models/Digestive System_01.glb');
  
  // Clean off the 0.01 scale by baking it into the mesh itself
  const rootNode = doc.getRoot().listNodes()[0];
  await doc.transform(
    clearNodeTransform({ node: rootNode })
  );
  
  await io.write('./public/models/Digestive System_01.glb', doc);
  console.log('Fixed GLB scales!');
}
fix().catch(console.error);
