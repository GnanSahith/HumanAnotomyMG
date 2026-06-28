import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, useFBX } from '@react-three/drei';

const _projVec = new THREE.Vector3();

export function InteractiveSystemScene({ modelSrc, onSelectPart, setIsDragging, labelRef }) {
    if (modelSrc && modelSrc.endsWith('.fbx')) {
        return <FBXLoaderWrapper modelSrc={modelSrc} onSelectPart={onSelectPart} setIsDragging={setIsDragging} labelRef={labelRef} />;
    }
    return <GLTFLoaderWrapper modelSrc={modelSrc || 'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777577834/Digestive_System_01.glb'} onSelectPart={onSelectPart} setIsDragging={setIsDragging} labelRef={labelRef} />;
}

function FBXLoaderWrapper({ modelSrc, onSelectPart, setIsDragging, labelRef }) {
    const scene = useFBX(modelSrc);
    return <InteractiveSceneCore scene={scene} onSelectPart={onSelectPart} setIsDragging={setIsDragging} labelRef={labelRef} />;
}

function GLTFLoaderWrapper({ modelSrc, onSelectPart, setIsDragging, labelRef }) {
    const { scene } = useGLTF(modelSrc);
    return <InteractiveSceneCore scene={scene} onSelectPart={onSelectPart} setIsDragging={setIsDragging} labelRef={labelRef} />;
}

