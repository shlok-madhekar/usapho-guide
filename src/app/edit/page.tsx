"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth";
import { canEditLessons, canEditProblems } from "@/lib/roles";
import type { Difficulty, Division, Problem } from "@/lib/curriculum";

const DIFFICULTIES: Difficulty[] = ["Easy", "Normal", "Hard", "Very Hard", "Insane"];

const NEW_LESSON_TEMPLATE = `## Section heading

Write the explanation here. Inline math is $v = v_0 + at$ and display math looks
like this:

$$x = v_0 t + \\tfrac12 a t^2$$

<Callout label="Pro tip">
  Callouts highlight an insight. Add \`warn\` for an olympiad trap.
</Callout>

Interactive sims available: <ProjectileSim />, <SpringSim />,
<MotionGraphSim />, <CollisionSim />

## Solve it here

<Problem id="np-CHANGEME-1" number={1} title="Problem name" difficulty="Normal" answer={42} unit="m">
  Statement of the problem.

  <Hint>A nudge in the right direction.</Hint>
  <Solution>
    The worked solution.
  </Solution>
</Problem>
`;

type Tab = "lessons" | "problems";

interface SaveState {
  busy: boolean;
  message: string | null;
  error: string | null;
}

export default function EditPage() {
  const { ready, configured, session, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("lessons");

  const mayLessons = canEditLessons(profile);
  const mayProblems = canEditProblems(profile);

  useEffect(() => {
    if (!mayLessons && mayProblems) setTab("problems");
  }, [mayLessons, mayProblems]);

  if (!ready) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-5 py-20 text-[var(--text-dim)]">
          Loading…
        </main>
      </>
    );
  }

  if (!configured || !session) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-5 py-20">
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">
            Content editor
          </h1>
          <p className="mt-3 text-[var(--text-dim)]">
            {configured ? (
              <>
                <Link href="/login" className="text-link">
                  Sign in
                </Link>{" "}
                with a writer account to edit the guide.
              </>
            ) : (
              "Supabase is not configured on this deployment. See SETUP.md."
            )}
          </p>
        </main>
      </>
    );
  }

  if (!mayLessons && !mayProblems) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-5 py-20">
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">
            No writer role yet
          </h1>
          <p className="mt-3 text-[var(--text-dim)]">
            Your account needs the course writer or problem writer role. See{" "}
            <Link href="/account" className="text-link">
              your account page
            </Link>{" "}
            for what each role does.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">
              Content editor
            </h1>
            <p className="mt-1 text-sm text-[var(--text-dim)]">
              Every save writes the file and commits it to git, so edits can also
              arrive by plain git push.
            </p>
          </div>
          <div className="flex rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-0.5">
            {mayLessons && (
              <button
                onClick={() => setTab("lessons")}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  tab === "lessons"
                    ? "border border-[var(--line)] bg-[var(--panel)] font-medium text-[var(--text-strong)]"
                    : "text-[var(--text-dim)]"
                }`}
              >
                Lessons
              </button>
            )}
            {mayProblems && (
              <button
                onClick={() => setTab("problems")}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  tab === "problems"
                    ? "border border-[var(--line)] bg-[var(--panel)] font-medium text-[var(--text-strong)]"
                    : "text-[var(--text-dim)]"
                }`}
              >
                Problem sets
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          {tab === "lessons" ? <LessonEditor /> : <ProblemEditor />}
        </div>
      </main>
    </>
  );
}

function SaveBanner({ state }: { state: SaveState }) {
  if (state.error)
    return (
      <div className="callout warn">
        <div className="callout-label">Save failed</div>
        <p className="break-words text-sm">{state.error}</p>
      </div>
    );
  if (state.message)
    return (
      <div className="callout">
        <div className="callout-label">Saved</div>
        <p className="text-sm">{state.message}</p>
      </div>
    );
  return null;
}

