import React, { useState } from 'react';
import { ArrowLeft, PlayCircle, Atom, Search, X, Lock, Eye, EyeOff } from 'lucide-react';
import physicsSimulations from '../data/physicsSimulations.json';
import { useLanguage } from '../LanguageContext';
import CustomPendulumLab from './simulations/CustomPendulumLab';
import CustomProjectileMotion from './simulations/CustomProjectileMotion';
import CustomForcesAndMotion from './simulations/CustomForcesAndMotion';
import CustomGravityAndOrbits from './simulations/CustomGravityAndOrbits';
import CustomFriction from './simulations/CustomFriction';
import CustomEnergySkatePark from './simulations/CustomEnergySkatePark';
import CustomMassesAndSprings from './simulations/CustomMassesAndSprings';
import CustomStatesOfMatter from './simulations/CustomStatesOfMatter';
import CustomStatesOfMatterBasics from './simulations/CustomStatesOfMatterBasics';
import CustomWaveInterference from './simulations/CustomWaveInterference';
import CustomSoundWaves from './simulations/SoundWaves_mg';
import CustomGasProperties from './simulations/CustomGasProperties';

import CustomBalancingAct from './simulations/CustomBalancingAct';
import CustomCollisionLab from './simulations/CustomCollisionLab';
import CustomCenterandVariability from './simulations/CustomCenterandVariability';
import CustomEnergySkateParkBasics from './simulations/CustomEnergySkateParkBasics';
import CustomHookesLaw from './simulations/CustomHookesLaw';
import CustomMassesandSpringsBasics from './simulations/CustomMassesandSpringsBasics';
import CustomDiffusion from './simulations/CustomDiffusion';
import CustomEnergyFormsandChanges from './simulations/CustomEnergyFormsandChanges';
import CustomBlackbodySpectrum from './simulations/CustomBlackbodySpectrum';
import CustomWaveonaString from './simulations/CustomWaveonaString';
import CustomNormalModes from './simulations/CustomNormalModes';
import CustomFourierMakingWaves from './simulations/CustomFourierMakingWaves';
import CustomCircuitConstructionKitDC from './simulations/CustomCircuitConstructionKitDC';
import CustomCircuitConstructionKitDCVirtualLab from './simulations/CustomCircuitConstructionKitDCVirtualLab';
import CustomCircuitConstructionKitAC from './simulations/CustomCircuitConstructionKitAC';
import CustomChargesandFields from './simulations/CustomChargesandFields';
import CustomFaradaysLaw from './simulations/CustomFaradaysLaw';
import CustomOhmsLaw from './simulations/CustomOhmsLaw';
import CustomCoulombsLaw from './simulations/CustomCoulombsLaw';
import CustomJohnTravoltage from './simulations/CustomJohnTravoltage';
import CustomCapacitorLabBasics from './simulations/CustomCapacitorLabBasics';
import CustomResistanceinaWire from './simulations/CustomResistanceinaWire';
import CustomBalloonsandStaticElectricity from './simulations/CustomBalloonsandStaticElectricity';
import CustomBendingLight from './simulations/CustomBendingLight';
import CustomColorVision from './simulations/CustomColorVision';
import CustomMoleculesandLight from './simulations/CustomMoleculesandLight';
import CustomRutherfordScattering from './simulations/CustomRutherfordScattering';
import CustomModelsoftheHydrogenAtom from './simulations/CustomModelsoftheHydrogenAtom';
import CustomPhotoelectricEffect from './simulations/CustomPhotoelectricEffect';
import CustomLasers from './simulations/CustomLasers';
import CustomNeonLights from './simulations/CustomNeonLights';
import CustomMicrowaves from './simulations/CustomMicrowaves';
import CustomSimplifiedMRI from './simulations/CustomSimplifiedMRI';

import SimulationLibraryLayout from './SimulationLibraryLayout';

