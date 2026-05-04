import React, { useState, Suspense, useRef, useCallback } from 'react';
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

/*
 * GLB hierarchy:
 *   Scene > Sketchfab_model > stmoch.obj.cleaner.gles
 *     > Object_2 … Object_9  (8 individual organ meshes)
 *
 * Each organ mesh is grabbed using THREE's attach() / re-attach() so
 * the parent transform chain never interferes with world-space drag math.
 *
 * Props:
 *   onSelectPart        — called with mesh name on tap/click
 *   setActiveOrganName  — drives hover label
 *   setIsDragging       — disables OrbitControls while dragging
 */
function DigestiveScene({ onSelectPart, setActiveOrganName, setIsDragging }) {
    const { camera } = useThree();
    const { scene }  = useGLTF('https://res.cloudinary.com/dy1gyundx/raw/upload/v1777577810/Digestive_System.glb');

    // Clone scene once — geometry + textures shared (no VRAM duplication)
    const ownScene = React.useMemo(() => {
        const clone = scene.clone(true);
        const getMat = (m) => { 
            const c = m.clone(); 
            if (c.isMeshStandardMaterial) {
                c.roughness = 0.85; 
                c.metalness = 0.1;
            }
            c.emissiveIntensity = 0; 
            return c; 
        };
        clone.traverse((child) => {
            if (!child.isMesh) return;
            if (Array.isArray(child.material)) {
                child.material = child.material.map(getMat);
            } else if (child.material) {
                child.material = getMat(child.material);
            }
        });
        return clone;
    }, [scene]);

    // Material map per mesh uuid → [Material]
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

    // dragState: null | { mesh, origParent, originWorldPos, returning }
    const dragState   = useRef(null);
    const downAt      = useRef({ x: 0, y: 0 });
    const targetWorld = useRef(new THREE.Vector3());
    const lerpWorld   = useRef(new THREE.Vector3());

    const setGlow = useCallback((mesh, on) => {
        const mats = meshMats.get(mesh?.uuid) || [];
        mats.forEach(m => {
            m.emissive.copy(on ? glowColor.current : blackColor.current);
            m.emissiveIntensity = on ? 0.9 : 0;
        });
    }, [meshMats]);

    useFrame((_, delta) => {
        // Scale hover / drag mesh
        ownScene.traverse((child) => {
            if (!child.isMesh) return;
            const active = child === hoveredRef.current ||
                           child === dragState.current?.mesh;
            scaleVec.current.setScalar(active ? 1.09 : 1.0);
            child.scale.lerp(scaleVec.current, Math.min(delta * 8, 1));
        });

        const ds = dragState.current;
        if (!ds) return;

        if (ds.returning) {
            // Smooth spring-back — slow lerp so user clearly sees the snap animation
            lerpWorld.current.lerp(targetWorld.current, Math.min(delta * 4, 1));
        } else {
            // Follow mouse — snappy lerp toward drag target
            lerpWorld.current.lerp(targetWorld.current, Math.min(delta * 14, 1));
        }

        ds.mesh.position.copy(lerpWorld.current);

        // Once close enough to origin, re-parent and finish
        if (ds.returning) {
            const dist = lerpWorld.current.distanceTo(ds.originWorldPos);
            if (dist < 0.01) {
                ds.mesh.position.copy(ds.originWorldPos);
                ds.origParent.attach(ds.mesh);
                if (ds.mesh !== hoveredRef.current) setGlow(ds.mesh, false);
                dragState.current = null;
                setIsDragging(false);
                document.body.style.cursor = hoveredRef.current ? 'grab' : 'auto';
            }
        }
    });

    const onPointerOver = useCallback((e) => {
        e.stopPropagation();
        const mesh = e.object;
        if (!mesh?.isMesh || mesh === hoveredRef.current) return;
        if (hoveredRef.current && hoveredRef.current !== dragState.current?.mesh) {
            setGlow(hoveredRef.current, false);
        }
        hoveredRef.current = mesh;
        if (mesh !== dragState.current?.mesh) setGlow(mesh, true);
        document.body.style.cursor = dragState.current ? 'grabbing' : 'grab';
        setActiveOrganName((mesh.name || 'Organ').replace(/_/g, ' '));
    }, [setGlow, setActiveOrganName]);

    const onPointerOut = useCallback((e) => {
        e.stopPropagation();
        if (hoveredRef.current && hoveredRef.current !== dragState.current?.mesh) {
            setGlow(hoveredRef.current, false);
        }
        hoveredRef.current = null;
        if (!dragState.current) document.body.style.cursor = 'auto';
        setActiveOrganName('');
    }, [setGlow, setActiveOrganName]);

    const onPointerDown = useCallback((e) => {
        e.stopPropagation();
        const mesh = e.object;
        if (!mesh?.isMesh) return;

        const origParent = mesh.parent;

        // Reparent to scene root while preserving world position
        ownScene.attach(mesh);
        // mesh.position is now its world-space position
        const worldPos = mesh.position.clone();

        targetWorld.current.copy(worldPos);
        lerpWorld.current.copy(worldPos);

        dragState.current = {
            mesh, origParent,
            originWorldPos: worldPos,
            returning: false
        };

        downAt.current = { x: e.clientX, y: e.clientY };
        setGlow(mesh, true);

        // Disable OrbitControls and set pointer capture so ALL move/up events
        // go to this element even if the pointer leaves the canvas
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
        e.target.setPointerCapture(e.pointerId);
    }, [ownScene, setGlow, setIsDragging]);

    const onPointerMove = useCallback((e) => {
        const ds = dragState.current;
        if (!ds || ds.returning) return;

        const dx = e.clientX - downAt.current.x;
        const dy = e.clientY - downAt.current.y;

        // Camera-relative movement so dragging always matches screen direction
        const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up      = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const dist    = Math.max(1, camera.position.length() / 20);

        // Higher divisor = less movement per pixel = lower sensitivity
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

        if (wasTap) {
            onSelectPart((ds.mesh.name || 'Unknown Organ').replace(/_/g, ' '));
        }

        // Begin smooth animated snap-back — useFrame handles re-attach when close enough
        targetWorld.current.copy(ds.originWorldPos);
        ds.returning = true;
        document.body.style.cursor = hoveredRef.current ? 'grab' : 'auto';
        // Note: setIsDragging(false) is called inside useFrame once snap completes
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
    const [selectedPart,    setSelectedPart]    = useState(null);
    const [activeOrganName, setActiveOrganName] = useState('');
    // Disable orbit rotate while user is dragging an organ
    const [isDragging, setIsDragging]           = useState(false);

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
                                        setActiveOrganName={setActiveOrganName}
                                        setIsDragging={setIsDragging}
                                    />
                                </Center>
                            </Bounds>
                            <Environment preset="city" />
                        </Suspense>

                        {/* Disabled while organ is being dragged so the orbit
                            rotation doesn't fight with the drag movement */}
                        <OrbitControls
                            makeDefault
                            enabled={!isDragging}
                            minPolarAngle={0}
                            maxPolarAngle={Math.PI / 1.5}
                        />
                    </Canvas>

                    {/* Organ name hover / drag label */}
                    <style>{`
                        @keyframes organLabelPulse {
                            0%, 100% { box-shadow: 0 0 18px 4px rgba(10,132,255,0.7), 0 0 40px 10px rgba(10,132,255,0.3); }
                            50%       { box-shadow: 0 0 30px 8px rgba(10,132,255,0.95), 0 0 60px 20px rgba(10,132,255,0.5); }
                        }
                        .organ-label {
                            position: absolute;
                            top: 18px;
                            left: 50%;
                            transform: translateX(-50%);
                            pointer-events: none;
                            background: linear-gradient(135deg, rgba(10,132,255,0.95) 0%, rgba(0,80,200,0.92) 100%);
                            padding: 10px 28px;
                            border-radius: 30px;
                            color: #fff;
                            font-weight: 800;
                            font-size: 20px;
                            letter-spacing: 0.08em;
                            text-transform: uppercase;
                            backdrop-filter: blur(12px);
                            border: 1.5px solid rgba(120,180,255,0.55);
                            animation: organLabelPulse 1.6s ease-in-out infinite;
                            white-space: nowrap;
                            text-shadow: 0 0 12px rgba(100,180,255,0.9), 0 1px 3px rgba(0,0,0,0.4);
                        }
                    `}</style>
                    {activeOrganName && (
                        <div className="organ-label">
                            {activeOrganName}
                        </div>
                    )}

                    <div style={{
                        position: 'absolute', bottom: '20px', left: '20px',
                        pointerEvents: 'none', background: 'rgba(0,0,0,0.55)',
                        padding: '10px 20px', borderRadius: '12px', backdropFilter: 'blur(10px)'
                    }}>
                        <p style={{ margin: 0, fontSize: '13px' }}>
                            💡 <strong>Tip:</strong> Hover to glow. Drag an organ to pull it out — release to watch it spring back. Rotate the whole model by dragging the background.
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
                            <p>You selected <strong>{selectedPart}</strong>. Drag any organ to pull it out of the model and release to watch it spring back. Drag the empty space to rotate the whole scene.</p>
                        </div>
                    ) : (
                        <div className="empty-state" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', opacity: 0.5, textAlign: 'center'
                        }}>
                            <Info size={40} style={{ marginBottom: '16px' }} />
                            <p>Hover an organ to highlight it blue. Drag to pull it out. Click to identify.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
