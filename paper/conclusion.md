# Research Conclusion

**Phase:** 6 — Research Analysis & Conclusion  
**Date:** 2026-09-03  
**Purpose:** Paper Evidence Base for Phase 7  
**Authority:** `experiments/manifests/` + `experiments/results/`（`paper/` 为展示副本）

---

## 1. Research Question

在冻结 CIFAR-10 与 He et al. §4.2 训练配方的前提下，将 ResNet-20-A 的 post-activation 残差块替换为 pre-activation 单元，**能否降低测试错误率**？

**Source:** `research/phase3-improvement-research-design/PHASE_3_RESEARCH_DESIGN.md`

---

## 2. Experimental Setup

| 维度 | 内容 |
|---|---|
| **Dataset** | CIFAR-10（50k train / 10k test，官方 split） |
| **Baseline** | Plain-20（9.68%）；ResNet-20-A post-act + Option A（**8.41%**，冻结对照） |
| **Improvement** | PreAct-ResNet-20-A：`BN→ReLU→Conv→BN→ReLU→Conv→Add` |
| **Comparison** | Phase 4 只读汇总 Plain / ResNet / PreAct（无重训） |
| **Ablation** | A：去掉第一段 BN+ReLU；B：去掉第二段 BN+ReLU |
| **Protocol** | SGD m=0.9, wd=1e-4, lr=0.1, milestones 32k/48k iters, batch 128, 160 epochs, pad4+crop+hflip+Normalize |
| **Hardware** | RTX 3050 Laptop 4GB；conda `deeplearn`, torch 2.0.1+cu117 |
| **Seed** | 未固定（全部 single-run） |

**Source:** `experiments/configs/phase2/baseline_plain20_resnet20a.yaml`; `experiments/results/phase4/comparison.json`

---

## 3. Main Findings

### Finding 1 — 残差基线复现成功

- **Finding:** ResNet-20-A（8.41%）优于 Plain-20（9.68%），且 ResNet-20-A 与论文 Table 6（8.75%）相差 0.34 pp，在 ±1.0 pp 容差内。
- **Evidence:** `experiments/manifests/phase2_baseline.json`; `experiments/results/phase2/summary.json`
- **Interpretation:** Phase 2 建立可信 baseline；残差优势在本 depth-20 设置下成立。

### Finding 2 — 完整 PreAct 未改善 baseline（negative result）

- **Finding:** PreAct-ResNet-20-A 测试错误率 **9.47%**，比 ResNet-20-A **差 1.06 pp**。
- **Evidence:** `experiments/results/phase4/comparison.json`
- **Interpretation:** 在冻结后激活训练配方下，完整 PreAct **不是** drop-in 升级；Phase 3 假设被否证。

### Finding 3 — PreAct 两段 BN+ReLU 贡献不对称

- **Finding:** Ablation A（无第一段 BN+ReLU）= **8.32%**；Ablation B（无第二段 BN+ReLU）= **训练 NaN 失败**。
- **Evidence:** `experiments/results/phase5/summary.json`; `experiments/runs/phase5/ablation_b/.../status.json`
- **Interpretation:** 第一段 PreAct 在本设置下可缺且去掉后显著优于完整 PreAct（−1.15 pp）；第二段 BN 对 lr=0.1 下的数值稳定性必要。

### Finding 4 — Ablation A 略优于 baseline，但证据不足

- **Finding:** Ablation A 比 ResNet-20-A 低 **0.09 pp**（8.32% vs 8.41%）。
- **Evidence:** `experiments/results/phase5/summary.json` → `deltas_pp.ablation_a_minus_resnet20a: -0.09`
- **Interpretation:** 落在单 seed 噪声范围（±0.3–0.5 pp）；**不能**宣称稳健超越 Phase 2 基线。

---

## 4. Main Experimental Results

| Model | Method | Best Test Error | Best Epoch | Params | Training Time | Status | Source |
|---|---|---:|---:|---:|---|---|---|
| **Ablation A** | Drop 1st BN+ReLU | **8.32%** | 124 | 269,738 | 01:08:53 | completed | `phase5/summary.json` |
| **ResNet-20-A** ★ | Post-act + Option A | **8.41%** | 132 | 270,410 | 01:03:13 | completed | `manifests/phase2_baseline.json` |
| **PreAct-ResNet-20-A** | Full PreAct | **9.47%** | 128 | 270,314 | 01:11:17 | completed | `phase4/comparison.json` |
| **Plain-20** | No shortcut | **9.68%** | 132 | 270,410 | 01:04:19 | completed | `manifests/phase2_baseline.json` |
| **Ablation B** | Drop 2nd BN+ReLU | **NaN** | — | 269,642 | ~20 ep | **failed** | `ablation_b/.../status.json` |

