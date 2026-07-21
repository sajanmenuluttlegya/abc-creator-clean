#!/usr/bin/env python3
# Server-side Kaggle M0 slot controller for GitHub Actions.
# It avoids duplicate runs, patches a temporary private notebook,
# pushes the v5 kernel, and briefly verifies website registration.

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

WEBSITE_BASE = "https://abc-creator-clean.vercel.app"
REGISTER_URL = f"{WEBSITE_BASE}/api/internal/m0/register"
DIAGNOSTICS_URL = f"{WEBSITE_BASE}/api/internal/m0/diagnostics"
MODEL_SOURCE = "cinefax/abc-m0-z-image-turbo/PyTorch/default/2"
MAX_RUNTIME_SECONDS = 15_300

ACTIVE_STATUS_MARKERS = (
    "KernelWorkerStatus.RUNNING",
    "KernelWorkerStatus.QUEUED",
    "KernelWorkerStatus.INITIALIZING",
    "KernelWorkerStatus.PENDING",
)


@dataclass(frozen=True)
class Slot:
    account: str
    secret_name: str
    worker_name: str
    v4_kernel: str
    v5_kernel: str
    warm_start_ist: str
    stop_ist: str


SLOTS: dict[str, Slot] = {
    "cinefax": Slot(
        account="cinefax",
        secret_name="KAGGLE_TOKEN_CINEFAX",
        worker_name="m0-cinefax",
        v4_kernel="cinefax/abc-m0-image-worker-scheduled-v4-safe",
        v5_kernel="cinefax/abc-m0-image-worker-scheduled-v5",
        warm_start_ist="23:45",
        stop_ist="04:00",
    ),
    "steverichards77": Slot(
        account="steverichards77",
        secret_name="KAGGLE_TOKEN_STEVERICHARDS77",
        worker_name="m0-steverichards77",
        v4_kernel="steverichards77/abc-m0-image-worker-scheduled-v4-safe",
        v5_kernel="steverichards77/abc-m0-image-worker-scheduled-v5",
        warm_start_ist="03:45",
        stop_ist="08:00",
    ),
    "ashstizhard": Slot(
        account="ashstizhard",
        secret_name="KAGGLE_TOKEN_ASHSTIZHARD",
        worker_name="m0-ashstizhard",
        v4_kernel="ashstizhard/abc-m0-image-worker-scheduled-v4-safe",
        v5_kernel="ashstizhard/abc-m0-image-worker-scheduled-v5",
        warm_start_ist="07:45",
        stop_ist="12:00",
    ),
    "dpstards": Slot(
        account="dpstards",
        secret_name="KAGGLE_TOKEN_DPSTARDS",
        worker_name="m0-dpstards",
        v4_kernel="dpstards/abc-m0-image-worker-scheduled-v4-safe",
        v5_kernel="dpstards/abc-m0-image-worker-scheduled-v5",
        warm_start_ist="11:45",
        stop_ist="16:00",
    ),
    "iitmania": Slot(
        account="iitmania",
        secret_name="KAGGLE_TOKEN_IITMANIA",
        worker_name="m0-iitmania",
        v4_kernel="iitmania/abc-m0-image-worker-scheduled-v4-safe",
        v5_kernel="iitmania/abc-m0-image-worker-scheduled-v5",
        warm_start_ist="15:45",
        stop_ist="20:00",
    ),
    "assskr": Slot(
        account="assskr",
        secret_name="KAGGLE_TOKEN_ASSSKR",
        worker_name="m0-assskr",
        v4_kernel="assskr/abc-m0-image-worker-scheduled-v4-safe",
        v5_kernel="assskr/abc-m0-image-worker-scheduled-v5",
        warm_start_ist="19:45",
        stop_ist="00:00",
    ),
}


def log(message: str) -> None:
    print(message, flush=True)


def github_warning(message: str) -> None:
    print(f"::warning::{message}", flush=True)


