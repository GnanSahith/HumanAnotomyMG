const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'simulations');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Custom') && f.endsWith('.jsx'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix {onBack && } left by naive python regex
    content = content.replace(/\{typeof onBack !== 'undefined' && onBack && \s*\}/g, '');
    content = content.replace(/\{onBack && \s*\}/g, '');
    
    fs.writeFileSync(filePath, content);
});
