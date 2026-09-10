# How to write a lesson

Read one existing lesson before writing (`projectiles.mdx`, `gauss-law.mdx`)
and match it. The voice is a good physics textbook: direct, concrete, no
throat-clearing.

## File

One `.mdx` file named exactly for the module slug. No frontmatter, no title
heading — the page renders the title from `curriculum.json`. Start with an
`##` section heading.

Target 250-450 words. Three or four `##` sections. Short paragraphs.

## Voice

- Explain the idea in plain words **before** the equation, then show the
  equation the idea leads to.
- Say what the reader can *do* with it, and where it breaks.
- Prefer a worked instance over an abstract restatement.
- No filler openers ("Let's dive in", "In this lesson we will explore"), no
  marketing adjectives, no exclamation marks.
- Use "you" sparingly and never "we".
- Second-person imperative for procedure is good: "Draw the diagram first."

## Available markup

Math: `$inline$` and `$$display$$`.

````mdx
<Aside label="Worth remembering">
  A short, concrete note.
</Aside>

<Aside label="Where this goes wrong" warn>
  The specific mistake people make, and what to do instead.
</Aside>

<QuickCheck
  question="One sentence, answerable from the lesson."
  options={["First", "Second", "Third", "Fourth"]}
  answer={0}
  explanation="Why the right answer is right, in one or two sentences."
/>

<Figure caption={<><b>Figure 1.</b> What the reader should notice.</>}>
  <Sim id="projectile" />
</Figure>
````

Simulations available by id: `projectile`, `spring`, `motion-graphs`,
`collision`. Only use a figure when one of those genuinely fits the topic;
most lessons will have none.

Every lesson should have one `<Aside>` (usually the `warn` kind, naming the
classic mistake) and one `<QuickCheck>`.

## MDX gotchas that will break the build

- **Do not put `{` or `}` inside a JSX attribute string.** `question="..."`
  and `explanation="..."` are plain strings: write "sin θ ≈ θ" or "mg cos(θ)",
  never `$\frac{a}{b}$`. Math with braces belongs in the body text only.
- `options` must be a plain array of plain strings.
- Escape a literal `<` or `{` in prose.
- Keep `<Aside>` and `<Figure>` at the top level, not nested inside a list.
- **Markdown tables do not work.** `remark-gfm` is not enabled, so a pipe table
  renders as literal pipe characters. Write the same content as prose or a list.

## Do not

- Do not write problems. Problems live in `problems.json` and each lesson
  already has 30.
- Do not add a `#` title.
- Do not reference other lessons by file path; link by slug if you must.
