# 💻 Setup & Deployment Guide

This document describes how to set up the Pixie development environment locally, configure environment parameters, install dependencies, and build the application for deployment.

---

## 📋 Prerequisites

Before running Pixie, ensure you have the following environments installed:
*   **Node.js:** `v18.x` or later (Recommended: `v20.x` or higher)
*   **npm:** `v9.x` or later (or yarn / pnpm / bun equivalent)
*   **Git:** To manage codebase repositories

---

## 🛠️ Environment Variables Configuration

To run Pixie with full features (including AI semantic routing, auth limit constraints, and Lemon Squeezy subscription checks), create a `.env.local` file in the root directory.

Here are the required keys:

```bash
# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here

# The Service Role Key (Secret Key) - Keep secure!
# WARNING: NEVER prefix this with NEXT_PUBLIC_ to prevent browser access.
SUPABASE_SECRET_KEY=sb_secret_your_role_key_here

# Google Gemini API Configuration (Used for prompt classifications)
GEMINI_API_KEY=AIzaSy_your_gemini_key_here

# Lemon Squeezy Configurations (Optional, for monetization tier check)
LEMON_SQUEEZY_API_KEY=your_lemonsqueezy_jwt_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_VARIANT_ID=your_product_variant_id
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret_phrase
```

---

## 🚀 Running Locally

Follow these steps to initialize the application on your computer:

### 1. Install Dependencies
Run the installation script in the root directory:
```bash
npm install
```
*Note: The postinstall phase runs a script (`scripts/download-yt-dlp.mjs`) to download the appropriate `yt-dlp` executable bin corresponding to your local operating system (Windows/Linux/MacOS), which is required for non-YouTube video parsing.*

### 2. Start the Development Server
Launch Next.js in hot-reloading dev mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser to access the Pixie home page.

### 3. Lint the Codebase
Analyze scripts for syntax or design rule errors:
```bash
npm run lint
```

### 4. Build for Production
To validate build checks and optimize production bundle weights, run:
```bash
npm run build
```

### 5. Start Production Server
Launch compiled bundles locally:
```bash
npm run start
```

---

## 📦 Production Deployment

Pixie compiles to a standard Next.js application, suitable for deployment on Vercel, Netlify, or standard server environments.

### Vercel Deployment Checklist:
1.  **Environment Variables:** Add all `.env.local` keys inside Vercel's Environment Variables dashboard.
2.  **COOP/COEP Headers:** Ensure that `next.config.ts` includes the required `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers. This is critical for WebAssembly multithreading execution.
3.  **Supabase Database Setup:** The backend queries a `guest_usage` table. Ensure the database contains the following table:
```sql
CREATE TABLE guest_usage (
  ip VARCHAR(45) PRIMARY KEY,
  count INT DEFAULT 0,
  last_date DATE DEFAULT CURRENT_DATE
);
```
4.  **Lemon Squeezy Webhooks:** Configure your Lemon Squeezy dashboard webhooks to target `https://yourdomain.com/api/webhook` with the corresponding secret key, permitting subscription tier activations when payments succeed.
