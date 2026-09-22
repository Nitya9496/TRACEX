import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Toast = { id: number; text: string };

const Ctx = createContext<(text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string) => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, text }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="border border-blue-500/40 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 shadow-lg flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
