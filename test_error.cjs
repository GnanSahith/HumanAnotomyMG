const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  console.log('Page loaded, looking for a simulation to click...');
  
  await page.waitForSelector('button');
  const elements = await page.$$('button, div');
  let clicked = false;
  for (let el of elements) {
    const text = await el.evaluate(x => x.textContent);
    if (text && text.includes('Acid-Base Solutions')) {
      await el.click();
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.log('Could not find Acid-Base Solutions');
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
