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
  Plus, Trash2, Clock, Layers, ChevronRight,
  Zap, Code2, Webhook, Eye, X,
} from "lucide-react";

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

const FEATURES = [
  {
    icon: <Layers size={20} />,
    title: "Visual Node Graph",
    desc: "Drag and drop Discord components onto a canvas and wire them together.",
  },
  {
    icon: <Eye size={20} />,
    title: "Live Preview",
    desc: "See a pixel-perfect Discord preview update in real time as you build.",
  },
  {
    icon: <Code2 size={20} />,
    title: "Code Export",
    desc: "Generate ready-to-use discord.js v14 builder code in one click.",
  },
  {
    icon: <Webhook size={20} />,
    title: "Instant Webhook",
    desc: "Send your message directly to any Discord channel via webhook URL.",
  },
];

export function Home() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: rawProjects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);

  const projects = (rawProjects as Project[] | undefined) ?? [];

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
          setDeletingId(null);
        },
      }
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F1117",
        color: "#e6edf3",
        fontFamily: `"gg sans","Noto Sans","Helvetica Neue",Arial,sans-serif`,
      }}
    >
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          background: "#20232D",
          borderBottom: "1px solid #2A2F3A",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#FF3C00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.05em",
              flexShrink: 0,
            }}
          >
            O
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#e6edf3",
              letterSpacing: "-0.02em",
            }}
          >
            OpenEmbedded
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowNameModal(true)}
          disabled={createProject.isPending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#FF3C00",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 16px",
            cursor: "pointer",
            transition: "opacity 0.15s",
            opacity: createProject.isPending ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          <Plus size={14} />
          New Project
        </button>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: "64px 32px 48px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,60,0,0.1)",
            border: "1px solid rgba(255,60,0,0.25)",
            borderRadius: 20,
            padding: "4px 12px",
            marginBottom: 20,
          }}
        >
          <Zap size={12} color="#FF3C00" />
          <span style={{ color: "#FF3C00", fontSize: 12, fontWeight: 600 }}>
            Discord Components V2 + V1 Embeds
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 16,
            background: "linear-gradient(135deg, #ffffff 0%, #a0a8c0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Build Discord messages<br />
          <span
            style={{
              background: "linear-gradient(135deg, #FF3C00 0%, #ff7043 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            visually.
          </span>
        </h1>

        <p
          style={{
            fontSize: 17,
            color: "#7d8590",
            lineHeight: 1.6,
            maxWidth: 540,
            marginBottom: 36,
          }}
        >
          A node-graph builder for crafting Discord embeds and Components V2
          messages — with live preview, code export, and direct webhook delivery.
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 0 }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#20232D",
                border: "1px solid #2A2F3A",
                borderRadius: 8,
                padding: "8px 14px",
              }}
            >
              <span style={{ color: "#FF3C00", display: "flex" }}>{f.icon}</span>
              <div>
                <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
                  {f.title}
                </div>
                <div style={{ color: "#7d8590", fontSize: 11, marginTop: 1 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #2A2F3A" }} />

      {/* ── Projects ───────────────────────────────────────────── */}
      <div
        style={{
          padding: "40px 32px 80px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#e6edf3",
                letterSpacing: "-0.01em",
                marginBottom: 2,
              }}
            >
              Your Projects
            </h2>
            <p style={{ color: "#7d8590", fontSize: 13 }}>
              {isLoading
                ? "Loading…"
                : projects.length === 0
                ? "No projects yet — create your first one"
                : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 160,
                  background: "#20232D",
                  border: "1px solid #2A2F3A",
                  borderRadius: 12,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {/* Create new card */}
            <button
              onClick={() => setShowNameModal(true)}
              disabled={createProject.isPending}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                height: 160,
                background: "transparent",
                border: "2px dashed #2A2F3A",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.15s",
                color: "#484f58",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#FF3C00";
                el.style.color = "#FF3C00";
                el.style.background = "rgba(255,60,0,0.04)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#2A2F3A";
                el.style.color = "#484f58";
                el.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: "2px dashed currentColor",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={20} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>New Project</span>
            </button>

            {/* Existing projects */}
            {[...projects].reverse().map((project) => {
              const nodeCount = project.graph?.nodes?.length ?? 0;
              const isDeletingThis = deletingId === project.id;
              return (
                <div
                  key={project.id}
                  style={{
                    position: "relative",
                    background: "#20232D",
                    border: "1px solid #2A2F3A",
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: 160,
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,60,0,0.35)";
                    el.style.boxShadow = "0 0 0 1px rgba(255,60,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "#2A2F3A";
                    el.style.boxShadow = "none";
                  }}
                  onClick={() => !isDeletingThis && navigate(`/builder/${project.id}`)}
                >
                  {/* Accent bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: "linear-gradient(90deg, #FF3C00, #5865F2)",
                      borderRadius: "12px 12px 0 0",
                    }}
                  />

                  {/* Confirm delete overlay */}
                  {isDeletingThis && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(15,17,23,0.95)",
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        zIndex: 10,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span style={{ color: "#f85149", fontSize: 13, fontWeight: 600 }}>
                        Delete "{project.name}"?
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleDelete(project.id)}
                          style={{
                            background: "rgba(248,81,73,0.15)",
                            border: "1px solid rgba(248,81,73,0.3)",
                            borderRadius: 6,
                            color: "#f85149",
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "5px 14px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            color: "#7d8590",
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "5px 14px",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#e6edf3",
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 180,
                        }}
                      >
                        {project.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          color: "#7d8590",
                          fontSize: 11,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Layers size={11} />
                          {nodeCount} node{nodeCount !== 1 ? "s" : ""}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={11} />
                          {timeAgo(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(project.id);
                      }}
                      title="Delete project"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#484f58",
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        transition: "color 0.12s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f85149"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#484f58"; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Open button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/builder/${project.id}`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 7,
                      color: "#e6edf3",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "7px 11px",
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "rgba(255,60,0,0.1)";
                      el.style.borderColor = "rgba(255,60,0,0.25)";
                      el.style.color = "#FF3C00";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "rgba(255,255,255,0.04)";
                      el.style.borderColor = "rgba(255,255,255,0.07)";
                      el.style.color = "#e6edf3";
                    }}
                  >
                    <span>Open in Builder</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Project Modal ────────────────────────────────── */}
      {showNameModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
          onClick={() => setShowNameModal(false)}
        >
          <div
            style={{
              background: "#20232D",
              border: "1px solid #2A2F3A",
              borderRadius: 14,
              padding: 28,
              width: "100%",
              maxWidth: 400,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#e6edf3" }}>
                New Project
              </h3>
              <button
                onClick={() => setShowNameModal(false)}
                style={{ background: "none", border: "none", color: "#7d8590", cursor: "pointer", padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: "#7d8590",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                Project Name
              </label>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShowNameModal(false);
                    handleCreate(newName);
                    setNewName("");
                  }
                  if (e.key === "Escape") setShowNameModal(false);
                }}
                placeholder="My awesome bot message"
                style={{
                  width: "100%",
                  background: "#1A1C24",
                  border: "1px solid #2A2F3A",
                  borderRadius: 8,
                  color: "#e6edf3",
                  fontSize: 14,
                  padding: "9px 12px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,60,0,0.5)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2A2F3A"; }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowNameModal(false)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "#7d8590",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNameModal(false);
                  handleCreate(newName);
                  setNewName("");
                }}
                disabled={createProject.isPending}
                style={{
                  background: "#FF3C00",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "8px 20px",
                  cursor: "pointer",
                  opacity: createProject.isPending ? 0.7 : 1,
                }}
              >
                {createProject.isPending ? "Creating…" : "Create →"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
