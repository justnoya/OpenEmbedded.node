import { useEffect, useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { nodeTypes } from "@/canvas/nodeTypes";
import { NodeLibraryPanel } from "@/panels/NodeLibraryPanel";
import { PropertiesPanel } from "@/panels/PropertiesPanel";
import { DiscordPreview } from "@/preview/DiscordPreview";
import { ExportPanel } from "@/panels/ExportPanel";
import {
  useListProjects,
  useCreateProject,
  useUpdateProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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

export function Builder() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setGraph = useGraphStore((s) => s.setGraph);
  const clear = useGraphStore((s) => s.clear);
  const compile = usePreviewStore((s) => s.compile);

  const isMobile = useIsMobile();
  const [rightTab, setRightTab] = useState<RightTab>("properties");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");
  const [exportOpen, setExportOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [editingName, setEditingName] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { data: projects } = useListProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  useEffect(() => {
    compile(nodes, edges);
  }, [nodes, edges, compile]);

  useEffect(() => {
    if (currentProjectId) return;
    if (projects === undefined) return;
    const existing = (projects as { id: string; name: string; graph: { nodes: object[]; edges: object[] } }[])[0];
    if (existing) {
      setCurrentProjectId(existing.id);
      setProjectName(existing.name);
      if (existing.graph?.nodes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGraph(existing.graph.nodes as any, existing.graph.edges as any);
      }
    } else {
      createProject.mutate(
        { data: { name: "Untitled Project", graph: { nodes: [], edges: [] } } },
        {
          onSuccess: (p) => {
            const proj = p as { id: string; name: string };
            setCurrentProjectId(proj.id);
            setProjectName(proj.name);
            queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          },
        }
      );
    }
  }, [projects, currentProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    if (!currentProjectId) return;
    updateProject.mutate(
      {
        id: currentProjectId,
        data: {
          name: projectName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          graph: { nodes: nodes as any, edges: edges as any },
        },
      },
      {
        onSuccess: () => {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 1500);
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        },
      }
    );
  }, [currentProjectId, projectName, nodes, edges, updateProject, queryClient]);

  const handleNewProject = () => {
    const name = "Untitled Project";
    createProject.mutate(
      { data: { name, graph: { nodes: [] as Record<string, unknown>[], edges: [] as Record<string, unknown>[] } } },
      {
        onSuccess: (p) => {
          const proj = p as { id: string; name: string };
          setCurrentProjectId(proj.id);
          setProjectName(proj.name);
          clear();
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        },
      }
    );
  };

  const handleLoadProject = (proj: { id: string; name: string; graph: { nodes: object[]; edges: object[] } }) => {
    setCurrentProjectId(proj.id);
    setProjectName(proj.name);
    if (proj.graph?.nodes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setGraph(proj.graph.nodes as any, proj.graph.edges as any);
    } else {
      clear();
    }
    setShowProjectList(false);
  };

  const btn = (active: boolean, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      style={{
        background: active ? "#5865F2" : "#36393E",
        border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        color: active ? "#fff" : "#B5BAC1",
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        padding: "5px 10px",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  const tabBtn = (tab: RightTab, label: string) => (
    <button
      onClick={() => setRightTab(tab)}
      style={{
        flex: 1,
        padding: "6px 0",
        background: rightTab === tab ? "#424549" : "transparent",
        border: "none",
        borderRadius: 4,
        color: rightTab === tab ? "#F2F3F5" : "#B5BAC1",
        fontSize: 12,
        fontWeight: rightTab === tab ? 600 : 400,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  /* ── TOOLBAR ── */
  const toolbar = (
    <div
      style={{
        height: isMobile ? 52 : 48,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        background: "#1E2124",
        borderBottom: "1px solid rgba(255,255,255,0.063)",
        gap: 8,
        zIndex: 10,
        overflowX: "auto",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6, background: "#5865F2",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 12, fontWeight: 700,
        }}>OE</div>
        {!isMobile && <span style={{ color: "#F2F3F5", fontSize: 14, fontWeight: 700 }}>OpenEmbedded</span>}
      </div>

      {!isMobile && <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />}

      {/* Project name */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {editingName ? (
          <input
            ref={nameInputRef}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
            autoFocus
            style={{
              background: "#282B30", border: "1px solid #5865F2", borderRadius: 4,
              color: "#F2F3F5", fontSize: 13, padding: "3px 8px",
              minWidth: isMobile ? 100 : 140, maxWidth: isMobile ? 120 : 200,
            }}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            style={{
              background: "transparent", border: "1px solid transparent", borderRadius: 4,
              color: "#F2F3F5", fontSize: isMobile ? 12 : 13, padding: "3px 8px",
              cursor: "text", maxWidth: isMobile ? 120 : 200,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {projectName}
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Projects */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setShowProjectList(!showProjectList)}
          style={{
            background: "#36393E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
            color: "#B5BAC1", fontSize: 12, padding: "5px 10px", cursor: "pointer",
          }}
        >
          {isMobile ? `📁 ${(projects as object[] | undefined)?.length ?? 0}` : `Projects (${(projects as object[] | undefined)?.length ?? 0})`}
        </button>
        {showProjectList && (
          <div style={{
            position: "absolute", top: 36, right: 0,
            background: "#282B30", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: 8, minWidth: 180, zIndex: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            {((projects as { id: string; name: string; graph: { nodes: object[]; edges: object[] } }[]) ?? []).map((p) => (
              <button key={p.id} onClick={() => handleLoadProject(p)} style={{
                display: "block", width: "100%", textAlign: "left",
                background: p.id === currentProjectId ? "#36393E" : "transparent",
                border: "none", borderRadius: 4,
                color: p.id === currentProjectId ? "#F2F3F5" : "#B5BAC1",
                fontSize: 12, padding: "6px 10px", cursor: "pointer",
              }}>{p.name}</button>
            ))}
            {(!projects || (projects as object[]).length === 0) && (
              <div style={{ color: "#949B9D", fontSize: 12, padding: "6px 10px" }}>No projects</div>
            )}
          </div>
        )}
      </div>

      <button onClick={handleNewProject} style={{
        background: "#36393E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
        color: "#B5BAC1", fontSize: 12, padding: "5px 10px", cursor: "pointer", flexShrink: 0,
      }}>{isMobile ? "+" : "New"}</button>

      <button
        onClick={handleSave}
        disabled={updateProject.isPending || !currentProjectId}
        style={{
          background: savedFlash ? "#57F287" : "#5865F2", border: "none", borderRadius: 6,
          color: savedFlash ? "#000" : "#fff", fontSize: 12, fontWeight: 600,
          padding: "5px 12px", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
        }}
      >{savedFlash ? "✓" : isMobile ? "💾" : updateProject.isPending ? "Saving..." : "Save"}</button>

      <button
        onClick={() => setExportOpen(!exportOpen)}
        style={{
          background: exportOpen ? "#4752C4" : "#424549",
          border: "1px solid rgba(88,101,242,0.4)", borderRadius: 6,
          color: "#F2F3F5", fontSize: 12, padding: "5px 12px", cursor: "pointer", flexShrink: 0,
        }}
      >{isMobile ? "⬆" : "Export"}</button>
    </div>
  );

  /* ── MOBILE BOTTOM NAV ── */
  const mobileNav = isMobile && (
    <div style={{
      height: 52, flexShrink: 0, display: "flex", alignItems: "stretch",
      background: "#1E2124", borderTop: "1px solid rgba(255,255,255,0.063)",
      zIndex: 10,
    }}>
      {(["library", "canvas", "properties", "preview"] as MobilePanel[]).map((panel) => {
        const labels: Record<MobilePanel, string> = { library: "Nodes", canvas: "Canvas", properties: "Props", preview: "Preview" };
        const icons: Record<MobilePanel, string> = { library: "⊞", canvas: "◈", properties: "⚙", preview: "👁" };
        const active = mobilePanel === panel;
        return (
          <button key={panel} onClick={() => setMobilePanel(panel)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 2, background: "transparent",
            border: "none", borderTop: active ? "2px solid #5865F2" : "2px solid transparent",
            color: active ? "#5865F2" : "#B5BAC1", cursor: "pointer",
            fontSize: 10, padding: "6px 0",
          }}>
            <span style={{ fontSize: 16 }}>{icons[panel]}</span>
            {labels[panel]}
          </button>
        );
      })}
    </div>
  );

  /* ── CANVAS ── */
  const canvas = (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => setSelectedNode(null)}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: "#282B30" }}
        defaultEdgeOptions={{ style: { stroke: "#5865F2", strokeWidth: 2 } }}
      >
        <Background variant={BackgroundVariant.Dots} color="#5865F215" gap={20} size={1} />
        <Controls style={{ background: "#36393E", border: "1px solid rgba(255,255,255,0.063)", borderRadius: 8 }} />
        {!isMobile && (
          <MiniMap nodeColor="#5865F240" style={{ background: "#1E2124", border: "1px solid rgba(255,255,255,0.063)", borderRadius: 8 }} />
        )}
        <Panel position="top-center">
          <div style={{ color: "#949B9D", fontSize: 11, background: "rgba(30,33,36,0.8)", padding: "3px 10px", borderRadius: 4 }}>
            {nodes.length === 0 ? "Click a node type to add it to the canvas" : `${nodes.length} node${nodes.length !== 1 ? "s" : ""} · ${edges.length} edge${edges.length !== 1 ? "s" : ""}`}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );

  /* ── RIGHT PANEL ── */
  const rightPanel = (
    <div style={{
      width: isMobile ? "100%" : 300,
      flexShrink: 0,
      background: "#1E2124",
      borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.063)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      flex: isMobile ? 1 : undefined,
    }}>
      <div style={{
        display: "flex", padding: "8px 8px 0", gap: 4,
        background: "#1E2124", borderBottom: "1px solid rgba(255,255,255,0.063)",
      }}>
        {tabBtn("properties", "Properties")}
        {tabBtn("preview", "Preview")}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {rightTab === "properties" ? <PropertiesPanel /> : <DiscordPreview />}
      </div>
    </div>
  );

  /* ── EXPORT DRAWER ── */
  const exportDrawer = exportOpen && (
    <div style={{ height: isMobile ? 240 : 280, flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.063)" }}>
      <ExportPanel />
    </div>
  );

  /* ── DESKTOP LAYOUT ── */
  if (!isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#1E2124", overflow: "hidden" }}>
        {toolbar}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <NodeLibraryPanel />
          {canvas}
          {rightPanel}
        </div>
        {exportDrawer}
      </div>
    );
  }

  /* ── MOBILE LAYOUT ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#1E2124", overflow: "hidden" }}>
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
            <div style={{
              display: "flex", padding: "8px 8px 0", gap: 4,
              background: "#1E2124", borderBottom: "1px solid rgba(255,255,255,0.063)",
            }}>
              <button onClick={() => { setMobilePanel("properties"); setRightTab("properties"); }} style={{
                flex: 1, padding: "6px 0",
                background: mobilePanel === "properties" ? "#424549" : "transparent",
                border: "none", borderRadius: 4,
                color: mobilePanel === "properties" ? "#F2F3F5" : "#B5BAC1",
                fontSize: 12, fontWeight: mobilePanel === "properties" ? 600 : 400, cursor: "pointer",
              }}>Properties</button>
              <button onClick={() => { setMobilePanel("preview"); setRightTab("preview"); }} style={{
                flex: 1, padding: "6px 0",
                background: mobilePanel === "preview" ? "#424549" : "transparent",
                border: "none", borderRadius: 4,
                color: mobilePanel === "preview" ? "#F2F3F5" : "#B5BAC1",
                fontSize: 12, fontWeight: mobilePanel === "preview" ? 600 : 400, cursor: "pointer",
              }}>Preview</button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {mobilePanel === "properties" ? <PropertiesPanel /> : <DiscordPreview />}
            </div>
          </div>
        )}
      </div>
      {exportDrawer}
      {mobileNav}
    </div>
  );
}
