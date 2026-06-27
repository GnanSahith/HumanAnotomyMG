import React from 'react';
import { renderToString } from 'react-dom/server';

const chemFiles = [
    'CustomAcidBaseSolutions', 'CustomAtomicInteractions', 'CustomBalancingAct',
    'CustomBalancingChemicalEquations', 'CustomBalloonsandStaticElectricity', 'CustomBeersLawLab',
    'CustomBlackbodySpectrum', 'CustomBuildAMolecule', 'CustomBuildANucleus',
    'CustomBuildAnAtom', 'CustomBuoyancy', 'CustomBuoyancyBasics',
    'CustomConcentration', 'CustomCoulombsLaw', 'CustomDensity',
    'CustomDiffusion', 'CustomEnergyFormsandChanges', 'CustomFourierMakingWaves',
    'CustomGasProperties', 'CustomGasesIntro'
];

async function run() {
    for (let file of chemFiles) {
        try {
            const module = await import(`./src/components/simulations/${file}.jsx`);
            const Component = module.default;
            if (!Component) {
                console.log(`❌ ${file} - Default export is missing!`);
                continue;
            }
            renderToString(React.createElement(Component, { title: 'Test', onBack: () => {} }));
            console.log(`✅ ${file} OK`);
        } catch (e) {
            console.log(`❌ ${file} CRASHED: ${e.message}`);
        }
    }
}
run();
