# USAPhO Guide — setup

A free physics-olympiad curriculum site: MDX lessons with interactive sims,
practice problems you can solve in the browser, local progress tracking, an
AI + Manim video engine, and a git-backed content editor with Supabase auth.

## 1. Run the site

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

The site works with no configuration at all — auth, the editor, and the video
lab simply present themselves as unavailable until you configure them.

## 2. Supabase auth (accounts + contributor roles)

1. Create a project at [supabase.com](https://supabase.com).
2. Project Settings → API: copy the **Project URL** and the **anon public** key
   into `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. SQL Editor → paste and run [`supabase/schema.sql`](supabase/schema.sql).
   That creates the `profiles` table, row-level security, and a trigger that
   makes a profile row for every new signup.
4. Restart `npm run dev`, then sign up at `/login`.

### Granting writer roles

Roles live in `profiles.roles` and can only be changed from Supabase (RLS
blocks users from promoting themselves). In the SQL editor:

```sql
update public.profiles set roles = '{course_writer}'  where email = 'them@example.com';
update public.profiles set roles = '{problem_writer}' where email = 'them@example.com';
update public.profiles set roles = '{admin}'          where email = 'you@example.com';
```

| Role | Can do |
|---|---|
| `course_writer` | Write and edit lesson MDX; add and delete lessons |
| `problem_writer` | Edit the practice problem set on any module |
| `admin` | Everything, including the curriculum structure |

## 3. The content editor (git-backed)

Set `CONTENT_EDITING=on` in `.env.local`. Sign in as a writer and open
`/edit`.

Every save writes the real file in `src/content/` and makes a git commit
authored as the editor. If the repo has a remote, it pushes too; if the push
fails, the edit is still committed locally and the UI says so.

Because content is just files, the same edits can arrive by `git push` — the
editor and git are two doors into the same content.

**Only enable this where the git checkout lives** (your machine or a VM you
control). On Vercel the filesystem is read-only and ephemeral, so leave
`CONTENT_EDITING` unset there; the editor will explain that it is disabled.

## 4. Content layout

```
src/content/
├── curriculum.json      # divisions → sections → modules → problems
└── lessons/
    ├── <slug>.mdx       # one lesson per module slug; auto-registered
    └── README.md        # authoring reference (components, math, problems)
```

- Add a lesson: create `src/content/lessons/<slug>.mdx` where `<slug>` matches a
  module in `curriculum.json`. No registry to update.
- Remove a lesson: delete the file. The module page falls back to its problem
  table.
- Lessons can use `$math$`, `<Callout>`, `<QuickCheck>`, `<Problem>` and the
  sims (`<ProjectileSim />`, `<SpringSim />`, `<MotionGraphSim />`,
  `<CollisionSim />`) with no imports. See
  [`src/content/lessons/README.md`](src/content/lessons/README.md).

## 5. Video lab (AI + Manim)

```bash
cd engine
python3.13 -m venv .venv
.venv/bin/pip install manim fastapi "uvicorn[standard]" anthropic
export ANTHROPIC_API_KEY=sk-ant-...
.venv/bin/uvicorn main:app --port 8100
```

Then open `/studio`. Claude writes a Manim scene for the prompt, the code is
safety-scanned, rendered, and streamed back. Set `NEXT_PUBLIC_ENGINE_URL` if
the engine runs somewhere other than `localhost:8100`.

Note: the engine executes AI-generated Python. The AST scan blocks imports and
calls outside `manim`/`math`/`numpy`, but treat it as a trusted-operator tool,
not a public endpoint.

## 6. Deploy

```bash
vercel deploy --prod -y
```

Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the
Vercel project's environment variables so auth works in production. Leave
`CONTENT_EDITING` unset there and edit content locally (or via git push),
which redeploys automatically if the repo is connected.

## Themes

Light and dark, following the system preference by default, toggled from the
header and remembered per browser.
