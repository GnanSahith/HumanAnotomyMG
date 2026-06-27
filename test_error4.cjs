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
  
  await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      if (h3s.length > 0) {
          h3s[0].closest('div').click();
      }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Something went wrong')) {
      const detailsText = await page.evaluate(() => {
          const details = document.querySelector('details');
          return details ? details.textContent : 'No details found';
      });
      console.log('ERROR DETAILS:', detailsText);
  } else {
      console.log('No error boundary detected.');
  }
  
  await browser.close();
})();
