#!/usr/bin/env python3
"""
Generate app icon sizes from Icon-144.png.
Run from this directory: python generate_icons.py
Requires: pip install Pillow
"""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Install with: pip install Pillow")
    raise SystemExit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
SOURCE = SCRIPT_DIR / "Icon-144.png"

# Sizes used by index.html (apple-touch, favicon), manifest.json, notifications
SIZES = [
    16, 32, 57, 60, 72, 76, 96, 114, 120, 128,
    144, 152, 167, 180, 192, 384, 512,
]


def main():
    if not SOURCE.exists():
        print(f"Source image not found: {SOURCE}")
        raise SystemExit(1)

    img = Image.open(SOURCE).convert("RGBA")
    if img.size != (144, 144):
        print(f"Resizing source from {img.size} to 144x144 for consistency")
        img = img.resize((144, 144), Image.Resampling.LANCZOS)

    for size in SIZES:
        out_path = SCRIPT_DIR / f"Icon-{size}.png"
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(out_path, "PNG", optimize=True)
        print(f"  {out_path.name}")

    print(f"Generated {len(SIZES)} icons from {SOURCE.name}")


if __name__ == "__main__":
    main()
