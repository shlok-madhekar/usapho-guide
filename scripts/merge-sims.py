#!/usr/bin/env python3
"""
Rebuild src/content/sims.json from the hand-written seed plus every per-lesson
batch in src/content/sim-batches/.

Lesson authors write their own figures, so the merged file is generated and
should never be edited directly. Re-running is safe: the output is rebuilt from
scratch each time rather than appended to.
"""

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED = ROOT / "src/content/sim-seed.json"
BATCHES = ROOT / "src/content/sim-batches"
OUT = ROOT / "src/content/sims.json"

REQUIRED = ("id", "title", "caption", "draw")
PARAM_KEYS = ("key", "label", "min", "max", "step", "value")


def validate(sim: dict, where: str, seen: set[str]) -> list[str]:
    issues = []
    for field in REQUIRED:
        if not sim.get(field):
            issues.append(f"{where}: missing {field!r}")
    sid = sim.get("id", "?")
    if sid in seen:
        issues.append(f"{where}: duplicate id {sid!r}")
    for p in sim.get("params", []):
        for k in PARAM_KEYS:
            if k not in p:
                issues.append(f"{where}:{sid}: param missing {k!r}")
    # a hard-coded colour breaks dark mode, which is easy to miss in review
    if "#" in sim.get("draw", ""):
        issues.append(f"{where}:{sid}: draw uses a literal colour, use C.*")
    return issues


def main() -> int:
    sims, seen, issues = [], set(), []

    sources = [SEED] + sorted(BATCHES.glob("*.json"))
    for path in sources:
        if not path.exists():
            continue
        try:
            batch = json.loads(path.read_text())
        except json.JSONDecodeError as e:
            issues.append(f"{path.name}: invalid JSON ({e})")
            continue
        for sim in batch:
            issues.extend(validate(sim, path.name, seen))
            seen.add(sim.get("id", "?"))
            sims.append(sim)

    for i in issues:
        print(i, file=sys.stderr)
    if issues:
        print(f"{len(issues)} problem(s); nothing written", file=sys.stderr)
        return 1

    OUT.write_text(json.dumps(sims, indent=2) + "\n")

    # A lesson needs two or three sims, not all of them. Writing one file per
    # sim lets a page fetch just those instead of bundling the whole catalogue,
    # which was adding hundreds of kilobytes to every lesson.
    public = ROOT / "public/sims"
    public.mkdir(parents=True, exist_ok=True)
    for stale in public.glob("*.json"):
        stale.unlink()
    for sim in sims:
        (public / f"{sim['id']}.json").write_text(json.dumps(sim))

    print(f"{len(sims)} simulations from {len(sources)} source file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
