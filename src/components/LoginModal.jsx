import React, { useState } from 'react';
import { X, Lock, User, ArrowRight, Code, GraduationCap } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

const VALID_CREDENTIALS = [
    { username: 'CharanKumar@MG', password: 'Charan@MG' },
    { username: 'SandhyaRekha@MG', password: 'Sandhya@MG' },
    { username: 'GnanSahith@MG', password: 'Gnan@MG' },
    { username: 'VishnuKranthi@MG', password: 'Vishnu@MG' },
    { username: 'MyGnanAD', password: 'Charan@123' },
    { username: 'MGRoot01', password: 'MG@123' }
];

export default function LoginModal({ isOpen, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('student'); // 'administrator' or 'student'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleLogin = (e) => {
        e.preventDefault();
        const isValid = VALID_CREDENTIALS.some(
            (cred) => cred.username === username && cred.password === password
        );

        if (isValid) {
            setError('');
            onSuccess(username);
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '40px',
                width: '100%',
                maxWidth: '400px',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '20px', right: '20px',
                        background: 'rgba(255,255,255,0.1)', border: 'none',
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', cursor: 'pointer', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    <X size={18} />
                </button>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '16px' }}>
                    <button 
                        onClick={() => setActiveTab('student')}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                            background: activeTab === 'student' ? '#6B4EFF' : 'transparent',
                            color: activeTab === 'student' ? '#fff' : 'rgba(255,255,255,0.6)',
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <GraduationCap size={18} /> Student Mode
                    </button>
                    <button 
                        onClick={() => setActiveTab('administrator')}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                            background: activeTab === 'administrator' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: activeTab === 'administrator' ? '#fff' : 'rgba(255,255,255,0.6)',
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Code size={18} /> Administrator Mode
                    </button>
                </div>

                {activeTab === 'administrator' ? (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                <Code size={32} color="#fff" />
                            </div>
                            <h2 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '24px', fontWeight: 700 }}>Administrator Access</h2>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                                Use root credentials to bypass all restrictions.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>
                            <User size={18} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 16px 14px 44px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', color: '#fff', fontSize: '15px',
                                outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(107,78,255,0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>
                            <Lock size={18} />
                        </div>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 16px 14px 44px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', color: '#fff', fontSize: '15px',
                                outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(107,78,255,0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#ff4d4d', fontSize: '13px', textAlign: 'center', background: 'rgba(255,77,77,0.1)', padding: '8px', borderRadius: '8px' }}>
                            {error}
                        </div>
                    )}

                            <button 
                                type="submit"
                                style={{
                                    width: '100%', padding: '16px', marginTop: '8px',
                                    background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '12px', fontSize: '16px', fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                Root Login <ArrowRight size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0 -20px' }}>
                        <SignIn 
                            routing="hash" 
                            appearance={{
                                baseTheme: dark,
                                variables: {
                                    colorPrimary: '#6B4EFF',
                                    colorBackground: 'transparent',
                                    colorInputBackground: 'rgba(255,255,255,0.05)',
                                    colorInputText: '#fff',
                                    colorText: '#fff',
                                },
                                elements: {
                                    card: {
                                        boxShadow: 'none',
                                        background: 'transparent',
                                    },
                                    headerTitle: {
                                        fontSize: '24px',
                                        fontWeight: '700',
                                    },
                                    headerSubtitle: {
                                        color: 'rgba(255,255,255,0.6)',
                                    },
                                    socialButtonsBlockButton: {
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                        }
                                    },
                                    formButtonPrimary: {
                                        backgroundColor: '#6B4EFF',
                                        '&:hover': {
                                            backgroundColor: '#583bd6',
                                        }
                                    },
                                    footerActionText: {
                                        color: 'rgba(255,255,255,0.6)',
                                    },
                                    footerActionLink: {
                                        color: '#6B4EFF',
                                        '&:hover': {
                                            color: '#8b75ff',
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
