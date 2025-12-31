# Transformers.js Setup Instructions

The Health App now uses **Transformers.js** (by Xenova/Hugging Face) for AI-powered health analysis! Transformers.js runs entirely in your browser - no API keys needed.

## Quick Setup

1. **Download the Transformers.js library file:**
   - **Option 1 (Recommended - Latest version):**
     - Visit: https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/transformers.min.js
     - Or: https://unpkg.com/@xenova/transformers/dist/transformers.min.js
     - These URLs automatically use the latest version
   - **Option 2 (Check for specific version):**
     - Visit: https://www.npmjs.com/package/@xenova/transformers to see available versions
     - Then use: `https://cdn.jsdelivr.net/npm/@xenova/transformers@VERSION/dist/transformers.min.js`
   - Save the downloaded file as `transformers.js` in the same directory as `index.html`

2. **Or download via command line (PowerShell):**
   ```powershell
   # Download latest version
   Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/transformers.min.js" -OutFile "transformers.js"
   ```

3. **Start the server:**
   ```bash
   python server.py
   ```

4. **That's it!** The app will:
   - Download the Transformers.js library from your local server (first time only)
   - Show a progress bar during download
   - Cache it for future use
   - Download the AI model on first use (~100-500MB depending on model)
   - Use it for AI-powered health analysis

## How It Works

- **First time (library):** Downloads `transformers.js` from your local server with progress tracking
- **First time (model):** Downloads the AI model from Hugging Face with progress tracking
- **Subsequent uses:** Loads from browser cache (instant!)
- **Caching:** Both the library and model are cached for offline use

## Features

✅ **No API keys** - Everything runs locally in your browser  
✅ **Progress tracking** - See download progress for both library and model  
✅ **Offline support** - Cached for offline use  
✅ **Free** - No costs, no external services  
✅ **Hugging Face models** - Access to thousands of pre-trained models  

## Model Options

The default model is `Xenova/LaMini-Flan-T5-783M` - a fast, efficient model perfect for health analysis.

You can change the model in `app.js`:
```javascript
const TRANSFORMERS_CONFIG = {
  model: 'Xenova/LaMini-Flan-T5-783M', // Change this
  // Other recommended models:
  // 'Xenova/Qwen2.5-0.5B-Instruct' - Small, fast instruction-following
  // 'Xenova/Phi-3-mini-4k-instruct' - Microsoft's efficient model
  // 'Xenova/TinyLlama-1.1B-Chat-v1.0' - Very small, fast chat model
};
```

## Troubleshooting

If the download fails:
1. Check the latest version at: https://www.npmjs.com/package/@xenova/transformers
2. Visit: https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/ (or add version number if needed)
3. Download `transformers.min.js` or `transformers.js`
4. Save it as `transformers.js` in your app directory

The app will work fine without Transformers.js - it will use local analysis only, which is still comprehensive!

## Why Transformers.js?

- ✅ Easier to download and serve locally
- ✅ Better CDN availability
- ✅ Large model selection from Hugging Face
- ✅ Active development and community support
- ✅ Simple, clean API
