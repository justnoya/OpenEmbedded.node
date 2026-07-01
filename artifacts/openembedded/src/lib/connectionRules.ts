// @ts-nocheck
/**
 * Node classification and connection validation rules.
 *
 * Main nodes        — can parent other nodes (container, section, actionRow, embedd)
 * Sub-nodes         — leaf/content components (cannot parent anything structurally)
 * Interactive nodes — sub-nodes that also emit interaction edges (button, selects)
 * Root nodes        — standalone, no parent or children (embed, bot, openembedded)
 * Relay nodes       — accept incoming AND emit outgoing connections (webhook)
 * Trigger nodes     — automation flow sources (no incoming flow edge)
 * Flow action nodes — automation steps: one in, one out
 * Flow logic nodes  — branching/control: one in, multiple out
 */

export type NodeClass =
  | "main"
  | "sub"
  | "interactive"
  | "root"
  | "relay"
  | "trigger"
  | "flow_action"
  | "flow_logic";

export const NODE_CLASSES: Record<string, NodeClass> = {
  // Discord Components
  container:         "main",
  embedd:            "main",
  section:           "main",
  actionRow:         "main",
  modal:             "main",
  checkboxGroup:     "main",
  radioGroup:        "main",
  embed:             "root",
  bot:               "root",
  openembedded:      "root",
  message:           "root",
  schedule:          "root",
  webhook:           "relay",
  textDisplay:       "sub",
  thumbnail:         "sub",
  mediaGallery:      "sub",
  separator:         "sub",
  textInput:         "sub",
  file:              "sub",
  checkbox:          "sub",
  radioButton:       "sub",
  label:             "sub",
  fileUpload:        "sub",
  button:            "interactive",
  selectMenu:        "interactive",
  userSelect:        "interactive",
  roleSelect:        "interactive",
  mentionableSelect: "interactive",
  channelSelect:     "interactive",
  // Automation triggers
  eventTrigger:        "trigger",
  slashCommand:        "trigger",
  interactionTrigger:  "trigger",
  // Automation actions
  sendMessageAction:   "flow_action",
  editMessageAction:   "flow_action",
  deleteMessageAction: "flow_action",
  addRoleAction:       "flow_action",
  removeRoleAction:    "flow_action",
  moderateAction:      "flow_action",
  sendDMAction:        "flow_action",
  addReactionAction:   "flow_action",
  createThreadAction:  "flow_action",
  replyAction:         "flow_action",
  pinMessageAction:    "flow_action",
  createChannelAction: "flow_action",
  fetchMemberAction:   "flow_action",
  // Automation flow control
  condition:   "flow_logic",
  delay:       "flow_action",
  variable:    "flow_action",
  httpRequest: "flow_action",
  randomPick:  "flow_action",
};

/**
 * Allowed child node types for structural (parent-child) edges.
 */
