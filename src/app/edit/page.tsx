"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import BankProblem from "@/components/BankProblem";
import LessonEditor from "@/components/LessonEditor";
import { SimRunner } from "@/components/Sim";
import { useAuth } from "@/lib/auth";
import { useGitHub } from "@/lib/github-auth";
import { canEditCurriculum } from "@/lib/roles";
import type { Difficulty, Division, Module, Section } from "@/lib/curriculum";
import type { BankProblem as Problem, Origin } from "@/lib/problem-types";
import { DIFFICULTY_ORDER } from "@/lib/problem-types";
import { NEW_SIM, paramValues, type SimDef, type SimParam } from "@/lib/sims";

type Tab = "lessons" | "problems" | "sims" | "courses";

const NEW_LESSON = `## Setting up

Explain the idea in plain language first, then write the equation it leads to.
Inline math is $v = v_0 + at$; display math is set off on its own line:

$$x = v_0 t + \\tfrac12 a t^2$$

<Aside label="Worth remembering">
  Short, concrete notes belong here. Add \`warn\` for a mistake people make.
</Aside>

Available figures: <ProjectileSim />, <SpringSim />, <MotionGraphSim />,
<CollisionSim />
`;

interface Status {
  busy: boolean;
  note: string | null;
  prUrl?: string;
  error: string | null;
}
const IDLE: Status = { busy: false, note: null, error: null };

/** Every shape the content API can return. */
interface ApiResult {
  message?: string;
  prUrl?: string;
  slugs?: string[];
  content?: string;
  problems?: Problem[];
  curriculum?: Division[];
  sims?: SimDef[];
}

/** Authenticated fetch that carries the contributor's GitHub token. */
type Api = (input: string, init?: RequestInit) => Promise<ApiResult>;

