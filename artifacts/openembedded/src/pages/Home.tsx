import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  useCreateProject,
  useDeleteProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { Plus, MoreVertical, Trash2, ExternalLink, FolderOpen, Zap, Layers, MousePointerClick, X } from "lucide-react";

const BG = "#090C14";
const PANEL = "#111827";
const SURFACE = "#141926";
const BORDER = "#1D2539";
const TEXT = "#E8EDFF";
const MUTED = "#64748B";
const FAINT = "#374165";
const ACCENT = "#5865F2";

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
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const MiniCanvasPreview = ({ nodeCount }: { nodeCount: number }) => (
  <div style={{
    width: "100%",
    height: "100%",
    background: "#0C0F1A",
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{
      position: "absolute",
      inset: 0,
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    }} />
    <div style={{
      position: "absolute",
      left: 0, top: 0, bottom: 0,
      width: 66,
      background: PANEL,
      borderRight: `1px solid ${BORDER}`,
      padding: "8px 6px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      {[
        { color: "#8b5cf6" }, { color: "#10b981" }, { color: "#3b82f6" },
        { color: "#f59e0b" }, { color: "#ec4899" }, { color: "#14b8a6" }, { color: "#5865F2" },
      ].map((item, i) => (
        <div key={i} style={{
          height: 14,
          borderRadius: 3,
          background: item.color + "18",
          borderLeft: `2px solid ${item.color}`,
        }} />
      ))}
    </div>
    <div style={{
      position: "absolute",
      left: 66, top: 0, bottom: 0, right: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {nodeCount > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "center" }}>
          {[
            { color: "#8b5cf6", w: 110 },
            { color: "#10b981", w: 90 },
            { color: "#3b82f6", w: 80 },
          ].slice(0, Math.min(nodeCount, 3)).map((n, i) => (
            <div key={i} style={{
              width: n.w,
              height: 26,
              borderRadius: 5,
              background: SURFACE,
              border: `1px solid ${n.color}28`,
              borderLeft: `3px solid ${n.color}`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 7,
              gap: 4,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: n.color }} />
              <div style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: n.color + "30",
              }} />
            </div>
          ))}
          {nodeCount > 3 && (
            <span style={{ color: FAINT, fontSize: 9, letterSpacing: "0.05em" }}>+{nodeCount - 3} more nodes</span>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", opacity: 0.7 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px dashed ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 6px",
          }}>
            <Plus size={16} color={FAINT} />
          </div>
          <span style={{ color: FAINT, fontSize: 10 }}>Empty canvas</span>
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

  const handleCreate = (name: string) => {
    createProject.mutate(
      { data: { name: name.trim() || "Untitled Project", graph: { nodes: [], edges: [] } } },
      {
        onSuccess: (p: unknown) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
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

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        color: TEXT,
        fontFamily: `"gg sans","Noto Sans","Helvetica Neue",Arial,sans-serif`,
        display: "flex",
        flexDirection: "column",
      }}
      onClick={() => setOpenMenuId(null)}
    >
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: BG,
        borderBottom: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        height: 56,
        gap: 16,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `linear-gradient(135deg, #5865F2, #8b5cf6)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(88,101,242,0.35)",
          }}>
            <Layers size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: "-0.02em" }}>
            OpenEmbedded
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Node count badge */}
        {sorted.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: "4px 12px",
          }}>
            <FolderOpen size={12} color={MUTED} />
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>
              {sorted.length} project{sorted.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* New Project CTA */}
        <button
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: ACCENT,
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            padding: "7px 14px",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(88,101,242,0.35)",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#4752C4"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ACCENT; }}
        >
          <Plus size={14} />
          New Project
        </button>
      </header>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "32px 24px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>

        {isLoading ? (
          /* Loading skeleton */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 18,
          }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 280,
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                opacity: 0.5,
              }} />
            ))}
          </div>

        ) : sorted.length === 0 ? (
          /* Empty state */
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            gap: 48,
          }}>
            <div style={{ textAlign: "center", maxWidth: 480 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: `linear-gradient(135deg, rgba(88,101,242,0.2), rgba(139,92,246,0.2))`,
                border: `1px solid rgba(88,101,242,0.25)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Layers size={28} color={ACCENT} strokeWidth={1.5} />
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.03em" }}>
                Build Discord messages visually
              </h1>
              <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.7, margin: "0 0 28px" }}>
                Design Components V2 embeds with a drag-and-drop node editor.
                Export ready-to-use discord.js code or send via webhook.
              </p>
              <button
                onClick={openCreate}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: ACCENT,
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "12px 28px",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(88,101,242,0.4)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#4752C4"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ACCENT; }}
              >
                <Plus size={17} />
                Create your first project
              </button>
            </div>

            {/* Feature highlights */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              width: "100%",
              maxWidth: 680,
            }}>
              {[
                { icon: <Layers size={18} />, color: "#8b5cf6", title: "Visual Node Graph", desc: "Drag & drop Discord components on an infinite canvas" },
                { icon: <MousePointerClick size={18} />, color: "#5865F2", title: "All CV2 Types", desc: "Containers, Sections, Buttons, Selects and more" },
                { icon: <Zap size={18} />, color: "#10b981", title: "Instant Export", desc: "Get JSON, discord.js code, or send directly via webhook" },
              ].map((f) => (
                <div key={f.title} style={{
                  padding: "16px 18px",
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: f.color + "18",
                    border: `1px solid ${f.color}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: f.color,
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{f.title}</div>
                  <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* Project grid */
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: "-0.02em" }}>
                Recent Projects
              </h2>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: 16,
            }}>
              {/* New project card */}
              <button
                onClick={openCreate}
                style={{
                  height: 292,
                  border: `2px dashed ${BORDER}`,
                  borderRadius: 16,
                  background: "transparent",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  color: FAINT,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = ACCENT;
                  el.style.color = ACCENT;
                  el.style.background = "rgba(88,101,242,0.04)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = BORDER;
                  el.style.color = FAINT;
                  el.style.background = "transparent";
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  border: "2px dashed currentColor",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Plus size={20} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>New Project</span>
              </button>

              {/* Existing project cards */}
              {sorted.map((project) => {
                const nodeCount = project.graph?.nodes?.length ?? 0;
                const isMenuOpen = openMenuId === project.id;
                return (
                  <div
                    key={project.id}
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${BORDER}`,
                      overflow: "hidden",
                      background: PANEL,
                      position: "relative",
                      cursor: "pointer",
                      transition: "border-color 0.15s, transform 0.15s",
                    }}
                    onClick={() => navigate(`/builder/${project.id}`)}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(88,101,242,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = BORDER;
                    }}
                  >
                    {/* Canvas preview */}
                    <div style={{ height: 180, position: "relative" }}>
                      <MiniCanvasPreview nodeCount={nodeCount} />
                    </div>

                    {/* Card footer */}
                    <div style={{
                      padding: "12px 14px 14px",
                      borderTop: `1px solid ${BORDER}`,
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: TEXT,
                          lineHeight: 1.3,
                          flex: 1,
                          paddingRight: 8,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {project.name}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : project.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: MUTED,
                            padding: "1px 3px",
                            flexShrink: 0,
                            borderRadius: 4,
                            display: "flex",
                          }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}>
                        <div style={{ color: MUTED, fontSize: 11 }}>
                          {timeAgo(project.updatedAt)}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: SURFACE,
                          border: `1px solid ${BORDER}`,
                          borderRadius: 20,
                          padding: "2px 8px",
                        }}>
                          <span style={{ color: FAINT, fontSize: 10, fontWeight: 600 }}>
                            {nodeCount} node{nodeCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Context menu */}
                    {isMenuOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: 184,
                          right: 10,
                          background: PANEL,
                          border: `1px solid ${BORDER}`,
                          borderRadius: 10,
                          overflow: "hidden",
                          zIndex: 50,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                          minWidth: 160,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/builder/${project.id}`); }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            width: "100%",
                            background: "none",
                            border: "none",
                            padding: "9px 13px",
                            cursor: "pointer",
                            color: TEXT,
                            fontSize: 13,
                            fontWeight: 500,
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        >
                          <ExternalLink size={13} />
                          Open in Builder
                        </button>
                        <div style={{ height: 1, background: BORDER }} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(project.id); setOpenMenuId(null); }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            width: "100%",
                            background: "none",
                            border: "none",
                            padding: "9px 13px",
                            cursor: "pointer",
                            color: "#f85149",
                            fontSize: 13,
                            fontWeight: 500,
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.06)"; }}
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

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      {confirmDeleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "0 20px",
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 20,
              padding: "28px 24px",
              width: "100%",
              maxWidth: 440,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: TEXT, margin: 0 }}>
                Delete Project?
              </h3>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4, display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: TEXT }}>&ldquo;{projects.find((p) => p.id === confirmDeleteId)?.name}&rdquo;</strong>{" "}
              and all its nodes will be permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 10,
                  color: TEXT,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "10px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                style={{
                  flex: 1,
                  background: "rgba(248,81,73,0.12)",
                  border: "1px solid rgba(248,81,73,0.25)",
                  borderRadius: 10,
                  color: "#f85149",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "10px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Project Modal ───────────────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "0 20px",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 20,
              padding: "28px 24px",
              width: "100%",
              maxWidth: 440,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: 0 }}>
                New Project
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4, display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{
                display: "block",
                color: MUTED,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}>
                Project name
              </label>
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Discord Message"
                onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) handleCreate(newName); }}
                style={{
                  width: "100%",
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 9,
                  color: TEXT,
                  fontSize: 14,
                  padding: "10px 13px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
              />
            </div>

            <button
              onClick={() => handleCreate(newName)}
              disabled={createProject.isPending}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background: ACCENT,
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px",
                cursor: createProject.isPending ? "wait" : "pointer",
                opacity: createProject.isPending ? 0.7 : 1,
                boxShadow: "0 4px 16px rgba(88,101,242,0.35)",
                transition: "all 0.15s",
              }}
            >
              <Plus size={16} />
              Create Project
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}
