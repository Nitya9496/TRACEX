import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphEdge, GraphNode } from "../types";
import { ConfidenceBadge } from "./Ui";
import { useTheme } from "../context/ThemeContext";

const TYPE_COLOR: Record<string, string> = {
  Actor: "#2563eb", // Royal Blue
  Alias: "#0284c7", // Sky Blue
  Username: "#0284c7",
  PGP: "#d97706", // Amber
  Wallet: "#f59e0b", // Gold
  Email: "#6366f1", // Indigo
  Post: "#64748b", // Slate
  Platform: "#0891b2", // Cyan
  Infrastructure: "#7c3aed", // Purple
  OnionService: "#9333ea", // Deep Purple
  ClearnetDomain: "#0d9488", // Teal
  Evidence: "#059669", // Emerald
};

export function GraphCanvas({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selected, setSelected] = useState<GraphEdge | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const rfNodes: Node[] = useMemo(() => {
    const filtered = nodes.filter((n) => {
      const q = filter.toLowerCase();
      const match =
        !q ||
        n.id.toLowerCase().includes(q) ||
        n.label.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q);
      const t = typeFilter === "ALL" || n.type === typeFilter;
      return match && t;
    });

    return filtered.map((n, i) => {
      const accent = TYPE_COLOR[n.type] ?? "#3b82f6";
      return {
        id: n.id,
        data: { label: `${n.label}\n${n.type}` },
        position: { x: (i % 8) * 190, y: Math.floor(i / 8) * 115 },
        style: {
          background: isDark ? "#0f172a" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          border: `2px solid ${accent}`,
          borderRadius: 8,
          boxShadow: isDark
            ? "0 4px 12px rgba(0, 0, 0, 0.4)"
            : "0 2px 8px rgba(0, 0, 0, 0.08)",
          fontSize: 11,
          fontWeight: 500,
          width: 155,
          whiteSpace: "pre-wrap",
          padding: "8px 10px",
        },
      };
    });
  }, [nodes, filter, typeFilter, isDark]);

  const visible = new Set(rfNodes.map((n) => n.id));
  const rfEdges: Edge[] = edges
    .filter((e) => visible.has(e.source) && visible.has(e.target))
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.type,
      style: {
        stroke:
          e.confidence === "HIGH"
            ? "#2563eb"
            : e.confidence === "MEDIUM"
              ? "#f59e0b"
              : isDark
                ? "#475569"
                : "#94a3b8",
        strokeWidth: e.confidence === "HIGH" ? 2 : 1.5,
      },
      data: e,
    }));

  const onEdgeClick: EdgeMouseHandler = (_e, edge) => {
    setSelected((edge.data as GraphEdge) ?? null);
  };

  const types = ["ALL", ...Array.from(new Set(nodes.map((n) => n.type)))];

  return (
    <div className="grid grid-cols-[1fr_290px] gap-4 h-[650px]">
      {/* Graph Area */}
      <div className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#090d16] rounded-lg relative overflow-hidden shadow-sm">
        <div className="absolute z-10 top-3 left-3 flex gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter nodes..."
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-1.5 rounded-md text-slate-800 dark:text-slate-100 shadow-sm outline-none focus:border-blue-500 w-44"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-1.5 rounded-md text-slate-800 dark:text-slate-100 shadow-sm outline-none focus:border-blue-500"
          >
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onEdgeClick={onEdgeClick}
          fitView
          minZoom={0.2}
          maxZoom={1.6}
        >
          <Background
            color={isDark ? "#1e293b" : "#e2e8f0"}
            gap={20}
            size={1.5}
          />
          <Controls className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-md" />
          <MiniMap
            nodeColor={isDark ? "#334155" : "#94a3b8"}
            maskColor={isDark ? "rgba(9, 13, 22, 0.75)" : "rgba(248, 250, 252, 0.75)"}
            className="border border-slate-200 dark:border-slate-700 rounded shadow-md"
          />
        </ReactFlow>
      </div>

      {/* Inspector Aside */}
      <aside className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d121f] rounded-lg p-4 text-xs overflow-auto shadow-sm">
        <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          Relationship Inspector
        </div>
        {selected ? (
          <div className="space-y-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Relationship</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{selected.type}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Evidence Reference</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {selected.evidence ?? "n/a"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Origin Source</span>
              <span className="text-slate-800 dark:text-slate-200">{selected.origin ?? "n/a"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Timestamp</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{selected.timestamp ?? "n/a"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Explanation</span>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                {selected.explanation}
              </p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Confidence Level</span>
              <ConfidenceBadge value={selected.confidence} />
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500">
            <p className="leading-relaxed">
              Click on any relationship line (edge) in the graph to inspect evidence, origin, explanation, and confidence.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
