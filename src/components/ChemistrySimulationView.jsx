import React, { useState } from 'react';
import { ArrowLeft, FlaskConical, Lock, Eye, EyeOff } from 'lucide-react';
import chemistrySimulations from '../data/chemistrySimulations.json';
import { useLanguage } from '../LanguageContext';
import SimulationLibraryLayout from './SimulationLibraryLayout';

import CustomBalancingAct from './simulations/CustomBalancingAct';
import CustomBalloonsandStaticElectricity from './simulations/CustomBalloonsandStaticElectricity';
import CustomBlackbodySpectrum from './simulations/CustomBlackbodySpectrum';
import CustomCoulombsLaw from './simulations/CustomCoulombsLaw';

import CustomAcidBaseSolutions from './simulations/CustomAcidBaseSolutions';
import CustomDensity from './simulations/CustomDensity';
import CustomBalancingChemicalEquations from './simulations/CustomBalancingChemicalEquations';

import CustomBuildAnAtom from './simulations/CustomBuildAnAtom';
import CustomBuoyancy from './simulations/CustomBuoyancy';
import CustomConcentration from './simulations/CustomConcentration';
import CustomDiffusion from './simulations/CustomDiffusion';
import CustomEnergyFormsandChanges from './simulations/CustomEnergyFormsandChanges';
import CustomFourierMakingWaves from './simulations/CustomFourierMakingWaves';
import CustomGasProperties from './simulations/CustomGasProperties';

import CustomAtomicInteractions from './simulations/CustomAtomicInteractions';
import CustomBeersLawLab from './simulations/CustomBeersLawLab';
import CustomBuildAMolecule from './simulations/CustomBuildAMolecule';
import CustomBuildANucleus from './simulations/CustomBuildANucleus';
import CustomBuoyancyBasics from './simulations/CustomBuoyancyBasics';
import CustomGasesIntro from './simulations/CustomGasesIntro';

export default function ChemistrySimulationView({ onBack, handleLockedItemClick }) {
    const { t } = useLanguage();
    const [activeSimulation, setActiveSimulation] = useState(null);
    const [isLoadingSim, setIsLoadingSim] = useState(false);



    const loggedInUsername = localStorage.getItem('logged_in_username') || '';
    const [approvedSims, setApprovedSims] = useState(() => {
        try {
            const stored = localStorage.getItem('showcase_approved_chemistry_sims');
            const defaultApproved = [
                'acid-base-solutions_mg', 'atomic-interactions_mg', 'balancing-act_mg',
                'balancing-chemical-equations_mg', 'balloons-and-static-electricity_mg', 'beers-law-lab_mg',
                'blackbody-spectrum_mg', 'build-a-molecule_mg', 'build-a-nucleus_mg',
                'build-an-atom_mg', 'buoyancy_mg', 'buoyancy-basics_mg',
                'concentration_mg', 'coulombs-law_mg', 'density_mg',
                'diffusion_mg', 'energy-forms-and-changes_mg', 'fourier-making-waves_mg',
                'gas-properties_mg', 'gases-intro_mg'
            ];
            
            if (stored) {
                const parsed = JSON.parse(stored);
                const merged = Array.from(new Set([...parsed, ...defaultApproved]));
                localStorage.setItem('showcase_approved_chemistry_sims', JSON.stringify(merged));
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
            localStorage.setItem('showcase_approved_chemistry_sims', JSON.stringify(newArr));
            return newArr;
        });
    };

    const accessLevel = React.useMemo(() => {
        const rootUsers = ['GnanSahith@MG', 'MGRoot01', 'MyGnanAD'];
        const approvedUsers = ['CharanKumar@MG', 'SandhyaRekha@MG', 'VishnuKranthi@MG'];
        if (rootUsers.includes(loggedInUsername)) return 'ROOT';
        if (approvedUsers.includes(loggedInUsername)) return 'APPROVED_ONLY';
        return 'CLERK';
    }, [loggedInUsername]);

    const simArray = React.useMemo(() => {
        let arr = chemistrySimulations.map(sim => ({ ...sim, id: sim.id || sim.title.replace(/\s+/g, '') }));
        if (accessLevel === 'ROOT') {
            return arr;
        } else {
            return arr.filter(sim => approvedSims.includes(sim.id));
        }
    }, [accessLevel, approvedSims]);
    const subjectOptions = React.useMemo(() => {
        const categories = new Set(chemistrySimulations.map(s => s.category).filter(Boolean));
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
            const sum = sim.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const mockGrade = sum % 4;
            if (activeOptions.includes('elementary') && mockGrade === 0) return true;
            if (activeOptions.includes('middle') && mockGrade === 1) return true;
            if (activeOptions.includes('high') && mockGrade === 2) return true;
            if (activeOptions.includes('university') && mockGrade === 3) return true;
            return false;
        }
        return true;
    };

    const handleSimClick = (sim) => {
        if (accessLevel === 'CLERK') {
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
                title="Chemistry Interactive Library"
                icon={<FlaskConical size={36} color="#ff375f" />}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(255,55,95,0.2)', borderRadius: '12px', border: '1px solid rgba(255,55,95,0.3)' }}>
                            <FlaskConical size={24} color="#ff375f" />
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
                    >
                        <ArrowLeft size={16} /> Back to Library
                    </button>
                </div>
                
                <div style={{ flex: 1, width: '100%', background: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {activeSimulation.id === 'balancing-act_mg' ? <CustomBalancingAct onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'balloons-and-static-electricity_mg' ? <CustomBalloonsandStaticElectricity onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'blackbody-spectrum_mg' ? <CustomBlackbodySpectrum onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'coulombs-law_mg' ? <CustomCoulombsLaw onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'acid-base-solutions_mg' ? <CustomAcidBaseSolutions onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'density_mg' ? <CustomDensity onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'balancing-chemical-equations_mg' ? <CustomBalancingChemicalEquations onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'build-an-atom_mg' ? <CustomBuildAnAtom onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'buoyancy_mg' ? <CustomBuoyancy onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'concentration_mg' ? <CustomConcentration onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'diffusion_mg' ? <CustomDiffusion onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'energy-forms-and-changes_mg' ? <CustomEnergyFormsandChanges onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'fourier-making-waves_mg' ? <CustomFourierMakingWaves onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'gas-properties_mg' ? <CustomGasProperties onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'atomic-interactions_mg' ? <CustomAtomicInteractions onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'beers-law-lab_mg' ? <CustomBeersLawLab onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'build-a-molecule_mg' ? <CustomBuildAMolecule onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'build-a-nucleus_mg' ? <CustomBuildANucleus onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'buoyancy-basics_mg' ? <CustomBuoyancyBasics onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        activeSimulation.id === 'gases-intro_mg' ? <CustomGasesIntro onBack={() => setActiveSimulation(null)} title={activeSimulation.title} /> :
                        <>
                            <iframe src={activeSimulation.url} width="100%" height="100%" style={{ border: 'none' }} allowFullScreen title={activeSimulation.title}></iframe>
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '160px', height: '45px', background: '#000', zIndex: 10 }}></div>
                        </>}
                        {isLoadingSim && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <FlaskConical size={64} color="#ff375f" style={{ marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
                                <h3 style={{ fontSize: '24px', margin: '0 0 8px 0', fontWeight: 600 }}>Loading Engine...</h3>
                                <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', marginTop: '32px', overflow: 'hidden' }}>
                                    <div style={{ width: '100%', height: '100%', background: '#ff375f', animation: 'loadingBar 4.5s linear forwards' }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
