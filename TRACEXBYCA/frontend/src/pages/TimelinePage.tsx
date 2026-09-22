import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";

type TimelineEventItem = {
  id: string;
  event_type: string;
  label: string;
  timestamp: string;
  related_entity_id?: string | null;
  actor_id?: string | null;
};

type ActorList = {
  items: Array<{ id: string; display_name: string }>;
};

export default function TimelinePage() {
  const [selectedActor, setSelectedActor] = useState("ACT-001");
  const [selectedType, setSelectedType] = useState("ALL");

  const { data: actorList } = useApi<ActorList>("/actors?page=1&page_size=100");
  const { data: events, error, loading } = useApi<TimelineEventItem[]>(
    selectedActor ? `/timeline/${selectedActor}` : null
  );

  const eventTypes = ["ALL", ...Array.from(new Set(events?.map((e) => e.event_type) || []))];

  const filtered = (events ?? []).filter((item) => {
    return selectedType === "ALL" || item.event_type === selectedType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Chronological Investigation Timeline</h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
            Temporal audit trail mapping persona creation, infrastructure activity, and observed actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">Actor:</label>
          <select
            value={selectedActor}
            onChange={(e) => setSelectedActor(e.target.value)}
            className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white shadow-sm font-mono"
          >
            {actorList?.items?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.display_name}
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white shadow-sm font-semibold"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "All Event Types" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Panel title={`Timeline Events for ${selectedActor} (${filtered.length})`}>
        {loading && <Skeleton rows={8} />}
        {error && <ErrorState message={error} />}
        {!loading && filtered.length === 0 && (
          <EmptyState title="No timeline events" body="No timeline records matched for this selection." />
        )}

        {filtered.length > 0 && (
          <ol className="relative border-l-2 border-blue-200 dark:border-blue-900 ml-4 my-2 space-y-3">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="ml-6 group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer relative"
              >
                <span className="absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-900 group-hover:bg-blue-600 transition-colors" />
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{item.timestamp}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-200 rounded font-bold self-start sm:self-auto">
                    {item.event_type}
                  </span>
                </div>
                <div className="mt-1 text-sm font-bold text-slate-950 dark:text-slate-100">{item.label}</div>
                {item.related_entity_id && (
                  <div className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">
                    Entity: {item.related_entity_id}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

