# Misc Utilities & Tools

This directory contains miscellaneous utility scripts for various tasks.

> **Note:** These utilities are **general-purpose tools** and are not specific to MAF. They can be used for any project or task.

---

## ChatGPT Conversation Extractor

> **Purpose:** General-purpose tool for extracting text content from any ChatGPT share link. Not MAF-specific.

### Overview
Successfully extracts full conversation content from ChatGPT share links. This works where `curl`, `wget`, and other tools fail because ChatGPT pages are heavily JavaScript-dependent.

### Why This Is Needed
- ChatGPT share pages use React/Next.js for rendering
- Simple HTTP requests only return page metadata
- Playwright renders full page including all messages
- The `[data-message-author-role]` selector contains actual message content

### Installation
```bash
# Install Playwright
npm install playwright

# Install Chromium browser
npx playwright install chromium
```

### Usage
```bash
node extract-chatgpt-conversation.js <chatgpt-share-url>
```

### Example
```bash
node extract-chatgpt-conversation.js "https://chatgpt.com/share/695f253a-f798-8001-8a01-d899700c3257"
```

### Output
- Creates `chatgpt-conversation.txt` with full conversation
- Prints summary to console with message count and previews
- Messages separated by `========== NEXT MESSAGE ==========`

### Technical Details
- **Browser**: Chromium (headless)
- **Wait Strategy**: domcontentloaded + 15 second delay
- **Selector**: `[data-message-author-role]` (ChatGPT's message container)
- **Fallback**: If selector fails, attempts full body text extraction

### Troubleshooting
| Issue | Solution |
|-------|----------|
| "No messages found" | Increase wait time in script (currently 15000ms) |
| "Timeout exceeded" | Check internet connection, verify URL is accessible |
| Empty file | URL might be private, deleted, or invalid format |

### Comparison with Other Methods

| Method | Success Rate | Notes |
|--------|--------------|-------|
| `curl` | ❌ Fails | Only returns HTML metadata |
| `wget` | ❌ Fails | Doesn't execute JavaScript |
| `web_reader` MCP | ❌ Fails | Can't access rendered content |
| **Playwright** | ✅ Works | Full browser automation |

---

## Adding New Utilities

When adding new utility scripts to this directory:

1. Create a descriptive filename: `utility-name.js` or `utility-name.sh`
2. Add usage documentation to this README
3. Include installation requirements
4. Provide examples
5. Document troubleshooting steps

### Template for New Utilities

```markdown
## [Utility Name]

### Overview
[Brief description of what the utility does]

### Installation
```bash
[Installation commands]
```

### Usage
```bash
[Usage command]
```

### Output
[Description of output]

### Technical Details
[Implementation notes]
```
