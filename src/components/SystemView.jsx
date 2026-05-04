import React, { useState } from 'react';
import { ChevronLeft, Box, Menu, X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function SystemView({ system, onBack, onSelectOrgan, activeOrganId }) {
    const { t } = useLanguage();
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    if (!system) return null;

    return (
        <div className="system-view">
            {/* iOS Style Header */}
            <div className="ios-header glass-panel">
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                    <span>{t('Systems')}</span>
                </button>
                <h2>{t(system.name)}</h2>
                <div style={{ width: 80, display: 'flex', justifyContent: 'flex-end' }}>
                    {activeOrganId && (
                        <button className="mobile-toggle-btn" onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
                            {showMobileSidebar ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    )}
                </div>
            </div>

            <div className={`system-layout ${activeOrganId ? 'organ-active' : ''} ${showMobileSidebar ? 'mobile-sidebar-open' : ''}`}>
                {/* Organs Sidebar Menu */}
                <aside className="system-sidebar glass-panel">
                    <div className="sidebar-header">
                        <h3>{t('Organs')}</h3>
                    </div>
                    <ul className="organ-list">
                        {system.organs.length === 0 ? (
                            <li className="empty-organs">{t('No organs listed yet.')}</li>
                        ) : (
                            system.organs.map((organ) => {
                                const isActive = organ.id === activeOrganId;
                                return (
                                    <li key={organ.id}>
                                        <button
                                            className={`organ-btn ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                onSelectOrgan(organ.id);
                                                setShowMobileSidebar(false);
                                            }}
                                        >
                                            <div className="icon-wrapper">
                                                {organ.modelSrc ? <Box size={18} /> : <div className="dot" />}
                                            </div>
                                            <div className="organ-btn-text">
                                                <span className="name">{t(organ.name).replace(' (Model Coming Soon)', '')}</span>
                                                {!organ.modelSrc && <span className="badge">{t('Soon')}</span>}
                                            </div>
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </aside>

                {/* Info Panel when no organ is selected */}
                {!activeOrganId && (
                    <div className="system-overview glass-panel">
                        <div className="system-overview-header">
                            <div className="system-hero-icon">
                                {/* Icon injection handled in parent usually, fallback here */}
                                <div className="glow-circle" />
                            </div>
                            <div className="system-overview-title">
                                <h1>{t(system.name)}</h1>
                                <p className="system-desc">{t(system.description)}</p>
                            </div>
                        </div>

                        <div className="system-organs-section">
                            <h3>{t('Organs in this System')}</h3>
                            {system.organs.length === 0 ? (
                                <div className="hint-card" style={{ marginTop: 16 }}>
                                    <span>{t('No organs listed yet. Check back later!')}</span>
                                </div>
                            ) : (
                                <div className="overview-organ-grid">
                                    {system.organs.map((organ) => (
                                        <div
                                            key={organ.id}
                                            className="overview-organ-card glass-panel"
                                            onClick={() => onSelectOrgan(organ.id)}
                                        >
                                            <div className="overview-organ-header">
                                                <h4>{t(organ.name).replace(' (Model Coming Soon)', '')}</h4>
                                                {!organ.modelSrc && <span className="badge">{t('Soon')}</span>}
                                            </div>
                                            <p className="overview-organ-desc">{t(organ.description)}</p>
                                            <div className="overview-organ-footer">
                                                <span>{t('View 3D Model & Details')}</span>
                                                <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}            </div>
        </div>
    );
}
