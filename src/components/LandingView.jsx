import React, { useState } from 'react';
import { Microscope, FlaskConical, Atom, Sigma, ArrowRight, BookOpen } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function LandingView({ onEnter, loggedInUsername }) {
    const { t } = useLanguage();
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const isRestrictedUser = loggedInUsername === 'MyGnanAD';

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

    const handleChemistryClick = () => {
        if (isRestrictedUser) {
            alert("Access restricted for this user.");
            return;
        }
        setIsAnimatingOut(true);
        setTimeout(() => {
            onEnter('chemistry');
        }, 600);
    };

    const handlePhysicsClick = () => {
        if (isRestrictedUser) {
            alert("Access restricted for this user.");
            return;
        }
        setIsAnimatingOut(true);
        setTimeout(() => {
            onEnter('physics');
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

                {/* CHEMISTRY - Active Simulation Portal */}
                <div className={`mygnan-card glass-panel ${isRestrictedUser ? 'locked' : 'mygnan-card-active'}`} onClick={handleChemistryClick} style={{ opacity: isRestrictedUser ? 0.5 : 1, cursor: isRestrictedUser ? 'not-allowed' : 'pointer' }}>
                    <div className="mygnan-card-header">
                        <div className="mygnan-icon-container">
                            <FlaskConical size={38} color="#ff375f" />
                        </div>
                        <div style={{ background: isRestrictedUser ? 'rgba(255,255,255,0.1)' : 'rgba(255,55,95,0.2)', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', color: isRestrictedUser ? 'rgba(255,255,255,0.5)' : '#fff', fontSize: '13px', fontWeight: 600, border: isRestrictedUser ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,55,95,0.3)' }}>
                            {isRestrictedUser ? 'Locked' : 'Active Module'} {isRestrictedUser ? null : <ArrowRight size={14} />}
                        </div>
                    </div>
                    <div className="mygnan-title">
                        <h2>{t('Chemistry')}</h2>
                        <p>{t('Explore molecular structures and real-time interactive chemical reactions.')}</p>
                    </div>
                </div>

                {/* PHYSICS - Active Simulation Portal */}
                <div className={`mygnan-card glass-panel ${isRestrictedUser ? 'locked' : 'mygnan-card-active'}`} onClick={handlePhysicsClick} style={{ opacity: isRestrictedUser ? 0.5 : 1, cursor: isRestrictedUser ? 'not-allowed' : 'pointer' }}>
                    <div className="mygnan-card-header">
                        <div className="mygnan-icon-container">
                            <Atom size={38} color="#bf5af2" />
                        </div>
                        <div style={{ background: isRestrictedUser ? 'rgba(255,255,255,0.1)' : 'rgba(191,90,242,0.2)', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', color: isRestrictedUser ? 'rgba(255,255,255,0.5)' : '#fff', fontSize: '13px', fontWeight: 600, border: isRestrictedUser ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(191,90,242,0.3)' }}>
                            {isRestrictedUser ? 'Locked' : 'Active Module'} {isRestrictedUser ? null : <ArrowRight size={14} />}
                        </div>
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
