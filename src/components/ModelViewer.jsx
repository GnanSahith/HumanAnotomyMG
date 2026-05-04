import React, { useState, useEffect, useRef } from 'react';
import '@google/model-viewer';

import InteractiveWrapper from './InteractiveWrapper';

export default function ModelViewer({ activeOrgan }) {
    const [isLoading, setIsLoading] = useState(false);
    const viewerRef = useRef(null);

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

    const isInteractiveGltf = activeOrgan?.modelSrc?.includes('Digestive System_01.glb');

    return (
        <div className="viewer-container glass-panel">
            {!activeOrgan && (
                <div className="empty-state" style={{ height: '100%', padding: '24px' }}>
                    <h2 style={{ color: 'var(--text-muted)' }}>Interactive 3D View</h2>
                    <p>Select an organ from the sidebar to inspect its 3D model.</p>
                </div>
            )}

            {activeOrgan && isInteractiveGltf && (
                <InteractiveWrapper />
            )}

            {activeOrgan && !isInteractiveGltf && (
                <>
                    {isLoading && (
                        <div className="loading-overlay">
                            <div className="loading-pulse" />
                        </div>
                    )}
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
                </>
            )}
        </div>
    );
}