export default function PhysicsSimulationView({ onBack, handleLockedItemClick }) {
    const { t } = useLanguage();
    const [activeSimulation, setActiveSimulation] = useState(null);
    const [isLoadingSim, setIsLoadingSim] = useState(false);



    const loggedInUsername = localStorage.getItem('logged_in_username') || '';
    const [approvedSims, setApprovedSims] = useState(() => {
        try {
            const stored = localStorage.getItem('showcase_approved_physics_sims');
            const defaultApproved = [
                'phys_1_mg', 'phys_2_mg', 'phys_3_mg', 'phys_4_mg', 'phys_7_mg',
                'phys_35_mg', 'phys_36_mg', 'phys_28_mg', 'phys_27_mg', 'phys_25_mg', 
                'phys_26_mg', 'phys_37_mg', 'phys_31_mg', 'phys_17_mg', 'phys_11_mg', 'phys_29_mg',
                'phys_5_mg', 'phys_6_mg', 'phys_8_mg', 'phys_9_mg'
            ];
            
            // If there's stored data, we merge in the defaults to ensure the newly approved ones show up
            if (stored) {
                const parsed = JSON.parse(stored);
                const merged = Array.from(new Set([...parsed, ...defaultApproved]));
                localStorage.setItem('showcase_approved_physics_sims', JSON.stringify(merged));
                return merged;
            }
            
            return defaultApproved;
        } catch (e) {
            return [];
        }
    });

    const toggleApproval = () => {
        if (!activeSimulation) return;
        setApprovedSims(prev => {
            const newArr = prev.includes(activeSimulation.id) 
                ? prev.filter(id => id !== activeSimulation.id)
                : [...prev, activeSimulation.id];
            localStorage.setItem('showcase_approved_physics_sims', JSON.stringify(newArr));
            return newArr;
        });
    };
    const subjectOptions = React.useMemo(() => {
        const categories = new Set(Object.values(physicsSimulations).map(s => s.category).filter(Boolean));
        return Array.from(categories).map(cat => ({ id: cat, label: cat }));
    }, []);

    const filters = [
        {
            id: 'subject',
            label: 'Subject',
            options: subjectOptions
        },
        {
            id: 'grade',
            label: 'Grade Level',
            options: [
                { id: 'elementary', label: 'Elementary School' },
                { id: 'middle', label: 'Middle School' },
                { id: 'high', label: 'High School' },
                { id: 'university', label: 'University' }
            ]
        }
    ];

    const matchFilter = (sim, filterId, activeOptions) => {
        if (filterId === 'subject') {
            return activeOptions.includes(sim.category);
        }
        if (filterId === 'grade') {
            // Mock grade filtering since backend lacks grade data
            // Deterministically assign a grade based on title length so filtering works visually
            const sum = sim.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const mockGrade = sum % 4; // 0: elementary, 1: middle, 2: high, 3: university
            if (activeOptions.includes('elementary') && mockGrade === 0) return true;
            if (activeOptions.includes('middle') && mockGrade === 1) return true;
            if (activeOptions.includes('high') && mockGrade === 2) return true;
            if (activeOptions.includes('university') && mockGrade === 3) return true;
            return false;
        }
        return true;
    };

    const accessLevel = React.useMemo(() => {
        const rootUsers = ['GnanSahith@MG', 'MGRoot01', 'MyGnanAD'];
        const approvedUsers = ['CharanKumar@MG', 'SandhyaRekha@MG', 'VishnuKranthi@MG'];
        if (rootUsers.includes(loggedInUsername)) return 'ROOT';
        if (approvedUsers.includes(loggedInUsername)) return 'APPROVED_ONLY';
        return 'CLERK';
    }, [loggedInUsername]);

    const simArray = React.useMemo(() => {
        let arr = Object.entries(physicsSimulations).map(([id, sim]) => ({ ...sim, id }));
        if (accessLevel === 'ROOT') {
            return arr;
        } else {
            return arr.filter(sim => approvedSims.includes(sim.id) && sim.isNative);
        }
    }, [accessLevel, approvedSims]);

    const handleSimClick = (sim) => {
        if (accessLevel !== 'ROOT') {
            alert('Currently Locked');
            return;
        }
        setActiveSimulation(sim);
        setIsLoadingSim(true);
        setTimeout(() => setIsLoadingSim(false), 4500);
    };

    if (!activeSimulation) {
        return (
            <SimulationLibraryLayout
                title="Physics Interactive Library"
                icon={<Atom size={36} color="#bf5af2" />}
                simulations={simArray}
                filters={filters}
                onSimulationClick={handleSimClick}
                onBack={onBack}
                handleLockedItemClick={handleLockedItemClick}
                matchFilter={matchFilter}
            />
        );
    }

    return (
        <div className="maths-sim-container fade-in" style={{ paddingBottom: '0', flex: 1, minHeight: 0, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }} className="fade-in">
                    {!activeSimulation.isNative && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ padding: '8px', background: 'rgba(191,90,242,0.2)', borderRadius: '12px', border: '1px solid rgba(191,90,242,0.3)' }}>
                                    <Atom size={24} color="#bf5af2" />
                                </div>
                                <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600 }}>{activeSimulation.title}</h2>
                            </div>
                                                        {loggedInUsername !== 'MGRoot01' && (
                                <button
                                    onClick={toggleApproval}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: approvedSims.includes(activeSimulation.id) ? 'rgba(48,209,88,0.2)' : 'rgba(255,255,255,0.05)',
                                        border: approvedSims.includes(activeSimulation.id) ? '1px solid rgba(48,209,88,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                        padding: '8px 16px', borderRadius: '100px',
                                        color: approvedSims.includes(activeSimulation.id) ? '#30d158' : 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500,
                                        marginRight: 'auto', marginLeft: '24px'
                                    }}
                                >
                                    {approvedSims.includes(activeSimulation.id) ? <><Eye size={16} /> Approved for Showcase</> : <><EyeOff size={16} /> Hidden from Showcase</>}
                                </button>
                            )}
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
                        <div style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative'
                        }}>
                        {activeSimulation.isNative ? (
                            activeSimulation.id === 'phys_1_mg' ? <CustomProjectileMotion onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_2_mg' ? <CustomForcesAndMotion onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_3_mg' ? <CustomGravityAndOrbits onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_4_mg' ? <CustomFriction onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_5_mg' ? <CustomEnergySkatePark onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_6_mg' ? <CustomMassesAndSprings onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_14_mg' ? <CustomStatesOfMatter onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_15_mg' ? <CustomStatesOfMatterBasics onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_16_mg' ? <CustomGasProperties onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_21_mg' ? <CustomWaveInterference onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_22_mg' ? <CustomSoundWaves onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_8_mg' ? <CustomBalancingAct onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_9_mg' ? <CustomCollisionLab onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_10_mg' ? <CustomCenterandVariability onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_11_mg' ? <CustomEnergySkateParkBasics onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_12_mg' ? <CustomHookesLaw onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_13_mg' ? <CustomMassesandSpringsBasics onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_17_mg' ? <CustomDiffusion onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_18_mg' ? <CustomEnergyFormsandChanges onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_19_mg' ? <CustomBlackbodySpectrum onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_20_mg' ? <CustomWaveonaString onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_23_mg' ? <CustomNormalModes onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_24_mg' ? <CustomFourierMakingWaves onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_25_mg' ? <CustomCircuitConstructionKitDC onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_26_mg' ? <CustomCircuitConstructionKitDCVirtualLab onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_27_mg' ? <CustomCircuitConstructionKitAC onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_28_mg' ? <CustomChargesandFields onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_29_mg' ? <CustomFaradaysLaw onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_30_mg' ? <CustomOhmsLaw onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_31_mg' ? <CustomCoulombsLaw onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_32_mg' ? <CustomJohnTravoltage onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_33_mg' ? <CustomCapacitorLabBasics onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_34_mg' ? <CustomResistanceinaWire onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_35_mg' ? <CustomBalloonsandStaticElectricity onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_36_mg' ? <CustomBendingLight onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_37_mg' ? <CustomColorVision onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_38_mg' ? <CustomMoleculesandLight onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_39_mg' ? <CustomRutherfordScattering onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_40_mg' ? <CustomModelsoftheHydrogenAtom onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_41_mg' ? <CustomPhotoelectricEffect onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_42_mg' ? <CustomLasers onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_43_mg' ? <CustomNeonLights onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_44_mg' ? <CustomMicrowaves onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
                            activeSimulation.id === 'phys_45_mg' ? <CustomSimplifiedMRI onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> : 
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
        </div>
    );
}
