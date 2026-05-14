#!/usr/bin/env python3
"""
Generate the 4 agent sprite PNGs used by the gamified workspace
(static/assets/agents/dev.png, research.png, ops.png, manager.png).

Run from the repo root:
    python3 scripts/generate_agent_sprites.py

The sprites are intentionally simple, flat, and readable at 28x28 -
they are rendered as a circular badge with a role glyph drawn on top.
Re-running this script is idempotent (PNGs are overwritten).
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw

# Output is 64x64; the workspace renders them at 28x28 via background-size.
SIZE = 64
OUT = Path(__file__).resolve().parent.parent / "static" / "assets" / "agents"
OUT.mkdir(parents=True, exist_ok=True)


def _new_badge(color: tuple[int, int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    # Circular badge with a soft outer ring.
    d.ellipse((1, 1, SIZE - 2, SIZE - 2), fill=color + (255,), outline=(255, 255, 255, 255), width=3)
    # Inner highlight.
    d.ellipse((6, 5, SIZE - 24, SIZE - 30), fill=(255, 255, 255, 60))
    return img, d


def make_dev() -> None:
    img, d = _new_badge((59, 130, 246))  # blue
    # Laptop glyph
    d.rectangle((18, 22, 46, 40), fill=(255, 255, 255, 255), outline=(15, 23, 42, 255), width=2)
    d.rectangle((22, 26, 42, 36), fill=(15, 23, 42, 255))
    d.rectangle((14, 40, 50, 44), fill=(255, 255, 255, 255), outline=(15, 23, 42, 255), width=2)
    img.save(OUT / "dev.png")


def make_research() -> None:
    img, d = _new_badge((245, 158, 11))  # amber
    # Flask glyph
    d.polygon([(28, 18), (36, 18), (36, 28), (44, 44), (20, 44), (28, 28)], fill=(255, 255, 255, 255),
              outline=(15, 23, 42, 255))
    d.line((28, 18, 36, 18), fill=(15, 23, 42, 255), width=2)
    # Bubbles
    d.ellipse((28, 36, 32, 40), fill=(15, 23, 42, 255))
    d.ellipse((34, 38, 37, 41), fill=(15, 23, 42, 255))
    img.save(OUT / "research.png")


def make_ops() -> None:
    img, d = _new_badge((16, 185, 129))  # green
    # Server-rack glyph
    d.rectangle((20, 18, 44, 46), fill=(255, 255, 255, 255), outline=(15, 23, 42, 255), width=2)
    for y in (22, 30, 38):
        d.rectangle((23, y, 41, y + 4), fill=(15, 23, 42, 255))
        d.ellipse((38, y + 1, 40, y + 3), fill=(16, 185, 129, 255))
    img.save(OUT / "ops.png")


def make_manager() -> None:
    img, d = _new_badge((139, 92, 246))  # purple
    # Crown glyph
    d.polygon([
        (18, 40), (22, 22), (28, 32), (32, 18), (36, 32), (42, 22), (46, 40),
    ], fill=(255, 255, 255, 255), outline=(15, 23, 42, 255))
    d.rectangle((18, 40, 46, 46), fill=(255, 255, 255, 255), outline=(15, 23, 42, 255), width=2)
    img.save(OUT / "manager.png")


def main() -> None:
    make_dev()
    make_research()
    make_ops()
    make_manager()
    for f in sorted(OUT.glob("*.png")):
        print("wrote", f.relative_to(OUT.parent.parent), os.path.getsize(f), "bytes")


if __name__ == "__main__":
    main()
