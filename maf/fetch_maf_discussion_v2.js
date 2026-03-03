const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to ChatGPT share...');
    await page.goto('https://chatgpt.com/share/695f253a-f798-8001-8a01-d899700c3257', {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    });
    
    console.log('Waiting for content to load...');
    await page.waitForTimeout(15000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'chatgpt_screenshot.png' });
    console.log('Screenshot saved');
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Try multiple extraction strategies
    console.log('\\n=== Attempting extraction ===');
    
    const strategies = [
      {
        name: 'NEXT_DATA',
        fn: () => {
          const script = document.getElementById('__NEXT_DATA__');
          return script ? JSON.stringify(JSON.parse(script.textContent), null, 2) : null;
        }
      },
      {
        name: 'Messages by data attribute',
        fn: () => {
          const msgs = document.querySelectorAll('[data-message-author-role]');
          return Array.from(msgs).map(m => m.textContent).join('\\n---\\n');
        }
      },
      {
        name: 'Full body text',
        fn: () => document.body.innerText
      }
    ];
    
    for (const strategy of strategies) {
      try {
        console.log(`\\nTrying: ${strategy.name}`);
        const result = await page.evaluate(strategy.fn);
        if (result && result.length > 100) {
          console.log(`\\n=== SUCCESS with ${strategy.name} ===`);
          console.log(result.substring(0, 10000));
          break;
        }
      } catch (e) {
        console.log(`Failed: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
