/**
 * InteractiveDigestiveView_v2.jsx
 *
 * VERSION 2 — Floating label tracks the organ in 3D space.
 *
 * Difference from v1:
 *   The organ name badge is NOT fixed to the top of the viewport.
 *   Instead it floats directly above the organ being hovered/dragged,
 *   updating its screen position every frame via direct DOM mutation
 *   inside useFrame (zero React re-renders per frame).
 *
 * How it works:
 *   1. A hidden <div ref={labelRef}> lives in the DOM above the Canvas.
 *   2. DigestiveScene receives labelRef and writes to it in useFrame:
 *        - Gets the active mesh's world position
 *        - Projects it to NDC → screen px via camera + canvas size
 *        - Updates labelRef.current.style.transform directly (no setState)
 *        - Updates labelRef.current.textContent when mesh changes
 *   3. The CSS pulse animation runs continuously in CSS — no JS needed.
 */

import React, { useState, Suspense, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
    useGLTF, OrbitControls, Environment, Bounds, Html, useProgress, Center
} from '@react-three/drei';
import { ArrowLeft, Info } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div style={{
                color: 'white', background: 'rgba(0,0,0,0.85)',
                padding: '10px 24px', borderRadius: '10px',
                fontSize: '16px', fontWeight: 'bold'
            }}>
                Loading… {progress.toFixed(0)}%
            </div>
        </Html>
    );
}

// Reusable temporary vector for projection math
const _projVec = new THREE.Vector3();

