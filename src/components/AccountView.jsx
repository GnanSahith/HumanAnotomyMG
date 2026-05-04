import React, { useState } from 'react';
import AuthPanel from './AuthPanel';
import { useLanguage } from '../LanguageContext';
import { Check, Star, Zap } from 'lucide-react';
import './AccountView.css';

export default function AccountView() {
    const { t } = useLanguage();
    const [selectedPlan, setSelectedPlan] = useState('yearly');

    return (
        <div className="account-view-container fade-in-scale">

            <div className="account-content-wrapper glass-panel">

                {/* Left Side: Pricing Models */}
                <div className="pricing-section">
                    <div className="pricing-header">
                        <h2>{t('Unlock Premium')}</h2>
                        <p>{t('Get full access to all 3D anatomical models, detailed physiological interactions, and expert descriptions.')}</p>
                    </div>

                    <div className="pricing-plans-container">
                        <div
                            className={`pricing-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                            onClick={() => setSelectedPlan('monthly')}
                        >
                            <div className="plan-name">{t('1 Month Pass')}</div>
                            <div className="plan-price">
                                <span className="currency">$</span>
                                <span className="amount">199</span>
                            </div>
                            <ul className="plan-features">
                                <li><Check size={16} className="feature-icon" /> {t('Full 3D Model Access')}</li>
                                <li><Check size={16} className="feature-icon" /> {t('Multi-language Support')}</li>
                                <li className="disabled"><Check size={16} className="feature-icon" /> {t('Priority Updates')}</li>
                            </ul>
                        </div>

                        <div
                            className={`pricing-card featured ${selectedPlan === 'yearly' ? 'selected' : ''}`}
                            onClick={() => setSelectedPlan('yearly')}
                        >
                            <div className="featured-badge"><Star size={12} className="mr-1" /> {t('Best Value')}</div>
                            <div className="plan-name">{t('1 Year Access')}</div>
                            <div className="plan-price">
                                <span className="currency">$</span>
                                <span className="amount">1199</span>
                                <span className="billing-period">/ {t('yr')}</span>
                            </div>
                            <ul className="plan-features">
                                <li><Check size={16} className="feature-icon" /> {t('Full 3D Model Access')}</li>
                                <li><Check size={16} className="feature-icon" /> {t('Multi-language Support')}</li>
                                <li><Check size={16} className="feature-icon" /> {t('Priority Updates')}</li>
                                <li><Check size={16} className="feature-icon" /> {t('Save 50% vs Monthly')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Forms */}
                <div className="auth-section-divider"></div>
                <div className="auth-section">
                    <AuthPanel standalone={true} />
                </div>

            </div>
        </div>
    );
}
