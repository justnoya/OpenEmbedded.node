// @ts-nocheck
import { useCallback, useState, useRef, useEffect, type ReactNode } from "react";
import { useGraphStore, type AppNode, type AppNodeData } from "../lib/graphStore.js";
import {
  Box, AlignJustify, AlignLeft, Image, LayoutGrid, Minus,
  LayoutList, MousePointerClick, ListFilter, User, Shield,
  AtSign, Hash, TextCursorInput, Layers, Bot, Workflow,
  Search, MessageCircle, PanelTop, Webhook, Clock, BookMarked, X,
  // Discord CV2 Forms
  FileIcon, CheckSquare, Circle, Type, Upload,
  // Automation triggers
  Zap, Terminal,
  // Automation actions
  Send, PencilLine, Trash2, UserPlus, UserMinus, ShieldAlert,
  MessageSquare, SmilePlus, MessageSquarePlus, Reply, Pin,
  UserSearch,
  // Automation flow control
  GitBranch, Timer, Variable, Globe, Dices,
} from "lucide-react";

interface NodeDef {
  type: string;
  label: string;
  alias?: string;
  description: string;
  icon: ReactNode;
  iconRaw: ReactNode;
  componentType: number | null;
  defaultData: Partial<AppNodeData>;
  recommended?: boolean;
  comingSoon?: boolean;
  group: string;
}

const IC = ({ children, color }: { children: ReactNode; color?: string }) => (
  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: color ?? "rgba(255,255,255,0.75)", flexShrink: 0 }}>
    {children}
  </span>
);

