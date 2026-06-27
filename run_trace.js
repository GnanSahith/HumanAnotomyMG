import React from 'react';
import { renderToString } from 'react-dom/server';
import Component from './src/components/simulations/CustomBalancingChemicalEquations.jsx';

try {
    renderToString(React.createElement(Component, { title: 'Test', onBack: function namedOnBack() {} }));
} catch(e) {
    console.error("THE CRASH IS:", e.stack);
}
