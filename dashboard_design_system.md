# Pixie Dashboard: Design System & Brand Guidelines

This document serves as the ground truth for the **Pixie Dashboard** aesthetic. It provides precise tokens, layout rules, and interaction styles to ensure consistent AI-generated UI development.

---

## 1. Core Color Palette & Tokens

### Base Colors
- **Soft Sage:** `#F4F7F4` (Primary Background)
- **Deep Charcoal:** `#222222` (Primary Text, Sidebar Background)
- **Pure White:** `#FFFFFF` (Surface Cards)

### Accents
- **Mint Green:** `#A7F3D0` (Success, Progress, Brand Highlights)
- **Gentle Lilac:** `#C4B5FD` (Feature Icons, Secondary Accents)

### UI Tokens
| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--radius-bento` | `48px` | Maximum curvature for large containers/cards. |
| `--radius-pill` | `50px` | Full rounding for buttons and search bars. |
| `--radius-inner` | `24px` | Curvature for elements inside larger containers. |
| `--shadow-bento` | `0 30px 60px -15px rgba(0, 0, 0, 0.05)` | Soft, large-radius elevations. |

---

## 2. Dashboard Layout Architecture

### Container
- **Flexbox Layout:** `display: flex; height: 100vh; overflow: hidden;`
- **Spacing:** `padding: 1.5rem; gap: 1.5rem;` between sidebar and main content.

### Glassmorphism Specification
The dashboard relies heavily on high-quality glass effects.
- **Backdrop Blur:** `backdrop-filter: blur(20px)` to `30px`.
- **Saturation:** `saturate(150%)`.
- **Borders:** `1px solid rgba(255, 255, 255, 0.8)` (Light) or `0.08` (Dark).
- **Inset Highlights:** `inset 0 2px 10px rgba(255, 255, 255, 0.8)` to simulate surface thickness.

---

## 3. Typography
- **Headings:** `Plus Jakarta Sans`, Extra Bold (800), Letter-spacing: `-1px`.
- **Body:** `Inter`, Regular (400) or Semi-Bold (600).
- **Monospace:** `JetBrains Mono` or `Fira Code` (Used in JSON/Dev tools content).

---

## 4. Key Interactive Elements

### AI Command Box (The Anchor)
- **Background:** Multi-color Mesh Gradient (`#ffd3e2`, `#e6c3fc`, `#c3d4fd`, `#f2cffc`).
- **Animation:** `meshPan 15s ease infinite` rotating background positions.
- **Glass Input:** Prompt bar with `backdrop-filter: blur(20px)` and floating label logic.

### Category & Tool Cards
- **Aesthetic:** Minimalist bento-style cards.
- **Hover Transitions:**
    ```css
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: translateY(-8px) scale(1.02);
    ```
- **Micro-shadows:** Subtle shadow increase and border opacity jump on hover.

### Tool Navigation (Sidebar)
- **Active State:** Gradient background (`rgba(200, 150, 255, 0.15)` to `rgba(134, 239, 172, 0.3)`).
- **Icon Hover:** Scale (`1.15`) and rotate (`10deg`) for a playful feedback loop.

---

## 5. Themes (Light vs Dark)

### Dark Mode Transitions
- **Soft Sage** becomes `#0A0A0A`.
- **Pure White** cards become `#141414`.
- **Backdrop Filters** increase saturation but reduce base opacity (`rgba(15, 15, 15, 0.7)`).
- **Glows:** Replace shadows with very subtle colored glows (e.g., `rgba(181, 107, 245, 0.5)` for AI Box).

---

## 6. Animation Principles
1. **The "Bouncy" Curve:** All UI responses must use `cubic-bezier(0.34, 1.56, 0.64, 1)`. 
2. **Entrances:** Main content should fade in and slide up (`y: 20`) using Framer Motion.
3. **Micro-interactions:** Buttons should scale down slightly on click (`0.98`) and scale up on hover (`1.05`).

---

## 7. Implementation Checklist for New Pages
- [ ] Use `ToolWrapper` from `@/components/ToolWrapper`.
- [ ] Apply `backdrop-filter` to all elevated surfaces.
- [ ] Use `Lucide` icons with `gentle-lilac` background boxes.
- [ ] Ensure all inputs have high border-radii (`radius-pill`).
- [ ] Check accessibility contrast on text against Mesh Gradients.
