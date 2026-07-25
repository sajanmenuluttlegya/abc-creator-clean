#!/usr/bin/env python3
"""Self-healing slot selector for the six ABC Creator M0 Kaggle workers.

Scheduled runs select the worker whose 15-minute warm-up window is active.
Manual runs may target any account explicitly. The existing controller remains
the single source of truth for notebook patching, Kaggle submission, and
duplicate-run detection.
"""

from __future__ import annotations

import argparse
import tempfile
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import m0_kaggle_controller as core

IST = ZoneInfo("Asia/Kolkata")

# Sorted by minute-of-day. Before 03:45, the most recent circular start is
# cinefax at 23:45 on the previous calendar day.
WARM_STARTS: tuple[tuple[int, str], ...] = (
    (3 * 60 + 45, "steverichards77"),
    (7 * 60 + 45, "ashstizhard"),
    (11 * 60 + 45, "dpstards"),
    (15 * 60 + 45, "iitmania"),
    (19 * 60 + 45, "assskr"),
    (23 * 60 + 45, "cinefax"),
)


def expected_account(now_ist: datetime) -> str:
    minute_of_day = now_ist.hour * 60 + now_ist.minute
    account = WARM_STARTS[-1][1]

    for start_minute, candidate in WARM_STARTS:
        if minute_of_day < start_minute:
            break
        account = candidate

    return account


def worker_is_healthy(worker_key: str, worker_name: str) -> bool:
    try:
        return core.active_worker_is_healthy(worker_key, worker_name)
    except Exception as error:
        core.github_warning(
            "Website worker health lookup failed; Kaggle state will be checked: "
            + str(error)
        )
        return False


def recover_slot(slot: core.Slot) -> None:
    token = core.require_secret(slot.secret_name)
    worker_key = core.require_secret("M0_WORKER_API_KEY")

    if worker_is_healthy(worker_key, slot.worker_name):
        core.log(
            "The expected website worker is healthy; no Kaggle action is needed."
        )
        return

    status_code, current_status = core.kernel_status(token, slot.v5_kernel)

    if status_code == 0:
        core.log(f"Current v5 status: {current_status}")

        if core.status_is_active(current_status):
            core.log(
                "The expected notebook is already running, queued, or initializing; "
                "no duplicate GPU run will be submitted. A later scheduled check "
                "will verify registration."
            )
            return
    else:
        core.log(
            "The v5 kernel has no readable status; the controller will restore "
            "and submit it."
        )

    with tempfile.TemporaryDirectory(prefix=f"abc-m0-{slot.account}-") as temp:
        folder = Path(temp)
        core.pull_source_kernel(token, slot, folder)
        core.patch_kernel_folder(folder, slot, worker_key)
        core.log("Temporary private notebook patch validated.")
        core.push_with_retries(token, slot, folder)

    core.log(
        "Kaggle accepted the worker run. The next scheduled controller check "
        "will verify website registration and recover it if the run fails."
    )


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--account",
        default="current",
        choices=["current", *sorted(core.SLOTS)],
        help="Use current for automatic IST slot selection, or name one account.",
    )
    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()
    now_ist = datetime.now(IST)
    account = (
        expected_account(now_ist)
        if arguments.account == "current"
        else arguments.account
    )
    slot = core.SLOTS[account]

    core.log("ABC Creator M0 self-healing slot controller")
    core.log(f"Current IST: {now_ist:%Y-%m-%d %H:%M:%S}")
    core.log(f"Selected account: {slot.account}")
    core.log(f"Worker: {slot.worker_name}")
    core.log(f"Kernel: {slot.v5_kernel}")
    core.log(f"Warm-start/stop window: {slot.warm_start_ist}-{slot.stop_ist} IST")

    recover_slot(slot)
    core.log("Controller check completed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"::error::{error}", flush=True)
        raise SystemExit(1)
