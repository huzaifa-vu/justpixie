# 🖼️ Image Magic Tool Guide

The **Image Magic** suite (`/dashboard/image`) offers 12 high-density web tools to transform, resize, and edit graphic assets entirely within the browser sandbox.

---

## 🛠️ The Tool Catalog

| Tool Name | Route | Core Technology | Description |
|---|---|---|---|
| **Image Compressor** | `/image/compress` | `browser-image-compression` | Compresses images using quality loss configurations and scale reductions. |
| **Background Remover** | `/image/bg-remove` | `@imgly/background-removal` | AI-powered segmentation that detaches subjects from images. |
| **Format Converter** | `/image/format` | HTML5 Canvas | Converts between PNG, JPG, WebP, GIF, and BMP formats. |
| **Watermark Wizard** | `/image/watermark` | HTML5 Canvas | Overlays watermarks with adjustable position and opacity. |
| **Image Resizer** | `/image/resize` | HTML5 Canvas | Scale dimensions with aspect ratio lock. |
| **Image Cropper** | `/image/crop` | `react-image-crop` + Canvas | Visual crop overlays for exact aspect ratio slicing. |
| **Rotate & Flip** | `/image/rotate` | HTML5 Canvas | Rotates 90/180/270 degrees and flips horizontally/vertically. |
| **Image Filters** | `/image/filters` | Canvas 2D + CSS filters | Applies sepia, grayscale, brightness, contrast, and blur. |
| **Favicon Generator** | `/image/favicon` | JSZip + Canvas | Packs images into multi-size `.ico` files and PNG sets. |
| **Color Palette Extractor** | `/image/palette` | Canvas pixel sampling | Extracts dominant colors and builds hexadecimal palettes. |
| **Image Annotator** | `/image/annotate` | Canvas Drawing context | Draws lines, rectangles, circles, and text annotations. |
| **Images to PDF** | `/image/images-to-pdf` | `pdf-lib` | Compiles image file arrays into a multi-page PDF document. |

---

## 🔬 Core Implementation & Engine Mechanics

### 1. AI Background Removal (`@imgly/background-removal`)
The **Background Remover** executes semantic segmentation directly on the user's client hardware.
*   **Engine initialization:** The library downloads compiled ONNX model weights (`.onnx` and `.wasm` helpers) when the tool loads, caching them in the browser's Cache Storage.
*   **In-Memory Processing:** The file is drawn into a WebGL context, the model extracts the background mask, and the original canvas is clipped to yield a transparent PNG.
*   **Privacy Guard:** No server-side API or cloud machine learning endpoint is contacted.

### 2. Image Compressor (`browser-image-compression`)
The compressor manages file sizes via an iterative scaling algorithm.
*   **Process:** It dynamically resamples image dimensions in a Web Worker thread, adjusting output JPEG/WebP quality compressions until the file size is under the user's target threshold (e.g. `100KB`).
*   **Memory Management:** Original and compressed assets are stored in memory as temporary Blob references.

### 3. Canvas Manipulation Pipeline (Format, Resize, Filters, Watermark)
These tools utilize native 2D drawing contexts. The processing pipeline follows a consistent layout:
1.  **Image Loading:** Load file blob as an HTML `Image` object:
    ```typescript
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    ```
2.  **Dimension Mapping:** Set canvas dimensions to the target resolution.
3.  **Context Operations:**
    *   *Resize:* `ctx.drawImage(img, 0, 0, targetWidth, targetHeight)`.
    *   *Filters:* Apply CSS filter rules directly to the canvas context, e.g. `ctx.filter = 'contrast(1.5) grayscale(0.8)'`.
    *   *Watermarking:* Draw the main image, then draw the watermark image at offset coordinates with `ctx.globalAlpha = opacity`.
4.  **Serialization:** Save canvas state using `canvas.toBlob(callback, "image/webp", quality)`.

### 4. Images to PDF (`pdf-lib`)
The **Images to PDF** tool merges multiple images:
*   **Execution:** For each image in the selection array, Pixie initializes a new PDF page via `pdf-lib`, loads the image binary data as a JPEG or PNG embed, draws the image stretched to match the page margins, and saves the output stream:
    ```typescript
    const pdfDoc = await PDFDocument.create();
    for (const file of files) {
      const page = pdfDoc.addPage();
      const imgBytes = await file.arrayBuffer();
      const pdfImg = file.type === "image/png" ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
      page.drawImage(pdfImg, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    }
    const pdfBytes = await pdfDoc.save();
    ```
