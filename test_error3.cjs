const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Click on Chemistry tab
  await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const chemTab = buttons.find(b => b.textContent.includes('Chemistry'));
      if (chemTab) chemTab.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Click first card
  await page.evaluate(() => {
      // Find the first thing that looks like a simulation card (has a title)
      const h3s = Array.from(document.querySelectorAll('h3'));
      if (h3s.length > 0) {
          // click the parent div
          h3s[0].closest('div').click();
      }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Read vite-error-overlay
  const errorText = await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay) {
          // get text from shadow root
          return overlay.shadowRoot.textContent;
      }
      return 'No Vite Overlay';
  });
  
  console.log('OVERLAY TEXT:', errorText);
  
  await browser.close();
})();