const post = (api: Api, body: Record<string, unknown>) =>
  api("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const load = (api: Api, resource: string, extra = "") =>
  api(`/api/content?resource=${resource}${extra}`);

export default function EditPage() {
  const { profile } = useAuth();
  const gh = useGitHub();
  const [tab, setTab] = useState<Tab>("lessons");
  const mayCourses = canEditCurriculum(profile);

  if (!gh.ready)
    return (
      <Shell>
        <p className="text-[var(--ink-soft)]">Loading.</p>
      </Shell>
    );

  if (!gh.connected)
    return (
      <Shell>
        <p className="label">Editor</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">
          Write the guide
        </h1>
        <div className="prose mt-4">
          <p>
            Anyone can propose lessons and problems. Connect your GitHub account
            and your changes arrive as a pull request from you, which the
            maintainer reviews and merges. If you are not a collaborator, a fork
            is made for you automatically.
          </p>
        </div>

        {gh.device ? (
          <div className="aside mt-6">
            <span className="aside-label">Two steps</span>
            <p className="text-sm">
              Enter this code at{" "}
              <a
                href={gh.device.verificationUri}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                {gh.device.verificationUri.replace("https://", "")}
              </a>
              , then come back. Waiting for you to approve.
            </p>
            <p className="mono mt-3 text-2xl tracking-[0.25em] text-[var(--ink-strong)]">
              {gh.device.userCode}
            </p>
          </div>
        ) : (
          <button
            onClick={gh.connect}
            disabled={gh.connecting}
            className="btn mt-6"
          >
            {gh.connecting ? "Contacting GitHub." : "Connect GitHub"}
          </button>
        )}

        {gh.error && (
          <div className="aside warn mt-5">
            <span className="aside-label">Could not connect</span>
            <p className="text-sm">{gh.error}</p>
          </div>
        )}
      </Shell>
    );

  const tabs: [Tab, string, boolean][] = [
    ["lessons", "Lessons", true],
    ["problems", "Problems", true],
    ["sims", "Simulations", true],
    ["courses", "Courses", mayCourses],
  ];

  return (
    <Shell wide>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="label">Editor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">
            Write the guide
          </h1>
        </div>
        <p className="sans text-sm text-[var(--ink-soft)]">
          as @{gh.login}{" "}
          <button
            onClick={gh.disconnect}
            className="text-[var(--ink-faint)] underline underline-offset-2 hover:text-[var(--ink)]"
          >
            disconnect
          </button>
        </p>
      </div>
      <p className="mt-3 max-w-[36rem] text-[var(--ink-soft)]">
        Saving opens a pull request under your own GitHub account. Nothing goes
        live until it is merged, and the same files can be edited by a plain git
        push.
      </p>

      <div className="mt-7 flex gap-5 border-b border-[var(--rule-strong)]">
        {tabs
          .filter(([, , allowed]) => allowed)
          .map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`sans -mb-px border-b-2 pb-2 text-sm ${
                tab === key
                  ? "border-[var(--ink-strong)] font-medium text-[var(--ink-strong)]"
                  : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
            </button>
          ))}
      </div>

      <div className="mt-7">
        {tab === "lessons" && <Lessons api={gh.api} />}
        {tab === "problems" && <Problems api={gh.api} />}
        {tab === "sims" && <Sims api={gh.api} />}
        {tab === "courses" && mayCourses && <Courses api={gh.api} />}
      </div>
    </Shell>
  );
}

function Shell({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <Nav />
      <main className={`mx-auto px-6 pb-24 pt-10 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        {children}
      </main>
    </>
  );
}

function Banner({ s }: { s: Status }) {
  if (s.error)
    return (
      <div className="aside warn">
        <span className="aside-label">Could not save</span>
        <p className="break-words text-sm">{s.error}</p>
      </div>
    );
  if (s.note)
    return (
      <div className="aside">
        <span className="aside-label">Submitted</span>
        <p className="text-sm">
          {s.note}{" "}
          {s.prUrl && (
            <a href={s.prUrl} target="_blank" rel="noopener noreferrer" className="link">
              Review it on GitHub
            </a>
          )}
        </p>
      </div>
    );
  return null;
}

/* ------------------------------- lessons ------------------------------- */

function Lessons({ api }: { api: Api }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);

  const refresh = useCallback(async () => {
    try {
      const { slugs } = await load(api, "lessons");
      setSlugs(slugs ?? []);
    } catch (e) {
      setStatus({ ...IDLE, error: (e as Error).message });
    }
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const open = async (slug: string) => {
    try {
      const { content } = await load(api, "lesson", `&slug=${slug}`);
      setActive(slug);
      setText(content ?? "");
      setDirty(false);
      setStatus(IDLE);
    } catch (e) {
      setStatus({ ...IDLE, error: (e as Error).message });
    }
  };

  const submit = async (slug: string, content: string) => {
    setStatus({ ...IDLE, busy: true });
    try {
      const r = await post(api, { action: "saveLesson", slug, content });
      setStatus({ busy: false, note: r.message ?? null, prUrl: r.prUrl, error: null });
      setDirty(false);
      refresh();
    } catch (e) {
      setStatus({ ...IDLE, error: (e as Error).message });
    }
  };

  const create = async () => {
    const slug = prompt("New lesson slug (must match a module slug):")?.trim();
    if (!slug) return;
    await submit(slug, NEW_LESSON);
    setActive(slug);
    setText(NEW_LESSON);
  };

  const remove = async (slug: string) => {
    if (!confirm(`Propose deleting the lesson "${slug}"?`)) return;
    setStatus({ ...IDLE, busy: true });
    try {
      const r = await post(api, { action: "deleteLesson", slug });
      setStatus({ busy: false, note: r.message ?? null, prUrl: r.prUrl, error: null });
      if (active === slug) {
        setActive(null);
        setText("");
      }
      refresh();
    } catch (e) {
      setStatus({ ...IDLE, error: (e as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="lg:w-48 lg:shrink-0">
        <div className="flex items-baseline justify-between">
          <span className="label">Lessons</span>
          <button onClick={create} className="sans text-sm text-[var(--accent)]">
            New
          </button>
        </div>
        <ul className="mt-3 space-y-1">
          {slugs.map((s) => (
            <li key={s} className="group flex items-center gap-2">
              <button
                onClick={() => open(s)}
                className={`sans min-w-0 flex-1 truncate text-left text-sm ${
                  active === s
                    ? "font-medium text-[var(--ink-strong)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {s}
              </button>
              <button
                onClick={() => remove(s)}
                className="text-xs text-[var(--ink-faint)] opacity-0 hover:text-[var(--bad)] group-hover:opacity-100"
                title={`Delete ${s}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        <Banner s={status} />
        {active ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="mono text-sm text-[var(--ink-strong)]">
                {active}.mdx {dirty && <em className="text-[var(--warn)]">edited</em>}
              </span>
              <Link href={`/guide/${active}`} target="_blank" className="link sans text-sm">
                Preview page
              </Link>
            </div>
            <LessonEditor
              value={text}
              onChange={(v) => {
                setText(v);
                setDirty(true);
              }}
            />
            <button
              onClick={() => submit(active, text)}
              disabled={status.busy || !dirty}
              className="btn"
            >
              {status.busy ? "Opening pull request." : "Propose change"}
            </button>
          </>
        ) : (
          <p className="text-[var(--ink-soft)]">Pick a lesson, or start a new one.</p>
        )}
      </section>
    </div>
  );
}

/* ------------------------------- problems ------------------------------ */

const ORIGINS: Origin[] = ["original", "exam", "textbook"];

function Problems({ api }: { api: Api }) {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [{ problems }, { curriculum }] = await Promise.all([
          load(api, "problems"),
          load(api, "curriculum"),
        ]);
        setProblems(problems ?? []);
        setModules(
          (curriculum ?? []).flatMap((d) =>
            d.sections.flatMap((s) => s.modules.map((m) => m.slug))
          )
        );
      } catch (e) {
        setStatus({ ...IDLE, error: (e as Error).message });
      }
    })();
  }, [api]);

  const update = (patch: Partial<Problem>) => {
    if (selected === null) return;
    setProblems((ps) =>
      ps!.map((p, i) => (i === selected ? { ...p, ...patch } : p))
    );
    setDirty(true);
  };

  const add = () => {
    const fresh: Problem = {
      id: `orig-${Date.now().toString(36)}`,
      name: "Untitled problem",
      module: modules[0] ?? "",
      difficulty: "Normal",
      tags: [],
      starred: false,
      origin: "original",
      source: "USAPhO Guide",
      statement: "",
      answer: 0,
      unit: "",
      solution: "",
    };
    setProblems((ps) => [...(ps ?? []), fresh]);
    setSelected((problems?.length ?? 0));
    setDirty(true);
  };

  const save = async () => {
    setStatus({ ...IDLE, busy: true });
    try {
      const r = await post(api, { action: "saveProblems", problems });
      setStatus({ busy: false, note: r.message ?? null, prUrl: r.prUrl, error: null });
      setDirty(false);
    } catch (e) {
      setStatus({ ...IDLE, error: (e as Error).message });
    }
  };

  if (!problems)
    return <Banner s={status} />;

  const shown = problems
    .map((p, i) => ({ p, i }))
    .filter(({ p }) =>
      filter
        ? (p.name + p.module + p.source).toLowerCase().includes(filter.toLowerCase())
        : true
    );
  const current = selected !== null ? problems[selected] : null;

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="flex items-baseline justify-between">
          <span className="label">{problems.length} problems</span>
          <button onClick={add} className="sans text-sm text-[var(--accent)]">
            New
          </button>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter"
          className="mt-2 w-full"
        />
        <ul className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto pr-1">
          {shown.map(({ p, i }) => (
            <li key={p.id}>
              <button
                onClick={() => setSelected(i)}
                className={`sans w-full truncate text-left text-sm ${
                  selected === i
                    ? "font-medium text-[var(--ink-strong)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {p.name}
                <span className="ml-1 text-xs text-[var(--ink-faint)]">
                  {p.origin === "original" ? "" : "ref"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="min-w-0 flex-1 space-y-5">
        <Banner s={status} />
        {!current ? (
          <p className="text-[var(--ink-soft)]">
            Pick a problem to edit, or write a new one.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={current.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full"
                />
              </Field>
              <Field label="Module">
                <select
                  value={current.module}
                  onChange={(e) => update({ module: e.target.value })}
                  className="w-full"
                >
                  {modules.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Difficulty">
                <select
                  value={current.difficulty}
                  onChange={(e) =>
                    update({ difficulty: e.target.value as Difficulty })
                  }
                  className="w-full"
                >
                  {DIFFICULTY_ORDER.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Source type">
                <select
                  value={current.origin}
                  onChange={(e) => update({ origin: e.target.value as Origin })}
                  className="w-full"
                >
                  {ORIGINS.map((o) => (
                    <option key={o} value={o}>
                      {o === "original" ? "Written here" : o === "exam" ? "Past exam" : "Textbook"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Citation">
                <input
                  value={current.source}
                  onChange={(e) => update({ source: e.target.value })}
                  placeholder="F=ma 2019 Problem 12"
                  className="w-full"
                />
              </Field>
              <Field label="Tags (comma separated)">
                <input
                  value={current.tags.join(", ")}
                  onChange={(e) =>
                    update({
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  className="w-full"
                />
              </Field>
            </div>

            <Field label="Statement (supports $math$, **bold**, *italic*)">
              <textarea
                value={current.statement}
                onChange={(e) => update({ statement: e.target.value })}
                className="h-28 w-full"
              />
            </Field>

            <div className="flex flex-wrap items-end gap-4">
              <Field label="Answer">
                <input
                  type="number"
                  value={current.answer ?? ""}
                  onChange={(e) =>
                    update({
                      answer: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="w-28"
                />
              </Field>
              <Field label="Unit">
                <input
                  value={current.unit}
                  onChange={(e) => update({ unit: e.target.value })}
                  className="w-24"
                />
              </Field>
              <label className="sans flex items-center gap-2 pb-2 text-sm text-[var(--ink-soft)]">
                <input
                  type="checkbox"
                  checked={current.starred}
                  onChange={(e) => update({ starred: e.target.checked })}
                />
                Start here
              </label>
              <button
                onClick={() => {
                  setProblems((ps) => ps!.filter((_, i) => i !== selected));
                  setSelected(null);
                  setDirty(true);
                }}
                className="sans pb-2 text-sm text-[var(--ink-faint)] hover:text-[var(--bad)]"
              >
                Delete problem
              </button>
            </div>

            <Field label="Solution">
              <textarea
                value={current.solution}
                onChange={(e) => update({ solution: e.target.value })}
                className="h-32 w-full"
              />
            </Field>

            {/* live preview, exactly as students will see it */}
            <div>
              <p className="label mb-2">Preview</p>
              <div className="border-t border-[var(--rule-strong)]">
                <BankProblem problem={current} />
              </div>
            </div>

            <button onClick={save} disabled={status.busy || !dirty} className="btn">
              {status.busy ? "Opening pull request." : "Propose change"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

/* ------------------------------- courses ------------------------------- */

function Courses({ api }: { api: Api }) {
  const [courses, setCourses] = useState<Division[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);

  useEffect(() => {
    load(api, "curriculum")
      .then(({ curriculum }) => setCourses(curriculum ?? []))
      .catch((e) => setStatus({ ...IDLE, error: e.message }));
  }, [api]);

  const mutate = (fn: (draft: Division[]) => void) => {
    setCourses((c) => {
      const draft = JSON.parse(JSON.stringify(c)) as Division[];
      fn(draft);
      return draft;
    });
    setDirty(true);
  };

  const save = async () => {
    setStatus({ ...IDLE, busy: true });
    try {
      const r = await post(api, { action: "saveCurriculum", curriculum: courses });
      setStatus({ busy: false, note: r.message ?? null, prUrl: r.prUrl, error: null });
      setDirty(false);
    } catch (e) {
      setStatus({ ...IDLE, error: (e as Error).message });
    }
  };

  if (!courses) return <Banner s={status} />;

  return (
    <div className="space-y-6">
      <Banner s={status} />
      <p className="max-w-[36rem] text-sm text-[var(--ink-soft)]">
        Courses are the top level of the guide (F=ma, USAPhO, and any you add).
        Each holds sections, and each section holds modules. A module gets a
        lesson when an MDX file with the same slug exists.
      </p>

      {courses.map((course, ci) => (
        <div key={ci} className="border-t border-[var(--rule-strong)] pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Course name">
              <input
                value={course.name}
                onChange={(e) => mutate((d) => { d[ci].name = e.target.value; })}
              />
            </Field>
            <Field label="id">
              <input
                value={course.id}
                onChange={(e) => mutate((d) => { d[ci].id = e.target.value; })}
                className="w-28"
              />
            </Field>
            <Field label="Tagline">
              <input
                value={course.tagline}
                onChange={(e) => mutate((d) => { d[ci].tagline = e.target.value; })}
                className="w-72"
              />
            </Field>
            <button
              onClick={() => {
                if (confirm(`Remove the course "${course.name}" and all its modules?`))
                  mutate((d) => { d.splice(ci, 1); });
              }}
              className="sans pb-2 text-sm text-[var(--ink-faint)] hover:text-[var(--bad)]"
            >
              Remove course
            </button>
          </div>

          <div className="mt-4 space-y-4 pl-4">
            {course.sections.map((section, si) => (
              <div key={si}>
                <div className="flex items-center gap-3">
                  <input
                    value={section.title}
                    onChange={(e) =>
                      mutate((d) => { d[ci].sections[si].title = e.target.value; })
                    }
                    className="font-medium"
                  />
                  <button
                    onClick={() => mutate((d) => { d[ci].sections.splice(si, 1); })}
                    className="sans text-xs text-[var(--ink-faint)] hover:text-[var(--bad)]"
                  >
                    remove section
                  </button>
                </div>
                <ul className="mt-2 space-y-1 pl-4">
                  {section.modules.map((m, mi) => (
                    <li key={mi} className="flex flex-wrap items-center gap-2">
                      <input
                        value={m.title}
                        onChange={(e) =>
                          mutate((d) => { d[ci].sections[si].modules[mi].title = e.target.value; })
                        }
                        className="w-52"
                      />
                      <input
                        value={m.slug}
                        onChange={(e) =>
                          mutate((d) => { d[ci].sections[si].modules[mi].slug = e.target.value; })
                        }
                        className="mono w-44 text-xs"
                      />
                      <button
                        onClick={() =>
                          mutate((d) => { d[ci].sections[si].modules.splice(mi, 1); })
                        }
                        className="sans text-xs text-[var(--ink-faint)] hover:text-[var(--bad)]"
                      >
                        remove
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() =>
                        mutate((d) => {
                          d[ci].sections[si].modules.push({
                            slug: `new-module-${Date.now().toString(36)}`,
                            title: "New module",
                            description: "",
                            frequency: 2,
                            minutes: 30,
                            problems: [],
                          } as unknown as Module);
                        })
                      }
                      className="sans text-sm text-[var(--accent)]"
                    >
                      Add module
                    </button>
                  </li>
                </ul>
              </div>
            ))}
            <button
              onClick={() =>
                mutate((d) => {
                  d[ci].sections.push({
                    id: `section-${Date.now().toString(36)}`,
                    title: "New section",
                    modules: [],
                  } as Section);
                })
              }
              className="sans text-sm text-[var(--accent)]"
            >
              Add section
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-4 border-t border-[var(--rule-strong)] pt-4">
        <button
          onClick={() =>
            mutate((d) => {
              d.push({
                id: `course-${Date.now().toString(36)}`,
                label: String(d.length + 1),
                name: "New course",
                tagline: "",
                accent: "var(--accent)",
                sections: [],
              } as Division);
            })
          }
          className="btn-plain"
        >
          Add course
        </button>
        <button onClick={save} disabled={status.busy || !dirty} className="btn">
          {status.busy ? "Opening pull request." : "Propose change"}
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- sims -------------------------------- */

const DRAW_REFERENCE = `ctx   canvas context, already scaled for the display
p     slider values, e.g. p.speed
t     seconds since the sim started
W, H  canvas size in pixels
C     colours: C.ink C.rule C.accent C.figure C.faint C.paper
out   set out.note = "..." for a readout above the canvas`;

function Sims({ api }: { api: Api }) {
  const [sims, setSims] = useState<SimDef[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);

  useEffect(() => {
    load(api, "sims")
      .then(({ sims }) => setSims(sims ?? []))
      .catch((e) => setStatus({ ...IDLE, error: (e as Error).message }));
  }, [api]);

  const current = sims && selected !== null ? sims[selected] : null;

  const pick = (i: number) => {
    setSelected(i);
    setValues(paramValues(sims![i].params));
  };

  const update = (patch: Partial<SimDef>) => {
    if (selected === null) return;
    setSims((list) => list!.map((s, i) => (i === selected ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const updateParam = (pi: number, patch: Partial<SimParam>) => {
    if (!current) return;
    const params = current.params.map((p, i) => (i === pi ? { ...p, ...patch } : p));
    update({ params });
    if (patch.key || patch.value !== undefined) setValues(paramValues(params));
  };

  const addSim = () => {
    const id = prompt("Id for the new simulation (lowercase, hyphens):")?.trim();
    if (!id) return;
    const fresh = NEW_SIM(id);
    setSims((list) => [...(list ?? []), fresh]);
    setSelected((sims?.length ?? 0));
    setValues(paramValues(fresh.params));
    setDirty(true);
  };

  const save = async () => {
    setStatus({ ...IDLE, busy: true });
    try {
      const r = await post(api, { action: "saveSims", sims });
      setStatus({ busy: false, note: r.message ?? null, prUrl: r.prUrl, error: null });
      setDirty(false);
    } catch (e) {
      setStatus({ ...IDLE, error: (e as Error).message });
    }
  };

  if (!sims) return <Banner s={status} />;

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="lg:w-48 lg:shrink-0">
        <div className="flex items-baseline justify-between">
          <span className="label">{sims.length} simulations</span>
          <button onClick={addSim} className="sans text-sm text-[var(--accent)]">
            New
          </button>
        </div>
        <ul className="mt-3 space-y-1">
          {sims.map((s, i) => (
            <li key={s.id}>
              <button
                onClick={() => pick(i)}
                className={`sans w-full truncate text-left text-sm ${
                  selected === i
                    ? "font-medium text-[var(--ink-strong)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="min-w-0 flex-1 space-y-5">
        <Banner s={status} />
        {!current ? (
          <p className="text-[var(--ink-soft)]">
            Pick a simulation to edit, or start a new one. Use it in a lesson
            with <code>&lt;Sim id=&quot;{sims[0]?.id ?? "your-id"}&quot; /&gt;</code>.
          </p>
        ) : (
          <>
            {/* live preview, exactly what a reader sees */}
            <div className="border-y border-[var(--rule)] py-4">
              <SimRunner def={current} values={values} onValues={setValues} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Title">
                <input
                  value={current.title}
                  onChange={(e) => update({ title: e.target.value })}
                  className="w-full"
                />
              </Field>
              <Field label="Id (used in lessons)">
                <input
                  value={current.id}
                  onChange={(e) => update({ id: e.target.value })}
                  className="mono w-full text-xs"
                />
              </Field>
              <Field label="Height (px)">
                <input
                  type="number"
                  value={current.height}
                  onChange={(e) => update({ height: Number(e.target.value) })}
                  className="w-full"
                />
              </Field>
            </div>

            <Field label="Caption">
              <input
                value={current.caption}
                onChange={(e) => update({ caption: e.target.value })}
                className="w-full"
              />
            </Field>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="label">Sliders</span>
                <button
                  onClick={() =>
                    update({
                      params: [
                        ...current.params,
                        { key: `p${current.params.length + 1}`, label: "New slider", unit: "", min: 0, max: 10, step: 1, value: 5 },
                      ],
                    })
                  }
                  className="sans text-sm text-[var(--accent)]"
                >
                  Add slider
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {current.params.map((param, pi) => (
                  <div key={pi} className="flex flex-wrap items-center gap-2">
                    <input
                      value={param.key}
                      onChange={(e) => updateParam(pi, { key: e.target.value })}
                      className="mono w-24 text-xs"
                      title="Name used in the code as p.key"
                    />
                    <input
                      value={param.label}
                      onChange={(e) => updateParam(pi, { label: e.target.value })}
                      className="w-40"
                      title="Label shown to readers"
                    />
                    <input
                      value={param.unit}
                      onChange={(e) => updateParam(pi, { unit: e.target.value })}
                      className="w-16"
                      title="Unit"
                    />
                    {(["min", "max", "step", "value"] as const).map((f) => (
                      <input
                        key={f}
                        type="number"
                        value={param[f]}
                        onChange={(e) => updateParam(pi, { [f]: Number(e.target.value) })}
                        className="w-20"
                        title={f === "value" ? "Starting value" : f}
                      />
                    ))}
                    <button
                      onClick={() =>
                        update({ params: current.params.filter((_, i) => i !== pi) })
                      }
                      className="sans text-xs text-[var(--ink-faint)] hover:text-[var(--bad)]"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Draw one frame">
              <textarea
                value={current.draw}
                onChange={(e) => update({ draw: e.target.value })}
                spellCheck={false}
                className="mono h-72 w-full text-[13px] leading-relaxed"
              />
            </Field>
            <pre className="mono whitespace-pre-wrap border-l-2 border-[var(--rule-strong)] pl-3 text-xs text-[var(--ink-soft)]">
              {DRAW_REFERENCE}
            </pre>

            <div className="flex flex-wrap gap-4">
              <button onClick={save} disabled={status.busy || !dirty} className="btn">
                {status.busy ? "Opening pull request." : "Propose change"}
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Remove the simulation "${current.title}"?`)) return;
                  setSims((list) => list!.filter((_, i) => i !== selected));
                  setSelected(null);
                  setDirty(true);
                }}
                className="sans text-sm text-[var(--ink-faint)] hover:text-[var(--bad)]"
              >
                Delete simulation
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
