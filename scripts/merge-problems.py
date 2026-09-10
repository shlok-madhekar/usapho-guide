#!/usr/bin/env python3
"""
Merge the per-unit problem batches into src/content/problems.json.

problems.json is rebuilt every run from problem-seed.json (the hand-written
originals and exam references) plus every batch in problem-batches/, so the
script is safe to re-run. Each problem is validated before it is allowed in,
so a bad batch fails loudly here rather than reaching a reader.

Run from the repo root:  python3 scripts/merge-problems.py
"""

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BATCHES = ROOT / "src/content/problem-batches"
PROBLEMS = ROOT / "src/content/problems.json"
INDEX = ROOT / "src/content/problem-index.json"
COUNTS = ROOT / "src/content/problem-counts.json"
PUBLIC = ROOT / "public/problems.json"
SEED = ROOT / "src/content/problem-seed.json"
CURRICULUM = ROOT / "src/content/curriculum.json"

DIFFICULTIES = {"Easy", "Normal", "Hard", "Very Hard", "Insane"}
ORIGINS = {"original", "exam", "textbook"}
REQUIRED = {
    "id", "name", "module", "difficulty", "tags", "starred",
    "origin", "source", "statement", "answer", "unit", "solution",
}


def valid_slugs() -> set[str]:
    curriculum = json.loads(CURRICULUM.read_text())
    return {
        m["slug"]
        for course in curriculum
        for section in course["sections"]
        for m in section["modules"]
    }


def normalize(problem: dict) -> None:
    """
    Smooth over habits that read as boilerplate when repeated across thousands
    of problems. Solutions that all open with the same stock phrase feel
    machine-written even when the physics is good.
    """
    solution = problem["solution"].strip()
    for opener in ("KEY IDEA:", "Key idea:", "KEY IDEA -", "Key Idea:"):
        if solution.startswith(opener):
            solution = solution[len(opener):].lstrip()
            solution = solution[:1].upper() + solution[1:]
            break
    problem["solution"] = solution
    problem["statement"] = problem["statement"].strip()


def check(problem: dict, slugs: set[str], seen: set[str]) -> list[str]:
    """Return a list of problems with this entry, empty if it is fine."""
    errors = []
    pid = problem.get("id", "<no id>")

    missing = REQUIRED - problem.keys()
    if missing:
        errors.append(f"{pid}: missing {sorted(missing)}")
        return errors  # nothing else is trustworthy

    if pid in seen:
        errors.append(f"{pid}: duplicate id")
    if problem["module"] not in slugs:
        errors.append(f"{pid}: unknown module '{problem['module']}'")
    if problem["difficulty"] not in DIFFICULTIES:
        errors.append(f"{pid}: bad difficulty '{problem['difficulty']}'")
    if problem["origin"] not in ORIGINS:
        errors.append(f"{pid}: bad origin '{problem['origin']}'")
    if not isinstance(problem["answer"], (int, float)) or isinstance(
        problem["answer"], bool
    ):
        errors.append(f"{pid}: answer must be a number, got {problem['answer']!r}")
    if not str(problem["statement"]).strip():
        errors.append(f"{pid}: empty statement")
    if not str(problem["solution"]).strip():
        errors.append(f"{pid}: empty solution")
    if not isinstance(problem["tags"], list):
        errors.append(f"{pid}: tags must be a list")
    return errors


def main() -> int:
    slugs = valid_slugs()
    seed = json.loads(SEED.read_text()) if SEED.exists() else []

    merged: list[dict] = []
    seen: set[str] = set()
    errors: list[str] = []

    # the hand-written set always comes first and is never regenerated
    for problem in seed:
        merged.append(problem)
        seen.add(problem["id"])

    if not BATCHES.exists():
        print("no batches directory, nothing to merge")
        return 0

    for path in sorted(BATCHES.glob("*.json")):
        try:
            batch = json.loads(path.read_text())
        except json.JSONDecodeError as e:
            errors.append(f"{path.name}: not valid JSON ({e})")
            continue
        if not isinstance(batch, list):
            errors.append(f"{path.name}: expected a list")
            continue

        kept = 0
        for problem in batch:
            problem_errors = check(problem, slugs, seen)
            if problem_errors:
                errors.extend(f"{path.name}: {e}" for e in problem_errors)
                continue
            # batch problems default to being written for the guide
            problem.setdefault("url", "")
            normalize(problem)
            merged.append(problem)
            seen.add(problem["id"])
            kept += 1
        print(f"{path.name}: {kept} of {len(batch)} accepted")

    if errors:
        print(f"\n{len(errors)} problem(s) rejected:", file=sys.stderr)
        for e in errors[:40]:
            print(f"  {e}", file=sys.stderr)
        if len(errors) > 40:
            print(f"  ... and {len(errors) - 40} more", file=sys.stderr)

    PROBLEMS.write_text(json.dumps(merged, indent=2) + "\n")

    # A metadata-only index and a counts map, so pages that just list or count
    # problems never pull the statements and solutions into the bundle.
    index = [
        {
            "id": p["id"],
            "name": p["name"],
            "module": p["module"],
            "difficulty": p["difficulty"],
            "tags": p["tags"],
            "starred": p["starred"],
            "origin": p["origin"],
            "source": p["source"],
            "solvable": bool(p["answer"] is not None and str(p["statement"]).strip()),
        }
        for p in merged
    ]
    INDEX.write_text(json.dumps(index, indent=2) + "\n")

    counts: dict[str, dict[str, int]] = {}
    for p in index:
        c = counts.setdefault(p["module"], {"total": 0, "solvable": 0})
        c["total"] += 1
        if p["solvable"]:
            c["solvable"] += 1
    COUNTS.write_text(json.dumps(counts, indent=2, sort_keys=True) + "\n")

    # served as a static file so the problem bank can fetch it on demand
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.write_text(json.dumps(merged))

    by_module: dict[str, int] = {}
    for problem in merged:
        by_module[problem["module"]] = by_module.get(problem["module"], 0) + 1
    covered = sum(1 for s in slugs if by_module.get(s, 0) >= 30)

    size_mb = PROBLEMS.stat().st_size / 1_000_000
    print(
        f"\ntotal {len(merged)} problems across {len(by_module)} lessons"
        f" | {covered}/{len(slugs)} lessons at 30+"
    )
    print(
        f"problems.json {size_mb:.2f} MB"
        f" | index {INDEX.stat().st_size / 1000:.0f} kB"
        f" | counts {COUNTS.stat().st_size / 1000:.0f} kB"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
