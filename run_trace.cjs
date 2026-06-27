const React = require('react');
const { renderToString } = require('react-dom/server');
const lucide = require('lucide-react');
Object.keys(lucide).forEach(key => {
    if (key !== 'default') {
        lucide[key] = () => React.createElement('svg', { 'data-icon': key });
    }
});

const Component = require('./test_error_trace.js').default;
try {
    renderToString(React.createElement(Component, { title: 'Test', onBack: function namedOnBack() {} }));
} catch(e) {
    console.error(e.stack);
}
