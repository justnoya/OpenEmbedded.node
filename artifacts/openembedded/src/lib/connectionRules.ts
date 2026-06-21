/**
 * Node classification and connection validation rules.
 *
 * Main nodes  — can parent other nodes (container, section, actionRow)
 * Sub-nodes   — leaf/content components (cannot parent anything)
 * Root nodes  — standalone, no parent or children in graph (embed, bot)
 */

export type NodeClass = "main" | "sub" | "root";

export const NODE_CLASSES: Record<string, NodeClass> = {
  container:         "main",
  section:           "main",
  actionRow:         "main",
  embed:             "root",
  bot:               "root",
  textDisplay:       "sub",
  thumbnail:         "sub",
  mediaGallery:      "sub",
  separator:         "sub",
  button:            "sub",
  selectMenu:        "sub",
  textInput:         "sub",
  userSelect:        "sub",
  roleSelect:        "sub",
  mentionableSelect: "sub",
  channelSelect:     "sub",
};

/**
 * Allowed child node types for each parent node type.
 * Keys are parent nodeType strings; values are arrays of valid child nodeType strings.
 *
 * NOTE: thumbnail is allowed directly on container as a convenience shortcut.
 * The compiler auto-wraps it in an anonymous section so the Discord JSON is valid.
 */
export const ALLOWED_CHILDREN: Record<string, string[]> = {
  container: [
    "section",
    "textDisplay",
    "thumbnail",
    "mediaGallery",
    "separator",
    "actionRow",
  ],
  section: [
    "textDisplay",
    "thumbnail",
  ],
  actionRow: [
    "button",
    "selectMenu",
    "textInput",
    "userSelect",
    "roleSelect",
    "mentionableSelect",
    "channelSelect",
  ],
  // embed, bot, textDisplay, thumbnail, mediaGallery, separator,
  // button, selectMenu, textInput, *Select → no children allowed
};

/**
 * Returns true if connecting source → target is valid.
 * In React Flow, source = parent node, target = child node.
 */
export function isValidNodeConnection(
  sourceType: string,
  targetType: string
): boolean {
  const allowed = ALLOWED_CHILDREN[sourceType];
  if (!allowed) return false; // source is a leaf — cannot have children
  return allowed.includes(targetType);
}

/**
 * Human-readable explanation of why a connection is invalid.
 */
export function getConnectionError(
  sourceType: string,
  targetType: string
): string {
  const allowed = ALLOWED_CHILDREN[sourceType];
  if (!allowed) {
    return `"${sourceType}" cannot have child nodes.`;
  }
  if (!allowed.includes(targetType)) {
    const readable = ALLOWED_CHILDREN[sourceType].join(", ");
    return `"${sourceType}" only accepts: ${readable}. Got: "${targetType}".`;
  }
  return "";
}

/** Display label for a node class. */
export const NODE_CLASS_LABELS: Record<NodeClass, string> = {
  main: "LAYOUT",
  sub:  "COMPONENT",
  root: "EMBED",
};

/** Accent color for the class badge. */
export const NODE_CLASS_COLORS: Record<NodeClass, string> = {
  main: "#a855f7",
  sub:  "#3b82f6",
  root: "#f59e0b",
};
