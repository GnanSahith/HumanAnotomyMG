/**
 * HumanAnatomyDigestiveView.jsx
 *
 * A NEW combined panel that merges:
 *   - Left  : Digestive organ list (from data.js)
 *   - Centre: Interactive 3D model (drag-and-snap physics + floating label)
 *   - Right : Organ details (updates when you click the sidebar OR grab a 3D organ)
 *
 * Does NOT modify InteractiveDigestiveView_v2.jsx or the normal Digestive System panel.
 */

import React, { useState, Suspense, useRef, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
    useGLTF, OrbitControls, Environment, Bounds, Html, useProgress, Center,
} from '@react-three/drei';
import { ArrowLeft, Info, Box, ChevronRight, BookOpen, Zap, Layers, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { systemsData } from '../data';
import { useLanguage } from '../LanguageContext';

// ─── Pull digestive system data ────────────────────────────────────────────
const digestiveSystem = systemsData.find((s) => s.id === 'digestive');

// ─── Loader overlay ────────────────────────────────────────────────────────
function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div style={{
                color: '#fff', background: 'rgba(0,0,0,0.85)',
                padding: '12px 28px', borderRadius: '12px',
                fontSize: '15px', fontWeight: 700,
                boxShadow: '0 0 24px rgba(10,132,255,0.3)',
            }}>
                Loading 3D Model… {progress.toFixed(0)}%
            </div>
        </Html>
    );
}

// ─── Shared temp vector ─────────────────────────────────────────────────────
const _pv = new THREE.Vector3();

