import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, useFBX } from '@react-three/drei';

const _projVec = new THREE.Vector3();

export function InteractiveSystemScene({ modelSrc, onSelectPart, setIsDragging, labelRef, activeSystem }) {
    if (modelSrc && modelSrc.endsWith('.fbx')) {
        return <FBXLoaderWrapper modelSrc={modelSrc} onSelectPart={onSelectPart} setIsDragging={setIsDragging} labelRef={labelRef} activeSystem={activeSystem} />;
    }
    return <GLTFLoaderWrapper modelSrc={modelSrc || 'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777577834/Digestive_System_01.glb'} onSelectPart={onSelectPart} setIsDragging={setIsDragging} labelRef={labelRef} activeSystem={activeSystem} />;
}

function FBXLoaderWrapper({ modelSrc, onSelectPart, setIsDragging, labelRef, activeSystem }) {
    const scene = useFBX(modelSrc);
    return <InteractiveSceneCore scene={scene} onSelectPart={onSelectPart} setIsDragging={setIsDragging} labelRef={labelRef} activeSystem={activeSystem} />;
}

function GLTFLoaderWrapper({ modelSrc, onSelectPart, setIsDragging, labelRef, activeSystem }) {
    const { scene } = useGLTF(modelSrc);
    return <InteractiveSceneCore scene={scene} onSelectPart={onSelectPart} setIsDragging={setIsDragging} labelRef={labelRef} activeSystem={activeSystem} />;
}

