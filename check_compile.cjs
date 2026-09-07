const fs = require('fs');
const babel = require('@babel/core');
try {
  const code = fs.readFileSync(process.argv[2], 'utf8');
  babel.transformSync(code, {
    presets: ['@babel/preset-react']
  });
  console.log("Syntax OK");
} catch(e) {
  console.log(e.message);
}
