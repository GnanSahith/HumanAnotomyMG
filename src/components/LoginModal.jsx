import React, { useState } from 'react';
import { X, Lock, User, ArrowRight } from 'lucide-react';

const VALID_CREDENTIALS = [
    { username: 'user1', password: 'password1' },
    { username: 'user2', password: 'password1' },
    { username: 'user3', password: 'password1' },
    { username: 'user4', password: 'password1' },
    { username: 'user5', password: 'password1' },
];

export default function LoginModal({ isOpen, onClose, onSuccess }) {
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
            onSuccess();
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

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(107,78,255,0.2) 0%, rgba(107,78,255,0.05) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', border: '1px solid rgba(107,78,255,0.3)'
                    }}>
                        <Lock size={32} color="#6B4EFF" />
                    </div>
                    <h2 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '24px', fontWeight: 700 }}>Exclusive Access</h2>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                        Please enter your credentials to access the simulation library.
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
                            background: '#6B4EFF', color: '#fff', border: 'none',
                            borderRadius: '12px', fontSize: '16px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '8px', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#583bd6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#6B4EFF'}
                    >
                        Login <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
