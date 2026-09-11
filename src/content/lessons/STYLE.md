# How to write a lesson

The test for a lesson is simple and strict:

> A motivated 15-year-old who has never seen this topic reads only this page,
> then solves most of the 30 problems attached to it.

If a reader would have to go find a textbook to fill a gap, the lesson has
failed. Write the textbook chapter instead of the summary of one.

## Length

**1500-2500 words.** A short lesson is almost always a lesson that skipped the
explaining and jumped to results. If you are at 600 words you have written
lecture notes for someone who already knows the topic.

Length comes from doing the work, not from padding: deriving instead of
asserting, working examples in full, and saying why a step is taken.

## The shape of a lesson

**1. Open with the question the topic answers.** One or two paragraphs, no
equations. Something concrete the reader can picture — a crate that will not
budge, a satellite that speeds up when you slow it down. Make them curious
about the answer before you hand it over.

**2. Build the idea from something they already have.** Do not open with the
formula. Reason to it. "Here is what we know. Here is what happens if we push
on it. So the thing we want must be..." The equation should arrive as the
conclusion of a paragraph, not the start of one.

**3. Say what the equation means in words** right after you write it. Which
symbol is which, what happens if one grows, what the sign means, when it does
not apply.

**4. Work examples in full.** At least **three**, increasing in difficulty:
one where you plug in, one where you must set up before you can plug in, one
that needs a real idea. Show every step including the arithmetic. Never write
"it follows that" over a step a beginner cannot reproduce. Say what you would
write down first on blank paper and why.

**5. Name the traps.** The specific wrong answers people give, and how to
notice you are making one.

**6. End with how to recognise the topic.** What in a problem statement tells
you that *this* is the technique to reach for. This is the part students never
get taught and it is worth a short section of its own.

## Voice

Warm, plain, and direct. You are a good teacher sitting next to one student.

- Say "you", never "we". Never "let us".
- Short sentences. Vary the length. Read it aloud in your head.
- Contractions are fine and usually better.
- You may be wry, never jokey. No exclamation marks, no emoji.
- Never write filler: "it is important to note", "as we have seen", "in this
  lesson we will explore", "let's dive in", "simply", "just", "obviously",
  "of course". If a step were obvious the reader would not be reading.
- Do not flatter the reader or cheerlead. No "great job", no "you've got this".
- Admit when something is genuinely hard. "This one takes practice" builds more
  trust than pretending it is easy.

## Continuity

The lessons are a course, read in order, not 82 encyclopedia entries.

- Open by connecting to what came just before when it is relevant: "You have
  been treating the rope as if the tension were the same throughout. Here is
  when that stops being true."
- Reuse the earlier notation and the earlier worked examples where you can.
- Close by pointing at what this sets up, linking with `[text](/guide/slug)`.
- Never re-teach a previous lesson from scratch, but do recall its result in
  one line so the reader is not forced to go back.

## Teaching a beginner

- Define every symbol the first time it appears in the lesson.
- Introduce vocabulary explicitly: "this is called the *normal force*, and the
  word normal here means perpendicular, not usual."
- Where a step uses maths the reader may not have, say so and show the step.
- Use numbers with units in worked examples, never bare symbols only.
- Prefer one idea explained three ways over three ideas explained once.

## Markup

Math: `$inline$` and `$$display$$`.

````mdx
<Aside label="Worth remembering">A short, concrete note.</Aside>

<Aside label="Where this goes wrong" warn>
  The specific mistake, and what to do instead.
</Aside>

<QuickCheck
  question="One sentence, answerable from this lesson."
  options={["First", "Second", "Third", "Fourth"]}
  answer={0}
  explanation="Why the right answer is right, and why the tempting wrong one is wrong."
/>

<Figure caption={<><b>Figure 1.</b> What the reader should notice.</>}>
  <Sim id="projectile" />
</Figure>
````

Use `##` for sections. Expect five to eight of them at this length.

Every lesson needs **at least two `<Aside>`** (one of them `warn`) and
**at least two `<QuickCheck>`**, spread through the lesson rather than dumped
at the end. Put a check right after the idea it tests.

Simulations by id: `projectile`, `spring`, `motion-graphs`, `collision`. Only
where one genuinely fits.

