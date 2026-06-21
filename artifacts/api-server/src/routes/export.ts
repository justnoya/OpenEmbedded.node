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
  items?: Array<{ url: string; description?: string }>;
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
}

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

  for (const edge of edges) {
    if (!childOf.has(edge.source)) childOf.set(edge.source, []);
    childOf.get(edge.source)!.push(edge.target);
    parentOf.set(edge.target, edge.source);
  }

  const rootNodeIds = nodes.filter((n) => !parentOf.has(n.id)).map((n) => n.id);
  let hasV2 = false;

  function buildComponent(nodeId: string): Record<string, unknown> | null {
    const node = nodeMap.get(nodeId);
    if (!node) return null;
    const data = node.data ?? {};
    const children = childOf.get(nodeId) ?? [];

    switch (data.componentType) {
      case 17: {
        hasV2 = true;
        const comp: Record<string, unknown> = {
          type: 17,
          components: children.map(buildComponent).filter(Boolean),
        };
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
        return { type: 10, content: data.content ?? "" };
      }
      case 11: {
        hasV2 = true;
        return { type: 11, media: { url: data.url ?? "" }, description: data.description };
      }
      case 12: {
        hasV2 = true;
        return { type: 12, items: data.items ?? [] };
      }
      case 14: {
        hasV2 = true;
        const spacing = data.spacing === "lg" ? 2 : data.spacing === "sm" ? 0 : 1;
        return { type: 14, spacing, divider: data.divider ?? false };
      }
      case 1: {
        hasV2 = true;
        return { type: 1, components: children.map(buildComponent).filter(Boolean) };
      }
      case 2: {
        hasV2 = true;
        const styleMap: Record<string, number> = {
          Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5,
        };
        const style = styleMap[data.style ?? "Primary"] ?? 1;
        const btn: Record<string, unknown> = {
          type: 2,
          style,
          label: data.label ?? "Button",
        };
        if (style === 5 && data.url) btn.url = data.url;
        else btn.custom_id = data.custom_id ?? `btn_${nodeId}`;
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
    `const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');`,
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
          3: "ButtonStyle.Success", 4: "ButtonStyle.Danger", 5: "ButtonStyle.Link",
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
