---
description: How to correctly import and configure new 3D anatomy models into the Human Anatomy app with interactive dragging physics
---
# Anatomy App 3D Model Preset Configuration

When processing new anatomy files (usually `.fbx` or `.glb` exports) to the Human Anatomy Portable Web App, **always use the explicitly established "Flat Topology" setup** to ensure flawless physics performance, avoid WebGL memory/context crash issues (`Context Lost`), and seamlessly support dragging regardless of internal scaling.

## Step 1: Geometry "Flat Topology" Extraction (Crucial for WebGL/Physics)
New files often map to raw FBX export conversions (`scale: 0.01` root nodes, -90 degree Y-up Z-up translations, nested skeleton matrices, `SkinnedMesh` nodes). Direct `attach()` DOM-level manipulation of these hierarchies completely breaks WebGL Contexts and geometry logic.

**DO THIS:** Automatically execute a `traverse` inside the `<model-viewer>` or `InteractiveDigestiveView`'s `useMemo` scene clone to bake coordinate matrices down into raw `THREE.Mesh` vertices:

```javascript
const ownScene = React.useMemo(() => {
    scene.updateMatrixWorld(true);
    const clone = new THREE.Group();
    scene.traverse((child) => {
        if (child.isMesh) {
            // Flatten 0.01 scaling multipliers and structural skeletons directly into clean vertex coordinates
            const geometry = child.geometry.clone();
            geometry.applyMatrix4(child.matrixWorld);
            
            // Re-Align Mesh pivot precisely onto the mathematical centroid to stabilize expansion/zoom scale physics 
            geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            geometry.boundingBox.getCenter(center);
            geometry.translate(-center.x, -center.y, -center.z);

            const getMat = (m) => { const c = m.clone(); c.emissiveIntensity = 0; return c; };
            const mat = Array.isArray(child.material) ? child.material.map(getMat) : getMat(child.material);
            
            const cleanMesh = new THREE.Mesh(geometry, mat);
            // Re-align the flattened geometry mesh coordinates into global position accurately
            cleanMesh.position.copy(center); 
            cleanMesh.name = child.name;
            cleanMesh.userData = { ...child.userData };
            clone.add(cleanMesh);
        }
    });
    return clone;
}, [scene]);
```

## Step 2: Unclamped Mouse Distance Ratio Calculation
Since the model is microscopically flattened down exactly correctly to `0.01` scale metrics natively without arbitrary wrapper nodes boosting its numbers, standard `dist` mouse-camera logic with `Math.max(1)` limit bounds drastically overpowers the sensitivity by over 100x causing the organ to fly uncontrollably across the screen upon dragging.

**DO THIS:** Unlock the clamp and allow strict minimal ratio depths across the board.
```javascript
// MUST NOT have "dist = Math.max(1, ...)" anywhere.
// The distance tracking must drop all the way to 0.001 smoothly.
const dist = Math.max(0.001, camera.position.length() / 20);

// Use typical addScaledVector relative world-space translation
targetWorld.current
    .copy(ds.originWorldPos)
    .addScaledVector(right, dx / (50 / dist))
    .addScaledVector(up,   -dy / (50 / dist));
```

## Step 3: Hover Expansion Logic
With flat topology centers dynamically baked (Step 1), `scaleVec.lerp()` expands the individual organ meshes evenly outward. DO NOT artificially inject dynamic `.userData.origScale` dependencies in updates, just simply use `1.0` native baseline.

```javascript
ownScene.traverse((child) => {
    if (!child.isMesh) return;
    const active = child === hoveredRef.current || child === dragState.current?.mesh;
    scaleVec.current.setScalar(active ? 1.09 : 1.0);
    child.scale.lerp(scaleVec.current, Math.min(delta * 8, 1));
});
```

Using this preset methodology eliminates 100% of hierarchy errors, texture glitches, NaN collision crash cases, missing scales, and sensitivity discrepancies over any uncleaned generic FBX drops.
