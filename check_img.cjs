const fs = require('fs');
const { PNG } = require('pngjs');

function isBlank(file) {
    fs.createReadStream(file)
      .pipe(new PNG())
      .on('parsed', function() {
          let r = 0, g = 0, b = 0;
          for (let y = 0; y < this.height; y++) {
              for (let x = 0; x < this.width; x++) {
                  let idx = (this.width * y + x) << 2;
                  r += this.data[idx];
                  g += this.data[idx+1];
                  b += this.data[idx+2];
              }
          }
          const total = this.width * this.height;
          console.log(file, 'avg color:', r/total, g/total, b/total);
      })
      .on('error', (e) => console.log('error', e));
}

['screenshot1.png', 'screenshot2.png', 'screenshot3.png', 'screenshot4.png'].forEach(isBlank);
