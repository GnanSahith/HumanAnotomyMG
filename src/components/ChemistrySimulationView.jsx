import React, { useState } from 'react';
import { ArrowLeft, FlaskConical, Lock, Eye, EyeOff } from 'lucide-react';
import chemistrySimulations from '../data/chemistrySimulations.json';
import { useLanguage } from '../LanguageContext';
import SimulationLibraryLayout from './SimulationLibraryLayout';
import SimulationHeader from './SimulationHeader';

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
import CustomIsotopesAndAtomicMass from './simulations/CustomIsotopesAndAtomicMass';
import CustomMembraneTransport from './simulations/CustomMembraneTransport';
import CustomModelsoftheHydrogenAtom from './simulations/CustomModelsoftheHydrogenAtom';
import CustomMolarity from './simulations/CustomMolarity';
import CustomMoleculePolarity from './simulations/CustomMoleculePolarity';
import CustomMoleculeShapes from './simulations/CustomMoleculeShapes';
import CustomMoleculeShapesBasics from './simulations/CustomMoleculeShapesBasics';
import CustomMoleculesandLight from './simulations/CustomMoleculesandLight';
import CustomPhScale from './simulations/CustomPhScale';
import CustomPhScaleBasics from './simulations/CustomPhScaleBasics';
import CustomQuantumCoinToss from './simulations/CustomQuantumCoinToss';
import CustomQuantumMeasurement from './simulations/CustomQuantumMeasurement';
import CustomReactantsProductsAndLeftovers from './simulations/CustomReactantsProductsAndLeftovers';
import CustomRutherfordScattering from './simulations/CustomRutherfordScattering';
import CustomStatesOfMatter from './simulations/CustomStatesOfMatter';
import CustomStatesOfMatterBasics from './simulations/CustomStatesOfMatterBasics';
import CustomWaveonaString from './simulations/CustomWaveonaString';

