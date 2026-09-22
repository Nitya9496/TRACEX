import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";
import type { InfraRecord } from "../types";

export default function InfrastructurePage() {
  const { data, error, loading } = useApi<InfraRecord[]>("/infrastructure");
  const [filter, setFilter] = useState("");

  const filtered = (data ?? []).filter((item) => {
    const q = filter.toLowerCase();
    return (
      !q ||
      item.id?.toLowerCase().includes(q) ||
      item.onion_address?.toLowerCase().includes(q) ||
      item.clearnet_domain?.toLowerCase().includes(q) ||
      item.ssl_cn?.toLowerCase().includes(q) ||
      item.server_banner?.toLowerCase().includes(q) ||
      item.actor_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Infrastructure Intelligence</h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
            Dark web hidden services, clearnet proxies, TLS certificates, and hosting misconfigurations.
          </p>
        </div>
        <input
          type="text"
          placeholder="Filter onion, domain, SSL..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none placeholder:text-slate-500 focus:border-blue-500 text-slate-950 dark:text-white w-64 shadow-sm"
        />
      </div>

      <Panel title={`Tracked Indicators (${filtered.length})`}>
        {loading ? <Skeleton rows={8} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && filtered.length === 0 ? (
          <EmptyState title="No infrastructure indicators match" body="Try adjusting the search query." />
        ) : null}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-4 rounded-xl flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{item.id}</span>
                  {item.actor_id ? (
                    <Link
                      to={`/actors/${item.actor_id}`}
                      className="font-mono text-xs font-bold text-slate-800 dark:text-slate-300 hover:text-blue-600"
                    >
                      {item.actor_id}
                    </Link>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold">Unattributed</span>
                  )}
                </div>

                <div className="mt-2 font-mono text-xs text-slate-950 dark:text-slate-100 break-all bg-slate-50/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                  {item.onion_address || "No onion address"}
                </div>

                <dl className="mt-3 text-xs space-y-1.5 font-mono">
                  {item.clearnet_domain && (
                    <div>
                      <dt className="text-[10px] text-slate-500 font-bold uppercase">Clearnet Domain</dt>
                      <dd className="text-slate-950 dark:text-emerald-400 font-bold">{item.clearnet_domain}</dd>
                    </div>
                  )}
                  {item.ssl_cn && (
                    <div>
                      <dt className="text-[10px] text-slate-500 font-bold uppercase">SSL Common Name</dt>
                      <dd className="text-slate-950 dark:text-slate-200 font-bold">{item.ssl_cn}</dd>
                    </div>
                  )}
                  {item.server_banner && (
                    <div>
                      <dt className="text-[10px] text-slate-500 font-bold uppercase">Server Banner</dt>
                      <dd className="text-slate-800 dark:text-slate-400 font-medium">{item.server_banner}</dd>
                    </div>
                  )}
                  {(item.misconfig || item.descriptor_anomaly) && (
                    <div className="pt-1 text-slate-950 dark:text-amber-300 font-bold text-xs">
                      ⚠ {item.misconfig || item.descriptor_anomaly}
                    </div>
                  )}
                </dl>
              </div>

              {item.evidence && item.evidence.length > 0 && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span className="text-slate-800 dark:text-slate-300 font-bold font-mono">Supporting Evidence:</span>{" "}
                  {item.evidence.length} record(s) linked
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

