---
name: OpenEmbedded color palette
description: Canonical dark blue-midnight color palette used across all inline-styled components
---

All panels, nodes, and modals use inline styles (not CSS variables) — any future color change
must be applied to each file individually. The canonical values are:

| Token   | Hex       | Use |
|---------|-----------|-----|
| BG      | #090C14   | Main page/app background |
| PANEL   | #111827   | Sidebar / panel background |
| SURFACE | #141926   | Card / elevated surface |
| BORDER  | #1D2539   | All borders (blue-tinted) |
| TEXT    | #E8EDFF   | Primary text (slight blue tint) |
| MUTED   | #64748B   | Secondary / muted text |
| FAINT   | #374165   | Very muted / placeholder text |
| ACCENT  | #5865F2   | Discord blurple — brand accent |
| CANVAS  | #0C0F1A   | React Flow canvas background |

**Why:** Shifted from neutral grey-dark to cool blue-midnight for a more premium product feel
(similar to Linear, Vercel dashboard). The subtle blue tint makes the interface feel intentional
rather than default-dark-mode.

**Key files that must stay in sync:**
- `NodeLibraryPanel.tsx`, `ExportPanel.tsx`, `PropertiesPanel.tsx` — each defines its own BG/SURFACE/BORDER constants
- `Builder.tsx` — hardcoded in the CSS `<style>` block for react-flow controls
- `Home.tsx` — module-level constants at the top of the file
