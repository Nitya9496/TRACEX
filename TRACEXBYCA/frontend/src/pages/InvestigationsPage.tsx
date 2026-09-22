import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, Panel, Skeleton } from "../components/Ui";
import type { Investigation } from "../types";

export default function InvestigationsPage() {
  const { data, error, loading, reload } = useApi<Investigation[]>("/investigations");
  const toast = useToast();
  const nav = useNavigate();
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    search_identifier: "",
    identifier_type: "alias",
    category: "persona_migration",
    priority: "high",
  });

  async function createCase(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await api.post<{ id: string }>("/investigations", form);
      toast("Investigation opened");
      reload();
      nav(`/investigations/${created.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function demo() {
    setConfirmDemo(false);
    const inv = await api.post<{ id: string }>("/investigations/demo");
    nav(`/investigations/${inv.id}`);
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
      <Panel
        title="Case queue"
        action={
          <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => setConfirmDemo(true)}>
            Demo Investigation
          </button>
        }
      >
        {loading ? <Skeleton /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && data && data.length === 0 ? <EmptyState title="No cases" body="Create an investigation from an identifier." /> : null}
        <ul className="text-sm space-y-2.5">
          {data?.map((i) => (
            <li
              key={i.id}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-3.5 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <Link to={`/investigations/${i.id}`} className="flex justify-between items-center">
                <span className="font-bold text-slate-950 dark:text-white group-hover:text-blue-600 transition-colors">{i.name}</span>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{i.id}</span>
              </Link>
              <div className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-mono font-medium">
                {i.search_identifier} · {i.priority} · {i.created_at}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="New investigation">
        <form className="space-y-3 text-sm" onSubmit={createCase}>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Case Name</label>
            <input required placeholder="Investigation name" className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white outline-none focus:border-blue-500 shadow-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea placeholder="Description" className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white outline-none focus:border-blue-500 shadow-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Search Identifier</label>
            <input required placeholder="Search identifier" className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white outline-none focus:border-blue-500 shadow-sm" value={form.search_identifier} onChange={(e) => setForm({ ...form, search_identifier: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Identifier Type</label>
            <select className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white outline-none focus:border-blue-500 shadow-sm font-semibold" value={form.identifier_type} onChange={(e) => setForm({ ...form, identifier_type: e.target.value })}>
              <option value="username">Username</option>
              <option value="alias">Alias</option>
              <option value="pgp">PGP fingerprint</option>
              <option value="wallet">Wallet identifier</option>
              <option value="email">Email identifier</option>
              <option value="platform">Platform</option>
              <option value="onion">Onion service identifier</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <input placeholder="Category" className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white outline-none focus:border-blue-500 shadow-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
            <select className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white outline-none focus:border-blue-500 shadow-sm font-semibold" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Created timestamp will be cryptographically registered on case dispatch.</div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-xs rounded-lg shadow-sm transition-colors cursor-pointer">
            Open investigation
          </button>
        </form>
      </Panel>
      {confirmDemo ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-6 rounded-xl w-96 text-sm text-slate-950 dark:text-white shadow-2xl">
            <h3 className="font-bold text-base mb-1">Load Demo Case</h3>
            <p className="text-slate-700 dark:text-slate-300 text-xs">Load the predefined Nexus rebrand case (shadow_x / shadow_reborn)?</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setConfirmDemo(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                onClick={() => void demo()}
              >
                Load demo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
