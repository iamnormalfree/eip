#!/usr/bin/env node

/**
 * ChatGPT Conversation Extractor
 *
 * GENERAL-PURPOSE UTILITY - Extracts text content from any ChatGPT share link.
 *
 * This script successfully extracts full conversation content from ChatGPT share links.
 * It uses Playwright to render the JavaScript-heavy page and extract message content.
 *
 * INSTALLATION:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * USAGE:
 *   node extract-chatgpt-conversation.js <chatgpt-share-url>
 *
 * EXAMPLE:
 *   node extract-chatgpt-conversation.js "https://chatgpt.com/share/695f253a-f798-8001-8a01-d899700c3257"
 *
 * OUTPUT:
 *   - Creates chatgpt-conversation.txt with full conversation
 *   - Prints summary to console
 *
 * WHY THIS WORKS:
 * - ChatGPT share pages are heavily JavaScript-dependent
 * - Simple curl/wget only returns page metadata
 * - Playwright renders full page including React components
 * - The [data-message-author-role] selector contains actual message content
 *
 * USE CASES:
 * - Archiving important conversations
 * - Extracting content for documentation
 * - Analyzing chat history
 * - Converting chat to text format
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function extractChatGPTConversation(url) {
  console.log('🔧 Starting ChatGPT conversation extraction...');
  console.log(`📍 URL: ${url}`);
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Navigate to the page
    console.log('⏳ Navigating to ChatGPT share...');
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    });

    // Wait for content to load (ChatGPT is React-heavy)
    console.log('⏳ Waiting for content to render...');
    await page.waitForTimeout(30000);

    // Extract all messages - try multiple selectors for Canvas vs regular chat
    console.log('📤 Extracting conversation content...');
    const content = await page.evaluate(() => {
      // For Canvas pages, get all text content from the main content areas
      const result = [];

      // Try to get conversation messages
      const messages = Array.from(document.querySelectorAll('[data-message-author-role]'));
      if (messages.length > 0) {
        result.push(...messages.map(m => `MESSAGE:\n${m.textContent}`));
      }

      // Try to get Canvas content
      const canvasContent = document.querySelector('[class*="canvas"]');
      if (canvasContent) {
        result.push(`CANVAS:\n${canvasContent.innerText}`);
      }

      // Try to get all article content
      const articles = Array.from(document.querySelectorAll('article'));
      if (articles.length > 0) {
        result.push(...articles.map(a => `ARTICLE:\n${a.innerText}`));
      }

      // Fallback: get entire body text, but filter out UI elements
      if (result.length === 0) {
        const body = document.body;
        // Remove common UI elements
        const uiSelectors = ['button', 'nav', '[role="navigation"]', '[role="banner"]'];
        uiSelectors.forEach(sel => {
          const elements = document.querySelectorAll(sel);
          elements.forEach(el => el.style.display = 'none');
        });
        result.push(body.innerText);
      }

      return result;
    });

    if (!content || content.length === 0 || (content.length === 1 && content[0].length < 100)) {
      throw new Error('No messages found. The page might not be fully loaded or accessible.');
    }

    // Save to file
    const outputFile = 'chatgpt-conversation.txt';
    const separator = '\n\n========== NEXT MESSAGE ==========\n\n';
    fs.writeFileSync(outputFile, content.join(separator));

    // Print summary
    console.log('');
    console.log('✅ Extraction successful!');
    console.log(`📊 Messages extracted: ${content.length}`);
    console.log(`💾 Saved to: ${outputFile}`);
    console.log(`📏 Total size: ${JSON.stringify(content).length} characters`);
    console.log('');
    console.log('📝 Message previews:');

    content.forEach((msg, i) => {
      const preview = msg.substring(0, 100).replace(/\n/g, ' ');
      console.log(`  ${i + 1}. ${preview}${msg.length > 100 ? '...' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('TROUBLESHOOTING:');
    console.error('1. Ensure the URL is a valid ChatGPT share link');
    console.error('2. Check that you have internet connectivity');
    console.error('3. Try increasing the wait time (currently 15000ms)');
    console.error('4. The conversation might be private or deleted');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Get URL from command line
const url = process.argv[2];

if (!url) {
  console.log('Usage: node extract-chatgpt-conversation.js <chatgpt-share-url>');
  console.log('');
  console.log('Example:');
  console.log('  node extract-chatgpt-conversation.js "https://chatgpt.com/share/695f253a-f798-8001-8a01-d899700c3257"');
  process.exit(1);
}

// Run extraction
extractChatGPTConversation(url).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
