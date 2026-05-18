# Pixie — Beginner Onboarding & UX Friction Backlog

> **Philosophy:** A new user who has never heard of Pixie should open the app
> and understand *exactly* what it is, *exactly* what to do next, and feel
> *completely safe* doing it — all within the first few seconds.
>
> Work through these tasks **one at a time**, top-to-bottom, committing after
> each one so quality is never sacrificed.

---

## 🔴 CRITICAL — First Impressions (Do First)

- [ ] **T-01 · Restore the Landing Page**
  - The root `/` currently does a hard redirect straight to `/dashboard`.
  - A new visitor skips the entire "what is this?" moment and lands in a
    workspace they don't understand.
  - Restore `src/app/home-archive/page.tsx` as the live `/` route, replacing
    the current `redirect("/dashboard")` stub in `src/app/page.tsx`.
  - The GSAP hero, horizontal-scroll feature section, stacking-card deck,
    vault animation, and "Magic in 3 Steps" sticky-scroll section should all
    be live again.
  - Keep the marketing `MarketingWrapper` navbar ("Features", "How it works",
    "Pricing", "Get Started") visible on the landing page only.

- [ ] **T-02 · Fix the "Good Morning, Pixie" Identity Crisis**
  - When a user is not logged in, `displayName` falls back to `"Pixie"`,
    producing `"Good Morning, Pixie"` — the name of the app itself.
  - A first-time visitor will be confused: "Is that my name? Is it talking to
    itself?"
  - Change the guest fallback from `"Pixie"` → `"Explorer"` in
    `src/app/dashboard/page.tsx` (line ~253).
  - Result: guests see `"Good Morning, Explorer"` — friendly, warm, clear.

- [ ] **T-03 · Collapse the Data Zone by Default**
  - The "Attach Data" section (text textarea + file drop zone) is expanded
    by default via `dataExpanded: true` in state.
  - A beginner opening the dashboard sees: a giant AI prompt, an open code
    editor textarea, AND a file drop zone — all simultaneously. Massive
    cognitive overload.
  - Set `const [dataExpanded, setDataExpanded] = useState(false)` so the zone
    is collapsed by default.
  - The existing auto-expand logic (opens when user starts typing) already
    handles the progressive reveal correctly — we just need the right default.

---

## 🟠 HIGH — Reducing "Cold Start" Friction

- [ ] **T-04 · Add AI Prompt Quick-Start Suggestion Chips**
  - A new user stares at the blank prompt bar and has no idea what to type.
    "What can I even ask it?" is the silent question killing conversions.
  - Add 3–4 clickable example chips directly below the prompt input, e.g.:
    - `📄 Convert my CSV to JSON`
    - `📸 Compress an image`
    - `🎬 Extract audio from video`
    - `📝 Count the words in my text`
  - Clicking a chip should:
    1. Fill the instruction input with the example text.
    2. Auto-expand the Data Zone.
    3. Focus the submit button so the user understands the next action.
  - Style as pill-shaped glassmorphic chips consistent with the existing
    `.localBadge` aesthetic (see `page.module.css` line ~350).

- [ ] **T-05 · Add a "Try with Sample File" Button**
  - Even after the chips (T-04), the user still needs *a real file* to run
    the tool. They have to go hunt for one in their file system.
  - For image-based suggestions: inject `/apple-touch-icon.png` (42 KB,
    already in `/public/`) as a `File` object into `selectedFiles`. This
    means the user gets a real end-to-end test with zero effort.
  - For text-based suggestions: auto-fill the data textarea with a small
    inline sample (e.g., a 3-row CSV or a short paragraph).
  - Mark each chip clearly: `📄 CSV to JSON  · uses sample data` so users
    understand what is being loaded.
  - Files are injected locally via `new File([blob], "sample.png")` — no
    network calls, fully consistent with Pixie's privacy promise.

- [ ] **T-06 · Make the "Attach Data" Button Label Self-Explanatory**
  - The current toggle reads `"Attach Data"` — this is programmer-speak.
  - A beginner reads "Attach Data" and thinks "do I need to attach something?
    Is this required? What kind of data?"
  - Change the label to `"Attach a File or Paste Data"` when collapsed, and
    `"Hide Attachment Panel"` when expanded.
  - This removes ambiguity and surfaces the two concrete actions available.

---

## 🟡 MEDIUM — Trust & Education

- [ ] **T-07 · Add an Interactive Tooltip to the "🔒 Local Only" Badge**
  - The `.localBadge` badge currently says `"🔒 Local only"` but gives zero
    explanation. Skeptical users will assume it's marketing copy.
  - Add a hover tooltip (CSS-only or a tiny Framer Motion popover) that
    appears on hover with text like:
    > *"Your files never leave your browser. Pixie uses WebAssembly (WASM) to
    > run conversion engines directly on your hardware — no uploads, no
    > servers, no logs."*
  - This single UX change directly neutralises the biggest trust barrier new
    users have with file tools.

- [ ] **T-08 · Add a Typewriter Placeholder to the AI Prompt Input**
  - The existing `home-archive` page already has a working `TypewriterPlaceholder`
    component cycling through real-world example prompts.
  - Port this component into the dashboard's AI prompt input (currently a
    static placeholder string).
  - Cycle examples:
    - `"Compress this image to 200kb..."`
    - `"Remove audio from this video..."`
    - `"Turn this PDF into images..."`
    - `"Convert my CSV to JSON..."`
  - This shows the range of Pixie's capabilities passively, without requiring
    the user to read any documentation.

- [ ] **T-09 · Rename "Pixie AI Core" Section Header to Something Friendlier**
  - The AI command box header reads `"PIXIE AI CORE"` in uppercase. This
    sounds like a technical system name, not an invitation to interact.
  - Consider: `"✨ Ask Pixie Anything"` or `"🪄 What would you like to do?"`
  - This small copy change signals conversational intent and removes the
    "you need to know how this works" implication of "AI Core".

