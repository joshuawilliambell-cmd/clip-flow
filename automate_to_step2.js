const puppeteer = require('./node_modules/puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {width: 1920, height: 1080}
  });
  
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:43123/');
  console.log('Page loaded');
  
  await page.waitForTimeout(2000);
  
  // Click practice video button
  console.log('Looking for practice video button...');
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('practice'));
    if (btn) {
      console.log('Found practice button:', btn.textContent);
      btn.click();
      return true;
    }
    return false;
  });
  
  console.log('Practice button clicked:', clicked);
  await page.waitForTimeout(5000);
  
  // Click continue
  console.log('Looking for continue button...');
  const continued = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('continue'));
    if (btn) {
      console.log('Found continue button:', btn.textContent);
      btn.click();
      return true;
    }
    return false;
  });
  
  console.log('Continue clicked:', continued);
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({path: '/tmp/step2_ready.png', fullPage: true});
  console.log('Screenshot saved to /tmp/step2_ready.png');
  
  // Keep browser open for manual testing
  console.log('Browser ready for manual testing. Will close in 5 minutes.');
  await page.waitForTimeout(300000);
  
  await browser.close();
})();
