const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');

const dir = path.join(__dirname, 'src', 'components', 'simulations');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Custom') && f.endsWith('.jsx'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    const code = fs.readFileSync(filePath, 'utf-8');
    
    // We will only do this for the 20 chemistry files. We can filter by the ones we care about.
    const chemFiles = [
        'CustomAcidBaseSolutions.jsx', 'CustomAtomicInteractions.jsx', 'CustomBalancingAct.jsx',
        'CustomBalancingChemicalEquations.jsx', 'CustomBalloonsandStaticElectricity.jsx', 'CustomBeersLawLab.jsx',
        'CustomBlackbodySpectrum.jsx', 'CustomBuildAMolecule.jsx', 'CustomBuildANucleus.jsx',
        'CustomBuildAnAtom.jsx', 'CustomBuoyancy.jsx', 'CustomBuoyancyBasics.jsx',
        'CustomConcentration.jsx', 'CustomCoulombsLaw.jsx', 'CustomDensity.jsx',
        'CustomDiffusion.jsx', 'CustomEnergyFormsandChanges.jsx', 'CustomFourierMakingWaves.jsx',
        'CustomGasProperties.jsx', 'CustomGasesIntro.jsx'
    ];
    if (!chemFiles.includes(file)) return;
    
    try {
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx']
        });
        
        let modified = false;
        
        traverse(ast, {
            JSXElement(path) {
                const opening = path.node.openingElement;
                
                // 1. Remove Back Buttons
                if (opening.name.name === 'button') {
                    const hasOnBack = opening.attributes.some(attr => 
                        attr.name && attr.name.name === 'onClick' && 
                        attr.value && attr.value.type === 'JSXExpressionContainer' &&
                        attr.value.expression.name === 'onBack'
                    );
                    
                    const isBackClass = opening.attributes.some(attr => 
                        attr.name && attr.name.name === 'className' && 
                        attr.value && attr.value.type === 'StringLiteral' &&
                        attr.value.value.includes('back')
                    );
                    
                    if (hasOnBack || isBackClass) {
                        path.remove();
                        modified = true;
                        return;
                    }
                }
                
                // 2. Fix Canvas Cropping (Add width: 100%, height: 100%, objectFit: contain)
                if (opening.name.name === 'canvas') {
                    let styleAttr = opening.attributes.find(attr => attr.name && attr.name.name === 'style');
                    if (!styleAttr) {
                        styleAttr = t.jsxAttribute(
                            t.jsxIdentifier('style'),
                            t.jsxExpressionContainer(t.objectExpression([]))
                        );
                        opening.attributes.push(styleAttr);
                    }
                    
                    if (styleAttr.value && styleAttr.value.type === 'JSXExpressionContainer' && styleAttr.value.expression.type === 'ObjectExpression') {
                        const props = styleAttr.value.expression.properties;
                        const hasWidth = props.some(p => p.key && p.key.name === 'width');
                        const hasHeight = props.some(p => p.key && p.key.name === 'height');
                        const hasObjectFit = props.some(p => p.key && p.key.name === 'objectFit');
                        
                        if (!hasWidth) props.push(t.objectProperty(t.identifier('width'), t.stringLiteral('100%')));
                        if (!hasHeight) props.push(t.objectProperty(t.identifier('height'), t.stringLiteral('100%')));
                        if (!hasObjectFit) props.push(t.objectProperty(t.identifier('objectFit'), t.stringLiteral('contain')));
                        
                        modified = true;
                    }
                }
                
                // 3. Fix Ugly Backgrounds
                if (opening.name.name === 'div' || opening.name.name === 'aside' || opening.name.name === 'header') {
                    let styleAttr = opening.attributes.find(attr => attr.name && attr.name.name === 'style');
                    if (styleAttr && styleAttr.value && styleAttr.value.type === 'JSXExpressionContainer' && styleAttr.value.expression.type === 'ObjectExpression') {
                        const props = styleAttr.value.expression.properties;
                        
                        let hasBg = false;
                        for (let i = 0; i < props.length; i++) {
                            const prop = props[i];
                            if (prop.key && (prop.key.name === 'background' || prop.key.name === 'backgroundColor')) {
                                if (prop.value && prop.value.type === 'StringLiteral') {
                                    const val = prop.value.value;
                                    // If it's a solid dark color (not #000, not transparent, not glass)
                                    if (val === '#1e293b' || val === '#0f172a' || val === '#1c1c1e' || val === 'rgba(30, 39, 73, 0.7)' || val === 'rgba(0, 0, 0, 0.2)') {
                                        prop.value = t.stringLiteral('rgba(255,255,255,0.05)');
                                        
                                        // add backdropFilter and border
                                        if (!props.some(p => p.key && p.key.name === 'backdropFilter')) {
                                            props.push(t.objectProperty(t.identifier('backdropFilter'), t.stringLiteral('blur(12px)')));
                                        }
                                        if (!props.some(p => p.key && p.key.name === 'border')) {
                                            props.push(t.objectProperty(t.identifier('border'), t.stringLiteral('1px solid rgba(255,255,255,0.1)')));
                                        }
                                        modified = true;
                                    }
                                }
                            }
                        }
                    }
                }
                
                // 4. Also fix top bar containers that use flex-end
                if (opening.name.name === 'div') {
                    let styleAttr = opening.attributes.find(attr => attr.name && attr.name.name === 'style');
                    if (styleAttr && styleAttr.value && styleAttr.value.type === 'JSXExpressionContainer' && styleAttr.value.expression.type === 'ObjectExpression') {
                        const props = styleAttr.value.expression.properties;
                        const isTopBar = props.some(p => p.key && p.key.name === 'justifyContent' && p.value.type === 'StringLiteral' && p.value.value === 'flex-end');
                        const hasBorderBottom = props.some(p => p.key && p.key.name === 'borderBottom');
                        if (isTopBar && hasBorderBottom) {
                            // Make it transparent
                            const bgProp = props.find(p => p.key && (p.key.name === 'background' || p.key.name === 'backgroundColor'));
                            if (bgProp) {
                                bgProp.value = t.stringLiteral('transparent');
                            }
                            // Remove borderBottom
                            styleAttr.value.expression.properties = props.filter(p => !(p.key && p.key.name === 'borderBottom'));
                            modified = true;
                        }
                    }
                }
            }
        });
        
        if (modified) {
            let output = generator(ast, {}, code).code;
            
            // Also scrub <style>...</style> blocks that set ai-header or rigid widths
            output = output.replace(/<style>\{`[\s\S]*?`\}<\/style>/g, '');
            output = output.replace(/className="[^"]*"/g, '');
            
            fs.writeFileSync(filePath, output);
            console.log("Refactored", file);
        }
    } catch (e) {
        console.log("Error processing", file, e.message);
    }
});
