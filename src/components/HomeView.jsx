import React from 'react';
import * as Icons from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const HomeView = ({ systems, onSelectSystem }) => {
    const { t } = useLanguage();

    return (
        <div className="home-view">
            <div className="home-header">
                <h1>{t('Anatomical Systems')}</h1>
                <p>{t('Select a system to explore its structure and organs in 3D.')}</p>
            </div>

            <div className="systems-grid">
                {systems.map((system) => {
                    const IconComponent = Icons[system.iconName] || Icons.HelpCircle;

                    return (
                        <div
                            key={system.id}
                            className="system-card glass-panel"
                            onClick={() => onSelectSystem(system.id)}
                        >
                            <div className="system-card-header">
                                <div className="icon-wrapper">
                                    <IconComponent size={24} color="#0a84ff" />
                                </div>
                                <h3>{t(system.name)}</h3>
                            </div>
                            <p className="system-description">
                                {t(system.description)}
                            </p>
                            <div className="system-footer">
                                <span className="organ-count">
                                    {system.organs.length} {system.organs.length === 1 ? t('Organ') : t('Organs')}
                                </span>
                                <Icons.ChevronRight size={20} className="chevron" />
                            </div>
                        </div>
                    );
                })}

                {/* Interactive Cars Sub-Mesh Demo Card */}
                <div
                    className="system-card glass-panel fade-in-scale"
                    onClick={() => onSelectSystem('cars')}
                >
                    <div className="system-card-header">
                        <div className="icon-wrapper">
                            <Icons.Box size={24} color="#ff375f" />
                        </div>
                        <h3>{t('3D Interactive Testing')}</h3>
                    </div>
                    <p className="system-description">
                        {t('Phase 7 Test: Explore a fully interactable 3D environment with individual element grabbing (Three Boxes), built using React Three Fiber.')}
                    </p>
                    <div className="system-footer">
                        <span className="organ-count">
                            3 {t('Boxes')}
                        </span>
                        <Icons.ChevronRight size={20} className="chevron" />
                    </div>
                </div>

                {/* Interactive Digestive System Card */}
                <div
                    className="system-card glass-panel fade-in-scale"
                    onClick={() => onSelectSystem('digestive_interactive')}
                    style={{ background: 'linear-gradient(135deg, rgba(50, 215, 75, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)' }}
                >
                    <div className="system-card-header">
                        <div className="icon-wrapper">
                            <Icons.Apple size={24} color="#32d74b" />
                        </div>
                        <h3>{t('Interactive Digestive System')}</h3>
                    </div>
                    <p className="system-description">
                        {t('Explore a fully interactable, separated 3D model of the human digestive system with individual organ grabbing and physics.')}
                    </p>
                    <div className="system-footer">
                        <span className="organ-count">
                            {t('Interactive 3D')}
                        </span>
                        <Icons.ChevronRight size={20} className="chevron" />
                    </div>
                </div>

                {/* Human Anatomy Digestive System — Combined Panel */}
                <div
                    className="system-card glass-panel fade-in-scale"
                    onClick={() => onSelectSystem('digestive_combined')}
                    style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.07) 0%, rgba(0,0,0,0.45) 100%)', gridColumn: '1 / -1' }}
                >
                    <div className="system-card-header">
                        <div className="icon-wrapper">
                            <Icons.Layers size={24} color="#0a84ff" />
                        </div>
                        <h3>Human Anatomy — Digestive System</h3>
                    </div>
                    <p className="system-description">
                        The full experience: browse the organ list on the left, interact with the 3D model in the centre, and read detailed descriptions on the right — all in one unified panel.
                    </p>
                    <div className="system-footer">
                        <span className="organ-count" style={{ color: '#0a84ff' }}>
                            Combined View
                        </span>
                        <Icons.ChevronRight size={20} className="chevron" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeView;
