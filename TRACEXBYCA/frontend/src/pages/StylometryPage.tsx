import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";

type ActorList = {
  items: Array<{ id: string; display_name: string }>;
};

type ComparisonResult = {
  actor_a: string;
  actor_b: string;
  vocabulary: number;
  sentence_structure: number;
  punctuation: number;
  phrase: number;
  tfidf: number;
  overall: number;
  mean_sentence_length?: { actor_a: number; actor_b: number };
  samples?: { actor_a: string[]; actor_b: string[] };
  label?: string;
  disclaimer: string;
};

type StylometryProfile = {
  actor_id: string;
  post_count: number;
  word_frequency: Array<[string, number]>;
  punctuation_profile: number[];
  top_comparisons: ComparisonResult[];
  disclaimer: string;
};

export default function StylometryPage() {
  const [actorA, setActorA] = useState("ACT-001");
  const [actorB, setActorB] = useState("ACT-014");

  const { data: actorList } = useApi<ActorList>("/actors?page=1&page_size=100");
  const { data: profileA, loading: loadingA } = useApi<StylometryProfile>(
    actorA ? `/stylometry/${actorA}` : null
  );
  const { data: comparison, error, loading: loadingComp } = useApi<ComparisonResult>(
    actorA && actorB && actorA !== actorB ? `/stylometry/${actorA}?other=${actorB}` : null
  );

  const metrics = comparison
    ? [
      { label: "Vocabulary Overlap", val: comparison.vocabulary, desc: "Cosine similarity of distinct word frequency distributions" },
      { label: "TF-IDF Cosine", val: comparison.tfidf, desc: "Bi-gram text vector similarity across post bodies" },
      { label: "Phrase Tri-grams", val: comparison.phrase, desc: "Shared 3-word recurring phrases and linguistic habits" },
      { label: "Sentence Structure", val: comparison.sentence_structure, desc: "Variance in average words-per-sentence patterns" },
      { label: "Punctuation Density", val: comparison.punctuation, desc: "Frequency vector of special characters and delimiters" },
    ]
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">Stylometric Text Analysis</h1>
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
          Authorship attribution, linguistic fingerprinting, and writing-style similarity matrices.
        </p>
      </div>

      <div className="border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl text-xs text-slate-950 dark:text-amber-200 font-medium shadow-sm">
        <span className="font-bold text-amber-800 dark:text-amber-300">Methodological Notice: </span>
        Stylometric similarity provides analytical corroboration but is not definitive legal proof of real-world identity.
      </div>

      <Panel title="Pairwise Author Comparison">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 block mb-1 font-mono font-bold">Actor A (Subject):</label>
            <select
              value={actorA}
              onChange={(e) => setActorA(e.target.value)}
              className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white font-mono shadow-sm font-semibold"
            >
              {actorList?.items?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-500 font-mono font-bold self-end pb-2">vs</div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 block mb-1 font-mono font-bold">Actor B (Target):</label>
            <select
              value={actorB}
              onChange={(e) => setActorB(e.target.value)}
              className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white font-mono shadow-sm font-semibold"
            >
              {actorList?.items?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingComp && <Skeleton rows={6} />}
        {error && <ErrorState message={error} />}

        {comparison && (
          <div className="mt-4 space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between bg-white dark:bg-[#0f172a] p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Overall Stylometric Similarity</span>
                <div className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {(comparison.overall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold shadow-sm">
                  {comparison.label || "Analyzed"}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-950 dark:text-slate-100 font-bold">{m.label}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{(m.val * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-2 rounded overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-blue-600 h-full rounded transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, m.val * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>

            {comparison.samples && (
              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <div className="border border-slate-200 dark:border-slate-800 p-3.5 bg-white dark:bg-[#0f172a] rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
                  <div className="text-xs font-mono text-slate-900 dark:text-slate-200 font-bold mb-2">{actorA} Post Samples</div>
                  <div className="space-y-2">
                    {comparison.samples.actor_a?.map((s, idx) => (
                      <p key={idx} className="text-xs text-slate-900 dark:text-slate-200 italic bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded border-l-4 border-blue-500 font-medium">
                        "{s}"
                      </p>
                    ))}
                    {(!comparison.samples.actor_a || comparison.samples.actor_a.length === 0) && (
                      <span className="text-xs text-slate-500 font-medium">No post samples</span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 p-3.5 bg-white dark:bg-[#0f172a] rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
                  <div className="text-xs font-mono text-slate-900 dark:text-slate-200 font-bold mb-2">{actorB} Post Samples</div>
                  <div className="space-y-2">
                    {comparison.samples.actor_b?.map((s, idx) => (
                      <p key={idx} className="text-xs text-slate-900 dark:text-slate-200 italic bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded border-l-4 border-blue-500 font-medium">
                        "{s}"
                      </p>
                    ))}
                    {(!comparison.samples.actor_b || comparison.samples.actor_b.length === 0) && (
                      <span className="text-xs text-slate-500 font-medium">No post samples</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel title={`Frequent Vocabulary Profile — ${actorA}`}>
        {loadingA && <Skeleton rows={4} />}
        {profileA && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {profileA.word_frequency?.map(([w, count]) => (
                <span
                  key={w}
                  className="px-2.5 py-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono flex items-center gap-2 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <span className="text-slate-950 dark:text-slate-100 font-bold">{w}</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-bold">{count}</span>
                </span>
              ))}
              {(!profileA.word_frequency || profileA.word_frequency.length === 0) && (
                <EmptyState title="No vocabulary data" body="No post corpora found for this actor." />
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

