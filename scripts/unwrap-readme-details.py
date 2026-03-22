#!/usr/bin/env python3
"""
Strip outer <details id="..."> wrappers from README.md (keeps nested changelog <details>).
Run: python scripts/unwrap-readme-details.py
"""
import re
from pathlib import Path


def unwrap(path: Path) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r"<details\s+id=", line):
            i += 1
            if i < len(lines) and "<summary>" in lines[i]:
                i += 1
            while i < len(lines) and lines[i].strip() == "":
                i += 1
            depth = 1
            while i < len(lines) and depth > 0:
                ln = lines[i]
                if ln.strip().startswith("<details"):
                    depth += 1
                elif ln.strip() == "</details>":
                    depth -= 1
                    i += 1
                    if depth == 0:
                        break
                    out.append(ln)
                    continue
                out.append(ln)
                i += 1
            continue
        out.append(line)
        i += 1
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Unwrapped: {path}")


if __name__ == "__main__":
    unwrap(Path(__file__).resolve().parent.parent / "README.md")
