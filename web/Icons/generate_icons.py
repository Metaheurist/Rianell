#!/usr/bin/env python3
"""
Legacy: prefer the repo-root script (single source of truth):

  npm run generate:icons

That reads logo-source.png and writes Icon-*.png with the same padding/background as CI.

If you only have Python + Pillow, this script regenerates from logo-source.png with a
#1a1d1e letterbox to match `scripts/generate-icons.mjs`.
"""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Install with: pip install Pillow")
    raise SystemExit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
SOURCE = SCRIPT_DIR / "logo-source.png"
BG = (26, 29, 30, 255)

SIZES = [
    16, 32, 57, 60, 72, 76, 96, 114, 120, 128,
    144, 152, 167, 180, 192, 384, 512,
]


def render_size(img: Image.Image, size: int) -> Image.Image:
    """Fit image inside size×size with brand background (same idea as sharp contain)."""
    canvas = Image.new("RGBA", (size, size), BG)
    iw, ih = img.size
    scale = min(size / iw, size / ih)
    tw, th = max(1, int(iw * scale)), max(1, int(ih * scale))
    thumb = img.resize((tw, th), Image.Resampling.LANCZOS)
    ox = (size - tw) // 2
    oy = (size - th) // 2
    if thumb.mode != "RGBA":
        thumb = thumb.convert("RGBA")
    canvas.paste(thumb, (ox, oy), thumb)
    return canvas


def main():
    if not SOURCE.exists():
        print(f"Source image not found: {SOURCE}")
        raise SystemExit(1)

    img = Image.open(SOURCE).convert("RGBA")

    for s in SIZES:
        out_path = SCRIPT_DIR / f"Icon-{s}.png"
        render_size(img, s).save(out_path, "PNG", optimize=True)
        print(f"  {out_path.name}")

    print(f"Generated {len(SIZES)} icons from {SOURCE.name}")


if __name__ == "__main__":
    main()
