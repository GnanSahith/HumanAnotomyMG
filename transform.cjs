const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');

const dir = path.join(__dirname, 'src', 'components', 'simulations');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Custom') && f.endsWith('.jsx') && f !== 'CustomMassesAndSprings.jsx');

files.forEach(file => {
    const filePath = path.join(dir, file);
    const code = fs.readFileSync(filePath, 'utf-8');
    
    try {
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx']
        });
        
        let hasLucide = false;
        
        traverse(ast, {
            ImportDeclaration(path) {
                if (path.node.source.value === 'lucide-react') {
                    hasLucide = true;
                    const specifiers = path.node.specifiers;
                    const names = specifiers.map(s => s.imported.name);
                    ['ArrowLeft', 'Play', 'Pause', 'RotateCcw', 'Settings2'].forEach(name => {
                        if (!names.includes(name)) {
                            specifiers.push(t.importSpecifier(t.identifier(name), t.identifier(name)));
                        }
                    });
                }
            },
            ReturnStatement(path) {
                // Find the main return statement of the default export function
                if (path.parentPath.parentPath && path.parentPath.parentPath.type === 'ExportDefaultDeclaration') {
                    // Update styling of the outer container
                    const jsxElement = path.node.argument;
                    if (jsxElement && jsxElement.type === 'JSXElement') {
                        // Change the outer div style
                        const opening = jsxElement.openingElement;
                        if (opening.name.name === 'div') {
                            const styleAttr = opening.attributes.find(a => a.name && a.name.name === 'style');
                            const newStyleStr = "{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a1a', overflow: 'hidden' }";
                            if (styleAttr) {
                                styleAttr.value = parser.parseExpression(newStyleStr);
                            } else {
                                opening.attributes.push(t.jsxAttribute(t.jsxIdentifier('style'), parser.parseExpression(newStyleStr)));
                            }
                            
                            // Let's replace the first child (which is usually the header) with the new header
                            // This is risky, but let's try to identify the header
                            // The header usually has a 'Back' button or Title.
                            // To be safe, we just prepend the new header and `<style>` and we'll manually remove old headers if needed.
                            // Actually, let's just do a string replacement for the old header based on common patterns.
                        }
                    }
                }
            }
        });
        
        if (!hasLucide) {
            ast.program.body.unshift(parser.parse(`import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';\n`, { sourceType: 'module', plugins: ['jsx'] }).program.body[0]);
        }
        
        const output = generator(ast, {}, code);
        fs.writeFileSync(filePath, output.code);
        console.log("Transformed", file);
    } catch (e) {
        console.log("Error transforming", file, e.message);
    }
});
