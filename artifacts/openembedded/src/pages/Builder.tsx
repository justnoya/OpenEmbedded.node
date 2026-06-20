import { useEffect, useState, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { nodeTypes } from "@/canvas/nodeTypes";
import { isValidNodeConnection } from "@/lib/connectionRules";
import { NodeLibraryPanel } from "@/panels/NodeLibraryPanel";
import { PropertiesPanel } from "@/panels/PropertiesPanel";
import { DiscordPreview } from "@/preview/DiscordPreview";
import { ExportPanel } from "@/panels/ExportPanel";
import { DiscordActivityBadge } from "@/components/DiscordActivityBadge";
import { useRichPresence } from "@/lib/useRichPresence";
import { useDiscord } from "@/lib/discordContext";
import {
  useListProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Undo2, Redo2, Save, Upload, Plus, FolderOpen, ChevronDown,
  Eye, Settings2, Trash2, Loader2, Check, AlertCircle, LayoutGrid,
} from "lucide-react";

type RightTab = "properties" | "preview";
type MobilePanel = "library" | "canvas" | "properties" | "preview";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

type Project = {
  id: string;
  name: string;
  graph: { nodes: object[]; edges: object[] };
};

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export function Builder() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setGraph = useGraphStore((s) => s.setGraph);
  const clear = useGraphStore((s) => s.clear);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const canUndo = useGraphStore((s) => s.canUndo);
  const canRedo = useGraphStore((s) => s.canRedo);

  const compile = usePreviewStore((s) => s.compile);
  const previewPayload = usePreviewStore((s) => s.payload);

  const { isDiscord } = useDiscord();
  const [, builderParams] = useRoute("/builder/:id");
  const [, navigate] = useLocation();
  const routeProjectId = builderParams?.id ?? null;

  const isMobile = useIsMobile();
  const [rightTab, setRightTab] = useState<RightTab>("properties");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");
  const [exportOpen, setExportOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [editingName, setEditingName] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showProjectList, setShowProjectList] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const projectListRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { data: projects } = useListProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  useRichPresence({
    projectName,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    action: exportOpen ? "exporting" : rightTab === "preview" ? "previewing" : "designing",
  });

  useEffect(() => {
    compile(nodes, edges);
  }, [nodes, edges, compile]);

  useEffect(() => {
    if (projects === undefined) return;
    if (!routeProjectId) { navigate("/"); return; }
    if (currentProjectId === routeProjectId) return;
    const list = projects as Project[];
    const found = list.find((p) => p.id === routeProjectId);
    if (found) {
      clearTimeout(autoSaveTimer.current);
      setCurrentProjectId(found.id);
      setProjectName(found.name);
      if (found.graph?.nodes) setGraph(found.graph.nodes as never, found.graph.edges as never);
      else clear();
      setSaveStatus("saved");
      setDeleteConfirm(null);
      setHasLoaded(false);
      setTimeout(() => setHasLoaded(true), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, currentProjectId, routeProjectId]);

  const doSave = useCallback(
    (manual?: boolean) => {
      if (!currentProjectId) return;
      setSaveStatus("saving");
      updateProject.mutate(
        {
          id: currentProjectId,
          data: {
            name: projectName,
            graph: { nodes: nodes as never, edges: edges as never },
            payload: previewPayload as never,
          },
        },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            if (manual) {
              queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
            }
          },
          onError: () => setSaveStatus("error"),
        }
      );
    },
    [currentProjectId, projectName, nodes, edges, previewPayload, updateProject, queryClient]
  );

  useEffect(() => {
    if (!hasLoaded || !currentProjectId) return;
    setSaveStatus("unsaved");
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doSave(false), 2000);
    return () => clearTimeout(autoSaveTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, projectName]);

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;
      return isValidNodeConnection(sourceNode.type ?? "", targetNode.type ?? "");
    },
    [nodes]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "s") { e.preventDefault(); clearTimeout(autoSaveTimer.current); doSave(true); }
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doSave, undo, redo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showProjectList && projectListRef.current && !projectListRef.current.contains(e.target as Node)) {
        setShowProjectList(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [showProjectList]);

  const handleNewProject = () => {
    createProject.mutate(
      { data: { name: "Untitled Project", graph: { nodes: [], edges: [] } } },
      {
        onSuccess: (p: unknown) => {
          const proj = p as Project;
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setShowProjectList(false);
          setCurrentProjectId(proj.id);
          setProjectName(proj.name);
          clear();
          setSaveStatus("saved");
          setHasLoaded(false);
          setTimeout(() => setHasLoaded(true), 100);
          navigate(`/builder/${proj.id}`);
        },
      }
    );
  };

  const handleLoadProject = (p: Project) => {
    clearTimeout(autoSaveTimer.current);
    setShowProjectList(false);
    setDeleteConfirm(null);
    setCurrentProjectId(p.id);
    setProjectName(p.name);
    if (p.graph?.nodes) setGraph(p.graph.nodes as never, p.graph.edges as never);
    else clear();
    setSaveStatus("saved");
    setHasLoaded(false);
    setTimeout(() => setHasLoaded(true), 100);
    navigate(`/builder/${p.id}`);
  };

  const handleDeleteProject = (id: string) => {
    deleteProject.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          if (id === currentProjectId) {
            const remaining = ((projects as Project[]) ?? []).filter((p) => p.id !== id);
            if (remaining.length > 0) {
              handleLoadProject(remaining[0]);
            } else {
              handleNewProject();
            }
          }
          setDeleteConfirm(null);
        },
      }
    );
  };

  const SaveIndicator = () => {
    const configs = {
      saved:   { color: "#3fb950", icon: <Check size={11} />,    text: "Saved" },
      saving:  { color: "#d29922", icon: <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />, text: "Saving…" },
      unsaved: { color: "#7d8590", icon: null,                   text: "Unsaved" },
      error:   { color: "#f85149", icon: <AlertCircle size={11} />, text: "Error" },
    };
    const cfg = configs[saveStatus];
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: 5, color: cfg.color, fontSize: 11, fontWeight: 600 }}
        title={saveStatus === "saved" ? "Auto-saved · Ctrl+S to force save" : ""}
      >
        {cfg.icon}
        {cfg.text}
      </div>
    );
  };

  const projectList = (projects as Project[] | undefined) ?? [];

  const toolbar = (
    <div
      style={{
        height: 52,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        background: "#161820",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        gap: 0,
        zIndex: 20,
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      <button
        onClick={() => navigate("/")}
        title="Home"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          marginRight: 16,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 6px 2px 0",
          borderRadius: 6,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.72"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
      >
        <img
          src="/logo.png"
          alt="OpenEmbedded"
          style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, objectFit: "cover" }}
        />
        {!isMobile && (
          <span style={{ color: "#e6edf3", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
            OpenEmbedded
          </span>
        )}
      </button>

      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.07)", flexShrink: 0, marginRight: 16 }} />

      <div style={{ position: "relative", flexShrink: 0, marginRight: 8 }}>
        {editingName ? (
          <input
            ref={nameInputRef}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
            autoFocus
            style={{
              background: "#080A0F",
              border: "1px solid rgba(88,101,242,0.6)",
              borderRadius: 6,
              color: "#e6edf3",
              fontSize: 13,
              fontWeight: 600,
              padding: "4px 9px",
              minWidth: 120,
              maxWidth: isMobile ? 130 : 220,
              outline: "none",
            }}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            title="Click to rename"
            style={{
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: 6,
              color: "#e6edf3",
              fontSize: 13,
              fontWeight: 600,
              padding: "4px 9px",
              cursor: "text",
              maxWidth: isMobile ? 130 : 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {projectName}
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            onClick={undo}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6,
              color: canUndo() ? "#7d8590" : "#2d333b",
              cursor: canUndo() ? "pointer" : "not-allowed",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { if (canUndo()) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            title="Redo (Ctrl+Shift+Z)"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6,
              color: canRedo() ? "#7d8590" : "#2d333b",
              cursor: canRedo() ? "pointer" : "not-allowed",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { if (canRedo()) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Redo2 size={14} />
          </button>
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.07)" }} />

        <div style={{ position: "relative" }} ref={projectListRef}>
          <button
            onClick={() => setShowProjectList(!showProjectList)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: showProjectList ? "rgba(255,255,255,0.07)" : "transparent",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6,
              color: "#7d8590",
              fontSize: 12,
              fontWeight: 500,
              padding: "5px 10px",
              cursor: "pointer",
              transition: "all 0.12s",
              whiteSpace: "nowrap",
            }}
          >
            <FolderOpen size={13} />
            {!isMobile && `Projects (${projectList.length})`}
            <ChevronDown size={11} style={{ transform: showProjectList ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {showProjectList && (
            <div
              style={{
                position: "absolute",
                top: 40,
                right: 0,
                background: "#161820",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: 6,
                minWidth: 220,
                zIndex: 200,
                boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              }}
            >
              <div
                style={{
                  padding: "4px 8px 6px",
                  color: "#484f58",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Your Projects
              </div>
              {projectList.length === 0 ? (
                <div style={{ color: "#484f58", fontSize: 12, padding: "8px 10px" }}>No projects yet</div>
              ) : (
                projectList.map((p) => {
                  const isActive = p.id === currentProjectId;
                  const isConfirming = deleteConfirm === p.id;
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 6,
                        background: isActive ? "rgba(88,101,242,0.1)" : "transparent",
                        marginBottom: 2,
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => handleLoadProject(p)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          background: "transparent",
                          border: "none",
                          color: isActive ? "#818cf8" : "#b1bac4",
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 400,
                          padding: "7px 10px",
                          cursor: "pointer",
                          textAlign: "left",
                          overflow: "hidden",
                        }}
                      >
                        {isActive && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", flexShrink: 0 }} />}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </span>
                      </button>

                      {isConfirming ? (
                        <div style={{ display: "flex", gap: 3, paddingRight: 6 }}>
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            style={{
                              background: "rgba(248,81,73,0.15)",
                              border: "1px solid rgba(248,81,73,0.3)",
                              borderRadius: 4,
                              color: "#f85149",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 4,
                              color: "#7d8590",
                              fontSize: 10,
                              padding: "2px 7px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p.id); }}
                          title="Delete project"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#484f58",
                            padding: "7px 8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: 4,
                            transition: "color 0.12s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f85149"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#484f58"; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 4, paddingTop: 6 }}>
                <button
                  onClick={handleNewProject}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    borderRadius: 6,
                    color: "#5865F2",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Plus size={13} />
                  New Project
                </button>
              </div>
            </div>
          )}
        </div>

        <DiscordActivityBadge />

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.07)" }} />

        <SaveIndicator />

        <button
          onClick={() => { clearTimeout(autoSaveTimer.current); doSave(true); }}
          disabled={updateProject.isPending || !currentProjectId}
          title="Save (Ctrl+S)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "#5865F2",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            cursor: "pointer",
            opacity: updateProject.isPending ? 0.7 : 1,
            transition: "all 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#4752c4"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#5865F2"; }}
        >
          <Save size={13} />
          {!isMobile && "Save"}
        </button>

        <button
          onClick={() => setExportOpen(!exportOpen)}
          title="Export"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: exportOpen ? "rgba(88,101,242,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${exportOpen ? "rgba(88,101,242,0.4)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 6,
            color: exportOpen ? "#818cf8" : "#7d8590",
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            cursor: "pointer",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          <Upload size={13} />
          {!isMobile && "Export"}
        </button>
      </div>
    </div>
  );

  const mobileNav = isMobile && (
    <div
      style={{
        height: 56,
        flexShrink: 0,
        display: "flex",
        alignItems: "stretch",
        background: "#161820",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        zIndex: 10,
      }}
    >
      {(["library", "canvas", "properties", "preview"] as MobilePanel[]).map((panel) => {
        const meta = {
          library: { label: "Nodes", icon: <LayoutGrid size={18} /> },
          canvas: { label: "Canvas", icon: <Settings2 size={18} /> },
          properties: { label: "Props", icon: <Settings2 size={18} /> },
          preview: { label: "Preview", icon: <Eye size={18} /> },
        };
        const active = mobilePanel === panel;
        return (
          <button
            key={panel}
            onClick={() => setMobilePanel(panel)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: "transparent",
              border: "none",
              borderTop: active ? "2px solid #5865F2" : "2px solid transparent",
              color: active ? "#818cf8" : "#484f58",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              padding: "6px 0",
              transition: "all 0.12s",
            }}
          >
            {meta[panel].icon}
            {meta[panel].label}
          </button>
        );
      })}
    </div>
  );

  const canvas = (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={() => setSelectedNode(null)}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: "#080A0F" }}
        defaultEdgeOptions={{
          style: { stroke: "#5865F2", strokeWidth: 2, strokeDasharray: undefined },
          animated: false,
        }}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="rgba(255,255,255,0.06)"
          gap={22}
          size={1.2}
        />
        <Controls
          style={{
            background: "#161820",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        />
        {!isMobile && (
          <MiniMap
            nodeColor={(node) => {
              const colorMap: Record<number, string> = {
                17: "#8b5cf6", 9: "#10b981", 10: "#3b82f6",
                11: "#f59e0b", 12: "#ec4899", 14: "#6b7280",
                1: "#14b8a6", 2: "#5865F2", 0: "#f59e0b",
              };
              return colorMap[(node.data as { componentType?: number })?.componentType ?? -1] ?? "#5865F2";
            }}
            bgColor="#161820"
            maskColor="rgba(8,10,15,0.6)"
            style={{
              background: "#161820",
              border: "1px solid #2A2D3E",
              borderRadius: 8,
            }}
          />
        )}
        <Panel position="top-center">
          <div
            style={{
              color: "#484f58",
              fontSize: 11,
              background: "rgba(14,17,23,0.85)",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "3px 12px",
              borderRadius: 20,
              backdropFilter: "blur(8px)",
              fontWeight: 500,
            }}
          >
            {nodes.length === 0
              ? "← Click a component to add it to the canvas"
              : `${nodes.length} node${nodes.length !== 1 ? "s" : ""} · ${edges.length} edge${edges.length !== 1 ? "s" : ""}`}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );

  const rightPanel = (
    <div
      style={{
        width: isMobile ? "100%" : 312,
        flexShrink: 0,
        background: "#161820",
        borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flex: isMobile ? 1 : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          padding: "6px 8px 0",
          gap: 2,
          background: "#161820",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {(["properties", "preview"] as RightTab[]).map((tab) => {
          const meta = { properties: { label: "Properties", icon: <Settings2 size={12} /> }, preview: { label: "Preview", icon: <Eye size={12} /> } };
          const active = rightTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setRightTab(tab)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "6px 0",
                background: active ? "rgba(88,101,242,0.1)" : "transparent",
                border: "none",
                borderRadius: 5,
                color: active ? "#818cf8" : "#7d8590",
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.12s",
                marginBottom: 4,
              }}
            >
              {meta[tab].icon}
              {meta[tab].label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {rightTab === "properties" ? <PropertiesPanel /> : <DiscordPreview />}
      </div>
    </div>
  );

  const exportDrawer = exportOpen && (
    <div
      style={{
        height: isMobile ? 260 : 280,
        flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <ExportPanel />
    </div>
  );

  if (!isMobile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          background: "#080A0F",
          overflow: "hidden",
        }}
      >
        {toolbar}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <NodeLibraryPanel />
          {canvas}
          {rightPanel}
        </div>
        {exportDrawer}
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .react-flow__controls {
            background: #161820 !important;
            border: 1px solid #2A2D3E !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
            overflow: hidden !important;
          }
          .react-flow__controls button {
            background: #161820 !important;
            border: none !important;
            border-bottom: 1px solid #2A2D3E !important;
            color: #7d8590 !important;
            fill: #7d8590 !important;
          }
          .react-flow__controls button:last-child { border-bottom: none !important; }
          .react-flow__controls button:hover { background: #1C1F2E !important; }
          .react-flow__controls-button svg { fill: #7d8590 !important; }
          .react-flow__minimap {
            background: #161820 !important;
            border: 1px solid #2A2D3E !important;
            border-radius: 8px !important;
            overflow: hidden !important;
          }
          .react-flow__minimap-svg { background: #161820 !important; }
          .react-flow__edge-path { stroke-width: 2px; }
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "#080A0F",
        overflow: "hidden",
      }}
    >
      {toolbar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {mobilePanel === "library" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <NodeLibraryPanel />
          </div>
        )}
        {mobilePanel === "canvas" && canvas}
        {(mobilePanel === "properties" || mobilePanel === "preview") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                padding: "6px 8px 0",
                gap: 2,
                background: "#161820",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
              }}
            >
              {(["properties", "preview"] as RightTab[]).map((tab) => {
                const labels = { properties: "Properties", preview: "Preview" };
                const active = (mobilePanel === tab);
                return (
                  <button
                    key={tab}
                    onClick={() => setMobilePanel(tab as MobilePanel)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      background: active ? "rgba(88,101,242,0.1)" : "transparent",
                      border: "none",
                      borderRadius: 5,
                      color: active ? "#818cf8" : "#7d8590",
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      marginBottom: 4,
                    }}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {mobilePanel === "properties" ? <PropertiesPanel /> : <DiscordPreview />}
            </div>
          </div>
        )}
      </div>
      {exportDrawer}
      {mobileNav}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
