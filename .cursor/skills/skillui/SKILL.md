---
name: skillui
description: >-
  Visual Production Crawler - reverse-engineer design systems from live URLs,
  git repos, or local project directories. Use when crawling reference interfaces,
  extracting layout tokens, or producing DESIGN.md + skill packages for brand
  alignment. Pure static analysis; no API keys required.
---

# SkillUI - Visual Production Crawler

Reverse-engineer design systems from any project. Pure static analysis - no AI, no API keys.

## When to use

- User provides a reference URL, competitor site, or design-system repo to mirror
- Brand token work needs crawled spacing, typography, or color evidence
- `DESIGN.md` should be refreshed from a live surface or local app directory
- Cross-checking `brand-tokens.mdc` rules against real extracted values

## CLI commands

### Crawl a live website (ultra mode)

```bash
npx skillui --url <target-url> --mode ultra --screens 5 --format both --out .cursor/skills/skillui/scans
```

### Scan a local directory

```bash
npx skillui --dir apps/pwa-webapp --format both --out .cursor/skills/skillui/scans
```

### Clone and scan a git repository

```bash
npx skillui --repo <git-url> --format design-md --out .cursor/skills/skillui/scans
```

### DESIGN.md only (no skill packaging)

```bash
npx skillui --url <target-url> --no-skill --out .
```

## Output layout

| Flag | Output |
|------|--------|
| `--format design-md` | `DESIGN.md` token file |
| `--format skill` | Cursor-compatible skill package |
| `--format both` | Both artifacts (default) |

Store team crawl artifacts under `.cursor/skills/skillui/scans/<project-name>/`.

## Agent workflow

1. Confirm target URL or directory with the user when ambiguous.
2. Run SkillUI with `--mode ultra` for multi-page live crawls (max `--screens` pages).
3. Diff extracted tokens against root `DESIGN.md` and existing CSS custom properties.
4. Propose merges - preserve Rianell health-brand overrides; do not blindly overwrite.
5. Reference scan output in PR descriptions when brand tokens change.

## Integration matrix

| Tool | Role |
|------|------|
| `DESIGN.md` (getdesign) | Canonical brand baseline |
| Impeccable `/extract` | Sidecar `.impeccable/design.json` |
| `brand-tokens.mdc` | Cursor rule trigger for token edits |
| UI UX Pro Max | Spacing playbook after tokens are set |
