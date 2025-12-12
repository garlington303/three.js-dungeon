"""Slice a 2x2 hand sprite sheet into 3 separate frames.

This script is tailored for the 256x256 hand spritesheet currently in
src/assets/resources/hands/hand_spritesheet.png where:
- Top-left: open hand
- Bottom-left: hand charging/holding fireball
- Bottom-right: hand throwing fireball

Top-right quadrant is ignored.

Usage:
  python scripts/slice_hand_quadrants.py \
    --input src/assets/resources/hands/hand_spritesheet.png \
    --output-dir src/assets/resources/hands

Optional:
  --make-white-transparent   Convert near-white pixels to transparent.
  --white-threshold 245      Threshold for white detection (0-255).
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass

from PIL import Image


@dataclass(frozen=True)
class CropSpec:
    name: str
    box: tuple[int, int, int, int]


def _make_white_transparent(img: Image.Image, threshold: int) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)

    return rgba


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument(
        "--prefix",
        default="hand_fireball",
        help="Output filename prefix (default: hand_fireball)",
    )
    parser.add_argument(
        "--make-white-transparent",
        action="store_true",
        help="Convert near-white pixels to transparent in outputs.",
    )
    parser.add_argument(
        "--white-threshold",
        type=int,
        default=245,
        help="White threshold (0-255). Higher means stricter white detection.",
    )

    args = parser.parse_args()

    src_path = args.input
    out_dir = args.output_dir
    os.makedirs(out_dir, exist_ok=True)

    sheet = Image.open(src_path).convert("RGBA")
    width, height = sheet.size

    if width % 2 != 0 or height % 2 != 0:
        raise SystemExit(f"Expected even dimensions, got {width}x{height}")

    half_w = width // 2
    half_h = height // 2

    # Frame mapping: TL -> 0, BL -> 1, BR -> 2
    crops = [
        CropSpec("0", (0, 0, half_w, half_h)),
        CropSpec("1", (0, half_h, half_w, height)),
        CropSpec("2", (half_w, half_h, width, height)),
    ]

    for spec in crops:
        frame = sheet.crop(spec.box)
        if args.make_white_transparent:
            frame = _make_white_transparent(frame, args.white_threshold)

        out_path = os.path.join(out_dir, f"{args.prefix}_{spec.name}.png")
        frame.save(out_path)
        print(f"Wrote {out_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
