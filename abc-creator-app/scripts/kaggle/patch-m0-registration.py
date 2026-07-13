#!/usr/bin/env python3
"""Insert the M0 registration cell into a Kaggle notebook safely."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Insert m0-register-worker-cell.py immediately after the "
            "Cloudflare worker URL cell in a Kaggle notebook."
        )
    )
    parser.add_argument("notebook", type=Path, help="Path to the .ipynb file")
    parser.add_argument(
        "--cell-file",
        type=Path,
        default=Path(__file__).with_name("m0-register-worker-cell.py"),
        help="Registration cell source file",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional output notebook path. Default: patch in place.",
    )
    return parser.parse_args()


def cell_source(cell: dict) -> str:
    source = cell.get("source", "")
    if isinstance(source, list):
        return "".join(str(item) for item in source)
    return str(source)


def main() -> int:
    args = parse_args()
    notebook_path = args.notebook.resolve()
    cell_file = args.cell_file.resolve()
    output_path = (args.output or notebook_path).resolve()

    if notebook_path.suffix.lower() != ".ipynb":
        raise SystemExit("Notebook path must end in .ipynb")

    if not notebook_path.exists():
        raise SystemExit(f"Notebook not found: {notebook_path}")

    if not cell_file.exists():
        raise SystemExit(f"Registration cell file not found: {cell_file}")

    notebook = json.loads(notebook_path.read_text(encoding="utf-8-sig"))
    cells = notebook.get("cells")

    if not isinstance(cells, list):
        raise SystemExit("Invalid notebook: cells is missing or is not a list")

    registration_marker = "[REGISTRATION] Worker URL registered successfully."

    for cell in cells:
        if registration_marker in cell_source(cell):
            print("Registration cell already exists. No changes made.")
            return 0

    insert_after = None

    for index, cell in enumerate(cells):
        source = cell_source(cell)
        if "[WORKER_READY_URL]" in source and "public_url" in source:
            insert_after = index
            break

    if insert_after is None:
        raise SystemExit(
            "Could not find the Cloudflare cell containing [WORKER_READY_URL]."
        )

    registration_source = cell_file.read_text(encoding="utf-8-sig")
    registration_cell = {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": registration_source,
    }

    cells.insert(insert_after + 1, registration_cell)

    if output_path == notebook_path:
        backup_path = notebook_path.with_name(
            notebook_path.stem + ".before-m0-registration.ipynb"
        )
        if not backup_path.exists():
            shutil.copy2(notebook_path, backup_path)
            print(f"Backup created: {backup_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(notebook, ensure_ascii=True, separators=(",", ":")),
        encoding="utf-8",
    )

    print(f"Registration cell inserted after cell {insert_after + 1}.")
    print(f"Notebook written: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
