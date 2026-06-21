import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  useCreateProject,
  useDeleteProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { Plus, MoreVertical, Trash2, ExternalLink, FolderOpen, Zap, Layers, MousePointerClick, X, ArrowRight } from "lucide-react";

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

const ACCENT_COLORS = ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#14b8a6", "#5865F2"];

const MiniCanvasPreview = ({ nodeCount }: { nodeCount: number }) => (
  <div style={{
    width: "100%", height: "100%",
    background: "#0f0f0f",
    position: "relative",
    overflow: "hidden",
  }}>
    {/* Dot grid */}
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }} />
    {/* Gradient overlay */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at 30% 50%, rgba(88,101,242,0.05) 0%, transparent 70%)",
    }} />
    {/* Mini sidebar */}
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0, width: 60,
      background: "#161616",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      padding: "8px 5px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      {ACCENT_COLORS.map((c, i) => (
        <div key={i} style={{
          height: 12, borderRadius: 3,
          background: `linear-gradient(90deg, ${c}20, ${c}08)`,
          borderLeft: `2px solid ${c}`,
        }} />
      ))}
    </div>
    {/* Canvas content */}
    <div style={{
      position: "absolute", left: 60, top: 0, bottom: 0, right: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {nodeCount > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {ACCENT_COLORS.slice(0, Math.min(nodeCount, 3)).map((c, i) => (
            <div key={i} style={{
              width: 100 - i * 10,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%), #1b1b1b`,
              border: `1px solid rgba(255,255,255,0.07)`,
              display: "flex", alignItems: "center",
              padding: "0 8px", gap: 6,
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1.5,
                background: `linear-gradient(90deg, ${c}, ${c}40, transparent)`,
              }} />
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, boxShadow: `0 0 4px ${c}` }} />
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: `${c}20` }} />
            </div>
          ))}
          {nodeCount > 3 && (
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: "0.05em" }}>
              +{nodeCount - 3} more
            </span>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: 9,
            border: "1px dashed rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 6px",
          }}>
            <Plus size={14} color="rgba(255,255,255,0.2)" />
          </div>
          <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>Empty</span>
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

  const openCreate = () => { setNewName(""); setShowCreateModal(true); };

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
      {/* ── Glass Header ─────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(15,15,15,0.85)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center",
        padding: "0 24px", height: 56, gap: 16,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, #5865F2 0%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(88,101,242,0.4), 0 2px 8px rgba(0,0,0,0.5)",
          }}>
            <Layers size={16} color="#fff" strokeWidth={2} />
          </div>
          <span style={{
            fontSize: 15, fontWeight: 700, color: "#f0f0f0",
            letterSpacing: "-0.03em",
          }}>
            OpenEmbedded
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {sorted.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, padding: "4px 12px",
          }}>
            <FolderOpen size={12} color="#606060" />
            <span style={{ fontSize: 12, color: "#606060", fontWeight: 500 }}>
              {sorted.length} project{sorted.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <button
          onClick={openCreate}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #5865F2, #7c3aed)",
            border: "none",
            borderRadius: 8, color: "#fff",
            fontSize: 13, fontWeight: 600,
            padding: "7px 15px", cursor: "pointer",
            boxShadow: "0 2px 16px rgba(88,101,242,0.4), 0 0 0 1px rgba(88,101,242,0.2)",
            transition: "opacity 0.15s, transform 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New Project
        </button>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "32px 24px 64px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {isLoading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 16,
          }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 296,
                background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%), #161616",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, opacity: 0.5,
                animation: "shimmer 2s ease-in-out infinite",
              }} />
            ))}
          </div>

        ) : sorted.length === 0 ? (
          /* ── Empty / Hero ─────────────────────────────────────────── */
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: "68vh", gap: 64,
          }}>
            <div style={{ textAlign: "center", maxWidth: 520 }}>
              {/* Logo glow orb */}
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: "linear-gradient(135deg, rgba(88,101,242,0.25), rgba(124,58,237,0.15))",
                border: "1px solid rgba(88,101,242,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 28px",
                boxShadow: "0 0 60px rgba(88,101,242,0.15), 0 8px 32px rgba(0,0,0,0.5)",
              }}>
                <Layers size={32} color="#818cf8" strokeWidth={1.5} />
              </div>

              <h1 style={{
                fontSize: 40, fontWeight: 800, margin: "0 0 14px",
                letterSpacing: "-0.04em", lineHeight: 1.15,
                background: "linear-gradient(135deg, #f2f2f2 30%, #707070 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Build Discord messages<br />visually
              </h1>

              <p style={{ color: "#606060", fontSize: 15, lineHeight: 1.75, margin: "0 0 32px" }}>
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
                  boxShadow: "0 4px 24px rgba(88,101,242,0.45), 0 0 0 1px rgba(88,101,242,0.15)",
                  transition: "opacity 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.9";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <Plus size={17} strokeWidth={2.5} />
                Create your first project
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Feature grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14, width: "100%", maxWidth: 700,
            }}>
              {[
                {
                  icon: <Layers size={18} />, color: "#8b5cf6",
                  title: "Visual Node Graph",
                  desc: "Drag & drop all Discord CV2 components on an infinite canvas",
                },
                {
                  icon: <MousePointerClick size={18} />, color: "#5865F2",
                  title: "All CV2 Types",
                  desc: "Container, Section, Text, Gallery, Button, Select, and more",
                },
                {
                  icon: <Zap size={18} />, color: "#10b981",
                  title: "Instant Export",
                  desc: "JSON, discord.js v14 code, or send directly via webhook",
                },
              ].map((f) => (
                <div key={f.title} style={{
                  padding: "18px 20px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%), #161616",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  display: "flex", flexDirection: "column", gap: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${f.color}30`;
                    el.style.boxShadow = `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${f.color}20`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `linear-gradient(135deg, ${f.color}25, ${f.color}10)`,
                    border: `1px solid ${f.color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: f.color,
                    boxShadow: `0 0 12px ${f.color}15`,
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                    {f.title}
                  </div>
                  <div style={{ color: "#606060", fontSize: 12, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── Project Grid ─────────────────────────────────────────── */
          <>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 24,
            }}>
              <div>
                <h2 style={{
                  fontSize: 22, fontWeight: 800, color: "#e8e8e8",
                  margin: "0 0 3px", letterSpacing: "-0.03em",
                }}>
                  Recent Projects
                </h2>
                <p style={{ fontSize: 13, color: "#505050", margin: 0 }}>
                  {sorted.length} project{sorted.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(295px, 1fr))",
              gap: 16,
            }}>
              {/* New project card */}
              <button
                onClick={openCreate}
                style={{
                  height: 296, border: "1px dashed rgba(255,255,255,0.1)",
                  borderRadius: 16, background: "transparent",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 12, color: "rgba(255,255,255,0.2)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(88,101,242,0.4)";
                  el.style.color = "#818cf8";
                  el.style.background = "rgba(88,101,242,0.04)";
                  el.style.boxShadow = "0 0 0 1px rgba(88,101,242,0.15)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(255,255,255,0.1)";
                  el.style.color = "rgba(255,255,255,0.2)";
                  el.style.background = "transparent";
                  el.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  border: "1.5px dashed currentColor",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Plus size={22} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                  New Project
                </div>
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
                      border: "1px solid rgba(255,255,255,0.07)",
                      overflow: "hidden",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%), #161616",
                      position: "relative",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                      transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
                    }}
                    onClick={() => navigate(`/builder/${project.id}`)}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(88,101,242,0.35)";
                      el.style.boxShadow = "0 0 0 1px rgba(88,101,242,0.12), 0 8px 32px rgba(0,0,0,0.5)";
                      el.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.07)";
                      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
                      el.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Canvas preview */}
                    <div style={{ height: 186, position: "relative" }}>
                      <MiniCanvasPreview nodeCount={nodeCount} />
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: "13px 16px 15px",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      background: "rgba(255,255,255,0.01)",
                    }}>
                      <div style={{
                        display: "flex", alignItems: "flex-start",
                        justifyContent: "space-between", marginBottom: 8,
                      }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700, color: "#e8e8e8",
                          letterSpacing: "-0.02em", flex: 1, paddingRight: 8,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {project.name}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : project.id); }}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "rgba(255,255,255,0.3)", padding: "2px 3px",
                            flexShrink: 0, borderRadius: 4, display: "flex",
                            transition: "color 0.12s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f0f0f0"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"; }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#404040", fontSize: 11 }}>
                          {timeAgo(project.updatedAt)}
                        </span>
                        <span style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 20, padding: "2px 8px",
                          color: "#505050", fontSize: 10, fontWeight: 600,
                          letterSpacing: "0.03em",
                        }}>
                          {nodeCount} node{nodeCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Context menu */}
                    {isMenuOpen && (
                      <div
                        style={{
                          position: "absolute", top: 190, right: 10,
                          background: "rgba(30,30,30,0.95)",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: 12, overflow: "hidden", zIndex: 50,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
                          minWidth: 168,
                          animation: "fadeIn 0.1s cubic-bezier(0.4,0,0.2,1)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/builder/${project.id}`); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                            background: "none", border: "none", padding: "10px 14px",
                            cursor: "pointer", color: "#d0d0d0", fontSize: 13, fontWeight: 500,
                            textAlign: "left", transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        >
                          <ExternalLink size={13} />
                          Open in Builder
                        </button>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(project.id); setOpenMenuId(null); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                            background: "none", border: "none", padding: "10px 14px",
                            cursor: "pointer", color: "#f85149", fontSize: 13, fontWeight: 500,
                            textAlign: "left", transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.08)"; }}
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

      {/* ── Delete Modal ──────────────────────────────────────────────── */}
      {confirmDeleteId && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, padding: "0 20px",
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%), #1a1a1a",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 20, padding: "28px 26px",
              width: "100%", maxWidth: 440,
              display: "flex", flexDirection: "column", gap: 18,
              boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
              animation: "scaleIn 0.15s cubic-bezier(0.4,0,0.2,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0", margin: 0, letterSpacing: "-0.02em" }}>
                Delete Project?
              </h3>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ background: "none", border: "none", color: "#606060", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "#606060", fontSize: 13, margin: 0, lineHeight: 1.65 }}>
              <strong style={{ color: "#b0b0b0", fontWeight: 600 }}>&ldquo;{projects.find((p) => p.id === confirmDeleteId)?.name}&rdquo;</strong>{" "}
              and all its data will be permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                  color: "#d0d0d0", fontSize: 13, fontWeight: 600, padding: "10px",
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                style={{
                  flex: 1, background: "rgba(248,81,73,0.1)",
                  border: "1px solid rgba(248,81,73,0.25)", borderRadius: 10,
                  color: "#f85149", fontSize: 13, fontWeight: 700, padding: "10px",
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.16)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.1)"; }}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, padding: "0 20px",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%), #1a1a1a",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 20, padding: "28px 26px",
              width: "100%", maxWidth: 440,
              display: "flex", flexDirection: "column", gap: 18,
              boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
              animation: "scaleIn 0.15s cubic-bezier(0.4,0,0.2,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0", margin: 0, letterSpacing: "-0.02em" }}>
                New Project
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "#606060", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <label style={{
                display: "block", color: "#505050", fontSize: 11, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7,
              }}>
                Project Name
              </label>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { handleCreate(newName); setShowCreateModal(false); }
                  if (e.key === "Escape") setShowCreateModal(false);
                }}
                placeholder="Untitled Project"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 10, color: "#f0f0f0",
                  fontSize: 14, padding: "11px 14px",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(88,101,242,0.12)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                  color: "#d0d0d0", fontSize: 13, fontWeight: 600, padding: "11px",
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                Cancel
              </button>
              <button
                onClick={() => { handleCreate(newName); setShowCreateModal(false); }}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #5865F2, #7c3aed)",
                  border: "none", borderRadius: 10, color: "#fff",
                  fontSize: 13, fontWeight: 700, padding: "11px",
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(88,101,242,0.35)",
                  transition: "opacity 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
