// @ts-nocheck
import { Router } from "express";
import { ExportJsonBody, ExportCodeBody } from "@workspace/api-zod";

const router = Router();

interface NodeData {
  componentType?: number;
  content?: string;
  label?: string;
  style?: string;
  custom_id?: string;
  url?: string;
  accent_color?: number;
  spoiler?: boolean;
  spacing?: string;
  divider?: boolean;
  imageUrl?: string;
  items?: Array<{ url: string; description?: string; spoiler?: boolean }>;
  description?: string;
  title?: string;
  color?: number;
  author?: string;
  footer?: string;
}

interface FlowNode {
  id: string;
  type?: string;
  data?: NodeData;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

const UTILITY_TYPES = new Set(["bot", "openembedded"]);

function compileGraph(
  nodes: FlowNode[],
  edges: FlowEdge[]
): { payload: Record<string, unknown>; isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!nodes || nodes.length === 0) {
    return { payload: { flags: 32768, components: [] }, isValid: true, errors: [] };
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childOf = new Map<string, string[]>();
  const parentOf = new Map<string, string>();

  // Only structural edges define hierarchy — exclude interaction and send edges
  const structuralEdges = edges.filter((e) => e.type !== "interaction" && e.type !== "send");

  for (const edge of structuralEdges) {
    if (!childOf.has(edge.source)) childOf.set(edge.source, []);
    childOf.get(edge.source)!.push(edge.target);
    parentOf.set(edge.target, edge.source);
  }

  // Root nodes: no incoming structural edges, exclude utility nodes
  const rootNodeIds = nodes
    .filter((n) => !parentOf.has(n.id) && !UTILITY_TYPES.has(n.type ?? ""))
    .map((n) => n.id);

  let hasV2 = false;

  function buildComponent(nodeId: string): Record<string, unknown> | null {
    const node = nodeMap.get(nodeId);
    if (!node) return null;
    const data = node.data ?? {};
    const children = childOf.get(nodeId) ?? [];

    switch (data.componentType) {
      case 17: {
        hasV2 = true;
        const builtComponents: Record<string, unknown>[] = [];
        for (const kid of children) {
          const kidNode = nodeMap.get(kid);
          if (kidNode?.data?.componentType === 11) {
            const thumbBuilt = buildComponent(kid);
            if (thumbBuilt) builtComponents.push({ type: 9, components: [], accessory: thumbBuilt });
          } else {
            const built = buildComponent(kid);
            if (built) builtComponents.push(built);
          }
        }
        const comp: Record<string, unknown> = { type: 17, components: builtComponents };
        if (data.accent_color != null) comp.accent_color = data.accent_color;
        if (data.spoiler) comp.spoiler = true;
        return comp;
      }
      case 9: {
        hasV2 = true;
        const thumbnailKid = children.find((kid) => nodeMap.get(kid)?.data?.componentType === 11);
        const textKids = children.filter((kid) => nodeMap.get(kid)?.data?.componentType !== 11);
        const result: Record<string, unknown> = {
          type: 9,
          components: textKids.map(buildComponent).filter(Boolean),
        };
        if (thumbnailKid) result.accessory = buildComponent(thumbnailKid);
        return result;
      }
      case 10: {
        hasV2 = true;
        const content = (data.content ?? "").trim();
        if (!content) errors.push(`Text Display (${nodeId}): content is empty`);
        return { type: 10, content: data.content ?? "" };
      }
      case 11: {
        hasV2 = true;
        const url = (data.url ?? "").trim();
        if (!url) errors.push(`Thumbnail (${nodeId}): missing image URL`);
        const thumb: Record<string, unknown> = { type: 11, media: { url } };
        if (data.description) thumb.description = data.description;
        return thumb;
      }
      case 12: {
        hasV2 = true;
        const rawItems = data.items ?? [];
        const items = rawItems
          .filter((item) => item.url && item.url.trim())
          .map((item) => {
            const galleryItem: Record<string, unknown> = { media: { url: item.url.trim() } };
            if (item.description) galleryItem.description = item.description;
            if (item.spoiler) galleryItem.spoiler = item.spoiler;
            return galleryItem;
          });
        if (items.length === 0) errors.push(`Media Gallery (${nodeId}): needs at least one image URL`);
        return { type: 12, items };
      }
      case 14: {
        hasV2 = true;
        // Discord Separator spacing: 1 = SMALL, 2 = LARGE (0 is not a valid value)
        const spacing = data.spacing === "lg" ? 2 : 1;
        return { type: 14, spacing, divider: data.divider ?? false };
      }
      case 1: {
        hasV2 = true;
        return { type: 1, components: children.map(buildComponent).filter(Boolean) };
      }
      case 2: {
        hasV2 = true;
        const styleMap: Record<string, number> = {
          Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5, Premium: 6,
        };
        const style = styleMap[data.style ?? "Primary"] ?? 1;
        const btn: Record<string, unknown> = {
          type: 2,
          style,
          label: data.label ?? "Button",
        };
        if (style === 5) {
          const url = (data.url ?? "").trim();
          if (!url) errors.push(`Button (${nodeId}): Link style requires a URL`);
          btn.url = url || "https://example.com";
        } else if (style === 6) {
          btn.sku_id = data.custom_id ?? "";
        } else {
          btn.custom_id = data.custom_id ?? `btn_${nodeId}`;
        }
        return btn;
      }
      default: {
        if (node.type === "embed" || data.componentType === 0 || data.componentType == null) {
          const embed: Record<string, unknown> = {};
          if (data.title) embed.title = data.title;
          if (data.description) embed.description = data.description;
          if (data.color != null) embed.color = data.color;
          if (data.author) embed.author = { name: data.author };
          if (data.footer) embed.footer = { text: data.footer };
          if (data.imageUrl) embed.image = { url: data.imageUrl };
          return embed;
        }
        return null;
      }
    }
  }

  const allBuilt = rootNodeIds.map(buildComponent).filter(Boolean) as Record<string, unknown>[];
  const embedComponents = allBuilt.filter((c) => !("type" in c));
  const v2Components = allBuilt.filter((c) => "type" in c);

  const payload: Record<string, unknown> = {};
  if (hasV2 || v2Components.length > 0) {
    payload.flags = 32768;
    payload.components = v2Components;
  }
  if (embedComponents.length > 0) {
    payload.embeds = embedComponents;
  }
  if (!hasV2 && v2Components.length === 0 && embedComponents.length === 0) {
    payload.flags = 32768;
    payload.components = [];
  }

  return { payload, isValid: errors.length === 0, errors };
}

function generateDiscordJsCode(payload: Record<string, unknown>): string {
  const lines: string[] = [
    `const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');`,
    ``,
  ];

  function buildCode(comp: Record<string, unknown>, varName: string): string[] {
    const out: string[] = [];
    const type = comp.type as number;
    switch (type) {
      case 17: {
        out.push(`const ${varName} = new ContainerBuilder()`);
        if (comp.accent_color != null) out.push(`  .setAccentColor(${comp.accent_color})`);
        const children = (comp.components as Record<string, unknown>[]) ?? [];
        children.forEach((child, i) => {
          const childVar = `${varName}_c${i}`;
          out.push(...buildCode(child, childVar));
          out[out.length - 1] = out[out.length - 1].replace(/;$/, "");
          out.push(`${varName}.addComponent(${childVar});`);
        });
        if (!out[out.length - 1].endsWith(";")) out[out.length - 1] += ";";
        break;
      }
      case 9: {
        out.push(`const ${varName} = new SectionBuilder()`);
        const comps = (comp.components as Record<string, unknown>[]) ?? [];
        comps.forEach((child, i) => {
          const childVar = `${varName}_c${i}`;
          out.push(...buildCode(child, childVar));
        });
        out[out.length - 1] += ";";
        break;
      }
      case 10:
        out.push(`const ${varName} = new TextDisplayBuilder().setContent(${JSON.stringify(comp.content ?? "")});`);
        break;
      case 12: {
        const items = (comp.items as Record<string, unknown>[]) ?? [];
        items.forEach((item, i) => {
          const media = item.media as Record<string, unknown>;
          out.push(`const ${varName}_item${i} = new MediaGalleryItemBuilder().setURL(${JSON.stringify(media?.url ?? "")})${item.description ? `.setDescription(${JSON.stringify(item.description)})` : ""};`);
        });
        out.push(`const ${varName} = new MediaGalleryBuilder().addItems(${items.map((_, i) => `${varName}_item${i}`).join(", ")});`);
        break;
      }
      case 14:
        out.push(`const ${varName} = new SeparatorBuilder().setSpacing(${comp.spacing ?? 1}).setDivider(${comp.divider ?? false});`);
        break;
      case 1: {
        const btns = (comp.components as Record<string, unknown>[]) ?? [];
        btns.forEach((btn, i) => {
          out.push(...buildCode(btn, `${varName}_btn${i}`));
        });
        out.push(`const ${varName} = new ActionRowBuilder().addComponents(${btns.map((_, i) => `${varName}_btn${i}`).join(", ")});`);
        break;
      }
      case 2: {
        const styleNames: Record<number, string> = {
          1: "ButtonStyle.Primary", 2: "ButtonStyle.Secondary",
          3: "ButtonStyle.Success", 4: "ButtonStyle.Danger", 5: "ButtonStyle.Link", 6: "ButtonStyle.Premium",
        };
        const style = styleNames[comp.style as number] ?? "ButtonStyle.Primary";
        out.push(
          `const ${varName} = new ButtonBuilder().setLabel(${JSON.stringify(comp.label ?? "Button")}).setStyle(${style})${comp.url ? `.setURL(${JSON.stringify(comp.url)})` : `.setCustomId(${JSON.stringify(comp.custom_id ?? "button")})`};`
        );
        break;
      }
      default:
        out.push(`// Unsupported component type: ${type}`);
    }
    return out;
  }

  const components = (payload.components as Record<string, unknown>[]) ?? [];
  components.forEach((comp, i) => {
    lines.push(...buildCode(comp, `component${i}`));
    lines.push("");
  });

  lines.push(
    `const message = {`,
    `  flags: ${payload.flags ?? 32768},`,
    `  components: [${components.map((_, i) => `component${i}`).join(", ")}],`,
    `};`
  );

  return lines.join("\n");
}

router.post("/v1/export/json", async (req, res) => {
  const parsed = ExportJsonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }
  const result = compileGraph(parsed.data.graph.nodes as unknown as FlowNode[], parsed.data.graph.edges as unknown as FlowEdge[]);
  res.json(result);
});

router.post("/v1/export/code", async (req, res) => {
  const parsed = ExportCodeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }
  const { payload } = compileGraph(parsed.data.graph.nodes as unknown as FlowNode[], parsed.data.graph.edges as unknown as FlowEdge[]);
  res.json({ code: generateDiscordJsCode(payload) });
});

export default router;
