# Phase 7 Sync Proposal — Experiments → Canonical → LaTeX → Overleaf

**status:** **implemented (minimal)** — Overleaf deferred  
**decisions:** 1C / 2A / 3A  
**first_run_utc:** 2026-09-04T02:02:16Z

## Active path

```text
experiments/manifests + experiments/results   (SoT, read-only)
        ↓  build_canonical_data.py
research_os/paper/canonical/data.json
        ↓  emit_latex_from_canonical.py
research_os/paper/latex/macros.tex
research_os/paper/latex/tables/*.tex
```

Overleaf sync: **not implemented** (1C).

## Scripts

| Script | Role |
|--------|------|
| `research_os/paper/scripts/build_canonical_data.py` | Explicit snapshot |
| `research_os/paper/scripts/emit_latex_from_canonical.py` | macros + tables |
| `research_os/paper/scripts/run_pipeline.py` | build → emit → verify |

## Safety

- Never writes under `experiments/`
- Aborts on cross-source numeric conflicts
- Does not touch `paper/analysis.md` / `conclusion.md`
- No training hooks
