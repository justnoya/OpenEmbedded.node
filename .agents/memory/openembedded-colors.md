---
name: OpenEmbedded color palette
description: Canonical premium dark theme — near-black base with micro-border opacity system
---

## Premium Near-Black Palette (#0f0f0f base)

| Token      | Hex / Value                        | Use                                        |
|------------|------------------------------------|--------------------------------------------|
| Canvas BG  | `#0f0f0f`                          | ReactFlow canvas, outer page wrappers      |
| Panel BG   | `#161616`                          | Toolbar, sidebars, right panel, drawers    |
| Node BG    | `#1b1b1b`                          | Node wrapper base background               |
| Surface    | `rgba(255,255,255,0.04)`           | Inputs, select menus, option cards         |
| Border 1   | `rgba(255,255,255,0.04)`           | Whisper borders                            |
| Border 2   | `rgba(255,255,255,0.07)` ← main   | Primary borders throughout                 |
| Border 3   | `rgba(255,255,255,0.09)`           | Input field borders (PropertiesPanel)      |
| Border 4   | `rgba(255,255,255,0.12)`           | Emphasis borders                           |
| Text       | `#e8e8e8` / `#f0f0f0`             | Primary text                               |
| Muted      | `#606060`                          | Secondary, muted labels                    |
| Faint      | `#3a3a3a` / `#404040`             | Disabled, placeholder, ghost               |
| Accent     | `#5865F2`                          | Discord blurple — all interactive          |
| Accent L   | `#818cf8`                          | Active states, hover accent                |
| Grad BG    | `linear-gradient(135deg, #5865F2, #7c3aed)` | Primary buttons, Save button     |
| Handle     | `#1b1b1b`                          | Node handle border (2px solid)             |
| Scrollbar  | `rgba(255,255,255,0.1)` / `0.18` hover | Slim scrollbar thumb                  |

## Shadow System (defined in index.css as CSS variables)

| Variable          | Value                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| `--shadow-xs`     | 0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)                  |
| `--shadow-sm`     | 0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)                  |
| `--shadow-md`     | 0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)                 |
| `--shadow-lg`     | 0 8px 32px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)                |
| `--shadow-glow`   | 0 0 0 1px rgba(88,101,242,0.4), 0 0 0 3px rgba(88,101,242,0.12), 0 8px 24px rgba(0,0,0,0.5) |
| `--shadow-selected` | 0 0 0 2px rgba(88,101,242,0.35), 0 0 24px rgba(88,101,242,0.1), 0 4px 16px rgba(0,0,0,0.5) |

## Glass Effect Pattern (toolbar, dropdowns, modals)
```
background: rgba(15,15,15,0.92)          /* or rgba(22,22,22,0.95) for floating menus */
backdropFilter: "blur(24px) saturate(180%)"
border: "1px solid rgba(255,255,255,0.06)"
```

## Node Card Design (NodeWrapper.tsx)
- Background: `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 60%), #1b1b1b`
- Border: `rgba(255,255,255,0.07)` → selected: `rgba(88,101,242,0.55)`
- Selected shadow: `0 0 0 3px rgba(88,101,242,0.15), 0 0 24px rgba(88,101,242,0.08), 0 8px 32px rgba(0,0,0,0.6)`
- Top gradient accent bar: `linear-gradient(90deg, ${accentColor}, ${accentColor}60, transparent)`, height 2px
- Header background: `linear-gradient(90deg, ${accentColor}12 0%, ${accentColor}05 40%, transparent 100%)`
- Icon container: gradient bg `${accentColor}30 → ${accentColor}15`, border `${accentColor}25`

## CSS Custom Properties (index.css)
HSL Tailwind values:
- `--background: 0 0% 7%` → #111111 (close to #0f0f0f)
- `--card: 0 0% 9%` → #161616
- `--foreground: 0 0% 94%`
- `--muted: 0 0% 60%`

## Discord Preview — intentionally NOT changed
DiscordPreview.tsx uses Discord's own CHAT_BG `#313338` etc — never change these.

## Key Principles
- **Borders**: use `rgba(255,255,255,0.07)` primarily, NOT hard hex like `#333333`
- **Elevation**: communicated via shadow rings + subtle bg gradient, not color contrast
- **Glass toolbar**: `backdrop-filter: blur(24px) saturate(180%)` on all fixed headers
- **Primary actions**: always gradient `#5865F2 → #7c3aed` with box-shadow glow

**Why:** The user requested a deep research-based premium industrial upgrade (Linear/Vercel/Raycast/n8n style). Near-black (#0f0f0f) base allows accent colors to pop more. Opacity-based borders give a glass-feel micro-detail that flat hex colors cannot achieve.