★ Phase 3–5 冻结对照基线

**Reference（非本项目）：** 论文 ResNet-20 = 8.75%；参考仓库 Plain=9.26%, ResNet=8.64%（`phase2/summary.json`）

---

## 5. Improvement Effect

| 指标 | 值 |
|---|---|
| **Baseline（ResNet-20-A）** | 8.41% |
| **Improved（PreAct full）** | 9.47% |
| **Absolute change** | **+1.06 pp**（PreAct 更差） |
| **Relative change** | **+12.6%** error increase ((9.47−8.41)/8.41) |
| **Success threshold（预设）** | ≤ 8.11%（−0.30 pp） |
| **Threshold met?** | **No** |

**Source:** `experiments/results/phase4/comparison.json`; Phase 3 design doc

> 完整 PreAct 为 **negative result**，非小幅未达标。

---

## 6. Ablation Findings

| Ablation | Change | Test Error | Δ vs Full PreAct | Δ vs ResNet-20-A | Interpretation |
|---|---|---:|---:|---:|---|
| **Full PreAct** | BN→ReLU→Conv→BN→ReLU→Conv→Add | 9.47% | 0 | +1.06 pp | 完整 PreAct 在本设置下劣于 post-act baseline |
| **Ablation A** | 去掉第一段 BN+ReLU | **8.32%** | **−1.15 pp** | −0.09 pp | 第一段 PreAct 非必要；去掉后大幅改善相对 PreAct |
| **Ablation B** | 去掉第二段 BN+ReLU | **failed (NaN)** | — | — | 第二段 BN 对可训性关键；非有效精度结果 |

**Source:** `experiments/results/phase5/comparison.csv`; `experiments/results/phase5/summary.json`

---

## 7. Hypothesis Conclusion

| 项 | 内容 |
|---|---|
| **Hypothesis** | Pre-activation 单元在相同参数与 Option A 下，test error 严格优于 8.41% |
| **Preset success** | 改善 ≥ 0.30 pp（≤ 8.11%） |
| **Observed** | PreAct = 9.47%（+1.06 pp vs baseline） |
| **Conclusion** | **Not Supported** |
| **Reason** | 测试误差方向相反（变差）；train@best 更高（1.81% vs 0.91%）；未达 falsification 任一正面条件 |

---

## 8. Scientific Conclusion

本 Demo 在 CIFAR-10 depth-20、Option A、160 epoch、单 seed 的设置下，首先部分复现了 He et al. 2015 的核心观察：ResNet-20-A（8.41%）显著优于 Plain-20（9.68%），且数值接近论文报告（8.75%）。在此冻结 baseline 上，我们测试了 Identity Mappings 风格的 pre-activation 残差单元，发现完整 PreAct（9.47%）**未能**改善后激活基线，反而下降 1.06 pp——构成可审计的 null result。

消融实验进一步表明，PreAct 的两段 BN+ReLU **并非同等重要**：去掉第一段（Ablation A, 8.32%）使性能从完整 PreAct 大幅回升，甚至在本单次运行中略低于 baseline 0.09 pp；去掉第二段（Ablation B）则在 lr=0.1 下导致从 epoch 0 起的数值不稳定。这说明在浅层 CIFAR ResNet-20 与后激活优化配方的组合下，PreAct 的"完整打包"不适用，而 BN 放置对训练稳定性具有结构性影响。

上述结论**限于**本项目的深度、数据集、训练配方与单 seed 设定，不能外推为 PreAct 在更深网络或其他配方上的普遍结论。

---

## 9. Engineering Conclusion

| 维度 | 结论 |
|---|---|
| **Reproduction** | Plain-20 + ResNet-20-A 达到 `partially_reproduced`；depth-20 数值在 ±1.0 pp 容差内 |
| **Implementation** | 五模型共用 `models.py`（`BasicBlock`, `PreActBasicBlock` + ablation flags）；34 unit tests pass |
| **Experiment management** | Phase 化目录（configs / launch / runs / results / manifests）；Phase 2 冻结；Phase 4 只读汇总 |
| **Reproducibility gaps** | 无 seed；无 per-run provenance；Phase 3/5 无 manifest；Git commit 早于实验日 **[NEEDS VERIFICATION]** |
| **Negative result handling** | Ablation B 失败以 `status.json` 记录，未静默丢弃 |
| **Automation** | `build_phase*.py` + `sync_paper.py` 生成汇总与 paper 副本 |

**Source:** `README.md`; `research/resnet-cifar10-baseline-20260902/reproduction_report.md`; `experiments/results/phase5/summary.md`

---

## 10. Limitations

