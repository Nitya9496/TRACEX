import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";
import type { Investigation } from "../types";

type FullReport = {
  title: string;
  investigation_id: string;
  date: string;
  executive_summary: string;
  actor_profile: {
    id: string;
    display_name?: string | null;
    categories?: string | null;
    first_observed?: string | null;
    last_observed?: string | null;
  };
  identifiers: {
    aliases: string[];
    pgp: string[];
    wallets: string[];
  };
  associated_platforms: string[];
  infrastructure_indicators: Array<{
    id: string;
    onion?: string | null;
    clearnet?: string | null;
    ssl_cn?: string | null;
    banner?: string | null;
  }>;
  relationship_graph_summary?: {
    stored_relationships: number;
    candidates: Array<{ actor: string; confidence: string; score: number }>;
  };
  evidence_table: Array<{
    id: string;
    type: string;
    source: string;
    status: string;
    timestamp: string;
    description: string;
  }>;
  disclaimer: string;
};

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [investigationId, setInvestigationId] = useState(
    searchParams.get("id") || "INV-DEMO-001"
  );
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: invList } = useApi<Investigation[]>("/investigations");
  const { data: report, error, loading } = useApi<FullReport>(
    investigationId ? `/reports/${investigationId}` : null
  );

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && idParam !== investigationId) {
      setInvestigationId(idParam);
    }
  }, [searchParams]);

  function handleSelect(id: string) {
    setInvestigationId(id);
    setSearchParams({ id });
  }

  async function handleExport(format: "pdf" | "csv" | "json") {
    if (!investigationId) return;
    setExporting(format);
    try {
      if (format === "json") {
        const res = await api.post<FullReport>("/reports/export", {
          investigation_id: investigationId,
          format: "json",
        });
        const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${investigationId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await api.download("/reports/export", { investigation_id: investigationId, format }, `${investigationId}.${format}`);
      }
      toast(`Exported report in ${format.toUpperCase()} format`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d121f] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Intelligence Dossier & Reports</h1>
          <p className="text-xs text-slate-800 dark:text-slate-300 font-medium mt-0.5">
            Actionable evidentiary dossier with cryptographic attribution corroboration and multi-format export.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={investigationId}
            onChange={(e) => handleSelect(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs rounded shadow-sm text-blue-600 dark:text-blue-400 font-mono font-bold outline-none"
          >
            {invList?.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.id} — {inv.name}
              </option>
            )) || <option value="INV-DEMO-001">INV-DEMO-001 — Nexus Rebrand</option>}
          </select>

          <button
            onClick={() => handleExport("pdf")}
            disabled={Boolean(exporting)}
            className="border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 text-xs rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            {exporting === "pdf" ? "Exporting..." : "Download PDF"}
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={Boolean(exporting)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold px-3 py-1.5 text-xs rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            {exporting === "csv" ? "Exporting..." : "CSV"}
          </button>
          <button
            onClick={() => handleExport("json")}
            disabled={Boolean(exporting)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold px-3 py-1.5 text-xs rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            {exporting === "json" ? "Exporting..." : "JSON"}
          </button>
        </div>
      </div>

      {loading && <Skeleton rows={10} />}
      {error && <ErrorState message={error} />}
      {!loading && !report && (
        <EmptyState title="Report not generated" body="Select an active investigation to compile its dossier." />
      )}

      {report && (
        <div className="space-y-5">
          <div className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/30 p-3.5 rounded-lg text-xs text-blue-950 dark:text-blue-200 font-mono font-bold shadow-sm flex items-start gap-2">
            <span className="text-blue-700 dark:text-blue-400">🛡 CLASSIFICATION:</span>
            <span>LAW ENFORCEMENT SENSITIVE // TLP:AMBER — Attribution models corroborate multi-factor forensic indicators across darknet forums and blockchain ledgers for operational disruption.</span>
          </div>

          <Panel title="Executive Summary">
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 mb-2">
              Investigation: {report.investigation_id} | Date: {report.date}
            </div>
            <p className="text-xs text-slate-950 dark:text-slate-100 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              {report.executive_summary}
            </p>
          </Panel>

          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="Subject Profile & Identifiers">
              <div className="text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-950 dark:text-slate-200 font-bold">Subject Actor</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {report.actor_profile.id} ({report.actor_profile.display_name})
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-950 dark:text-slate-200 font-bold block mb-1.5">Correlated Aliases:</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    {report.identifiers.aliases.map((a) => (
                      <span key={a} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 font-bold rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-slate-950 dark:text-slate-200 font-bold block mb-1.5">Observed PGP Keys:</span>
                  <ul className="font-mono text-xs space-y-1 text-blue-700 dark:text-blue-300 font-bold">
                    {report.identifiers.pgp.map((p) => (
                      <li key={p} className="break-all bg-slate-50 dark:bg-slate-900/40 p-1.5 border border-slate-200 dark:border-slate-800 rounded">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-1">
                  <span className="text-slate-950 dark:text-slate-200 font-bold block mb-1.5">Cryptocurrency Wallets:</span>
                  <ul className="font-mono text-xs space-y-1 text-slate-900 dark:text-slate-100 font-bold">
                    {report.identifiers.wallets.map((w) => (
                      <li key={w} className="break-all bg-slate-50 dark:bg-slate-900/40 p-1.5 border border-slate-200 dark:border-slate-800 rounded">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>

            <Panel title="Infrastructure Findings">
              <ul className="text-xs space-y-2.5 font-mono">
                {report.infrastructure_indicators.map((inf) => (
                  <li key={inf.id} className="border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">{inf.onion || inf.id}</div>
                    {inf.clearnet && <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs mt-0.5">Clearnet: {inf.clearnet}</div>}
                    {inf.ssl_cn && <div className="text-slate-900 dark:text-slate-200 font-medium text-xs mt-0.5">SSL CN: {inf.ssl_cn}</div>}
                  </li>
                ))}
                {report.infrastructure_indicators.length === 0 && (
                  <li className="text-slate-600 dark:text-slate-400">No infrastructure indicators linked.</li>
                )}
              </ul>
            </Panel>
          </div>

          <Panel title={`Evidentiary Register (${report.evidence_table.length} Items)`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/70 text-slate-950 dark:text-white font-bold">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {report.evidence_table.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-bold">{e.id}</td>
                      <td className="py-2 px-3 text-slate-950 dark:text-slate-100 font-bold">{e.type}</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-slate-200 font-medium">{e.source}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.status === "supporting"
                          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                          : "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                          }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-950 dark:text-slate-100 font-medium max-w-md">{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
