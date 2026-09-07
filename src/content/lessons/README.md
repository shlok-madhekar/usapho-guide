# Lessons

One `.mdx` file per module, named for the module slug in `curriculum.json`.
Drop a file in and it appears; delete it and the module falls back to its
problems. Nothing to register.

## What you can use

Math: `$inline$` and `$$display$$`.

These are available in every lesson without imports (registered in
`src/mdx-components.tsx`):

```mdx
<Aside label="Worth remembering">A short note.</Aside>
<Aside label="Where this goes wrong" warn>A common mistake.</Aside>

<Figure caption={<><b>Figure 1.</b> What the reader should notice.</>}>
  <ProjectileSim />
</Figure>

<QuickCheck
  question="One sentence."
  options={["a", "b", "c", "d"]}
  answer={0}
  explanation="Why, in a sentence or two."
/>
```

Figures available: `ProjectileSim`, `SpringSim`, `MotionGraphSim`,
`CollisionSim`. Add new ones under `src/components/sims/` and register them in
`src/mdx-components.tsx`.

## Problems

Problems live in `src/content/problems.json`, not in the lesson, so they can
be browsed together in `/problems` and filtered. Add them through the editor
at `/edit`, which has a live preview, or by editing the JSON directly.

## House style

Explain the idea before the equation. Keep paragraphs short and concrete.
Prefer a worked instance over an abstract restatement. Avoid filler openers
and marketing adjectives.
