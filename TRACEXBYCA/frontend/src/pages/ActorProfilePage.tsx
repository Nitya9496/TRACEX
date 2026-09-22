import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { ConfidenceBadge, EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";
import { EvidenceCard } from "../components/EvidenceCard";
import type { EvidenceItem, InfraRecord } from "../types";

type ActorDetail = {
  id: string;
  display_name: string;
  categories: string[];
  risk_band: string;
  first_observed: string;
  last_observed: string;
  notes?: string | null;
  aliases: Array<{ id: string; value: string; status: string; first_seen: string }>;
  usernames: Array<{ id: string; value: string; platform_id?: string | null }>;
  pgp: Array<{ id: string; fingerprint: string; algo?: string | null }>;
  wallets: Array<{ id: string; address: string; asset?: string | null }>;
  emails: Array<{ id: string; value: string }>;
  platforms: string[];
  activity_frequency: number;
  post_count: number;
  infrastructure: InfraRecord[];
  evidence: EvidenceItem[];
  stylometry?: {
    top_comparisons: Array<{
      actor_b: string;
      overall: number;
      samples: { actor_a: string[]; actor_b: string[] };
    }>;
    disclaimer: string;
  };
  behaviour?: {
    heatmap: number[][];
    platforms: Record<string, number>;
    summary: string;
    peak_hour: number;
    inactivity_gaps: Array<{ from: string; to: string; days: number }>;
  };
  migration?: {
    candidates: Array<{
      old_persona: string;
      new_persona: string;
      supporting_indicators: string[];
      confidence: string;
      reason: string;
    }>;
  };
  correlations?: {
    candidates: Array<{
      actor_b: string;
      confidence: string;
      score: number;
      reason: string;
      indicators: Array<{ rule: string; explanation: string; supporting: boolean }>;
    }>;
  };
};

const TABS = [
  "Overview",
  "Identifiers",
  "Correlations",
  "Infrastructure",
  "Stylometry & Behaviour",
  "Evidence",
] as const;

export default function ActorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useApi<ActorDetail>(id ? `/actors/${id}` : null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  if (loading) return <Skeleton rows={10} />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="Actor profile not found" body="Could not load actor details." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0d121f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{data.id}</span>
            <ConfidenceBadge value={data.risk_band?.toUpperCase()} />
          </div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white mt-1">{data.display_name}</h1>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.categories?.map((c) => (
              <span
                key={c}
                className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-slate-200 rounded font-bold"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/graph?actor=${data.id}`}
            className="border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
          >
            Open in Graph
          </Link>
          <Link
            to={`/investigations?actor=${data.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors"
          >
            Create Investigation
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-white dark:bg-[#0d121f] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${tab === t
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Panel title="Temporal & Operational Summary">
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                <dt className="text-slate-500 font-semibold">First Observed</dt>
                <dd className="font-mono text-slate-950 dark:text-slate-100 font-bold mt-0.5">{data.first_observed}</dd>
              </div>
              <div className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                <dt className="text-slate-500 font-semibold">Last Observed</dt>
                <dd className="font-mono text-slate-950 dark:text-slate-100 font-bold mt-0.5">{data.last_observed}</dd>
              </div>
              <div className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                <dt className="text-slate-500 font-semibold">Observed Posts</dt>
                <dd className="font-mono text-slate-950 dark:text-slate-100 font-bold mt-0.5">{data.post_count}</dd>
              </div>
              <div className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                <dt className="text-slate-500 font-semibold">Post Frequency</dt>
                <dd className="font-mono text-slate-950 dark:text-slate-100 font-bold mt-0.5">{data.activity_frequency} posts / day</dd>
              </div>
            </dl>
            {data.notes && (
              <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-300">
                <span className="text-slate-500 block mb-1">Investigative Notes:</span>
                {data.notes}
              </div>
            )}
          </Panel>

          <Panel title="Associated Platforms">
            <div className="flex flex-wrap gap-2 text-xs">
              {data.platforms.map((p) => (
                <span key={p} className="px-2 py-1 bg-ink-800 border border-white/10 font-mono text-cyan-intel">
                  {p}
                </span>
              ))}
              {data.platforms.length === 0 && <span className="text-slate-500">No platforms mapped</span>}
            </div>
            {data.migration?.candidates?.[0] && (
              <div className="mt-4 p-2.5 border border-amber-500/30 bg-amber-500/5 text-xs">
                <div className="font-medium text-amber-300">Potential Persona Rebrand Detected</div>
                <div className="text-slate-300 mt-1">
                  {data.migration.candidates[0].old_persona} → {data.migration.candidates[0].new_persona}
                </div>
                <div className="text-slate-500 mt-1 text-[11px]">
                  {data.migration.candidates[0].reason}
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === "Identifiers" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Panel title={`Aliases (${data.aliases.length})`}>
            <ul className="text-xs space-y-2">
              {data.aliases.map((al) => (
                <li key={al.id} className="flex justify-between items-center border-b border-white/5 pb-1">
                  <div>
                    <span className="font-mono text-slate-200">{al.value}</span>
                    <span className="text-slate-500 text-[10px] ml-2">({al.id})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{al.status}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={`PGP Fingerprints (${data.pgp.length})`}>
            <ul className="text-xs space-y-2 font-mono">
              {data.pgp.map((p) => (
                <li key={p.id} className="border-b border-white/5 pb-1">
                  <div className="text-cyan-intel break-all">{p.fingerprint}</div>
                  <div className="text-slate-500 text-[10px]">Algo: {p.algo ?? "RSA/ECC"}</div>
                </li>
              ))}
              {data.pgp.length === 0 && <li className="text-slate-500">No PGP keys recorded</li>}
            </ul>
          </Panel>

          <Panel title={`Crypto Wallets (${data.wallets.length})`}>
            <ul className="text-xs space-y-2 font-mono">
              {data.wallets.map((w) => (
                <li key={w.id} className="border-b border-white/5 pb-1">
                  <div className="text-slate-200 break-all">{w.address}</div>
                  <div className="text-slate-500 text-[10px]">Asset: {w.asset ?? "BTC/XMR"}</div>
                </li>
              ))}
              {data.wallets.length === 0 && <li className="text-slate-500">No wallet addresses recorded</li>}
            </ul>
          </Panel>

          <Panel title={`Usernames & Emails`}>
            <div className="space-y-3 text-xs">
              <div>
                <h4 className="text-slate-500 text-[11px] mb-1">Usernames</h4>
                <ul className="space-y-1 font-mono">
                  {data.usernames.map((u) => (
                    <li key={u.id} className="text-slate-300">
                      {u.value} {u.platform_id ? `on ${u.platform_id}` : ""}
                    </li>
                  ))}
                  {data.usernames.length === 0 && <li className="text-slate-500">None</li>}
                </ul>
              </div>
              <div>
                <h4 className="text-slate-500 text-[11px] mb-1">Emails</h4>
                <ul className="space-y-1 font-mono">
                  {data.emails.map((e) => (
                    <li key={e.id} className="text-slate-300">{e.value}</li>
                  ))}
                  {data.emails.length === 0 && <li className="text-slate-500">None</li>}
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === "Correlations" && (
        <div className="space-y-3">
          {data.correlations?.candidates?.map((c) => (
            <Panel key={c.actor_b} title={`Linked Candidate: ${c.actor_b}`}>
              <div className="flex items-center gap-3">
                <ConfidenceBadge value={c.confidence} />
                <span className="text-xs font-mono text-slate-300">Score: {c.score}</span>
                <Link to={`/actors/${c.actor_b}`} className="text-xs text-cyan-intel hover:underline font-mono">
                  Inspect Candidate →
                </Link>
              </div>
              <p className="text-xs text-slate-300 mt-2">{c.reason}</p>
              <ul className="mt-3 text-xs space-y-1">
                {c.indicators.map((ind, i) => (
                  <li key={i} className={ind.supporting ? "text-slate-300" : "text-amber-300"}>
                    • <span className="font-mono text-slate-400">{ind.rule}:</span> {ind.explanation}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
          {(!data.correlations?.candidates || data.correlations.candidates.length === 0) && (
            <EmptyState title="No cross-actor correlations" body="No matching candidates above threshold." />
          )}
        </div>
      )}

      {tab === "Infrastructure" && (
        <div className="grid md:grid-cols-2 gap-3">
          {data.infrastructure.map((inf) => (
            <Panel key={inf.id} title={inf.onion_address ?? inf.id}>
              <dl className="text-xs space-y-1.5 font-mono">
                <div>
                  <dt className="text-slate-500">SSL Certificate CN</dt>
                  <dd className="text-slate-200">{inf.ssl_cn ?? "n/a"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Server Banner</dt>
                  <dd className="text-slate-200">{inf.server_banner ?? "n/a"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Clearnet Domain</dt>
                  <dd className="text-cyan-intel">{inf.clearnet_domain ?? "n/a"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Misconfigurations / Anomalies</dt>
                  <dd className="text-slate-300">{inf.misconfig || inf.descriptor_anomaly || "None"}</dd>
                </div>
              </dl>
            </Panel>
          ))}
          {data.infrastructure.length === 0 && (
            <EmptyState title="No infrastructure" body="No hidden services mapped to this actor." />
          )}
        </div>
      )}

      {tab === "Stylometry & Behaviour" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Panel title="Writing Style Analysis">
            <p className="text-[11px] text-amber-200/80 mb-3">{data.stylometry?.disclaimer}</p>
            <div className="space-y-3">
              {data.stylometry?.top_comparisons?.slice(0, 3).map((comp) => (
                <div key={comp.actor_b} className="border border-white/5 p-2 bg-ink-950/60">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-cyan-intel">{comp.actor_b}</span>
                    <span className="font-mono">Similarity: {comp.overall}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Temporal Behaviour">
            <div className="text-xs space-y-2">
              <p className="text-slate-300">{data.behaviour?.summary}</p>
              {data.behaviour?.peak_hour !== undefined && (
                <div className="font-mono text-[11px] text-cyan-intel">
                  Peak Activity Hour: {data.behaviour.peak_hour}:00 UTC
                </div>
              )}
              {data.behaviour?.inactivity_gaps && data.behaviour.inactivity_gaps.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="text-slate-500 text-[11px] mb-1">Inactivity Gaps:</div>
                  {data.behaviour.inactivity_gaps.map((g, i) => (
                    <div key={i} className="text-slate-400 font-mono text-[11px]">
                      {g.from} to {g.to} ({g.days} days)
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {tab === "Evidence" && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.evidence.map((ev) => (
            <EvidenceCard key={ev.id} item={ev} />
          ))}
          {data.evidence.length === 0 && (
            <EmptyState title="No evidence items" body="No evidence recorded for this actor." />
          )}
        </div>
      )}
    </div>
  );
}

