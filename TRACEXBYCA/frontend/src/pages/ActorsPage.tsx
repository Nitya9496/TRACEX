import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { ConfidenceBadge, EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";

type ActorItem = {
  id: string;
  display_name: string;
  categories: string[];
  risk_band: string;
  first_observed: string;
  last_observed: string;
};

type ActorListResponse = {
  total: number;
  page: number;
  page_size: number;
  items: ActorItem[];
};

const CATEGORIES = [
  "ALL",
  "stolen_data",
  "access_broker",
  "fraud",
  "malware_affiliate",
  "financial_crime",
];

export default function ActorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (searchTerm.trim()) queryParams.set("q", searchTerm.trim());
  if (selectedCategory !== "ALL") queryParams.set("category", selectedCategory);
  queryParams.set("page", String(page));
  queryParams.set("page_size", "20");

  const { data, error, loading } = useApi<ActorListResponse>(`/actors?${queryParams.toString()}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg">Threat Actor Catalogue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracked threat clusters, operator personas, and cross-platform indicators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter actor or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none placeholder:text-slate-500 focus:border-blue-500 text-slate-950 dark:text-white w-52 shadow-sm"
          />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white shadow-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Panel
        title={`Identified Threat Actors (${data?.total ?? 0})`}
        action={
          data && data.total > data.page_size ? (
            <div className="flex items-center gap-2 text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold"
              >
                Prev
              </button>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                Page {page} of {Math.ceil(data.total / data.page_size)}
              </span>
              <button
                disabled={page >= Math.ceil(data.total / data.page_size)}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold"
              >
                Next
              </button>
            </div>
          ) : undefined
        }
      >
        {loading ? <Skeleton rows={8} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && data && data.items.length === 0 ? (
          <EmptyState title="No threat actors found" body="Try adjusting your search filter or category." />
        ) : null}

        {data && data.items.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.items.map((actor) => (
              <div
                key={actor.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-4 rounded-xl flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{actor.id}</span>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">{actor.display_name}</h3>
                    </div>
                    <ConfidenceBadge value={actor.risk_band?.toUpperCase()} />
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {actor.categories.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-950 dark:text-slate-200 font-bold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-slate-700 dark:text-slate-400 space-y-0.5 font-mono font-medium">
                    <div>First Seen: {actor.first_observed?.slice(0, 10)}</div>
                    <div>Last Active: {actor.last_observed?.slice(0, 10)}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link
                    to={`/actors/${actor.id}`}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold font-mono"
                  >
                    Examine Profile →
                  </Link>
                  <Link
                    to={`/graph?actor=${actor.id}`}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-medium"
                  >
                    View Graph
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

