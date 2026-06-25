import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  useCreateProject,
  useDeleteProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import {
  Plus,
  MoreVertical,
  Trash2,
  ExternalLink,
  Zap,
  MousePointerClick,
  X,
  Clock,
  Box,
  Loader2,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";

const AppLogo = ({ size = 32 }: { size?: number }) => (
  <img
    src="/logo.png"
    alt="OpenEmbedded logo"
    width={size}
    height={size}
    style={{ objectFit: "contain", display: "block" }}
  />
);

type Project = {
  id: string;
  name: string;
  graph: { nodes: object[]; edges: object[] };
  updatedAt: string;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* Neutral gray node colors — no hue */
const NODE_COLORS = ["#c8c8c8", "#909090", "#686868", "#424242", "#2e2e2e", "#1e1e1e"];

const MiniCanvasPreview = ({ nodeCount }: { nodeCount: number }) => (
  <div style={{
    width: "100%", height: "100%",
    background: "#111111",
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }} />
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {nodeCount > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {NODE_COLORS.slice(0, Math.min(nodeCount, 4)).map((c, i) => (
            <div key={i} style={{
              width: 110 - i * 12,
              height: 26,
              borderRadius: 7,
              background: "#1a1a1a",
              border: `1px solid rgba(255,255,255,0.07)`,
              display: "flex", alignItems: "center",
              padding: "0 9px", gap: 7,
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: `rgba(255,255,255,0.06)`,
              }} />
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, flexShrink: 0 }} />
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: `rgba(255,255,255,0.08)` }} />
            </div>
          ))}
          {nodeCount > 4 && (
            <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 9, letterSpacing: "0.05em" }}>
              +{nodeCount - 4} more
            </span>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            border: "1px dashed rgba(255,255,255,0.09)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 6px",
          }}>
            <Plus size={15} color="rgba(255,255,255,0.18)" />
          </div>
          <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>Empty canvas</span>
        </div>
      )}
    </div>
  </div>
);

type TemplateId = "blank" | "welcome" | "poll" | "announcement";

const TEMPLATES: { id: TemplateId; emoji: string; label: string; description: string }[] = [
  { id: "blank",        emoji: "✨", label: "Blank",          description: "Start from scratch" },
  { id: "welcome",      emoji: "👋", label: "Welcome",        description: "Text + button" },
  { id: "announcement", emoji: "📢", label: "Announcement",   description: "Image + text" },
  { id: "poll",         emoji: "🗳️", label: "Poll",           description: "Select menu" },
];

