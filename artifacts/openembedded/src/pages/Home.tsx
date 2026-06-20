import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  useCreateProject,
  useDeleteProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { Search, MoreVertical, Lock, Plus, User, X, ChevronRight, Trash2 } from "lucide-react";

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

const ProjectsTabIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

const CreateTabIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const MiniCanvasPreview = ({ nodeCount }: { nodeCount: number }) => (
  <div style={{
    width: "100%",
    height: "100%",
    background: "#141822",
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{
      position: "absolute",
      inset: 0,
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }} />

    <div style={{
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 68,
      background: "#20232D",
      borderRight: "1px solid #2A2F3A",
      padding: "8px 6px",
      display: "flex",
      flexDirection: "column",
      gap: 5,
    }}>
      {[
        { color: "#8b5cf6", label: "Container" },
        { color: "#10b981", label: "Section" },
        { color: "#3b82f6", label: "TextDisp" },
        { color: "#f59e0b", label: "Thumbnail" },
        { color: "#ec4899", label: "Gallery" },
        { color: "#14b8a6", label: "ActionRow" },
        { color: "#5865F2", label: "Button" },
      ].map((item) => (
        <div key={item.label} style={{
          height: 16,
          borderRadius: 3,
          background: item.color + "22",
          borderLeft: `2px solid ${item.color}`,
          paddingLeft: 3,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}>
          <span style={{ color: item.color, fontSize: 7, fontWeight: 600, whiteSpace: "nowrap" }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>

    <div style={{
      position: "absolute",
      left: 68,
      top: 0,
      bottom: 0,
      right: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {nodeCount > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {[
            { color: "#8b5cf6", w: 120, label: "Container" },
            { color: "#10b981", w: 100, label: "Section" },
            { color: "#3b82f6", w: 90, label: "Text Display" },
          ].slice(0, Math.min(nodeCount, 3)).map((n) => (
            <div key={n.label} style={{
              width: n.w,
              height: 28,
              borderRadius: 5,
              background: "#1A1C24",
              border: `1px solid ${n.color}33`,
              borderLeft: `3px solid ${n.color}`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 6,
              gap: 4,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: n.color }} />
              <span style={{ color: "#7d8590", fontSize: 8, fontWeight: 500 }}>{n.label}</span>
            </div>
          ))}
          {nodeCount > 3 && (
            <span style={{ color: "#484f58", fontSize: 9 }}>+{nodeCount - 3} more</span>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#20232D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 6px",
          }}>
            <Plus size={18} color="#484f58" />
          </div>
          <span style={{ color: "#484f58", fontSize: 11 }}>Empty canvas</span>
        </div>
      )}
    </div>
  </div>
);

interface ProjectCardProps {
  project: Project;
  nodeCount: number;
  isHighlighted: boolean;
  onOpen: () => void;
  showMenu: boolean;
  onMenuToggle: () => void;
  onDelete: () => void;
}

const ProjectCard = ({
  project, nodeCount, isHighlighted, onOpen, showMenu, onMenuToggle, onDelete,
}: ProjectCardProps) => (
  <div
    style={{
      borderRadius: 16,
      border: isHighlighted ? "2px solid #5865F2" : "1px solid #2A2F3A",
      overflow: "hidden",
      background: "#1A1C24",
      position: "relative",
      cursor: "pointer",
      transition: "border-color 0.15s",
    }}
    onClick={onOpen}
  >
    <div style={{ height: 210, position: "relative" }}>
      <MiniCanvasPreview nodeCount={nodeCount} />
    </div>

    <div style={{
      padding: "14px 16px 16px",
      borderTop: "1px solid #2A2F3A",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: "#ffffff", lineHeight: 1.2, flex: 1, paddingRight: 8 }}>
          {project.name}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#7d8590", padding: "2px 4px", flexShrink: 0, borderRadius: 4 }}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      <div style={{ color: "#7d8590", fontSize: 13, marginBottom: 14 }}>
        {timeAgo(project.updatedAt)}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#7d8590", fontSize: 13 }}>
          <Lock size={13} />
          <span>Private</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          style={{
            background: isHighlighted ? "#5865F2" : "rgba(255,255,255,0.07)",
            border: "none",
            borderRadius: 20,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            padding: "6px 18px",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          Open →
        </button>
      </div>
    </div>

    {showMenu && (
      <div
        style={{
          position: "absolute",
          top: 218,
          right: 12,
          background: "#20232D",
          border: "1px solid #2A2F3A",
          borderRadius: 10,
          overflow: "hidden",
          zIndex: 50,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          minWidth: 160,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            padding: "10px 14px",
            cursor: "pointer",
            color: "#e6edf3",
            fontSize: 13,
            fontWeight: 500,
            textAlign: "left",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          Open in Builder
        </button>
        <div style={{ height: 1, background: "#2A2F3A" }} />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            padding: "10px 14px",
            cursor: "pointer",
            color: "#f85149",
            fontSize: 13,
            fontWeight: 500,
            textAlign: "left",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    )}
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
        background: "#0F1117",
        color: "#e6edf3",
        fontFamily: `"gg sans","Noto Sans","Helvetica Neue",Arial,sans-serif`,
        display: "flex",
        flexDirection: "column",
        maxWidth: 520,
        margin: "0 auto",
        position: "relative",
      }}
      onClick={() => { setOpenMenuId(null); }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 20px 10px",
          position: "sticky",
          top: 0,
          background: "#0F1117",
          zIndex: 100,
        }}
      >
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>
          Projects
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "#7d8590", padding: 4, display: "flex" }}
            title="Search"
          >
            <Search size={22} color="#b1bac4" />
          </button>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#5865F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            N
          </div>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>

        {/* ── Your Recent Projects ───────────────────────────── */}
        <section style={{ padding: "10px 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#e6edf3" }}>Your Recent Projects</span>
            <ChevronRight size={18} color="#484f58" />
          </div>

          {isLoading ? (
            <div style={{
              height: 300,
              background: "#1A1C24",
              border: "1px solid #2A2F3A",
              borderRadius: 16,
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ) : sorted.length === 0 ? (
            <button
              onClick={openCreate}
              style={{
                width: "100%",
                height: 200,
                border: "2px dashed #2A2F3A",
                borderRadius: 16,
                background: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#484f58",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#5865F2";
                el.style.color = "#5865F2";
                el.style.background = "rgba(88,101,242,0.04)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#2A2F3A";
                el.style.color = "#484f58";
                el.style.background = "transparent";
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                border: "2px dashed currentColor",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Plus size={22} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Create your first project</span>
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {sorted.map((project, idx) => {
                const nodeCount = project.graph?.nodes?.length ?? 0;
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    nodeCount={nodeCount}
                    isHighlighted={idx === 0}
                    onOpen={() => navigate(`/builder/${project.id}`)}
                    showMenu={openMenuId === project.id}
                    onMenuToggle={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                    onDelete={() => setConfirmDeleteId(project.id)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <div style={{ height: 1, background: "#20232D", margin: "0 20px 24px" }} />

        {/* ── Your Published Projects ────────────────────────── */}
        <section style={{ padding: "0 20px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#e6edf3", marginBottom: 8, letterSpacing: "-0.01em" }}>
            Your Published Projects
          </h2>
          <p style={{ fontSize: 14, color: "#7d8590", lineHeight: 1.6, margin: 0 }}>
            When you publish a Project, it will show up here.
          </p>
        </section>
      </div>

      {/* ── Bottom Tab Bar ─────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 520,
          background: "#0F1117",
          borderTop: "1px solid #20232D",
          display: "flex",
          zIndex: 200,
        }}
      >
        {([
          { id: "projects", label: "Projects", icon: <ProjectsTabIcon /> },
          { id: "create", label: "Create", icon: <CreateTabIcon /> },
          { id: "account", label: "Account", icon: <User size={26} /> },
        ] as const).map((tab) => {
          const isActive = tab.id === "projects";
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "create") openCreate();
              }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "10px 0 14px",
                background: "none",
                border: "none",
                borderTop: isActive ? "2px solid #ffffff" : "2px solid transparent",
                cursor: "pointer",
                color: isActive ? "#ffffff" : "#484f58",
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                transition: "color 0.15s",
                marginTop: -1,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Delete Confirmation Modal ───────────────────────────── */}
      {confirmDeleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 999,
            padding: "0 0 20px",
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              background: "#20232D",
              border: "1px solid #2A2F3A",
              borderRadius: 20,
              padding: "24px 20px",
              width: "100%",
              maxWidth: 520,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#e6edf3", margin: 0 }}>
              Delete "{projects.find((p) => p.id === confirmDeleteId)?.name}"?
            </h3>
            <p style={{ color: "#7d8590", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              This will permanently delete the project and all its nodes. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#e6edf3",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                style={{
                  flex: 1,
                  background: "rgba(248,81,73,0.15)",
                  border: "1px solid rgba(248,81,73,0.3)",
                  borderRadius: 12,
                  color: "#f85149",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "12px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Project Modal ────────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 999,
            padding: "0 0 20px",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: "#20232D",
              border: "1px solid #2A2F3A",
              borderRadius: 20,
              padding: "24px 20px",
              width: "100%",
              maxWidth: 520,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                New Project
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "#7d8590", cursor: "pointer", padding: 4, display: "flex" }}
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: "#7d8590",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
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
                  if (e.key === "Enter" && !createProject.isPending) {
                    handleCreate(newName);
                    setShowCreateModal(false);
                    setNewName("");
                  }
                  if (e.key === "Escape") setShowCreateModal(false);
                }}
                placeholder="My awesome bot message"
                style={{
                  width: "100%",
                  background: "#1A1C24",
                  border: "1px solid #2A2F3A",
                  borderRadius: 12,
                  color: "#e6edf3",
                  fontSize: 15,
                  padding: "13px 14px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2A2F3A"; }}
              />
            </div>

            <button
              onClick={() => {
                if (!createProject.isPending) {
                  handleCreate(newName);
                  setShowCreateModal(false);
                  setNewName("");
                }
              }}
              disabled={createProject.isPending}
              style={{
                background: "#5865F2",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                padding: "14px",
                cursor: createProject.isPending ? "not-allowed" : "pointer",
                width: "100%",
                opacity: createProject.isPending ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => { if (!createProject.isPending) (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              {createProject.isPending ? "Creating…" : "Create Project"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
