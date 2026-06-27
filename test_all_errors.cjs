const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const chemTab = buttons.find(b => b.textContent.includes('Chemistry'));
      if (chemTab) chemTab.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const numCards = await page.evaluate(() => document.querySelectorAll('h3').length);
  
  for (let i = 0; i < numCards; i++) {
      await page.evaluate((idx) => {
          document.querySelectorAll('h3')[idx].closest('div').click();
      }, i);
      
      await new Promise(r => setTimeout(r, 1000));
      
      const isError = await page.evaluate(() => document.body.innerText.includes('Something went wrong'));
      if (isError) {
          const title = await page.evaluate(() => {
              const prev = document.querySelectorAll('h3');
              // Actually we are inside the sim now, so we can't read h3. We'll just report the index.
              return document.querySelector('details') ? document.querySelector('details').textContent : 'No details';
          });
          console.log(`Simulation ${i} CRASHED:`, title.substring(0, 200));
          
          // Click back to library
          // But it's crashed, so the back button is gone! We have to reload and go back to the tab.
          await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
          await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const chemTab = buttons.find(b => b.textContent.includes('Chemistry'));
              if (chemTab) chemTab.click();
          });
          await new Promise(r => setTimeout(r, 1000));
      } else {
          console.log(`Simulation ${i} OK`);
          // Click back to library
          await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const backBtn = buttons.find(b => b.textContent.includes('Back to Library'));
              if (backBtn) backBtn.click();
          });
          await new Promise(r => setTimeout(r, 500));
      }
  }
  
  await browser.close();
})();