export default function ChemistrySimulationView({ onBack, handleLockedItemClick }) {
    const { t } = useLanguage();
    const [activeSimulation, setActiveSimulation] = useState(null);
    const [isLoadingSim, setIsLoadingSim] = useState(false);
    const [simKey, setSimKey] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const handleReset = () => {
        setSimKey(k => k + 1);
        setIsPlaying(true);
    };
    const handleTogglePlay = () => setIsPlaying(p => !p);
    const handleBackToLibrary = () => {
        setActiveSimulation(null);
        setSimKey(0);
        setIsPlaying(true);
    };



    const loggedInUsername = localStorage.getItem('logged_in_username') || '';
    const [approvedSims, setApprovedSims] = useState(() => {
        try {
            const stored = localStorage.getItem('showcase_approved_chemistry_sims');
            const defaultApproved = ["acid-base-solutions_mg","atomic-interactions_mg","balancing-act_mg","balancing-chemical-equations_mg","balloons-and-static-electricity_mg","beers-law-lab_mg","blackbody-spectrum_mg","build-a-molecule_mg","build-a-nucleus_mg","build-an-atom_mg","buoyancy_mg","buoyancy-basics_mg","concentration_mg","coulombs-law_mg","density_mg","diffusion_mg","energy-forms-and-changes_mg","fourier-making-waves_mg","gas-properties_mg","gases-intro_mg","isotopes-and-atomic-mass_mg","membrane-transport_mg","models-of-the-hydrogen-atom_mg","molarity_mg","molecule-polarity_mg","molecule-shapes_mg","molecule-shapes-basics_mg","molecules-and-light_mg","ph-scale_mg","ph-scale-basics_mg","quantum-coin-toss_mg","quantum-measurement_mg","reactants-products-and-leftovers_mg","rutherford-scattering_mg","states-of-matter_mg","states-of-matter-basics_mg","wave-on-a-string_mg"];
            
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
            {/* ── Unified Simulation Header ── */}
            <SimulationHeader
                title={activeSimulation.title}
                onBack={handleBackToLibrary}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onReset={handleReset}
                subject="chemistry"
            />

            <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }} className="fade-in">
                {/* Admin-only approval toggle */}
                {loggedInUsername !== 'MGRoot01' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', flexShrink: 0 }}>
                        <button
                            onClick={toggleApproval}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: approvedSims.includes(activeSimulation.id) ? 'rgba(48,209,88,0.2)' : 'rgba(255,255,255,0.05)',
                                border: approvedSims.includes(activeSimulation.id) ? '1px solid rgba(48,209,88,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                padding: '6px 14px', borderRadius: '100px',
                                color: approvedSims.includes(activeSimulation.id) ? '#30d158' : 'rgba(255,255,255,0.7)',
                                cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500, fontSize: '13px',
                            }}
                        >
                            {approvedSims.includes(activeSimulation.id) ? <><Eye size={14} /> Approved for Showcase</> : <><EyeOff size={14} /> Hidden from Showcase</>}
                        </button>
                    </div>
                )}

                <div style={{ flex: 1, width: '100%', background: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {activeSimulation.id === 'balancing-act_mg' ? <CustomBalancingAct key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'balloons-and-static-electricity_mg' ? <CustomBalloonsandStaticElectricity key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'blackbody-spectrum_mg' ? <CustomBlackbodySpectrum key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'coulombs-law_mg' ? <CustomCoulombsLaw key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'acid-base-solutions_mg' ? <CustomAcidBaseSolutions key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'density_mg' ? <CustomDensity key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'balancing-chemical-equations_mg' ? <CustomBalancingChemicalEquations key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'build-an-atom_mg' ? <CustomBuildAnAtom key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'buoyancy_mg' ? <CustomBuoyancy key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'concentration_mg' ? <CustomConcentration key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'diffusion_mg' ? <CustomDiffusion key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'energy-forms-and-changes_mg' ? <CustomEnergyFormsandChanges key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'fourier-making-waves_mg' ? <CustomFourierMakingWaves key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'gas-properties_mg' ? <CustomGasProperties key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'atomic-interactions_mg' ? <CustomAtomicInteractions key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'beers-law-lab_mg' ? <CustomBeersLawLab key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'build-a-molecule_mg' ? <CustomBuildAMolecule key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'build-a-nucleus_mg' ? <CustomBuildANucleus key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'buoyancy-basics_mg' ? <CustomBuoyancyBasics key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
                        activeSimulation.id === 'gases-intro_mg' ? <CustomGasesIntro key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
activeSimulation.id === 'isotopes-and-atomic-mass_mg' ? <CustomIsotopesAndAtomicMass key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'membrane-transport_mg' ? <CustomMembraneTransport key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'models-of-the-hydrogen-atom_mg' ? <CustomModelsoftheHydrogenAtom key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'molarity_mg' ? <CustomMolarity key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'molecule-polarity_mg' ? <CustomMoleculePolarity key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'molecule-shapes_mg' ? <CustomMoleculeShapes key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'molecule-shapes-basics_mg' ? <CustomMoleculeShapesBasics key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'molecules-and-light_mg' ? <CustomMoleculesandLight key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'ph-scale_mg' ? <CustomPhScale key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'ph-scale-basics_mg' ? <CustomPhScaleBasics key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'quantum-coin-toss_mg' ? <CustomQuantumCoinToss key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'quantum-measurement_mg' ? <CustomQuantumMeasurement key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'reactants-products-and-leftovers_mg' ? <CustomReactantsProductsAndLeftovers key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'rutherford-scattering_mg' ? <CustomRutherfordScattering key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'states-of-matter_mg' ? <CustomStatesOfMatter key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'states-of-matter-basics_mg' ? <CustomStatesOfMatterBasics key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> : 
                            activeSimulation.id === 'wave-on-a-string_mg' ? <CustomWaveonaString key={simKey} onBack={handleBackToLibrary} title={activeSimulation.title} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} syncPlayState={setIsPlaying} /> :
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
