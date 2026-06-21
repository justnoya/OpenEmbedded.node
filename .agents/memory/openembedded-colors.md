---
name: OpenEmbedded color palette
description: Canonical charcoal dark theme colors used across all UI components
---

## Charcoal Dark Palette (#1a1a1a base)

| Token   | Hex       | Use |
|---------|-----------|-----|
| BG      | `#1a1a1a` | Main page/app background, canvas background |
| Panel   | `#222222` | Toolbar, side panels, card backgrounds |
| Surface | `#2a2a2a` | Inputs, hover states, mini-surfaces |
| Border  | `#333333` | All borders, dividers |
| Node bg | `#242424` | Node wrapper background |
| Text    | `#e8e8e8` | Primary foreground |
| Muted   | `#888888` | Secondary / muted text |
| Faint   | `#555555` | Disabled, placeholder, very dim |
| Accent  | `#5865F2` | Discord blurple — all interactive elements |
| AccentL | `#818cf8` | Active tab indicators, hover accent |
| Scrollbar | `#2d2d2d` / `#444444` hover | Scrollbar thumb |

## CSS Custom Properties (index.css)

All HSL values use `0 0% N%` neutral grays (pure charcoal, no blue tint):
- `--background: 0 0% 10%` → #1a1a1a
- `--card: 0 0% 13%` → #222222
- `--border: 0 0% 20%` → #333333
- `--foreground: 0 0% 91%` → #e8e8e8
- `--muted: 0 0% 53%` → #888888
- `--input: 0 0% 17%` → #2b2b2b

## Discord Preview — intentionally NOT changed

DiscordPreview.tsx uses Discord's own CHAT_BG `#313338` etc — never change these.

## Component constants pattern

Each panel file defines its own constants at the top:
```ts
const BG = "#222222";      // Panel/toolbar background
const SURFACE = "#2a2a2a"; // Surfaces, inputs, hover
const BORDER = "#333333";  // Borders
const TEXT = "#e8e8e8";    // Text
const MUTED = "#888888";   // Muted text
const FAINT = "#555555";   // Faint/disabled
```
Canvas outer wrapper and ReactFlow canvas background use `#1a1a1a`.
React Flow controls/minimap CSS overrides in Builder.tsx also use these values.

**Why:** Old blue-midnight palette (#090C14 base) was replaced by the user with a neutral charcoal scheme. All old hex codes (#090C14, #0D1117, #0E1117, #131720, #1A1F2E, #1D2436, #0F1420, #0B0E18, #DDE3F5, #5C6882, #2D3652, #b1bac4, #7d8590, #e6edf3, #484f58) are fully removed.
