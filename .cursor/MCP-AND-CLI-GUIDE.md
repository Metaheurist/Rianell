# Team UI/UX Environment Guide

Integrated design guardrails for the Rianell monorepo: Impeccable, Taste Skill, Awesome Design MD, SkillUI, UI UX Pro Max, and 21st.dev Magic MCP.

## 1. Local CLI Execution Commands

| Tool | Command | Purpose |
|------|---------|---------|
| **Impeccable** | `npx impeccable run` | Layout polish and 23-point alignment pass |
| **Impeccable skills** | `npx impeccable skills install` | Install / refresh Cursor hooks and skill tree |
| **SkillUI** | `npx skillui --url <target-url> --mode ultra` | Crawl and dissect live interfaces |
| **SkillUI (local)** | `npx skillui --dir apps/pwa-webapp --format both` | Extract tokens from monorepo surfaces |
| **Awesome Design MD** | `npx getdesign@latest add <brand>` | Bootstrap or refresh root `DESIGN.md` |
| **UI UX Pro Max** | `npx ui-ux-pro-max-cli init --ai cursor` | Install spacing & visual playbook (`uipro` alias) |
| **Taste Skill** | `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend` | Anti-slop frontend design skill |

Legacy alias documented in some playbooks: `sipro init --ai <framework>` → use `npx ui-ux-pro-max-cli init --ai cursor` instead.

## 2. Global Cursor Settings Setup

To map production-grade component tokens directly to your Cursor chat sessions, navigate to:

**Cursor Settings → Features → MCP → Add New MCP Server**

| Field | Value |
|-------|-------|
| **Name** | `21st-magic` |
| **Type** | command |
| **Command** | `npx -y @21st-dev/magic` |

> Package note: npm publishes this as `@21st-dev/magic` (repo: [21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp)). The `magic-mcp` suffix is the GitHub repo name, not the npm package name.

Project-level MCP config is also in `.cursor/mcp.json` under the `21st-magic` server entry.

## 3. Committed Cursor assets (team sync)

These paths are **tracked in git** for shared onboarding:

- `.cursor/rules/` - layout and brand guardrail matrices
- `.cursor/skills/` - Impeccable, Taste, SkillUI, UI UX Pro Max, and project skills
- `.cursor/hooks.json` - Impeccable pre-edit detector hook
- `.cursor/MCP-AND-CLI-GUIDE.md` - this file

Local-only caches (firecrawl, mcp.json secrets) remain gitignored.

## 4. Six-tool registration matrix

| # | Tool | Workspace location | Status |
|---|------|-------------------|--------|
| 1 | Impeccable | `.cursor/skills/impeccable/` + `hooks.json` | Installed |
| 2 | Taste Skill | `.cursor/skills/design-taste-frontend/` | Installed |
| 3 | Awesome Design MD | Root `DESIGN.md` | Installed (airbnb baseline) |
| 4 | SkillUI | `.cursor/skills/skillui/` + `npx skillui` CLI | Scaffolded |
| 5 | UI UX Pro Max | `.cursor/skills/ui-ux-pro-max/` (+ related skills) | Installed |
| 6 | 21st.dev Magic MCP | `.cursor/mcp.json` → `21st-magic` | Configured |

## 5. First-time developer checklist

1. Pull latest - rules and skills arrive via git.
2. Run `npx impeccable skills install` if hooks are missing locally.
3. Restart Cursor after MCP or skill installs.
4. Read `DESIGN.md` before UI work; customize for Rianell brand over time.
5. For layout tasks, agents auto-load `layout-guardrails.mdc`; for tokens, `brand-tokens.mdc`.
