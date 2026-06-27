const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

const dir = path.join(__dirname, 'src', 'components', 'simulations');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Custom') && f.endsWith('.jsx'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    const code = fs.readFileSync(filePath, 'utf-8');
    
    try {
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx']
        });
        
        let modified = false;
        
        traverse(ast, {
            ReturnStatement(path) {
                if (path.parentPath.parentPath && path.parentPath.parentPath.type === 'ExportDefaultDeclaration') {
                    const jsxElement = path.node.argument;
                    if (jsxElement && jsxElement.type === 'JSXElement') {
                        const children = jsxElement.children;
                        
                        // We added the style node and then the header node.
                        // The header node is a div with style height: '80px'.
                        for (let i = 0; i < children.length; i++) {
                            const c = children[i];
                            if (c.type === 'JSXElement' && c.openingElement.name.name === 'div') {
                                const styleAttr = c.openingElement.attributes.find(a => a.name && a.name.name === 'style');
                                if (styleAttr && styleAttr.value && styleAttr.value.type === 'JSXExpressionContainer') {
                                    const props = styleAttr.value.expression.properties;
                                    if (props && props.some(p => p.key && p.key.name === 'height' && p.value.value === '80px')) {
                                        // Found the duplicate header, remove it!
                                        children.splice(i, 1);
                                        modified = true;
                                        break; // Only remove the first one found
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        if (modified) {
            const output = generator(ast, {}, code);
            fs.writeFileSync(filePath, output.code);
            console.log("Stripped header from", file);
        }
    } catch (e) {
        console.log("Error processing", file, e.message);
    }
});