function DigestiveScene({ onSelectPart, setIsDragging, labelRef }) {
    const { camera, size } = useThree();
    const { scene } = useGLTF('https://res.cloudinary.com/dy1gyundx/raw/upload/v1777577834/Digestive_System_01.glb');

    const ownScene = React.useMemo(() => {
        scene.updateMatrixWorld(true);
        const clone = new THREE.Group();
        scene.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry.clone();
                geometry.applyMatrix4(child.matrixWorld);
                
                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox.getCenter(center);
                geometry.translate(-center.x, -center.y, -center.z);

                const getMat = (m) => { 
                    const c = m.clone(); 
                    if (c.isMeshStandardMaterial) {
                        c.roughness = 0.85; 
                        c.metalness = 0.1;
                    }
                    c.emissiveIntensity = 0; 
                    return c; 
                };
                const mat = Array.isArray(child.material) ? child.material.map(getMat) : getMat(child.material);
                
                const cleanMesh = new THREE.Mesh(geometry, mat);
                cleanMesh.position.copy(center);
                cleanMesh.name = child.name;
                cleanMesh.userData = { ...child.userData };
                clone.add(cleanMesh);
            }
        });
        return clone;
    }, [scene]);

    // EXTREMELY CRITICAL: Prevent WebGL Context Lost (VRAM Memory Leaks) by destroying the cloned geometries on unmount
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
            if (!child.isMesh) return;
            map.set(child.uuid,
                Array.isArray(child.material) ? child.material : [child.material]);
        });
        return map;
    }, [ownScene]);

    const glowColor  = useRef(new THREE.Color('#0a84ff'));
    const blackColor = useRef(new THREE.Color(0, 0, 0));
    const scaleVec   = useRef(new THREE.Vector3());
    const hoveredRef = useRef(null);
    const dragState  = useRef(null);
    const downAt     = useRef({ x: 0, y: 0 });
    const targetWorld = useRef(new THREE.Vector3());
    const lerpWorld   = useRef(new THREE.Vector3());
    // Track which mesh we last wrote to the label so we only update textContent on change
    const labelMeshRef = useRef(null);

    const setGlow = useCallback((mesh, on) => {
        const mats = meshMats.get(mesh?.uuid) || [];
        mats.forEach(m => {
            m.emissive.copy(on ? glowColor.current : blackColor.current);
            m.emissiveIntensity = on ? 0.9 : 0;
        });
    }, [meshMats]);

    useFrame((_, delta) => {
        // Scale pulse
        ownScene.traverse((child) => {
            if (!child.isMesh) return;
            const active = child === hoveredRef.current || child === dragState.current?.mesh;
            scaleVec.current.setScalar(active ? 1.09 : 1.0);
            child.scale.lerp(scaleVec.current, Math.min(delta * 8, 1));
        });

        const ds = dragState.current;
        if (ds) {
            if (ds.returning) {
                lerpWorld.current.lerp(ds.originWorldPos, Math.min(delta * 4, 1));
                ds.mesh.position.copy(lerpWorld.current);

                if (lerpWorld.current.distanceTo(ds.originWorldPos) < 0.01) {
                    ds.mesh.position.copy(ds.originWorldPos);
                    ds.origParent.attach(ds.mesh);
                    if (ds.mesh !== hoveredRef.current) setGlow(ds.mesh, false);
                    dragState.current = null;
                    setIsDragging(false);
                    document.body.style.cursor = hoveredRef.current ? 'grab' : 'auto';
                }
            } else {
                lerpWorld.current.lerp(targetWorld.current, Math.min(delta * 14, 1));
                ds.mesh.position.copy(lerpWorld.current);
            }
        }

        // --- Floating label: update position every frame ---
        if (!labelRef.current) return;

        const activeMesh = ds?.mesh || hoveredRef.current;

        if (!activeMesh) {
            if (labelRef.current.style.display !== 'none') {
                labelRef.current.style.display = 'none';
                labelMeshRef.current = null;
            }
            return;
        }

        // Update text only when the active mesh changes
        if (activeMesh !== labelMeshRef.current) {
            labelRef.current.textContent = (activeMesh.name || 'Organ')
                .replace(/_/g, ' ').toUpperCase();
            labelMeshRef.current = activeMesh;
        }

        // getWorldPosition() traverses the full transform chain
        // (ownScene → Center → Bounds → world) and reads the position that was
        // just set above in this same useFrame call — zero delay between organ and label.
        activeMesh.getWorldPosition(_projVec);
        _projVec.project(camera);

        const screenX = (_projVec.x * 0.5 + 0.5) * size.width;
        const screenY = (-_projVec.y * 0.5 + 0.5) * size.height;

        // 50px above the organ's projected world centre.
        // The organ centre is roughly mid-body; 50px clears the top of most organs
        // and leaves a clean 15-20px gap above the visible mesh surface.
        const GAP_PX = 50;
        labelRef.current.style.display   = 'block';
        labelRef.current.style.transform =
            `translate(calc(${screenX}px - 50%), calc(${screenY - GAP_PX}px - 100%))`;
    });

    const onPointerOver = useCallback((e) => {
        e.stopPropagation();
        const mesh = e.object;
        if (!mesh?.isMesh || mesh === hoveredRef.current) return;
        if (hoveredRef.current && hoveredRef.current !== dragState.current?.mesh)
            setGlow(hoveredRef.current, false);
        hoveredRef.current = mesh;
        if (mesh !== dragState.current?.mesh) setGlow(mesh, true);
        document.body.style.cursor = dragState.current ? 'grabbing' : 'grab';
    }, [setGlow]);

    const onPointerOut = useCallback((e) => {
        e.stopPropagation();
        if (hoveredRef.current && hoveredRef.current !== dragState.current?.mesh)
            setGlow(hoveredRef.current, false);
        hoveredRef.current = null;
        if (!dragState.current) document.body.style.cursor = 'auto';
    }, [setGlow]);

    const onPointerDown = useCallback((e) => {
        e.stopPropagation();
        const mesh = e.object;
        if (!mesh?.isMesh) return;

        const origParent = mesh.parent;
        // Native Three.js robust re-parenting preserves exact world transforms safely 
        ownScene.attach(mesh);
        const worldPos = mesh.position.clone();

        targetWorld.current.copy(worldPos);
        lerpWorld.current.copy(worldPos);
        dragState.current = { mesh, origParent, originWorldPos: worldPos, returning: false };

        downAt.current = { x: e.clientX, y: e.clientY };
        setGlow(mesh, true);
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
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
        if (wasTap) onSelectPart((ds.mesh.name || 'Unknown Organ').replace(/_/g, ' '));
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

export default function InteractiveDigestiveView({ onBack }) {
    const { t } = useLanguage();
    const [selectedPart, setSelectedPart] = useState(null);
    const [isDragging,   setIsDragging]   = useState(false);

    // Ref to the floating label DOM element — updated directly in useFrame
    const labelRef = useRef(null);

    return (
        <div className="system-view">
            <div className="ios-header glass-panel">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                    {t('Back')}
                </button>
                <h2>Interactive Digestive System</h2>
                <div style={{ width: 80 }} />
            </div>

            <div className="system-layout">
                <div className="model-container glass-panel"
                    style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

                    <Canvas
                        camera={{ position: [0, 5, 20], fov: 45, near: 0.1, far: 1000 }}
                        style={{ touchAction: 'none' }}
                        gl={{ antialias: true, powerPreference: 'high-performance' }}
                    >
                        <ambientLight intensity={0.6} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                        <pointLight position={[-10, -10, -10]} intensity={0.4} />

                        <Suspense fallback={<Loader />}>
                            <Bounds fit clip margin={1.2}>
                                <Center>
                                    <DigestiveScene
                                        onSelectPart={setSelectedPart}
                                        setIsDragging={setIsDragging}
                                        labelRef={labelRef}
                                    />
                                </Center>
                            </Bounds>
                            <Environment preset="city" />
                        </Suspense>

                        <OrbitControls
                            makeDefault
                            enabled={!isDragging}
                            minPolarAngle={0}
                            maxPolarAngle={Math.PI / 1.5}
                        />
                    </Canvas>

                    {/* ── Floating tracking label (V2) ── */}
                    <style>{`
                        @keyframes organLabelPulse {
                            0%, 100% { box-shadow: 0 0 18px 4px rgba(10,132,255,0.7), 0 0 40px 10px rgba(10,132,255,0.3); }
                            50%       { box-shadow: 0 0 32px 10px rgba(10,132,255,0.98), 0 0 65px 22px rgba(10,132,255,0.55); }
                        }
                        .organ-tracking-label {
                            display: none;
                            position: absolute;
                            top: 0;
                            left: 0;
                            pointer-events: none;
                            background: linear-gradient(135deg, rgba(10,132,255,0.97) 0%, rgba(0,70,190,0.95) 100%);
                            padding: 9px 26px;
                            border-radius: 30px;
                            color: #fff;
                            font-weight: 800;
                            font-size: 18px;
                            letter-spacing: 0.09em;
                            text-transform: uppercase;
                            backdrop-filter: blur(14px);
                            border: 1.5px solid rgba(140,195,255,0.6);
                            animation: organLabelPulse 1.5s ease-in-out infinite;
                            white-space: nowrap;
                            text-shadow: 0 0 14px rgba(120,190,255,0.95), 0 1px 3px rgba(0,0,0,0.5);
                            z-index: 10;
                            margin-top: 0;
                        }
                    `}</style>
                    {/* Single div — position & text set imperatively in useFrame */}
                    <div ref={labelRef} className="organ-tracking-label" />

                    <div style={{
                        position: 'absolute', bottom: '20px', left: '20px',
                        pointerEvents: 'none', background: 'rgba(0,0,0,0.55)',
                        padding: '10px 20px', borderRadius: '12px', backdropFilter: 'blur(10px)'
                    }}>
                        <p style={{ margin: 0, fontSize: '13px' }}>
                            💡 <strong>Tip:</strong> Hover to glow. Drag an organ to pull it out — label follows it. Release to snap back.
                        </p>
                    </div>
                </div>

                <div className="system-sidebar glass-panel">
                    <h3>Organ Details</h3>
                    {selectedPart ? (
                        <div className="details-card fade-in">
                            <div className="details-header">
                                <h2>{selectedPart}</h2>
                                <div className="organ-type blur-pill">Digestive Organ</div>
                            </div>
                            <p>You selected <strong>{selectedPart}</strong>. Drag any organ to pull it out of the model and release to watch it spring back. Label follows the organ as you move it.</p>
                        </div>
                    ) : (
                        <div className="empty-state" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', opacity: 0.5, textAlign: 'center'
                        }}>
                            <Info size={40} style={{ marginBottom: '16px' }} />
                            <p>Hover an organ to highlight it. Drag to pull it — the label glows and follows it.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
