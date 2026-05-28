import React, { useState, useEffect, useRef, Suspense } from 'react';
import '@google/model-viewer';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Bounds, Center } from '@react-three/drei';
import { Loader } from './InteractiveDigestiveView_v2';
import { InteractiveSystemScene } from './InteractiveSystemScene';

import InteractiveWrapper from './InteractiveWrapper';

export default function ModelViewer({ activeOrgan }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const viewerRef = useRef(null);
    const labelRef = useRef(null);

    useEffect(() => {
        if (activeOrgan) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [activeOrgan]);

    const handleLoad = () => {
        setIsLoading(false);
        const viewer = viewerRef.current;
        // Rely exclusively on the authentic internal mapped textures
    };

    return (
        <div className="viewer-container glass-panel">
            {!activeOrgan && (
                <div className="empty-state" style={{ height: '100%', padding: '24px' }}>
                    <h2 style={{ color: 'var(--text-muted)' }}>Interactive 3D View</h2>
                    <p>Select an organ from the sidebar to inspect its 3D model.</p>
                </div>
            )}

            {activeOrgan && (
                <>
                    {isLoading && (
                        <div className="loading-overlay">
                            <div className="loading-pulse" />
                        </div>
                    )}
                    {(activeOrgan.id.endsWith('_entire') || activeOrgan.modelSrc?.endsWith('.fbx')) ? (
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
                                                modelSrc={activeOrgan.modelSrc}
                                                onSelectPart={(part) => console.log('Selected in Combined View:', part)}
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
                            <div ref={labelRef} className="organ-tracking-label" />
                        </div>
                    ) : (
                        <model-viewer
                            ref={viewerRef}
                            src={activeOrgan.modelSrc}
                            alt={`A 3D model of ${activeOrgan.name}`}
                            auto-rotate
                            camera-controls
                            shadow-intensity="0.5"
                            exposure="0.6"
                            environment-image="neutral"
                            onLoad={handleLoad}
                            style={{ width: '100%', height: '100%' }}
                        ></model-viewer>
                    )}
                </>
            )}
        </div>
    );
}
