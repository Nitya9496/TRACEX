export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function bandColor(band?: string): string {
  if (band === "HIGH") {
    return "text-slate-950 bg-emerald-50/90 border-emerald-400 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700 font-bold";
  }
  if (band === "MEDIUM") {
    return "text-slate-950 bg-amber-50/90 border-amber-400 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-700 font-bold";
  }
  return "text-slate-950 bg-slate-100 border-slate-300 dark:text-slate-300 dark:bg-slate-800/70 dark:border-slate-700 font-bold";
}
