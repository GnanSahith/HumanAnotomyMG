import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { Zap, Trophy, XCircle, CheckCircle } from 'lucide-react';
import { systemsData } from '../data';

const digestiveSystem = systemsData.find(s => s.id === 'digestive');
const cleanName = (raw) => (raw || 'Organ').replace(/_01/g, '').replace(/_/g, ' ');

export default function DetailsView({ activeOrgan }) {
    const { t } = useLanguage();
    
    // Quiz State Variables
    const [quizState, setQuizState] = useState('idle');
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [userChoice, setUserChoice] = useState(null);

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

    const isFullSystem = activeOrgan.id === 'digestive_entire';

    const handleStartQuiz = () => {
        if (!window.digestiveValidMeshes || window.digestiveValidMeshes.length === 0) {
            alert("3D model is still loading. Please wait a moment!");
            return;
        }

        const validMeshes = window.digestiveValidMeshes.filter(m => 
            !m.includes('Boxes') && !m.includes('System') && !m.includes('Human Skeleton') && !m.includes('Skull') && !m.includes('Rotten Brain')
        );
        
        let qs = [];
        for (let i = 0; i < 10; i++) {
            const targetMesh = validMeshes[Math.floor(Math.random() * validMeshes.length)];
            const targetOrgan = digestiveSystem.organs.find(o => o.modelSrc && o.modelSrc.includes(targetMesh)) || 
                                digestiveSystem.organs.find(o => o.name.en.toLowerCase() === cleanName(targetMesh).toLowerCase());
            
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
                const optOrgan = digestiveSystem.organs.find(o => o.modelSrc && o.modelSrc.includes(opt.mesh)) || 
                                 digestiveSystem.organs.find(o => o.name.en.toLowerCase() === cleanName(opt.mesh).toLowerCase());
                
                let label = cleanName(opt.mesh);
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

    // Default Details Renderer
    return (
        <div className="detail-panel glass-panel" key={activeOrgan.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <h2>{t(activeOrgan.name).replace(' (Model Coming Soon)', '')}</h2>
                <div style={{ height: "1px", background: "var(--border-color)", width: "100%", margin: "16px 0" }} />

                <p>{t(activeOrgan.description)}</p>

                <div className="stat-grid">
                    {activeOrgan.details.map((detail, index) => (
                        <div key={index} className="stat-card">
                            <div className="stat-label">{t(detail.label)}</div>
                            <div className="stat-value">{t(detail.value)}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Native Quiz Button injected right at the bottom when Entire Digestive System is active! */}
            {isFullSystem && (
                <div style={{ paddingTop: '16px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={handleStartQuiz} style={{
                        width: '100%', background: 'linear-gradient(135deg, rgba(255,159,10,0.85), rgba(255,100,10,0.85))',
                        color: '#fff', border: '1px solid rgba(255,159,10,0.5)',
                        padding: '12px 20px', borderRadius: '12px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <Zap size={16}/> Start Challenge
                    </button>
                </div>
            )}
        </div>
    );
}
