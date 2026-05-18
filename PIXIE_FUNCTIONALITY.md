# Pixie Web App: Architecture & Functionality Guide

Welcome to the **Pixie** workspace guide. Pixie is a state-of-the-art, **local-first WebAssembly file alchemist** that processes all media, text, and PDF transformations directly inside your browser cache. No server queues, no subscription limits, and absolute privacy.

---

## 🔮 The Core Philosophy: "Local File Alchemy"

Most web utilities send your sensitive invoices, private photos, and videos to cloud servers for processing. This presents major privacy risks, high bandwidth costs, and server lag. 

Pixie changes this by loading **compiled WASM (WebAssembly) binaries, canvas context engines, and standard Web APIs** directly into the user's browser:
1. **100% Client-Side Privacy:** Your files never touch our servers. All operations happen in-memory.
2. **Instant Execution:** Browser-side processing processes images, extracts audio, or formats data in milliseconds without network delays.
3. **No File Limits:** Since compute happens on your own hardware (CPU/GPU), there are no artificial file upload caps.

---

## 🤖 Pixie AI Core: Semantic Tool Routing

The dashboard features the **Pixie AI Core**, which acts as an intelligent, conversational routing interface for all alchemical tools. 

```mermaid
graph TD
    User([User Prompt & Attached Data]) --> AI_Core[Pixie AI Core Input]
    AI_Core -->|Prompt Only| Router_API[/api/ai/router]
    AI_Core -->|Large File/Text Payload| Data_Zone[(Local Data Zone)]
    Router_API -->|Classifies & Resolves Route| Router_Callback{Route Resolver}
    Router_Callback -->|Target Route & Extracted Params| Local_Cache[setAiState Transfer Cache]
    Data_Zone -->|Secure File Payload| Local_Cache
    Local_Cache -->|Auto-Injects Parameters| Target_Tool[Target Functional Tool Page]
    Target_Tool -->|Local Canvas/WASM Compute| Downloader([Download Result])
```

### How the AI Semantic Routing Works:
1. **Plain English Input:** The user types a simple instruction (e.g., *"Convert this contact sheet to WebP"* or *"Merge my invoice PDFs"*).
2. **AI Classification:** The prompt is processed securely by the **AI Router API** (`/api/ai/router`). The router parses semantic meaning, determines the correct local page route, and extracts functional parameters (e.g. delimiters, formats, filters).
3. **Secure Transfer Cache (`setAiState`):** 
   - The extracted route and parameters are merged with the dropped files or text data payload.
   - The large payload **remains locked locally inside the React state cache**—it is never sent to the LLM.
4. **Auto-Execution Redirect:** Pixie instantly redirects the user to the correct tool page (e.g. `/dashboard/image/compress`) and automatically pre-loads the files and configuration parameters so execution starts instantly.

---

## 🔒 The Local Data Zone: Secure Sandbox

Pixie uses an advanced **Data Zone** panel specifically engineered to prevent data leakage:
- **Paste Detector:** If a user accidentally pastes huge data blocks (like a 10,000-character JSON payload or CSV string) directly into the AI prompt bar, Pixie triggers a **Data Paste Warning**.
- **Payload Extraction:** Pixie immediately isolates the payload, prompts the user to move it to the **Local Data Zone**, and keeps it strictly inside browser RAM, sending only the lightweight instruction prompt to the router.
- **Unified Drag & Drop:** Users can drop multi-megabyte videos, high-res images, or bundles of PDFs directly onto the screen. They are instantly parsed as standard file blobs and cached for processing.

---

## 🧪 Detailed Category & Tool Breakdown

Pixie organizes its local processing capabilities into five primary, high-density utility pillars:

### 1. 🖼️ Image Magic (`/dashboard/image`)
Processes image transformations using browser canvas contexts, CSS filters, and custom client compressors.
*   **Background Remover:** Uses precise, lightweight client-side edge-detection to isolate subjects and remove backdrops.
*   **WebP Compressor:** Encodes PNG/JPG to WebP format, reducing size by up to 95% while preserving quality.
*   **Images-to-PDF Converter:** Packages local photographs or scanned pages into a standard, compressed PDF document.
*   **Favicon Maker:** Resizes and packs custom artwork into multiple icon directories (.ico, .png).
*   **Palette Analyzer:** Renders interactive color swatches by extracting dominant hexadecimal colors from any loaded image.

### 2. 📄 PDF Spells (`/dashboard/pdf`)
Manipulates PDF files locally using modern in-memory parsing libraries like `pdf-lib` and `pdfjs-dist`.
*   **Compress PDF:** Compresses and resamples internal PDF structures to reduce megabytes instantly.
*   **Merge Invoices:** Combines multiple independent PDF docs into a single, structured file.
*   **Text Watermarker:** Stems corporate leakage by overlaying dynamic watermarks on pages.
*   **Privacy & Metadata Scrubber:** Erases hidden creator profiles, camera tags, and geotags.

### 3. 🎬 Video Alchemy (`/dashboard/video`)
Operates high-performance video compression and stream editing directly inside the browser using **WASM-compiled FFmpeg** cores.
*   **Video to Audio Extractor:** Extracts raw high-bitrate MP3 or WAV audio tracks from any movie stream.
*   **FFmpeg WASM Compressor:** Compresses bulky raw `.mov` recordings into optimized, web-ready `.mp4` structures.
*   **YouTube Downloader:** Accesses secure, local streams to grab backup recordings.
*   **Video GIF Maker:** Encodes custom-selected video loops into standard, optimized GIFs.

### 4. 💻 Dev Utilities (`/dashboard/dev`)
Offers immediate local playgrounds for encoding, parsing, and diagnostic tasks.
*   **URL Encoder/Decoder:** Encodes query parameters safely.
*   **JSON Formatter & Validator:** Beautifies and verifies syntax for nested JSON.
*   **JWT Analyzer:** Decodes token signatures and payloads in-memory.
*   **Minifier & Markdown Editor:** Lightens script weights and updates markdowns in real-time.

### 5. 🔤 Text & Data (`/dashboard/text`)
Manages data table structures, linguistic counts, and audio speech synthesis.
*   **CSV-to-JSON Parser:** Converts database dumps into clean arrays.
*   **Text-to-Speech:** Generates audio speech streams using native Web Speech synthesis.
*   **Word & Character Counter:** Displays high-density density analysis of typed content.
