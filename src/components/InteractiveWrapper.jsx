import React, { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Bounds, Center, Html, useProgress } from '@react-three/drei';
import { DigestiveScene3Panel } from './HumanAnatomyDigestiveView';

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div style={{
                color: '#fff', background: 'rgba(0,0,0,0.85)',
                padding: '10px 20px', borderRadius: '8px', fontWeight: 600
            }}>
                Loading 3D Physics... {progress.toFixed(0)}%
            </div>
        </Html>
    );
}

export default function InteractiveWrapper() {
    const labelRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [quizTargetMesh, setQuizTargetMesh] = useState(null);

    useEffect(() => {
        const handler = (e) => setQuizTargetMesh(e.detail);
        window.addEventListener('SET_QUIZ_TARGET', handler);
        return () => window.removeEventListener('SET_QUIZ_TARGET', handler);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                camera={{ position: [0, 5, 20], fov: 45, near: 0.1, far: 1000 }}
                style={{ touchAction: 'none' }}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
                <ambientLight intensity={0.8} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} />
                <pointLight position={[-10, -10, -10]} intensity={0.2} />

                <Suspense fallback={<Loader />}>
                    <Bounds fit clip margin={1.2}>
                        <Center>
                            <DigestiveScene3Panel
                                quizTargetMesh={quizTargetMesh}
                                onLoadedMeshes={(meshes) => { window.digestiveValidMeshes = meshes; }}
                                onGrabMesh={() => {}}
                                onReleaseMesh={() => {}}
                                setIsDragging={setIsDragging}
                                labelRef={labelRef}
                            />
                        </Center>
                    </Bounds>
                    <Environment preset="studio" />
                </Suspense>

                <OrbitControls makeDefault enabled={!isDragging} minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
            </Canvas>

            {/* Glowing Label */}
            <style>{`
                @keyframes iwPulse {
                    0%,100% { box-shadow: 0 0 10px rgba(10,132,255,0.6); }
                    50%     { box-shadow: 0 0 20px rgba(10,132,255,0.9); }
                }
                .iw-label {
                    display: none; position: absolute; top: 0; left: 0;
                    pointer-events: none;
                    background: linear-gradient(135deg, rgba(10,132,255,0.97), rgba(0,70,190,0.95));
                    padding: 6px 16px; border-radius: 20px; color: #fff;
                    font-weight: 700; font-size: 14px; text-transform: uppercase;
                    border: 1px solid rgba(140,195,255,0.5);
                    animation: iwPulse 1.5s ease-in-out infinite; z-index: 10;
                }
            `}</style>
            <div ref={labelRef} className="iw-label" />
            
            <div style={{
                position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                pointerEvents: 'none', background: 'rgba(0,0,0,0.6)', padding: '6px 14px',
                borderRadius: '16px', color: '#ccc', fontSize: '11px'
            }}>
                💡 Drag an organ to interact.
            </div>
        </div>
    );
}
