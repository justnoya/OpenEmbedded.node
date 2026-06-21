---
name: OpenEmbedded interaction edge system
description: Dual-edge-type graph: structural parent-child edges vs. interaction flow edges for Discord button/select responses.
---

## The rule
Two distinct edge types coexist in the graph:
- `type: "default"` — structural parent-child (Container → Section → Button etc.)
- `type: "interaction"` — on-click flow (Button/Select → Container/Embed response)

**Why:** Discord's interaction model requires buttons/selects to trigger response payloads that are structurally separate from the original message. Mixing them in one edge type would confuse the compiler.

## How to apply

**compiler.ts** — always filter edges before building the hierarchy:
```ts
const structuralEdges = edges.filter((e) => e.type !== "interaction");
```
Also skip utility nodes (`bot`, `openembedded`) from rootIds.

**graphStore.ts / onConnect** — detect which edge type to create:
```ts
if (isInteractionConnection(srcType, tgtType)) → create type:"interaction" edge
else if (isValidNodeConnection(srcType, tgtType)) → create type:"default" edge
```

**Builder.tsx / isValidConnection** — must allow BOTH:
```ts
return isValidNodeConnection(srcType, tgtType) || isInteractionConnection(srcType, tgtType);
```

**NodeWrapper.tsx** — nodeClass "interactive" + `showInteractionHandle={true}` prop:
- Without `showInteractionHandle`, CSS `pointer-events:none` hides the right handle for interactive sub-nodes.
- With it, the amber (#f59e0b) source handle is visible and draggable.

**connectionRules.ts** — key types:
- INTERACTION_SOURCES: button, selectMenu, userSelect, roleSelect, mentionableSelect, channelSelect
- INTERACTION_TARGETS: container, embed, section
- InteractionMode: "send_new" | "ephemeral" | "update_message" | "modal"

## Component types
- `componentType: -1` = user Bot node
- `componentType: -2` = OpenEmbedded platform node (standalone, no structural children/parents)

## Child order
`childOrder()` in PropertiesPanel must also filter out interaction edges:
```ts
edges.filter((e) => e.source === node.id && e.type !== "interaction")
```
