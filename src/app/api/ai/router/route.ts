import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const FREE_TIER_DAILY_LIMIT = 100;

const SYSTEM_PROMPT = `You are Pixie AI Router, an internal classification engine for a local-first file conversion web app called Pixie. 

Your ONLY job is to read the user's natural language prompt and return a JSON object that tells the frontend which tool to open and what parameters to prefill.

## CRITICAL RULES
1. You NEVER perform the actual conversion. You NEVER output converted data (no JSON, no CSV, no formatted text). You only classify and extract.
2. You extract raw text/data the user provided in their prompt and put it into the "params" field so the TOOL can process it.
3. If the user's prompt contains enough information to run the tool immediately (e.g. they gave the input data and said "convert"), set "autoExecute" to true.
4. If the user is vague or just wants to open a tool without running it, set "autoExecute" to false.
5. "fileHint" tells the frontend how many files the user is attaching. The actual files stay in the browser and never come to you.

## AVAILABLE TOOLS (route → description)
### Image Magic
- /dashboard/image/compress → Compress images to smaller file sizes
- /dashboard/image/bg-remove → AI background removal from photos
- /dashboard/image/format → Convert image formats (PNG, JPG, WebP, etc.)
- /dashboard/image/watermark → Stamp watermark image onto a base image. Needs 2 images: first=base, second=watermark
- /dashboard/image/resize → Resize image to exact pixel dimensions
- /dashboard/image/crop → Crop regions from images
- /dashboard/image/rotate → Rotate and flip images
- /dashboard/image/filters → Apply photo filters (grayscale, sepia, blur, brightness)
- /dashboard/image/favicon → Generate favicon ICO from image
- /dashboard/image/palette → Extract dominant color palette from image
- /dashboard/image/annotate → Draw annotations on images
- /dashboard/image/images-to-pdf → Combine images into a single PDF

### Video Alchemy
- /dashboard/video/audio → Extract audio/MP3 from video
- /dashboard/video/silence → Remove/mute audio track from video
- /dashboard/video/compress → Compress video file size
- /dashboard/video/gif → Convert video to animated GIF
- /dashboard/video/rotate → Rotate video orientation
- /dashboard/video/speed → Change video playback speed
- /dashboard/video/trim → Trim video by start/end timestamps
- /dashboard/video/screenshots → Extract frames/screenshots from video at intervals
- /dashboard/video/merge → Merge multiple video files into one. Needs 2+ files

### PDF Spells
- /dashboard/pdf/compress → Compress PDF file size
- /dashboard/pdf/merge → Merge multiple PDF files into one. Needs 2+ files
- /dashboard/pdf/split → Split PDF into individual pages or ranges
- /dashboard/pdf/privacy → Strip metadata and sanitize PDF (formerly /lock)
- /dashboard/pdf/pdf-to-images → Extract pages from PDF as images
- /dashboard/pdf/rotate → Rotate all PDF pages
- /dashboard/pdf/page-numbers → Add page numbers to PDF
- /dashboard/pdf/text-watermark → Stamp text watermark on PDF pages
- /dashboard/pdf/reorder → Reorder/delete PDF pages visually

### Dev Utilities
- /dashboard/dev/json → Format/beautify/minify JSON
- /dashboard/dev/base64 → Encode/decode Base64 strings
- /dashboard/dev/hash → Generate MD5/SHA-1/SHA-256 hashes
- /dashboard/dev/color → Convert colors between HEX/RGB/HSL
- /dashboard/dev/lorem → Generate lorem ipsum placeholder text
- /dashboard/dev/url → Encode/decode URL components
- /dashboard/dev/jwt → Decode JWT token header and payload
- /dashboard/dev/uuid → Generate random UUID v4
- /dashboard/dev/timestamp → Convert Unix timestamps to human dates
- /dashboard/dev/minifier → Minify CSS/HTML/JS code
- /dashboard/dev/regex → Test regular expressions with match highlighting
- /dashboard/dev/markdown → Preview markdown rendered as HTML
- /dashboard/dev/diff → Compare two text blocks for differences
- /dashboard/dev/qr → Generate QR code from text or URL

### Text & Data
- /dashboard/text/word-counter → Count words, characters, sentences
- /dashboard/text/case-converter → Convert text case (upper, lower, title, camel, snake)
- /dashboard/text/replace → Find and replace text with optional regex
- /dashboard/text/csv → Convert between CSV and JSON formats
- /dashboard/text/speech → Convert text to speech audio

### Download Hub (Web to Browser)
- /dashboard/download/youtube → Download videos from YouTube
- /dashboard/download/instagram → Download videos/Reels from Instagram
- /dashboard/download/twitter → Download videos from X (Twitter)
- /dashboard/download/facebook → Download videos from Facebook

## PARAMS FIELD CONVENTIONS
- For text tools: use key "inputText" with the raw text/data the user wants processed
- For CSV tool: use "inputText" AND "mode" ("csv2json" or "json2csv")
- For video trim: use "startTime" and "endTime" (format HH:MM:SS)
- For video speed: use "speed" (e.g. "2" for 2x)
- For image resize: use "width" and "height". Include "lockAspectRatio": true if only ONE dimension is specified (to maintain ratio). Include "lockAspectRatio": false if BOTH width and height are specified (to allow custom stretching).
- For image rotate: use "rotation" (0, 90, 180, 270), "flipH" (boolean), and "flipV" (boolean)
- For image crop: use "x", "y", "width", "height" (numbers, in pixels)
- For image filters: use any of "brightness", "contrast", "saturate", "blur", "hueRotate", "grayscale", "sepia", "invert" (numbers matching the CSS scale, e.g. brightness 150 = 1.5x)
- For image compress: use "maxSizeMB" (convert kb to MB, e.g. 200kb = 0.2) and "maxWidthOrHeight"
- For video compress: use "crf" (e.g., 28 is high compression)
- For pdf compress: use "quality"
- For image format: use "targetFormat"
- For image/pdf background/lock: no params, leave as {}
- For dev/json: use "inputText" with the raw JSON string
- For dev/hash: use "inputText" with the text to hash
- For dev/base64: use "inputText" and "mode" ("encode" or "decode")
- For dev/color: use "inputText" with the color value
- For dev/jwt: use "inputText" with the raw JWT token string
- For watermark: use "fileHint" = 2 (first file = base, second = watermark), use "opacity" (0.1 to 1.0), and "position" ("center", "top-left", "top-right", "bottom-left", "bottom-right", "tiled")
- For merge PDF: use "fileHint" = 2
- For QR code: use "inputText" with the URL or text
- For regex: use "pattern" and "inputText"
- For diff: use "oldText" and "newText"
- For case converter: use "inputText" and "targetCase" (upper/lower/title/camel/snake)
- For find-replace: use "inputText", "findText", "replaceText"
- For text watermark on PDF: use "watermarkText"
- For lorem: use "count" (amount) and "type" ("paragraphs" or "characters")
- For uuid: use "count" (amount to generate)
- For screenshots: use "interval" (seconds between frames)
- /dashboard/pdf/page-numbers: use "textSize" ("small", "medium", or "large")
- For Downloaders (YT, IG, etc.): use "inputText" with the URL of the video
- For Video Merge: use "fileHint" = 2 (or more)
- For any tool that just needs a file and no specific settings, leave params as {}

## RESPONSE FORMAT (strict JSON, nothing else)
{
  "route": "/dashboard/...",
  "params": { ... },
  "fileHint": 0,
  "autoExecute": true/false,
  "message": "Brief friendly message about what Pixie is doing"
}

IMPORTANT: Return ONLY the JSON object. No markdown, no code fences, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    // --- SECURE QUOTA & AUTH CHECK ---
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    let isUnlimited = false;
    let promptsUsed = 0;
    
    // Get current date string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    if (user) {
      // FORCE FETCH FRESH METADATA FROM DB (Prevents 'Stuck Quota' from stale cookies)
      const adminSupabase = createAdminClient();
      const { data: { user: freshUser }, error: fetchErr } = await adminSupabase.auth.admin.getUserById(user.id);
      
      if (fetchErr) {
        console.error("Failed to fetch fresh user for quota:", fetchErr);
        // Fallback to session if fetch fails, though not ideal
      }

      const metadata = (freshUser || user).user_metadata || {};
      isUnlimited = metadata.tier === 'unlimited';
      
      const lastPromptDate = metadata.last_prompt_date;
      
      // If it's a new day, we treat their usage as 0
      if (lastPromptDate !== today) {
        promptsUsed = 0;
      } else {
        promptsUsed = metadata.prompts_used || 0;
      }

      if (!isUnlimited && promptsUsed >= FREE_TIER_DAILY_LIMIT) {
        return NextResponse.json({ 
          error: "You have reached your daily limit of 100 free AI prompts. Come back tomorrow or upgrade to Unlimited forever!" 
        }, { status: 402 }); // 402 Payment Required
      }

      // --- INCREMENT AUTH QUOTA BEFORE PROCESSING ---
      if (!isUnlimited) {
        try {
          await adminSupabase.auth.admin.updateUserById(user.id, {
            user_metadata: { 
              ...metadata,
              prompts_used: promptsUsed + 1,
              last_prompt_date: today
            }
          });
        } catch (adminErr) {
          console.error("Failed to pre-increment user quota:", adminErr);
        }
      }
    } else {
      // --- SERVER-SIDE GUEST GUARD ---
      try {
        const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const adminSupabase = createAdminClient();
        const { data: usage, error: fetchErr } = await adminSupabase.from("guest_usage").select("*").eq("ip", ip).single();
        
        if (fetchErr && fetchErr.code !== "PGRST116") {
          console.error("Guest usage pre-check error:", fetchErr);
        }

        if (usage && usage.last_date === today && usage.count >= 3) {
          return NextResponse.json({ 
            error: "Your guest limit has been reached for today. Sign in for unlimited spells!" 
          }, { status: 402 });
        }

        // --- INCREMENT GUEST QUOTA BEFORE PROCESSING ---
        try {
          if (usage && usage.last_date === today) {
            await adminSupabase.from("guest_usage").update({ count: usage.count + 1 }).eq("ip", ip);
          } else {
            await adminSupabase.from("guest_usage").upsert({ ip, count: 1, last_date: today });
          }
        } catch (incErr) {
          console.error("Guest increment logic failed:", incErr);
        }
      } catch (checkErr) {
        console.error("Guest guard check failed:", checkErr);
      }
    }
    // --- END QUOTA CHECK ---

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      }
    });

    const rawText = response.text?.trim() || "";

    // Robust JSON extraction: find the first { and last } to strip any chatty text or markdown
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      console.error("Malformed AI Response:", rawText);
      throw new Error("Pixie couldn't parse the AI response. Try rephrasing your request!");
    }
    
    // Parse JSON safely
    let parsed: any;
    try {
      const jsonStr = rawText.substring(start, end + 1);
      parsed = JSON.parse(jsonStr);
    } catch (parseErr: any) {
      console.error("AI Output Parse Error:", parseErr.message, "\nRaw Text:", rawText);
      return NextResponse.json({ 
        error: "Pixie's AI Core had trouble parsing that complicated prompt. Please try simplifying any special characters or quotes." 
      }, { status: 400 });
    }

    // Quota incremented at start of request for security

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("AI Router Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process AI request" },
      { status: 500 }
    );
  }
}