def require_secret(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if len(value) < 20:
        raise RuntimeError(f"Required GitHub Actions secret is missing or invalid: {name}")
    return value


def kaggle_environment(token: str) -> dict[str, str]:
    env = os.environ.copy()
    env["KAGGLE_API_TOKEN"] = token
    env.pop("KAGGLE_USERNAME", None)
    env.pop("KAGGLE_KEY", None)
    env["PYTHONUTF8"] = "1"
    env["PYTHONIOENCODING"] = "utf-8:backslashreplace"
    return env


def run_command(
    arguments: list[str],
    *,
    token: str,
    timeout: int = 600,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        arguments,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="backslashreplace",
        env=kaggle_environment(token),
        timeout=timeout,
        check=False,
    )


def kaggle(
    token: str,
    *arguments: str,
    timeout: int = 600,
) -> subprocess.CompletedProcess[str]:
    return run_command(["kaggle", *arguments], token=token, timeout=timeout)


def kernel_status(token: str, kernel: str) -> tuple[int, str]:
    result = kaggle(token, "kernels", "status", kernel, timeout=120)
    return result.returncode, result.stdout.strip()


def status_is_active(status: str) -> bool:
    return any(marker in status for marker in ACTIVE_STATUS_MARKERS)


def status_is_error(status: str) -> bool:
    return "KernelWorkerStatus.ERROR" in status


def http_request(
    method: str,
    worker_key: str,
    *,
    timeout: int = 45,
) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(
        DIAGNOSTICS_URL,
        method=method,
        headers={
            "Authorization": f"Bearer {worker_key}",
            "x-worker-key": worker_key,
            "Cache-Control": "no-store",
            "User-Agent": "ABC-Creator-M0-GitHub-Controller/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return (
                int(response.status),
                {key.lower(): value for key, value in response.headers.items()},
                response.read(),
            )
    except urllib.error.HTTPError as error:
        return (
            int(error.code),
            {key.lower(): value for key, value in error.headers.items()},
            error.read(),
        )


def active_worker_is_healthy(worker_key: str, expected_worker: str) -> bool:
    status, _, body = http_request("GET", worker_key)
    if status != 200:
        return False
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return False

    worker = payload.get("activeWorker")
    return bool(
        worker
        and worker.get("workerName") == expected_worker
        and worker.get("healthy") is True
    )


def join_cell_source(cell: dict[str, Any]) -> str:
    source = cell.get("source", "")
    if isinstance(source, list):
        return "".join(str(part) for part in source)
    return str(source)


def set_cell_source(cell: dict[str, Any], source: str) -> None:
    cell["source"] = source
    cell["execution_count"] = None
    cell["outputs"] = []


def quality_override_cell() -> str:
    return """# ============================================================
# ABC CREATOR M0 — EXACT NATIVE OUTPUT
# Fixed inference steps: 8
# No resize or upscale. Only minimal center-crop when Z-Image's
# required 16-pixel alignment is larger than the requested output.
# ============================================================

if not WORKER_ENABLED:
    print("[QUALITY] Skipped: outside slot window.")
else:
    M0_MAX_OUTPUT_SIDE = 1920
    M0_FIXED_STEPS = 8

    def normalize_size(value):
        value = int(value)
        if value < 16 or value > M0_MAX_OUTPUT_SIDE:
            raise ValueError(
                "M0 output dimensions must be between 16 and "
                + str(M0_MAX_OUTPUT_SIDE)
                + " pixels."
            )
        return value

    def normalize_steps(_value):
        return M0_FIXED_STEPS

    def align_up_16(value):
        value = int(value)
        return ((value + 15) // 16) * 16

    _generate_m0_before_exact_output = generate_m0

    def generate_m0(
        prompt,
        width=512,
        height=512,
        steps=M0_FIXED_STEPS,
        seed=None,
        show=True,
        **kwargs,
    ):
        target_width = normalize_size(width)
        target_height = normalize_size(height)
        generation_width = align_up_16(target_width)
        generation_height = align_up_16(target_height)

        image, info = _generate_m0_before_exact_output(
            prompt=prompt,
            width=generation_width,
            height=generation_height,
            steps=M0_FIXED_STEPS,
            seed=seed,
            show=False,
            **kwargs,
        )

        if image.width < target_width or image.height < target_height:
            raise RuntimeError(
                "M0 generated an image smaller than the requested output."
            )

        cropped = image.size != (target_width, target_height)
        if cropped:
            left = (image.width - target_width) // 2
            top = (image.height - target_height) // 2
            image = image.crop(
                (left, top, left + target_width, top + target_height)
            )

        if image.size != (target_width, target_height):
            raise RuntimeError(
                "M0 exact-output validation failed: "
                + str(image.size)
                + " != "
                + str((target_width, target_height))
            )

        info = dict(info or {})
        info.update(
            {
                "width": target_width,
                "height": target_height,
                "generation_width": generation_width,
                "generation_height": generation_height,
                "steps": M0_FIXED_STEPS,
                "post_process": "center-crop-only" if cropped else "none",
            }
        )

        if show:
            display(image)

        print(
            "[QUALITY] Exact output:",
            target_width,
            "x",
            target_height,
            "generated at",
            generation_width,
            "x",
            generation_height,
            "steps",
            M0_FIXED_STEPS,
        )
        return image, info
"""


def patch_m0_quality(cells: list[dict[str, Any]]) -> None:
    model_indexes = find_cell_indexes(
        cells,
        lambda source: (
            "def generate_m0(" in source
            and "M0 loaded and ready for API." in source
        ),
    )
    if len(model_indexes) != 1:
        raise RuntimeError(
            "Expected exactly one M0 model/generation cell; "
            f"found {len(model_indexes)}."
        )

    upsert_cell(
        cells,
        match_predicate=lambda source: (
            "ABC CREATOR M0 — HIGH QUALITY OVERRIDE" in source
            or "ABC CREATOR M0 — EXACT NATIVE OUTPUT" in source
        ),
        source=quality_override_cell(),
        insert_index=model_indexes[0] + 1,
        label="M0 exact native output",
    )

    api_indexes = find_cell_indexes(
        cells,
        lambda source: (
            '@app.post("/generate")' in source
            and '"max_width"' in source
            and '"max_steps"' in source
        ),
    )
    if len(api_indexes) != 1:
        raise RuntimeError(
            "Expected exactly one M0 API cell; "
            f"found {len(api_indexes)}."
        )

    api_cell = cells[api_indexes[0]]
    api_source = join_cell_source(api_cell)
    api_source = api_source.replace("steps: int = 4", "steps: int = 8")
    api_source = api_source.replace('"max_width": 512', '"max_width": 1920')
    api_source = api_source.replace('"max_width": 1024', '"max_width": 1920')
    api_source = api_source.replace('"max_height": 512', '"max_height": 1920')
    api_source = api_source.replace('"max_height": 1024', '"max_height": 1920')
    api_source = api_source.replace('"max_steps": 4', '"max_steps": 8')
    set_cell_source(api_cell, api_source)


def replace_single_assignment(
    cells: list[dict[str, Any]],
    variable: str,
    value_literal: str,
) -> None:
    pattern = re.compile(rf"(?m)^(\s*){re.escape(variable)}\s*=\s*.*$")
    matches = 0

    for cell in cells:
        source = join_cell_source(cell)

        def replacement(match: re.Match[str]) -> str:
            nonlocal matches
            matches += 1
            return f"{match.group(1)}{variable} = {value_literal}"

        updated = pattern.sub(replacement, source)
        if updated != source:
            set_cell_source(cell, updated)

    if matches != 1:
        raise RuntimeError(
            f"Expected exactly one {variable} assignment; found {matches}."
        )


def find_cell_indexes(
    cells: list[dict[str, Any]],
    predicate,
) -> list[int]:
    return [
        index
        for index, cell in enumerate(cells)
        if predicate(join_cell_source(cell))
    ]


def make_code_cell(source: str) -> dict[str, Any]:
    return {
        "cell_type": "code",
        "metadata": {},
        "execution_count": None,
        "outputs": [],
        "source": source,
    }


def registration_cell(slot: Slot) -> str:
    return f'''# ============================================================
# ABC CREATOR M0 — SERVER-SIDE WORKER REGISTRATION
# ============================================================

if not WORKER_ENABLED:
    print("[REGISTRATION] Skipped: outside slot window.")
else:
    import time
    import requests

    registration_payload = {{
        "workerName": WORKER_NAME,
        "publicUrl": public_url,
        "slotStartIST": SLOT_START_IST,
        "slotStopIST": STOP_SESSION_AT_IST,
        "expiresAt": get_slot_window()[1].isoformat(),
        "metadata": {{
            "model": "M0 Z-Image-Turbo",
            "provider": "kaggle",
            "production": True,
            "kernel": {slot.v5_kernel!r},
        }},
    }}

    registration_error = None

    for attempt in range(1, 13):
        try:
            health_response = requests.get(
                public_url + "/health",
                timeout=30,
                headers={{"Cache-Control": "no-store"}},
            )
            health_response.raise_for_status()
            health_payload = health_response.json()

            if (
                health_payload.get("ok") is not True
                or health_payload.get("worker") != WORKER_NAME
                or health_payload.get("accepting_jobs") is not True
            ):
                raise RuntimeError("Worker tunnel is not ready.")

            response = requests.post(
                {REGISTER_URL!r},
                headers={{
                    "Authorization": "Bearer " + WORKER_API_KEY,
                    "x-worker-key": WORKER_API_KEY,
                    "Content-Type": "application/json",
                }},
                json=registration_payload,
                timeout=45,
            )

            print(
                "[REGISTRATION] Attempt",
                str(attempt) + "/12:",
                response.status_code,
                response.text[:500],
            )

            if response.status_code in (200, 201):
                registration_error = None
                print("[REGISTRATION] Worker URL registered successfully.")
                break

            registration_error = RuntimeError(
                "Registration returned HTTP "
                + str(response.status_code)
                + ": "
                + response.text[:500]
            )
        except Exception as error:
            registration_error = error
            print(
                "[REGISTRATION] Attempt",
                str(attempt) + "/12 failed:",
                repr(error),
            )

        if attempt < 12:
            time.sleep(min(10 + attempt * 5, 60))

    if registration_error is not None:
        raise RuntimeError(
            "Worker registration failed after 12 attempts: "
            + str(registration_error)
        )
'''


def exact_stop_cell() -> str:
    return '''# ============================================================
# ABC CREATOR M0 — EXACT SLOT STOP
# ============================================================

if not WORKER_ENABLED:
    print("[SELF-STOP] Skipped: outside slot window.")
else:
    import os
    import subprocess
    import threading

    STOP_EVENT = threading.Event()

    def seconds_until_stop():
        now = ist_now()
        _, slot_stop = get_slot_window()
        return max(1, int((slot_stop - now).total_seconds()))

    def stop_worker():
        global ACCEPTING_JOBS

        print("[SELF-STOP] Exact slot end reached.")
        ACCEPTING_JOBS = False

        try:
            if "tunnel_process" in globals() and tunnel_process is not None:
                tunnel_process.terminate()
                try:
                    tunnel_process.wait(timeout=15)
                except Exception:
                    tunnel_process.kill()
        except Exception as error:
            print("[SELF-STOP] Tunnel shutdown warning:", repr(error))

        try:
            subprocess.run(
                "pkill -f cloudflared || true",
                shell=True,
                check=False,
            )
        except Exception:
            pass

        try:
            if "api_server" in globals() and api_server is not None:
                api_server.should_exit = True
        except Exception as error:
            print("[SELF-STOP] API shutdown warning:", repr(error))

        STOP_EVENT.set()
        print("[SELF-STOP] Graceful stop signal sent.")

    def hard_stop_worker():
        print("[SELF-STOP] Hard fallback reached. Exiting kernel.")
        os._exit(0)

    stop_delay = seconds_until_stop()

    print("[SELF-STOP] Current IST:", ist_now().strftime("%Y-%m-%d %H:%M:%S"))
    print(
        "[SELF-STOP] Scheduled stop:",
        get_slot_window()[1].strftime("%Y-%m-%d %H:%M:%S"),
    )

    graceful_timer = threading.Timer(stop_delay, stop_worker)
    graceful_timer.daemon = True
    graceful_timer.start()

    hard_timer = threading.Timer(stop_delay + 90, hard_stop_worker)
    hard_timer.daemon = True
    hard_timer.start()

    print("[SELF-STOP] Exact-stop timers armed.")
'''


def keepalive_cell() -> str:
    return '''# ============================================================
# ABC CREATOR M0 — KEEP ALIVE UNTIL SLOT END
# ============================================================

if not WORKER_ENABLED:
    print("[KEEPALIVE] Skipped: outside slot window.")
else:
    print("[KEEPALIVE] Worker is live:", public_url)
    print("[KEEPALIVE] Waiting for exact slot end.")

    while not STOP_EVENT.wait(timeout=60):
        pass

    print("[KEEPALIVE] Slot stop received. Notebook ending.")
'''


def upsert_cell(
    cells: list[dict[str, Any]],
    *,
    match_predicate,
    source: str,
    insert_index: int,
    label: str,
) -> int:
    indexes = find_cell_indexes(cells, match_predicate)
    if len(indexes) > 1:
        raise RuntimeError(f"Found more than one {label} cell.")

    if indexes:
        cell = cells.pop(indexes[0])
        set_cell_source(cell, source)
    else:
        cell = make_code_cell(source)

    bounded_index = max(0, min(insert_index, len(cells)))
    cells.insert(bounded_index, cell)
    return bounded_index


def patch_kernel_folder(
    folder: Path,
    slot: Slot,
    worker_key: str,
) -> None:
    metadata_path = folder / "kernel-metadata.json"
    if not metadata_path.exists():
        raise RuntimeError("Pulled kernel did not include kernel-metadata.json.")

    metadata = json.loads(metadata_path.read_text(encoding="utf-8-sig"))
    code_file = str(metadata.get("code_file", "")).strip()
    if not code_file:
        raise RuntimeError("kernel-metadata.json does not contain code_file.")

    notebook_path = folder / code_file
    if not notebook_path.exists():
        raise RuntimeError(f"Notebook file is missing: {code_file}")

    notebook = json.loads(notebook_path.read_text(encoding="utf-8-sig"))
    cells = notebook.get("cells")
    if not isinstance(cells, list):
        raise RuntimeError("Notebook cells are invalid.")

    replace_single_assignment(cells, "WORKER_NAME", repr(slot.worker_name))
    replace_single_assignment(cells, "SLOT_START_IST", repr(slot.warm_start_ist))
    replace_single_assignment(cells, "STOP_SESSION_AT_IST", repr(slot.stop_ist))
    replace_single_assignment(cells, "FORCE_RUN_OUTSIDE_SLOT", "False")
    replace_single_assignment(cells, "WORKER_API_KEY", repr(worker_key))
    patch_m0_quality(cells)

    tunnel_indexes = find_cell_indexes(
        cells,
        lambda source: "[WORKER_READY_URL]" in source and "public_url" in source,
    )
    if len(tunnel_indexes) != 1:
        raise RuntimeError(
            f"Expected exactly one Cloudflare tunnel cell; found {len(tunnel_indexes)}."
        )

    registration_index = upsert_cell(
        cells,
        match_predicate=lambda source: (
            "SERVER-SIDE WORKER REGISTRATION" in source
            or "WORKER-KEY REGISTRATION" in source
            or "REGISTER PUBLIC WORKER URL" in source
            or "FINAL PRODUCTION WORKER REGISTRATION" in source
        ),
        source=registration_cell(slot),
        insert_index=tunnel_indexes[0] + 1,
        label="registration",
    )

    stop_index = upsert_cell(
        cells,
        match_predicate=lambda source: (
            "ABC CREATOR M0 — EXACT SLOT STOP" in source
            or "EXACT SLOT STOP WITH HARD FALLBACK" in source
            or "SAFE SLOT STOP WATCHDOG" in source
            or ("[SELF-STOP]" in source and "seconds_until_stop" in source)
        ),
        source=exact_stop_cell(),
        insert_index=registration_index + 1,
        label="exact-stop",
    )

    upsert_cell(
        cells,
        match_predicate=lambda source: (
            "KEEP ALIVE UNTIL SLOT END" in source
            or "KEEP WORKER ALIVE UNTIL EXACT SLOT END" in source
            or "KEEP WORKER ALIVE UNTIL SLOT END" in source
            or ("[KEEPALIVE]" in source and "STOP_EVENT.wait" in source)
        ),
        source=keepalive_cell(),
        insert_index=stop_index + 1,
        label="keepalive",
    )

    metadata["id"] = slot.v5_kernel
    metadata["title"] = f"ABC M0 Image Worker Scheduled V5 - {slot.account}"
    metadata["is_private"] = True
    metadata["enable_gpu"] = True
    metadata["enable_tpu"] = False
    metadata["enable_internet"] = True
    metadata["machine_shape"] = "NvidiaTeslaT4"

    model_sources = list(metadata.get("model_sources") or [])
    if MODEL_SOURCE not in model_sources:
        model_sources.append(MODEL_SOURCE)
    metadata["model_sources"] = model_sources

    notebook["cells"] = cells

    notebook_path.write_text(
        json.dumps(notebook, ensure_ascii=True, separators=(",", ":")),
        encoding="utf-8",
    )
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    final_text = "\n".join(join_cell_source(cell) for cell in cells)
    required_markers = (
        f"WORKER_NAME = {slot.worker_name!r}",
        f"SLOT_START_IST = {slot.warm_start_ist!r}",
        f"STOP_SESSION_AT_IST = {slot.stop_ist!r}",
        "FORCE_RUN_OUTSIDE_SLOT = False",
        "# ABC CREATOR M0 — EXACT NATIVE OUTPUT",
        "M0_MAX_OUTPUT_SIDE = 1920",
        "M0_FIXED_STEPS = 8",
        "image.crop(",
        "Worker URL registered successfully.",
        "x-worker-key",
        "[SELF-STOP] Exact slot end reached.",
        "STOP_EVENT.wait",
    )
    missing = [marker for marker in required_markers if marker not in final_text]
    if missing:
        raise RuntimeError(f"Patched notebook validation failed: {missing}")


def pull_source_kernel(token: str, slot: Slot, folder: Path) -> str:
    v5_code, _ = kernel_status(token, slot.v5_kernel)
    source_kernel = slot.v5_kernel if v5_code == 0 else slot.v4_kernel

    log(f"Pulling source kernel: {source_kernel}")
    result = kaggle(
        token,
        "kernels",
        "pull",
        source_kernel,
        "-p",
        str(folder),
        "-m",
        timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Unable to pull {source_kernel}:\n{result.stdout.strip()}"
        )

    return source_kernel


def push_with_retries(token: str, slot: Slot, folder: Path) -> None:
    delays = (0, 45, 75, 105)
    last_output = ""

    for attempt, delay in enumerate(delays, start=1):
        if delay:
            log(f"Waiting {delay}s before SaveKernel retry {attempt}/{len(delays)}.")
            time.sleep(delay)

        log(f"Pushing {slot.v5_kernel}, attempt {attempt}/{len(delays)}.")
        result = kaggle(
            token,
            "kernels",
            "push",
            "-p",
            str(folder),
            "--accelerator",
            "NvidiaTeslaT4",
            "--timeout",
            str(MAX_RUNTIME_SECONDS),
            timeout=480,
        )
        last_output = result.stdout.strip()
        log(last_output)

        if result.returncode == 0:
            log("Kaggle accepted the v5 notebook run.")
            return

        if "409" not in last_output and "SaveKernel" not in last_output:
            raise RuntimeError(
                f"Kaggle rejected the v5 notebook push:\n{last_output}"
            )

    raise RuntimeError(
        "Kaggle SaveKernel remained locked after controlled retries. "
        "The scheduled recovery run will try again.\n"
        + last_output
    )


def wait_for_registration(
    token: str,
    slot: Slot,
    worker_key: str,
    *,
    seconds: int = 360,
) -> None:
    deadline = time.time() + seconds

    while time.time() < deadline:
        if active_worker_is_healthy(worker_key, slot.worker_name):
            log(f"Production worker is healthy: {slot.worker_name}")
            return

        _, status = kernel_status(token, slot.v5_kernel)
        log(f"Kaggle status: {status}")

        if status_is_error(status):
            raise RuntimeError(
                f"Kaggle worker entered ERROR before registration: {status}"
            )

        time.sleep(30)

    github_warning(
        "Kaggle accepted the run, but the worker has not registered yet. "
        "The notebook can continue starting after this GitHub job exits; "
        "the scheduled recovery check will verify it."
    )


def run_slot(slot: Slot) -> None:
    token = require_secret(slot.secret_name)
    worker_key = require_secret("M0_WORKER_API_KEY")

    status_code, current_status = kernel_status(token, slot.v5_kernel)
    if status_code == 0:
        log(f"Current v5 status: {current_status}")

        if status_is_active(current_status):
            log("The v5 notebook is already active; no duplicate GPU run will be submitted.")
            wait_for_registration(token, slot, worker_key, seconds=240)
            return

        if active_worker_is_healthy(worker_key, slot.worker_name):
            log("The expected website worker is already healthy; no Kaggle push is needed.")
            return
    else:
        log("The v5 kernel does not exist yet or has no readable status; it will be created.")

    with tempfile.TemporaryDirectory(prefix=f"abc-m0-{slot.account}-") as temp:
        folder = Path(temp)
        pull_source_kernel(token, slot, folder)
        patch_kernel_folder(folder, slot, worker_key)
        log("Temporary private notebook patch validated.")
        push_with_retries(token, slot, folder)

    wait_for_registration(token, slot, worker_key)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--account", required=True, choices=sorted(SLOTS))
    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()
    slot = SLOTS[arguments.account]

    log("ABC Creator M0 GitHub server-side controller")
    log(f"Account: {slot.account}")
    log(f"Worker: {slot.worker_name}")
    log(f"Kernel: {slot.v5_kernel}")
    log(f"Window: {slot.warm_start_ist}-{slot.stop_ist} IST")

    run_slot(slot)
    log("Controller completed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"::error::{error}", file=sys.stderr, flush=True)
        raise SystemExit(1)
