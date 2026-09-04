# LaTeX manuscript (NeurIPS 2026 preprint)

**Entry:** `main.tex`  
**Compile:** Overleaf pdfLaTeX (see `OVERLEAF.md`)  
**Status:** manuscript body complete → see `../FINAL_STATUS.md`

## Layout

```text
research_os/paper/latex/
  main.tex
  neurips_2026.sty
  macros.tex              # AUTO from pipeline
  tables/*.tex            # AUTO
  figures/*.png
  references.bib          # verified keys only
  sections/
    00_abstract.tex
    01_introduction.tex … 08_conclusion.tex
```

## Data pipeline

```text
experiments/results + manifests
  → research_os/paper/scripts/run_pipeline.py
  → canonical/data.json
  → macros.tex + tables/*
```

```powershell
python research_os/paper/scripts/run_pipeline.py
python research_os/paper/scripts/verify_latex_structure.py
```