// ─── 3-D Scene (same physics as V2, adapted to notify parent of grabs) ──────
export function DigestiveScene3Panel({ onGrabMesh, onReleaseMesh, setIsDragging, labelRef, onLoadedMeshes, quizTargetMesh }) {
    const { camera, size } = useThree();
    const { scene } = useGLTF('https://res.cloudinary.com/dy1gyundx/raw/upload/v1777577834/Digestive_System_01.glb');

    const ownScene = useMemo(() => {
        scene.updateMatrixWorld(true);
        const clone = new THREE.Group();
        scene.traverse((child) => {
            if (child.isMesh) {
                // Flatten structural issues by baking the hierarchy and scaling straight into the vertices
                const geometry = child.geometry.clone();
                geometry.applyMatrix4(child.matrixWorld);
                
                // Perfectly center the origin pivot point so expansion animations are flawless 
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
                cleanMesh.position.copy(center); // push it back to its global coordinate
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

    const meshMats = useMemo(() => {
        const map = new Map();
        ownScene.traverse((child) => {
            if (!child.isMesh) return;
            map.set(child.uuid,
                Array.isArray(child.material) ? child.material : [child.material]);
        });
        return map;
    }, [ownScene]);

    const glowColor   = useRef(new THREE.Color('#0a84ff'));
    const quizGlowColor = useRef(new THREE.Color('#ff9f0a')); // intense orange for quiz
    const emptyColor  = useRef(new THREE.Color(0, 0, 0));
    const scaleVec    = useRef(new THREE.Vector3());
    const hoveredRef  = useRef(null);
    const dragState   = useRef(null);
    const downAt      = useRef({ x: 0, y: 0 });
    const targetWorld = useRef(new THREE.Vector3());
    const lerpWorld   = useRef(new THREE.Vector3());
    const labelMesh   = useRef(null);

    const setGlow = useCallback((mesh, on, isQuiz = false) => {
        (meshMats.get(mesh?.uuid) || []).forEach((m) => {
            m.emissive.copy(on ? (isQuiz ? quizGlowColor.current : glowColor.current) : emptyColor.current);
            m.emissiveIntensity = on ? (isQuiz ? 1.0 : 0.85) : 0;
        });
    }, [meshMats]);

    const cleanName = (raw) => (raw || 'Organ').replace(/_01/g, '').replace(/_/g, ' ');

    useEffect(() => {
        const names = [];
        ownScene.traverse((child) => {
            if (child.isMesh) names.push(child.name);
        });
        if (onLoadedMeshes) onLoadedMeshes(names);
    }, [ownScene, onLoadedMeshes]);

    useEffect(() => {
        ownScene.traverse((child) => {
            if (!child.isMesh) return;
            if (quizTargetMesh && child.name === quizTargetMesh) {
                setGlow(child, true, true);
            } else if (child !== hoveredRef.current && child !== dragState.current?.mesh) {
                setGlow(child, false);
            }
        });
    }, [quizTargetMesh, ownScene, setGlow]);

    useFrame((_, delta) => {
        // Scale pulse
        ownScene.traverse((child) => {
            if (!child.isMesh) return;
            const isQuizTarget = quizTargetMesh && quizTargetMesh === child.name;
            const active = child === hoveredRef.current || child === dragState.current?.mesh || isQuizTarget;
            scaleVec.current.setScalar(active ? 1.08 : 1.0);
            child.scale.lerp(scaleVec.current, Math.min(delta * 8, 1));
        });

        // Position update
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
                    onReleaseMesh();
                    document.body.style.cursor = hoveredRef.current ? 'grab' : 'auto';
                }
            } else {
                lerpWorld.current.lerp(targetWorld.current, Math.min(delta * 14, 1));
                ds.mesh.position.copy(lerpWorld.current);
            }
        }

        // Floating label
        if (!labelRef.current) return;
        const activeMesh = ds?.mesh || hoveredRef.current;
        if (!activeMesh) {
            if (labelRef.current.style.display !== 'none') {
                labelRef.current.style.display = 'none';
                labelMesh.current = null;
            }
            return;
        }
        if (activeMesh !== labelMesh.current) {
            labelRef.current.textContent = cleanName(activeMesh.name).toUpperCase();
            labelMesh.current = activeMesh;
        }
        activeMesh.getWorldPosition(_pv);
        _pv.project(camera);
        const sx = (_pv.x * 0.5 + 0.5) * size.width;
        const sy = (-_pv.y * 0.5 + 0.5) * size.height;
        labelRef.current.style.display   = 'block';
        labelRef.current.style.transform =
            `translate(calc(${sx}px - 50%), calc(${sy - 50}px - 100%))`;
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
        // attach handles all parent scale matrices globally without manually moving matrices
        ownScene.attach(mesh);
        
        const worldPos = mesh.position.clone();
        
        targetWorld.current.copy(worldPos);
        lerpWorld.current.copy(worldPos);
        dragState.current = { mesh, origParent, originWorldPos: worldPos, returning: false };
        downAt.current = { x: e.clientX, y: e.clientY };
        setGlow(mesh, true);
        setIsDragging(true);
        onGrabMesh(cleanName(mesh.name));
        document.body.style.cursor = 'grabbing';
        e.target.setPointerCapture(e.pointerId);
    }, [ownScene, setGlow, setIsDragging, onGrabMesh, cleanName]);

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
            .addScaledVector(right,    dx / (50 / dist))
            .addScaledVector(up,      -dy / (50 / dist))
            .addScaledVector(forward, -0.7 * dist);
    }, [camera]);

    const onPointerUp = useCallback((e) => {
        const ds = dragState.current;
        if (!ds) return;
        targetWorld.current.copy(ds.originWorldPos);
        ds.returning = true;
        document.body.style.cursor = hoveredRef.current ? 'grab' : 'auto';
    }, []);

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

// ─── Organ Detail Card ──────────────────────────────────────────────────────
function OrganDetailCard({ organ, grabbed3dName, language = 'en' }) {
    const { t } = useLanguage();

    if (grabbed3dName && !organ) {
        return (
            <div className="details-card fade-in" style={{ padding: '24px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '16px',
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(10,132,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap size={20} color="#0a84ff" />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            3D Part Grabbed
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{grabbed3dName}</h3>
                    </div>
                </div>
                <p style={{ opacity: 0.7, fontSize: '14px', lineHeight: 1.6 }}>
                    You're exploring <strong>{grabbed3dName}</strong> from the 3D model.
                    <br /><br />
                    Select an organ from the <strong>left panel</strong> to read its
                    full scientific description, or release and drag another part.
                </p>
                <div style={{
                    marginTop: '20px', padding: '12px 16px',
                    background: 'rgba(10,132,255,0.08)',
                    borderRadius: '10px', border: '1px solid rgba(10,132,255,0.2)',
                    fontSize: '13px', opacity: 0.85,
                }}>
                    💡 Tip: Release the organ to watch it snap back with spring physics.
                </div>
            </div>
        );
    }

    if (!organ) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', opacity: 0.45, textAlign: 'center',
                padding: '32px',
            }}>
                <BookOpen size={44} style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '15px', lineHeight: 1.6 }}>
                    Select an organ from the list on the left,<br />
                    or drag a part from the 3D model.
                </p>
            </div>
        );
    }

    const desc = typeof organ.description === 'object'
        ? organ.description[language] || organ.description.en
        : organ.description || '';

    const name = typeof organ.name === 'object'
        ? organ.name[language] || organ.name.en
        : organ.name;

    return (
        <div className="details-card fade-in" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px',
            }}>
                <div style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(10,132,255,0.25), rgba(10,132,255,0.05))',
                    border: '1.5px solid rgba(10,132,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Box size={22} color="#0a84ff" />
                </div>
                <div>
                    <div style={{ fontSize: '11px', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Digestive System
                    </div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{name}</h2>
                    {organ.scientificName && (
                        <div style={{ fontSize: '13px', opacity: 0.55, fontStyle: 'italic', marginTop: '3px' }}>
                            {organ.scientificName}
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                padding: '16px', marginBottom: '18px',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.75, opacity: 0.88 }}>
                    {desc.replace(/Scientific\s+Name:.*?Description:\s*/i, '')
                         .replace(/[-]+Page \(\d+\) Break[-]+/g, '')
                         .trim()}
                </p>
            </div>

            {/* Detail chips */}
            {organ.details && organ.details.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {organ.details.map((d, i) => (
                        <div key={i} style={{
                            padding: '6px 14px', borderRadius: '20px',
                            background: 'rgba(10,132,255,0.1)',
                            border: '1px solid rgba(10,132,255,0.25)',
                            fontSize: '12px', fontWeight: 600,
                        }}>
                            <span style={{ opacity: 0.6 }}>{d.label}: </span>
                            <span>{d.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Combined View ─────────────────────────────────────────────────────
export default function HumanAnatomyDigestiveView({ onBack }) {
    const { t, currentLanguage } = useLanguage();
    const [selectedOrganId, setSelectedOrganId] = useState(null);
    const [grabbed3dName,   setGrabbed3dName]   = useState(null);
    const [isDragging,      setIsDragging]      = useState(false);
    const labelRef = useRef(null);

    // Quiz States
    const [quizState, setQuizState] = useState('idle'); // idle | active | answered | results
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [availableMeshes, setAvailableMeshes] = useState([]);
    const [userChoice, setUserChoice] = useState(null);

    const activeQuizOrgan = (quizState === 'active' || quizState === 'answered') ? quizQuestions[currentQuestionIdx]?.targetMeshName : null;

    const handleLoadedMeshes = useCallback((names) => {
        setAvailableMeshes(names);
    }, []);

    const cleanName = (raw) => (raw || 'Organ').replace(/_01/g, '').replace(/_/g, ' ');

    const handleStartQuiz = () => {
        const validMeshes = availableMeshes.filter(m => !m.includes('Boxes') && !m.includes('System') && !m.includes('Human Skeleton') && !m.includes('Skull') && !m.includes('Rotten Brain'));
        
        let qs = [];
        for (let i = 0; i < 10; i++) {
            const targetMesh = validMeshes[Math.floor(Math.random() * validMeshes.length)];
            const targetOrgan = digestiveSystem.organs.find(o => o.modelSrc && o.modelSrc.includes(targetMesh)) || digestiveSystem.organs.find(o => o.name.en.toLowerCase() === cleanName(targetMesh).toLowerCase());
            
            const isFunctionality = Math.random() > 0.5 && targetOrgan?.description?.en;
            
            let options = [];
            while(options.length < 3) {
                const randomMesh = validMeshes[Math.floor(Math.random() * validMeshes.length)];
                if (randomMesh !== targetMesh && !options.some(o => o.mesh === randomMesh)) {
                    options.push({ mesh: randomMesh });
                }
            }
            options.push({ mesh: targetMesh, isCorrect: true });
            options.sort(() => Math.random() - 0.5);
            
            const formattedOptions = options.map(opt => {
                const optOrgan = digestiveSystem.organs.find(o => o.modelSrc && o.modelSrc.includes(opt.mesh)) || digestiveSystem.organs.find(o => o.name.en.toLowerCase() === cleanName(opt.mesh).toLowerCase());
                
                let label = cleanName(opt.mesh);
                if (isFunctionality && optOrgan && optOrgan.description && optOrgan.description.en) {
                    let desc = optOrgan.description.en.replace(/Scientific\s+Name:.*?Description:\s*/i, '').replace(/[-]+Page \(\d+\) Break[-]+/g, '').trim();
                    label = desc.length > 85 ? desc.substring(0, 85) + '...' : desc;
                }
                return { ...opt, label };
            });

            qs.push({
                targetMeshName: targetMesh,
                questionType: isFunctionality ? 'function' : 'name',
                questionText: isFunctionality ? 'What is the primary function of this highlighted part?' : 'What is this highlighted part?',
                options: formattedOptions
            });
        }
        setQuizQuestions(qs);
        setCurrentQuestionIdx(0);
        setScore(0);
        setUserChoice(null);
        setQuizState('active');
        setSelectedOrganId(null);
        setGrabbed3dName(null);
    };

    const handleOptionSelect = (opt) => {
        if (quizState !== 'active') return;
        setUserChoice(opt);
        if (opt.isCorrect) setScore(s => s + 1);
        setQuizState('answered');
    };

    const handleNextQuestion = () => {
        if (currentQuestionIdx < 9) {
            setCurrentQuestionIdx(i => i + 1);
            setUserChoice(null);
            setQuizState('active');
        } else {
            setQuizState('results');
        }
    };

    const selectedOrgan = digestiveSystem?.organs.find((o) => o.id === selectedOrganId) || null;

    const handleGrabMesh  = useCallback((name) => setGrabbed3dName(name), []);
    const handleReleaseMesh = useCallback(() => setGrabbed3dName(null), []);

    return (
        <div className="system-view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div className="ios-header glass-panel">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                    {t('Back')}
                </button>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={20} color="#0a84ff" />
                    Human Anatomy — Digestive System
                </h2>
                <div style={{ width: 80 }} />
            </div>

            {/* 3-column layout */}
            <div className="digestive-grid">

                {/* ── LEFT: Organ list ── */}
                <aside className="glass-panel" style={{
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    borderRadius: '16px',
                }}>
                    <div style={{
                        padding: '16px 16px 10px',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                    }}>
                        <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '0.08em',
                            textTransform: 'uppercase', opacity: 0.55 }}>
                            Digestive Organs
                        </h3>
                    </div>
                    <ul style={{ margin: 0, padding: '8px', listStyle: 'none', overflowY: 'auto', flex: 1 }}>
                        {digestiveSystem?.organs.map((organ) => {
                            const isActive = organ.id === selectedOrganId;
                            const name = typeof organ.name === 'object'
                                ? organ.name[currentLanguage] || organ.name.en
                                : organ.name;
                            return (
                                <li key={organ.id}>
                                    <button
                                        onClick={() => setSelectedOrganId(isActive ? null : organ.id)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center',
                                            gap: '10px', padding: '10px 12px', borderRadius: '10px',
                                            background: isActive
                                                ? 'linear-gradient(135deg, rgba(10,132,255,0.22), rgba(10,132,255,0.08))'
                                                : 'transparent',
                                            border: isActive
                                                ? '1px solid rgba(10,132,255,0.4)'
                                                : '1px solid transparent',
                                            color: 'var(--text-primary)', cursor: 'pointer',
                                            transition: 'all 0.2s ease', textAlign: 'left',
                                            marginBottom: '2px',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                                            background: isActive
                                                ? 'rgba(10,132,255,0.2)'
                                                : 'rgba(255,255,255,0.06)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Box size={14} color={isActive ? '#0a84ff' : 'rgba(255,255,255,0.4)'} />
                                        </div>
                                        <span style={{
                                            fontSize: '13.5px', fontWeight: isActive ? 700 : 400,
                                            color: isActive ? '#0a84ff' : 'inherit', flex: 1,
                                        }}>
                                            {name}
                                        </span>
                                        {isActive && <ChevronRight size={14} color="#0a84ff" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                {/* ── MIDDLE: 3D Interactive Model ── */}
                <div className="glass-panel" style={{
                    position: 'relative', borderRadius: '16px', overflow: 'hidden',
                }}>
                    <Canvas
                        camera={{ position: [0, 5, 20], fov: 45, near: 0.1, far: 1000 }}
                        style={{ touchAction: 'none', width: '100%', height: '100%' }}
                        gl={{ antialias: true, powerPreference: 'high-performance' }}
                    >
                        <ambientLight intensity={0.8} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} />
                        <pointLight position={[-10, -10, -10]} intensity={0.2} />

                        <Suspense fallback={<Loader />}>
                            <Bounds fit clip margin={1.2}>
                                <Center>
                                    <DigestiveScene3Panel
                                        onGrabMesh={handleGrabMesh}
                                        onReleaseMesh={handleReleaseMesh}
                                        setIsDragging={setIsDragging}
                                        labelRef={labelRef}
                                        onLoadedMeshes={handleLoadedMeshes}
                                        quizTargetMesh={activeQuizOrgan}
                                    />
                                </Center>
                            </Bounds>
                            <Environment preset="studio" />
                        </Suspense>

                        <OrbitControls
                            makeDefault
                            enabled={!isDragging}
                            minPolarAngle={0}
                            maxPolarAngle={Math.PI / 1.5}
                        />
                    </Canvas>

                    {/* Floating label */}
                    <style>{`
                        @keyframes hadPulse {
                            0%,100% { box-shadow: 0 0 14px 3px rgba(10,132,255,0.65), 0 0 32px 8px rgba(10,132,255,0.25); }
                            50%     { box-shadow: 0 0 26px 8px rgba(10,132,255,0.95), 0 0 55px 18px rgba(10,132,255,0.45); }
                        }
                        .had-label {
                            display: none; position: absolute; top: 0; left: 0;
                            pointer-events: none;
                            background: linear-gradient(135deg, rgba(10,132,255,0.97) 0%, rgba(0,70,190,0.95) 100%);
                            padding: 8px 22px; border-radius: 28px; color: #fff;
                            font-weight: 800; font-size: 16px; letter-spacing: 0.08em;
                            text-transform: uppercase; backdrop-filter: blur(12px);
                            border: 1.5px solid rgba(140,195,255,0.55);
                            animation: hadPulse 1.5s ease-in-out infinite;
                            white-space: nowrap;
                            text-shadow: 0 0 12px rgba(120,190,255,0.9), 0 1px 3px rgba(0,0,0,0.5);
                            z-index: 10;
                        }
                    `}</style>
                    <div ref={labelRef} className="had-label" />


                </div>

                <aside className="glass-panel" style={{
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    borderRadius: '16px', position: 'relative'
                }}>
                    <div style={{
                        padding: '16px 16px 10px',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        {quizState === 'idle' ? <Info size={15} color="#0a84ff" /> : <Zap size={15} color="#ff9f0a" />}
                        <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '0.08em',
                            textTransform: 'uppercase', opacity: 0.55 }}>
                            {quizState !== 'idle' ? 'Challenge' : selectedOrgan ? 'Organ Details' : grabbed3dName ? '3D Part' : 'Details'}
                        </h3>
                    </div>

                    {quizState === 'idle' ? (
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <OrganDetailCard
                                organ={selectedOrgan}
                                grabbed3dName={grabbed3dName}
                                language={currentLanguage}
                            />
                            
                            {/* Quiz Button natively integrated into sidebar */}
                            <div style={{ padding: '16px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                 <button onClick={handleStartQuiz} style={{
                                     width: '100%',
                                     background: 'linear-gradient(135deg, rgba(255,159,10,0.85), rgba(255,100,10,0.85))',
                                     color: '#fff', border: '1px solid rgba(255,159,10,0.5)',
                                     padding: '12px 20px', borderRadius: '12px', fontWeight: 600,
                                     cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                     transition: 'opacity 0.2s'
                                 }}
                                 onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                                 onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                                 >
                                    <Zap size={16}/> Start Challenge
                                 </button>
                            </div>
                        </div>
                    ) : (
                        <div className="fade-in-scale" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                           {quizState === 'results' ? (
                               <div style={{ textAlign: 'center', padding: '10px' }}>
                                   <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(10,132,255,0.2)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trophy size={32} color="#0a84ff" />
                                   </div>
                                   <h3 style={{ margin: 0, fontSize: '22px', marginBottom: '8px' }}>Challenge Completed!</h3>
                                   <p style={{ margin: 0, opacity: 0.8, marginBottom: '24px', fontSize: '15px' }}>
                                        You discovered and matched <strong style={{ color: '#30d158', fontSize: '18px' }}>{score}</strong> out of 10 perfectly.
                                   </p>
                                   <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <button onClick={handleStartQuiz} style={{ background: '#0a84ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={16}/> Try Again</button>
                                        <button onClick={() => setQuizState('idle')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                                   </div>
                               </div>
                           ) : (
                               <>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff9f0a', fontWeight: 800 }}>
                                            Question {currentQuestionIdx + 1} of 10
                                        </div>
                                        <button onClick={() => setQuizState('idle')} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', padding: 0 }}>
                                            <XCircle size={18} />
                                        </button>
                                   </div>
                                   <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', lineHeight: 1.4, color: '#fff' }}>
                                        {quizQuestions[currentQuestionIdx].questionText}
                                   </div>
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {quizQuestions[currentQuestionIdx].options.map((opt, i) => {
                                            let bg = 'rgba(255,255,255,0.06)';
                                            let border = '1px solid rgba(255,255,255,0.05)';
                                            let opacity = 1;
                                            
                                            if (quizState === 'answered') {
                                                if (opt.isCorrect) {
                                                    bg = 'rgba(48,209,88,0.2)';
                                                    border = '1px solid rgba(48,209,88,0.5)';
                                                } else if (userChoice === opt) {
                                                    bg = 'rgba(255,69,58,0.2)';
                                                    border = '1px solid rgba(255,69,58,0.5)';
                                                } else {
                                                    opacity = 0.4;
                                                }
                                            }
                                            
                                            return (
                                                <button key={i} onClick={() => handleOptionSelect(opt)} disabled={quizState === 'answered'} style={{
                                                    background: bg, border: border, padding: '12px 14px', borderRadius: '12px',
                                                    color: '#fff', textAlign: 'left', fontSize: '13px', lineHeight: 1.4,
                                                    cursor: quizState === 'answered' ? 'default' : 'pointer',
                                                    opacity, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (quizState === 'active') e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (quizState === 'active') e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                                }}
                                                >
                                                    {quizState === 'answered' && opt.isCorrect && <CheckCircle size={18} color="#30d158" style={{flexShrink: 0}}/>}
                                                    {quizState === 'answered' && !opt.isCorrect && userChoice === opt && <XCircle size={18} color="#ff453a" style={{flexShrink: 0}}/>}
                                                    <span style={{flex: 1}}>{opt.label}</span>
                                                </button>
                                            )
                                        })}
                                   </div>
                                   <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                        {quizState === 'answered' && (
                                            <button onClick={handleNextQuestion} style={{
                                                width: '100%', background: '#0a84ff', color: '#fff',
                                                border: 'none', padding: '12px', borderRadius: '12px',
                                                fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', fontSize: '15px'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#0970d9'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#0a84ff'}
                                            >
                                                {currentQuestionIdx < 9 ? 'Next Question' : 'View Results'}
                                            </button>
                                        )}
                                   </div>
                               </>
                           )}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
