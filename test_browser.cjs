const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    
    await page.goto('http://localhost:5174/');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'screenshot1.png' });
    
    console.log("Loaded homepage, attempting to click Respiratory System...");
    await page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const resp = h3s.find(h => h.textContent.includes('Respiratory'));
        if (resp) resp.closest('.system-card').click();
    });
    
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: 'screenshot2.png' });
    
    console.log("Attempting to click Larynx...");
    await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.organ-item'));
        const larynx = items.find(i => i.textContent.includes('Larynx'));
        if (larynx) larynx.click();
    });
    
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: 'screenshot3.png' });

    console.log("Attempting to click something that had null modelSrc (like Nose)...");
    await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.organ-item'));
        const nose = items.find(i => i.textContent.includes('Nose'));
        if (nose) nose.click();
    });

    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: 'screenshot4.png' });

    console.log("Test finished.");
    await browser.close();
})();