function buildTemplateGraph(id: TemplateId): { nodes: object[]; edges: object[] } {
  if (id === "blank") return { nodes: [], edges: [] };
  const t = Date.now();
  const edgeStyle = { stroke: "rgba(255,255,255,0.18)", strokeWidth: 2 };
  if (id === "welcome") {
    const cId = `tpl_${t}_c`, txtId = `tpl_${t}_tx`, arId = `tpl_${t}_ar`, btnId = `tpl_${t}_b`;
    return {
      nodes: [
        { id: cId,   type: "container",   position: { x: 220, y: 100 }, data: { componentType: 17, accent_color: null, spoiler: false } },
        { id: txtId, type: "textDisplay", position: { x: 500, y: 60  }, data: { componentType: 10, content: "👋 **Welcome to our server!**\n\nWe're glad to have you here. Explore our channels and get started!" } },
        { id: arId,  type: "actionRow",   position: { x: 500, y: 210 }, data: { componentType: 1 } },
        { id: btnId, type: "button",      position: { x: 500, y: 360 }, data: { componentType: 2, label: "Get Roles", style: "Primary", custom_id: "welcome_roles", emoji: "", disabled: false } },
      ],
      edges: [
        { id: `e${t}1`, source: cId,  target: txtId, type: "default", style: edgeStyle },
        { id: `e${t}2`, source: cId,  target: arId,  type: "default", style: edgeStyle },
        { id: `e${t}3`, source: arId, target: btnId, type: "default", style: edgeStyle },
      ],
    };
  }
  if (id === "announcement") {
    const cId = `tpl_${t}_c`, secId = `tpl_${t}_s`, txtId = `tpl_${t}_tx`, thumbId = `tpl_${t}_th`, sepId = `tpl_${t}_sp`, txt2Id = `tpl_${t}_t2`;
    return {
      nodes: [
        { id: cId,     type: "container",   position: { x: 200, y: 100 }, data: { componentType: 17, accent_color: null, spoiler: false } },
        { id: secId,   type: "section",     position: { x: 480, y: 60  }, data: { componentType: 9 } },
        { id: txtId,   type: "textDisplay", position: { x: 760, y: 40  }, data: { componentType: 10, content: "📢 **New Announcement**\n\nSomething exciting is happening! Stay tuned for more details." } },
        { id: thumbId, type: "thumbnail",   position: { x: 760, y: 200 }, data: { componentType: 11, url: "https://cdn.discordapp.com/embed/avatars/0.png", description: "" } },
        { id: sepId,   type: "separator",   position: { x: 480, y: 250 }, data: { componentType: 14, spacing: "md", divider: true } },
        { id: txt2Id,  type: "textDisplay", position: { x: 480, y: 390 }, data: { componentType: 10, content: "-# Posted by @Admin · Today" } },
      ],
      edges: [
        { id: `e${t}1`, source: cId,   target: secId,   type: "default", style: edgeStyle },
        { id: `e${t}2`, source: secId, target: txtId,   type: "default", style: edgeStyle },
        { id: `e${t}3`, source: secId, target: thumbId, type: "default", style: edgeStyle },
        { id: `e${t}4`, source: cId,   target: sepId,   type: "default", style: edgeStyle },
        { id: `e${t}5`, source: cId,   target: txt2Id,  type: "default", style: edgeStyle },
      ],
    };
  }
  if (id === "poll") {
    const cId = `tpl_${t}_c`, txtId = `tpl_${t}_tx`, arId = `tpl_${t}_ar`, selId = `tpl_${t}_sl`;
    return {
      nodes: [
        { id: cId,   type: "container",  position: { x: 220, y: 100 }, data: { componentType: 17, accent_color: null, spoiler: false } },
        { id: txtId, type: "textDisplay",position: { x: 500, y: 60  }, data: { componentType: 10, content: "🗳️ **Community Poll**\n\nWhat should we do next?" } },
        { id: arId,  type: "actionRow",  position: { x: 500, y: 210 }, data: { componentType: 1 } },
        { id: selId, type: "selectMenu", position: { x: 500, y: 360 }, data: { componentType: 3, custom_id: "poll_vote", placeholder: "Cast your vote…", min_values: 1, max_values: 1, options: [{ label: "Option A", value: "a" }, { label: "Option B", value: "b" }, { label: "Option C", value: "c" }], disabled: false } },
      ],
      edges: [
        { id: `e${t}1`, source: cId,  target: txtId, type: "default", style: edgeStyle },
        { id: `e${t}2`, source: cId,  target: arId,  type: "default", style: edgeStyle },
        { id: `e${t}3`, source: arId, target: selId, type: "default", style: edgeStyle },
      ],
    };
  }
  return { nodes: [], edges: [] };
}

/* ── Dark button styles ──────────────────────────────────────────────────── */
const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  background: "#efefef",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 9, color: "#111111",
  fontSize: 13, fontWeight: 700, padding: "9px 16px",
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.85)",
  transition: "background 0.1s, box-shadow 0.1s",
  flexShrink: 0,
};

const btnPrimaryHero: React.CSSProperties = {
  ...btnPrimary,
  fontSize: 15, padding: "13px 28px",
  borderRadius: 10,
};

const btnDark: React.CSSProperties = {
  background: "#1e1e1e",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 9, color: "#b0b0b0",
  fontSize: 13, fontWeight: 600, padding: "10px",
  cursor: "pointer",
  transition: "background 0.12s, color 0.12s",
};

