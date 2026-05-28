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
import { InteractiveSystemScene } from './InteractiveSystemScene';

export function Loader() {
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
                                    <InteractiveSystemScene
                                        modelSrc="https://res.cloudinary.com/dy1gyundx/raw/upload/v1777577834/Digestive_System_01.glb"
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
