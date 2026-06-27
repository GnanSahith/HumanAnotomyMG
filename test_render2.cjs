require('@babel/register')({
  presets: ['@babel/preset-env', ['@babel/preset-react', {runtime: 'automatic'}]]
});
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost:5173/"
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: 'node.js' };
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};

const React = require('react');
const { renderToString } = require('react-dom/server');

const lucide = require('lucide-react');
Object.keys(lucide).forEach(key => {
    if (key !== 'default') {
        lucide[key] = () => React.createElement('svg', { 'data-icon': key });
    }
});

const chemFiles = [
    'CustomAcidBaseSolutions', 'CustomAtomicInteractions', 'CustomBalancingAct',
    'CustomBalancingChemicalEquations', 'CustomBalloonsandStaticElectricity', 'CustomBeersLawLab',
    'CustomBlackbodySpectrum', 'CustomBuildAMolecule', 'CustomBuildANucleus',
    'CustomBuildAnAtom', 'CustomBuoyancy', 'CustomBuoyancyBasics',
    'CustomConcentration', 'CustomCoulombsLaw', 'CustomDensity',
    'CustomDiffusion', 'CustomEnergyFormsandChanges', 'CustomFourierMakingWaves',
    'CustomGasProperties', 'CustomGasesIntro'
];

for (let file of chemFiles) {
    try {
        const Component = require(`./src/components/simulations/${file}.jsx`).default;
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
