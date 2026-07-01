// @ts-nocheck
import { AppNode } from "./graphStore.js";
import { Edge } from "@xyflow/react";

export interface DiscordMessagePayload {
  flags?: number;
  components?: unknown[];
  embeds?: unknown[];
  content?: string;
}

export interface CompileResult {
  payload: DiscordMessagePayload;
  isValid: boolean;
  errors: { nodeId: string; message: string }[];
}

// ─────────────────────────────────────────────────────────────
//  Flow Compiler — produces a FlowDefinition for the bot
// ─────────────────────────────────────────────────────────────

export interface FlowStep {
  id: string;
  type: string;
  data: Record<string, unknown>;
  next?: string;    // default next step id
  nextTrue?: string;  // condition true branch
  nextFalse?: string; // condition false branch
}

export interface FlowDefinition {
  trigger: { type: string; config: Record<string, unknown> };
  steps: FlowStep[];
}

export interface FlowCompileResult {
  flows: FlowDefinition[];
  errors: { nodeId: string; message: string }[];
}

const TRIGGER_TYPES = new Set(["eventTrigger", "slashCommand", "interactionTrigger"]);

export function compileFlowGraph(nodes: AppNode[], edges: Edge[]): FlowCompileResult {
  const errors: { nodeId: string; message: string }[] = [];
  const flowEdges = edges.filter((e) => e.type === "flow");
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build adjacency: outgoing flow edges per source
  const flowNext = new Map<string, { targetId: string; handleId?: string }[]>();
  for (const e of flowEdges) {
    if (!flowNext.has(e.source)) flowNext.set(e.source, []);
    flowNext.get(e.source)!.push({ targetId: e.target, handleId: e.sourceHandle ?? undefined });
  }

  // Find all trigger nodes
  const triggerNodes = nodes.filter((n) => TRIGGER_TYPES.has(n.type ?? ""));
  if (triggerNodes.length === 0) return { flows: [], errors };

  const flows: FlowDefinition[] = [];

  for (const trigger of triggerNodes) {
    const visited = new Set<string>();
    visited.add(trigger.id); // mark trigger as visited so it's skipped as a step
    const steps: FlowStep[] = [];

    // Seed queue with the trigger's direct successors
    const initialNexts = flowNext.get(trigger.id) ?? [];
    const queue: string[] = initialNexts.map((n) => n.targetId);

    while (queue.length) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const nexts = flowNext.get(nodeId) ?? [];
      const step: FlowStep = {
        id: nodeId,
        type: node.type ?? "",
        data: { ...node.data } as Record<string, unknown>,
      };

      if (node.type === "condition") {
        const trueEdge = nexts.find((n) => n.handleId === "true");
        const falseEdge = nexts.find((n) => n.handleId === "false");
        if (trueEdge) { step.nextTrue = trueEdge.targetId; queue.push(trueEdge.targetId); }
        if (falseEdge) { step.nextFalse = falseEdge.targetId; queue.push(falseEdge.targetId); }
      } else {
        const next = nexts[0];
        if (next) { step.next = next.targetId; queue.push(next.targetId); }
      }
      steps.push(step);
    }

    flows.push({
      trigger: {
        type: trigger.type ?? "",
        config: { ...trigger.data } as Record<string, unknown>,
      },
      steps,
    });
  }

  return { flows, errors };
}

