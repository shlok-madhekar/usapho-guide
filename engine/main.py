"""
USAPhO Guide video engine.

POST /api/generate {"prompt": "..."} -> {"jobId": ...}
GET  /api/jobs/{job_id}              -> job status; when done, videoUrl points
                                        at a rendered Manim explanation video.

Pipeline per job: Claude writes a ManimCE scene for the requested physics
explanation, the code is safety-scanned, rendered with manim, and (on a render
error) sent back to Claude once for a repair pass.

Run:  .venv/bin/uvicorn main:app --port 8100
Needs ANTHROPIC_API_KEY (or an `ant auth login` profile) in the environment.
"""

import ast
import re
import shutil
import subprocess
import sys
import threading
import uuid
from pathlib import Path

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).parent
JOBS_DIR = ROOT / "jobs"
VIDEOS_DIR = ROOT / "videos"
JOBS_DIR.mkdir(exist_ok=True)
VIDEOS_DIR.mkdir(exist_ok=True)

MODEL = "claude-opus-5"
RENDER_TIMEOUT_S = 300
SCENE_NAME = "ExplainScene"

# Modules that generated scene code has no business importing.
BANNED_MODULES = {
    "os", "subprocess", "sys", "shutil", "socket", "requests", "urllib",
    "http", "pathlib", "importlib", "ctypes", "multiprocessing", "signal",
}
BANNED_CALLS = {"open", "exec", "eval", "__import__", "compile", "input"}

SYSTEM_PROMPT = """\
You write Manim Community Edition v0.21 scenes that visually explain physics
concepts to olympiad students (F=ma / USAPhO level).

Output exactly one Python code block and nothing else. Requirements:
- Define a single class `ExplainScene(Scene)` with a `construct` method.
- Target roughly 20-40 seconds of animation. Pace it: reveal ideas step by
  step with Write/Create/FadeIn/Transform and short self.wait() beats.
- The video must teach: label quantities, show the setup, animate the physics
  (motion, vectors, graphs), and end with the key takeaway on screen.
- LaTeX is NOT installed. Never use Tex, MathTex, or SingleStringMathTex.
  Write formulas with Text() using unicode (e.g. "v = v0 + at", "theta",
  "1/2 g t^2", greek letters like theta/omega directly as unicode).
- Only import from manim and math/numpy. No file I/O, no network, no os/sys.
- Keep everything inside the default 14.2 x 8 frame; font_size 24-40 for
  body text, keep text short. Avoid overlapping elements: FadeOut previous
  groups before introducing new ones.
- Use color to distinguish physical quantities (velocity vs acceleration vs
  force) and keep a dark background (default).
- Deterministic code only: no randomness, no time.time(), no interactivity.
"""


class GenerateRequest(BaseModel):
    prompt: str


app = FastAPI(title="USAPhO Guide video engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local tool; videos are public anyway
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/videos", StaticFiles(directory=VIDEOS_DIR), name="videos")

jobs: dict[str, dict] = {}
jobs_lock = threading.Lock()


def set_job(job_id: str, **fields):
    with jobs_lock:
        jobs[job_id].update(fields)


def extract_code(text: str) -> str:
    m = re.search(r"```(?:python)?\s*\n(.*?)```", text, re.S)
    if not m:
        raise ValueError("model response contained no code block")
    return m.group(1)


def safety_scan(code: str):
    """Reject code that imports or calls anything outside the allowed surface."""
    tree = ast.parse(code)
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = (
                [a.name for a in node.names]
                if isinstance(node, ast.Import)
                else [node.module or ""]
            )
            for name in names:
                root = name.split(".")[0]
                if root in BANNED_MODULES:
                    raise ValueError(f"banned import: {root}")
                if root not in {"manim", "math", "numpy", "np", "itertools", "functools"}:
                    raise ValueError(f"import not allowed: {root}")
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in BANNED_CALLS:
                raise ValueError(f"banned call: {node.func.id}()")
        if isinstance(node, ast.Attribute) and node.attr in {"system", "popen"}:
            raise ValueError(f"banned attribute: {node.attr}")
    if SCENE_NAME not in code:
        raise ValueError(f"scene class {SCENE_NAME} not found")


def ask_claude(client: anthropic.Anthropic, messages: list) -> str:
    with client.messages.stream(
        model=MODEL,
        max_tokens=32000,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        response = stream.get_final_message()
    if response.stop_reason == "refusal":
        raise ValueError("the model declined to generate this video")
    return "".join(b.text for b in response.content if b.type == "text")


def render(job_dir: Path, code: str) -> Path:
    scene_file = job_dir / "scene.py"
    scene_file.write_text(code)
    proc = subprocess.run(
        [
            sys.executable, "-m", "manim", "render",
            "-ql", "--fps", "20",
            "--media_dir", str(job_dir / "media"),
            str(scene_file), SCENE_NAME,
        ],
        capture_output=True,
        text=True,
        timeout=RENDER_TIMEOUT_S,
        cwd=job_dir,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr[-4000:])
    mp4s = list(job_dir.glob("media/videos/**/*.mp4"))
    if not mp4s:
        raise RuntimeError("manim produced no mp4")
    return mp4s[0]


def run_job(job_id: str, prompt: str):
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    client = anthropic.Anthropic()
    user_msg = (
        "Create a Manim explanation video for this request from a physics "
        f"olympiad student:\n\n{prompt}"
    )
    messages = [{"role": "user", "content": user_msg}]
    try:
        set_job(job_id, status="generating")
        reply = ask_claude(client, messages)
        code = extract_code(reply)
        safety_scan(code)

        set_job(job_id, status="rendering")
        try:
            mp4 = render(job_dir, code)
        except (RuntimeError, subprocess.TimeoutExpired) as first_error:
            # one AI repair pass with the render error
            set_job(job_id, status="repairing")
            messages += [
                {"role": "assistant", "content": reply},
                {
                    "role": "user",
                    "content": "Rendering failed with this error. Return the "
                    f"full corrected script.\n\n{first_error}",
                },
            ]
            reply = ask_claude(client, messages)
            code = extract_code(reply)
            safety_scan(code)
            set_job(job_id, status="rendering")
            mp4 = render(job_dir, code)

        final = VIDEOS_DIR / f"{job_id}.mp4"
        shutil.copy(mp4, final)
        set_job(job_id, status="done", videoUrl=f"/videos/{job_id}.mp4")
    except Exception as e:  # surface any failure to the client
        set_job(job_id, status="error", error=str(e)[:2000])
    finally:
        shutil.rmtree(job_dir / "media", ignore_errors=True)


@app.post("/api/generate")
def generate(req: GenerateRequest):
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(400, "empty prompt")
    if len(prompt) > 2000:
        raise HTTPException(400, "prompt too long")
    job_id = uuid.uuid4().hex[:12]
    with jobs_lock:
        jobs[job_id] = {"status": "queued", "prompt": prompt}
    threading.Thread(target=run_job, args=(job_id, prompt), daemon=True).start()
    return {"jobId": job_id}


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    with jobs_lock:
        job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "unknown job")
    return {"jobId": job_id, **job}


@app.get("/api/health")
def health():
    return {"ok": True}
