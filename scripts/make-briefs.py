#!/usr/bin/env python3
"""
Write one brief per lesson into .lesson-briefs/ for the rewrite agents.

Each brief carries the lesson's place in the course, its neighbours (so the
prose can run continuously), and the actual problems the lesson has to leave a
reader able to solve.
"""

import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / ".lesson-briefs"

curriculum = json.loads((ROOT / "src/content/curriculum.json").read_text())
problems = json.loads((ROOT / "src/content/problems.json").read_text())

by_module: dict[str, list] = {}
for p in problems:
    by_module.setdefault(p["module"], []).append(p)

flat = [
    (course["name"], section["title"], section.get("blurb", ""), module)
    for course in curriculum
    for section in course["sections"]
    for module in section["modules"]
]

OUT.mkdir(exist_ok=True)
RANK = {"Very Hard": 0, "Hard": 1, "Medium": 2, "Easy": 3}

for i, (course, unit, blurb, m) in enumerate(flat):
    prev = flat[i - 1][3] if i else None
    nxt = flat[i + 1][3] if i + 1 < len(flat) else None

    lines = [
        f"LESSON: {m['title']}",
        f"SLUG: {m['slug']}",
        f"COURSE: {course}",
        f"UNIT: {unit} — {blurb}",
        f"DESCRIPTION: {m['description']}",
        "",
        f"PREVIOUS LESSON: {prev['title']} (/guide/{prev['slug']})" if prev else "PREVIOUS LESSON: none, this opens the course",
        f"NEXT LESSON: {nxt['title']} (/guide/{nxt['slug']})" if nxt else "NEXT LESSON: none, this closes the course",
        "",
        "PROBLEMS THIS LESSON MUST LEAVE THE READER ABLE TO SOLVE",
        "(hardest first; the lesson has to cover every technique these need)",
        "",
    ]

    pool = sorted(
        by_module.get(m["slug"], []),
        key=lambda p: RANK.get(p["difficulty"], 9),
    )
    for p in pool:
        lines.append(f"--- [{p['difficulty']}] {p['name']}")
        lines.append(p.get("statement", "").strip() or "(exam problem, text not reproduced)")
        if p.get("answer") is not None:
            lines.append(f"ANSWER: {p['answer']} {p.get('unit', '')}".rstrip())
        lines.append("")

    (OUT / f"{m['slug']}.txt").write_text("\n".join(lines))

print(f"{len(flat)} briefs written to {OUT.relative_to(ROOT)}")
