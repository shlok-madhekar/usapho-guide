#!/usr/bin/env python3
"""
Check lesson files against the house style before they ship.

Catches the things that break the build or read as machine-written: braces
inside JSX attributes, missing slugs, stock openers, and lessons with no
aside or check.

Run from the repo root:  python3 scripts/check-lessons.py
"""

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LESSONS = ROOT / "src/content/lessons"
CURRICULUM = ROOT / "src/content/curriculum.json"

# openers that read as filler when every lesson uses them
FILLER = [
    "let's dive", "lets dive", "in this lesson", "we will explore",
    "welcome to", "let us begin", "buckle up", "as we've seen",
    "it's important to note", "it is important to note",
]


def slugs() -> set[str]:
    curriculum = json.loads(CURRICULUM.read_text())
    return {
        m["slug"]
        for c in curriculum
        for s in c["sections"]
        for m in s["modules"]
    }


def known_sims() -> set[str]:
    """
    Simulations live in the merged file plus the un-merged per-lesson batches,
    so a lesson written alongside its own figures checks out before a merge.
    """
    ids: set[str] = set()
    paths = [ROOT / "src/content/sims.json", ROOT / "src/content/sim-seed.json"]
    paths += sorted((ROOT / "src/content/sim-batches").glob("*.json"))
    for p in paths:
        if not p.exists():
            continue
        try:
            ids |= {s["id"] for s in json.loads(p.read_text())}
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    return ids


def check(path: pathlib.Path, valid: set[str]) -> list[str]:
    name = path.stem
    text = path.read_text()
    problems = []

    if name not in valid:
        problems.append("filename does not match any module slug")

    # a brace inside a JSX attribute string is the build-breaking mistake
    for attr in ("question", "explanation", "label"):
        for m in re.finditer(rf'{attr}="([^"]*)"', text):
            if "{" in m.group(1) or "}" in m.group(1):
                problems.append(f'{attr}="..." contains a brace, which breaks MDX')

    # remark-math only reads a multi-line $$ block when each delimiter is alone
    # on its line; inline delimiters silently become a KaTeX error on the page
    for m in re.finditer(r"\$\$(.+?)\$\$", text, re.S):
        body = m.group(1)
        if "\n" in body and not (body.startswith("\n") and body.endswith("\n")):
            line = text[: m.start()].count("\n") + 1
            problems.append(f"line {line}: multi-line $$ needs $$ alone on its own line")

    if text.lstrip().startswith("# "):
        problems.append("has a top-level '# ' title (the page renders one already)")
    if "## " not in text:
        problems.append("no '##' section headings")

    lowered = text.lower()
    for phrase in FILLER:
        if phrase in lowered:
            problems.append(f"filler phrase: {phrase!r}")

    if "<Aside" not in text:
        problems.append("no <Aside> (each lesson should name a pitfall or a note)")
    if "<QuickCheck" not in text:
        problems.append("no <QuickCheck>")

    # a lesson with no picture has failed the brief
    sims = re.findall(r'<Sim id="([^"]+)"', text)
    if text.count("<Figure") < 2:
        problems.append(f"only {text.count('<Figure')} <Figure> (two is the minimum)")
    if not sims:
        problems.append("no <Sim>: every lesson needs at least one interactive lab")
    known = known_sims()
    for sim in sims:
        if sim not in known:
            problems.append(f"unknown simulation id: {sim}")

    words = len(re.sub(r"<[^>]+>", " ", text).split())
    if words < 1200:
        problems.append(f"too short ({words} words, the spec asks for 1500-2500)")
    if words > 3200:
        problems.append(f"too long ({words} words)")

    return problems


def main() -> int:
    valid = slugs()
    files = sorted(LESSONS.glob("*.mdx"))
    failures = 0

    for path in files:
        issues = check(path, valid)
        if issues:
            failures += 1
            print(f"{path.name}:")
            for i in issues:
                print(f"   {i}")

    missing = sorted(valid - {p.stem for p in files})
    print(f"\n{len(files)} lessons, {len(valid)} modules, {len(missing)} without a lesson")
    if missing:
        print("  missing:", ", ".join(missing[:12]) + (" ..." if len(missing) > 12 else ""))
    if failures:
        print(f"{failures} lesson(s) with issues", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
