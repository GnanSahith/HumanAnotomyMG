import React from 'react';
import { ArrowLeft, CheckCircle2, Crown, Sparkles } from 'lucide-react';

export default function PricingView({ onBack }) {
    return (
        <div className="system-container fade-in-scale" style={{ 
            display: 'flex', flexDirection: 'column', height: '100vh', 
            background: 'var(--bg-primary)', overflowY: 'auto', paddingTop: '135px'
        }}>
            <div className="player-header">
                <button className="icon-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2>Unlock Full Access</h2>
                <div style={{width: '40px'}}></div>
            </div>

            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center',
                padding: '40px 20px', gap: '40px'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(90deg, rgba(107,78,255,0.1), rgba(0,212,255,0.1))',
                        padding: '8px 16px', borderRadius: '100px', marginBottom: '16px',
                        border: '1px solid rgba(107,78,255,0.2)', color: 'var(--accent)'
                    }}>
                        <Sparkles size={16} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Premium Student Mode</span>
                    </div>
                    <h1 style={{ fontSize: '36px', marginBottom: '16px', background: 'linear-gradient(90deg, #fff, #a5a5a5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Master Every Simulation
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
                        Upgrade your account to unlock all 3D anatomical models, advanced physics simulations, complex chemical reactions, and interactive mathematics modules.
                    </p>
                </div>

                <div style={{
                    display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '900px'
                }}>
                    {/* Monthly Plan */}
                    <div className="glass-panel" style={{
                        width: '320px', padding: '32px', borderRadius: '24px',
                        display: 'flex', flexDirection: 'column', position: 'relative',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#fff' }}>Monthly Plan</h3>
                        <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Billed every month</p>
                        
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
                            <span style={{ fontSize: '42px', fontWeight: 700, color: '#fff' }}>₹199</span>
                            <span style={{ color: 'var(--text-secondary)' }}>/mo</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
                            {['Access to all subjects', 'Full 3D anatomy suite', 'Regular content updates', 'Cancel anytime'].map(feat => (
                                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircle2 size={18} color="var(--accent)" />
                                    <span style={{ color: '#fff', fontSize: '15px' }}>{feat}</span>
                                </div>
                            ))}
                        </div>

                        <button style={{
                            width: '100%', padding: '16px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.1)', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)', fontSize: '16px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onClick={() => alert("Payment Gateway Integration Pending (Stripe/Razorpay)")}
                        >
                            Subscribe Monthly
                        </button>
                    </div>

                    {/* Yearly Plan */}
                    <div className="glass-panel" style={{
                        width: '320px', padding: '32px', borderRadius: '24px',
                        display: 'flex', flexDirection: 'column', position: 'relative',
                        border: '1px solid var(--accent)', background: 'linear-gradient(180deg, rgba(107,78,255,0.1) 0%, rgba(0,0,0,0) 100%)',
                        boxShadow: '0 20px 40px rgba(107,78,255,0.15)', overflow: 'visible'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--accent)', color: '#fff', padding: '4px 16px',
                            borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 12px rgba(107,78,255,0.4)'
                        }}>
                            <Crown size={14} /> MOST POPULAR
                        </div>

                        <h3 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#fff' }}>Yearly Plan</h3>
                        <p style={{ margin: '0 0 24px 0', color: 'var(--accent)', fontSize: '14px', fontWeight: 500 }}>Save over 15% instantly!</p>
                        
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
                            <span style={{ fontSize: '42px', fontWeight: 700, color: '#fff' }}>₹1999</span>
                            <span style={{ color: 'var(--text-secondary)' }}>/yr</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
                            {['Access to all subjects', 'Full 3D anatomy suite', 'Regular content updates', 'Priority support included'].map(feat => (
                                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircle2 size={18} color="var(--accent)" />
                                    <span style={{ color: '#fff', fontSize: '15px' }}>{feat}</span>
                                </div>
                            ))}
                        </div>

                        <button style={{
                            width: '100%', padding: '16px', borderRadius: '12px',
                            background: 'var(--accent)', color: '#fff',
                            border: 'none', fontSize: '16px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(107,78,255,0.3)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(107,78,255,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(107,78,255,0.3)'; }}
                        onClick={() => alert("Payment Gateway Integration Pending (Stripe/Razorpay)")}
                        >
                            Subscribe Yearly
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
