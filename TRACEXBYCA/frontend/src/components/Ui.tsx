import React from "react";

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 bg-slate-200/70 dark:bg-slate-800/60 rounded-md animate-pulse" />
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] rounded-lg p-10 text-center shadow-sm">
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">{body}</div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 p-4 rounded-lg text-sm text-rose-800 dark:text-rose-200 shadow-sm">
      <div className="font-semibold text-rose-900 dark:text-rose-300 mb-0.5">Error</div>
      {message}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0d121f] rounded-xl shadow-sm overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900/50">
        <h2 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-200">
          {title}
        </h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ConfidenceBadge({ value }: { value?: string }) {
  const v = value ?? "LOW";
  const cls =
    v === "HIGH"
      ? "text-slate-950 bg-emerald-50/90 border-emerald-400 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700/80 font-bold"
      : v === "MEDIUM"
        ? "text-slate-950 bg-amber-50/90 border-amber-400 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-700/80 font-bold"
        : "text-slate-950 bg-slate-100 border-slate-300 dark:text-slate-300 dark:bg-slate-800/70 dark:border-slate-700/80 font-bold";
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded ${cls}`}>
      {v}
    </span>
  );
}
