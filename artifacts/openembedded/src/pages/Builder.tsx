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

  const [rightTab, setRightTab] = useState<RightTab>("properties");
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

  // Recompile whenever nodes/edges change
  useEffect(() => {
    compile(nodes, edges);
  }, [nodes, edges, compile]);

  // On first load: load or create default project
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

  const tabBtn = (tab: RightTab, label: string) => (
    <button
      data-testid={`right-tab-${tab}`}
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1E2124", overflow: "hidden" }}>
      {/* Toolbar */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          background: "#1E2124",
          borderBottom: "1px solid rgba(255,255,255,0.063)",
          gap: 12,
          zIndex: 10,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "#5865F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            OE
          </div>
          <span style={{ color: "#F2F3F5", fontSize: 14, fontWeight: 700 }}>OpenEmbedded</span>
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

        {/* Project Name */}
        <div style={{ position: "relative" }}>
          {editingName ? (
            <input
              ref={nameInputRef}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
              autoFocus
              data-testid="project-name-input"
              style={{
                background: "#282B30",
                border: "1px solid #5865F2",
                borderRadius: 4,
                color: "#F2F3F5",
                fontSize: 13,
                padding: "3px 8px",
                minWidth: 160,
              }}
            />
          ) : (
            <button
              data-testid="project-name"
              onClick={() => setEditingName(true)}
              style={{
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: 4,
                color: "#F2F3F5",
                fontSize: 13,
                padding: "3px 8px",
                cursor: "text",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
              }}
            >
              {projectName}
            </button>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Projects list button */}
        <div style={{ position: "relative" }}>
          <button
            data-testid="projects-list"
            onClick={() => setShowProjectList(!showProjectList)}
            style={{
              background: "#36393E",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "#B5BAC1",
              fontSize: 12,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            Projects ({(projects as object[] | undefined)?.length ?? 0})
          </button>
          {showProjectList && (
            <div
              style={{
                position: "absolute",
                top: 36,
                right: 0,
                background: "#282B30",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: 8,
                minWidth: 200,
                zIndex: 100,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              {((projects as { id: string; name: string; graph: { nodes: object[]; edges: object[] } }[]) ?? []).map((p) => (
                <button
                  key={p.id}
                  data-testid={`load-project-${p.id}`}
                  onClick={() => handleLoadProject(p)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: p.id === currentProjectId ? "#36393E" : "transparent",
                    border: "none",
                    borderRadius: 4,
                    color: p.id === currentProjectId ? "#F2F3F5" : "#B5BAC1",
                    fontSize: 12,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  {p.name}
                </button>
              ))}
              {(!projects || (projects as object[]).length === 0) && (
                <div style={{ color: "#949B9D", fontSize: 12, padding: "6px 10px" }}>No projects</div>
              )}
            </div>
          )}
        </div>

        <button
          data-testid="new-project"
          onClick={handleNewProject}
          style={{
            background: "#36393E",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#B5BAC1",
            fontSize: 12,
            padding: "5px 12px",
            cursor: "pointer",
          }}
        >
          New
        </button>

        <button
          data-testid="save-project"
          onClick={handleSave}
          disabled={updateProject.isPending || !currentProjectId}
          style={{
            background: savedFlash ? "#57F287" : "#5865F2",
            border: "none",
            borderRadius: 6,
            color: savedFlash ? "#000" : "#fff",
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 14px",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {savedFlash ? "Saved!" : updateProject.isPending ? "Saving..." : "Save"}
        </button>

        <button
          data-testid="export-toggle"
          onClick={() => setExportOpen(!exportOpen)}
          style={{
            background: exportOpen ? "#4752C4" : "#424549",
            border: "1px solid rgba(88,101,242,0.4)",
            borderRadius: 6,
            color: "#F2F3F5",
            fontSize: 12,
            padding: "5px 14px",
            cursor: "pointer",
          }}
        >
          Export
        </button>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left panel */}
        <NodeLibraryPanel />

        {/* Center canvas */}
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
            defaultEdgeOptions={{
              style: { stroke: "#5865F2", strokeWidth: 2 },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#5865F215"
              gap={20}
              size={1}
            />
            <Controls
              style={{
                background: "#36393E",
                border: "1px solid rgba(255,255,255,0.063)",
                borderRadius: 8,
              }}
            />
            <MiniMap
              nodeColor="#5865F240"
              style={{
                background: "#1E2124",
                border: "1px solid rgba(255,255,255,0.063)",
                borderRadius: 8,
              }}
            />
            <Panel position="top-center">
              <div style={{ color: "#949B9D", fontSize: 11, background: "rgba(30,33,36,0.8)", padding: "3px 10px", borderRadius: 4 }}>
                {nodes.length === 0 ? "Click a node type to add it to the canvas" : `${nodes.length} node${nodes.length !== 1 ? "s" : ""} · ${edges.length} edge${edges.length !== 1 ? "s" : ""}`}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right panel: Properties / Preview toggle */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            background: "#1E2124",
            borderLeft: "1px solid rgba(255,255,255,0.063)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Tab header */}
          <div
            style={{
              display: "flex",
              padding: "8px 8px 0",
              gap: 4,
              background: "#1E2124",
              borderBottom: "1px solid rgba(255,255,255,0.063)",
            }}
          >
            {tabBtn("properties", "Properties")}
            {tabBtn("preview", "Preview")}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {rightTab === "properties" ? (
              <PropertiesPanel />
            ) : (
              <DiscordPreview />
            )}
          </div>
        </div>
      </div>

      {/* Bottom export drawer */}
      {exportOpen && (
        <div
          style={{
            height: 280,
            flexShrink: 0,
            borderTop: "1px solid rgba(255,255,255,0.063)",
          }}
        >
          <ExportPanel />
        </div>
      )}
    </div>
  );
}