function InteractiveSceneCore({ scene, onSelectPart, setIsDragging, labelRef, activeSystem }) {
    const { camera, size, controls } = useThree();

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

                // Fix generic mesh names from the 3D model
                let nodeName = child.name;
                if (nodeName.toLowerCase() === 'mesh') {
                    nodeName = 'Salivary_Glands';
                }

                const getMat = (m, childName = '') => { 
                    if (!m) return new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.85, metalness: 0.1 });
                    
                    let c;
                    if (m.isMeshStandardMaterial) {
                        c = m.clone();
                    } else {
                        // Upgrade legacy/FBX materials to Standard for consistent PBR look
                        c = new THREE.MeshStandardMaterial({
                            color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
                            map: m.map || null,
                            normalMap: m.normalMap || null,
                            emissiveMap: m.emissiveMap || null,
                            transparent: m.transparent || false,
                            opacity: m.opacity !== undefined ? m.opacity : 1,
                            side: m.side !== undefined ? m.side : THREE.FrontSide
                        });
                    }
                    
                    c.roughness = 0.85; 
                    c.metalness = 0.1;
                    
                    // CRITICAL FBX FIXES to reveal original realistic textures:
                    // 1. Disable vertex colors. FBX exporters frequently export empty vertex color arrays as pure black, tinting the whole model black.
                    c.vertexColors = false; 
                    
                    // 2. Fix base color multiplication.
                    if (c.map) {
                        // If it has a texture map but the base color is black/very dark, it will tint the texture black!
                        // We must reset the base color to white so the authentic texture shines through naturally.
                        if (c.color && c.color.r < 0.1 && c.color.g < 0.1 && c.color.b < 0.1) {
                            c.color.setHex(0xffffff);
                        }
                    } else if (c.color && c.color.r < 0.05 && c.color.g < 0.05 && c.color.b < 0.05) {
                        // If it has NO texture map, and it is pitch black, it's a broken material export.
                        // We set it to a neutral light color so we can at least see the geometry shading.
                        c.color.setHex(0xdddddd);
                    }
                    
                    c.emissiveIntensity = 0; 
                    return c; 
                };

                let mat;
                if (!child.material) {
                    mat = getMat(null, nodeName);
                } else {
                    mat = Array.isArray(child.material) 
                        ? child.material.map(m => getMat(m, nodeName)) 
                        : getMat(child.material, nodeName);
                }
                
                const cleanMesh = new THREE.Mesh(geometry, mat);
                cleanMesh.position.copy(center);
                cleanMesh.name = nodeName;
                cleanMesh.userData = { ...child.userData };
                clone.add(cleanMesh);
            }
        });
        
        // Expose valid meshes for the Quiz challenge (universal)
        const validNames = [];
        clone.traverse(c => { if(c.isMesh) validNames.push(c.name); });
        window.activeValidMeshes = validNames;
        
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
            const createGlowMat = (m) => {
                const c = m.clone();
                c.emissive = new THREE.Color('#00e5ff');
                // Use a moderate emissive intensity so it tints the texture rather than blowing it out to pure white
                c.emissiveIntensity = 0.7; 
                return c;
            };
            const glow = Array.isArray(child.material)
                ? child.material.map(createGlowMat)
                : createGlowMat(child.material);
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
    const quizHighlightRef = useRef(null);

    useEffect(() => {
        const handleQuizHighlight = (e) => {
            const targetMeshName = e.detail;
            if (!targetMeshName) {
                if (quizHighlightRef.current) {
                    if (quizHighlightRef.current !== hoveredRef.current && (!dragState.current || quizHighlightRef.current !== dragState.current.mesh)) {
                        setGlow(quizHighlightRef.current, false);
                    }
                    quizHighlightRef.current = null;
                }
                return;
            }
            
            ownScene.traverse(child => {
                if (child.isMesh) {
                    if (child.name === targetMeshName) {
                        quizHighlightRef.current = child;
                        setGlow(child, true);
                    } else {
                        if (child !== hoveredRef.current && (!dragState.current || child !== dragState.current.mesh)) {
                            setGlow(child, false);
                        }
                    }
                }
            });
        };

        window.addEventListener('QUIZ_HIGHLIGHT_PART', handleQuizHighlight);
        return () => window.removeEventListener('QUIZ_HIGHLIGHT_PART', handleQuizHighlight);
    }, [ownScene, setGlow]);
    const downAt      = useRef({ x: 0, y: 0 });
    const targetWorld = useRef(new THREE.Vector3());
    const lerpWorld   = useRef(new THREE.Vector3());

    useFrame((state) => {
        const ds = dragState.current;
        let activeMesh = null;

        if (quizHighlightRef.current && !ds && controls) {
            // Breathing glow effect
            const time = state.clock.elapsedTime;
            // sine wave mapped from 0.0 to 1.0
            const pulse = (Math.sin(time * 3.0) + 1) / 2; 
            
            // Intensity pulses from 0.1 (almost no glow) to 0.4 (very subtle glow)
            const intensity = 0.1 + (0.4 - 0.1) * pulse;
            
            // Keep color constant deep cyan, no white at all
            const currentColor = new THREE.Color('#00e5ff');
            
            const updateMat = (m) => {
                if (m.emissive) m.emissive.copy(currentColor);
                if (m.emissiveIntensity !== undefined) m.emissiveIntensity = intensity;
            };

            if (Array.isArray(quizHighlightRef.current.material)) {
                quizHighlightRef.current.material.forEach(updateMat);
            } else if (quizHighlightRef.current.material) {
                updateMat(quizHighlightRef.current.material);
            }

            const center = new THREE.Vector3();
            if (quizHighlightRef.current.geometry.boundingBox) {
                quizHighlightRef.current.geometry.boundingBox.getCenter(center);
            }
            quizHighlightRef.current.localToWorld(center);
            
            // Slowly interpolate controls target to the organ center
            controls.target.lerp(center, 0.03);
            
            // Slowly zoom in
            const currentDist = camera.position.distanceTo(controls.target);
            const targetDist = 12; // Desired zoom distance
            if (currentDist > targetDist) {
                const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
                const newPos = controls.target.clone().add(dir.multiplyScalar(Math.max(targetDist, currentDist - 0.1)));
                camera.position.lerp(newPos, 0.05);
            }
            
            // Enable auto rotation slowly
            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.0;
        } else if (controls) {
            // Restore default when not highlighting
            controls.autoRotate = false;
        }

        if (ds) {
            lerpWorld.current.lerp(targetWorld.current, 0.4);
            ds.mesh.position.copy(lerpWorld.current);
            ds.mesh.updateMatrixWorld(); // Fixes the 1-frame tracking lag
            activeMesh = ds.mesh;

            if (ds.returning && ds.mesh.position.distanceTo(ds.originWorldPos) < 0.05) {
                ds.mesh.position.copy(ds.originWorldPos);
                ds.mesh.updateMatrixWorld();
                ds.origParent.attach(ds.mesh);
                setGlow(ds.mesh, false);
                setIsDragging(false);
                window.dispatchEvent(new CustomEvent('ORGAN_RELEASED'));
                dragState.current = null;
                activeMesh = hoveredRef.current || null;
            }
        } else if (hoveredRef.current) {
            activeMesh = hoveredRef.current;
        }

        if (labelRef?.current) {
            if (activeMesh) {
                _projVec.setFromMatrixPosition(activeMesh.matrixWorld).project(camera);
                const x = (_projVec.x * 0.5 + 0.5) * size.width;
                const y = (-(_projVec.y * 0.5) + 0.5) * size.height;
                labelRef.current.style.display = 'block';
                labelRef.current.style.transform = `translate(-50%, -150%) translate(${x}px, ${y}px)`;
                labelRef.current.textContent = (activeMesh.name || 'Unknown').replace(/_/g, ' ');
            } else {
                labelRef.current.style.display = 'none';
            }
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
            if (quizHighlightRef.current !== e.object) {
                setGlow(e.object, false);
            }
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