1. 全部 **single seed**（`seed: null`）
2. 仅 **depth-20**；未跑 Table 6 全深度套件
3. 仅 **CIFAR-10**；无 ImageNet
4. **冻结后激活训练配方**；未为 PreAct 调参
5. **Test-set checkpoint selection**（与参考 repo 一致）
6. Ablation B **未完成**有效精度评估
7. 小 delta（0.09 pp）**无统计显著性**
8. 实验代码与 Git HEAD 一致性 **[NEEDS VERIFICATION]**

---

## 11. Future Work

仅由当前实验**自然推导**的方向（非凭空扩展）：

1. **多种子（≥3）** — 对 ResNet-20-A 与 Ablation A 报告 mean±std，判定 0.09 pp 是否稳健
2. **Per-run provenance** — manifest + config snapshot + git hash
3. **LR / warmup sweep for PreAct & Ablation B** — 检验 B 的失败是否 purely recipe-dependent
4. **Depth 32/44/56** — 验证 PreAct 是否在更深 CIFAR 网络上与文献一致
5. **Phase 3 备选候选** — Cutout / SE（设计文档 C3–C5），作为独立假设轴
6. **Train-set checkpoint selection** — 消除 test 泄漏（需重新定义评估协议）

---

## 12. Paper-Ready Claims

### Claims We Can Make

1. 在 CIFAR-10 ResNet-20（Option A）、160 epoch、单 seed 下，ResNet-20-A（8.41%）优于 Plain-20（9.68%），残差优势 1.27 pp。
2. 本项目 ResNet-20-A 与 He et al. 2015 Table 6（8.75%）相差 0.34 pp，在预设 ±1.0 pp 容差内（`partially_reproduced`）。
3. 完整 Pre-activation 单元在**相同冻结配方**下未改善后激活 ResNet-20-A（9.47% vs 8.41%，+1.06 pp）。
4. 去掉 PreAct 第一段 BN+ReLU（Ablation A）显著优于完整 PreAct（−1.15 pp），测试错误率 8.32%。
5. 去掉 PreAct 第二段 BN+ReLU（Ablation B）在 lr=0.1 下导致数值不稳定（NaN from epoch 0），不能作为精度基线。
6. PreAct 两段 BN+ReLU 在本 shallow 设置下重要性**不等**：第一段可缺；第二段对可训性必要。

### Claims We Should Avoid

1. ❌ "PreAct 在 CIFAR 上普遍不如 post-act" — 仅 depth-20 + 单 seed + 固定配方
2. ❌ "Ablation A 显著超越 ResNet-20-A" — Δ=0.09 pp，无多种子
3. ❌ "Ablation A 是新的最优 CIFAR-20 结构" — 单次运行，无 broader validation
4. ❌ "第二段 BN 对所有网络/配方必要" — 仅在 lr=0.1 + 本 block 结构下观察到
5. ❌ "PreAct 更差的原因已严格证明" — 仅有 underfit 观测与结构一致性，无因果实验
6. ❌ "完整 Table 6 复现" — 仅 depth-20
7. ❌ 统计显著性 / p-value — 未做 multiple seeds
8. ❌ 把 Ablation B 的 ~90% error 当作公平精度对比

---

## Quick Reference: Artifacts for Phase 7

### Figures（可直接引用）

| Figure | Path |
|---|---|
| Phase 2 Plain vs Residual | `experiments/results/phase2/figures/plain_vs_residual.png` |
| Phase 2 Side-by-side | `experiments/results/phase2/figures/side_by_side.png` |
| Phase 4 Test error curves | `experiments/results/phase4/figures/test_error_curves.png` |
| Phase 4 Train error curves | `experiments/results/phase4/figures/train_error_curves.png` |
| Phase 4 Loss curves | `experiments/results/phase4/figures/loss_curves.png` |
| Phase 4 Best error bar | `experiments/results/phase4/figures/best_test_error_bar.png` |
| Phase 5 Completed models bar | `experiments/results/phase5/figures/best_test_error_completed.png` |
| Paper copies | `paper/figures/phase*.png` |

### Tables（可直接引用）

| Table | Path |
|---|---|
| Phase 2 metrics | `experiments/results/phase2/metrics.csv` |
| Phase 4 comparison | `experiments/results/phase4/comparison.csv` |
| Phase 5 comparison | `experiments/results/phase5/comparison.csv` |
| Paper copies | `paper/tables/phase*.csv` |

### Canonical Result JSON

| Phase | Path |
|---|---|
| 2 | `experiments/results/phase2/summary.json` |
| 4 | `experiments/results/phase4/comparison.json` |
| 5 | `experiments/results/phase5/summary.json` |
| 2 manifest | `experiments/manifests/phase2_baseline.json` |

---

*Phase 6 deliverable. See `paper/analysis.md` for full mechanism discussion and evidence map.*
