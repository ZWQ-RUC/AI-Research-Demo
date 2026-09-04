# Overleaf compile instructions

Local machine may have **no** TeX distribution. Compile on **Overleaf** (or any pdfLaTeX host).

## Upload (manual)

1. Create/open an Overleaf project.
2. Upload the **contents** of `research_os/paper/latex/` (keep relative paths):
   - `main.tex`
   - `neurips_2026.sty`
   - `macros.tex`
   - `tables/`
   - `figures/`
   - `sections/`
   - `references.bib`
   - optional: `checklist.tex` (not `\input` by `main.tex`)
3. Menu → **Main document** → `main.tex`
4. Menu → **Compiler** → `pdfLaTeX`
5. Recompile (run BibTeX / second pdflatex pass if citations show as `?`)

## Expected PDF smoke-check

- Title: *Revisiting Pre-activation Residual Blocks under a Frozen Training Recipe*
- Abstract + full body sections render
- Headline macros: 9.68 / 8.41 / 9.47 / 8.32 (and deltas)
- Tables: main results + deltas
- Figures: phase2 / phase4 / phase5 plots as referenced
- Bibliography: He et al.\ ResNet + Identity Mappings

## After editing macros/tables locally

```powershell
python research_os/paper/scripts/run_pipeline.py
```

Then re-upload generated `macros.tex` / `tables/` if needed.

## Notes

- Numeric SoT: `experiments/results/` + `experiments/manifests/` → `canonical/data.json` → macros.
- Do not hand-edit `macros.tex` or generated `tables/`.
- Unused leftovers (`sections/00_scaffold.tex`, `sections/07_conclusion.tex`) are **not** input by `main.tex`.
