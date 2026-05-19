# 🪄 Pixie Developer & User Documentation

Welcome to the official documentation for **Pixie**, a high-performance, local-first WebAssembly file conversion suite.

This documentation serves as a comprehensive guide for developers working on the codebase, system administrators auditing security and privacy, and anyone interested in understanding the inner workings of Pixie's "local file alchemy" and AI semantic router.

---

## 📂 Documentation Directory Map

This handbook is organized into three primary sections. Follow the links below to explore specific topics:

### 🚀 Getting Started
*   **[Core Philosophy & Overview](getting-started/overview.md)**
    *   What is Local-First Alchemy?
    *   Client-Side Privacy & Zero Server Costs
    *   Key Capabilities & User Journey
*   **[Technical Architecture](getting-started/architecture.md)**
    *   Framework & Page Structure (Next.js App Router)
    *   WebAssembly (WASM) Lazy Loading Patterns
    *   Client-Side State Cache
*   **[Pixie AI Core & Semantic Routing](getting-started/ai-core.md)**
    *   Semantic Router API (`/api/ai/router`)
    *   Prompt Classification & Parameter Parsing
    *   Secure RAM Transfer (`aiTransferCache`)
    *   Local Data Zone & Safety Guards

### 🧪 Detailed Tool Guides (The 50 Spells)
*   **[🖼️ Image Magic](tool-guides/image-magic.md)** (12 Tools)
    *   Compressor, BG Remover, Format, Watermark, Resize, Crop, Rotate, Filters, Favicon, Palette, Annotator, Images-to-PDF.
*   **[📄 PDF Spells](tool-guides/pdf-spells.md)** (9 Tools)
    *   Compress, Merge, Split, Privacy Scrubber, PDF-to-Images, Rotate, Page Numbers, Watermark, Reorder.
*   **[🎬 Video Alchemy](tool-guides/video-alchemy.md)** (10 Tools)
    *   Merge, Extract Audio, Silence, Compress, GIF Maker, Rotate, Speed, Trim, Screenshots, YouTube Downloader.
*   **[🛠️ Dev Utilities](tool-guides/dev-utilities.md)** (14 Tools)
    *   JSON, Base64, Hash, Color, Lorem, URL, JWT, UUID, Timestamp, Minifier, Regex, Markdown, Diff, QR.
*   **[📝 Text & Data](tool-guides/text-data.md)** (5 Tools)
    *   Word Counter, Case Converter, Find & Replace, CSV to JSON, Text to Speech.

### 💻 Development & Engineering Guidelines
*   **[Setup & Deployment](development/setup.md)**
    *   Environment Variable Requirements
    *   Dependencies & Local Development Commands
    *   Supabase Setup & API Integration
*   **[Design System: Pastel Squircles](development/design-system.md)**
    *   CSS Variable Palette (Soft Sage, Lilac, Charcoal)
    *   Bento Grid Layout Patterns & Massive Radius Border Tokens
    *   Micro-Animations & Interaction Transitions
*   **[Adding New Tools Tutorial](development/adding-tools.md)**
    *   Scaffolding Routes, Registry updates, CSS module styling
    *   Hydration Setup (`useAiHydration`) & File Drop integration
*   **[Authentication & Quota Systems](development/quota-auth.md)**
    *   Guest Quota Constraints (3 actions/day) vs Free Tier (100 actions/day)
    *   Daily Usage Counter Reset Logic (Supabase Auth Admin Metadata)

---

## 🔒 The Pixie Promise

Pixie is built on the core principle that **your files are yours alone**. Every operation documented in this handbook—whether it is compressing a 50MB video, removing the background from a portrait, or converting an invoice CSV to JSON—takes place completely inside your browser using compiled binaries or native Web APIs. 

No upload buttons, no server-side temp files, and zero leakage.
