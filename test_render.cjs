require('@babel/register')({
  presets: ['@babel/preset-env', ['@babel/preset-react', {runtime: 'automatic'}]]
});
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Mock Lucide React icons
const lucide = require('lucide-react');
Object.keys(lucide).forEach(key => {
    if (key !== 'default') {
        lucide[key] = () => React.createElement('svg', { 'data-icon': key });
    }
});

// Try to render CustomBalancingChemicalEquations
try {
    const Component = require('./src/components/simulations/CustomBalancingChemicalEquations.jsx').default;
    const html = ReactDOMServer.renderToString(React.createElement(Component));
    console.log('SUCCESS rendered CustomBalancingChemicalEquations');
} catch (e) {
    console.log('CRASH CustomBalancingChemicalEquations:', e);
}

// Try CustomAtomicInteractions
try {
    const Component = require('./src/components/simulations/CustomAtomicInteractions.jsx').default;
    const html = ReactDOMServer.renderToString(React.createElement(Component));
    console.log('SUCCESS rendered CustomAtomicInteractions');
} catch (e) {
    console.log('CRASH CustomAtomicInteractions:', e);
}
