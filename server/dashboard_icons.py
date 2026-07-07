"""
Minimal SVG-style icons for the Tk dashboard (stroke paths, no extra deps).
Paths use a 24×24 viewBox; rendered on Canvas widgets.
"""

from __future__ import annotations

import tkinter as tk
from typing import Iterable, Sequence

# Each icon: list of (x1,y1,x2,y2) line segments in 24×24 space
ICON_PATHS: dict[str, Sequence[tuple[float, float, float, float]]] = {
    'home': (
        (3, 10, 12, 3), (12, 3, 21, 10), (21, 10, 21, 20), (21, 20, 3, 20), (3, 20, 3, 10),
        (9, 20, 9, 14), (9, 14, 15, 14), (15, 14, 15, 20),
    ),
    'database': (
        (4, 6, 20, 6), (4, 6, 4, 12), (4, 12, 20, 12), (20, 12, 20, 6),
        (4, 12, 4, 18), (4, 18, 20, 18), (20, 18, 20, 12),
        (8, 6, 8, 4), (16, 6, 16, 4),
    ),
    'tools': (
        (14, 4, 20, 10), (20, 10, 17, 13), (13, 9, 11, 11), (11, 11, 4, 18), (4, 18, 6, 20),
        (6, 20, 13, 13), (13, 13, 11, 11),
    ),
    'terminal': (
        (4, 5, 20, 5), (20, 5, 20, 19), (20, 19, 4, 19), (4, 19, 4, 5),
        (7, 9, 11, 12), (11, 12, 7, 15), (13, 15, 17, 15),
    ),
    'globe': (
        (12, 3, 12, 21), (3, 12, 21, 12),
        (5, 7, 19, 7), (5, 17, 19, 17),
        (6, 5, 6, 19), (18, 5, 18, 19),
    ),
    'refresh': (
        (20, 12, 20, 8), (20, 8, 16, 4), (16, 4, 12, 4), (12, 4, 8, 8), (8, 8, 8, 12),
        (4, 12, 4, 16), (4, 16, 8, 20), (8, 20, 12, 20), (12, 20, 16, 16), (16, 16, 16, 12),
    ),
    'search': (
        (10, 4, 16, 10), (16, 10, 10, 16), (10, 16, 4, 10), (4, 10, 10, 4),
        (16, 16, 20, 20),
    ),
    'download': (
        (12, 4, 12, 14), (8, 10, 12, 14), (12, 14, 16, 10),
        (6, 18, 18, 18),
    ),
    'play': (
        (8, 6, 18, 12), (18, 12, 8, 18), (8, 18, 8, 6),
    ),
    'pause': (
        (8, 6, 8, 18), (16, 6, 16, 18),
    ),
    'broadcast': (
        (12, 16, 12, 20), (8, 14, 6, 18), (16, 14, 18, 18),
        (4, 10, 2, 14), (20, 10, 22, 14), (12, 4, 12, 12),
    ),
    'trash': (
        (6, 7, 18, 7), (8, 7, 8, 5), (8, 5, 16, 5), (16, 5, 16, 7),
        (7, 7, 8, 19), (8, 19, 16, 19), (16, 19, 17, 7),
        (10, 10, 10, 16), (14, 10, 14, 16),
    ),
    'export': (
        (12, 14, 12, 4), (8, 8, 12, 4), (12, 4, 16, 8),
        (6, 18, 18, 18),
    ),
    'flask': (
        (10, 4, 14, 4), (14, 4, 15, 10), (15, 10, 18, 16), (18, 16, 6, 16), (6, 16, 9, 10), (9, 10, 10, 4),
        (8, 19, 16, 19),
    ),
    'file': (
        (8, 4, 14, 4), (14, 4, 16, 6), (16, 6, 16, 20), (16, 20, 8, 20), (8, 20, 8, 4),
        (11, 10, 14, 10), (11, 14, 14, 14),
    ),
    'package': (
        (4, 8, 12, 4), (12, 4, 20, 8), (20, 8, 20, 18), (20, 18, 4, 18), (4, 18, 4, 8),
        (12, 4, 12, 18), (4, 8, 20, 8),
    ),
    'chrome': (
        (12, 4, 20, 8), (20, 8, 18, 18), (18, 18, 6, 18), (6, 18, 4, 8), (4, 8, 12, 4),
        (12, 4, 12, 12), (12, 12, 8, 10), (12, 12, 16, 10),
    ),
    'chevron': (
        (9, 6, 15, 12), (15, 12, 9, 18),
    ),
    'filter': (
        (4, 6, 20, 6), (8, 12, 16, 12), (10, 18, 14, 18),
    ),
    'clear': (
        (6, 6, 18, 18), (18, 6, 6, 18),
    ),
}


def draw_icon(
    canvas: tk.Canvas,
    name: str,
    *,
    size: int = 20,
    color: str = '#dff0eb',
    pad: float = 2.0,
) -> None:
    """Draw a named icon centered in the canvas."""
    canvas.delete('all')
    paths = ICON_PATHS.get(name)
    if not paths:
        return
    scale = (size - pad * 2) / 24.0
    ox = pad
    oy = pad
    for x1, y1, x2, y2 in paths:
        canvas.create_line(
            ox + x1 * scale, oy + y1 * scale,
            ox + x2 * scale, oy + y2 * scale,
            fill=color, width=max(1.4, size / 14), capstyle='round', joinstyle='round',
        )


def icon_canvas(
    parent,
    name: str,
    *,
    size: int = 20,
    color: str = '#dff0eb',
    bg: str = '#121815',
) -> tk.Canvas:
    c = tk.Canvas(parent, width=size, height=size, bg=bg, highlightthickness=0, bd=0)
    draw_icon(c, name, size=size, color=color)
    return c
