#!/usr/bin/env python3
"""Structural validation for latex/ engineering (no local TeX required)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # AI-Research-Demo
LATEX = ROOT / "research_os" / "paper" / "latex"

REQUIRED_FILES = [
    "neurips_2026.sty",
    "macros.tex",
    "sections/00_abstract.tex",
    "sections/01_introduction.tex",
    "sections/02_related_work.tex",
    "sections/03_method.tex",
    "sections/04_experiments.tex",
    "sections/05_results.tex",
    "sections/06_discussion.tex",
    "sections/07_limitations.tex",
    "sections/08_conclusion.tex",
    "tables/main_results.tex",
    "tables/deltas.tex",
    "figures/phase4_best_test_error_bar.png",
    "references.bib",
    "main.tex",
]

FORBIDDEN_HEADLINE = ["9.68", "8.41", "9.47", "8.32"]
DISCUSSION_LEAK = [
    "because",
    "due to",
    "causal",
    "optimization difficulty",
    "generalization mechanism",
    "deeper networks",
    "statistically significant",
    "robust improvement",
    "consistently better",
]


def must(cond: bool, msg: str, errors: list[str]) -> None:
    if not cond:
        errors.append(msg)
        print("FAIL:", msg)
    else:
        print("OK  :", msg)


def main() -> int:
    errors: list[str] = []
    main_tex = (LATEX / "main.tex").read_text(encoding="utf-8")

    for rel in REQUIRED_FILES:
        must((LATEX / rel).is_file(), f"{rel} present", errors)

    must(r"\documentclass" in main_tex, "has \\documentclass", errors)
    must(r"\begin{document}" in main_tex, "has \\begin{document}", errors)
    must(r"\end{document}" in main_tex, "has \\end{document}", errors)

    must(r"\usepackage[preprint]{neurips_2026}" in main_tex, "loads neurips_2026 (unescaped)", errors)
    must(r"\input{macros.tex}" in main_tex, "inputs macros.tex", errors)
    must(r"\graphicspath{{figures/}}" in main_tex, "graphicspath set to figures/", errors)
    must(r"\input{sections/00_abstract.tex}" in main_tex, "inputs sections/00_abstract.tex (unescaped)", errors)

    for name in [
        "01_introduction",
        "02_related_work",
        "03_method",
        "04_experiments",
        "05_results",
        "06_discussion",
        "07_limitations",
        "08_conclusion",
    ]:
        must(
            f"\\input{{sections/{name}.tex}}" in main_tex,
            f"inputs sections/{name}.tex (unescaped)",
            errors,
        )

    path_cmd = re.compile(
        r"\\(usepackage|input|include|includegraphics|bibliography|addbibresource)"
        r"(?:\[[^\]]*\])?\{([^}]*)\}"
    )
    for m in path_cmd.finditer(main_tex):
        arg = m.group(2)
        must("\\_" not in arg, f"path arg has no \\_ escape: \\{m.group(1)}{{{arg}}}", errors)

    must("&#x20;" not in main_tex, "no literal HTML entity &#x20;", errors)

    macros = (LATEX / "macros.tex").read_text(encoding="utf-8")
    for needle in [
        r"\newcommand{\ErrPlain}{9.68}",
        r"\newcommand{\ErrResNet}{8.41}",
        r"\newcommand{\ErrPreAct}{9.47}",
        r"\newcommand{\ErrAblationA}{8.32}",
    ]:
        must(needle in macros, f"macros contain {needle}", errors)

    method = (LATEX / "sections" / "03_method.tex").read_text(encoding="utf-8")
    setup = (LATEX / "sections" / "04_experiments.tex").read_text(encoding="utf-8")
    results = (LATEX / "sections" / "05_results.tex").read_text(encoding="utf-8")

    must(r"\section{Method}" in method, "03_method.tex has Method section", errors)
    must(r"\section{Experimental Setup}" in setup, "04_experiments.tex has Experimental Setup", errors)
    must(r"\section{Results}" in results, "05_results.tex has Results section", errors)
    for sub in [
        r"\subsection{Main Results}",
        r"\subsection{Residual Learning Comparison}",
        r"\subsection{Pre-activation Improvement}",
        r"\subsection{Ablation Results}",
        r"\subsection{Summary of Observations}",
    ]:
        must(sub in results, f"Results has {sub}", errors)

    for macro in [
        r"\ErrPlain",
        r"\ErrResNet",
        r"\ErrPreAct",
        r"\ErrAblationA",
        r"\AblationBStatus",
        r"\ResidualAdvantagePP",
        r"\DeltaPreActMinusResNet",
        r"\DeltaAblationAMinusResNet",
        r"\DeltaAblationAMinusPreAct",
    ]:
        must(macro in results, f"Results uses macro {macro}", errors)

    # No handwritten headline errors in Results body (tables/*.tex may still contain literals)
    body = re.sub(r"%.*?$", "", results, flags=re.M)
    body = re.sub(r"\\input\{tables/[^}]+\}", "", body)
    for num in FORBIDDEN_HEADLINE:
        # allow only inside comments already stripped; fail if bare number remains
        if re.search(rf"(?<![0-9.]){re.escape(num)}(?![0-9])", body):
            must(False, f"Results body must not hardcode {num}", errors)
        else:
            must(True, f"Results body has no hardcoded {num}", errors)

    must(r"\input{tables/main_results.tex}" in results, "Results inputs main_results.tex", errors)
    must(r"\input{tables/deltas.tex}" in results, "Results inputs deltas.tex", errors)
    must("phase4_best_test_error_bar.png" in results, "Results references phase4 bar figure", errors)
    must("phase5_best_test_error.png" in results, "Results references phase5 figure", errors)

    low = body.lower()
    for phrase in DISCUSSION_LEAK:
        must(phrase not in low, f"Results avoids discussion leak phrase: {phrase}", errors)

    discussion = (LATEX / "sections" / "06_discussion.tex").read_text(encoding="utf-8")
    must(r"\section{Discussion}" in discussion, "06_discussion.tex has Discussion section", errors)
    for sub in [
        r"\subsection{What the Baseline Establishes}",
        r"\subsection{Why the Pre-activation Replacement Did Not Improve the Baseline}",
        r"\subsection{Evidence from the Ablations}",
        r"\subsection{Interpretation of the Negative Result}",
        r"\subsection{Research Implications}",
    ]:
        must(sub in discussion, f"Discussion has {sub}", errors)
    for macro in [r"\ErrPlain", r"\ErrResNet", r"\ErrPreAct", r"\ErrAblationA", r"\AblationBStatus"]:
        must(macro in discussion, f"Discussion uses macro {macro}", errors)
    disc_body = re.sub(r"%.*?$", "", discussion, flags=re.M)
    for num in FORBIDDEN_HEADLINE:
        if re.search(rf"(?<![0-9.]){re.escape(num)}(?![0-9])", disc_body):
            must(False, f"Discussion body must not hardcode {num}", errors)
        else:
            must(True, f"Discussion body has no hardcoded {num}", errors)
    for bad in [
        "statistically significant",
        "robustly demonstrates",
        "consistently improves",
    ]:
        must(bad not in disc_body.lower(), f"Discussion avoids overclaim: {bad}", errors)
    # Affirmative overclaims (allow negations that reject them)
    for pat, label in [
        (r"(?<!not\s)(?<!not\sconclude\sthat\s)preact is ineffective", "affirmative PreAct ineffective"),
        (r"preact is worse in general", "PreAct worse in general"),
        (r"preact does not work on cifar", "PreAct does not work on CIFAR"),
    ]:
        # After rewrite these should be absent entirely
        must(re.search(pat, disc_body.lower()) is None, f"Discussion avoids overclaim: {label}", errors)
    must("not supported" in disc_body.lower(), "Discussion states hypothesis not supported", errors)

    limitations = (LATEX / "sections" / "07_limitations.tex").read_text(encoding="utf-8")
    must(r"\section{Limitations}" in limitations, "07_limitations.tex has Limitations section", errors)
    for sub in [
        r"\subsection{Single-seed Evaluation}",
        r"\subsection{Frozen Training Recipe}",
        r"\subsection{Limited Architecture and Dataset Scope}",
        r"\subsection{Ablation~B Failure}",
        r"\subsection{Reproducibility and Environment Scope}",
    ]:
        must(sub in limitations, f"Limitations has {sub}", errors)
    lim_body = re.sub(r"%.*?$", "", limitations, flags=re.M)
    for num in FORBIDDEN_HEADLINE:
        if re.search(rf"(?<![0-9.]){re.escape(num)}(?![0-9])", lim_body):
            must(False, f"Limitations body must not hardcode {num}", errors)
        else:
            must(True, f"Limitations body has no hardcoded {num}", errors)
    for macro in [r"\ErrPreAct", r"\ErrResNet", r"\DeltaPreActMinusResNet", r"\AblationBStatus", r"\DeltaAblationAMinusResNet"]:
        must(macro in limitations, f"Limitations uses macro {macro}", errors)
    must("scope of conclusions" in lim_body.lower() or "scope" in lim_body.lower(), "Limitations frames scope (not failure)", errors)

    conclusion = (LATEX / "sections" / "08_conclusion.tex").read_text(encoding="utf-8")
    must(r"\section{Conclusion}" in conclusion, "08_conclusion.tex has Conclusion section", errors)
    conc_body = re.sub(r"%.*?$", "", conclusion, flags=re.M)
    for num in FORBIDDEN_HEADLINE:
        if re.search(rf"(?<![0-9.]){re.escape(num)}(?![0-9])", conc_body):
            must(False, f"Conclusion body must not hardcode {num}", errors)
        else:
            must(True, f"Conclusion body has no hardcoded {num}", errors)
    for macro in [
        r"\ErrPlain",
        r"\ErrResNet",
        r"\ErrPreAct",
        r"\ErrAblationA",
        r"\AblationBStatus",
        r"\ResidualAdvantagePP",
        r"\DeltaPreActMinusResNet",
        r"\DeltaAblationAVsPreAct",
        r"\DeltaAblationAMinusResNet",
    ]:
        must(macro in conclusion, f"Conclusion uses macro {macro}", errors)
    must(
        "hypothesized improvement was not supported under the frozen training recipe and single-seed setting"
        in conc_body.lower().replace("\n", " ").replace("  ", " "),
        "Conclusion uses scoped PreAct negative-result wording",
        errors,
    )
    for bad in [
        "preact is ineffective",
        "preact is worse in general",
        "preact does not work on cifar",
        "statistically significant",
    ]:
        must(bad not in conc_body.lower(), f"Conclusion avoids overclaim: {bad}", errors)

    related = (LATEX / "sections" / "02_related_work.tex").read_text(encoding="utf-8")
    must(r"\section{Related Work}" in related, "02_related_work.tex has Related Work section", errors)
    for sub in [
        r"\subsection{Residual Learning}",
        r"\subsection{Pre-activation Residual Networks}",
        r"\subsection{Architectural Variants and Training Recipes}",
        r"\subsection{Positioning of This Study}",
    ]:
        must(sub in related, f"Related Work has {sub}", errors)
    rel_body = re.sub(r"%.*?$", "", related, flags=re.M)
    for num in FORBIDDEN_HEADLINE:
        if re.search(rf"(?<![0-9.]){re.escape(num)}(?![0-9])", rel_body):
            must(False, f"Related Work body must not hardcode {num}", errors)
        else:
            must(True, f"Related Work body has no hardcoded {num}", errors)
    # Citation keys used in body must exist in references.bib
    bib = (LATEX / "references.bib").read_text(encoding="utf-8")
    bib_keys = set(re.findall(r"@\w+\{([^,\s]+)", bib))
    cite_keys = set()
    for m in re.finditer(r"\\(?:cite|citep|citet|citepalp|citetalp|citeyear)\*?\{([^}]+)\}", related):
        for key in m.group(1).split(","):
            key = key.strip()
            if key:
                cite_keys.add(key)
    must(len(cite_keys) > 0, "Related Work contains at least one citation command", errors)
    for key in sorted(cite_keys):
        must(key in bib_keys, f"citation key exists in references.bib: {key}", errors)
    # Must cite the two verified core papers; no other keys without bib presence (already checked)
    for key in ["He2016DeepResidual", "He2016IdentityMappings"]:
        must(key in cite_keys, f"Related Work cites {key}", errors)
        must(key in bib_keys, f"references.bib defines {key}", errors)
    # Report NEEDS_VERIFICATION (informational; does not fail verify)
    nv_hits = re.findall(r"NEEDS[\\_ ]?VERIFICATION", related, flags=re.I)
    print(f"INFO: Related Work NEEDS_VERIFICATION markers: {len(nv_hits)}")

    intro = (LATEX / "sections" / "01_introduction.tex").read_text(encoding="utf-8")
    must(r"\section{Introduction}" in intro, "01_introduction.tex has Introduction section", errors)
    intro_body = re.sub(r"%.*?$", "", intro, flags=re.M)
    for num in FORBIDDEN_HEADLINE:
        if re.search(rf"(?<![0-9.]){re.escape(num)}(?![0-9])", intro_body):
            must(False, f"Introduction body must not hardcode {num}", errors)
        else:
            must(True, f"Introduction body has no hardcoded {num}", errors)
    for macro in [
        r"\ErrPlain",
        r"\ErrResNet",
        r"\ErrPreAct",
        r"\ErrAblationA",
        r"\AblationBStatus",
        r"\ResidualAdvantagePP",
        r"\DeltaPreActMinusResNet",
        r"\DeltaAblationAVsPreAct",
        r"\DeltaAblationAMinusResNet",
    ]:
        must(macro in intro, f"Introduction uses macro {macro}", errors)
    intro_cites = set()
    for m in re.finditer(r"\\(?:cite|citep|citet|citepalp|citetalp|citeyear)\*?\{([^}]+)\}", intro):
        for key in m.group(1).split(","):
            key = key.strip()
            if key:
                intro_cites.add(key)
    for key in sorted(intro_cites):
        must(key in bib_keys, f"Introduction citation key in bib: {key}", errors)
    for key in ["He2016DeepResidual", "He2016IdentityMappings"]:
        must(key in intro_cites, f"Introduction cites {key}", errors)
    intro_norm = re.sub(r"\s+", " ", intro_body.lower())
    must(
        "hypothesized improvement was not supported under the frozen training recipe and single-seed setting"
        in intro_norm,
        "Introduction uses scoped PreAct negative-result wording",
        errors,
    )
    for bad in [
        "preact is ineffective",
        "preact is worse in general",
        "preact does not work on cifar",
        "statistically significant",
        "universally better",
    ]:
        must(bad not in intro_norm, f"Introduction avoids overclaim: {bad}", errors)
    # Affirmative SOTA / new-architecture claims forbidden; explicit denials allowed.
    for bad in ["state-of-the-art", "state of the art"]:
        if bad in intro_norm:
            denied = bool(
                re.search(
                    rf"(no claim|without claiming|do not claim|not claim).{{0,160}}{re.escape(bad)}",
                    intro_norm,
                )
            )
            must(denied, f"Introduction avoids overclaim: {bad}", errors)
        else:
            must(True, f"Introduction avoids overclaim: {bad}", errors)
    if "new architecture family" in intro_norm:
        denied = bool(
            re.search(
                r"(no claim|without claiming|do not claim|not claim).{0,160}new architecture family",
                intro_norm,
            )
        )
        must(denied, "Introduction avoids overclaim: new architecture family", errors)
    else:
        must(True, "Introduction avoids overclaim: new architecture family", errors)
    # Discussion leak: mechanistic explanation of PreAct failure
    for leak in [
        "optimization difficulty",
        "generalization mechanism",
        "because the frozen",
        "due to underfitting",
        "causal",
    ]:
        must(leak not in intro_norm, f"Introduction avoids Discussion leak: {leak}", errors)
    must(
        "do not establish that pre-activation" in intro_norm
        or "do not establish that preact" in intro_norm
        or "generally inferior" in intro_norm,
        "Introduction states results do not imply PreAct generally inferior",
        errors,
    )
    must("contributions" in intro_norm, "Introduction has contributions / positioning", errors)

    abstract = (LATEX / "sections" / "00_abstract.tex").read_text(encoding="utf-8")
    must(r"\begin{abstract}" in abstract, "00_abstract.tex has abstract environment", errors)
    must(r"\end{abstract}" in abstract, "00_abstract.tex closes abstract environment", errors)
    abs_body = re.sub(r"%.*?$", "", abstract, flags=re.M)
    abs_norm = re.sub(r"\s+", " ", abs_body.lower())
    for num in FORBIDDEN_HEADLINE:
        if re.search(rf"(?<![0-9.]){re.escape(num)}(?![0-9])", abs_body):
            must(False, f"Abstract body must not hardcode {num}", errors)
        else:
            must(True, f"Abstract body has no hardcoded {num}", errors)
    for macro in [
        r"\ErrPlain",
        r"\ErrResNet",
        r"\ErrPreAct",
        r"\ErrAblationA",
        r"\AblationBStatus",
        r"\ResidualAdvantagePP",
        r"\DeltaPreActMinusResNet",
        r"\DeltaAblationAVsPreAct",
        r"\DeltaAblationAMinusResNet",
    ]:
        must(macro in abstract, f"Abstract uses macro {macro}", errors)
    must(
        "hypothesized improvement was not supported under the frozen training recipe and single-seed setting"
        in abs_norm,
        "Abstract uses scoped PreAct negative-result wording",
        errors,
    )
    for bad in [
        "preact is ineffective",
        "preact is generally worse",
        "preact does not work on cifar",
        "statistically significant",
        "state-of-the-art",
        "state of the art",
        "imagenet",
    ]:
        must(bad not in abs_norm, f"Abstract avoids overclaim: {bad}", errors)
    must("cifar-10" in abs_norm or "cifar~10" in abs_norm, "Abstract mentions CIFAR-10", errors)
    must("depth" in abs_norm and "20" in abs_norm, "Abstract mentions depth-20", errors)
    must("frozen" in abs_norm, "Abstract mentions frozen recipe", errors)
    must("single-seed" in abs_norm or "single seed" in abs_norm, "Abstract mentions single-seed", errors)
    must(
        re.search(r"\\(?:cite|citep|citet)\*?\{", abstract) is None,
        "Abstract has no citation commands",
        errors,
    )
    nv_abs = re.findall(r"NEEDS[\\_ ]?VERIFICATION", abstract, flags=re.I)
    print(f"INFO: Abstract NEEDS_VERIFICATION markers: {len(nv_abs)}")

    if errors:
        print(f"\nSTRUCTURAL VERIFY FAILED ({len(errors)} issues)")
        return 1
    print("\nSTRUCTURAL VERIFY OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
