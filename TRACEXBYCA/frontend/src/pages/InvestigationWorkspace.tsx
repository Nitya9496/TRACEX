import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { EvidenceCard } from "../components/EvidenceCard";
import { GraphCanvas } from "../components/GraphCanvas";
import { ConfidenceBadge, EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";
import type { EvidenceItem, GraphEdge, GraphNode, InfraRecord } from "../types";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Workspace = {
  id: string;
  name: string;
  description: string;
  search_identifier: string;
  identifier_type: string;
  category: string;
  priority: string;
  created_at: string;
  primary_actor_id: string;
  candidates: Array<{ id: string; display_name: string }>;
  overview: Record<string, unknown> | null;
  correlations: {
    candidates: Array<{
      actor_b: string;
      confidence: string;
      score: number;
      supporting_count: number;
      contradicting_count: number;
      evidence_coverage: number;
      reason: string;
      indicators: Array<{ rule: string; explanation: string; supporting: boolean }>;
    }>;
    self_assessment: { confidence: string; reason: string; supporting_count: number; contradicting_count: number; evidence_coverage: number };
    stored_relationships: Array<{ id: string; relationship_type: string; explanation: string; confidence: string; target_actor_id: string; source_actor_id: string }>;
  };
  infrastructure: InfraRecord[];
  stylometry: { top_comparisons: Array<{ actor_b: string; overall: number; samples: { actor_a: string[]; actor_b: string[] } }>; disclaimer: string };
  behaviour: { heatmap: number[][]; platforms: Record<string, number>; summary: string; frequency: Array<{ date: string; count: number }> };
  migration: { candidates: Array<{ old_persona: string; new_persona: string; supporting_indicators: string[]; confidence: string; reason: string }> };
  evidence: EvidenceItem[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  timeline: Array<{ id: string; event_type: string; label: string; timestamp: string }>;
};

const TABS = ["Overview", "Actor Candidates", "Correlations", "Infrastructure", "Stylometry", "Behaviour", "Evidence", "Graph", "Timeline", "Reports"] as const;

export default function InvestigationWorkspace() {
  const { id } = useParams();
  const { data, error, loading } = useApi<Workspace>(id ? `/investigations/${id}` : null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  if (loading) return <Skeleton rows={10} />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="Investigation missing" body="The case could not be loaded." />;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#0d121f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{data.id}</div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white mt-0.5">{data.name}</h1>
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{data.description}</p>
      </div>

      <div className="flex flex-wrap gap-1 bg-white dark:bg-[#0d121f] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${tab === t
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <Panel title="Investigation Overview">
          <dl className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Search Identifier</span>
              <span className="text-slate-950 dark:text-white font-mono font-bold text-sm mt-0.5 block">{data.search_identifier} ({data.identifier_type})</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Category</span>
              <span className="text-slate-950 dark:text-white font-bold text-sm mt-0.5 block capitalize">{data.category.replace(/_/g, " ")}</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Priority</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm mt-0.5 block uppercase">{data.priority}</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Primary Threat Actor</span>
              <Link className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-0.5 block hover:underline" to={`/actors/${data.primary_actor_id}`}>
                {data.primary_actor_id} →
              </Link>
            </div>
          </dl>
        </Panel>
      )}

      {tab === "Actor Candidates" && (
        <Panel title="Actor Candidates">
          <ul className="text-sm space-y-2">
            {data.candidates.map((c) => (
              <li
                key={c.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              >
                <Link to={`/actors/${c.id}`} className="flex justify-between items-center">
                  <span className="font-bold text-slate-950 dark:text-white">{c.display_name}</span>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{c.id} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === "Correlations" && (
        <div className="space-y-3">
          <Panel title="Attribution Confidence Assessment">
            <div className="flex items-center gap-3">
              <ConfidenceBadge value={data.correlations.self_assessment.confidence} />
              <span className="text-xs font-bold text-slate-950 dark:text-slate-100">
                Supporting {data.correlations.self_assessment.supporting_count} · Contradicting {data.correlations.self_assessment.contradicting_count} · Coverage {Math.round(data.correlations.self_assessment.evidence_coverage * 100)}%
              </span>
            </div>
            <p className="text-xs mt-2 text-slate-800 dark:text-slate-300 font-medium leading-relaxed">{data.correlations.self_assessment.reason}</p>
          </Panel>
          {data.correlations.candidates.map((c) => (
            <Panel key={c.actor_b} title={`${data.primary_actor_id} → ${c.actor_b}`}>
              <div className="flex items-center gap-2 text-xs">
                <ConfidenceBadge value={c.confidence} />
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">Score: {c.score}</span>
              </div>
              <p className="text-xs mt-2 text-slate-950 dark:text-slate-200 font-medium">{c.reason}</p>
              <ul className="mt-2.5 text-xs space-y-1.5 font-mono">
                {c.indicators.map((i, idx) => (
                  <li key={idx} className={i.supporting ? "text-slate-900 dark:text-slate-300" : "text-amber-700 dark:text-amber-300 font-semibold"}>
                    • <span className="font-bold">{i.rule}:</span> {i.explanation}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      {tab === "Infrastructure" && (
        <div className="grid md:grid-cols-2 gap-3">
          {data.infrastructure.map((i) => (
            <Panel key={i.id} title={i.onion_address ?? i.id}>
              <ul className="text-xs space-y-1.5 font-mono">
                <li><span className="text-slate-500 font-bold">SSL:</span> <span className="text-slate-950 dark:text-slate-200">{i.ssl_cn ?? "n/a"}</span></li>
                <li><span className="text-slate-500 font-bold">Banner:</span> <span className="text-slate-950 dark:text-slate-200">{i.server_banner ?? "n/a"}</span></li>
                <li><span className="text-slate-500 font-bold">Misconfig:</span> <span className="text-slate-950 dark:text-slate-200">{i.misconfig ?? "none"}</span></li>
                <li><span className="text-slate-500 font-bold">Clearnet:</span> <span className="text-emerald-700 dark:text-emerald-400 font-bold">{i.clearnet_domain ?? "n/a"}</span></li>
              </ul>
            </Panel>
          ))}
        </div>
      )}

      {tab === "Stylometry" && (
        <Panel title="Writing Pattern Comparison">
          <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold mb-3">{data.stylometry.disclaimer}</p>
          {data.stylometry.top_comparisons.slice(0, 3).map((c) => (
            <div key={c.actor_b} className="mb-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3.5 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <div className="text-xs font-mono font-bold text-slate-950 dark:text-white flex justify-between">
                <span>{c.actor_b}</span>
                <span className="text-blue-600 dark:text-blue-400">Analytical Similarity: {(c.overall * 100).toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                <div>
                  <div className="text-slate-500 font-bold text-[10px] uppercase">Sample A</div>
                  {(c.samples.actor_a ?? []).map((s) => <p key={s} className="italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded border-l-2 border-blue-500 text-slate-900 dark:text-slate-200 mt-1">"{s}"</p>)}
                </div>
                <div>
                  <div className="text-slate-500 font-bold text-[10px] uppercase">Sample B</div>
                  {(c.samples.actor_b ?? []).map((s) => <p key={s} className="italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded border-l-2 border-blue-500 text-slate-900 dark:text-slate-200 mt-1">"{s}"</p>)}
                </div>
              </div>
            </div>
          ))}
        </Panel>
      )}

      {tab === "Behaviour" && (
        <Panel title="Behaviour">
          <p className="text-xs mb-3 text-slate-800 dark:text-slate-200 font-medium">{data.behaviour.summary}</p>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={Object.entries(data.behaviour.platforms).map(([k, v]) => ({ k, v }))}>
                <XAxis dataKey="k" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", fontSize: 11, borderRadius: 6 }} />
                <Bar dataKey="v" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {data.migration.candidates[0] ? (
            <div className="mt-3 text-xs border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl shadow-sm">
              <div className="font-bold text-slate-950 dark:text-white">Migration candidate: {data.migration.candidates[0].old_persona} → {data.migration.candidates[0].new_persona}</div>
              <div className="text-slate-700 dark:text-slate-300 mt-1 font-mono">{data.migration.candidates[0].supporting_indicators.join(" · ")}</div>
            </div>
          ) : null}
        </Panel>
      )}

      {tab === "Evidence" && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.evidence.map((e) => <EvidenceCard key={e.id} item={e} />)}
        </div>
      )}

      {tab === "Graph" && <GraphCanvas nodes={data.graph.nodes} edges={data.graph.edges} />}

      {tab === "Timeline" && (
        <ol className="relative border-l-2 border-blue-200 dark:border-blue-900 ml-4 my-2 space-y-3">
          {data.timeline.map((t) => (
            <li key={t.id} className="ml-6 group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer relative">
              <span className="absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-900 group-hover:bg-blue-600 transition-colors" />
              <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{t.timestamp}</div>
              <div className="font-bold text-slate-950 dark:text-white mt-0.5">{t.label}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{t.event_type}</div>
            </li>
          ))}
        </ol>
      )}

      {tab === "Reports" && (
        <Panel title="Reports">
          <p className="text-xs mb-3 text-slate-700 dark:text-slate-300">Export the full investigation pack. Evidentiary provenance is embedded in every format.</p>
          <Link className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors inline-block" to={`/reports?id=${data.id}`}>
            Open report console →
          </Link>
        </Panel>
      )}
    </div>
  );
}
