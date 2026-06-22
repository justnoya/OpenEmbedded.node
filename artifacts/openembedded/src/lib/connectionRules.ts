/**
 * Node classification and connection validation rules.
 *
 * Main nodes        — can parent other nodes (container, section, actionRow)
 * Sub-nodes         — leaf/content components (cannot parent anything structurally)
 * Interactive nodes — sub-nodes that also emit interaction edges (button, selects)
 * Root nodes        — standalone, no parent or children (embed, bot, openembedded)
 */

export type NodeClass = "main" | "sub" | "interactive" | "root";

export const NODE_CLASSES: Record<string, NodeClass> = {
  container:         "main",
  section:           "main",
  actionRow:         "main",
  embed:             "root",
  bot:               "root",
  openembedded:      "root",
  textDisplay:       "sub",
  thumbnail:         "sub",
  mediaGallery:      "sub",
  separator:         "sub",
  textInput:         "sub",
  button:            "interactive",
  selectMenu:        "interactive",
  userSelect:        "interactive",
  roleSelect:        "interactive",
  mentionableSelect: "interactive",
  channelSelect:     "interactive",
};

/**
 * Allowed child node types for structural (parent-child) edges.
 */
export const ALLOWED_CHILDREN: Record<string, string[]> = {
  container: ["section", "textDisplay", "thumbnail", "mediaGallery", "separator", "actionRow"],
  section:   ["textDisplay", "thumbnail"],
  actionRow: ["button", "selectMenu", "textInput", "userSelect", "roleSelect", "mentionableSelect", "channelSelect"],
};

/**
 * Source node types that can emit interaction edges.
 */
const INTERACTION_SOURCES = new Set([
  "button", "selectMenu", "userSelect", "roleSelect", "mentionableSelect", "channelSelect",
]);

/**
 * Target node types that can receive interaction edges (the "response" panels).
 */
const INTERACTION_TARGETS = new Set(["container", "embed", "section"]);

/** Returns true if a structural (parent-child) connection is valid. */
export function isValidNodeConnection(sourceType: string, targetType: string): boolean {
  return !!ALLOWED_CHILDREN[sourceType]?.includes(targetType);
}

/** Returns true if a bot "send" connection is valid (Bot → Container or Embed). */
const BOT_SEND_TARGETS = new Set(["container", "embed"]);
export function isBotSendConnection(sourceType: string, targetType: string): boolean {
  return sourceType === "bot" && BOT_SEND_TARGETS.has(targetType);
}

/** Returns true if an interaction (on-click flow) connection is valid. */
export function isInteractionConnection(sourceType: string, targetType: string): boolean {
  return INTERACTION_SOURCES.has(sourceType) && INTERACTION_TARGETS.has(targetType);
}

/** Human-readable explanation of why a structural connection is invalid. */
export function getConnectionError(sourceType: string, targetType: string): string {
  const allowed = ALLOWED_CHILDREN[sourceType];
  if (!allowed) return `"${sourceType}" cannot have child nodes.`;
  if (!allowed.includes(targetType)) {
    return `"${sourceType}" only accepts: ${allowed.join(", ")}. Got: "${targetType}".`;
  }
  return "";
}

/** Interaction response modes — what happens when a user interacts with the component. */
export const INTERACTION_MODES = [
  {
    value: "send_new" as const,
    label: "Send New Message",
    description: "Post a new message visible to all in the channel",
    color: "#f59e0b",
  },
  {
    value: "ephemeral" as const,
    label: "Ephemeral Reply",
    description: "Only the user who clicked can see this response",
    color: "#8b5cf6",
  },
  {
    value: "update_message" as const,
    label: "Update Message",
    description: "Replace the original message content in-place",
    color: "#10b981",
  },
  {
    value: "modal" as const,
    label: "Open Modal",
    description: "Pop up a modal dialog (attach text inputs)",
    color: "#3b82f6",
  },
] as const;

export type InteractionMode = (typeof INTERACTION_MODES)[number]["value"];

export function getInteractionModeMeta(mode: InteractionMode) {
  return INTERACTION_MODES.find((m) => m.value === mode) ?? INTERACTION_MODES[0];
}

/** Display label for a node class. */
export const NODE_CLASS_LABELS: Record<NodeClass, string> = {
  main:        "LAYOUT",
  sub:         "COMPONENT",
  interactive: "INTERACTIVE",
  root:        "EMBED",
};

/** Accent color for the class badge. */
export const NODE_CLASS_COLORS: Record<NodeClass, string> = {
  main:        "#a855f7",
  sub:         "#3b82f6",
  interactive: "#f59e0b",
  root:        "#f59e0b",
};
