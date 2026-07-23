import React, { useState, useEffect } from 'react';
import { Settings, Smartphone, Monitor } from 'lucide-react';

export default function DeveloperPanel({ isMobileView, setIsMobileView }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLocalhost, setIsLocalhost] = useState(false);

    const [isIframe, setIsIframe] = useState(false);

    useEffect(() => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setIsLocalhost(true);
        }
        if (new URLSearchParams(window.location.search).get('mobile_sim') === 'true' || window.self !== window.top) {
            setIsIframe(true);
        }
    }, []);

    if (!isLocalhost || isIframe) return null;

    return (
        <div style={{
            position: 'fixed',
            right: isVisible ? '0' : '-200px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '200px',
            background: 'rgba(20, 20, 25, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRight: 'none',
            borderRadius: '16px 0 0 16px',
            padding: '20px',
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 99999,
            boxShadow: '-5px 0 25px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)'
        }}>
            <button
                onClick={() => setIsVisible(!isVisible)}
                style={{
                    position: 'absolute',
                    left: '-40px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    background: 'rgba(20, 20, 25, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '-5px 0 10px rgba(0,0,0,0.2)'
                }}
            >
                <Settings size={20} className={isVisible ? "rotate-90" : ""} style={{ transition: 'transform 0.3s' }} />
            </button>

            <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                Dev Tools
            </h3>

            <button
                onClick={() => setIsMobileView(!isMobileView)}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: isMobileView ? 'rgba(107,78,255,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isMobileView ? '#6B4EFF' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: isMobileView ? '#6B4EFF' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                }}
            >
                {isMobileView ? <Monitor size={16} /> : <Smartphone size={16} />}
                {isMobileView ? 'Desktop View' : 'Mobile View'}
            </button>
        </div>
    );
}
