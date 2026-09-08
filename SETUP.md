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

Contribution is open: anyone with a GitHub account can write lessons,
problems and simulations from `/edit`, because those changes are gated by
pull request review rather than by a role. Roles cover what review cannot:

| Role | Adds |
|---|---|
| `admin` | May change the course structure, which reshapes every page |
| `course_writer`, `problem_writer` | A label marking a regular contributor |

Being a **collaborator on the repository** is what lets someone branch on the
main repo instead of a fork, and that is managed in GitHub, not here.

If you would rather not advertise the editor, remove the `/edit` entry from
`links` in `src/components/Nav.tsx`. The route keeps working for anyone who
knows the URL.

## 3. The editor (contributors use their own GitHub)

Writers go to `/edit` and connect a GitHub account with the device flow: the
page shows a short code, they enter it at github.com/login/device, and that is
the whole sign-in. Saving then opens a pull request **from them**, which the
maintainer reviews and merges. Contributors who are not collaborators get a
fork made for them automatically, so anyone can contribute without being given
write access.

The server stores no GitHub credentials. The contributor's token lives in their
own browser tab and is sent per request. Setup is one public value:

1. Register an OAuth app at
   [github.com/settings/applications/new](https://github.com/settings/applications/new).
   Tick **Enable Device Flow**, and leave *Expire user access tokens* off so no
   refresh secret is ever needed.
2. Copy the **Client ID** (it is public, it ships in the browser bundle) and set:

   ```bash
   GITHUB_REPO=owner/usapho-guide
   NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23li...
   ```

   The client *secret* is not used and does not need to be stored anywhere.

Optional: a maintainer running locally can set `GITHUB_TOKEN` instead to skip
connecting each time. It is only a convenience; production does not need it.

## 4. Content layout

```
src/content/
├── curriculum.json   # courses -> sections -> modules
├── problems.json     # the problem bank, with provenance per problem
├── sims.json         # simulations: sliders plus a draw function
└── lessons/
    ├── <slug>.mdx    # one lesson per module slug, auto-registered
    └── README.md     # authoring reference
```

- Add a lesson: create `src/content/lessons/<slug>.mdx` where `<slug>` matches a
  module in `curriculum.json`. Nothing else to register.
- Remove a lesson: delete the file. The module keeps its problems.
- Lessons can use `$math$`, `<Aside>`, `<Figure>`, `<QuickCheck>` and
  `<Sim id="..." />` without imports.
- The editor at `/edit` has a toolbar for all of it and a live preview, so
  contributors do not need to know MDX. Simulations are written and previewed
  in the same place.

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
