# 🎨 Design System: Pastel Squircles

Pixie utilizes a custom design theme named **"Pastel Squircles"**. This document specifies the UI design system tokens, color parameters, layout conventions, and animation rules to maintain consistency across the codebase.

---

## 🔮 The Core Philosophy

The "Pastel Squircles" aesthetic combines:
1.  **Warm Pastel Tones:** Soft Sage backgrounds, gentle lilac accents, and mint highlights to replace traditional stark corporate grids.
2.  **Squircles & Pill Radii:** Generous rounded borders (`--radius-bento: 48px`, `--radius-inner: 24px`) to create a soft, approachable bento-box feel.
3.  **High Contrast Details:** Dark Charcoal text (`#222222`) ensures readability and premium editorial contrast.
4.  **Premium Micro-Animations:** Interaction hovers, slide transitions, and physics-based details make the interface feel responsive and active.

---

## 🎨 Color Tokens (Light vs Dark Mode)

All colors are controlled via CSS custom properties defined in `src/app/globals.css`.

| Variable | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--soft-sage` | `#F4F7F4` | `#0A0A0A` | App background color. |
| `--deep-charcoal` | `#222222` | `#111111` | Primary text and sidebar background. |
| `--pure-white` | `#FFFFFF` | `#1A1A1A` | Surface bento card background. |
| `--mint-green` | `#A7F3D0` | `#059669` | Highlight indicators and success messages. |
| `--gentle-lilac` | `#C4B5FD` | `#6D28D9` | AI route highlights and category headers. |
| `--primary-accent` | `#6366F1` | `#818CF8` | Core interactive action items (buttons, range handles). |
| `--text-muted` | `#6B7280` | `#9CA3AF` | Supporting text metadata. |
| `--border` | `#E5E7EB` | `#27272A` | Layout outline borders. |

---

## 📐 Border Radius & Shadow Tokens

Rounding and shadow tokens create depth:
*   **Bento Cards:** `--radius-bento: 48px`
*   **Inner Elements (Inputs, inner boxes):** `--radius-inner: 24px`
*   **Action items (Pills, badges, toggle buttons):** `--radius-pill: 50px`
*   **Card Shadows:** `--shadow-bento: 0 30px 60px -15px rgba(0,0,0,0.05)` (light mode) / `0 30px 60px -15px rgba(0,0,0,0.5)` (dark mode).

---

## 🔤 Typography & Font Pairings

Pixie integrates two premium Google Fonts:
1.  **Inter (`var(--font-inter)`):** Used for all interface content, buttons, labels, and paragraph text. Offers high readability.
2.  **Plus Jakarta Sans (`var(--font-jakarta)`):** Used for headings (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`). Styled with a tight modern tracking value: `letter-spacing: -0.02em;`.

---

## 🎬 Micro-Animations

Interaction feedback is managed through Framer Motion configurations.

**Common Framer Motion Configurations:**
*   **Bento Hover Lift:** Tool card entries lift slightly on hover.
```typescript
whileHover={{ y: -5 }}
transition={{ duration: 0.2 }}
```
*   **Page Transitions:** Router redirects load with a subtle slide-up effect:
```typescript
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
```

---

## 📱 Responsive Grid Breakpoints

Pixie uses a flexible mobile-first layout. Grids shift depending on browser dimensions:
*   **Desktop (>= 1024px):** Three or four column Bento Grid card layouts.
*   **Tablet (768px - 1023px):** Two column Grid layout.
*   **Mobile (< 768px):** Single column Stacked layout. Rounded radii drop from `48px` to `24px` to maximize screen real estate.
