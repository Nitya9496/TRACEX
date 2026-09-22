import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { GraphCanvas } from "../components/GraphCanvas";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";
import type { GraphEdge, GraphNode } from "../types";

type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  backend?: string;
  error?: string;
};

type ActorList = {
  items: Array<{ id: string; display_name: string }>;
};

export default function GraphPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialActor = searchParams.get("actor") || "ACT-001";
  const [selectedActor, setSelectedActor] = useState(initialActor);
  const toast = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: actorListData } = useApi<ActorList>("/actors?page=1&page_size=100");
  const { data: graphData, error, loading, reload } = useApi<GraphResponse>(
    selectedActor ? `/graph/${selectedActor}` : null
  );

  useEffect(() => {
    const param = searchParams.get("actor");
    if (param && param !== selectedActor) {
      setSelectedActor(param);
    }
  }, [searchParams]);

  function handleActorChange(newActor: string) {
    setSelectedActor(newActor);
    setSearchParams({ actor: newActor });
  }

  async function syncNeo4j() {
    setIsSyncing(true);
    try {
      const res = await api.post<{ status: string; reason?: string }>("/graph/sync");
      if (res.status === "ok") {
        toast("Graph synchronized with Neo4j database.");
      } else {
        toast(`Neo4j sync status: ${res.status} (${res.reason || "projection active"})`);
      }
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg">Entity Relationship Graph</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive multi-hop network linking actors, cryptographic keys, wallets, infrastructure, and evidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-mono">Center Actor:</label>
          <select
            value={selectedActor}
            onChange={(e) => handleActorChange(e.target.value)}
            className="bg-ink-800 border border-white/10 px-2 py-1 text-xs outline-none text-cyan-intel font-mono"
          >
            {actorListData?.items?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.display_name}
              </option>
            )) || <option value="ACT-001">ACT-001 — Nexus Cluster</option>}
          </select>
          <button
            onClick={syncNeo4j}
            disabled={isSyncing}
            className="border border-white/10 bg-white/5 hover:bg-white/10 text-xs px-2.5 py-1 text-slate-300 disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync Graph"}
          </button>
        </div>
      </div>

      <Panel
        title={`Graph View: ${selectedActor} (${graphData?.nodes?.length ?? 0} Nodes, ${graphData?.edges?.length ?? 0} Edges)`}
      >
        {loading ? <Skeleton rows={12} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && graphData && graphData.nodes.length === 0 ? (
          <EmptyState title="No graph nodes" body="No relationship entities found for this actor." />
        ) : null}
        {graphData && graphData.nodes.length > 0 ? (
          <GraphCanvas nodes={graphData.nodes} edges={graphData.edges} />
        ) : null}
      </Panel>
    </div>
  );
}

