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

    # simulations must exist
    for sim in re.findall(r'<Sim id="([^"]+)"', text):
        known = {s["id"] for s in json.loads((ROOT / "src/content/sims.json").read_text())}
        if sim not in known:
            problems.append(f"unknown simulation id: {sim}")

    words = len(re.sub(r"<[^>]+>", " ", text).split())
    if words < 150:
        problems.append(f"very short ({words} words)")
    if words > 900:
        problems.append(f"very long ({words} words)")

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
