# 🛠️ Developer Utilities Tool Guide

The **Dev Utilities** suite (`/dashboard/dev`) contains 14 local playgrounds and conversion panels designed for encoding, formatting, cryptographic hashing, and syntax verification.

---

## 🛠️ The Tool Catalog

| Tool Name | Route | Core Technology | Description |
|---|---|---|---|
| **JSON Formatter** | `/dev/json` | Native `JSON.stringify` | Formats, beautifies, and validates JSON strings. |
| **Base64 Codec** | `/dev/base64` | `btoa` / `atob` / Web APIs | Encodes and decodes Base64 data. |
| **Hash Generator** | `/dev/hash` | Web Crypto API | Generates SHA-1, SHA-256, SHA-512, and MD5 digests. |
| **Color Converter** | `/dev/color` | Custom parsing math | Conversions between HEX, RGB, and HSL values. |
| **Lorem Generator** | `/dev/lorem` | Client array dictionaries | Generates placeholder text. |
| **URL Encoder** | `/dev/url` | `encodeURIComponent` | Encodes and decodes URL strings. |
| **JWT Decoder** | `/dev/jwt` | Base64 URL decoding | Inspects header and payload tokens without verification. |
| **UUID Generator** | `/dev/uuid` | `crypto.randomUUID` | Generates cryptographic version 4 UUIDs. |
| **Timestamp Converter**| `/dev/timestamp` | JavaScript `Date` API | Converts Epoch timestamps to ISO / local dates. |
| **Code Minifier** | `/dev/minifier` | Regular expression scrubbers | Strips whitespaces from CSS, HTML, and JS files. |
| **Regex Tester** | `/dev/regex` | `RegExp` execution | Highlight matches against regular expressions in real-time. |
| **Markdown Previewer**| `/dev/markdown` | `marked` library | Renders GitHub-flavored markdown to HTML. |
| **Diff Checker** | `/dev/diff` | `diff` package | Line-by-line and character diff inspections. |
| **QR Code Generator** | `/dev/qr` | `qrcode` package | Renders URLs or text strings as QR images. |

---

## 🔬 Core Implementation & Engine Mechanics

All Dev Utilities run **100% serverless** within the browser environment. None of these utilities send pasted strings (such as secure JWT tokens or database connection passwords) to any external logging nodes or analytics servers.

### 1. In-Browser Cryptography (Web Crypto API)
To generate cryptographic hashes without loading heavy dependencies, Pixie leverages the browser's native **Web Crypto API**:
```typescript
const generateHash = async (message: string, algorithm: "SHA-1" | "SHA-256" | "SHA-512") => {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
```
*Note: MD5 hashing falls back to a lightweight, custom JS script since the Web Crypto API does not implement the legacy MD5 algorithm due to security considerations.*

### 2. Markdown Parsing (`marked`)
The Markdown editor compiles input markdown dynamically:
*   **Implementation:** It pipes text inputs to the `marked` compiler configured with security sanitizers, allowing developers to see live previews of documentation or readme edits.
```typescript
import { marked } from 'marked';
const htmlContent = await marked.parse(markdownInput);
```

### 3. Compare Engines (`diff`)
The **Diff Checker** uses Myers' diff algorithm:
*   **Implementation:** It compares the old text block with the new text block line-by-line, producing output clusters marked as added, removed, or common, which are then rendered side-by-side with appropriate styling highlights.

### 4. QR Code Generation (`qrcode`)
Renders vector QR grids:
*   **Implementation:** Takes input text or URLs and draws the matrix configuration into a Canvas element or outputs it as an SVG element that users can download.
