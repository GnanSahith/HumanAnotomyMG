const fs = require('fs');

const subjects = [
  { name: 'Physics', file: './src/data/physicsSimulations.json' },
  { name: 'Chemistry', file: './src/data/chemistrySimulations.json' },
  { name: 'Mathematics', file: './src/data/mathSimulations.json' }
];

let xml = `<?xml version="1.0"?>\n`;
xml += `<?mso-application progid="Excel.Sheet"?>\n`;
xml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">\n`;

for (const sub of subjects) {
  xml += ` <Worksheet ss:Name="${sub.name}">\n`;
  xml += `  <Table>\n`;
  xml += `   <Row><Cell><Data ss:Type="String">Simulation Name</Data></Cell></Row>\n`;
  
  if (fs.existsSync(sub.file)) {
    const data = JSON.parse(fs.readFileSync(sub.file, 'utf8'));
    for (const key of Object.keys(data)) {
      if (data[key] && data[key].title) {
        // Escape special XML characters
        const title = data[key].title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
        xml += `   <Row><Cell><Data ss:Type="String">${title}</Data></Cell></Row>\n`;
      }
    }
  }
  
  xml += `  </Table>\n`;
  xml += ` </Worksheet>\n`;
}

xml += `</Workbook>\n`;

const outDir = '/Users/gnansahith/.gemini/antigravity/brain/99e464f5-5dc0-4e22-a017-9f49ff2527cf/scratch';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outDir + '/simulations.xls', xml);
console.log('File successfully written to: ' + outDir + '/simulations.xls');