const NODE_DEFS: NodeDef[] = [
  {
    type: "container", label: "Container", alias: "Outer wrapper",
    description: "The outer wrapper — start every message with this.",
    icon: <IC><Box size={18} /></IC>,
    iconRaw: <IC><Box size={14} /></IC>,
    componentType: 17,
    defaultData: { componentType: 17, accent_color: null, spoiler: false },
    recommended: true, group: "Layout",
  },
  {
    type: "embedd", label: "Embed", alias: "Discord embed",
    description: "A classic Discord embed block with title, description, and color.",
    icon: <IC color="#5865F2"><BookMarked size={18} /></IC>,
    iconRaw: <IC color="#5865F2"><BookMarked size={14} /></IC>,
    componentType: 0,
    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2, author: "", footer: "" },
    group: "Layout",
  },
  {
    type: "section", label: "Section", alias: "Row layout",
    description: "Splits a row into a main content area + thumbnail side.",
    icon: <IC><AlignJustify size={18} /></IC>,
    iconRaw: <IC><AlignJustify size={14} /></IC>,
    componentType: 9,
    defaultData: { componentType: 9 },
    group: "Layout",
  },
  {
    type: "textDisplay", label: "Text Display", alias: "Message text",
    description: "Plain text or markdown. Supports **bold**, *italic*, links.",
    icon: <IC><AlignLeft size={18} /></IC>,
    iconRaw: <IC><AlignLeft size={14} /></IC>,
    componentType: 10,
    defaultData: { componentType: 10, content: "" },
    recommended: true, group: "Content",
  },
  {
    type: "thumbnail", label: "Thumbnail", alias: "Side image",
    description: "A small image shown on the side of a Section.",
    icon: <IC><Image size={18} /></IC>,
    iconRaw: <IC><Image size={14} /></IC>,
    componentType: 11,
    defaultData: { componentType: 11, url: "", description: "" },
    group: "Content",
  },
  {
    type: "mediaGallery", label: "Media Gallery", alias: "Image grid",
    description: "Displays multiple images in a grid layout.",
    icon: <IC><LayoutGrid size={18} /></IC>,
    iconRaw: <IC><LayoutGrid size={14} /></IC>,
    componentType: 12,
    defaultData: { componentType: 12, items: [] },
    group: "Content",
  },
  {
    type: "separator", label: "Separator", alias: "Divider",
    description: "A horizontal divider with optional visible line.",
    icon: <IC><Minus size={18} /></IC>,
    iconRaw: <IC><Minus size={14} /></IC>,
    componentType: 14,
    defaultData: { componentType: 14, spacing: "md", divider: false },
    group: "Content",
  },
  {
    type: "actionRow", label: "Action Row", alias: "Button container",
    description: "A horizontal row that holds buttons or a select menu.",
    icon: <IC><LayoutList size={18} /></IC>,
    iconRaw: <IC><LayoutList size={14} /></IC>,
    componentType: 1,
    defaultData: { componentType: 1 },
    group: "Interactive",
  },
  {
    type: "button", label: "Button", alias: "Clickable",
    description: "A clickable button. Connect to a response via the amber handle.",
    icon: <IC><MousePointerClick size={18} /></IC>,
    iconRaw: <IC><MousePointerClick size={14} /></IC>,
    componentType: 2,
    defaultData: { componentType: 2, label: "Click me", style: "Primary", custom_id: "", emoji: "", disabled: false },
    recommended: true, group: "Interactive",
  },
  {
    type: "selectMenu", label: "String Select", alias: "Dropdown",
    description: "A dropdown with custom text options to choose from.",
    icon: <IC><ListFilter size={18} /></IC>,
    iconRaw: <IC><ListFilter size={14} /></IC>,
    componentType: 3,
    defaultData: { componentType: 3, custom_id: "", placeholder: "Make a selection…", min_values: 1, max_values: 1, options: [], disabled: false },
    group: "Interactive",
  },
  {
    type: "userSelect", label: "User Select", alias: "User picker",
    description: "Lets users pick someone from the server member list.",
    icon: <IC><User size={18} /></IC>,
    iconRaw: <IC><User size={14} /></IC>,
    componentType: 5,
    defaultData: { componentType: 5, custom_id: "", placeholder: "Select a user…", min_values: 1, max_values: 1, disabled: false },
    comingSoon: true, group: "Interactive",
  },
  {
    type: "roleSelect", label: "Role Select", alias: "Role picker",
    description: "Lets users choose a server role from a dropdown.",
    icon: <IC><Shield size={18} /></IC>,
    iconRaw: <IC><Shield size={14} /></IC>,
    componentType: 6,
    defaultData: { componentType: 6, custom_id: "", placeholder: "Select a role…", min_values: 1, max_values: 1, disabled: false },
    comingSoon: true, group: "Interactive",
  },
  {
    type: "mentionableSelect", label: "Mentionable Select", alias: "User or role",
    description: "Dropdown for a user or a role.",
    icon: <IC><AtSign size={18} /></IC>,
    iconRaw: <IC><AtSign size={14} /></IC>,
    componentType: 7,
    defaultData: { componentType: 7, custom_id: "", placeholder: "Select a user or role…", min_values: 1, max_values: 1, disabled: false },
    comingSoon: true, group: "Interactive",
  },
  {
    type: "channelSelect", label: "Channel Select", alias: "Channel picker",
    description: "Lets users pick a channel from the server channel list.",
    icon: <IC><Hash size={18} /></IC>,
    iconRaw: <IC><Hash size={14} /></IC>,
    componentType: 8,
    defaultData: { componentType: 8, custom_id: "", placeholder: "Select a channel…", min_values: 1, max_values: 1, disabled: false },
    comingSoon: true, group: "Interactive",
  },
  {
    type: "textInput", label: "Text Input", alias: "Text field",
    description: "A text field inside a modal dialog.",
    icon: <IC><TextCursorInput size={18} /></IC>,
    iconRaw: <IC><TextCursorInput size={14} /></IC>,
    componentType: 4,
    defaultData: { componentType: 4, custom_id: "", label: "Label", style: "Short", placeholder: "", required: true, min_length: null, max_length: null, value: "" },
    comingSoon: true, group: "Modals",
  },

  // ── Discord Components V2 — Forms ─────────────────────────────────────────
  {
    type: "file", label: "File", alias: "File attachment",
    description: "Display a file attachment inside a Container.",
    icon: <IC color="#9ca3af"><FileIcon size={18} /></IC>,
    iconRaw: <IC color="#9ca3af"><FileIcon size={14} /></IC>,
    componentType: 13,
    defaultData: { componentType: 13, filename: "", description: "", spoiler: false },
    group: "CV2 Forms",
  },
  {
    type: "checkboxGroup", label: "Checkbox Group", alias: "Form checkboxes",
    description: "A group that holds multiple Checkbox items.",
    icon: <IC color="#06b6d4"><CheckSquare size={18} /></IC>,
    iconRaw: <IC color="#06b6d4"><CheckSquare size={14} /></IC>,
    componentType: 21,
    defaultData: { componentType: 21, label: "", required: false },
    group: "CV2 Forms",
  },
  {
    type: "checkbox", label: "Checkbox", alias: "Checkbox item",
    description: "A single checkbox inside a Checkbox Group.",
    icon: <IC color="#0ea5e9"><CheckSquare size={18} /></IC>,
    iconRaw: <IC color="#0ea5e9"><CheckSquare size={14} /></IC>,
    componentType: 20,
    defaultData: { componentType: 20, label: "Checkbox", value: "", defaultChecked: false },
    group: "CV2 Forms",
  },
  {
    type: "radioGroup", label: "Radio Group", alias: "Radio buttons",
    description: "A group that holds multiple Radio Button items.",
    icon: <IC color="#a855f7"><Circle size={18} /></IC>,
    iconRaw: <IC color="#a855f7"><Circle size={14} /></IC>,
    componentType: 23,
    defaultData: { componentType: 23, label: "", required: false },
    group: "CV2 Forms",
  },
  {
    type: "radioButton", label: "Radio Button", alias: "Radio option",
    description: "A single radio option inside a Radio Group.",
    icon: <IC color="#8b5cf6"><Circle size={18} /></IC>,
    iconRaw: <IC color="#8b5cf6"><Circle size={14} /></IC>,
    componentType: 22,
    defaultData: { componentType: 22, label: "Option", value: "", defaultSelected: false },
    group: "CV2 Forms",
  },
  {
    type: "label", label: "Label", alias: "Form label",
    description: "A text label element for form components.",
    icon: <IC color="#94a3b8"><Type size={18} /></IC>,
    iconRaw: <IC color="#94a3b8"><Type size={14} /></IC>,
    componentType: 24,
    defaultData: { componentType: 24, label: "" },
    group: "CV2 Forms",
  },
  {
    type: "fileUpload", label: "File Upload", alias: "Upload input",
    description: "A file upload field for form modals.",
    icon: <IC color="#22c55e"><Upload size={18} /></IC>,
    iconRaw: <IC color="#22c55e"><Upload size={14} /></IC>,
    componentType: 25,
    defaultData: { componentType: 25, label: "Upload File", custom_id: "", required: false },
    group: "CV2 Forms",
  },

  // ── Automation Triggers ────────────────────────────────────────────────────
  {
    type: "eventTrigger", label: "Event Trigger", alias: "Gateway event",
    description: "Fires when a Discord gateway event occurs (messages, members, reactions…).",
    icon: <IC color="#8b5cf6"><Zap size={18} /></IC>,
    iconRaw: <IC color="#8b5cf6"><Zap size={14} /></IC>,
    componentType: -10,
    defaultData: { componentType: -10, event: "messageCreate", filters: {} },
    group: "Auto Triggers",
  },
  {
    type: "slashCommand", label: "Slash Command", alias: "/command trigger",
    description: "Defines and handles a Discord slash command.",
    icon: <IC color="#6366f1"><Terminal size={18} /></IC>,
    iconRaw: <IC color="#6366f1"><Terminal size={14} /></IC>,
    componentType: -11,
    defaultData: { componentType: -11, name: "", description: "", options: [] },
    group: "Auto Triggers",
  },
  {
    type: "interactionTrigger", label: "Interaction Trigger", alias: "Button/Select handler",
    description: "Fires when a user interacts with a button, select, or submits a modal.",
    icon: <IC color="#f59e0b"><MousePointerClick size={18} /></IC>,
    iconRaw: <IC color="#f59e0b"><MousePointerClick size={14} /></IC>,
    componentType: -12,
    defaultData: { componentType: -12, triggerType: "button", custom_id: "" },
    group: "Auto Triggers",
  },

  // ── Automation Actions ─────────────────────────────────────────────────────
  {
    type: "sendMessageAction", label: "Send Message", alias: "Post message",
    description: "Post a message to a channel.",
    icon: <IC color="#3b82f6"><Send size={18} /></IC>,
    iconRaw: <IC color="#3b82f6"><Send size={14} /></IC>,
    componentType: -20,
    defaultData: { componentType: -20, content: "", channelMode: "same", channelId: "", ephemeral: false },
    group: "Auto Actions",
  },
  {
    type: "editMessageAction", label: "Edit Message", alias: "Modify message",
    description: "Edit an existing message's content.",
    icon: <IC color="#64748b"><PencilLine size={18} /></IC>,
    iconRaw: <IC color="#64748b"><PencilLine size={14} /></IC>,
    componentType: -21,
    defaultData: { componentType: -21, messageIdMode: "from_trigger", messageId: "", content: "" },
    group: "Auto Actions",
  },
  {
    type: "deleteMessageAction", label: "Delete Message", alias: "Remove message",
    description: "Delete a message from a channel.",
    icon: <IC color="#ef4444"><Trash2 size={18} /></IC>,
    iconRaw: <IC color="#ef4444"><Trash2 size={14} /></IC>,
    componentType: -22,
    defaultData: { componentType: -22, messageIdMode: "from_trigger", messageId: "", delaySeconds: 0 },
    group: "Auto Actions",
  },
  {
    type: "addRoleAction", label: "Add Role", alias: "Grant role",
    description: "Assign a role to a server member.",
    icon: <IC color="#22c55e"><UserPlus size={18} /></IC>,
    iconRaw: <IC color="#22c55e"><UserPlus size={14} /></IC>,
    componentType: -23,
    defaultData: { componentType: -23, roleId: "", roleName: "", userMode: "from_trigger", userId: "" },
    group: "Auto Actions",
  },
  {
    type: "removeRoleAction", label: "Remove Role", alias: "Revoke role",
    description: "Remove a role from a server member.",
    icon: <IC color="#f97316"><UserMinus size={18} /></IC>,
    iconRaw: <IC color="#f97316"><UserMinus size={14} /></IC>,
    componentType: -24,
    defaultData: { componentType: -24, roleId: "", roleName: "", userMode: "from_trigger", userId: "" },
    group: "Auto Actions",
  },
  {
    type: "moderateAction", label: "Moderate", alias: "Kick/ban/timeout",
    description: "Kick, ban, unban, or timeout a member.",
    icon: <IC color="#ef4444"><ShieldAlert size={18} /></IC>,
    iconRaw: <IC color="#ef4444"><ShieldAlert size={14} /></IC>,
    componentType: -25,
    defaultData: { componentType: -25, mode: "kick", reason: "", timeoutDuration: 300, userMode: "from_trigger" },
    group: "Auto Actions",
  },
  {
    type: "sendDMAction", label: "Send DM", alias: "Direct message",
    description: "Send a direct message to a user.",
    icon: <IC color="#06b6d4"><MessageSquare size={18} /></IC>,
    iconRaw: <IC color="#06b6d4"><MessageSquare size={14} /></IC>,
    componentType: -26,
    defaultData: { componentType: -26, userMode: "from_trigger", userId: "", content: "" },
    group: "Auto Actions",
  },
  {
    type: "addReactionAction", label: "Add Reaction", alias: "React with emoji",
    description: "Add an emoji reaction to a message.",
    icon: <IC color="#fbbf24"><SmilePlus size={18} /></IC>,
    iconRaw: <IC color="#fbbf24"><SmilePlus size={14} /></IC>,
    componentType: -27,
    defaultData: { componentType: -27, emoji: "", messageIdMode: "from_trigger", messageId: "" },
    group: "Auto Actions",
  },
  {
    type: "createThreadAction", label: "Create Thread", alias: "Start thread",
    description: "Create a new thread from a message.",
    icon: <IC color="#0ea5e9"><MessageSquarePlus size={18} /></IC>,
    iconRaw: <IC color="#0ea5e9"><MessageSquarePlus size={14} /></IC>,
    componentType: -28,
    defaultData: { componentType: -28, name: "", autoArchiveDuration: 1440, isPrivate: false, messageIdMode: "from_trigger" },
    group: "Auto Actions",
  },
  {
    type: "replyAction", label: "Reply to Interaction", alias: "Interaction response",
    description: "Reply to a slash command or button interaction.",
    icon: <IC color="#3b82f6"><Reply size={18} /></IC>,
    iconRaw: <IC color="#3b82f6"><Reply size={14} /></IC>,
    componentType: -29,
    defaultData: { componentType: -29, mode: "reply", content: "" },
    group: "Auto Actions",
  },
  {
    type: "pinMessageAction", label: "Pin Message", alias: "Pin to channel",
    description: "Pin or unpin a message in a channel.",
    icon: <IC color="#fbbf24"><Pin size={18} /></IC>,
    iconRaw: <IC color="#fbbf24"><Pin size={14} /></IC>,
    componentType: -30,
    defaultData: { componentType: -30, action: "pin", messageIdMode: "from_trigger" },
    group: "Auto Actions",
  },
  {
    type: "createChannelAction", label: "Create Channel", alias: "New channel",
    description: "Create a new channel in the server.",
    icon: <IC color="#22c55e"><Hash size={18} /></IC>,
    iconRaw: <IC color="#22c55e"><Hash size={14} /></IC>,
    componentType: -31,
    defaultData: { componentType: -31, channelType: "text", name: "", storeAs: "newChannel" },
    group: "Auto Actions",
  },
  {
    type: "fetchMemberAction", label: "Fetch Member", alias: "Get user data",
    description: "Fetch a guild member's data and store it as a variable.",
    icon: <IC color="#06b6d4"><UserSearch size={18} /></IC>,
    iconRaw: <IC color="#06b6d4"><UserSearch size={14} /></IC>,
    componentType: -32,
    defaultData: { componentType: -32, userMode: "from_trigger", userId: "", storeAs: "member" },
    group: "Auto Actions",
  },

  // ── Flow Control ───────────────────────────────────────────────────────────
  {
    type: "condition", label: "Condition", alias: "If / Else branch",
    description: "Branch flow based on a condition — true goes one way, false the other.",
    icon: <IC color="#f59e0b"><GitBranch size={18} /></IC>,
    iconRaw: <IC color="#f59e0b"><GitBranch size={14} /></IC>,
    componentType: -33,
    defaultData: { componentType: -33, conditionType: "hasRole", value: "" },
    group: "Flow Control",
  },
  {
    type: "delay", label: "Delay", alias: "Wait / Pause",
    description: "Pause the automation flow for a set duration.",
    icon: <IC color="#78716c"><Timer size={18} /></IC>,
    iconRaw: <IC color="#78716c"><Timer size={14} /></IC>,
    componentType: -34,
    defaultData: { componentType: -34, duration: 5, unit: "seconds" },
    group: "Flow Control",
  },
  {
    type: "variable", label: "Variable", alias: "Store / update data",
    description: "Set, get, increment, or delete a flow variable.",
    icon: <IC color="#a78bfa"><Variable size={18} /></IC>,
    iconRaw: <IC color="#a78bfa"><Variable size={14} /></IC>,
    componentType: -35,
    defaultData: { componentType: -35, operation: "set", varName: "", value: "" },
    group: "Flow Control",
  },
  {
    type: "httpRequest", label: "HTTP Request", alias: "Fetch external API",
    description: "Make an HTTP request to an external URL and store the response.",
    icon: <IC color="#0ea5e9"><Globe size={18} /></IC>,
    iconRaw: <IC color="#0ea5e9"><Globe size={14} /></IC>,
    componentType: -36,
    defaultData: { componentType: -36, method: "GET", url: "", headers: {}, body: "", storeAs: "response" },
    group: "Flow Control",
  },
  {
    type: "randomPick", label: "Random Pick", alias: "Random choice",
    description: "Randomly pick one value from a list and store it.",
    icon: <IC color="#ec4899"><Dices size={18} /></IC>,
    iconRaw: <IC color="#ec4899"><Dices size={14} /></IC>,
    componentType: -37,
    defaultData: { componentType: -37, choices: [], storeAs: "randomPick" },
    group: "Flow Control",
  },

  {
    type: "embed", label: "Embed (Legacy)", alias: "Legacy V1",
    description: "Classic Discord embed (V1). Use Container for CV2.",
    icon: <IC><Layers size={18} /></IC>,
    iconRaw: <IC><Layers size={14} /></IC>,
    componentType: 0,
    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 },
    comingSoon: true, group: "Legacy",
  },
  {
    type: "message", label: "Message", alias: "Plain text message",
    description: "A plain Discord message with text content.",
    icon: <IC color="#10b981"><MessageCircle size={18} /></IC>,
    iconRaw: <IC color="#10b981"><MessageCircle size={14} /></IC>,
    componentType: null,
    defaultData: { componentType: -3, content: "", username: "", avatar_url: "", tts: false },
    group: "Message & Modal",
  },
  {
    type: "modal", label: "Modal", alias: "Dialog popup",
    description: "A popup dialog with text inputs.",
    icon: <IC color="#3b82f6"><PanelTop size={18} /></IC>,
    iconRaw: <IC color="#3b82f6"><PanelTop size={14} /></IC>,
    componentType: null,
    defaultData: { componentType: -4, title: "", custom_id: "" },
    group: "Message & Modal",
  },
  {
    type: "bot", label: "Bot", alias: "Your bot token",
    description: "Send messages via your own bot token.",
    icon: <IC><Bot size={18} /></IC>,
    iconRaw: <IC><Bot size={14} /></IC>,
    componentType: null,
    defaultData: { componentType: -1, token: "", connected: false, botName: null, botAvatar: null, selectedGuildId: null, selectedChannelId: null, guilds: [], channels: [] },
    group: "Advanced",
  },
  {
    type: "webhook", label: "Webhook", alias: "Webhook URL",
    description: "Send via a Discord webhook URL — no bot token needed.",
    icon: <IC><Webhook size={18} /></IC>,
    iconRaw: <IC><Webhook size={14} /></IC>,
    componentType: null,
    defaultData: { componentType: -5, webhookUrl: "", connected: false, webhookName: null, webhookAvatar: null },
    group: "Advanced",
  },
  {
    type: "openembedded", label: "OpenEmbedded Bot", alias: "No token needed",
    description: "Send via the platform's managed bot — no setup required.",
    icon: <IC color="#555"><Workflow size={18} /></IC>,
    iconRaw: <IC color="#555"><Workflow size={14} /></IC>,
    componentType: null,
    defaultData: { componentType: -2, initialNodeId: null },
    comingSoon: true, group: "Advanced",
  },
  {
    type: "schedule", label: "Schedule", alias: "Automated send",
    description: "Send on a recurring cron schedule or at a set time.",
    icon: <IC color="#f59e0b"><Clock size={18} /></IC>,
    iconRaw: <IC color="#f59e0b"><Clock size={14} /></IC>,
    componentType: null,
    defaultData: { componentType: -6, label: "Scheduled Message", scheduleType: "cron", cronExpression: "0 9 * * *", runAt: "", webhookUrl: "", active: false, scheduleId: null, lastRunAt: null, nextRunAt: null },
    group: "Automation",
  },
];

