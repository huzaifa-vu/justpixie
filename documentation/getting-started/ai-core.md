# 🤖 Pixie AI Core & Semantic Routing

The Pixie dashboard features an intelligent conversational routing engine called the **Pixie AI Core**. This document details how Pixie interprets natural language instructions and coordinates client-side execution parameters without compromising privacy.

---

## 🧭 Semantic Routing Lifecycle

The AI Core acts as a traffic controller, not a processing engine. The diagram below illustrates how a natural language prompt is mapped to an in-browser tool page:

```
[User Prompt: "Resize my photo to 800 width"] 
                      │
                      ▼
            [/api/ai/router] (Gemini 2.5 Flash)
                      │
                      ├─► Classifies route: "/dashboard/image/resize"
                      └─► Extracts params: { "width": "800", "lockAspectRatio": true }
                      │
                      ▼
         [Client aiTransferCache Store]
                      │
                      ├─► Merges files dropped on screen
                      └─► Pushes payload to RAM cache
                      │
                      ▼
         Redirects to Target Route Page
                      │
                      ▼
      [Page Hydration (useAiHydration)]
                      │
                      └─► Pre-loads 800px width config & files
```

---

## ⚡ The Router Route Handler (`/api/ai/router`)

The AI Core utilizes a serverless route handler (`/api/ai/router/route.ts`) connected to Google's Gemini API via the `@google/genai` client.

### 1. Classification Engine (System Instruction)
The Gemini model is instructed with a strict system prompt containing:
1.  **Strict Limits:** The AI must *never* perform the file transformation itself. It only extracts instructions and parameter fields.
2.  **Tool Registry mapping:** An index mapping exact workspace routes (e.g. `/dashboard/pdf/merge`) to functional scopes.
3.  **Parameter Conversions:** Instruction on how to map variables (e.g. converting a user request of `"200kb"` to `{ "maxSizeMB": 0.2 }` for the compressor tool).
4.  **Fallback Strategy:** If the request is unsupported (e.g. `"Write an essay about HTML"`), the router sets `route: null` and `params: { unsupported: true }`.

### 2. Output Schema
The AI must respond with strict, valid JSON matching this schema:
```json
{
  "route": "/dashboard/image/compress" || null,
  "params": {
    "maxSizeMB": "0.2"
  },
  "fileHint": 1,
  "autoExecute": true,
  "message": "Directing you to the Image Compressor with a target size of 200KB..."
}
```

---

## 🔒 Secure RAM Transfer (`aiTransferCache`)

One of Pixie's core privacy features is that **user files are never uploaded to the Gemini API**. 

1.  When a user attaches files and types a prompt, only the **text prompt** is sent to the `/api/ai/router` API.
2.  The heavy files remain securely locked in the client's React memory.
3.  Once the API returns the target route, Pixie stores the files and extracted parameters in a client-side singleton module called `aiTransferCache.ts`.
4.  Pixie then programmatically routes the browser using Next.js `router.push(route)`.

**RAM Cache Implementation (`src/utils/aiTransferCache.ts`)**
```typescript
let aiStore = {
  targetRoute: null,
  files: [],
  params: {},
  autoExecute: false
};

export const getAiState = () => aiStore;
export const setAiState = (newState) => { aiStore = { ...aiStore, ...newState }; };
export const clearAiState = () => { aiStore = { targetRoute: null, files: [], params: {}, autoExecute: false }; };
```

---

## 🚰 Local Page Hydration (`useAiHydration`)

When a tool page loads, it checks if it was opened via the AI Core by invoking the `useAiHydration` hook. 

```typescript
useAiHydration(({ files, params, autoExecute }) => {
  if (files && files.length > 0) {
    handleNewFile(files[0]);
  }
  if (params?.maxSizeMB) setMaxSizeKB(Number(params.maxSizeMB) * 1024);
  
  if (autoExecute) setAutoRun(true);
}, "/dashboard/image/compress");
```
*Note: The hook immediately clears the RAM transfer cache to prevent parameter hydration loops if the user navigates away and clicks 'Back'.*

---

## 🛡️ The Local Data Zone Clipboard Protection

If a user pastes a massive code block, CSV file, or JSON array directly into a text input, it can trigger performance issues or exceed API token limits. Pixie implements a client-side **Clipboard Gate**:

1.  **Paste Detection:** The prompt bar listens for clipboard pastes. If a paste contains more than 1,000 characters, it triggers a **Data Paste Warning**.
2.  **RAM Isolation:** Pixie strips the massive content block out of the text prompt, prompts the user with an option dialog, and relocates the payload to the **Local Data Zone** (the bottom attachments box).
3.  **Instruction Optimization:** The text prompt is replaced with a reference key (e.g. `[Attached Clipboard Text]`), ensuring that only the semantic instruction (e.g., *"Convert this CSV to JSON"*) is sent to the server, while the actual data payload stays in the local browser cache.
