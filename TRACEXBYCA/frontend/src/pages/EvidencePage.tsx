import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { EvidenceCard } from "../components/EvidenceCard";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";
import type { EvidenceItem } from "../types";

type ActorList = {
  items: Array<{ id: string; display_name: string }>;
};

export default function EvidencePage() {
  const [selectedActor, setSelectedActor] = useState("ACT-001");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: actorList } = useApi<ActorList>("/actors?page=1&page_size=100");
  const { data: evidence, error, loading } = useApi<EvidenceItem[]>(
    selectedActor ? `/evidence/${selectedActor}` : null
  );

  const filtered = (evidence ?? []).filter((item) => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesQuery =
      !q ||
      item.id?.toLowerCase().includes(q) ||
      item.evidence_type?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.source?.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg">Evidentiary Chain & Findings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured intelligence artifacts, raw observation logs, cryptographic bindings, and verification states.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedActor}
            onChange={(e) => setSelectedActor(e.target.value)}
            className="bg-ink-800 border border-white/10 px-2 py-1.5 text-xs outline-none text-cyan-intel font-mono"
          >
            {actorList?.items?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.display_name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-ink-800 border border-white/10 px-2 py-1.5 text-xs outline-none text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="supporting">Supporting</option>
            <option value="contradicting">Contradicting</option>
          </select>
          <input
            type="text"
            placeholder="Search evidence text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-ink-800 border border-white/10 px-3 py-1.5 text-xs outline-none placeholder:text-slate-500 focus:border-cyan-intel/50 w-48"
          />
        </div>
      </div>

      <Panel title={`Evidence Records for ${selectedActor} (${filtered.length})`}>
        {loading && <Skeleton rows={8} />}
        {error && <ErrorState message={error} />}
        {!loading && filtered.length === 0 && (
          <EmptyState title="No evidence items found" body="Try changing the actor or status filter." />
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <EvidenceCard key={item.id} item={item} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

