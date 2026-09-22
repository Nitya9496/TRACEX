import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";

type SearchResult = {
  query: string;
  actors: Array<{ id: string; display_name: string }>;
  identifiers: {
    aliases: Array<{ id: string; value: string; actor_id: string }>;
    pgp: Array<{ id: string; fingerprint: string; actor_id: string }>;
    wallets: Array<{ id: string; address: string; actor_id: string }>;
    emails: Array<{ id: string; value: string; actor_id: string }>;
  };
  infrastructure: Array<{ id: string; onion?: string | null; clearnet?: string | null; actor_id?: string | null }>;
  evidence: Array<{ id: string; type: string; description: string }>;
  posts: Array<{ id: string; alias?: string | null; actor_id: string }>;
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(queryParam);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchTerm(q);
  }, [searchParams]);

  const { data, error, loading } = useApi<SearchResult>(
    queryParam.trim() ? `/search?q=${encodeURIComponent(queryParam.trim())}` : null
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  }

  const totalResults = data
    ? data.actors.length +
    data.identifiers.aliases.length +
    data.identifiers.pgp.length +
    data.identifiers.wallets.length +
    data.identifiers.emails.length +
    data.infrastructure.length +
    data.evidence.length +
    data.posts.length
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">Omni Search</h1>
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
          Federated search across threat actors, aliases, PGP fingerprints, wallet addresses, infrastructure, and raw posts.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by username, alias, PGP key, wallet, onion, email..."
          className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-blue-500 text-slate-950 dark:text-white placeholder:text-slate-400 shadow-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 text-xs rounded-lg shadow-sm transition-colors cursor-pointer font-mono"
        >
          Search
        </button>
      </form>

      {loading && <Skeleton rows={8} />}
      {error && <ErrorState message={error} />}

      {!loading && !queryParam.trim() && (
        <EmptyState title="Enter a search term" body="Type an identifier, alias, wallet, or hidden service address above." />
      )}

      {!loading && queryParam.trim() && data && totalResults === 0 && (
        <EmptyState title="No matching records" body={`No threat intelligence entities found matching query "${queryParam}".`} />
      )}

      {data && totalResults > 0 && (
        <div className="space-y-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 font-mono font-medium">
            Found {totalResults} result(s) for query: <span className="text-blue-600 dark:text-blue-400 font-bold">"{data.query}"</span>
          </div>

          {data.actors.length > 0 && (
            <Panel title={`Threat Actors (${data.actors.length})`}>
              <div className="grid md:grid-cols-2 gap-3">
                {data.actors.map((a) => (
                  <Link
                    key={a.id}
                    to={`/actors/${a.id}`}
                    className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-3.5 rounded-xl flex justify-between items-center hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group shadow-sm"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{a.id}</div>
                      <div className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">{a.display_name}</div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">View Profile →</span>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          {(data.identifiers.aliases.length > 0 ||
            data.identifiers.pgp.length > 0 ||
            data.identifiers.wallets.length > 0 ||
            data.identifiers.emails.length > 0) && (
              <Panel title="Matching Identifiers">
                <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                  {data.identifiers.aliases.length > 0 && (
                    <div>
                      <h4 className="text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Aliases:</h4>
                      <ul className="space-y-1">
                        {data.identifiers.aliases.map((al) => (
                          <li key={al.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                            <span className="text-slate-950 dark:text-slate-100 font-bold">{al.value}</span>
                            <Link to={`/actors/${al.actor_id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                              {al.actor_id}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.identifiers.pgp.length > 0 && (
                    <div>
                      <h4 className="text-slate-500 font-bold mb-1.5 uppercase text-[10px]">PGP Fingerprints:</h4>
                      <ul className="space-y-1">
                        {data.identifiers.pgp.map((p) => (
                          <li key={p.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                            <span className="text-slate-950 dark:text-slate-100 font-bold truncate max-w-xs">{p.fingerprint}</span>
                            <Link to={`/actors/${p.actor_id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                              {p.actor_id}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.identifiers.wallets.length > 0 && (
                    <div>
                      <h4 className="text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Crypto Wallets:</h4>
                      <ul className="space-y-1">
                        {data.identifiers.wallets.map((w) => (
                          <li key={w.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                            <span className="text-slate-950 dark:text-slate-100 font-bold truncate max-w-xs">{w.address}</span>
                            <Link to={`/actors/${w.actor_id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                              {w.actor_id}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.identifiers.emails.length > 0 && (
                    <div>
                      <h4 className="text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Emails:</h4>
                      <ul className="space-y-1">
                        {data.identifiers.emails.map((e) => (
                          <li key={e.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                            <span className="text-slate-950 dark:text-slate-100 font-bold">{e.value}</span>
                            <Link to={`/actors/${e.actor_id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                              {e.actor_id}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Panel>
            )}

          {data.infrastructure.length > 0 && (
            <Panel title={`Infrastructure Indicators (${data.infrastructure.length})`}>
              <ul className="text-xs font-mono space-y-2">
                {data.infrastructure.map((inf) => (
                  <li key={inf.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-3 rounded-xl flex justify-between items-center hover:border-blue-500 hover:shadow-md transition-all cursor-pointer shadow-sm">
                    <div>
                      <div className="text-blue-600 dark:text-blue-400 font-bold">{inf.onion || inf.id}</div>
                      {inf.clearnet && <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs mt-0.5">Clearnet: {inf.clearnet}</div>}
                    </div>
                    {inf.actor_id && (
                      <Link to={`/actors/${inf.actor_id}`} className="text-slate-700 dark:text-slate-300 font-bold hover:text-blue-600">
                        Linked: {inf.actor_id} →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {data.evidence.length > 0 && (
            <Panel title={`Evidence Matches (${data.evidence.length})`}>
              <ul className="text-xs space-y-2">
                {data.evidence.map((ev) => (
                  <li key={ev.id} className="border-b border-slate-100 dark:border-slate-800 p-2.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold mr-2">{ev.id}</span>
                    <span className="text-slate-500 font-mono font-bold">[{ev.type}]</span>
                    <p className="text-slate-950 dark:text-slate-100 font-medium mt-1 leading-relaxed">{ev.description}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