// ─────────────────────────────────────────────────────────────
export function compileGraph(nodes: AppNode[], edges: Edge[]): CompileResult {
  const errors: { nodeId: string; message: string }[] = [];

  if (!nodes.length) {
    return { payload: { flags: 32768, components: [] }, isValid: true, errors: [] };
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, string[]>();
  const parentOf = new Map<string, string>();

  // Only structural edges (type "default" or undefined) define the message hierarchy.
  // Interaction, send, and flow edges are not structural.
  const structuralEdges = edges.filter(
    (e) => e.type !== "interaction" && e.type !== "send" && e.type !== "flow"
  );

  for (const edge of structuralEdges) {
    if (!childrenOf.has(edge.source)) childrenOf.set(edge.source, []);
    childrenOf.get(edge.source)!.push(edge.target);
    parentOf.set(edge.target, edge.source);
  }

  // Root nodes: no incoming structural edges, and not a utility node (bot, openembedded, modal)
  // Message nodes are handled separately below.
  const UTILITY_TYPES = new Set(["bot", "openembedded", "modal", "message"]);
  const rootIds = nodes
    .filter((n) => !parentOf.has(n.id) && !UTILITY_TYPES.has(n.type ?? ""))
    .map((n) => n.id);

  let hasV2 = false;

  function buildComponent(id: string): Record<string, unknown> | null {
    const node = nodeMap.get(id);
    if (!node) return null;
    const d = node.data ?? {};
    const kids = childrenOf.get(id) ?? [];

    switch (d.componentType) {
      case 17: {
        hasV2 = true;
        const builtComponents: Record<string, unknown>[] = [];
        for (const kid of kids) {
          const kidNode = nodeMap.get(kid);
          if (kidNode?.data?.componentType === 11) {
            const thumbBuilt = buildComponent(kid);
            if (thumbBuilt) builtComponents.push({ type: 9, components: [], accessory: thumbBuilt });
          } else {
            const built = buildComponent(kid);
            if (built) builtComponents.push(built);
          }
        }
        if (builtComponents.length === 0) return null;
        const comp: Record<string, unknown> = { type: 17, components: builtComponents };
        if (d.accent_color != null) comp.accent_color = d.accent_color;
        if (d.spoiler) comp.spoiler = true;
        return comp;
      }
      case 9: {
        hasV2 = true;
        const thumbnailKid = kids.find((kid) => nodeMap.get(kid)?.data?.componentType === 11);
        const textKids = kids.filter((kid) => nodeMap.get(kid)?.data?.componentType !== 11);
        const textComponents = textKids.map(buildComponent).filter(Boolean) as Record<string, unknown>[];
        const accessory = thumbnailKid ? buildComponent(thumbnailKid) : null;
        if (textComponents.length === 0 && !accessory) return null;
        const result: Record<string, unknown> = { type: 9, components: textComponents };
        if (accessory) result.accessory = accessory;
        return result;
      }
      case 10: {
        hasV2 = true;
        const content = (d.content as string) ?? "";
        if (!content.trim()) {
          errors.push({ nodeId: id, message: "Text block is empty — add some text to display" });
          return null;
        }
        return { type: 10, content };
      }
      case 11: {
        hasV2 = true;
        const url = ((d.url as string) ?? "").trim();
        if (!url) {
          errors.push({ nodeId: id, message: "Thumbnail/Media needs a valid image URL" });
          return null;
        }
        const thumb: Record<string, unknown> = { type: 11, media: { url } };
        if (d.description) thumb.description = d.description;
        return thumb;
      }
      case 12: {
        hasV2 = true;
        const rawItems = (d.items as { url: string; description?: string; spoiler?: boolean }[]) ?? [];
        const items = rawItems
          .filter((item) => item.url && item.url.trim())
          .map((item) => {
            const galleryItem: Record<string, unknown> = { media: { url: item.url.trim() } };
            if (item.description) galleryItem.description = item.description;
            if (item.spoiler) galleryItem.spoiler = item.spoiler;
            return galleryItem;
          });
        if (items.length === 0) {
          errors.push({ nodeId: id, message: "Media Gallery needs at least one image URL" });
        }
        return { type: 12, items };
      }
      case 14: {
        hasV2 = true;
        // Discord Separator spacing: 1 = SMALL, 2 = LARGE (0 is not valid)
        const spacingMap: Record<string, number> = { sm: 1, md: 1, lg: 2 };
        return { type: 14, spacing: spacingMap[d.spacing as string] ?? 1, divider: d.divider ?? false };
      }
      case 1: {
        hasV2 = true;
        return { type: 1, components: kids.map(buildComponent).filter(Boolean) };
      }
      case 2: {
        hasV2 = true;
        const styleMap: Record<string, number> = {
          Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5, Premium: 6,
        };
        const style = styleMap[d.style as string] ?? 1;
        const btn: Record<string, unknown> = { type: 2, style, label: d.label ?? "Button" };
        if (style === 5) {
          const url = ((d.url as string) ?? "").trim();
          if (!url) errors.push({ nodeId: id, message: "Link button needs a URL — open this node and fill in the URL field" });
          btn.url = url || "https://example.com";
        } else if (style === 6) {
          btn.sku_id = d.sku_id ?? "";
        } else {
          btn.custom_id = d.custom_id ?? `btn_${id}`;
        }
        if (d.disabled) btn.disabled = true;
        if (d.emoji) btn.emoji = { name: d.emoji };
        return btn;
      }
      case 3: {
        hasV2 = true;
        if (!d.custom_id) errors.push({ nodeId: id, message: "Dropdown menu needs a unique ID — open this node and fill in the ID field" });
        const options = (d.options as Array<{ label: string; value: string; description?: string; default?: boolean }>) ?? [];
        if (options.length === 0) errors.push({ nodeId: id, message: "Dropdown menu has no choices — add at least one option" });
        const sel: Record<string, unknown> = {
          type: 3, custom_id: d.custom_id ?? `sel_${id}`, options,
        };
        if (d.placeholder) sel.placeholder = d.placeholder;
        if (d.min_values != null) sel.min_values = Number(d.min_values);
        if (d.max_values != null) sel.max_values = Number(d.max_values);
        if (d.disabled) sel.disabled = true;
        return sel;
      }
      case 4: {
        hasV2 = true;
        if (!d.label) errors.push({ nodeId: id, message: "Text field is missing a label — add one so users know what to type" });
        if (!d.custom_id) errors.push({ nodeId: id, message: "Text field needs a unique ID — open this node and fill in the ID field" });
        const ti: Record<string, unknown> = {
          type: 4, custom_id: d.custom_id ?? `ti_${id}`, label: d.label ?? "Input",
          style: d.style === "Paragraph" ? 2 : 1,
        };
        if (d.placeholder) ti.placeholder = d.placeholder;
        if (d.min_length != null) ti.min_length = Number(d.min_length);
        if (d.max_length != null) ti.max_length = Number(d.max_length);
        if (d.required != null) ti.required = Boolean(d.required);
        if (d.value) ti.value = d.value;
        return ti;
      }
      case 13: {
        // File component (CV2)
        hasV2 = true;
        const url = ((d.filename as string) ?? "").trim();
        if (!url) {
          errors.push({ nodeId: id, message: "File component needs a filename or attachment URL" });
          return null;
        }
        const fileComp: Record<string, unknown> = { type: 13, file: { url } };
        if (d.spoiler) fileComp.spoiler = true;
        return fileComp;
      }
      case 20: {
        // Checkbox (CV2 form)
        hasV2 = true;
        if (!d.value) errors.push({ nodeId: id, message: "Checkbox needs a unique value" });
        const cb: Record<string, unknown> = {
          type: 20, value: d.value ?? `cb_${id}`, label: d.label ?? "Checkbox",
        };
        if (d.defaultChecked) cb.default_state = true;
        return cb;
      }
      case 21: {
        // CheckboxGroup (CV2 form)
        hasV2 = true;
        const checkboxKids = kids.map(buildComponent).filter(Boolean) as Record<string, unknown>[];
        const cg: Record<string, unknown> = { type: 21, components: checkboxKids };
        if (d.label) cg.label = d.label;
        if (d.required) cg.required = true;
        return cg;
      }
      case 22: {
        // RadioButton (CV2 form)
        hasV2 = true;
        if (!d.value) errors.push({ nodeId: id, message: "Radio Button needs a unique value" });
        const rb: Record<string, unknown> = {
          type: 22, value: d.value ?? `rb_${id}`, label: d.label ?? "Option",
        };
        if (d.defaultSelected) rb.default_state = true;
        return rb;
      }
      case 23: {
        // RadioGroup (CV2 form)
        hasV2 = true;
        const radioKids = kids.map(buildComponent).filter(Boolean) as Record<string, unknown>[];
        const rg: Record<string, unknown> = { type: 23, components: radioKids };
        if (d.label) rg.label = d.label;
        if (d.required) rg.required = true;
        return rg;
      }
      case 24: {
        // Label (CV2 form)
        hasV2 = true;
        if (!d.label) errors.push({ nodeId: id, message: "Label component needs text content" });
        return { type: 24, label: d.label ?? "" };
      }
      case 25: {
        // FileUpload (CV2 form)
        hasV2 = true;
        if (!d.custom_id) errors.push({ nodeId: id, message: "File Upload needs a unique custom_id" });
        const fu: Record<string, unknown> = {
          type: 25, custom_id: d.custom_id ?? `fu_${id}`, label: d.label ?? "Upload File",
        };
        if (d.required) fu.required = true;
        return fu;
      }
      case 5:
      case 6:
      case 7:
      case 8: {
        hasV2 = true;
        const selectNames: Record<number, string> = { 5: "User Select", 6: "Role Select", 7: "Mentionable Select", 8: "Channel Select" };
        const selectLabel = selectNames[d.componentType as number] ?? "Select menu";
        if (!d.custom_id) errors.push({ nodeId: id, message: `${selectLabel} needs a unique ID — open this node and fill in the ID field` });
        const autoSel: Record<string, unknown> = {
          type: d.componentType, custom_id: d.custom_id ?? `sel_${id}`,
        };
        if (d.placeholder) autoSel.placeholder = d.placeholder;
        if (d.min_values != null) autoSel.min_values = Number(d.min_values);
        if (d.max_values != null) autoSel.max_values = Number(d.max_values);
        if (d.disabled) autoSel.disabled = true;
        return autoSel;
      }
      case 0:
      default: {
        if (node.type === "embed" || d.componentType === 0 || d.componentType == null) {
          const embed: Record<string, unknown> = {};
          if (d.title) embed.title = d.title;
          if (d.description) embed.description = d.description;
          if (d.color != null) embed.color = d.color;
          if (d.author) embed.author = { name: d.author };
          if (d.footer) embed.footer = { text: d.footer };
          if (d.imageUrl) embed.image = { url: d.imageUrl };
          if (d.thumbnailUrl) embed.thumbnail = { url: d.thumbnailUrl };
          if (d.url) embed.url = d.url;
          if (d.timestamp) embed.timestamp = new Date().toISOString();
          if (d.fields && Array.isArray(d.fields) && (d.fields as unknown[]).length > 0) {
            embed.fields = d.fields;
          }
          return embed;
        }
        return null;
      }
    }
  }

  const allBuilt = rootIds.map(buildComponent).filter(Boolean) as Record<string, unknown>[];
  const embeds = allBuilt.filter((c) => !("type" in c));
  const components = allBuilt.filter((c) => "type" in c);

  const payload: DiscordMessagePayload = {};
  if (hasV2 || components.length > 0) {
    payload.flags = 32768;
    payload.components = components;
  }
  if (embeds.length > 0) payload.embeds = embeds;

  // Extract content from standalone Message nodes (top-level, no parent)
  const messageNode = nodes.find((n) => n.type === "message" && !parentOf.has(n.id));
  if (messageNode) {
    const content = ((messageNode.data.content as string) ?? "").trim();
    if (content) payload.content = content;
    else errors.push({ nodeId: messageNode.id, message: "Message node is empty — add some content text" });
  }

  return { payload, isValid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────────────────────
//  Interaction Handler Compiler
//  Scans all "interaction" edges in the graph and compiles a
//  response payload for each source (button / select) node.
// ─────────────────────────────────────────────────────────────

export interface InteractionHandler {
  customId: string;
  mode: string;
  responsePayload: Record<string, unknown>;
}

export interface InteractionCompileResult {
  handlers: InteractionHandler[];
  errors: { nodeId: string; message: string }[];
}

/**
 * Collect all nodes reachable from `rootId` via structural edges
 * (i.e., excludes "interaction", "flow", and "send" type edges).
 */
function getSubgraph(
  rootId: string,
  nodes: AppNode[],
  edges: Edge[],
): { nodes: AppNode[]; edges: Edge[] } {
  const structural = edges.filter(
    (e) => e.type !== "interaction" && e.type !== "flow" && e.type !== "send",
  );
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const queue = [rootId];

  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const e of structural) {
      if (e.source === id && !visited.has(e.target)) queue.push(e.target);
    }
  }

  const subNodes = [...visited].map((id) => nodeMap.get(id)).filter(Boolean) as AppNode[];
  const subEdges = structural.filter((e) => visited.has(e.source) && visited.has(e.target));
  return { nodes: subNodes, edges: subEdges };
}

/**
 * For every "interaction" edge in the graph, compile the target node's
 * subtree into a Discord response payload.
 *
 * Used by the Bot node's "Go Live" / deploy flow.
 */
export function compileInteractionHandlers(
  nodes: AppNode[],
  edges: Edge[],
): InteractionCompileResult {
  const interactionEdges = edges.filter((e) => e.type === "interaction");
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const handlers: InteractionHandler[] = [];
  const errors: { nodeId: string; message: string }[] = [];

  for (const edge of interactionEdges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    const customId =
      (sourceNode.data["custom_id"] as string | undefined) ??
      (sourceNode.data["customId"] as string | undefined) ??
      `component_${edge.source}`;

    const edgeData = edge.data as Record<string, unknown> | undefined;
    const mode = (edgeData?.["mode"] as string | undefined) ?? "send_new";

    const subgraph = getSubgraph(targetNode.id, nodes, edges);
    const result = compileGraph(subgraph.nodes, subgraph.edges);

    if (result.errors.length > 0) {
      errors.push(...result.errors);
    }

    handlers.push({
      customId,
      mode,
      responsePayload: result.payload as Record<string, unknown>,
    });
  }

  return { handlers, errors };
}