## Markup rules that will break the build

- **No `{` or `}` inside a JSX attribute string.** `question="..."` and
  `explanation="..."` are plain text: write "sin θ ≈ θ", never `$\frac{a}{b}$`.
  Math with braces goes in the body only.
- `options` must be a plain array of plain strings.
- **No markdown tables.** `remark-gfm` is not enabled, so pipes render
  literally. Use prose or a list.
- Keep `<Aside>` and `<Figure>` at the top level, not inside a list.
- No `#` title and no frontmatter: the page renders the title already.

## Do not

- Do not write new practice problems. Each lesson already has 30 in the bank;
  worked examples inside the lesson are different and are required.
- Do not use a markdown table.
- Do not pad to hit the word count. Add teaching, not words.

---

# Figures and labs

Text alone does not teach physics. **Every lesson needs at least two figures,
and at least one of them must be an interactive lab** the reader can play
with. A lesson with no picture has failed the brief.

Simulations are data, not components. You write them yourself as JSON and they
appear in your lesson by id.

## Where to put them

Write your lesson's simulations to
`src/content/sim-batches/<your-slug>.json` as a JSON array. They are merged
into the site automatically. Use them in the lesson as:

````mdx
<Figure caption={<><b>Figure 1.</b> Say what the reader should notice, and
suggest something to try: "drag the angle past 45 degrees and watch the range
come back down."</>}>
  <Sim id="your-sim-id" />
</Figure>
````

## The shape of a simulation

```json
{
  "id": "friction-cone",
  "title": "Friction cone lab",
  "caption": "Tilt the ramp and watch the friction budget run out.",
  "height": 240,
  "params": [
    { "key": "angle", "label": "Ramp angle", "unit": "deg",
      "min": 0, "max": 60, "step": 1, "value": 20 },
    { "key": "mu", "label": "Coefficient of static friction", "unit": "",
      "min": 0.1, "max": 1.2, "step": 0.05, "value": 0.5 }
  ],
  "draw": "…javascript…"
}
```

`id` must be globally unique: prefix it with your lesson slug.

A caption is JSX children, not markdown, so `$math$` and `*emphasis*` inside one
render literally. Write captions in plain words, with `<b>` for the figure
number and `<i>` if you need emphasis.

## Writing the draw code

`draw` is the body of a function run once per animation frame. Available:

- `ctx` — canvas 2d context, already scaled for the display
- `p` — the slider values, e.g. `p.angle`
- `t` — seconds since the sim started (use it to animate; ignore it for a static diagram)
- `W`, `H` — canvas size in CSS pixels
- `C` — theme colours: `C.ink`, `C.rule`, `C.accent`, `C.figure`, `C.faint`, `C.paper`
- `out` — set `out.note = "..."` to show a live readout above the canvas

Rules:

- **Always use `C.*` for colour**, never a hex string, or the figure breaks in dark mode.
- Label things. `ctx.fillText` with `ctx.font = "12px ui-sans-serif, system-ui, sans-serif"`. A diagram with unlabelled arrows teaches nothing.
- Use `out.note` to show the number that matters as the reader drags a slider. This is what turns a picture into a lab.
- Keep it deterministic: no `Math.random`, no `Date.now`.
- Scale drawing to `W` and `H`; never hard-code a pixel width, the canvas is responsive.
- Plain ES5-style JavaScript in the body. No imports, no `await`.

## Two kinds of figure, both wanted

**Labs** have sliders and animate: a ramp whose block starts sliding when you
pass the critical angle, a capacitor whose field lines crowd as you close the
plates, a decay curve that halves as you drag the half-life.

**Diagrams** can be static (ignore `t`, use few or no sliders): a labelled free
body diagram, a ray diagram, a PV cycle, a circuit. These are just as valuable
and often clearer than an animation. Static diagrams still go through the same
sim format.

Aim for one lab plus one diagram in most lessons. More if the topic earns it.

## Display math across several lines

A `$$` block that runs over more than one line must have each `$$` **alone on
its own line**, with a blank line above and below:

```
text before.

$$
a = b + c
$$

text after.
```

Writing `$$a = b` on one line and `+ c$$` on the next renders as a red KaTeX
error on the page. Single-line `$$a = b$$` is fine.
