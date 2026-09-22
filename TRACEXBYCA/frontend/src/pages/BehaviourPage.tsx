import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { ErrorState, Panel, Skeleton, ConfidenceBadge } from "../components/Ui";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ActorList = {
  items: Array<{ id: string; display_name: string }>;
};

type BehaviourProfile = {
  actor_id: string;
  post_count: number;
  heatmap: number[][];
  frequency: Array<{ date: string; count: number }>;
  platforms: Record<string, number>;
  bursts: Array<{ day: string; posts: number }>;
  inactivity_gaps: Array<{ from: string; to: string; days: number }>;
  peak_hour: number | null;
  posting_frequency: number;
  first?: string;
  last?: string;
  summary: string;
};

type MigrationData = {
  candidates: Array<{
    old_persona: string;
    new_persona: string;
    activity_shift: { pattern: string; old_last_post?: string; new_first_post?: string };
    supporting_indicators: string[];
    confidence: string;
    reason: string;
  }>;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BehaviourPage() {
  const [selectedActor, setSelectedActor] = useState("ACT-001");

  const { data: actorList } = useApi<ActorList>("/actors?page=1&page_size=100");
  const { data: behaviour, error, loading } = useApi<BehaviourProfile>(
    selectedActor ? `/behaviour/${selectedActor}` : null
  );
  const { data: migration } = useApi<MigrationData>(
    selectedActor ? `/migration/${selectedActor}` : null
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Behavioral & Temporal Analytics</h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
            Posting cadence, diurnal activity cycles (UTC), operational bursts, and dormancy patterns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">Actor:</label>
          <select
            value={selectedActor}
            onChange={(e) => setSelectedActor(e.target.value)}
            className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white shadow-sm font-mono font-bold"
          >
            {actorList?.items?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Skeleton rows={10} />}
      {error && <ErrorState message={error} />}

      {behaviour && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-4 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Posts</span>
              <div className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{behaviour.post_count}</div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-4 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Posting Frequency</span>
              <div className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {behaviour.posting_frequency} / day
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-4 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Peak Activity Hour</span>
              <div className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {behaviour.peak_hour !== null ? `${String(behaviour.peak_hour).padStart(2, "0")}:00 UTC` : "N/A"}
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-4 rounded-xl shadow-sm hover:border-amber-500 hover:shadow-md transition-all cursor-pointer">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Inactivity Gaps</span>
              <div className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {behaviour.inactivity_gaps.length}
              </div>
            </div>
          </div>

          {migration?.candidates?.[0] && (
            <Panel title="Persona Migration / Rebrand Alert">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 p-4 rounded-xl text-xs space-y-2.5 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <ConfidenceBadge value={migration.candidates[0].confidence} />
                  <span className="font-mono text-slate-950 dark:text-amber-300 font-bold text-sm">
                    {migration.candidates[0].old_persona} → {migration.candidates[0].new_persona}
                  </span>
                </div>
                <p className="text-slate-950 dark:text-slate-200 font-medium">{migration.candidates[0].reason}</p>
                <div className="text-slate-700 dark:text-slate-400 text-xs font-mono font-medium">
                  Pattern: {migration.candidates[0].activity_shift.pattern}
                  {migration.candidates[0].activity_shift.old_last_post && (
                    <span className="ml-2 font-mono">
                      (Dormant since: {migration.candidates[0].activity_shift.old_last_post.slice(0, 10)})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {migration.candidates[0].supporting_indicators.map((ind) => (
                    <span key={ind} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-950 dark:text-slate-200 rounded font-semibold">
                      ✓ {ind}
                    </span>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="Platform Distribution">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(behaviour.platforms).map(([platform, count]) => ({ platform, count }))}>
                    <XAxis dataKey="platform" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", fontSize: 11, borderRadius: 6 }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Activity Bursts & Inactivity Windows">
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="text-xs font-mono text-slate-700 dark:text-slate-300 font-bold mb-1.5">High-Activity Bursts (≥ 2 posts/day):</h4>
                  <ul className="space-y-1 font-mono max-h-24 overflow-auto">
                    {behaviour.bursts.map((b, i) => (
                      <li key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                        <span className="text-slate-950 dark:text-slate-200 font-semibold">{b.day}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{b.posts} posts</span>
                      </li>
                    ))}
                    {behaviour.bursts.length === 0 && <li className="text-slate-500">No burst events recorded</li>}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-mono text-slate-700 dark:text-slate-300 font-bold mb-1.5">Prolonged Dormancy (≥ 20 days gap):</h4>
                  <ul className="space-y-1 font-mono max-h-24 overflow-auto">
                    {behaviour.inactivity_gaps.map((g, i) => (
                      <li key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-amber-700 dark:text-amber-300 font-semibold">
                        <span>{g.from} → {g.to}</span>
                        <span>{g.days} days dormant</span>
                      </li>
                    ))}
                    {behaviour.inactivity_gaps.length === 0 && <li className="text-slate-500">No significant dormancy windows</li>}
                  </ul>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="24×7 Diurnal Activity Matrix (Hours 00-23 UTC vs Weekday)">
            <div className="overflow-x-auto">
              <div className="min-w-[600px] text-xs">
                <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-1 mb-1 font-mono text-[10px] text-slate-500 text-center">
                  <div>Day</div>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h}>{String(h).padStart(2, "0")}</div>
                  ))}
                </div>

                {DAYS.map((day, dIdx) => (
                  <div key={day} className="grid grid-cols-[40px_repeat(24,1fr)] gap-1 mb-1 items-center">
                    <div className="font-mono text-[10px] text-slate-400">{day}</div>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const count = behaviour.heatmap[dIdx]?.[h] || 0;
                      let bg = "bg-ink-950";
                      if (count > 0) bg = "bg-cyan-intel/30";
                      if (count > 1) bg = "bg-cyan-intel/60";
                      if (count > 2) bg = "bg-cyan-intel";
                      return (
                        <div
                          key={h}
                          title={`${day} ${h}:00 UTC — ${count} post(s)`}
                          className={`h-5 border border-white/5 ${bg} flex items-center justify-center font-mono text-[9px] text-ink-950 font-bold`}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
