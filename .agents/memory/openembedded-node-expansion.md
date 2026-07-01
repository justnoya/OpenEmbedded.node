---
name: OpenEmbedded node expansion (Discord CV2 + Automation)
description: Full scope of new nodes added in the big node-expansion session — all component types, automation classes, edge types, and wiring locations.
---

## Discord Components V2 — New Form Nodes

| Type key | componentType | Class |
|---|---|---|
| file | 13 | sub |
| checkboxGroup | 21 | main |
| checkbox | 20 | sub |
| radioGroup | 23 | main |
| radioButton | 22 | sub |
| label | 24 | sub |
| fileUpload | 25 | sub |

- ALLOWED_CHILDREN updated: container can hold file/checkboxGroup/radioGroup/label/fileUpload; checkboxGroup holds checkbox+label; radioGroup holds radioButton+label.
- compiler.ts: switch cases 13, 20, 21, 22, 23, 24, 25 added.

## Automation Trigger Nodes

| Type key | componentType | Class |
|---|---|---|
| eventTrigger | -10 | trigger |
| slashCommand | -11 | trigger |
| interactionTrigger | -12 | trigger |

## Automation Action Nodes

| Type key | componentType | Class |
|---|---|---|
| sendMessageAction | -20 | flow_action |
| editMessageAction | -21 | flow_action |
| deleteMessageAction | -22 | flow_action |
| addRoleAction | -23 | flow_action |
| removeRoleAction | -24 | flow_action |
| moderateAction | -25 | flow_action |
| sendDMAction | -26 | flow_action |
| addReactionAction | -27 | flow_action |
| createThreadAction | -28 | flow_action |
| replyAction | -29 | flow_action |
| pinMessageAction | -30 | flow_action |
| createChannelAction | -31 | flow_action |
| fetchMemberAction | -32 | flow_action |

## Flow Control Nodes

| Type key | componentType | Class |
|---|---|---|
| condition | -33 | flow_logic |
| delay | -34 | flow_action |
| variable | -35 | flow_action |
| httpRequest | -36 | flow_action |
| randomPick | -37 | flow_action |

**Why:** ConditionNode is the only branching node; its `flow_logic` class is a new NodeClass. Two source handles: `id="true"` (top-right, green) and `id="false"` (bottom-right, red).

## New Edge Type: `"flow"` (purple dashed)

Added to graphStore.onConnect — dispatches after isBotSendConnection and isInteractionConnection checks, before isValidNodeConnection check. FLOW_SOURCES and FLOW_TARGETS sets in connectionRules.ts drive validation. Flow edges are filtered out of structuralEdges in compiler.ts.

## compiler.ts: compileFlowGraph()

Separate export for automation — traverses flow edges, returns FlowDefinition[]. Key bug fixed: seed queue with trigger's outgoing successors (not the trigger node itself) so steps are populated correctly. Condition nodes branch via sourceHandle id ("true"/"false").

## CanvasNodeBar Groups

Order: Layout, Content, Interactive, Modals, **CV2 Forms**, Message & Modal, Advanced, Automation, **Auto Triggers**, **Auto Actions**, **Flow Control**, Legacy.

## Files Changed

- `src/canvas/nodes/` — 28 new .tsx node files
- `src/canvas/nodeTypes.ts` — registered all new types
- `src/lib/connectionRules.ts` — new NodeClass union, FLOW_SOURCES/TARGETS, isFlowConnection()
- `src/lib/graphStore.ts` — flow edge in onConnect
- `src/lib/compiler.ts` — CV2 form cases 13–25 + compileFlowGraph()
- `src/canvas/CanvasNodeBar.tsx` — new NODE_DEFS + GROUPS
- `src/panels/PropertiesPanel.tsx` — TYPE_META + renderFields guards for all new types
