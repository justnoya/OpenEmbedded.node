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
} from "lucide-react";

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

const NODE_COLORS = ["#5865F2", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"];

const MiniCanvasPreview = ({ nodeCount }: { nodeCount: number }) => (
  <div style={{
    width: "100%", height: "100%",
    background: "#0f0f0f",
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }} />
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at 30% 50%, rgba(88,101,242,0.06) 0%, transparent 70%)",
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
              background: "#1b1b1b",
              border: `1px solid rgba(255,255,255,0.07)`,
              display: "flex", alignItems: "center",
              padding: "0 9px", gap: 7,
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1.5,
                background: `linear-gradient(90deg, ${c}, ${c}40, transparent)`,
              }} />
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, flexShrink: 0 }} />
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: `${c}25` }} />
            </div>
          ))}
          {nodeCount > 4 && (
            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.05em" }}>
              +{nodeCount - 4} more
            </span>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            border: "1px dashed rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 6px",
          }}>
            <Plus size={15} color="rgba(255,255,255,0.2)" />
          </div>
          <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>Empty canvas</span>
        </div>
      )}
    </div>
  </div>
);

export function Home() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: rawProjects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const projects = (rawProjects as Project[] | undefined) ?? [];
  const sorted = [...projects].reverse();

  const handleCreate = () => {
    createProject.mutate(
      { data: { name: newName.trim() || "Untitled Project", graph: { nodes: [], edges: [] } } },
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
    setShowCreateModal(true);
  };

  const isCreating = createProject.isPending;
  const isDeleting = deleteProject.isPending;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0f0f0f",
        color: "#f0f0f0",
        fontFamily: `"Inter", system-ui, sans-serif`,
        display: "flex",
        flexDirection: "column",
      }}
      onClick={() => setOpenMenuId(null)}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(15,15,15,0.9)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center",
        padding: "0 28px", height: 58, gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AppLogo size={32} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.03em" }}>
            OpenEmbedded
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={openCreate}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #5865F2, #7c3aed)",
            border: "none", borderRadius: 8, color: "#fff",
            fontSize: 13, fontWeight: 600, padding: "7px 16px",
            cursor: "pointer",
            boxShadow: "0 2px 14px rgba(88,101,242,0.38), 0 0 0 1px rgba(88,101,242,0.2)",
            transition: "opacity 0.15s, transform 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New Project
        </button>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "36px 28px 72px", maxWidth: 1320, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {isLoading ? (
          /* ── Skeleton ─────────────────────────────────────────────── */
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ width: 140, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.05)", marginBottom: 8 }} />
              <div style={{ width: 80, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.03)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(288px, 1fr))", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)",
                  background: "#161616", overflow: "hidden",
                  animation: "pulse 2s ease-in-out infinite",
                  opacity: 0.6 - i * 0.1,
                }}>
                  <div style={{ height: 176, background: "rgba(255,255,255,0.02)" }} />
                  <div style={{ padding: "14px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: "60%", height: 14, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 10 }} />
                    <div style={{ width: "35%", height: 11, borderRadius: 4, background: "rgba(255,255,255,0.03)" }} />
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
            {/* Hero block */}
            <div style={{ textAlign: "center", maxWidth: 500 }}>
              <div style={{
                width: 80, height: 80,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 26px",
                filter: "drop-shadow(0 0 28px rgba(88,101,242,0.35))",
              }}>
                <AppLogo size={80} />
              </div>

              <h1 style={{
                fontSize: 38, fontWeight: 800, margin: "0 0 12px",
                letterSpacing: "-0.04em", lineHeight: 1.15,
                background: "linear-gradient(135deg, #f2f2f2 30%, #666 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Build Discord messages<br />visually
              </h1>

              <p style={{ color: "#555", fontSize: 15, lineHeight: 1.7, margin: "0 0 30px" }}>
                Design Components V2 embeds with a drag-and-drop node graph.
                Export ready-to-use discord.js code or send live via webhook.
              </p>

              <button
                onClick={openCreate}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "linear-gradient(135deg, #5865F2, #7c3aed)",
                  border: "none", borderRadius: 10, color: "#fff",
                  fontSize: 15, fontWeight: 700, padding: "13px 28px",
                  cursor: "pointer",
                  boxShadow: "0 4px 22px rgba(88,101,242,0.42), 0 0 0 1px rgba(88,101,242,0.15)",
                  transition: "opacity 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.88";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <Plus size={17} strokeWidth={2.5} />
                Create your first project
              </button>
            </div>

            {/* Feature cards row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14, width: "100%", maxWidth: 680,
            }}>
              {[
                { icon: <AppLogo size={17} />, color: "#8b5cf6", title: "Visual Node Graph", desc: "Drag & drop all Discord CV2 components on an infinite canvas" },
                { icon: <MousePointerClick size={17} />, color: "#5865F2", title: "All CV2 Types", desc: "Container, Section, Text, Gallery, Button, Select, and more" },
                { icon: <Zap size={17} />, color: "#10b981", title: "Instant Export", desc: "JSON, discord.js v14 code, or send directly via webhook" },
              ].map((f) => (
                <div key={f.title} style={{
                  padding: "18px 18px",
                  background: "#161616",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  display: "flex", flexDirection: "column", gap: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${f.color}35`;
                    el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${f.color}18`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.35)";
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: `linear-gradient(135deg, ${f.color}22, ${f.color}0c)`,
                    border: `1px solid ${f.color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: f.color,
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ color: "#e0e0e0", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{f.title}</div>
                  <div style={{ color: "#555", fontSize: 12, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── Project Grid ─────────────────────────────────────────── */
          <>
            {/* Section header */}
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{
                  fontSize: 20, fontWeight: 800, color: "#e8e8e8",
                  margin: "0 0 2px", letterSpacing: "-0.03em",
                }}>
                  My Projects
                </h2>
                <p style={{ fontSize: 12, color: "#484848", margin: 0 }}>
                  {sorted.length} project{sorted.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(288px, 1fr))",
              gap: 16,
            }}>
              {/* ── New Project card ──────────────────────────────── */}
              <button
                onClick={openCreate}
                style={{
                  height: 288,
                  border: "1.5px dashed rgba(255,255,255,0.09)",
                  borderRadius: 16,
                  background: "transparent",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 10, color: "rgba(255,255,255,0.22)",
                  cursor: "pointer", transition: "all 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(88,101,242,0.45)";
                  el.style.color = "#818cf8";
                  el.style.background = "rgba(88,101,242,0.04)";
                  el.style.boxShadow = "0 0 0 1px rgba(88,101,242,0.12)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(255,255,255,0.09)";
                  el.style.color = "rgba(255,255,255,0.22)";
                  el.style.background = "transparent";
                  el.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  border: "1.5px dashed currentColor",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Plus size={20} strokeWidth={1.5} />
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
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.07)",
                      overflow: "visible",
                      background: "#161616",
                      position: "relative",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                      transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
                    }}
                    onClick={() => navigate(`/builder/${project.id}`)}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(88,101,242,0.3)";
                      el.style.boxShadow = "0 0 0 1px rgba(88,101,242,0.1), 0 8px 28px rgba(0,0,0,0.5)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.07)";
                      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.35)";
                      el.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Canvas preview area */}
                    <div style={{ height: 176, borderRadius: "15px 15px 0 0", overflow: "hidden" }}>
                      <MiniCanvasPreview nodeCount={nodeCount} />
                    </div>

                    {/* Card body */}
                    <div style={{
                      padding: "14px 16px 16px",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      {/* Name + menu */}
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
                            color: "rgba(255,255,255,0.28)", padding: "3px 4px",
                            flexShrink: 0, borderRadius: 5, display: "flex",
                            transition: "color 0.12s, background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = "#e8e8e8";
                            el.style.background = "rgba(255,255,255,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = "rgba(255,255,255,0.28)";
                            el.style.background = "none";
                          }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>

                      {/* Meta row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          color: "#404040", fontSize: 11,
                        }}>
                          <Clock size={10} />
                          {timeAgo(project.updatedAt)}
                        </span>
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          color: "#404040", fontSize: 11,
                        }}>
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
                          background: "rgba(26,26,26,0.98)",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: 11, overflow: "hidden", zIndex: 50,
                          boxShadow: "0 8px 28px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
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
                            cursor: "pointer", color: "#d0d0d0", fontSize: 13, fontWeight: 500,
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
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(10px)",
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
              width: "100%", maxWidth: 420,
              display: "flex", flexDirection: "column", gap: 20,
              boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
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
                <p style={{ fontSize: 12, color: "#484848", margin: 0 }}>Give your project a name to get started</p>
              </div>
              <button
                onClick={() => { if (!isCreating) setShowCreateModal(false); }}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
                  color: "#606060", cursor: isCreating ? "default" : "pointer",
                  padding: "5px", display: "flex", borderRadius: 7,
                  opacity: isCreating ? 0.4 : 1,
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => { if (!isCreating) (e.currentTarget as HTMLElement).style.color = "#e0e0e0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#606060"; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Name input */}
            <div>
              <label style={{
                display: "block", color: "#505050", fontSize: 11, fontWeight: 600,
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
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 9, color: isCreating ? "#808080" : "#f0f0f0",
                  fontSize: 14, padding: "11px 13px",
                  outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  cursor: isCreating ? "not-allowed" : "text",
                }}
                onFocus={(e) => {
                  if (!isCreating) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.55)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(88,101,242,0.1)";
                  }
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9,
                  color: isCreating ? "#3a3a3a" : "#c0c0c0", fontSize: 13, fontWeight: 600,
                  padding: "10px", cursor: isCreating ? "not-allowed" : "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { if (!isCreating) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                style={{
                  flex: 1,
                  background: isCreating
                    ? "linear-gradient(135deg, rgba(88,101,242,0.5), rgba(124,58,237,0.5))"
                    : "linear-gradient(135deg, #5865F2, #7c3aed)",
                  border: "none", borderRadius: 9, color: "#fff",
                  fontSize: 13, fontWeight: 700, padding: "10px",
                  cursor: isCreating ? "not-allowed" : "pointer",
                  boxShadow: isCreating ? "none" : "0 2px 12px rgba(88,101,242,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "opacity 0.12s, box-shadow 0.12s",
                }}
                onMouseEnter={(e) => { if (!isCreating) (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
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
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(10px)",
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
              boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
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
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
                  color: "#606060", cursor: "pointer", padding: "5px",
                  display: "flex", borderRadius: 7,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ color: "#555", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "#a0a0a0", fontWeight: 600 }}>
                &ldquo;{projects.find((p) => p.id === confirmDeleteId)?.name}&rdquo;
              </strong>{" "}
              will be permanently deleted. This cannot be undone.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9,
                  color: "#c0c0c0", fontSize: 13, fontWeight: 600, padding: "10px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  background: isDeleting ? "rgba(248,81,73,0.06)" : "rgba(248,81,73,0.1)",
                  border: "1px solid rgba(248,81,73,0.25)", borderRadius: 9,
                  color: "#f85149", fontSize: 13, fontWeight: 700, padding: "10px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { if (!isDeleting) (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.16)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isDeleting ? "rgba(248,81,73,0.06)" : "rgba(248,81,73,0.1)"; }}
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

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
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
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
