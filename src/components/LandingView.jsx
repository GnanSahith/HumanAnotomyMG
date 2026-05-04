import React, { useState } from 'react';
import { Microscope, FlaskConical, Atom, Sigma, ArrowRight, BookOpen } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function LandingView({ onEnter }) {
    const { t } = useLanguage();
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const handleBiologyClick = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onEnter('biology');
        }, 600); // Matches standard fade out
    };

    const handleMathsClick = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onEnter('maths');
        }, 600);
    };

    return (
        <div className={`mygnan-container ${isAnimatingOut ? 'fade-out' : ''}`}>
            {/* Application Dashboard Grid */}
            <div className="mygnan-grid">
                
                {/* BIOLOGY - The active application portal */}
                <div className="mygnan-card glass-panel mygnan-card-active" onClick={handleBiologyClick}>
                    <div className="mygnan-card-header">
                        <div className="mygnan-icon-container">
                            <Microscope size={38} color="#0a84ff" />
                        </div>
                        <div style={{ background: 'rgba(10,132,255,0.2)', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(10,132,255,0.3)' }}>
                            Active Module <ArrowRight size={14} />
                        </div>
                    </div>
                    <div className="mygnan-title">
                        <h2>{t('Biology')}</h2>
                        <p>{t('Interactive 3D Human Anatomy & Digestive Physics.')}</p>
                    </div>
                </div>

                {/* CHEMISTRY - Coming Soon */}
                <div className="mygnan-card glass-panel mygnan-card-soon">
                    <div className="mygnan-card-header">
                        <div className="mygnan-icon-container" style={{ filter: 'grayscale(100%)', opacity: 0.5 }}>
                            <FlaskConical size={38} color="#ff375f" />
                        </div>
                        <div className="mygnan-badge-soon">Coming Soon</div>
                    </div>
                    <div className="mygnan-title">
                        <h2>{t('Chemistry')}</h2>
                        <p>{t('Explore molecular structures and real-time interactive chemical reactions.')}</p>
                    </div>
                </div>

                {/* PHYSICS - Coming Soon */}
                <div className="mygnan-card glass-panel mygnan-card-soon">
                    <div className="mygnan-card-header">
                        <div className="mygnan-icon-container" style={{ filter: 'grayscale(100%)', opacity: 0.5 }}>
                            <Atom size={38} color="#bf5af2" />
                        </div>
                        <div className="mygnan-badge-soon">Coming Soon</div>
                    </div>
                    <div className="mygnan-title">
                        <h2>{t('Physics')}</h2>
                        <p>{t('Simulate kinematic physics, electromagnetism, and orbital mechanics in 3D.')}</p>
                    </div>
                </div>

                {/* MATHS - Active Simulation Portal */}
                <div className="mygnan-card glass-panel mygnan-card-active" onClick={handleMathsClick}>
                    <div className="mygnan-card-header">
                        <div className="mygnan-icon-container">
                            <Sigma size={38} color="#ffd60a" />
                        </div>
                        <div style={{ background: 'rgba(255,214,10,0.2)', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(255,214,10,0.3)' }}>
                            Active Module <ArrowRight size={14} />
                        </div>
                    </div>
                    <div className="mygnan-title">
                        <h2>{t('Mathematics')}</h2>
                        <p>{t('Interactive Adding Adjacent Angles Geometry Simulation.')}</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
