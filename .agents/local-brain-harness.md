# Agent Manifest: Local Brain & Workspace Harness Protocol

This project utilizes a decentralized agentic workflow optimized for local developer workstations running high-parameter local models alongside IDE automated harnesses.

## System Topology
1. **Intelligence Core:** Ollama API (`http://localhost:11434`) -> `qwen2.5-coder:32b`.
2. **Context & Execution Engine:** Cursor IDE Agentic Loop / Workspace Terminal Harness.

## Preflight: Serve-Before-Consult (Mandatory)
The harness must never assume the brain is running. Before consulting the local model it runs:

```bash
npm run brain:ensure        # -> node scripts/dev/ensure-ollama.mjs
```

The preflight is idempotent and self-healing:
* Pings the Ollama daemon; if down, launches `ollama serve` (detached) and waits for it to answer.
* Lists installed models via `/api/tags`; if `qwen2.5-coder:32b` is absent, runs `ollama pull qwen2.5-coder:32b`.
* Exits `0` only when the daemon is reachable **and** the model is available.

Environment overrides: `OLLAMA_HOST`, `OLLAMA_MODEL`, `OLLAMA_SERVE_TIMEOUT_MS`.

## Immutable Execution Directives

### For UI, Component, & SVG Design Workflows
* **Pure Vector Paths:** All generated standalone graphics or icons must utilize hand-crafted, semantic vector primitive tags (`<rect>`, `<circle>`, `<path>`) inside a standardized `viewBox="0 0 24 24"` container. Avoid bloated, auto-traced asset parameters.
* **CSS Consistency:** UI layout components must explicitly rely on strict design systems (e.g., Tailwind CSS utility structures using an aligned 8px spacing grid).
* **Isolation:** Suppress conversational formatting inside code file modifications. The harness must apply pure, uninterrupted source blocks straight to the repository tree.

### Split-Brain Workspace Execution Loop
0. **Preflight:** Harness runs `npm run brain:ensure` to guarantee the local brain is served (starting/pulling as needed) before anything else.
1. **Ingest:** Harness scans current directory mapping, git states, and file structures.
2. **Consult:** Harness pipes context to the 32B local model to compute structural logic.
3. **Write:** Local model outputs the plan and full code blocks.
4. **Deploy:** Harness executes file creations, patch diffs, and validation tests natively.