function InteractiveSceneCore({ scene, onSelectPart, setIsDragging, labelRef }) {
    const { camera, size } = useThree();

    const ownScene = React.useMemo(() => {
        scene.updateMatrixWorld(true);
        const clone = new THREE.Group();
        scene.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const geometry = child.geometry.clone();
                geometry.applyMatrix4(child.matrixWorld);
                
                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox.getCenter(center);
                geometry.translate(-center.x, -center.y, -center.z);

                const getMat = (m, childName = '') => { 
                    const n = childName.toLowerCase();
                    let hexColor = 0xdddddd; // default neutral
                    
                    if (n.includes('heart') || n.includes('arter')) hexColor = 0xe63946; // Bright red
                    else if (n.includes('vein')) hexColor = 0x457b9d; // Blue
                    else if (n.includes('brain') || n.includes('nerv') || n.includes('lobe')) hexColor = 0xf1faee; // Soft neural
                    else if (n.includes('lung') || n.includes('bronch') || n.includes('alveol')) hexColor = 0xffb5a7; // Soft lung pink
                    else if (n.includes('diaphragm') || n.includes('muscle')) hexColor = 0xe07a5f; // Muscle red
                    else if (n.includes('larynx') || n.includes('trachea')) hexColor = 0xa8dadc; // Cartilage light blue
                    else if (n.includes('pharynx') || n.includes('nose') || n.includes('mouth')) hexColor = 0xffcad4; // Tissue pink
                    else if (n.includes('thyroid')) hexColor = 0xf4a261; // Glandular

                    if (!m) return new THREE.MeshStandardMaterial({ color: hexColor, roughness: 0.85, metalness: 0.1 });
                    
                    let c;
                    if (m.isMeshStandardMaterial) {
                        c = m.clone();
                        // If color is pure white or missing, override it
                        if (c.color.getHex() === 0xffffff || c.color.getHex() === 0x000000) {
                            c.color.setHex(hexColor);
                        }
                    } else {
                        c = new THREE.MeshStandardMaterial({
                            color: hexColor, // Force assigned color
                            transparent: m.transparent || false,
                            opacity: m.opacity !== undefined ? m.opacity : 1,
                            side: m.side !== undefined ? m.side : THREE.FrontSide
                        });
                    }
                    
                    c.roughness = 0.85; 
                    c.metalness = 0.1;
                    c.emissiveIntensity = 0; 
                    return c; 
                };

                let mat;
                if (!child.material) {
                    mat = getMat(null, child.name);
                } else {
                    mat = Array.isArray(child.material) 
                        ? child.material.map(m => getMat(m, child.name)) 
                        : getMat(child.material, child.name);
                }
                
                const cleanMesh = new THREE.Mesh(geometry, mat);
                cleanMesh.position.copy(center);
                cleanMesh.name = child.name;
                cleanMesh.userData = { ...child.userData };
                clone.add(cleanMesh);
            }
        });
        
        // Expose valid meshes for the Quiz challenge
        const validNames = [];
        clone.traverse(c => { if(c.isMesh) validNames.push(c.name); });
        window.digestiveValidMeshes = validNames;
        
        return clone;
    }, [scene]);

    useEffect(() => {
        return () => {
            if (ownScene) {
                ownScene.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => m.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            }
        };
    }, [ownScene]);

    const meshMats = React.useMemo(() => {
        const map = new Map();
        ownScene.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const orig = Array.isArray(child.material)
                ? child.material.map(m => m.clone())
                : child.material.clone();
            const glow = Array.isArray(child.material)
                ? child.material.map(m => { const c = m.clone(); c.emissive = new THREE.Color('#0a84ff'); c.emissiveIntensity = 0.6; return c; })
                : (() => { const c = child.material.clone(); c.emissive = new THREE.Color('#0a84ff'); c.emissiveIntensity = 0.6; return c; })();
            map.set(child.uuid, { orig, glow });
        });
        return map;
    }, [ownScene]);

    const setGlow = useCallback((mesh, isGlow) => {
        if (!mesh) return;
        const mats = meshMats.get(mesh.uuid);
        if (mats) mesh.material = isGlow ? mats.glow : mats.orig;
    }, [meshMats]);

    const hoveredRef  = useRef(null);
    const dragState   = useRef(null);
    const downAt      = useRef({ x: 0, y: 0 });
    const targetWorld = useRef(new THREE.Vector3());
    const lerpWorld   = useRef(new THREE.Vector3());

    useFrame(() => {
        const ds = dragState.current;
        if (!ds) return;

        lerpWorld.current.lerp(targetWorld.current, 0.2);
        ds.mesh.position.copy(lerpWorld.current);

        if (labelRef?.current) {
            _projVec.copy(lerpWorld.current).project(camera);
            const x = (_projVec.x * 0.5 + 0.5) * size.width;
            const y = (-(_projVec.y * 0.5) + 0.5) * size.height;
            labelRef.current.style.display = 'block';
            labelRef.current.style.transform = `translate(-50%, -150%) translate(${x}px, ${y}px)`;
            labelRef.current.textContent = (ds.mesh.name || 'Unknown').replace(/_/g, ' ');
        }

        if (ds.returning && ds.mesh.position.distanceTo(ds.originWorldPos) < 0.05) {
            ds.mesh.position.copy(ds.originWorldPos);
            ds.origParent.attach(ds.mesh);
            setGlow(ds.mesh, false);
            setIsDragging(false);
            if (labelRef?.current) labelRef.current.style.display = 'none';
            window.dispatchEvent(new CustomEvent('ORGAN_RELEASED'));
            dragState.current = null;
        }
    });

    const onPointerOver = useCallback((e) => {
        e.stopPropagation();
        if (dragState.current) return;
        hoveredRef.current = e.object;
        setGlow(e.object, true);
        document.body.style.cursor = 'grab';
    }, [setGlow]);

    const onPointerOut = useCallback((e) => {
        e.stopPropagation();
        if (dragState.current) return;
        if (hoveredRef.current === e.object) {
            setGlow(e.object, false);
            hoveredRef.current = null;
            document.body.style.cursor = 'auto';
        }
    }, [setGlow]);

    const onPointerDown = useCallback((e) => {
        e.stopPropagation();
        const mesh = e.object;
        if (!mesh?.isMesh) return;

        const origParent = mesh.parent;
        ownScene.attach(mesh);
        const worldPos = mesh.position.clone();

        targetWorld.current.copy(worldPos);
        lerpWorld.current.copy(worldPos);
        dragState.current = { mesh, origParent, originWorldPos: worldPos, returning: false };

        downAt.current = { x: e.clientX, y: e.clientY };
        setGlow(mesh, true);
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
        window.dispatchEvent(new CustomEvent('ORGAN_HELD', { detail: (mesh.name || 'Unknown').replace(/_/g, ' ') }));
        e.target.setPointerCapture(e.pointerId);
    }, [ownScene, setGlow, setIsDragging]);

    const onPointerMove = useCallback((e) => {
        const ds = dragState.current;
        if (!ds || ds.returning) return;

        const dx = e.clientX - downAt.current.x;
        const dy = e.clientY - downAt.current.y;

        const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up      = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const dist = Math.max(0.001, camera.position.length() / 20);

        targetWorld.current
            .copy(ds.originWorldPos)
            .addScaledVector(right, dx / (50 / dist))
            .addScaledVector(up,   -dy / (50 / dist))
            .addScaledVector(forward, -0.7 * dist);
    }, [camera]);

    const onPointerUp = useCallback((e) => {
        const ds = dragState.current;
        if (!ds) return;
        const wasTap =
            Math.abs(e.clientX - downAt.current.x) < 5 &&
            Math.abs(e.clientY - downAt.current.y) < 5;
        if (wasTap && onSelectPart) onSelectPart((ds.mesh.name || 'Unknown Organ').replace(/_/g, ' '));
        targetWorld.current.copy(ds.originWorldPos);
        ds.returning = true;
        document.body.style.cursor = hoveredRef.current ? 'grab' : 'auto';
    }, [onSelectPart]);

    return (
        <primitive
            object={ownScene}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
        />
    );
}