export const ALLOWED_CHILDREN: Record<string, string[]> = {
  container: [
    "section", "textDisplay", "thumbnail", "mediaGallery", "separator",
    "actionRow", "file", "checkboxGroup", "radioGroup", "label", "fileUpload",
  ],
  embedd:    ["textDisplay", "thumbnail", "separator"],
  section:   ["textDisplay", "thumbnail"],
  actionRow: [
    "button", "selectMenu", "textInput",
    "userSelect", "roleSelect", "mentionableSelect", "channelSelect",
  ],
  modal:         ["actionRow"],
  checkboxGroup: ["checkbox", "label"],
  radioGroup:    ["radioButton", "label"],
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
const INTERACTION_TARGETS = new Set(["container", "embedd", "embed", "section", "modal", "message"]);

/**
 * Automation flow: all node types that can be connected with flow edges.
 */
export const FLOW_SOURCES = new Set([
  "eventTrigger", "slashCommand", "interactionTrigger",
  "sendMessageAction", "editMessageAction", "deleteMessageAction",
  "addRoleAction", "removeRoleAction", "moderateAction", "sendDMAction",
  "addReactionAction", "createThreadAction", "replyAction",
  "pinMessageAction", "createChannelAction", "fetchMemberAction",
  "condition", "delay", "variable", "httpRequest", "randomPick",
]);

export const FLOW_TARGETS = new Set([
  "sendMessageAction", "editMessageAction", "deleteMessageAction",
  "addRoleAction", "removeRoleAction", "moderateAction", "sendDMAction",
  "addReactionAction", "createThreadAction", "replyAction",
  "pinMessageAction", "createChannelAction", "fetchMemberAction",
  "condition", "delay", "variable", "httpRequest", "randomPick",
]);

/** Returns true if a structural (parent-child) connection is valid. */
export function isValidNodeConnection(sourceType: string, targetType: string): boolean {
  return !!ALLOWED_CHILDREN[sourceType]?.includes(targetType);
}

/**
 * Target node types that a bot/openembedded/schedule/webhook node can send to.
 */
const BOT_SEND_TARGETS = new Set(["container", "embedd", "embed", "message"]);

/**
 * Target node types that a schedule can connect to (extends bot targets to include webhook relay).
 */
const SCHEDULE_SEND_TARGETS = new Set(["container", "embedd", "embed", "message", "webhook"]);

/** Returns true if a bot "send" connection is valid. */
export function isBotSendConnection(sourceType: string, targetType: string): boolean {
  if (sourceType === "bot" || sourceType === "openembedded") {
    return BOT_SEND_TARGETS.has(targetType);
  }
  if (sourceType === "schedule") {
    return SCHEDULE_SEND_TARGETS.has(targetType);
  }
  if (sourceType === "webhook") {
    return BOT_SEND_TARGETS.has(targetType);
  }
  return false;
}

/** Returns true if an interaction (on-click flow) connection is valid. */
export function isInteractionConnection(sourceType: string, targetType: string): boolean {
  return INTERACTION_SOURCES.has(sourceType) && INTERACTION_TARGETS.has(targetType);
}

/** Returns true if an automation flow connection is valid. */
export function isFlowConnection(sourceType: string, targetType: string): boolean {
  return FLOW_SOURCES.has(sourceType) && FLOW_TARGETS.has(targetType);
}

const FRIENDLY_NAMES: Record<string, string> = {
  container: "Container", embedd: "Embed", section: "Section",
  textDisplay: "Text block", thumbnail: "Thumbnail",
  mediaGallery: "Media Gallery", separator: "Separator",
  actionRow: "Action Row", button: "Button", selectMenu: "Dropdown",
  textInput: "Text field", userSelect: "User Select", roleSelect: "Role Select",
  mentionableSelect: "Mentionable Select", channelSelect: "Channel Select",
  embed: "Legacy Embed", bot: "Bot", openembedded: "OpenEmbedded",
  message: "Message", modal: "Modal", schedule: "Schedule", webhook: "Webhook",
  file: "File", checkboxGroup: "Checkbox Group", checkbox: "Checkbox",
  radioGroup: "Radio Group", radioButton: "Radio Button",
  label: "Label", fileUpload: "File Upload",
  eventTrigger: "Event Trigger", slashCommand: "Slash Command", interactionTrigger: "Interaction Trigger",
  sendMessageAction: "Send Message", editMessageAction: "Edit Message",
  deleteMessageAction: "Delete Message", addRoleAction: "Add Role",
  removeRoleAction: "Remove Role", moderateAction: "Moderate",
  sendDMAction: "Send DM", addReactionAction: "Add Reaction",
  createThreadAction: "Create Thread", replyAction: "Reply",
  pinMessageAction: "Pin Message", createChannelAction: "Create Channel",
  fetchMemberAction: "Fetch Member",
  condition: "Condition", delay: "Delay", variable: "Variable",
  httpRequest: "HTTP Request", randomPick: "Random Pick",
};

function friendly(type: string) {
  return FRIENDLY_NAMES[type] ?? type;
}

/** Human-readable explanation of why a structural connection is invalid. */
export function getConnectionError(sourceType: string, targetType: string): string {
  const allowed = ALLOWED_CHILDREN[sourceType];
  if (!allowed) {
    return `A ${friendly(sourceType)} can't contain child nodes — it's a standalone component.`;
  }
  if (!allowed.includes(targetType)) {
    const allowedLabels = allowed.map(friendly).join(", ");
    return `A ${friendly(sourceType)} can only contain: ${allowedLabels}. A ${friendly(targetType)} can't go here.`;
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
  root:        "TRIGGER",
  relay:       "RELAY",
  trigger:     "TRIGGER",
  flow_action: "ACTION",
  flow_logic:  "LOGIC",
};

/** Accent color for the class badge. */
export const NODE_CLASS_COLORS: Record<NodeClass, string> = {
  main:        "#a855f7",
  sub:         "#3b82f6",
  interactive: "#f59e0b",
  root:        "#f59e0b",
  relay:       "#10b981",
  trigger:     "#8b5cf6",
  flow_action: "#3b82f6",
  flow_logic:  "#f59e0b",
};
