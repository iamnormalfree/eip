# ChatGPT Extractor - Quick Reference

> **General-purpose utility** - works with any ChatGPT share link, not MAF-specific.

## TL;DR
```bash
node scripts/misc/extract-chatgpt-conversation.js "<CHATGPT_SHARE_URL>"
```

## One-Time Setup
```bash
cd /root/projects/maf-github
npm install playwright
npx playwright install chromium
```

## What It Does
Extracts **full conversation text** from ChatGPT share links (works when curl/wget fail).

## Why It Works
| Tool | Result |
|------|--------|
| curl/wget | ❌ Only gets HTML metadata |
| **Playwright** | ✅ Renders full JS, gets actual messages |

## Example Session
```bash
$ node scripts/misc/extract-chatgpt-conversation.js "https://chatgpt.com/share/abc123"

🔧 Starting ChatGPT conversation extraction...
📍 URL: https://chatgpt.com/share/abc123

⏳ Navigating to ChatGPT share...
⏳ Waiting for content to render...
📤 Extracting conversation content...

✅ Extraction successful!
📊 Messages extracted: 48
💾 Saved to: chatgpt-conversation.txt
📏 Total size: 163136 characters
```

## Output File
```
chatgpt-conversation.txt
├── Message 1
├── ========== NEXT MESSAGE ==========
├── Message 2
├── ========== NEXT MESSAGE ==========
└── ...
```

## Troubleshooting
| Problem | Fix |
|---------|-----|
| No messages found | URL is private/deleted, or page didn't load |
| Timeout | Check internet, try again |
| Empty output | Verify URL format: `https://chatgpt.com/share/[id]` |

## Full Documentation
See: `scripts/misc/README.md`

---

**Tested on:** ChatGPT share links with 48+ messages, 160k+ characters
**Use case:** Any ChatGPT conversation that needs to be saved/archived/analyzed
