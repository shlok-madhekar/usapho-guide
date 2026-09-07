# Lessons

One `.mdx` file per module, named for the module slug in `curriculum.json`.
Drop a file in and it appears; delete it and the module keeps its problems.

Most people should use the editor at `/edit`, which has a toolbar for every
one of these and a live preview beside the text. This file is the reference
for anyone editing the files directly.

## What you can use

Math: `$inline$` and `$$display$$`.

Available in every lesson without imports (registered in
`src/mdx-components.tsx`):

```mdx
<Aside label="Worth remembering">A short note.</Aside>
<Aside label="Where this goes wrong" warn>A common mistake.</Aside>

<Figure caption={<><b>Figure 1.</b> What the reader should notice.</>}>
  <Sim id="projectile" />
</Figure>

<QuickCheck
  question="One sentence."
  options={["a", "b", "c", "d"]}
  answer={0}
  explanation="Why, in a sentence or two."
/>
```

## Simulations

Simulations live in `src/content/sims.json` and are referenced by id, so a
lesson never imports a component. Write and preview new ones in the
Simulations tab of the editor, or edit the JSON directly.

Each sim declares its sliders and a `draw` body that runs once per frame with:

```
ctx   canvas context, already scaled for the display
p     slider values, e.g. p.speed
t     seconds since the sim started
W, H  canvas size in pixels
C     colours: C.ink C.rule C.accent C.figure C.faint C.paper
out   set out.note = "..." for a readout above the canvas
```

Use `C.*` rather than fixed colours so sims work in both themes. Sim code is
repository content: it reaches readers only once a maintainer merges the pull
request that introduced it.

## Problems

Problems live in `src/content/problems.json` so they can be browsed together
in `/problems`. Add them in the Problems tab, which previews them as students
will see them.

## House style

Explain the idea before the equation. Keep paragraphs short and concrete.
Prefer a worked instance over an abstract restatement. Avoid filler openers
and marketing adjectives.
