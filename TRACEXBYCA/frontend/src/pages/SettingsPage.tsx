import { useApi } from "../hooks/useApi";
import { ErrorState, Panel, Skeleton } from "../components/Ui";

type Weights = Record<string, number>;
type Health = { status: string; mode: string };

const WEIGHT_DESCRIPTIONS: Record<string, string> = {
  pgp_match: "Cryptographic proof from matching public key fingerprints across sources (Highest confidence).",
  wallet_match: "Deterministic financial overlap from identical crypto wallet deposit/payout addresses.",
  exact_identifier: "Exact username string match across distinct forums or messaging boards.",
  email_match: "Direct correlation from leaked administrator or contact email identifiers.",
  infrastructure: "Technical infrastructure linkage via SSL/TLS certificate CNs, serial fingerprints or hosting banners.",
  migration: "Temporal persona transition pattern (dormancy of predecessor followed by activity of successor).",
  stylometry: "Analytical authorship probability derived from TF-IDF n-grams, vocabulary cosine and punctuation profiles.",
  behaviour: "Diurnal posting schedule similarity (24-hour UTC activity cosine correlation).",
  platform_overlap: "Presence on identical dark web marketplaces, messaging channels or illicit paste repositories.",
  alias_similarity: "String sequence distance between handles (Weakest indicator; requires hard corroboration).",
};

export default function SettingsPage() {
  const { data: weights, error: weightErr, loading: weightLoading } = useApi<Weights>("/settings/weights");
  const { data: health } = useApi<Health>("/health");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-950 dark:text-white">System Configuration & Heuristic Weights</h1>
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
          Correlation engine parameters, forensic attribution thresholds, and active node status.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Panel title="Runtime Environment">
          <dl className="text-xs space-y-1.5 font-mono">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
              <dt className="text-slate-700 dark:text-slate-400 font-semibold">Attribution Engine</dt>
              <dd className="text-slate-950 dark:text-blue-400 font-bold">TRACEX Forensic Core v2.4</dd>
              <dd className="text-slate-950 dark:text-blue-400 font-bold">TRACEX by Cyber Aurors</dd>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
              <dt className="text-slate-700 dark:text-slate-400 font-semibold">Service Node Status</dt>
              <dd className="text-slate-950 dark:text-emerald-400 font-bold">
                {health?.status === "ok" ? "OPERATIONAL // AIR-GAPPED" : "INITIALIZING"}
              </dd>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
              <dt className="text-slate-700 dark:text-slate-400 font-semibold">Ingestion Pipeline</dt>
              <dd className="text-slate-950 dark:text-slate-100 font-bold">Darknet Sensor Intercepts</dd>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
              <dt className="text-slate-700 dark:text-slate-400 font-semibold">Cryptographic Verifier</dt>
              <dd className="text-slate-950 dark:text-blue-300 font-bold">Bayesian Multi-Factor Scoring</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Attribution Bands">
          <div className="text-xs space-y-2.5">
            <div className="p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <div className="font-mono text-slate-950 dark:text-white font-bold flex items-center justify-between">
                <span>HIGH CONFIDENCE (Score ≥ 0.72)</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-400 bg-emerald-50 text-slate-950 font-bold">
                  HIGH
                </span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 text-xs font-medium mt-1 leading-relaxed">
                Multiple independent hard indicators corroborate (e.g. shared PGP key + crypto wallet or infrastructure overlap).
              </div>
            </div>
            <div className="p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <div className="font-mono text-slate-950 dark:text-white font-bold flex items-center justify-between">
                <span>MEDIUM CONFIDENCE (0.42 ≤ Score &lt; 0.72)</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-amber-400 bg-amber-50 text-slate-950 font-bold">
                  MEDIUM
                </span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 text-xs font-medium mt-1 leading-relaxed">
                Analytical indicators present (e.g. stylometry + behavioural time match), but missing hard cryptographic proof.
              </div>
            </div>
            <div className="p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <div className="font-mono text-slate-950 dark:text-white font-bold flex items-center justify-between">
                <span>LOW CONFIDENCE (Score &lt; 0.42)</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-950 font-bold">
                  LOW
                </span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 text-xs font-medium mt-1 leading-relaxed">
                Weak or conflicting indicators (e.g. slight alias similarity only). Unsafe for attribution.
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Correlation Engine Rule Weights">
        {weightLoading && <Skeleton rows={8} />}
        {weightErr && <ErrorState message={weightErr} />}

        {weights && (
          <div className="space-y-2.5">
            {Object.entries(weights)
              .sort(([, a], [, b]) => b - a)
              .map(([rule, weight]) => (
                <div
                  key={rule}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-950 dark:text-white font-bold text-sm">{rule}</span>
                    <span className="text-slate-950 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded font-bold">
                      Weight: {weight.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-2 rounded overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-blue-600 h-full rounded transition-all duration-300"
                      style={{ width: `${Math.min(100, weight * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-300 font-medium mt-2 leading-relaxed">
                    {WEIGHT_DESCRIPTIONS[rule] || "Heuristic scoring parameter."}
                  </p>
                </div>
              ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

