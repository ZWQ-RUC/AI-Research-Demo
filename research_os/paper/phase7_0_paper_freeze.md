# Phase 7.0 — Paper Freeze

**status:** confirmed (re-affirmed after G1)  
**utc:** 2026-09-04T01:43:00Z  
**reaffirmed_utc:** 2026-09-04T01:52:00Z  
**git_head:** `cc8cb5c60177047e910304c48fb965f6a92816ea`  
**G1:** approved as drafted  
**rule:** Freeze = inventory + authority declaration. No rewrite of experiments. No manuscript body. No scripts in this step.

## 1. Overleaf / LaTeX template

| Check | Result |
|-------|--------|
| `**/*.tex` in project | **ABSENT** |
| `**/*.cls` / `*.sty` / `*.bib` | **ABSENT** |
| Overleaf project path / link in repo | **ABSENT** |
| Existing LaTeX macros for metrics | **ABSENT** |

**Implication:** 当前仓库**没有**可挂载的 Overleaf 模板。Phase 7 同步链路的 Overleaf 端目标路径尚未绑定——须你指定模板位置或授权新建 `research_os/paper/overleaf/`（或外部 Overleaf git）后再写自动化脚本。

## 2. Narrative evidence (read-only)

| Asset | Path | Role | Notes |
|-------|------|------|-------|
| Analysis | `paper/analysis.md` | Evidence Base / Discussion 素材 | ~22.7 KB；人工维护，非 sync |
| Conclusion | `paper/conclusion.md` | Claims 边界候选 | ~11.9 KB；G4 **pending**，不可当最终 findings |

## 3. Canonical numeric authority

**Authority (SoT):** `experiments/manifests/` + `experiments/results/`  
**Display copies only:** `paper/metrics/` · `paper/tables/` · `paper/figures/`（via existing `experiments/scripts/sync_paper.py`）

### Frozen headline numbers (from results JSON; not re-computed)

| Model | best_test_error_% | Source |
|-------|------------------:|--------|
| Ablation-A | **8.32** | `experiments/results/phase5/summary.json` |
| ResNet-20-A | **8.41** | `experiments/manifests/phase2_baseline.json` / phase2+4/5 summaries |
| PreAct-ResNet-20-A | **9.47** | `experiments/results/phase4/comparison.json` |
| Plain-20 | **9.68** | phase2 summary / manifest |
| Ablation-B | **failed (NaN)** | phase5 summary / run `status.json` |

| Delta | Value | Source |
|-------|------:|--------|
| PreAct − ResNet-20-A | **+1.06 pp** | phase4 / phase5 |
| Ablation-A − PreAct | **−1.15 pp** | phase5 |
| Ablation-A − ResNet-20-A | **−0.09 pp** | phase5 |
| ResNet − Plain | **−1.27 pp** | phase2 |

## 4. Asset inventory (exists at freeze)

### `experiments/results/`
- phase2: `summary.json`, `metrics.csv`, run metrics JSON, figures ×2
- phase4: `comparison.json|.md|.csv`, figures ×4
- phase5: `summary.json|.md`, `comparison.csv`, figures ×1

### `paper/metrics/`
- `phase2_summary.json`, `phase4_comparison.json|.md`, `phase5_summary.json|.md`

### `paper/tables/`
- `phase2_metrics.csv`, `phase4_comparison.csv`, `phase5_comparison.csv`

### `paper/figures/`
- phase2 ×2, phase4 ×4, phase5 ×1（与 results 对应的展示副本）

## 5. Existing sync (partial)

`experiments/scripts/sync_paper.py`：results → `paper/{figures,tables,metrics}` 文件复制。  
**不**生成 LaTeX macros / Overleaf 工程。

## 6. Freeze declaration

以上路径在 Phase 7 写作期间视为**只读证据输入**。新数字只能来自新的 experiment run-id + 新 results 构建；禁止改写既有 `experiments/runs/**` 与已登记 canonical JSON 的语义。
