import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { Zap, Trophy, XCircle, CheckCircle, Play } from 'lucide-react';
import { systemsData } from '../data';


const cleanName = (raw) => (raw || 'Organ').replace(/_01/g, '').replace(/_/g, ' ');

export default function DetailsView({ activeOrgan, activeSystem }) {
    const { t } = useLanguage();

    const [heldOrganMeshName, setHeldOrganMeshName] = useState(null);
    const [lastHeldOrganMeshName, setLastHeldOrganMeshName] = useState(null);

    useEffect(() => {
        const handleHeld = (e) => {
            setHeldOrganMeshName(e.detail);
            setLastHeldOrganMeshName(e.detail);
        };
        const handleReleased = () => {
            setHeldOrganMeshName(null);
        };
        window.addEventListener('ORGAN_HELD', handleHeld);
        window.addEventListener('ORGAN_RELEASED', handleReleased);
        return () => {
            window.removeEventListener('ORGAN_HELD', handleHeld);
            window.removeEventListener('ORGAN_RELEASED', handleReleased);
        };
    }, []);
    
    // Quiz State Variables
    const [quizState, setQuizState] = useState('idle');
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [userChoice, setUserChoice] = useState(null);

    // Video State
    const [showVideo, setShowVideo] = useState(false);

    // Sync active mesh glow state globally whenever question changes
    useEffect(() => {
        if (quizState === 'active' || quizState === 'answered') {
            const target = quizQuestions[currentQuestionIdx]?.targetMeshName;
            if (target) {
                window.dispatchEvent(new CustomEvent('SET_QUIZ_TARGET', { detail: target }));
            }
        } else {
            window.dispatchEvent(new CustomEvent('SET_QUIZ_TARGET', { detail: null }));
        }
    }, [quizState, currentQuestionIdx, quizQuestions]);

    if (!activeOrgan) {
        return (
            <div className="detail-panel glass-panel" style={{ opacity: 0.5 }}>
                <div className="empty-state">
                    <p>{t('Select an organ to view more details.')}</p>
                </div>
            </div>
        );
    }

    const isFullSystem = activeOrgan.id.endsWith('_entire');

    const handleStartQuiz = () => {
        if (!window.activeValidMeshes || window.activeValidMeshes.length === 0) {
            alert("3D model is still loading. Please wait a moment!");
            return;
        }

        const validMeshes = window.activeValidMeshes.filter(m => {
            if (m.includes('Boxes') || m.includes('System') || m.includes('Human Skeleton') || m.includes('Skull') || m.includes('Rotten Brain')) return false;
            
            // Only allow meshes that map to a known organ in our data
            const mappedOrgan = activeSystem.organs.find(o => 
                (o.modelSrc && o.modelSrc.includes(m)) || 
                (o.name.en.toLowerCase() === cleanName(m).toLowerCase())
            );
            return !!mappedOrgan;
        });
        
        let qs = [];
        for (let i = 0; i < 10; i++) {
            const targetMesh = validMeshes[Math.floor(Math.random() * validMeshes.length)];
            const targetOrgan = activeSystem.organs.find(o => (o.modelSrc && o.modelSrc.includes(targetMesh)) || o.name.en.toLowerCase() === cleanName(targetMesh).toLowerCase());
            
            const isFunctionality = Math.random() > 0.5 && targetOrgan?.description?.en;
            
            let options = [];
            while(options.length < 3) {
                const randomMesh = validMeshes[Math.floor(Math.random() * validMeshes.length)];
                if (randomMesh !== targetMesh && !options.some(o => o.mesh === randomMesh)) {
                    options.push({ mesh: randomMesh });
                }
            }
            options.push({ mesh: targetMesh, isCorrect: true });
            options.sort(() => Math.random() - 0.5);
            
            const formattedOptions = options.map(opt => {
                const optOrgan = activeSystem.organs.find(o => (o.modelSrc && o.modelSrc.includes(opt.mesh)) || o.name.en.toLowerCase() === cleanName(opt.mesh).toLowerCase());
                
                let label = optOrgan ? optOrgan.name.en : cleanName(opt.mesh);
                if (isFunctionality && optOrgan && optOrgan.description && optOrgan.description.en) {
                    let desc = optOrgan.description.en.replace(/Scientific\s+Name:.*?Description:\s*/i, '').replace(/[-]+Page \(\d+\) Break[-]+/g, '').trim();
                    label = desc.length > 85 ? desc.substring(0, 85) + '...' : desc;
                }
                return { ...opt, label };
            });

            qs.push({
                targetMeshName: targetMesh,
                questionType: isFunctionality ? 'function' : 'name',
                questionText: isFunctionality ? 'What is the primary function of this highlighted part?' : 'What is this highlighted part?',
                options: formattedOptions
            });
        }
        
        setQuizQuestions(qs);
        setCurrentQuestionIdx(0);
        setScore(0);
        setUserChoice(null);
        setQuizState('active');
    };

    const handleOptionSelect = (opt) => {
        if (quizState !== 'active') return;
        setUserChoice(opt);
        if (opt.isCorrect) setScore(s => s + 1);
        setQuizState('answered');
    };

    const handleNextQuestion = () => {
        if (currentQuestionIdx < 9) {
            setCurrentQuestionIdx(i => i + 1);
            setUserChoice(null);
            setQuizState('active');
        } else {
            setQuizState('results');
        }
    };

    useEffect(() => {
        if (quizState === 'active' || quizState === 'answered') {
            const currentQ = quizQuestions[currentQuestionIdx];
            if (currentQ && currentQ.targetMeshName) {
                window.dispatchEvent(new CustomEvent('QUIZ_HIGHLIGHT_PART', { detail: currentQ.targetMeshName }));
            }
        } else {
            window.dispatchEvent(new CustomEvent('QUIZ_HIGHLIGHT_PART', { detail: null }));
        }
    }, [quizState, currentQuestionIdx, quizQuestions]);

    // Render Quiz Interface when Active
    if (isFullSystem && quizState !== 'idle') {
        return (
            <div className="detail-panel glass-panel fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
                {quizState === 'results' ? (
                    <div style={{ textAlign: 'center', padding: '10px', marginTop: 'auto', marginBottom: 'auto' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(10,132,255,0.2)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={32} color="#0a84ff" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '22px', marginBottom: '8px' }}>Challenge Completed!</h3>
                        <p style={{ margin: 0, opacity: 0.8, marginBottom: '24px', fontSize: '15px' }}>
                            You discovered and matched <strong style={{ color: '#30d158', fontSize: '18px' }}>{score}</strong> out of 10 perfectly.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={handleStartQuiz} style={{ background: '#0a84ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={16}/> Try Again</button>
                            <button onClick={() => setQuizState('idle')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff9f0a', fontWeight: 800 }}>
                                Question {currentQuestionIdx + 1} of 10
                            </div>
                            <button onClick={() => setQuizState('idle')} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', padding: 0 }}>
                                <XCircle size={18} />
                            </button>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', lineHeight: 1.4, color: '#fff' }}>
                            {quizQuestions[currentQuestionIdx].questionText}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                            {quizQuestions[currentQuestionIdx].options.map((opt, i) => {
                                let bg = 'rgba(255,255,255,0.06)';
                                let border = '1px solid rgba(255,255,255,0.05)';
                                let opacity = 1;

                                if (quizState === 'answered') {
                                    if (opt.isCorrect) {
                                        bg = 'rgba(48,209,88,0.2)';
                                        border = '1px solid rgba(48,209,88,0.5)';
                                    } else if (userChoice === opt) {
                                        bg = 'rgba(255,69,58,0.2)';
                                        border = '1px solid rgba(255,69,58,0.5)';
                                    } else {
                                        opacity = 0.4;
                                    }
                                }

                                return (
                                    <button key={i} onClick={() => handleOptionSelect(opt)} disabled={quizState === 'answered'} style={{
                                        background: bg, border: border, padding: '12px 14px', borderRadius: '12px',
                                        color: '#fff', textAlign: 'left', fontSize: '13px', lineHeight: 1.4,
                                        cursor: quizState === 'answered' ? 'default' : 'pointer',
                                        opacity, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px'
                                    }}>
                                        {quizState === 'answered' && opt.isCorrect && <CheckCircle size={18} color="#30d158" style={{flexShrink: 0}}/>}
                                        {quizState === 'answered' && !opt.isCorrect && userChoice === opt && <XCircle size={18} color="#ff453a" style={{flexShrink: 0}}/>}
                                        <span style={{flex: 1}}>{opt.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                            {quizState === 'answered' && (
                                <button onClick={handleNextQuestion} style={{
                                    width: '100%', background: '#0a84ff', color: '#fff',
                                    border: 'none', padding: '12px', borderRadius: '12px',
                                    fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', fontSize: '15px'
                                }}>
                                    {currentQuestionIdx < 9 ? 'Next Question' : 'View Results'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    const getOrganDataByMeshName = (meshName) => {
        if (!meshName) return null;
        let system = systemsData.find(s => activeOrgan && activeOrgan.id && s.id === activeOrgan.id.split('_')[0]) || activeSystem;
        if (!system) return null;
        
        let targetOrgan = system.organs.find(o => o.modelSrc && o.modelSrc.includes(meshName)) || 
                          system.organs.find(o => o.name.en.toLowerCase() === cleanName(meshName).toLowerCase());
        
        if (targetOrgan) return targetOrgan;
        
        return {
            id: meshName,
            name: { en: cleanName(meshName) },
            description: { en: "Sub-component of the " + (activeOrgan.name.en || 'system') }
        };
    };

    const displayOrgan = getOrganDataByMeshName(heldOrganMeshName) || getOrganDataByMeshName(lastHeldOrganMeshName) || activeOrgan;
    const isShowingSubOrgan = displayOrgan !== activeOrgan;

    // Default Details Renderer
    return (
        <div className="detail-panel glass-panel" key={displayOrgan.id || activeOrgan.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {isShowingSubOrgan && (
                    <div style={{
                        display: 'inline-block',
                        background: heldOrganMeshName ? 'rgba(48,209,88,0.2)' : 'rgba(255,159,10,0.2)',
                        color: heldOrganMeshName ? '#30d158' : '#ff9f0a',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        textTransform: 'uppercase'
                    }}>
                        {heldOrganMeshName ? 'Currently Holding' : 'Last Held'}
                    </div>
                )}
                <h2>{t(displayOrgan.name || {en: 'Organ'}).replace(' (Model Coming Soon)', '')}</h2>
                <div style={{ height: "1px", background: "var(--border-color)", width: "100%", margin: "16px 0" }} />

                <p>{t(displayOrgan.description || {en: 'No description available.'})}</p>

                <div className="stat-grid">
                    {(displayOrgan.details || []).map((detail, index) => (
                        <div key={index} className="stat-card">
                            <div className="stat-label">{t(detail.label || {en: 'Detail'})}</div>
                            <div className="stat-value">{t(detail.value || {en: '-'})}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Simulation Controls for Entire Digestive System */}
            {isFullSystem && (
                <div style={{ paddingTop: '16px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Attractive Video Play Button */}
                    <button 
                        onClick={() => setShowVideo(true)} 
                        style={{
                            width: '100%', 
                            background: 'linear-gradient(135deg, rgba(10,132,255,0.85), rgba(0,80,200,0.85))',
                            color: '#fff', 
                            border: '1px solid rgba(10,132,255,0.4)',
                            padding: '14px 20px', 
                            borderRadius: '16px', 
                            fontWeight: 700,
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px',
                            boxShadow: '0 8px 25px -5px rgba(10,132,255,0.4)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontSize: '15px',
                            letterSpacing: '0.02em'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(10,132,255,0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(10,132,255,0.4)';
                        }}
                    >
                        <div style={{ 
                            background: 'rgba(255,255,255,0.2)', 
                            borderRadius: '50%', 
                            width: '28px', 
                            height: '28px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            <Play size={14} fill="white" />
                        </div>
                        Watch the Digestive Process
                    </button>

                    {/* Native Quiz Button */}
                    <button onClick={handleStartQuiz} style={{
                        width: '100%', 
                        background: 'rgba(255,159,10,0.15)',
                        color: '#ff9f0a', 
                        border: '1px solid rgba(255,159,10,0.3)',
                        padding: '12px 20px', 
                        borderRadius: '16px', 
                        fontWeight: 600,
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,159,10,0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,159,10,0.15)';
                    }}
                    >
                        <Zap size={16}/> Start Challenge
                    </button>
                </div>
            )}

            {/* Video Overlay Modal */}
            {showVideo && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.95)',
                    backdropFilter: 'blur(15px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }} className="fade-in">
                    <button 
                        onClick={() => setShowVideo(false)}
                        style={{
                            position: 'absolute',
                            top: '30px',
                            right: '30px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10000
                        }}
                    >
                        <XCircle size={24} />
                    </button>

                    <div style={{
                        width: '100%',
                        maxWidth: '1000px',
                        aspectRatio: '16/9',
                        background: '#000',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <video 
                            src="./assets/videos/digestive_process.mp4" 
                            controls 
                            autoPlay 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                    
                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 10px 0', color: '#fff' }}>Digestive System Simulation</h2>
                        <p style={{ opacity: 0.6, fontSize: '15px', margin: 0 }}>Visualizing the entire process of digestion from ingestion to elimination.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

