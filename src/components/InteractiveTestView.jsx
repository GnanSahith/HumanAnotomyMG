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

function BoxScene({ onSelectPart, setActiveBoxName }) {
    const { camera } = useThree();
    const { scene }  = useGLTF('https://res.cloudinary.com/dy1gyundx/raw/upload/v1777578095/Three_Boxes.glb');

    // Own independent copy — geometry/textures shared (no VRAM duplication),
    // materials cloned so emissive can be mutated independently
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

    const boxMats = React.useMemo(() => {
        const map = new Map();
        ownScene.children.forEach(box => {
            const mats = [];
            box.traverse(child => {
                if (!child.isMesh) return;
                (Array.isArray(child.material) ? child.material : [child.material])
                    .forEach(m => mats.push(m));
            });
            map.set(box.uuid, mats);
        });
        return map;
    }, [ownScene]);

    const glowColor  = useRef(new THREE.Color('#0a84ff'));
    const blackColor = useRef(new THREE.Color(0, 0, 0));
    const scaleVec   = useRef(new THREE.Vector3());
    const hoveredRef = useRef(null);
    const dragRef    = useRef(null);
    const downAt     = useRef({ x: 0, y: 0 });
    const originPos  = useRef(new THREE.Vector3());
    const targetPos  = useRef(new THREE.Vector3());
    const lerpPos    = useRef(new THREE.Vector3());

    const setGlow = useCallback((box, on) => {
        if (!box) return;
        const mats = boxMats.get(box.uuid) || [];
        mats.forEach(m => {
            m.emissive.copy(on ? glowColor.current : blackColor.current);
            m.emissiveIntensity = on ? 0.85 : 0;
        });
    }, [boxMats]);

    const findBox = useCallback((object) => {
        let o = object;
        while (o && o.parent !== ownScene) o = o.parent;
        return (o?.parent === ownScene) ? o : null;
    }, [ownScene]);

    useFrame((_, delta) => {
        ownScene.children.forEach(box => {
            const active = box === hoveredRef.current || box === dragRef.current;
            scaleVec.current.setScalar(active ? 1.12 : 1.0);
            box.scale.lerp(scaleVec.current, Math.min(delta * 12, 1));
        });
        if (dragRef.current) {
            lerpPos.current.lerp(targetPos.current, Math.min(delta * 12, 1));
            dragRef.current.position.copy(lerpPos.current);
        }
    });

    const onPointerOver = useCallback((e) => {
        e.stopPropagation();
        const box = findBox(e.object);
        if (!box || box === hoveredRef.current) return;
        if (hoveredRef.current) setGlow(hoveredRef.current, false);
        hoveredRef.current = box;
        setGlow(box, true);
        document.body.style.cursor = 'grab';
        setActiveBoxName((box.name || 'Box').replace(/_/g, ' '));
    }, [findBox, setGlow, setActiveBoxName]);

    const onPointerOut = useCallback((e) => {
        e.stopPropagation();
        if (hoveredRef.current && hoveredRef.current !== dragRef.current) {
            setGlow(hoveredRef.current, false);
        }
        hoveredRef.current = null;
        if (!dragRef.current) document.body.style.cursor = 'auto';
        setActiveBoxName('');
    }, [setGlow, setActiveBoxName]);

    const onPointerDown = useCallback((e) => {
        e.stopPropagation();
        const box = findBox(e.object);
        if (!box) return;
        dragRef.current = box;
        downAt.current  = { x: e.clientX, y: e.clientY };
        originPos.current.copy(box.position);
        lerpPos.current.copy(box.position);
        targetPos.current.copy(box.position);
        document.body.style.cursor = 'grabbing';
        e.target.setPointerCapture(e.pointerId);
    }, [findBox]);

    const onPointerMove = useCallback((e) => {
        if (!dragRef.current) return;
        const dx = e.clientX - downAt.current.x;
        const dy = e.clientY - downAt.current.y;
        const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up      = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const dist    = Math.max(1, camera.position.length() / 20);

        targetPos.current
            .copy(originPos.current)
            .addScaledVector(right, dx / (15 / dist))
            .addScaledVector(up, -dy / (15 / dist))
            .addScaledVector(forward, -1.8 * dist);
    }, [camera]);

    const onPointerUp = useCallback((e) => {
        if (!dragRef.current) return;
        const wasTap =
            Math.abs(e.clientX - downAt.current.x) < 5 &&
            Math.abs(e.clientY - downAt.current.y) < 5;
        if (wasTap) {
            onSelectPart((dragRef.current.name || 'Box').replace(/_/g, ' '));
        }
        targetPos.current.copy(originPos.current);
        const box = dragRef.current;
        setTimeout(() => {
            if (box) box.position.copy(originPos.current);
            dragRef.current = null;
            document.body.style.cursor = hoveredRef.current ? 'grab' : 'auto';
        }, 420);
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

export default function InteractiveTestView({ onBack }) {
    const { t } = useLanguage();
    const [selectedPart,  setSelectedPart]  = useState(null);
    const [activeBoxName, setActiveBoxName] = useState('');

    return (
        <div className="system-view">
            <div className="ios-header glass-panel">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                    {t('Back')}
                </button>
                <h2>3D Interactive Testing</h2>
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
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                        <pointLight position={[-10, -10, -10]} intensity={0.5} />

                        <Suspense fallback={<Loader />}>
                            <Bounds fit clip margin={1.2}>
                                <Center>
                                    <BoxScene
                                        onSelectPart={setSelectedPart}
                                        setActiveBoxName={setActiveBoxName}
                                    />
                                </Center>
                            </Bounds>
                            <Environment preset="city" />
                        </Suspense>

                        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
                    </Canvas>

                    {activeBoxName && (
                        <div style={{
                            position: 'absolute', top: '20px', left: '50%',
                            transform: 'translateX(-50%)', pointerEvents: 'none',
                            background: 'rgba(10,132,255,0.88)', padding: '6px 18px',
                            borderRadius: '20px', color: 'white', fontWeight: 600,
                            fontSize: '14px', backdropFilter: 'blur(8px)',
                            boxShadow: '0 0 20px rgba(10,132,255,0.55)'
                        }}>
                            {activeBoxName}
                        </div>
                    )}

                    <div style={{
                        position: 'absolute', bottom: '20px', left: '20px',
                        pointerEvents: 'none', background: 'rgba(0,0,0,0.5)',
                        padding: '10px 20px', borderRadius: '12px', backdropFilter: 'blur(10px)'
                    }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                            💡 <strong>Tip:</strong> Hover to highlight. Drag a box to pull it out — release to snap back. Click to select.
                        </p>
                    </div>
                </div>

                <div className="system-sidebar glass-panel">
                    <h3>Selection Details</h3>
                    {selectedPart ? (
                        <div className="details-card fade-in">
                            <div className="details-header">
                                <h2>{selectedPart}</h2>
                                <div className="organ-type blur-pill">Selected 3D Mesh</div>
                            </div>
                            <p>You selected <strong>{selectedPart}</strong>. Drag it to pull it away from the group, then release to watch it snap back with physics.</p>
                        </div>
                    ) : (
                        <div className="empty-state" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', opacity: 0.5, textAlign: 'center'
                        }}>
                            <Info size={40} style={{ marginBottom: '16px' }} />
                            <p>Hover over a box and drag it to pull it out.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
