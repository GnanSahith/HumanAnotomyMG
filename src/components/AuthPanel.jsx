import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Mail, Lock, CheckCircle2, Crown, Loader2, ArrowRight, User } from 'lucide-react';
import './AuthPanel.css'; // We will create this next

export default function AuthPanel({ standalone = false }) {
    const { user, isSubscribed, login, register, logout, simulatePayment } = useAuth();
    const { t } = useLanguage();

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [showReferral, setShowReferral] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLoginMode) {
                await login(email, password);
            } else {
                await register(email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            await simulatePayment();
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        return (
            <div className={`auth-panel glass-panel ${standalone ? 'standalone' : ''}`}>
                <div className="auth-header">
                    <div className="user-icon-wrapper">
                        <User size={24} />
                    </div>
                    <h3>{t('Account Dashboard')}</h3>
                </div>

                <div className="user-details">
                    <p className="welcome-text">{t('Welcome')}, <span className="user-name">{user.name}</span></p>
                    <p className="user-email">{user.email}</p>
                </div>

                <div className="subscription-status">
                    {isSubscribed ? (
                        <div className="status-active">
                            <CheckCircle2 className="status-icon" />
                            <span>{t('Active Premium Subscription')}</span>
                        </div>
                    ) : (
                        <div className="status-inactive">
                            <Crown className="status-icon" />
                            <span>{t('Free Account')}</span>
                            <p className="upgrade-prompt">{t('Unlock all 3D models and detailed explanations.')}</p>
                            <button
                                className="action-button premium-button"
                                onClick={handlePayment}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="spinner" size={18} /> : <span>{t('Upgrade Now — $9.99/mo')}</span>}
                            </button>
                        </div>
                    )}
                </div>

                <button className="text-button logout-button" onClick={logout}>
                    {t('Sign Out')}
                </button>
            </div>
        );
    }

    return (
        <div className={`auth-panel glass-panel ${standalone ? 'standalone' : ''}`}>
            <div className="auth-header">
                <h3>{isLoginMode ? t('Sign In') : t('Create Account')}</h3>
                <p>{t('Access premium interactive anatomy models.')}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                    <Mail className="input-icon" size={18} />
                    <input
                        type="email"
                        placeholder={t("Email Address")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <Lock className="input-icon" size={18} />
                    <input
                        type="password"
                        placeholder={t("Password")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="referral-section" style={{ marginTop: '-4px', marginBottom: '4px' }}>
                    <button 
                        type="button" 
                        className="text-button referral-toggle"
                        onClick={() => setShowReferral(!showReferral)}
                        style={{ fontSize: '13px', padding: '0', opacity: 0.8 }}
                    >
                        {t(showReferral ? 'Hide referral code' : 'Have a referral code?')}
                    </button>
                    {showReferral && (
                        <div className="input-group" style={{ marginTop: '12px' }}>
                            <input
                                type="text"
                                placeholder={t("Enter Referral Code (Optional)")}
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button
                    type="submit"
                    className="action-button submit-button"
                    disabled={loading || !email || !password}
                >
                    {loading ? <Loader2 className="spinner" size={18} /> : <span>{isLoginMode ? t('Sign In') : t('Register')}</span>}
                </button>
            </form>

            <div className="auth-footer">
                <p>
                    {isLoginMode ? t("Don't have an account?") : t("Already have an account?")}
                </p>
                <button
                    className="text-button switch-mode-button"
                    onClick={() => {
                        setIsLoginMode(!isLoginMode);
                        setError('');
                    }}
                >
                    {isLoginMode ? t('Sign Up') : t('Log In')} <ArrowRight size={14} className="ml-1" />
                </button>
            </div>
        </div>
    );
}
