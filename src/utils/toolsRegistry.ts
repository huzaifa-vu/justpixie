/**
 * Central registry of all tools available in Pixie.
 * Used for dynamic tool counting on the dashboard and navigation categorization.
 */

export interface ToolEntry {
  name: string;
  type: string;
  desc: string;
  href: string;
}

export const TOOLS_REGISTRY: Record<string, ToolEntry[]> = {
  image: [
    { name: 'Image Compressor', type: 'Image', desc: 'Instant shrink ray magic for heavy images.', href: '/dashboard/image/compress' },
    { name: 'Background Remover', type: 'Image', desc: 'AI-powered exact subject cutout.', href: '/dashboard/image/bg-remove' },
    { name: 'Format Converter', type: 'Image', desc: 'Batch convert between WebP, JPG, PNG & more.', href: '/dashboard/image/format' },
    { name: 'Watermark Wizard', type: 'Image', desc: 'Automatically stamp bulk visual assets.', href: '/dashboard/image/watermark' },
    { name: 'Image Resizer', type: 'Image', desc: 'Scale to exact dimensions with ratio lock.', href: '/dashboard/image/resize' },
    { name: 'Image Cropper', type: 'Image', desc: 'Slice pixel regions from any image.', href: '/dashboard/image/crop' },
    { name: 'Rotate & Flip', type: 'Image', desc: 'Rotate 90°/180°/270° and flip images.', href: '/dashboard/image/rotate' },
    { name: 'Image Filters', type: 'Image', desc: 'Grayscale, sepia, blur, brightness & more.', href: '/dashboard/image/filters' },
    { name: 'Favicon Generator', type: 'Image', desc: 'Generate favicons at all standard sizes.', href: '/dashboard/image/favicon' },
    { name: 'Color Palette Extractor', type: 'Image', desc: 'Extract hex colors directly from photos.', href: '/dashboard/image/palette' },
    { name: 'Image Annotator', type: 'Image', desc: 'Draw annotations over images visually.', href: '/dashboard/image/annotate' },
    { name: 'Images to PDF', type: 'Image', desc: 'Combine multiple images into a PDF.', href: '/dashboard/image/images-to-pdf' }
  ],
  pdf: [
    { name: 'Compress PDF', type: 'PDF', desc: 'Reduce megabytes in seconds.', href: '/dashboard/pdf/compress' },
    { name: 'Merge PDF', type: 'PDF', desc: 'Combine multiple documents gracefully.', href: '/dashboard/pdf/merge' },
    { name: 'Split PDF', type: 'PDF', desc: 'Extract specific pages rapidly.', href: '/dashboard/pdf/split' },
    { name: 'Privacy & Metadata', type: 'PDF', desc: 'Scrub identity data and flatten content.', href: '/dashboard/pdf/privacy' },
    { name: 'PDF to Images', type: 'PDF', desc: 'Extract pages as image files.', href: '/dashboard/pdf/pdf-to-images' },
    { name: 'Rotate Pages', type: 'PDF', desc: 'Rotate all pages by 90/180/270°.', href: '/dashboard/pdf/rotate' },
    { name: 'Add Page Numbers', type: 'PDF', desc: 'Stamp sequential numbers on pages.', href: '/dashboard/pdf/page-numbers' },
    { name: 'Text Watermark', type: 'PDF', desc: 'Stamp diagonal text across pages.', href: '/dashboard/pdf/text-watermark' },
    { name: 'Reorder Pages', type: 'PDF', desc: 'Visually swap, drag or delete pages.', href: '/dashboard/pdf/reorder' }
  ],
  video: [
    { name: 'A/V Merger', type: 'Video', desc: 'Locally merge video & audio streams.', href: '/dashboard/video/merge' },
    { name: 'Video to Audio', type: 'Video', desc: 'Extract MP3 directly in browser.', href: '/dashboard/video/audio' },
    { name: 'Video Silencer', type: 'Video', desc: 'Mute track audio natively.', href: '/dashboard/video/silence' },
    { name: 'Compress Video', type: 'Video', desc: 'Lossy size reduction without servers.', href: '/dashboard/video/compress' },
    { name: 'GIF Maker', type: 'Video', desc: 'Convert video slices into looped GIFs.', href: '/dashboard/video/gif' },
    { name: 'Rotate Video', type: 'Video', desc: 'Rotate 90°/180°/270° via WASM.', href: '/dashboard/video/rotate' },
    { name: 'Video Speed', type: 'Video', desc: 'Speed up or slow down video playback.', href: '/dashboard/video/speed' },
    { name: 'Video Trimmer', type: 'Video', desc: 'Slice segments precisely without delays.', href: '/dashboard/video/trim' },
    { name: 'To Screenshots', type: 'Video', desc: 'Capture frames natively at intervals.', href: '/dashboard/video/screenshots' },
    { name: 'YouTube Downloader', type: 'Download', desc: 'Securely extract high-quality YouTube videos.', href: '/dashboard/video/youtube' }
  ],
  dev: [
    { name: 'JSON Formatter', type: 'Dev', desc: 'Beautify, minify, and validate JSON instantly.', href: '/dashboard/dev/json' },
    { name: 'Base64 Codec', type: 'Dev', desc: 'Encode and decode Base64 strings.', href: '/dashboard/dev/base64' },
    { name: 'Hash Generator', type: 'Dev', desc: 'Generate MD5, SHA-1, SHA-256 hashes.', href: '/dashboard/dev/hash' },
    { name: 'Color Converter', type: 'Dev', desc: 'Convert between HEX, RGB, HSL formats.', href: '/dashboard/dev/color' },
    { name: 'Lorem Generator', type: 'Dev', desc: 'Generate placeholder text on demand.', href: '/dashboard/dev/lorem' },
    { name: 'URL Encoder', type: 'Dev', desc: 'Encode and decode URL components.', href: '/dashboard/dev/url' },
    { name: 'JWT Decoder', type: 'Dev', desc: 'Inspect header and payload of JWT tokens.', href: '/dashboard/dev/jwt' },
    { name: 'UUID Generator', type: 'Dev', desc: 'Generate cryptographic v4 UUIDs.', href: '/dashboard/dev/uuid' },
    { name: 'Timestamp Converter', type: 'Dev', desc: 'Convert Unix timestamps to dates.', href: '/dashboard/dev/timestamp' },
    { name: 'Code Minifier', type: 'Dev', desc: 'Strip whitespace from CSS/HTML/JS.', href: '/dashboard/dev/minifier' },
    { name: 'Regex Tester', type: 'Dev', desc: 'Test JS regular expressions safely.', href: '/dashboard/dev/regex' },
    { name: 'Markdown Previewer', type: 'Dev', desc: 'Render markdown to formatting instantly.', href: '/dashboard/dev/markdown' },
    { name: 'Diff Checker', type: 'Dev', desc: 'Compare text diffs side-by-side.', href: '/dashboard/dev/diff' },
    { name: 'QR Code Generator', type: 'Dev', desc: 'Generate URL and text QR Codes.', href: '/dashboard/dev/qr' }
  ],
  text: [
    { name: 'Word Counter', type: 'Text', desc: 'Count words, characters, sentences instantly.', href: '/dashboard/text/word-counter' },
    { name: 'Case Converter', type: 'Text', desc: 'Switch between UPPER, lower, Title, camelCase, snake_case.', href: '/dashboard/text/case-converter' },
    { name: 'Find & Replace', type: 'Text', desc: 'Replace text occurrences natively with Regex.', href: '/dashboard/text/replace' },
    { name: 'CSV to JSON', type: 'Data', desc: 'Convert spreadsheets to JSON strings.', href: '/dashboard/text/csv' },
    { name: 'Text to Speech', type: 'Audio', desc: 'Convert written text to lifelike voice.', href: '/dashboard/text/speech' }
  ]
};
