# OpenAgent — AI Agent for OpenEmbedded

> Code name: **OpenAgent**
> Purpose: An AI agent embedded in the OpenEmbedded builder that reads your prompt and builds your Discord message live on the canvas — adding nodes, setting properties, and connecting edges exactly as a human would, step by step, in real time.

---

## What it does

You type: *"Create a welcome message with a get-roles button"*

OpenAgent reads the canvas, plans the node structure, then **builds it live** — adding nodes, setting properties, connecting edges — exactly as a human would, step by step, in real time.

---

## Architecture: 3 Layers

### Layer 1 — Agent Brain (Backend LLM)

**Endpoint:** `POST /api/v1/agent/build`

- **Input:** prompt + current graph state (nodes, edges)
- **Output:** streamed tool calls via Server-Sent Events (SSE)
- LLM system prompt teaches it every node type, connection rule, and Discord CV2 spec
- The LLM thinks in terms of *"what Discord structure does this prompt need?"* → emits tool calls in order

**LLM Provider:** Replit AI integration (OpenAI or Anthropic via env secret — no key needed from user if using Replit integration)

---

### Layer 2 — Agent Tools (Canvas Operations)

These are the hands OpenAgent uses to build. Each tool maps directly to an existing `graphStore` action:

| Tool | What it does | Example |
|---|---|---|
| `read_canvas` | Get current nodes + edges | Agent reads existing state before building |
| `add_node` | Add a typed node at position | `add_node("button", {x:500,y:300}, {label:"Get Roles"})` |
| `connect_nodes` | Create an edge | `connect_nodes("actionrow-1", "button-1")` |
| `update_node` | Set node properties | `update_node("text-1", {content:"👋 Welcome!"})` |
| `move_node` | Reposition a node | `move_node("container-1", {x:200,y:100})` |
| `delete_node` | Remove a node | `delete_node("old-node-id")` |
| `pan_canvas` | Pan the viewport | `pan_canvas({x:400,y:200})` to follow the build |
| `select_node` | Highlight a node | `select_node("button-1")` while setting its text |
| `compile_preview` | Trigger the preview | Auto-called after build is complete |
| `add_message` | Send a chat bubble | Agent narrates what it's doing |

---

### Layer 3 — Agent UI (AgentPanel Streaming)

The existing Agent panel redesign becomes the orchestration surface:

```
User types: "Make an announcement with an image and footer"
                    ↓
┌─────────────────────────────────────────┐
│ ↺ Planning Discord embed structure      │  ← collapsible planning row
├─────────────────────────────────────────┤
│ "Building this in 3 stages: Container   │  ← plain agent text stream
│  → Section → TextDisplay + Thumbnail"   │
├─────────────────────────────────────────┤
│ [📦][𝐓][🖼] 3 nodes added               │  ← node icon row appears live
├─────────────────────────────────────────┤
│ ↺ Connecting components                 │  ← next planning row
├─────────────────────────────────────────┤
│ [📦][𝐓][🖼][⊞][⊟] ★ Connecting edges.  │  ← working row
└─────────────────────────────────────────┘
```

Every tool call fires a UI event:
- `add_node` → new node appears on canvas + icon added to chat row
- `connect_nodes` → edge animates into view
- `pan_canvas` → canvas smoothly pans to follow the build
- `select_node` → node briefly highlights (ring glow)
- `compile_preview` → preview panel auto-refreshes

---

## Build Sequence Example

**Prompt:** *"Welcome message + button"*

```
1.  read_canvas()                                      → agent sees empty canvas
2.  add_message("Planning structure…")
3.  add_node("container",   {x:200,y:150})             → Container appears
4.  add_node("textDisplay", {x:480,y:80},
             {content:"👋 Welcome!"})                  → TextDisplay appears
5.  connect_nodes("container", "textDisplay")          → edge draws
6.  add_node("actionRow",   {x:480,y:240})             → ActionRow appears
7.  connect_nodes("container", "actionRow")            → edge draws
8.  add_node("button",      {x:480,y:380},
             {label:"Get Roles", style:"Primary"})     → Button appears
9.  connect_nodes("actionRow", "button")               → edge draws
10. pan_canvas({x:340,y:230})                          → canvas centers on build
11. compile_preview()                                  → preview refreshes
12. add_message("✅ Done! 4 nodes built.")
```

---

## Data Flow

```
AgentPanel input
      │ prompt + graph snapshot
      ▼
POST /api/v1/agent/build
      │ SSE stream
      ▼
LLM (system prompt = all node types + rules + tools)
      │ tool_call sequence (JSON stream)
      ▼
AgentPanel SSE event handler
      │ executes each tool_call on graphStore
      ▼
Canvas (React Flow) updates in real time
      │
      ▼
Chat shows planning rows + node icon rows as build progresses
```

---

## Files to Create / Modify

| File | Change |
|---|---|
| `artifacts/api-server/src/routes/agent.ts` | **New** — SSE route, LLM call, tool call sequencing |
| `artifacts/api-server/src/routes/index.ts` | Mount new agent route |
| `lib/api-spec/openapi.yaml` | Add `/v1/agent/build` endpoint spec |
| `artifacts/openembedded/src/panels/AgentPanel.tsx` | Add SSE client, tool executor, live chat updates |
| `artifacts/openembedded/src/lib/graphStore.ts` | Expose `agentAddNode`, `agentConnect`, `agentMove` — throttled with animation |
| `artifacts/openembedded/src/lib/agentTools.ts` | **New** — maps tool names → graphStore calls + canvas pan/zoom |

---

## Phase 1 Scope

| In scope now | Out of scope (automation — soon™) |
|---|---|
| Prompt → Discord message structure | Scheduled sends |
| All CV2 node types | Webhook automation |
| Button + ActionRow interactive flows | Multi-step conversation editing |
| Real-time canvas animation | Undo-aware streaming |
| Streaming UI with planning rows | Team collaboration agent |

---

## LLM System Prompt (outline)

The system prompt sent to the LLM will include:

1. **Role definition** — "You are OpenAgent, an AI that builds Discord Components V2 messages by calling tools on a visual node graph."
2. **Node type reference** — Full list of every node type, its required fields, and valid child types
3. **Connection rules** — Container → TextDisplay / Section / ActionRow / Separator; ActionRow → Button / SelectMenu; etc.
4. **Tool schema** — JSON schema for each of the 10 tools
5. **Layout guidelines** — Standard x/y spacing so built graphs are readable (Container at x:200, children at x:480, spacing y:160)
6. **Output format** — Emit tool calls one at a time in JSON, each preceded by a brief narration string

---

## Status

- [ ] Backend: `POST /api/v1/agent/build` SSE route
- [ ] Backend: LLM integration + tool call streaming
- [ ] Frontend: SSE client in AgentPanel
- [ ] Frontend: Tool executor → graphStore bridge (`agentTools.ts`)
- [ ] Frontend: Live chat UI updates per tool call
- [ ] Frontend: Canvas pan/select animations
- [ ] QA: End-to-end test with 5 prompt types
- [ ] Automation phase (future)
