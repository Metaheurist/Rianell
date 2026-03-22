#!/usr/bin/env python3
"""Style README: styled TOC, emoji ## headings, flatten changelog <details> to ###."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "README.md"

EMOJI_HEADINGS = [
    ("## Security", "## 🔒 Security"),
    ("## App overview", "## 🏠 App overview"),
    ("## Features", "## ✨ Features"),
    ("## Project structure\n", "## 📁 Project structure\n"),  # quick list section
    ("## Installation", "## ⚙️ Installation"),
    ("## Usage", "## 🚀 Usage"),
    ("## React shell & Android APK", "## 📱 React shell & Android APK"),
    ("## Testing Data", "## 🧪 Testing Data"),
    ("## Configuration", "## 🔧 Configuration"),
    ("## AI Analysis: Neural Network Architecture", "## 🧠 AI Analysis: Neural Network Architecture"),
    ("## Project Structure\n", "## 🗂️ Project Structure\n"),  # tree section
    ("## Dependencies", "## 📦 Dependencies"),
    ("## Development", "## 🛠️ Development"),
    ("## GDPR Compliance", "## 🛡️ GDPR Compliance"),
    ("## Troubleshooting", "## 💡 Troubleshooting"),
    ("## Security notes", "## 🔐 Security notes"),
    ("## Author", "## 👤 Author"),
    ("## Licence", "## 📄 Licence"),
    ("## Repository", "## 📂 Repository"),
    ("## Support", "## 💬 Support"),
    ("## Changelog", "## 📜 Changelog"),
]

TOC = """---

### 📑 Navigate

| | |
| :--- | :--- |
| 🔒 | **[Security](#security)** |
| 🏠 | **[App overview](#app-overview)** |
| ✨ | **[Features](#features)** |
| 📁 | **[Project structure](#project-structure)** (quick list) |
| ⚙️ | **[Installation](#installation)** |
| 🚀 | **[Usage](#usage)** |
| 📱 | **[React shell & Android APK](#react-shell-android-apk)** |
| 🧪 | **[Testing Data](#testing-data)** |
| 🔧 | **[Configuration](#configuration)** |
| 🧠 | **[AI Analysis: Neural Network Architecture](#ai-analysis-neural-network-architecture)** |
| 🗂️ | **[Project Structure](#project-structure-1)** (full repo tree) |
| 📦 | **[Dependencies](#dependencies)** |
| 🛠️ | **[Development](#development)** |
| 🛡️ | **[GDPR Compliance](#gdpr-compliance)** |
| 💡 | **[Troubleshooting](#troubleshooting)** |
| 🔐 | **[Security notes](#security-notes)** |
| 👤 | **[Author](#author)** |
| 📄 | **[Licence](#licence)** |
| 📂 | **[Repository](#repository)** |
| 💬 | **[Support](#support)** |
| 📜 | **[Changelog](#changelog)** |

---
"""


def flatten_changelog_details(text: str) -> str:
    """Turn <details><summary><strong>v…</strong>…</summary>…</details> into ### headings."""

    def repl(m: re.Match) -> str:
        ver = m.group(1).strip()
        rest = m.group(2).strip()
        body = m.group(3).strip()
        title = f"{ver} {rest}".strip()
        return f"### {title}\n\n{body}\n"

    pattern = re.compile(
        r"<details>\s*\n<summary><strong>([^<]+)</strong>([^<]*)</summary>\s*\n(.*?)\n</details>",
        re.DOTALL,
    )
    return pattern.sub(repl, text)


def main() -> None:
    text = README.read_text(encoding="utf-8")

    if "## 🔒 Security" in text and "### 📑 Navigate" in text:
        print("README already polished; nothing to do.")
        return

    # Replace TOC block (from ## Table of contents through blank line before ## Security)
    old_toc = re.search(
        r"## Table of contents\n\nExpand a section below or jump here:\n\n.*?\n\n(?=## Security)",
        text,
        re.DOTALL,
    )
    if not old_toc:
        raise SystemExit("Could not find Table of contents block")
    text = text[: old_toc.start()] + TOC + "\n" + text[old_toc.end() :]

    for old, new in EMOJI_HEADINGS:
        if old not in text:
            raise SystemExit(f"Missing expected heading: {old!r}")
        text = text.replace(old, new, 1)

    text = flatten_changelog_details(text)

    text = text.replace(
        "Changelog is derived from project commit history. Versions follow semantic versioning (major.minor.patch). Expand a section to see details.",
        "Changelog is derived from project commit history. Versions follow semantic versioning (major.minor.patch).",
    )

    README.write_text(text, encoding="utf-8")
    print(f"Polished {README}")


if __name__ == "__main__":
    main()
