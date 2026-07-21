#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path.cwd()
CONTROLLER = ROOT / "automation/m0_kaggle_controller.py"
APP = ROOT / "abc-creator-app"
M0_CLIENT = APP / "lib/image-tools/m0-image-client.ts"
IMAGE_MODELS = APP / "lib/image-tools/image-models.ts"
ROUTE = APP / "app/api/image/text-to-image/route.ts"
INTEGRATION_SCRIPT = APP / "scripts/apply-m0-production-integration.mjs"

OLD_M0_CREDITS = '{ "360p": 2, "480p": 3, "720p": 4, "1080p": 5 }'
M1_CREDITS = '{ "360p": 9, "480p": 11, "720p": 13, "1080p": 15 }'


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    require(count == 1, f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def patch_controller(text: str) -> str:
    new_block = r'''def quality_override_cell() -> str:
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


def replace_single_assignment('''

    pattern = re.compile(
        r"def quality_override_cell\(\) -> str:\n.*?\n\ndef replace_single_assignment\(",
        re.DOTALL,
    )
    text, count = pattern.subn(new_block, text, count=1)
    require(count == 1, f"controller quality block: expected 1 match, found {count}")

    old_markers = '''        "# ABC CREATOR M0 — HIGH QUALITY OVERRIDE",\n        "M0_NATIVE_MAX_SIDE = 1024",\n        "M0_FIXED_STEPS = 8",'''
    new_markers = '''        "# ABC CREATOR M0 — EXACT NATIVE OUTPUT",\n        "M0_MAX_OUTPUT_SIDE = 1920",\n        "M0_FIXED_STEPS = 8",\n        "image.crop(",'''
    text = replace_once(text, old_markers, new_markers, "controller validation markers")
    compile(text, str(CONTROLLER), "exec")
    return text


def patch_m0_client(text: str) -> str:
    constants_anchor = 'const MAX_PROMPT_CHARS = 1_900;\n'
    exact_dimensions = '''const MAX_PROMPT_CHARS = 1_900;\n\nconst M0_16_9_DIMENSIONS: Record<ImageResolution, { width: number; height: number }> = {\n  "360p": { width: 640, height: 360 },\n  "480p": { width: 854, height: 480 },\n  "720p": { width: 1280, height: 720 },\n  "1080p": { width: 1920, height: 1080 },\n};\n\nfunction m0TargetDimensions(resolution: ImageResolution, aspectRatio: ImageAspectRatio) {\n  return aspectRatio === "16:9"\n    ? M0_16_9_DIMENSIONS[resolution]\n    : getImageDimensions(resolution, aspectRatio);\n}\n'''
    text = replace_once(text, constants_anchor, exact_dimensions, "M0 exact dimension map")

    text, count = re.subn(
        r"\nfunction workerDimensions\(width: number, height: number\) \{.*?\n\}\n",
        "\n",
        text,
        count=1,
        flags=re.DOTALL,
    )
    require(count == 1, f"workerDimensions removal: expected 1 match, found {count}")

    text = replace_once(
        text,
        '  const target = getImageDimensions(input.resolution, input.aspectRatio);\n  const native = workerDimensions(target.width, target.height);',
        '  const target = m0TargetDimensions(input.resolution, input.aspectRatio);',
        "M0 target dimensions",
    )
    text = replace_once(text, '        width: native.width,', '        width: target.width,', "M0 request width")
    text = replace_once(text, '        height: native.height,', '        height: target.height,', "M0 request height")
    text = replace_once(text, '        steps: 4,', '        steps: 8,', "M0 request steps")

    old_output = '''    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("M0 worker returned an unreadable image.");
    }

    const output = await sharp(source)
      .resize(target.width, target.height, {
        fit: "cover",
        position: "centre",
        withoutEnlargement: false,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();'''
    new_output = '''    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("M0 worker returned an unreadable image.");
    }
    if (metadata.width !== target.width || metadata.height !== target.height) {
      throw new Error(
        `M0 worker returned ${metadata.width}x${metadata.height}; expected exact ${target.width}x${target.height}.`
      );
    }

    const output = source;'''
    text = replace_once(text, old_output, new_output, "remove M0 Sharp resize")
    text = replace_once(text, '      postProcess: "sharp-resize" as const,', '      postProcess: "native-aligned-crop" as const,', "M0 post-process metadata")

    require(".resize(" not in text, "M0 client still contains a resize call")
    require("workerDimensions" not in text, "M0 client still contains workerDimensions")
    require('steps: 8' in text, "M0 client does not request 8 steps")
    return text


def patch_image_models(text: str) -> str:
    pattern = re.compile(r'(  M0: \{.*?defaultSteps: )4(,.*?creditByResolution: )\{ "360p": 2, "480p": 3, "720p": 4, "1080p": 5 \}(,.*?\n  \},)', re.DOTALL)
    text, count = pattern.subn(r'\g<1>8\g<2>' + M1_CREDITS + r'\g<3>', text, count=1)
    require(count == 1, f"image-models M0 block: expected 1 match, found {count}")
    return text


def patch_route(text: str) -> str:
    count = text.count('"sharp-resize"')
    require(count == 2, f"route sharp-resize metadata: expected 2 matches, found {count}")
    return text.replace('"sharp-resize"', '"native-aligned-crop"')


def patch_credit_maps(text: str) -> str:
    return text.replace(f"M0: {OLD_M0_CREDITS}", f"M0: {M1_CREDITS}")


def patch_integration_script(text: str) -> str:
    text = replace_once(text, f"const M0_CREDITS = '{OLD_M0_CREDITS}';", f"const M0_CREDITS = '{M1_CREDITS}';", "integration M0 credits")
    text = text.replace("defaultSteps: 4,", "defaultSteps: 8,")
    text = text.replace('"sharp-resize"', '"native-aligned-crop"')
    text = text.replace(
        '    serverResize: client.includes("sharp(source)") && client.includes("getImageDimensions"),',
        '    exactNativeOutput: client.includes("M0_16_9_DIMENSIONS") && client.includes("metadata.width !== target.width"),',
    )
    return text


def main() -> None:
    required = [CONTROLLER, M0_CLIENT, IMAGE_MODELS, ROUTE, INTEGRATION_SCRIPT]
    for path in required:
        require(path.exists(), f"Missing required file: {path}")

    updates: dict[Path, str] = {}
    updates[CONTROLLER] = patch_controller(CONTROLLER.read_text(encoding="utf-8"))
    updates[M0_CLIENT] = patch_m0_client(M0_CLIENT.read_text(encoding="utf-8"))
    updates[IMAGE_MODELS] = patch_image_models(IMAGE_MODELS.read_text(encoding="utf-8"))
    updates[ROUTE] = patch_route(ROUTE.read_text(encoding="utf-8"))
    updates[INTEGRATION_SCRIPT] = patch_integration_script(INTEGRATION_SCRIPT.read_text(encoding="utf-8"))

    for path in (APP / "components").glob("*.tsx"):
        original = path.read_text(encoding="utf-8")
        patched = patch_credit_maps(original)
        if patched != original:
            updates[path] = patched

    require(len([p for p in updates if p.parent == APP / "components"]) >= 7, "Expected at least seven image component credit maps to change")

    for path, text in updates.items():
        require(OLD_M0_CREDITS not in text, f"Old M0 credit map remains in {path}")

    client = updates[M0_CLIENT]
    require('"360p": { width: 640, height: 360 }' in client, "Missing 360p exact map")
    require('"480p": { width: 854, height: 480 }' in client, "Missing 480p exact map")
    require('"720p": { width: 1280, height: 720 }' in client, "Missing 720p exact map")
    require('"1080p": { width: 1920, height: 1080 }' in client, "Missing 1080p exact map")
    require(".resize(" not in client, "M0 client contains forbidden resize")

    controller = updates[CONTROLLER]
    require("image.crop(" in controller, "Controller lacks alignment crop")
    require("M0_MAX_OUTPUT_SIDE = 1920" in controller, "Controller lacks 1920 output support")
    require("M0_FIXED_STEPS = 8" in controller, "Controller lacks fixed 8 steps")
    compile(controller, str(CONTROLLER), "exec")

    route = updates[ROUTE]
    require('"sharp-resize"' not in route, "Route still reports sharp-resize")

    for path, text in updates.items():
        path.write_text(text, encoding="utf-8")
        print("Updated", path.relative_to(ROOT))

    print("M0 exact-resolution, no-resize, and M1-credit patch validated.")


if __name__ == "__main__":
    main()
