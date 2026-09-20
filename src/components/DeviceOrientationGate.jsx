import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { createPortal } from 'react-dom';

export default function DeviceOrientationGate({ children }) {
    const { t } = useLanguage();
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const isNarrow = window.innerWidth <= 900;
            const isPortraitAspect = window.innerHeight > window.innerWidth;
            setIsPortrait(isNarrow && isPortraitAspect);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    return (
        <>
            {children}
            {isPortrait && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.98)',
                    zIndex: 999999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px',
                    textAlign: 'center',
                    color: '#fff',
                    backdropFilter: 'blur(20px)'
                }}>
                    <div className="rotate-device-icon" style={{ marginBottom: '32px' }}>
                        <Smartphone size={80} color="#bf5af2" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
                        {t('Rotate Your Device')}
                    </h2>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', maxWidth: '300px' }}>
                        {t('This highly interactive simulation requires a wider screen. Please rotate your device to landscape mode (16:9) to continue.')}
                    </p>
                    <style>
                        {`
                        @keyframes tilt-phone {
                            0% { transform: rotate(0deg); }
                            25% { transform: rotate(-90deg); }
                            75% { transform: rotate(-90deg); }
                            100% { transform: rotate(0deg); }
                        }
                        .rotate-device-icon {
                            animation: tilt-phone 3s ease-in-out infinite;
                        }
                        `}
                    </style>
                </div>,
                document.body
            )}
        </>
    );
}