- [ ] **T-10 · Improve the "Trending Spells" Section Title**
  - Section heading: `"Trending Spells (Tools)"` — the `(Tools)` parenthetical
    is awkward and reveals uncertainty about whether the user will understand
    "Spells".
  - Either commit to the metaphor: `"✨ Popular Spells"` with a subtitle
    `"The most-used tools right now"`.
  - Or go literal: `"🔥 Popular Tools"`.
  - Remove the hedge. Pick one and own it.

- [ ] **T-11 · Add a Persistent "How It Works" Tip Banner (Dismissible)**
  - First-time users (guest, no localStorage key) should see a slim, elegant
    info banner at the top of the dashboard workspace:
    > `✨ New here? Pixie converts files 100% in your browser. Type what you
    > want in the box below — or click a category to browse tools.`
    > `[Got it ✓]`
  - Clicking "Got it" sets `localStorage.setItem("pixie_onboarded", "1")` and
    dismisses the banner with a smooth slide-up animation.
  - Never show it again after dismissal.
  - This is the single highest-value piece of free-text education we can give
    at zero cost to experienced users.

---

## 🟢 POLISH — Conversion & Clarity

- [ ] **T-12 · Fix the Dashboard Section Hierarchy (Duplicate "All Categories")**
  - `src/app/dashboard/page.tsx` currently renders:
    1. `<h2>Trending Spells (Tools)</h2>` (tool cards)
    2. `<h2>Magic in 3 steps</h2>` (onboarding)
    3. `<h2>Categories</h2>` (category cards)
    4. `<h2>All Categories</h2>` (immediately below, with no content)
  - The 4th heading "All Categories" appears immediately after "Categories"
    with nothing under it before the page ends. It's a ghost heading.
  - Remove or repurpose the orphaned `"All Categories"` h2 header.

- [ ] **T-13 · Move "Magic in 3 Steps" Above the Tool Cards**
  - Currently the page order is: [AI Box] → [Trending Tools] → [How It Works] → [Categories]
  - A beginner needs to understand HOW the app works BEFORE they see a grid
    of tools they don't yet know how to use.
  - Reorder: [AI Box] → [How It Works] → [Trending Tools] → [Categories]
  - The 3-step onboarding box becomes the bridge between "I just typed
    something" and "now I see tools I can click".

- [ ] **T-14 · Add a "What is WASM?" Micro-Explainer to the About Page**
  - `src/app/dashboard/about/page.tsx` mentions "WebAssembly (WASM)" in the
    description but never explains it in plain English.
  - Add one concise sentence: *"WebAssembly is a technology that lets websites
    run heavy programs at near-native speed, completely inside your browser,
    without needing a server."*
  - This makes the privacy story concrete and credible for non-technical users.

- [ ] **T-15 · Add Category Tool Count Badges to the Dashboard Category Cards**
  - Category cards currently show `"12 Tools"` (a count from the registry).
  - This is good, but the number alone doesn't help a beginner decide which
    category to enter.
  - Add one-line descriptions per category card. Examples:
    - Image Magic: `"Resize, compress, remove backgrounds & more"`
    - PDF Spells: `"Merge, split, compress & secure your PDFs"`
    - Video Alchemy: `"Convert, trim, mute & extract from videos"`
    - Dev Utilities: `"JSON, Base64, hashing, QR codes & 10 more"`
    - Text & Data: `"Word count, case conversion, CSV → JSON & more"`
  - This instantly answers "what will I find in here?" without clicking.

- [ ] **T-16 · Add "No Account Required" Reassurance Near the Login Nudge**
  - The sidebar footer shows `"Sign In for More"` button for guests.
  - A new user might feel pressured, thinking they MUST log in to use anything.
  - Add a small text line below or next to the button: `"All tools work without
    signing in"`.
  - This converts the CTA from a gate into an upgrade offer, reducing anxiety.

- [ ] **T-17 · Login Page — Add "What you get by signing in" Micro-List**
  - The login page (`/login`) has a "Continue as Guest" button but gives no
    reason to create an account.
  - Add a 3-bullet list between the form and the "Continue as Guest" button:
    - ✓ Unlimited AI routing prompts (guests get 3)
    - ✓ Your session quota resets daily
    - ✓ Future features for registered users
  - This clarifies the value exchange without feeling like a sales pitch.

---

## 🔵 FUTURE — Longer-Term UX Debt

- [ ] **T-18 · Search / Filter Within Category Hub Pages**
  - `src/app/dashboard/image/page.tsx` lists 12 tools in a grid with no
    search. At 14 dev tools or 12 image tools, finding the right tool requires
    scanning the entire grid.
  - Add a small, pill-shaped search/filter input at the top of each hub page
    that does client-side name-matching against the tool list.

- [ ] **T-19 · Keyboard Shortcut Indicator on Submit Button**
  - The prompt input fires on `Enter`, but there is no UI hint.
  - Add a subtle `⏎ Enter` keyboard badge to the right of the submit button
    (only visible when the input is focused).
  - Mirrors the style already in `home-archive` (`inputHint` class).

- [ ] **T-20 · Offline Detection Banner**
  - Pixie's biggest superpower is that it works offline (everything is WASM).
  - When the browser goes offline (`window.addEventListener('offline', ...)`),
    show a premium mint-green banner: `"⚡ You're offline — Pixie still works
    100%. All your tools are running locally."`.
  - This turns a potential panic moment into a trust-building delight.

---

*Last updated: 2026-05-18*
*Each task is self-contained. Implement one, test it, commit, then move on.*
