# Canonical data schema (Phase 7)

Produced by `research_os/paper/scripts/build_canonical_data.py`.  
SoT remains `experiments/manifests/` + `experiments/results/` (read-only).

## Top-level fields

| Field | Meaning |
|-------|---------|
| `schema_version` | Snapshot schema |
| `kind` | `phase7_paper_canonical_snapshot` |
| `frozen_at_utc` | Build timestamp |
| `git_head` | `git rev-parse HEAD` at build (if available) |
| `sources` | SoT paths + sha256 |
| `protocol` | Training protocol from phase4 comparison |
| `scalars` | Headline numbers for macros |
| `models` | Per-model rows (from phase5 summary, widest table) |
| `ranking_completed_only` | Ranking excluding failed Ablation-B |
| `deltas_pp` | Signed percentage-point deltas |
| `figures` | Pointers to SoT figure paths |
| `consistency` | Cross-source check result |

## `scalars` keys

| Key | Example | Meaning |
|-----|--------:|---------|
| `err_plain` | 9.68 | Plain-20 best test error % |
| `err_resnet` | 8.41 | ResNet-20-A |
| `err_preact` | 9.47 | PreAct-ResNet-20-A |
| `err_ablation_a` | 8.32 | Ablation-A |
| `ablation_b_status` | failed_… | No accuracy macro |
| `residual_advantage_pp` | 1.27 | Plain − ResNet |
| `delta_plain_minus_resnet_pp` | 1.27 | same as residual advantage |
| `delta_resnet_minus_plain_pp` | −1.27 | ResNet − Plain |
| `delta_preact_minus_resnet_pp` | 1.06 | PreAct worse than ResNet |
| `delta_ablation_a_minus_resnet_pp` | −0.09 | |
| `delta_ablation_a_minus_preact_pp` | −1.15 | |
| `paper_resnet20_table6_pct` | 8.75 | He et al. Table 6 ref |
| `repo_plain_ref_pct` / `repo_resnet_ref_pct` | | reference repo |
| `reproduction_status` | partially_reproduced | |
| `tolerance_pp` | 1.0 | |

Rebuild only via explicit `build_canonical_data.py` (decision 2A).
