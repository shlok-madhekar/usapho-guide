# Lessons

Each lesson is one `.mdx` file, keyed by the module slug from
`src/lib/curriculum.ts`.

## Adding a lesson

1. Create `<slug>.mdx` in this folder.
2. Register it in `index.ts` (one import + one line in `LESSONS`).
3. Set `hasContent: true` on the module in `src/lib/curriculum.ts`.

Removing a lesson is the reverse; the module page falls back to a
"coming soon" note plus its past-exam problem table.

## What you can use inside a lesson

Math: `$inline$` and `$$display$$` (KaTeX via remark-math).

These components are available globally, no imports needed
(registered in `src/mdx-components.tsx`):

- `<Callout label="Pro tip">...</Callout>` and `<Callout label="Olympiad trap" warn>`
- `<QuickCheck question="..." options={[...]} answer={0} explanation={...} />`
- Interactive sims: `<ProjectileSim />`, `<SpringSim />`, `<MotionGraphSim />`,
  `<CollisionSim />` (add new ones in `src/components/sims/` and register them
  in `src/mdx-components.tsx`)
- On-site problems with answer checking:

```mdx
<Problem id="np-unique-id" number={1} title="Name" difficulty="Normal" answer={42} unit="m">
  Statement text with $math$.

  <Hint>Optional nudge.</Hint>
  <Solution>
    Full worked solution with $$display math$$.
  </Solution>
</Problem>
```

`answer` is checked numerically with a 2% tolerance by default
(`tolerancePct` overrides it). Correct answers are saved to the local
progress store under `id`, so keep ids unique and stable.
