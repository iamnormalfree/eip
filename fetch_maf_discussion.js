const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to ChatGPT share...');
    await page.goto('https://chatgpt.com/share/695f253a-f798-8001-8a01-d899700c3257', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // Wait extra time for JS to render
    console.log('Waiting for content to load...');
    await page.waitForTimeout(10000);
    
    // Get all text content
    const content = await page.evaluate(() => {
      // Try to get message content
      const selectors = [
        '[data-message-author-role]',
        '[data-testid*="conversation"]',
        '[class*="markdown"]',
        '[class*="message"]',
        'article',
        'main'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const texts = Array.from(elements).map(el => el.innerText || el.textContent).filter(t => t && t.trim().length > 10);
          if (texts.length > 0) {
            return texts.join('\n\n--- SEPARATOR ---\n\n');
          }
        }
      }
      
      // Fallback to body
      return document.body.innerText;
    });
    
    console.log('=== CONTENT START ===');
    console.log(content);
    console.log('=== CONTENT END ===');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
})();
