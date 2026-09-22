import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  FileText,
  GitBranch,
  LayoutDashboard,
  Network,
  Search,
  Server,
  Settings,
  Shield,
  Timer,
  Users,
  Fingerprint,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "../utils/format";
import { useTheme } from "../context/ThemeContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/investigations", label: "Investigations", icon: Shield },
  { to: "/actors", label: "Threat Actors", icon: Users },
  { to: "/infrastructure", label: "Infrastructure", icon: Server },
  { to: "/graph", label: "Relationship Graph", icon: GitBranch },
  { to: "/stylometry", label: "Stylometry", icon: Fingerprint },
  { to: "/behaviour", label: "Behaviour", icon: Activity },
  { to: "/evidence", label: "Evidence", icon: FileText },
  { to: "/timeline", label: "Timeline", icon: Timer },
  { to: "/reports", label: "Reports", icon: Network },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen grid grid-cols-[230px_1fr] bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 transition-colors duration-200">
          {/* Sidebar */}
      <aside className="border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d121f] flex flex-col shadow-sm">
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 animate-pulse flex-shrink-0"></span>
            <div className="font-mono text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400">
              TRACEX BY CYBER AURORS
            </div>
          </div>
          <div className="text-sm font-bold text-slate-950 dark:text-slate-100 mt-1.5 leading-tight">
            Cyber Threat Attribution
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Darknet Forensic Intelligence
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50",
                )
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Telemetry Feed</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4 px-6 bg-white/80 dark:bg-[#0d121f]/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
          {/* Search Box */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Search size={14} className="text-slate-400 dark:text-slate-400 flex-shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
              }}
              placeholder="Search IOCs, actor handles, PGP fingerprints, wallet addresses, onion nodes... (Enter)"
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle theme"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              {theme === "light" ? (
                <>
                  <Moon size={14} className="text-indigo-600" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span>Light</span>
                </>
              )}
            </button>

            {/* New Investigation Button */}
            <Link
              to="/investigations"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <Shield size={13} />
              <span>New Case</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-[#080c14]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