export function Home() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { data: rawProjects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("blank");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const projects = (rawProjects as Project[] | undefined) ?? [];
  const sorted = [...projects].reverse();

  const handleCreate = () => {
    createProject.mutate(
      { data: { name: newName.trim() || "Untitled Project", graph: buildTemplateGraph(selectedTemplate) } },
      {
        onSuccess: (p: unknown) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setShowCreateModal(false);
          setNewName("");
          navigate(`/builder/${(p as Project).id}`);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteProject.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setConfirmDeleteId(null);
          setOpenMenuId(null);
        },
      }
    );
  };

  const openCreate = () => {
    setNewName("");
    setSelectedTemplate("blank");
    setShowCreateModal(true);
  };

  const isCreating = createProject.isPending;
  const isDeleting = deleteProject.isPending;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#111111",
        color: "#f0f0f0",
        fontFamily: `"DM Sans", system-ui, sans-serif`,
        display: "flex",
        flexDirection: "column",
      }}
      onClick={() => setOpenMenuId(null)}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, padding: "10px 16px" }}>
        <header style={{
          background: "rgba(26,26,26,0.94)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          boxShadow: "0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center",
          padding: "0 18px", height: 50, gap: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
              <AppLogo size={28} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.03em" }}>
              OpenEmbedded
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* ── User avatar + logout ──────────────────────────────── */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 6 }}>
              {/* Avatar */}
              <div
                title={user.globalName ?? user.username}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  flexShrink: 0,
                  background: "#2a2a2a",
                }}
              >
                <img
                  src={
                    user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
                      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id.slice(-2), 16) % 6}.png`
                  }
                  alt={user.username}
                  width={28}
                  height={28}
                  style={{ display: "block", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
                  }}
                />
              </div>

              {/* Username — hidden when narrow */}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#686868",
                  letterSpacing: "-0.01em",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.globalName ?? user.username}
              </span>

              {/* Logout button */}
              <button
                onClick={() => void logout()}
                title="Sign out"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 7,
                  color: "#585858",
                  cursor: "pointer",
                  transition: "background 0.12s, color 0.12s, border-color 0.12s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#1e1e1e";
                  el.style.color = "#f85149";
                  el.style.borderColor = "rgba(248,81,73,0.22)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.color = "#585858";
                  el.style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                <LogOut size={13} strokeWidth={2} />
              </button>
            </div>
          )}

          <button
            onClick={openCreate}
            style={btnPrimary}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#efefef";
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            New Project
          </button>
        </header>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "36px 28px 72px", maxWidth: 1320, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {isLoading ? (
          /* ── Skeleton ─────────────────────────────────────────────── */
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ width: 140, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.04)", marginBottom: 8 }} />
              <div style={{ width: 80, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.025)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(288px, 1fr))", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
                  background: "#1a1a1a", overflow: "hidden",
                  animation: "pulse 2s ease-in-out infinite",
                  opacity: 0.6 - i * 0.1,
                }}>
                  <div style={{ height: 176, background: "rgba(255,255,255,0.015)" }} />
                  <div style={{ padding: "14px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: "60%", height: 14, borderRadius: 4, background: "rgba(255,255,255,0.05)", marginBottom: 10 }} />
                    <div style={{ width: "35%", height: 11, borderRadius: 4, background: "rgba(255,255,255,0.025)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : sorted.length === 0 ? (
          /* ── Empty State ──────────────────────────────────────────── */
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: "64vh", gap: 52,
          }}>
            {/* Hero */}
            <div style={{ textAlign: "center", maxWidth: 500 }}>
              <div style={{
                width: 80, height: 80,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 26px",
              }}>
                <AppLogo size={80} />
              </div>

              <h1 style={{
                fontSize: 38, fontWeight: 800, margin: "0 0 12px",
                letterSpacing: "-0.04em", lineHeight: 1.15,
                background: "linear-gradient(135deg, #f0f0f0 30%, #606060 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Build Discord messages<br />visually
              </h1>

              <p style={{ color: "#505050", fontSize: 15, lineHeight: 1.7, margin: "0 0 30px" }}>
                Design Components V2 embeds with a drag-and-drop node graph.
                Export ready-to-use discord.js code or send live via webhook.
              </p>

              <button
                onClick={openCreate}
                style={btnPrimaryHero}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#ffffff";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.9)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#efefef";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 2px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.85)";
                }}
              >
                <Plus size={17} strokeWidth={2.5} />
                Create your first project
              </button>
            </div>

            {/* Feature cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12, width: "100%", maxWidth: 680,
            }}>
              {[
                { icon: <AppLogo size={15} />, title: "Visual Node Graph", desc: "Drag & drop all Discord CV2 components on an infinite canvas" },
                { icon: <MousePointerClick size={15} />, title: "All CV2 Types", desc: "Container, Section, Text, Gallery, Button, Select, and more" },
                { icon: <Zap size={15} />, title: "Instant Export", desc: "JSON, discord.js v14 code, or send directly via webhook" },
              ].map((f) => (
                <div key={f.title} style={{
                  padding: "18px",
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 13,
                  display: "flex", flexDirection: "column", gap: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
                  transition: "border-color 0.18s, box-shadow 0.18s",
                }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.14)";
                    el.style.boxShadow = "0 4px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)";
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#909090",
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ color: "#e0e0e0", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{f.title}</div>
                  <div style={{ color: "#4a4a4a", fontSize: 12, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── Project Grid ─────────────────────────────────────────── */
          <>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{
                  fontSize: 20, fontWeight: 800, color: "#e8e8e8",
                  margin: "0 0 2px", letterSpacing: "-0.03em",
                }}>
                  My Projects
                </h2>
                <p style={{ fontSize: 12, color: "#404040", margin: 0 }}>
                  {sorted.length} project{sorted.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(288px, 1fr))",
              gap: 14,
            }}>
              {/* ── New Project card ──────────────────────────────── */}
              <button
                onClick={openCreate}
                style={{
                  height: 288,
                  border: "1.5px dashed rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  background: "transparent",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 10, color: "rgba(255,255,255,0.2)",
                  cursor: "pointer", transition: "all 0.18s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(255,255,255,0.18)";
                  el.style.color = "rgba(255,255,255,0.55)";
                  el.style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(255,255,255,0.08)";
                  el.style.color = "rgba(255,255,255,0.2)";
                  el.style.background = "transparent";
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  border: "1.5px dashed currentColor",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Plus size={19} strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>New Project</span>
              </button>

              {/* ── Project cards ─────────────────────────────────── */}
              {sorted.map((project) => {
                const nodeCount = project.graph?.nodes?.length ?? 0;
                const isMenuOpen = openMenuId === project.id;
                return (
                  <div
                    key={project.id}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.07)",
                      overflow: "visible",
                      background: "#1a1a1a",
                      position: "relative",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
                      transition: "border-color 0.18s, box-shadow 0.18s, transform 0.15s",
                    }}
                    onClick={() => navigate(`/builder/${project.id}`)}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.14)";
                      el.style.boxShadow = "0 8px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.07)";
                      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)";
                      el.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Canvas preview */}
                    <div style={{ height: 176, borderRadius: "13px 13px 0 0", overflow: "hidden" }}>
                      <MiniCanvasPreview nodeCount={nodeCount} />
                    </div>

                    {/* Card body */}
                    <div style={{
                      padding: "14px 16px 16px",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 10,
                      }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: "#e8e8e8",
                          letterSpacing: "-0.02em",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          flex: 1, paddingRight: 6,
                        }}>
                          {project.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : project.id);
                          }}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "rgba(255,255,255,0.24)", padding: "3px 4px",
                            flexShrink: 0, borderRadius: 5, display: "flex",
                            transition: "color 0.12s, background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = "#e0e0e0";
                            el.style.background = "rgba(255,255,255,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = "rgba(255,255,255,0.24)";
                            el.style.background = "none";
                          }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#484848", fontSize: 11 }}>
                          <Clock size={10} />
                          {timeAgo(project.updatedAt)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#484848", fontSize: 11 }}>
                          <Box size={10} />
                          {nodeCount} node{nodeCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Context menu */}
                    {isMenuOpen && (
                      <div
                        style={{
                          position: "absolute", top: "calc(100% - 36px)", right: 10,
                          background: "rgba(30,30,30,0.98)",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: 11, overflow: "hidden", zIndex: 50,
                          boxShadow: "0 8px 28px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)",
                          minWidth: 164,
                          animation: "fadeIn 0.1s ease",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/builder/${project.id}`); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                            background: "none", border: "none", padding: "10px 13px",
                            cursor: "pointer", color: "#c8c8c8", fontSize: 13, fontWeight: 500,
                            textAlign: "left", transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        >
                          <ExternalLink size={13} />
                          Open in Builder
                        </button>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 8px" }} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(project.id);
                            setOpenMenuId(null);
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                            background: "none", border: "none", padding: "10px 13px",
                            cursor: "pointer", color: "#f85149", fontSize: 13, fontWeight: 500,
                            textAlign: "left", transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.07)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ── Create Modal ────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, padding: "0 20px",
          }}
          onClick={() => { if (!isCreating) setShowCreateModal(false); }}
        >
          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 18, padding: "26px 24px",
              width: "100%", maxWidth: 500,
              display: "flex", flexDirection: "column", gap: 20,
              boxShadow: "0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
              animation: "scaleIn 0.14s cubic-bezier(0.4,0,0.2,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
                  New Project
                </h3>
                <p style={{ fontSize: 12, color: "#424242", margin: 0 }}>Name your project and choose a starting template</p>
              </div>
              <button
                onClick={() => { if (!isCreating) setShowCreateModal(false); }}
                style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  color: "#555", cursor: isCreating ? "default" : "pointer",
                  padding: "5px", display: "flex", borderRadius: 7,
                  opacity: isCreating ? 0.4 : 1,
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => { if (!isCreating) (e.currentTarget as HTMLElement).style.color = "#d0d0d0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Name input */}
            <div>
              <label style={{
                display: "block", color: "#484848", fontSize: 11, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
              }}>
                Project Name
              </label>
              <input
                autoFocus
                type="text"
                value={newName}
                disabled={isCreating}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) handleCreate();
                  if (e.key === "Escape" && !isCreating) setShowCreateModal(false);
                }}
                placeholder="Untitled Project"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 9, color: isCreating ? "#606060" : "#f0f0f0",
                  fontSize: 14, padding: "11px 13px",
                  outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  cursor: isCreating ? "not-allowed" : "text",
                }}
                onFocus={(e) => {
                  if (!isCreating) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.22)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(255,255,255,0.04)";
                  }
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              />
            </div>

            {/* Template picker */}
            <div>
              <label style={{
                display: "block", color: "#484848", fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
              }}>
                Start from a template
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {TEMPLATES.map((tpl) => {
                  const active = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      disabled={isCreating}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        background: active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.025)",
                        border: `1px solid ${active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 10, padding: "10px 12px",
                        cursor: isCreating ? "not-allowed" : "pointer",
                        textAlign: "left", transition: "all 0.15s",
                        boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{tpl.emoji}</span>
                      <div>
                        <div style={{ color: active ? "#f0f0f0" : "#b0b0b0", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                          {tpl.label}
                        </div>
                        <div style={{ color: "#424242", fontSize: 10, lineHeight: 1.4 }}>
                          {tpl.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                style={{
                  ...btnDark,
                  flex: 1,
                  color: isCreating ? "#333" : "#909090",
                  cursor: isCreating ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => { if (!isCreating) { (e.currentTarget as HTMLElement).style.background = "#242424"; (e.currentTarget as HTMLElement).style.color = "#c0c0c0"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#909090"; }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                style={{
                  flex: 1,
                  background: isCreating ? "rgba(239,239,239,0.5)" : "#efefef",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 9, color: "#111111",
                  fontSize: 13, fontWeight: 700, padding: "10px",
                  cursor: isCreating ? "not-allowed" : "pointer",
                  boxShadow: isCreating ? "none" : "0 1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.85)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "background 0.1s, box-shadow 0.1s",
                }}
                onMouseEnter={(e) => { if (!isCreating) (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
                onMouseLeave={(e) => { if (!isCreating) (e.currentTarget as HTMLElement).style.background = "#efefef"; }}
              >
                {isCreating ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                    Creating…
                  </>
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {confirmDeleteId && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, padding: "0 20px",
          }}
          onClick={() => { if (!isDeleting) setConfirmDeleteId(null); }}
        >
          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 18, padding: "26px 24px",
              width: "100%", maxWidth: 420,
              display: "flex", flexDirection: "column", gap: 18,
              boxShadow: "0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
              animation: "scaleIn 0.14s cubic-bezier(0.4,0,0.2,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", margin: 0, letterSpacing: "-0.02em" }}>
                Delete Project?
              </h3>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  color: "#555", cursor: "pointer", padding: "5px",
                  display: "flex", borderRadius: 7,
                  transition: "color 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#d0d0d0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ color: "#4a4a4a", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "#909090", fontWeight: 600 }}>
                &ldquo;{projects.find((p) => p.id === confirmDeleteId)?.name}&rdquo;
              </strong>{" "}
              will be permanently deleted. This cannot be undone.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                style={{ ...btnDark, flex: 1, cursor: isDeleting ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!isDeleting) { (e.currentTarget as HTMLElement).style.background = "#242424"; (e.currentTarget as HTMLElement).style.color = "#c0c0c0"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#909090"; }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  background: isDeleting ? "rgba(248,81,73,0.04)" : "rgba(248,81,73,0.09)",
                  border: "1px solid rgba(248,81,73,0.22)", borderRadius: 9,
                  color: "#f85149", fontSize: 13, fontWeight: 700, padding: "10px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { if (!isDeleting) (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isDeleting ? "rgba(248,81,73,0.04)" : "rgba(248,81,73,0.09)"; }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12, marginTop: "auto",
      }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>
          © 2026 OpenEmbedded
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Docs",            href: "/docs" },
            { label: "Terms of Service", href: "/tos" },
            { label: "Privacy Policy",  href: "/privacy" },
            { label: "Support",         href: "https://discord.gg/P84XzN2UKh" },
          ].map((l) => (
            <a key={l.label} href={l.href}
              style={{
                fontSize: 12, color: "rgba(255,255,255,0.28)",
                textDecoration: "none", transition: "color 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
            >{l.label}</a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.28; }
        }
      `}</style>
    </div>
  );
}
