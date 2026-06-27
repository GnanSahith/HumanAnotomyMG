const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
      if (msg.type() === 'error') {
          console.log('PAGE ERROR LOG:', msg.text());
      }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  console.log('Page loaded');
  
  // Click on "Chemistry" tab
  const tabs = await page.$$('button');
  for (let t of tabs) {
      const text = await t.evaluate(x => x.textContent);
      if (text && text.includes('Chemistry')) {
          await t.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Click first simulation card
  const cards = await page.$$('.p-6, .cursor-pointer'); // the simulation card class
  for (let c of cards) {
      const text = await c.evaluate(x => x.textContent);
      if (text && text.includes('Acid-Base')) {
          await c.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Something went wrong')) {
      console.log('ERROR BOUNDARY TRIGGERED!');
      try {
          const details = await page.$('summary');
          if (details) await details.click();
          await new Promise(r => setTimeout(r, 500));
          const fullText = await page.evaluate(() => document.body.innerText);
          console.log('ERROR DETAILS:', fullText);
      } catch(e) {}
  }
  
  await browser.close();
})();
