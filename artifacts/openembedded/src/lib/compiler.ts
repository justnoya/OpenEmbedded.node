import { AppNode } from "./graphStore";
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

export function compileGraph(nodes: AppNode[], edges: Edge[]): CompileResult {
  const errors: { nodeId: string; message: string }[] = [];

  if (!nodes.length) {
    return { payload: { flags: 32768, components: [] }, isValid: true, errors: [] };
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, string[]>();
  const parentOf = new Map<string, string>();

  for (const edge of edges) {
    if (!childrenOf.has(edge.source)) childrenOf.set(edge.source, []);
    childrenOf.get(edge.source)!.push(edge.target);
    parentOf.set(edge.target, edge.source);
  }

  const rootIds = nodes.filter((n) => !parentOf.has(n.id)).map((n) => n.id);

  let hasV2 = false;

  function buildComponent(id: string): Record<string, unknown> | null {
    const node = nodeMap.get(id);
    if (!node) return null;
    const d = node.data ?? {};
    const kids = childrenOf.get(id) ?? [];

    switch (d.componentType) {
      case 17: {
        hasV2 = true;
        const comp: Record<string, unknown> = {
          type: 17,
          components: kids.map(buildComponent).filter(Boolean),
        };
        if (d.accent_color != null) comp.accent_color = d.accent_color;
        if (d.spoiler) comp.spoiler = true;
        return comp;
      }
      case 9: {
        hasV2 = true;
        return { type: 9, components: kids.map(buildComponent).filter(Boolean) };
      }
      case 10: {
        hasV2 = true;
        if (!d.content) errors.push({ nodeId: id, message: "TextDisplay: content is empty" });
        return { type: 10, content: d.content ?? "" };
      }
      case 11: {
        hasV2 = true;
        return { type: 11, media: { url: d.url ?? "" }, description: d.description };
      }
      case 12: {
        hasV2 = true;
        return { type: 12, items: d.items ?? [] };
      }
      case 14: {
        hasV2 = true;
        const spacingMap: Record<string, number> = { sm: 0, md: 1, lg: 2 };
        return {
          type: 14,
          spacing: spacingMap[d.spacing as string] ?? 1,
          divider: d.divider ?? false,
        };
      }
      case 1: {
        hasV2 = true;
        return { type: 1, components: kids.map(buildComponent).filter(Boolean) };
      }
      case 2: {
        hasV2 = true;
        const styleMap: Record<string, number> = {
          Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5,
        };
        const style = styleMap[d.style as string] ?? 1;
        const btn: Record<string, unknown> = {
          type: 2,
          style,
          label: d.label ?? "Button",
        };
        if (style === 5) btn.url = d.url ?? "";
        else btn.custom_id = d.custom_id ?? `btn_${id}`;
        return btn;
      }
      case 0: {
        // Legacy embed
        const embed: Record<string, unknown> = {};
        if (d.title) embed.title = d.title;
        if (d.description) embed.description = d.description;
        if (d.color != null) embed.color = d.color;
        if (d.author) embed.author = { name: d.author };
        if (d.footer) embed.footer = { text: d.footer };
        if (d.imageUrl) embed.image = { url: d.imageUrl };
        return embed;
      }
      default:
        return null;
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
  if (embeds.length > 0) {
    payload.embeds = embeds;
  }

  return { payload, isValid: errors.length === 0, errors };
}
