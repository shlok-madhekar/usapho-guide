"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ModuleStatus = "not-started" | "reading" | "practicing" | "complete" | "skipped";
export type ProblemStatus = "none" | "attempted" | "solved" | "reviewed";

export const MODULE_STATUS_META: Record<
  ModuleStatus,
  { label: string; color: string }
> = {
  "not-started": { label: "Not Started", color: "var(--ink-faint)" },
  reading: { label: "Reading", color: "var(--status-reading)" },
  practicing: { label: "Practicing", color: "var(--status-practicing)" },
  complete: { label: "Complete", color: "var(--status-complete)" },
  skipped: { label: "Skipped", color: "var(--status-skipped)" },
};

export const PROBLEM_STATUS_ORDER: ProblemStatus[] = [
  "none",
  "attempted",
  "solved",
  "reviewed",
];

interface ProgressState {
  modules: Record<string, ModuleStatus>;
  problems: Record<string, ProblemStatus>;
}

interface ProgressContextValue extends ProgressState {
  ready: boolean;
  setModuleStatus: (slug: string, status: ModuleStatus) => void;
  cycleProblem: (id: string) => void;
  setProblem: (id: string, status: ProblemStatus) => void;
  reset: () => void;
}

const KEY = "usapho-guide-progress-v1";
const EMPTY: ProgressState = { modules: {}, problems: {} };

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* corrupted storage, start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state, ready]);

  const setModuleStatus = useCallback((slug: string, status: ModuleStatus) => {
    setState((s) => ({ ...s, modules: { ...s.modules, [slug]: status } }));
  }, []);

  const cycleProblem = useCallback((id: string) => {
    setState((s) => {
      const cur = s.problems[id] ?? "none";
      const next =
        PROBLEM_STATUS_ORDER[
          (PROBLEM_STATUS_ORDER.indexOf(cur) + 1) % PROBLEM_STATUS_ORDER.length
        ];
      return { ...s, problems: { ...s.problems, [id]: next } };
    });
  }, []);

  const setProblem = useCallback((id: string, status: ProblemStatus) => {
    setState((s) => ({ ...s, problems: { ...s.problems, [id]: status } }));
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo(
    () => ({ ...state, ready, setModuleStatus, cycleProblem, setProblem, reset }),
    [state, ready, setModuleStatus, cycleProblem, setProblem, reset]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
