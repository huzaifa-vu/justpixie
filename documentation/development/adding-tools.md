# 🪄 Adding New Tools Guide

This developer guide describes how to build, register, and connect a new client-side file transformation tool to Pixie.

---

## 🛠️ Step-by-Step Implementation

To add a new tool (e.g. an "SVG Optimizer" in the `/dashboard/image` category), follow these steps:

### Step 1: Create the Page Route Directory
Create a new directory in the appropriate category folder under `src/app/dashboard/`:
```
src/app/dashboard/image/svg-optimizer/
├── page.tsx
└── page.module.css
```

### Step 2: Register the Tool in the Registry
To make the tool appear in the category hub search results and metrics, append its metadata to `src/utils/toolsRegistry.ts`:

```typescript
// src/utils/toolsRegistry.ts
export const TOOLS_REGISTRY = {
  image: [
    ...
    { 
      name: 'SVG Optimizer', 
      type: 'Image', 
      desc: 'Optimizes local SVGs and removes editor garbage tags.', 
      href: '/dashboard/image/svg-optimizer' 
    }
  ],
  ...
};
```

### Step 3: Implement Page Layout & Style
Your tool page should share Pixie's "Pastel Squircle" aesthetics. Use the modular CSS styles pattern.

**Page Structure Scaffold (`page.tsx`):**
```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Image as ImageIcon } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";
import { DropZone } from "@/components/DropZone";
import styles from "./page.module.css";

export default function SvgOptimizer() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  // AI Hydration integration
  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) setFile(files[0]);
    // Pre-load specific tool parameters if any are configured
  }, "/dashboard/image/svg-optimizer");

  const optimizeSvg = async () => {
    if (!file) return;
    setIsProcessing(true);
    // In-memory manipulation logic here
    setIsProcessing(false);
  };

  return (
    <div className={styles.toolContainer}>
      <header className={styles.toolHeader}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.iconBox}><ImageIcon size={24} /></div>
        <div>
          <h1 className={styles.title}>SVG Optimizer</h1>
          <p className={styles.subtitle}>Optimize vector illustrations locally.</p>
        </div>
      </header>

      <div className={styles.mainWorkspace}>
        <div className={styles.previewArea}>
          {!file ? (
            <DropZone onFilesSelected={handleFiles} accept=".svg" title="Drop SVG here" />
          ) : (
            <div>File Loaded: {file.name}</div>
          )}
        </div>
        
        <aside className={styles.configSidebar}>
          <button onClick={optimizeSvg} disabled={!file || isProcessing}>
            <Sparkles size={18} /> Cast Optimize
          </button>
        </aside>
      </div>
    </div>
  );
}
```

### Step 4: Register in the AI Semantic Router System
To connect your tool to Pixie's AI command search, update the system prompt in `src/app/api/ai/router/route.ts`:

1.  **Add the route to the list of available tools:**
    ```typescript
    // src/app/api/ai/router/route.ts
    // Under the appropriate category header:
    - /dashboard/image/svg-optimizer → Optimizes vector SVGs and cleans garbage tags.
    ```
2.  **Document parameter parsing conventions (if your tool consumes inputs):**
    ```typescript
    - For SVG optimization: use "cleanMetadata" (boolean) and "minify" (boolean)
    ```

### Step 5: Test Execution
1.  Verify the tool is searchable in `/dashboard/image`.
2.  Open the main dashboard and type: *"optimize my vector svg file"*.
3.  Ensure the AI successfully routes the prompt and opens `/dashboard/image/svg-optimizer`.
