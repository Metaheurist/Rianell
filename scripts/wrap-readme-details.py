#!/usr/bin/env python3
"""
One-off helper: wrap top-level ## sections in README.md with <details>/<summary>
and prepend a Table of contents. Run from repo root:
  python scripts/wrap-readme-details.py
"""
import re
from pathlib import Path


def github_slug(title: str) -> str:
    """Approximate GitHub heading anchor for ## titles (ASCII)."""
    s = title.strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    path = root / "README.md"
    text = path.read_text(encoding="utf-8")

    if '<details id="security">' in text:
        print("README already has wrapped sections; nothing to do.")
        return

    parts = re.split(r"\n(?=## )", text)
    preamble = parts[0].rstrip()
    sections = []
    for block in parts[1:]:
        lines = block.split("\n")
        if not lines[0].startswith("## "):
            continue
        title = lines[0][3:].strip()
        body = "\n".join(lines[1:])
        sections.append((title, body))

    toc_lines = [
        "## Table of contents",
        "",
        "Expand a section below or jump here:",
        "",
    ]
    for title, _ in sections:
        slug = github_slug(title)
        toc_lines.append(f"- [{title}](#{slug})")
    toc_lines.append("")

    out: list[str] = [preamble, "", "\n".join(toc_lines)]

    for title, body in sections:
        slug = github_slug(title)
        block = "\n".join(
            [
                f'<details id="{slug}">',
                f"<summary><strong>{title}</strong></summary>",
                "",
                f"## {title}",
                body.rstrip(),
                "",
                "</details>",
                "",
            ]
        )
        out.append(block)

    path.write_text("\n".join(out).rstrip() + "\n", encoding="utf-8")
    print(f"Wrote {path} ({len(sections)} sections wrapped)")


if __name__ == "__main__":
    main()
