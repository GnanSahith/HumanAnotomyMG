import React, { useState } from 'react';
import { ArrowLeft, PlayCircle, Atom, Search, X, Lock } from 'lucide-react';
import physicsSimulations from '../data/physicsSimulations.json';
import { useLanguage } from '../LanguageContext';
import CustomPendulumLab from './simulations/CustomPendulumLab';
import CustomProjectileMotion from './simulations/CustomProjectileMotion';
import CustomForcesAndMotion from './simulations/CustomForcesAndMotion';

export default function PhysicsSimulationView({ onBack, handleLockedItemClick }) {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSimulation, setActiveSimulation] = useState(null);
    const [isLoadingSim, setIsLoadingSim] = useState(false);


    const filteredSimulations = Object.entries(physicsSimulations)
        .map(([id, sim]) => ({ ...sim, id }))
        .filter(sim => sim.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="maths-sim-container fade-in" style={{ 
            paddingBottom: activeSimulation ? '0' : '100px', 
            flex: 1, 
            minHeight: 0,
            overflowY: activeSimulation ? 'hidden' : 'auto', 
            display: activeSimulation ? 'flex' : 'block', 
            flexDirection: activeSimulation ? 'column' : 'unset' 
        }}>
            {!activeSimulation && (
                <div className="maths-header glass-panel" style={{ padding: '24px', margin: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <button 
                                onClick={onBack}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '8px 16px', borderRadius: '100px',
                                    color: '#fff', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                            >
                                <ArrowLeft size={18} /> {t('Back to Portal')}
                            </button>
                            <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Atom size={36} color="#bf5af2" />
                                {t('Physics Interactive Library')}
                            </h1>
                        </div>
                    </div>

                    <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                        <Search size={20} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            placeholder={t("Explore our growing collection of interactive physics simulations covering Mechanics, Waves, Thermodynamics, Electricity, and Quantum Phenomena...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px 20px 16px 48px',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                color: '#fff',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ff375f'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                </div>
            )}

            {activeSimulation ? (
                <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }} className="fade-in">
                    {!activeSimulation.isNative && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ padding: '8px', background: 'rgba(191,90,242,0.2)', borderRadius: '12px', border: '1px solid rgba(191,90,242,0.3)' }}>
                                    <Atom size={24} color="#bf5af2" />
                                </div>
                                <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600 }}>{activeSimulation.title}</h2>
                            </div>
                            <button 
                                onClick={() => setActiveSimulation(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '8px 16px', borderRadius: '100px',
                                    color: '#fff', cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: 500
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 55, 95, 0.8)'; e.currentTarget.style.borderColor = '#ff375f'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                            >
                                <ArrowLeft size={16} /> Back to Library
                            </button>
                        </div>
                    )}
                    
                    {/* The Simulation Container */}
                    <div style={{
                        flex: 1,
                        minHeight: 0,
                        width: '100%',
                        background: '#000',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* We use a wrapper with aspect-ratio to keep it constrained neatly regardless of screen size */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative'
                        }}>
                        {activeSimulation.isNative ? (
                            activeSimulation.id === 'phys_1_mg' ? <CustomProjectileMotion onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_2_mg' ? <CustomForcesAndMotion onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            <CustomPendulumLab onBack={() => setActiveSimulation(null)} title={activeSimulation.title} />
                        ) : (
                            <>
                                <iframe 
                                    src={activeSimulation.url} 
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 'none' }}
                                    allowFullScreen
                                    title={activeSimulation.title}
                                ></iframe>
                                
                                {/* Hides the PhET logo in the bottom right corner */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '160px',
                                    height: '45px',
                                    background: '#000',
                                    zIndex: 10
                                }}></div>
                            </>
                        )}

                        {/* Loading Screen Overlay to hide PhET splash screen */}
                        {isLoadingSim && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                                zIndex: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff'
                            }}>
                                <Atom size={64} color="#bf5af2" style={{ marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
                                <h3 style={{ fontSize: '24px', margin: '0 0 8px 0', fontWeight: 600 }}>Loading Engine...</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Initializing interactive physics simulation</p>
                                
                                <div style={{ 
                                    width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', 
                                    borderRadius: '100px', marginTop: '32px', overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        width: '100%', height: '100%', background: '#ff375f',
                                        animation: 'loadingBar 4.5s linear forwards'
                                    }}></div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            ) : (

                <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    {Object.entries(
                        filteredSimulations.reduce((acc, sim) => {
                            if (!acc[sim.category]) acc[sim.category] = [];
                            acc[sim.category].push(sim);
                            return acc;
                        }, {})
                    ).map(([category, sims]) => (
                        <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                                <div style={{ width: '4px', height: '24px', background: '#bf5af2', borderRadius: '4px' }}></div>
                                <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600 }}>{category}</h2>
                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{sims.length} Simulations</span>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '24px'
                            }}>
                                {sims.map((sim, index) => {
                                    const isLocked = index >= 2;
                                    return (
                                        <div 
                                            key={sim.id}
                                            className="glass-panel"
                                            onClick={() => {
                                                const openSim = () => {
                                                    setActiveSimulation(sim);
                                                    setIsLoadingSim(true);
                                                    setTimeout(() => setIsLoadingSim(false), 4500);
                                                };
                                                if (isLocked) {
                                                    handleLockedItemClick(openSim);
                                                } else {
                                                    openSim();
                                                }
                                            }}
                                            style={{
                                                borderRadius: '24px',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(0,0,0,0.2)',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 55, 95, 0.2)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 55, 95, 0.5)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                            }}
                                        >
                                        <div style={{ height: '180px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(191,90,242,0.05) 0%, rgba(191,90,242,0.2) 100%)' }}>
                                            <div style={{ 
                                                position: 'absolute', top: '-20%', right: '-10%', 
                                                width: '150px', height: '150px', borderRadius: '50%',
                                                background: 'radial-gradient(circle, rgba(191,90,242,0.4) 0%, rgba(0,0,0,0) 70%)',
                                                filter: 'blur(20px)'
                                            }}></div>
                                            <div style={{ 
                                                position: 'absolute', bottom: '-20%', left: '-10%', 
                                                width: '200px', height: '200px', borderRadius: '50%',
                                                background: 'radial-gradient(circle, rgba(10,132,255,0.2) 0%, rgba(0,0,0,0) 70%)',
                                                filter: 'blur(30px)'
                                            }}></div>
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Atom size={64} color="rgba(191,90,242,0.8)" style={{ filter: 'drop-shadow(0 0 10px rgba(191,90,242,0.5))' }} />
                                            </div>
                                            
                                            {/* Scaled image to crop out edge watermarks */}
                                            <img 
                                                src={sim.thumbnail} 
                                                alt={sim.title} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1, transform: 'scale(1.15)', pointerEvents: 'none' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            
                                            {/* Secondary edge blur to obscure any remaining watermarks */}
                                            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '120px', height: '50px', background: '#000', filter: 'blur(15px)', zIndex: 2, opacity: 0.7 }}></div>

                                            {isLocked && (
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                                    zIndex: 4, display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                }}>
                                                    <Lock size={32} color="#fff" />
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', background: 'var(--accent)', padding: '4px 12px', borderRadius: '100px' }}>Premium Access</span>
                                                </div>
                                            )}

                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                background: 'rgba(0,0,0,0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s',
                                                zIndex: 3
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                            >
                                                <PlayCircle size={64} color="#fff" />
                                            </div>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff', fontWeight: 600 }}>{sim.title}</h3>
                                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {sim.description}
                                            </p>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

            )}
        </div>
    );
}
