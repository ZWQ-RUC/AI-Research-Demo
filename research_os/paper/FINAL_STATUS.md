# Final Paper Status

## Status

**READY_FOR_FINAL_PDF_QA**

## Completed

- [x] manuscript body (Abstract → Conclusion)
- [x] canonical data (`paper/canonical/data.json`)
- [x] LaTeX macros (`latex/macros.tex`)
- [x] tables (`latex/tables/`)
- [x] figures (`latex/figures/`)
- [x] references (`He2016DeepResidual`, `He2016IdentityMappings`)
- [x] claim audit (prior PASS WITH WARNINGS; HIGH/MEDIUM fixes applied)
- [x] numerical audit (macros ≡ canonical)
- [x] citation audit (verified keys only; no invented refs)
- [x] structural audit (`verify_latex_structure.py` → **STRUCTURAL VERIFY OK**)
- [x] title finalized (no Engineering Scaffold body)
- [x] author block = honest anonymous placeholder (no invented identity)

## Manuscript location

```text
research_os/paper/latex/main.tex
```

Upload / compile guide: `research_os/paper/latex/OVERLEAF.md`

## Scientific Scope

- CIFAR-10
- depth-20 (`6n+2` with **n=3**)
- ResNet-20-A / Plain-20 / PreAct-ResNet-20-A
- shortcut Option A
- frozen post-activation training recipe
- single seed (`seed=null`; single-run artifacts)

## Main Findings (canonical / macros)

| Model | Best test error |
|-------|----------------:|
| Plain-20 | 9.68% (`\ErrPlain`) |
| ResNet-20-A | 8.41% (`\ErrResNet`) |
| PreAct-ResNet-20-A | 9.47% (`\ErrPreAct`) |
| Ablation A | 8.32% (`\ErrAblationA`) |
| Ablation B | numerical instability (`\AblationBStatus`); **not** an accuracy baseline |

| Delta | Value |
|-------|------:|
| ResNet vs Plain (advantage) | 1.27 pp |
| PreAct − ResNet | +1.06 pp |
| Ablation A − PreAct | −1.15 pp |
| Ablation A vs ResNet | 0.09 pp magnitude (`\DeltaAblationAMinusResNet` = −0.09) |

**Primary negative result wording:** the hypothesized improvement was **not supported** under the frozen training recipe and single-seed setting.

## Important Non-Claims

Do **not** claim:

- PreAct is generally ineffective / universally worse / “does not work on CIFAR”
- Ablation A is a validated or statistically significant improvement
- Ablation B provides a fair accuracy comparison
- multi-seed robustness or mean±std
- ImageNet / deeper-net / retuned-PreAct generalization
- a new architecture family or state-of-the-art method
- that reviewer-requested follow-ups (LR rescue, multi-seed) were executed

## Remaining Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Local pdfLaTeX | process | `LOCAL_COMPILE = UNAVAILABLE` → compile on Overleaf |
| PDF visual QA | process | pending human Overleaf pass |
| Authorship / affiliation | process | anonymous placeholder until human decision |
| Phase 3/5 env & aug log identity | `NEEDS_VERIFICATION` | carry-forward; configs prescribe shared recipe |
| Broader Related Work survey | `NEEDS_VERIFICATION` / optional literature | not required for current claim scope |
| PreAct retune / Ablation B rescue / multi-seed | future / `[REQUIRES_EXPERIMENT]` | **not** done |

Unused non-input leftovers (harmless): `sections/00_scaffold.tex`, `sections/07_conclusion.tex`.

## QA snapshot (finalization pass)

| Check | Result |
|-------|--------|
| Structural | PASS |
| Numerical / Canonical | PASS |
| Citation | PASS (warnings only: narrow RW + NV markers) |
| Claim | PASS WITH WARNINGS (bounded; no forbidden generalizations found in active sections) |
| Local compile | UNAVAILABLE |
| PDF visual QA | PENDING |

## Final Recommendation

**READY_FOR_FINAL_PDF_QA**

Next human step: Overleaf upload → pdfLaTeX + BibTeX → visual PDF check → Human Final Science Gate → authorship freeze → (optional) Phase 8.
