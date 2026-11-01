"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/lib/auth";

export type ModuleStatus = "not-started" | "reading" | "practicing" | "complete" | "skipped";
export type ProblemStatus = "none" | "attempted" | "solved" | "reviewed";

export const MODULE_STATUS_META: Record<ModuleStatus, { label: string; color: string }> = {
  "not-started": { label: "Not started", color: "var(--rule-strong)" },
  reading: { label: "Reading", color: "var(--diff-2)" },
  practicing: { label: "Practicing", color: "var(--warn)" },
  complete: { label: "Complete", color: "var(--ok)" },
  skipped: { label: "Skipped", color: "var(--ink-faint)" },
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
  /** true when progress is being persisted to the signed-in account */
  synced: boolean;
  syncing: boolean;
  setModuleStatus: (slug: string, status: ModuleStatus) => void;
  cycleProblem: (id: string) => void;
  setProblem: (id: string, status: ProblemStatus) => void;
  reset: () => void;
}

const KEY = "usapho-guide-progress-v1";
const EMPTY: ProgressState = { modules: {}, problems: {} };

const ProgressContext = createContext<ProgressContextValue | null>(null);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function mergeProgress(local: ProgressState, remote: ProgressState): ProgressState {
  // Union of both; remote wins on conflict for module status, and the further
  // along problem status wins so a solve is never downgraded by a stale device.
  const rank = (s: ProblemStatus) => PROBLEM_STATUS_ORDER.indexOf(s);
  const problems = { ...local.problems };
  for (const [id, status] of Object.entries(remote.problems)) {
    const cur = problems[id];
    if (!cur || rank(status) > rank(cur)) problems[id] = status;
  }
  return { modules: { ...local.modules, ...remote.modules }, problems };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { session, client } = useAuth();
  const [state, setState] = useState<ProgressState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  // the account whose copy has been pulled and merged; nothing is pushed
  // before that, or an empty device would overwrite the saved progress
  const [pulledFor, setPulledFor] = useState<string | null>(null);
  const userId = session?.user?.id ?? null;
  const loadedFor = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // local storage is the always-available baseline
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // JSON.parse("null") and hand-edited storage must not reach the state
        if (isRecord(saved))
          setState({
            modules: isRecord(saved.modules) ? (saved.modules as ProgressState["modules"]) : {},
            problems: isRecord(saved.problems) ? (saved.problems as ProgressState["problems"]) : {},
          });
      }
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
      /* storage unavailable */
    }
  }, [state, ready]);

  // on sign-in, pull the account copy and merge it with what is on this device
  useEffect(() => {
    if (!client || !userId || !ready || loadedFor.current === userId) return;
    loadedFor.current = userId;
    setSyncing(true);
    Promise.resolve(
      client
        .from("progress")
        .select("modules, problems")
        .eq("user_id", userId)
        .maybeSingle()
    )
      .then(({ data, error }) => {
        // a failed read says nothing about what is saved, so keep pushes off
        // and let the next sign-in try again
        if (error) throw error;
        if (data) {
          setState((local) =>
            mergeProgress(local, {
              modules: data.modules ?? {},
              problems: data.problems ?? {},
            })
          );
        }
        setPulledFor(userId);
      })
      .catch(() => {
        loadedFor.current = null;
      })
      .then(() => setSyncing(false));
  }, [client, userId, ready]);

  // debounced push of any change to the account
  useEffect(() => {
    if (!client || !userId || !ready || pulledFor !== userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      client
        .from("progress")
        .upsert(
          {
            user_id: userId,
            modules: state.modules,
            problems: state.problems,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .then(() => {});
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, client, userId, ready, pulledFor]);

  useEffect(() => {
    if (!userId) {
      loadedFor.current = null;
      setPulledFor(null);
    }
  }, [userId]);

  const setModuleStatus = useCallback((slug: string, status: ModuleStatus) => {
    setState((s) => ({ ...s, modules: { ...s.modules, [slug]: status } }));
  }, []);

  const setProblem = useCallback((id: string, status: ProblemStatus) => {
    setState((s) => ({ ...s, problems: { ...s.problems, [id]: status } }));
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

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      synced: Boolean(userId) && pulledFor === userId,
      syncing,
      setModuleStatus,
      cycleProblem,
      setProblem,
      reset,
    }),
    [state, ready, userId, pulledFor, syncing, setModuleStatus, cycleProblem, setProblem, reset]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