function LessonEditor() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [state, setState] = useState<SaveState>({
    busy: false,
    message: null,
    error: null,
  });

  const loadList = useCallback(async () => {
    const res = await fetch("/api/content/lessons");
    const data = await res.json();
    if (!res.ok) {
      setState((s) => ({ ...s, error: data.error }));
      return;
    }
    setSlugs(data.slugs);
    return data.slugs as string[];
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const open = async (slug: string) => {
    const res = await fetch(`/api/content/lessons?slug=${slug}`);
    const data = await res.json();
    if (!res.ok) {
      setState({ busy: false, message: null, error: data.error });
      return;
    }
    setActive(slug);
    setContent(data.content);
    setDirty(false);
    setState({ busy: false, message: null, error: null });
  };

  const save = async () => {
    if (!active) return;
    setState({ busy: true, message: null, error: null });
    const res = await fetch("/api/content/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: active, content, message: commitMsg }),
    });
    const data = await res.json();
    if (!res.ok) setState({ busy: false, message: null, error: data.error });
    else {
      setState({ busy: false, message: data.message, error: null });
      setDirty(false);
      setCommitMsg("");
      loadList();
    }
  };

  const createLesson = async () => {
    const slug = prompt("New lesson slug (must match a module slug, e.g. circular-motion):");
    if (!slug) return;
    setState({ busy: true, message: null, error: null });
    const res = await fetch("/api/content/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug.trim(),
        content: NEW_LESSON_TEMPLATE,
        message: `feat: add lesson ${slug.trim()}`,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setState({ busy: false, message: null, error: data.error });
    setState({ busy: false, message: data.message, error: null });
    await loadList();
    open(slug.trim());
  };

  const removeLesson = async (slug: string) => {
    if (!confirm(`Delete the lesson "${slug}"? This commits the removal to git.`))
      return;
    setState({ busy: true, message: null, error: null });
    const res = await fetch(`/api/content/lessons?slug=${slug}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setState({ busy: false, message: null, error: data.error });
    setState({ busy: false, message: data.message, error: null });
    if (active === slug) {
      setActive(null);
      setContent("");
    }
    loadList();
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-strong)]">
            Lessons ({slugs.length})
          </h2>
          <button
            onClick={createLesson}
            className="text-sm text-[var(--link)] hover:underline"
          >
            + New
          </button>
        </div>
        <ul className="mt-3 space-y-0.5">
          {slugs.map((s) => (
            <li key={s} className="group flex items-center gap-1">
              <button
                onClick={() => open(s)}
                className={`min-w-0 flex-1 truncate rounded-lg px-2.5 py-1.5 text-left text-sm ${
                  active === s
                    ? "bg-[var(--panel-2)] font-medium text-[var(--text-strong)]"
                    : "text-[var(--text-dim)] hover:bg-[var(--panel-2)]"
                }`}
              >
                {s}
              </button>
              <button
                onClick={() => removeLesson(s)}
                title={`Delete ${s}`}
                className="px-1 text-xs text-[var(--ink-faint)] opacity-0 transition-opacity hover:text-[var(--diff-insane)] group-hover:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        <SaveBanner state={state} />
        {active ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <code className="text-sm text-[var(--text-strong)]">
                  {active}.mdx
                </code>
                {dirty && (
                  <span className="text-xs text-[var(--status-practicing)]">
                    unsaved
                  </span>
                )}
              </div>
              <Link
                href={`/guide/${active}`}
                target="_blank"
                className="text-sm text-[var(--link)] hover:underline"
              >
                Preview page ↗
              </Link>
            </div>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setDirty(true);
              }}
              spellCheck={false}
              className="h-[60vh] w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-[var(--link)]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder={`content: update lesson ${active}`}
                className="min-w-0 flex-1 rounded-lg border border-[var(--line-bright)] px-3 py-2 text-sm outline-none focus:border-[var(--link)]"
              />
              <button
                onClick={save}
                disabled={state.busy || !dirty}
                className="rounded-lg bg-[var(--link)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {state.busy ? "Saving…" : "Save & commit"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-[var(--text-dim)]">
            Pick a lesson to edit, or create a new one.
          </p>
        )}
      </section>
    </div>
  );
}

function ProblemEditor() {
  const [curriculum, setCurriculum] = useState<Division[] | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<SaveState>({
    busy: false,
    message: null,
    error: null,
  });

  useEffect(() => {
    fetch("/api/content/curriculum")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setCurriculum(d.curriculum);
      })
      .catch((e) => setState({ busy: false, message: null, error: e.message }));
  }, []);

  const modules = (curriculum ?? []).flatMap((d) =>
    d.sections.flatMap((s) => s.modules.map((m) => ({ ...m, division: d.name })))
  );

  const select = (s: string) => {
    const mod = modules.find((m) => m.slug === s);
    setSlug(s);
    setProblems(mod ? JSON.parse(JSON.stringify(mod.problems)) : []);
    setDirty(false);
  };

  const update = (i: number, patch: Partial<Problem>) => {
    setProblems((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
    setDirty(true);
  };

  const addProblem = () => {
    setProblems((ps) => [
      ...ps,
      {
        id: `${slug}-${Date.now().toString(36)}`,
        source: "",
        name: "",
        difficulty: "Normal",
        tags: [],
      },
    ]);
    setDirty(true);
  };

  const save = async () => {
    if (!slug) return;
    setState({ busy: true, message: null, error: null });
    const res = await fetch("/api/content/curriculum", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, problems }),
    });
    const data = await res.json();
    if (!res.ok) setState({ busy: false, message: null, error: data.error });
    else {
      setState({ busy: false, message: data.message, error: null });
      setDirty(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <h2 className="text-sm font-semibold text-[var(--text-strong)]">Modules</h2>
        <ul className="mt-3 space-y-0.5">
          {modules.map((m) => (
            <li key={m.slug}>
              <button
                onClick={() => select(m.slug)}
                className={`w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm ${
                  slug === m.slug
                    ? "bg-[var(--panel-2)] font-medium text-[var(--text-strong)]"
                    : "text-[var(--text-dim)] hover:bg-[var(--panel-2)]"
                }`}
              >
                {m.title}
                <span className="ml-1 text-xs text-[var(--ink-faint)]">
                  ({m.problems.length})
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        <SaveBanner state={state} />
        {!slug ? (
          <p className="text-[var(--text-dim)]">
            Pick a module to edit its practice problem list.
          </p>
        ) : (
          <>
            {problems.map((p, i) => (
              <div key={i} className="panel space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--text-dim)]">
                      Source
                    </span>
                    <input
                      value={p.source}
                      onChange={(e) => update(i, { source: e.target.value })}
                      placeholder="F=ma 2019/12"
                      className="mt-1 w-full rounded-lg border border-[var(--line-bright)] px-3 py-1.5 text-sm outline-none focus:border-[var(--link)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--text-dim)]">
                      Name
                    </span>
                    <input
                      value={p.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[var(--line-bright)] px-3 py-1.5 text-sm outline-none focus:border-[var(--link)]"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--text-dim)]">
                      Difficulty
                    </span>
                    <select
                      value={p.difficulty}
                      onChange={(e) =>
                        update(i, { difficulty: e.target.value as Difficulty })
                      }
                      className="mt-1 block rounded-lg border border-[var(--line-bright)] px-2 py-1.5 text-sm"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 flex-1">
                    <span className="text-xs font-medium text-[var(--text-dim)]">
                      Tags (comma separated)
                    </span>
                    <input
                      value={(p.tags ?? []).join(", ")}
                      onChange={(e) =>
                        update(i, {
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--line-bright)] px-3 py-1.5 text-sm outline-none focus:border-[var(--link)]"
                    />
                  </label>
                  <label className="flex items-center gap-2 pb-1.5 text-sm text-[var(--text-dim)]">
                    <input
                      type="checkbox"
                      checked={Boolean(p.starred)}
                      onChange={(e) => update(i, { starred: e.target.checked })}
                    />
                    Essential
                  </label>
                  <button
                    onClick={() => {
                      setProblems((ps) => ps.filter((_, j) => j !== i));
                      setDirty(true);
                    }}
                    className="pb-1.5 text-sm text-[var(--ink-faint)] hover:text-[var(--diff-insane)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={addProblem}
                className="rounded-lg border border-[var(--line-bright)] px-3 py-2 text-sm hover:bg-[var(--panel-2)]"
              >
                + Add problem
              </button>
              <button
                onClick={save}
                disabled={state.busy || !dirty}
                className="rounded-lg bg-[var(--link)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {state.busy ? "Saving…" : "Save & commit"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
