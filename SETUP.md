# USAPhO Guide — setup

A physics-olympiad course site: MDX lessons with interactive figures, a
problem bank you can work through in the browser, progress that follows your
account, and an editor that proposes content changes as pull requests.

## 1. Run the site

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

The site runs with no configuration; accounts and the editor announce
themselves as unavailable until you configure them.

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

## 3. The editor (opens pull requests)

Writers edit at `/edit` on the live site. Saving does not write to `main`: it
creates a branch, commits the change, and opens a pull request for the
maintainer to review and merge. The same files can also be edited by a normal
`git push`, so the editor and git are two doors into one repository.

This needs a GitHub token on the server:

1. Create a **fine-grained personal access token** at
   [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens/new).
   Scope it to **only this repository**, with these permissions:
   - Contents: **Read and write**
   - Pull requests: **Read and write**
2. Store it. The helper script verifies the token has the right access, then
   writes `.env.local` and sets the Vercel variable:

   ```bash
   ./scripts/set-github-token.sh
   ```

   Or set `GITHUB_REPO` and `GITHUB_TOKEN` by hand in `.env.local` and in the
   Vercel project settings.

Use a fine-grained token rather than a classic one: a classic `repo` token
grants write access to every repository you own, and this one only needs two
permissions on one repo.

## 4. Content layout

```
src/content/
├── curriculum.json   # courses -> sections -> modules
├── problems.json     # the problem bank, with provenance per problem
└── lessons/
    ├── <slug>.mdx    # one lesson per module slug, auto-registered
    └── README.md     # authoring reference
```

- Add a lesson: create `src/content/lessons/<slug>.mdx` where `<slug>` matches a
  module in `curriculum.json`. Nothing else to register.
- Remove a lesson: delete the file. The module keeps its problems.
- Lessons can use `$math$`, `<Aside>`, `<Figure>`, `<QuickCheck>` and the
  figures (`<ProjectileSim />`, `<SpringSim />`, `<MotionGraphSim />`,
  `<CollisionSim />`) without imports.

### Problems and attribution

Each problem carries an `origin`:

- `original` — written for this guide, with a statement, numeric answer and
  solution, solvable inline and answer-checked.
- `exam` / `textbook` — a real F=ma, USAPhO, IPhO or textbook problem. These
  are cited and linked, not reproduced, so the copyright stays with the
  original publisher.

Both kinds appear in `/problems` and on module pages; only originals can be
answered on the site.

## 5. Progress

Progress is kept in the browser for signed-out readers. Signing in merges that
local progress with the copy stored in the `progress` table and keeps the two
in sync from then on, so it follows the account across devices.

## 6. Deploy

```bash
vercel deploy --prod -y
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GITHUB_REPO`
and `GITHUB_TOKEN` in the Vercel project so accounts and the editor work in
production. Connect the repository to Vercel and merging a content pull
request redeploys the site on its own.

## Themes

Light and dark, following the system preference by default, toggled from the
header and remembered per browser.
