# 📄 PDF Spells Tool Guide

The **PDF Spells** suite (`/dashboard/pdf`) leverages client-side JavaScript parser engines to manipulate, merge, and secure PDF structures directly inside browser RAM.

---

## 🛠️ The Tool Catalog

| Tool Name | Route | Core Technology | Description |
|---|---|---|---|
| **Compress PDF** | `/pdf/compress` | `pdf-lib` + Re-sampling | Compresses PDF internal structures and reduces graphic resolution. |
| **Merge PDF** | `/pdf/merge` | `pdf-lib` | Appends pages from multiple PDF files in sequential order. |
| **Split PDF** | `/pdf/split` | `pdf-lib` | Extracts page ranges or slices documents into individual single-page files. |
| **Privacy & Metadata** | `/pdf/privacy` | `pdf-lib` | Erases document metadata fields and creator footprints. |
| **PDF to Images** | `/pdf/pdf-to-images` | `pdfjs-dist` | Renders PDF pages onto canvases and exports them as PNG zip files. |
| **Rotate Pages** | `/pdf/rotate` | `pdf-lib` | Rotates document pages in 90-degree steps. |
| **Add Page Numbers** | `/pdf/page-numbers` | `pdf-lib` | Stamps sequential numbers (e.g. "Page 1 of 5") onto pages. |
| **Text Watermark** | `/pdf/text-watermark` | `pdf-lib` | Stencils custom watermark text diagonally across pages. |
| **Reorder Pages** | `/pdf/reorder` | `pdfjs-dist` + `pdf-lib` | Visually drag, drop, delete, or swap PDF page indexes. |

---

## 🔬 Core Implementation & Engine Mechanics

### 1. Structure Writing (`pdf-lib`)
`pdf-lib` is used to load, modify, and save PDF files in-memory:
*   **Loading:** Files are converted to `ArrayBuffer` arrays before being loaded:
    ```typescript
    import { PDFDocument } from 'pdf-lib';
    const pdfDoc = await PDFDocument.load(fileBytes);
    ```
*   **Merging:** Pixie creates a new master document, copies pages from loaded documents, and appends them:
    ```typescript
    const mergedDoc = await PDFDocument.create();
    for (const srcDoc of loadedDocs) {
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }
    const bytes = await mergedDoc.save();
    ```

### 2. Client Rendering (`pdfjs-dist`)
To display preview thumbnails, split pages visually, or convert documents to image bundles, Pixie uses `pdfjs-dist`:
*   **Engine Setup:** The PDFJS global worker is bound to a local asset or CDN path to prevent SSR blockages:
    ```typescript
    import * as pdfjsLib from 'pdfjs-dist';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    ```
*   **Canvas Extraction:** The document is loaded, pages are retrieved, and rendered onto hidden canvases:
    ```typescript
    const loadingTask = pdfjsLib.getDocument({ data: fileBytes });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport }).promise;
    ```

### 3. Privacy & Metadata Scrubbing
The metadata scrubber targets hidden data tags:
*   **Logic:** It overwrites the document's information dictionary, clearing fields like author, creator, producer, subject, and title. It also deletes metadata streams that might store camera tags or GPS information:
    ```typescript
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
    pdfDoc.setCreationDate(new Date(0));
    pdfDoc.setModificationDate(new Date(0));
    ```

### 4. Text Watermarking
The watermarker draws text on top of existing content:
*   **Coordinate mapping:** PDF coordinates start from the bottom-left corner of the page. The watermarker calculates center points, rotates the graphics context by a target angle (typically -45 degrees), draws translucent text, and resets the context:
    ```typescript
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawText('CONFIDENTIAL', {
        x: width / 4,
        y: height / 2,
        size: 50,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
        rotate: degrees(-45),
      });
    });
    ```
