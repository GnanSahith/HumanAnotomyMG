import React, { useState } from 'react';
import { X, Lock, User, ArrowRight, Code, GraduationCap, Mail } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { mockStudents } from '../data/mockStudents';

const VALID_CREDENTIALS = [
    { username: 'CharanKumar@MG', password: 'Charan@MG' },
    { username: 'SandhyaRekha@MG', password: 'Sandhya@MG' },
    { username: 'GnanSahith@MG', password: 'Gnan@MG' },
    { username: 'VishnuKranthi@MG', password: 'Vishnu@MG' },
    { username: 'MyGnanAD', password: 'Charan@123' },
    { username: 'MGRoot01', password: 'MG@123' }
];

export default function LoginModal({ isOpen, onClose, onSuccess, defaultTab = 'student' }) {
    const [activeTab, setActiveTab] = useState(defaultTab); // 'administrator' or 'student'
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset tab if defaultTab changes when modal opens
    React.useEffect(() => {
        if (isOpen) setActiveTab(defaultTab);
    }, [isOpen, defaultTab]);

    if (!isOpen) return null;

    const handleLogin = async (e) => {
        e.preventDefault();
        const isValid = VALID_CREDENTIALS.some(
            (cred) => cred.username === username && cred.password === password
        );

        if (isValid) {
            setError('');
            setLoading(true);
            const mockEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@admin.local`;
            try {
                const sessionToken = Date.now().toString() + Math.random().toString(36).substring(2);
                localStorage.setItem('current_session_id', sessionToken);
                
                await signInWithEmailAndPassword(auth, mockEmail, password);
                await setDoc(doc(db, 'users', username), {
                    currentSessionId: sessionToken,
                    lastLogin: new Date().toISOString()
                }, { merge: true });
                onSuccess(username);
            } catch (err) {
                try {
                    const sessionToken = Date.now().toString() + Math.random().toString(36).substring(2);
                    localStorage.setItem('current_session_id', sessionToken);
                    
                    await createUserWithEmailAndPassword(auth, mockEmail, password);
                    await setDoc(doc(db, 'users', username), {
                        role: 'admin',
                        createdAt: new Date().toISOString(),
                        currentSessionId: sessionToken,
                        lastLogin: new Date().toISOString()
                    }, { merge: true });
                    onSuccess(username);
                } catch (regErr) {
                    onSuccess(username);
                }
            } finally {
                setLoading(false);
            }
        } else {
            setError('Invalid username or password');
        }
    };

    const handleStudentAuth = async (e) => {
        e.preventDefault();
        setError('');

        const isMockStudent = mockStudents.find(s => s.username === email && s.password === password);
        if (isMockStudent) {
            setLoading(true);
            const mockEmail = `${isMockStudent.username.toLowerCase()}@student.local`;
            try {
                const sessionToken = Date.now().toString() + Math.random().toString(36).substring(2);
                localStorage.setItem('current_session_id', sessionToken);
                
                await signInWithEmailAndPassword(auth, mockEmail, isMockStudent.password);
                await setDoc(doc(db, 'users', isMockStudent.username), {
                    currentSessionId: sessionToken,
                    lastLogin: new Date().toISOString()
                }, { merge: true });
                onSuccess(isMockStudent.username);
            } catch (err) {
                try {
                    const sessionToken = Date.now().toString() + Math.random().toString(36).substring(2);
                    localStorage.setItem('current_session_id', sessionToken);
                    
                    await createUserWithEmailAndPassword(auth, mockEmail, isMockStudent.password);
                    await setDoc(doc(db, 'users', isMockStudent.username), {
                        email: mockEmail,
                        role: 'student',
                        createdAt: new Date().toISOString(),
                        currentSessionId: sessionToken,
                        lastLogin: new Date().toISOString()
                    });
                    onSuccess(isMockStudent.username);
                } catch (regErr) {
                    onSuccess(isMockStudent.username);
                }
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            if (isRegistering) {
                const sessionToken = Date.now().toString() + Math.random().toString(36).substring(2);
                localStorage.setItem('current_session_id', sessionToken);
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: email,
                    role: 'student',
                    createdAt: new Date().toISOString(),
                    currentSessionId: sessionToken,
                    lastLogin: new Date().toISOString()
                });
                onSuccess(userCredential.user.email);
            } else {
                const sessionToken = Date.now().toString() + Math.random().toString(36).substring(2);
                localStorage.setItem('current_session_id', sessionToken);
                
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    currentSessionId: sessionToken,
                    lastLogin: new Date().toISOString()
                }, { merge: true });
                onSuccess(userCredential.user.email);
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
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
                    <div style={{ padding: '0 20px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(107,78,255,0.2) 0%, rgba(107,78,255,0.05) 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', border: '1px solid rgba(107,78,255,0.3)'
                            }}>
                                <GraduationCap size={32} color="#6B4EFF" />
                            </div>
                            <h2 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '24px', fontWeight: 700 }}>
                                {isRegistering ? 'Create Account' : 'Student Login'}
                            </h2>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                                Access your personalized learning dashboard
                            </p>
                        </div>

                        <form onSubmit={handleStudentAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>
                                    <Mail size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Student Email or Username" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
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
                                    required
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
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '16px', marginTop: '8px',
                                    background: '#6B4EFF', color: '#fff', border: 'none',
                                    borderRadius: '12px', fontSize: '16px', fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
                                    opacity: loading ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = '#583bd6' }}
                                onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = '#6B4EFF' }}
                            >
                                {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')} <ArrowRight size={18} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsRegistering(!isRegistering)}
                                style={{
                                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer', fontSize: '14px', marginTop: '8px',
                                    textDecoration: 'underline'
                                }}
                            >
                                {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
