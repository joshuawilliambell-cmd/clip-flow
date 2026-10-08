const puppeteer = require('./node_modules/puppeteer');

(async () => {
  console.log('Starting Puppeteer test...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});
  await page.goto('http://127.0.0.1:43123/');
  await page.waitForTimeout(2000);
  
  console.log('Clicking practice video...');
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')];
    const btn = buttons.find(b => b.textContent.includes('practice'));
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(5000);
  console.log('Video should be loaded, clicking continue...');
  
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')];
    const btn = buttons.find(b => b.textContent.includes('Continue'));
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(3000);
  await page.screenshot({path: '/tmp/step2.png', fullPage: true});
  console.log('Step 2 screenshot saved');
  
  // Keep browser open
  await page.waitForTimeout(30000);
  await browser.close();
})();
