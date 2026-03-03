const { chromium } = require('playwright');
const fs = require('fs');

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
    
    // Get ALL message content
    const content = await page.evaluate(() => {
      const msgs = document.querySelectorAll('[data-message-author-role]');
      return Array.from(msgs).map(m => m.textContent);
    });
    
    // Save to file
    fs.writeFileSync('maf_discussion_full.txt', content.join('\n\n========== NEXT MESSAGE ==========\n\n'));
    console.log('Saved full content to maf_discussion_full.txt');
    console.log('Total messages:', content.length);
    console.log('Total length:', JSON.stringify(content).length);
    
    // Print summary
    content.forEach((msg, i) => {
      const preview = msg.substring(0, 100).replace(/\n/g, ' ');
      console.log('Message ' + (i+1) + ': ' + preview + '...');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
