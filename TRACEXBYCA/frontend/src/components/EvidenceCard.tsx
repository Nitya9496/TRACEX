import { useState } from "react";
import type { EvidenceItem } from "../types";

export function EvidenceCard({ item, onView }: { item: EvidenceItem; onView?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d121f] rounded-xl p-4 text-xs shadow-sm flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
      <div>
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.id}</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[10px] ${item.status === "supporting"
                ? "bg-emerald-50 text-slate-950 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-800"
                : "bg-amber-50 text-slate-950 dark:text-amber-300 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-800"
              }`}
          >
            {item.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium text-[11px]">Type</span>
            <span className="text-slate-950 dark:text-slate-100 font-bold">{item.evidence_type}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium text-[11px]">Source</span>
            <span className="text-slate-950 dark:text-slate-200 font-medium">{item.source}</span>
          </div>
        </div>

        <div className="mt-2.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 block font-medium text-[11px]">Timestamp</span>
          <span className="font-mono text-slate-800 dark:text-slate-300 font-medium">{item.timestamp}</span>
        </div>

        <div className="mt-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px] mb-1">Finding</span>
          <p className="text-slate-950 dark:text-slate-200 leading-relaxed bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-2">
        <button
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded px-2.5 py-1 transition-colors"
          onClick={() => {
            setOpen((prev) => !prev);
            onView?.();
          }}
        >
          {open ? "Hide source record" : "View source record"}
        </button>
        {open ? (
          <pre className="mt-2.5 bg-slate-50 dark:bg-[#070a10] border border-slate-200 dark:border-slate-800 p-2.5 rounded overflow-auto text-[10px] text-slate-700 dark:text-slate-300 font-mono">
            {JSON.stringify(
              {
                source_record: item.source_record,
                related_entities: item.related_entities,
                actor_id: item.actor_id,
              },
              null,
              2,
            )}
          </pre>
        ) : null}
      </div>
    </article>
  );
}