const GROUPS = [
  "Layout", "Content", "Interactive", "Modals",
  "CV2 Forms", "Message & Modal", "Advanced", "Automation",
  "Auto Triggers", "Auto Actions", "Flow Control",
  "Legacy",
];

let nodeIdCounter = Date.now();

export function CanvasNodeBar() {
  const addNode = useGraphStore((s) => s.addNode);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setSearch(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Close drawer on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAdd = useCallback(
    (def: NodeDef) => {
      if (def.comingSoon) return;
      const id = `node_${nodeIdCounter++}`;
      const node: AppNode = {
        id,
        type: def.type,
        position: { x: 260 + Math.random() * 260, y: 80 + Math.random() * 260 },
        data: { ...def.defaultData } as AppNodeData,
      };
      addNode(node);
      setOpen(false);
      setSearch("");
    },
    [addNode]
  );

  const q = search.toLowerCase().trim();
  const filtered = q
    ? NODE_DEFS.filter((d) =>
        d.label.toLowerCase().includes(q) ||
        (d.alias ?? "").toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      )
    : null;

  const groupedResults = !filtered
    ? GROUPS.map((g) => ({
        label: g,
        defs: NODE_DEFS.filter((d) => d.group === g),
      })).filter((g) => g.defs.length > 0)
    : null;

  return (
    <div ref={barRef} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Expanded node drawer — slides up from the bar */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 320,
            maxHeight: 460,
            background: "rgba(18,18,18,0.97)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "nodeBarSlideUp 0.18s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* Panel header */}
          <div style={{
            padding: "12px 14px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", flex: 1 }}>
              Nodes
            </div>
          </div>

          {/* Scrollable node list */}
          <div style={{ overflowY: "auto", flex: 1, padding: "6px 0 8px" }}>
            {filtered ? (
              filtered.length > 0 ? (
                <>
                  <div style={{ padding: "4px 14px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444" }}>
                    Results
                  </div>
                  {filtered.map((def) => (
                    <NodeRow key={def.type} def={def} onAdd={handleAdd} />
                  ))}
                </>
              ) : (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <Search size={20} color="#2e2e2e" style={{ margin: "0 auto 8px", display: "block" }} />
                  <div style={{ color: "#444", fontSize: 12 }}>No nodes match "{q}"</div>
                </div>
              )
            ) : (
              groupedResults?.map((group) => (
                <div key={group.label}>
                  <div style={{
                    padding: "8px 14px 4px",
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#3a3a3a",
                  }}>
                    {group.label}
                  </div>
                  {group.defs.map((def) => (
                    <NodeRow key={def.type} def={def} onAdd={handleAdd} />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* The pill bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 44,
          background: "rgba(20,20,20,0.95)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 22,
          boxShadow: "0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden",
          minWidth: 200,
        }}
      >
        {/* Search side */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px 0 16px",
            flex: 1,
            cursor: "text",
            height: "100%",
          }}
          onClick={() => { setOpen(true); setTimeout(() => searchRef.current?.focus(), 0); }}
        >
          <Search size={14} color={open ? "#9ca3af" : "#555"} strokeWidth={2} />
          {open ? (
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes…"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#d4d4d4",
                fontSize: 13,
                fontWeight: 400,
                fontFamily: "inherit",
                width: 110,
                caretColor: "#d4d4d4",
              }}
            />
          ) : (
            <span style={{ fontSize: 13, color: "#444", fontWeight: 400, userSelect: "none" }}>
              Node…
            </span>
          )}
        </div>

      </div>

      <style>{`
        @keyframes nodeBarSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0.5"  width="15" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="0" y="5.25" width="15" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="0" y="10"   width="15" height="1.5" rx="0.75" fill="currentColor"/>
    </svg>
  );
}

function NodeRow({ def, onAdd }: { def: NodeDef; onAdd: (def: NodeDef) => void }) {
  const [hovered, setHovered] = useState(false);
  const disabled = !!def.comingSoon;

  return (
    <button
      onClick={() => onAdd(def)}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 14px",
        background: hovered ? "rgba(255,255,255,0.05)" : "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        opacity: disabled ? 0.35 : 1,
        transition: "background 0.08s",
        boxSizing: "border-box",
      }}
    >
      {/* Icon in a small container */}
      <div style={{
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
        filter: disabled ? "grayscale(1)" : "none",
      }}>
        {def.iconRaw}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: disabled ? "#3a3a3a" : "#d4d4d4",
            fontFamily: "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {def.label}
          </span>
          {def.recommended && !disabled && (
            <span style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#5865F2",
              background: "rgba(88,101,242,0.12)",
              border: "1px solid rgba(88,101,242,0.2)",
              borderRadius: 3,
              padding: "1px 4px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}>
              Start
            </span>
          )}
          {disabled && (
            <span style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#555",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 3,
              padding: "1px 4px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}>
              Soon
            </span>
          )}
        </div>
        {def.alias && (
          <div style={{ fontSize: 10, color: "#444", marginTop: 1, lineHeight: 1.3 }}>
            {def.alias}
          </div>
        )}
      </div>
    </button>
  );
}
