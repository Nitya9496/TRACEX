import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";
import { PlayCircle, ShieldAlert } from "lucide-react";

type Dash = {
  active_investigations: number;
  threat_actor_profiles: number;
  correlated_identities: number;
  infrastructure_indicators: number;
  potential_persona_linkages: number;
  evidence_items: number;
  correlation_statistics: Record<string, number>;
  recent_activity: Array<{ id: string; label: string; type: string; timestamp: string; actor_id?: string }>;
  investigations: Array<{ id: string; name: string; priority?: string; status: string; created_at: string }>;
};

export default function DashboardPage() {
  const { data, error, loading } = useApi<Dash>("/dashboard");
  const toast = useToast();
  const nav = useNavigate();

  async function demo() {
    try {
      const inv = await api.post<{ id: string }>("/investigations/demo");
      toast("Demo investigation loaded successfully");
      nav(`/investigations/${inv.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Demo failed");
    }
  }

  if (loading) return <Skeleton rows={8} />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="No dashboard data" body="Backend statistics were not returned." />;

  const cards = [
    ["Active Investigations", data.active_investigations, "/investigations", "Cases currently under review"],
    ["Threat Actor Profiles", data.threat_actor_profiles, "/actors", "Attributed threat identities"],
    ["Correlated Identities", data.correlated_identities, "/graph", "Resolved persona connections"],
    ["Infrastructure Indicators", data.infrastructure_indicators, "/infrastructure", "Tracked .onion & domains"],
    ["Potential Migrations", data.potential_persona_linkages, "/investigations", "Persona rebrand linkages"],
    ["Evidence Artifacts", data.evidence_items, "/evidence", "Cryptographic & raw evidence"],
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Threat Intelligence Overview
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-factor attribution scoring across cryptographic PGP keys, cryptocurrency wallets, infrastructure overlaps, and stylometric author profiling.
          </p>
        </div>
        <button
          onClick={demo}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex-shrink-0"
        >
          <PlayCircle size={16} />
          <span>Open Active Case Dossier</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(([label, value, href, subtitle]) => (
          <Link
            key={label}
            to={href}
            className="group border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d121f] rounded-xl p-4 hover:border-blue-500 dark:hover:border-blue-500/80 hover:shadow-md transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {label}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                {subtitle}
              </div>
            </div>
            <div className="font-mono text-2xl font-bold mt-3 text-blue-600 dark:text-blue-400">
              {value}
            </div>
          </Link>
        ))}
      </div>

      {/* Main Panels Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Correlation Statistics */}
        <Panel title="Attribution & Correlation Statistics">
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(data.correlation_statistics).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 px-3 py-2 rounded-md"
              >
                <dt className="text-slate-600 dark:text-slate-400 font-medium capitalize">
                  {k.replace(/_/g, " ")}
                </dt>
                <dd className="font-mono font-bold text-slate-900 dark:text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* Active Investigations */}
        <Panel title="Active Investigations">
          {data.investigations.length === 0 ? (
            <EmptyState title="No active cases" body="Load the demo investigation to populate active cases." />
          ) : (
            <ul className="text-xs space-y-2">
              {data.investigations.map((i) => (
                <li key={i.id}>
                  <Link
                    to={`/investigations/${i.id}`}
                    className="flex items-center justify-between p-2.5 rounded-md border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{i.name}</span>
                    </div>
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                      {i.priority ?? "NORMAL"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent Activity Timeline */}
        <Panel title="Recent Threat Activity">
          <ol className="text-xs space-y-2.5">
            {data.recent_activity.map((e) => (
              <li
                key={e.id}
                className="border-l-2 border-blue-500 dark:border-blue-400 pl-3 py-0.5"
              >
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  {e.timestamp}
                </div>
                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {e.label}
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        {/* Evaluation Flow */}
        <Panel title="Investigator Evaluation Path">
          <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal ml-4">
            <li>
              <span className="font-semibold text-slate-900 dark:text-white">Active Case Dossier:</span> Click Open Active Case Dossier to inspect prioritized target cluster <code>INV-DEMO-001</code>.
            </li>
            <li>
              <span className="font-semibold text-slate-900 dark:text-white">Threat Actor Profiles:</span> Inspect multi-factor handles, aliases, and PGP keys.
            </li>
            <li>
              <span className="font-semibold text-slate-900 dark:text-white">Attribution & Graph:</span> Explore pairwise similarity scores and interactive relationship network.
            </li>
            <li>
              <span className="font-semibold text-slate-900 dark:text-white">Stylometry & Behavior:</span> Analyze diurnal activity heatmaps and n-gram linguistic fingerprints.
            </li>
            <li>
              <span className="font-semibold text-slate-900 dark:text-white">Dossier Export:</span> Generate and download official PDF/CSV intelligence reports.
            </li>
          </ol>
        </Panel>
      </div>
    </div>
  );
}
