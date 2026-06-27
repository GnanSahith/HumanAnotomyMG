const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');

const dir = path.join(__dirname, 'src', 'components', 'simulations');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Custom') && f.endsWith('.jsx') && f !== 'CustomMassesAndSprings.jsx' && f !== 'Customphys_12.jsx');

const newHeaderJSX = `
<div style={{ height: '80px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        {typeof onBack !== 'undefined' && onBack && (
            <button onClick={onBack} className="glass-btn back-btn">
                <ArrowLeft size={16} /> Back
            </button>
        )}
    </div>
    <div>
        <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', margin: 0 }}>
            {typeof title !== 'undefined' ? title : 'Simulation'}
        </h2>
    </div>
    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
        {typeof isPlaying !== 'undefined' && typeof setIsPlaying !== 'undefined' && (
            <button onClick={() => setIsPlaying(!isPlaying)} className="glass-btn play-btn">
                {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Play'}
            </button>
        )}
        {typeof handleReset !== 'undefined' && (
            <button onClick={handleReset} className="glass-btn reset-btn">
                <RotateCcw size={18} /> Reset
            </button>
        )}
    </div>
</div>
`;

const styleJSX = `
<style>{\`
    .glass-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 14px;
        outline: none;
    }
    .back-btn:hover {
        background: rgba(255, 55, 95, 0.8) !important;
        border-color: #ff375f !important;
        box-shadow: 0 0 15px rgba(255, 55, 95, 0.4);
    }
    .play-btn:hover, .reset-btn:hover {
        background: rgba(52, 152, 219, 0.4) !important;
        border-color: #3498db !important;
        box-shadow: 0 0 15px rgba(52, 152, 219, 0.4);
    }
\`}</style>
`;

const headerNode = parser.parseExpression(newHeaderJSX, { plugins: ['jsx'] });
const styleNode = parser.parseExpression(styleJSX, { plugins: ['jsx'] });

files.forEach(file => {
    const filePath = path.join(dir, file);
    const code = fs.readFileSync(filePath, 'utf-8');
    
    try {
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx']
        });
        
        traverse(ast, {
            ReturnStatement(path) {
                if (path.parentPath.parentPath && path.parentPath.parentPath.type === 'ExportDefaultDeclaration') {
                    const jsxElement = path.node.argument;
                    if (jsxElement && jsxElement.type === 'JSXElement') {
                        // The children are usually whitespace and elements
                        const children = jsxElement.children;
                        
                        // Let's find the first child that is a JSXElement. This is usually the header.
                        let firstElementIndex = children.findIndex(c => c.type === 'JSXElement');
                        if (firstElementIndex !== -1) {
                            // Replace it with our headerNode
                            children.splice(firstElementIndex, 1, headerNode);
                            // Insert the styleNode before it
                            children.splice(firstElementIndex, 0, styleNode);
                        } else {
                            // If no element child, just push them
                            children.unshift(styleNode, headerNode);
                        }
                    }
                }
            }
        });
        
        const output = generator(ast, {}, code);
        fs.writeFileSync(filePath, output.code);
        console.log("Transformed", file);
    } catch (e) {
        console.log("Error transforming", file, e.message);
    }
});
