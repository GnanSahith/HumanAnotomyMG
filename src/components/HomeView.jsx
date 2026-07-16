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
                {(systems || []).map((system) => {
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






            </div>
        </div>
    );
};

export default HomeView;
