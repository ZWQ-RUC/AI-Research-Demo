# Research Analysis

**Phase:** 6 — Research Analysis & Conclusion  
**Date:** 2026-09-03  
**Scope:** Evidence-based analysis of Phases 0–5; no new experiments  
**Authority hierarchy:** `experiments/manifests/` → `experiments/results/` → `experiments/runs/**/metrics.json` → `paper/` (display copies)

---

## Evidence Map（内部追溯表）

> 下列为 canonical run；同目录下其他时间戳为 smoke / 中断 run，**不得**用于正式对比。

| Experiment ID | Phase | Model | Method | Dataset | Best Test Error | Best Epoch | Final Train Error | Params | Training Time | Random Seed | Git Commit | Source File |
|---|---|---|---|---:|---:|---:|---:|---:|---|---|
| `plain20_08_49_22` | 2 | Plain-20 | Post-act, no shortcut | CIFAR-10 | **9.68%** | 132 | 1.16% | 270,410 | 01:04:19 | null | [NEEDS VERIFICATION] | `experiments/manifests/phase2_baseline.json` |
| `resnet20a_09_53_41` | 2 | ResNet-20-A | Post-act + Option A | CIFAR-10 | **8.41%** | 132 | 0.72% | 270,410 | 01:03:13 | null | [NEEDS VERIFICATION] | `experiments/manifests/phase2_baseline.json` |
| `preact_16_23_57` | 3 | PreAct-ResNet-20-A | Pre-activation + Option A | CIFAR-10 | **9.47%** | 128 | 1.45% | 270,314 | 01:11:17 | null | [NEEDS VERIFICATION] | `experiments/runs/phase3/.../16_23_57/metrics.json` |
| `abl_a_18_59_29` | 5 | Ablation A | Drop 1st BN+ReLU | CIFAR-10 | **8.32%** | 124 | 0.90% | 269,738 | 01:08:53 | null | [NEEDS VERIFICATION] | `experiments/runs/phase5/ablation_a/.../18_59_29/metrics.json` |
| `abl_b_20_08_23` | 5 | Ablation B | Drop 2nd BN+ReLU | CIFAR-10 | **failed (NaN)** | — | — | 269,642 | stopped ~epoch 20 | null | [NEEDS VERIFICATION] | `experiments/runs/phase5/ablation_b/.../20_08_23/status.json` |

**Reference results（非本项目复现，仅作对照）：**

| Source | Model | Test Error | Source File |
|---|---|---:|---|
| Paper Table 6 | ResNet-20 (Option A) | 8.75% | `research/.../paper_summary.md` |
| Reference repo README | Plain-20 | 9.26% | `experiments/results/phase2/summary.json` |
| Reference repo README | ResNet-20-A | 8.64% | `experiments/results/phase2/summary.json` |

**Protocol（Phase 2–5 共用，冻结）：**

| Item | Value | Source |
|---|---|---|
| Structure | CIFAR 6n+2, depth=20 (n=3) | `experiments/configs/phase2/baseline_plain20_resnet20a.yaml` |
| Optimizer | SGD, m=0.9, wd=1e-4 | 同上 |
| LR | 0.1; ÷10 at 32k / 48k iters | 同上 |
| Batch / Epochs | 128 / 160 | 同上 |
| Augmentation | pad4+crop, hflip, Normalize | 同上 |
| Evaluation | test every 4 epochs; `best.pt` = min test error | 同上 |
| Hardware | RTX 3050 Laptop 4GB | `experiments/configs/phase2/...yaml` |
| Software | conda `deeplearn`; torch 2.0.1+cu117 | `README.md`, phase2 config |
| Seed | **未固定** | 全部 config `seed: null` |

**Git / provenance note:** 最近一次 Git commit 为 `dc2727f`（2026-09-02），实验运行于 2026-09-03；Phase 3–5 代码改动可能尚未 commit。**[NEEDS VERIFICATION]** 各 run 目录无 `provenance.json`。

---

## 1. Research Context

### 1.1 研究问题谱系

本 Demo 沿两条论文脉络展开：

1. **He et al., 2015（ResNet, post-activation）：** 在 CIFAR-10 depth-20 上复现 Plain vs Residual 基线，验证残差捷径是否降低测试错误率（Phase 2）。
2. **He et al., 2016（Identity Mappings / Pre-activation）：** 在冻结 Phase 2 配方上，测试 PreAct 残差单元是否为 ResNet-20-A 的 drop-in 改进，并通过消融定位两段 BN+ReLU 的贡献（Phase 3–5）。

### 1.2 复现范围与状态

| 范围 | 状态 | 证据 |
|---|---|---|
| Plain-20 + ResNet-20-A | `partially_reproduced` | `research/resnet-cifar10-baseline-20260902/reproduction_report.md` |
| ResNet 32/44/56, Option B, ImageNet | 未跑 | `README.md` §1.4 |
| PreAct + 消融 A/B | 已完成（B failed） | `experiments/results/phase5/summary.json` |

### 1.3 Phase 3 正式 Research Question

> 在冻结 CIFAR-10 数据与 He et al. §4.2 训练配方的前提下，将 ResNet-20-A 的 post-activation `BasicBlock` 替换为 pre-activation 残差单元，**能否降低测试错误率**？

**Source:** `research/phase3-improvement-research-design/PHASE_3_RESEARCH_DESIGN.md` §Step 6

---

## 2. Baseline Analysis

### 2.1 核心数字（本项目复现结果）

| Model | Best Test Error | Best Epoch | Train@Best | Final Train | Params | Duration |
|---|---:|---:|---:|---:|---:|---|
| Plain-20 | **9.68%** | 132 | 1.39% | 1.16% | 270,410 | 01:04:19 |
| ResNet-20-A | **8.41%** | 132 | 0.91% | 0.72% | 270,410 | 01:03:13 |

**Source:** `experiments/manifests/phase2_baseline.json`; `experiments/results/phase4/comparison.json`

### 2.2 与论文 / 参考仓库对照

| Model | 本项目 | 参考仓库 | 论文 Table 6 | Δ vs 论文 |
|---|---:|---:|---:|---:|
| Plain-20 | 9.68% | 9.26% | — | — |
| ResNet-20-A | **8.41%** | 8.64% | **8.75%** | **−0.34 pp** |

**Source:** `experiments/results/phase2/summary.json`  
**复现判定:** `partially_reproduced`；ResNet-20-A 在 ±1.0 pp 容差内（`tolerance_pp: 1.0`）。

### 2.3 收敛与训练行为

**Observed（来自 manifest + Phase 4 曲线数据路径）：**

- 两模型均在 **epoch 132** 达到 best test error，收敛节奏相近。
- ResNet-20-A 在 best epoch 处 train error **0.91%**，低于 Plain-20 的 **1.39%**。
- ResNet-20-A final train error **0.72%**，Plain-20 **1.16%**；末次 test error：ResNet **8.58%**，Plain **9.84%**。
- 残差优势：**1.27 pp**（9.68% → 8.41%），相对改善约 **13.1%**（(9.68−8.41)/9.68）。

**Source:** `experiments/results/phase4/comparison.json`

**Figures:**

- `experiments/results/phase2/figures/plain_vs_residual.png`
- `experiments/results/phase2/figures/side_by_side.png`
- `paper/figures/phase2_plain_vs_residual.png`（展示副本）

### 2.4 为什么 ResNet-20-A 优于 Plain-20？

**论文理论解释（He et al., 2015，非本实验直接证明）：**

- 深度 plain 网络存在优化退化；残差学习 \(y = F(x) + x\) 使网络学习残差映射，恒等捷径提供梯度直通路径。

**本实验观察到的证据（Observed）：**

1. 相同深度（20）、相同参数量（270,410）、相同训练配方下，ResNet-20-A test error 低于 Plain-20 **1.27 pp**。
2. ResNet 训练误差更低（0.72% vs 1.16%），且 test error 曲线整体位于 Plain 之下（见 Phase 2/4 曲线图）。
3. 数值与论文 ResNet-20（8.75%）及参考仓库（8.64%）在同一量级，方向一致。

**Inferred（合理推断，非严格因果证明）：**

- 在本 shallow depth-20 设置下，残差捷径改善了优化与泛化的组合表现；但不能排除单次 run 随机性贡献了部分 delta。

---

## 3. Improvement Motivation

### 3.1 Baseline limitation → Research Question → Hypothesis → Method

逻辑链（来自 Phase 3 设计文档，**先于**实验结果）：

| 步骤 | 内容 |
|---|---|
| **Baseline limitation (L1)** | Post-activation 单元在 add 后有 ReLU，BN 仅在残差支路，恒等映射非“干净” |
| **Evidence in code** | `BasicBlock.forward` 末尾 `return F.relu(res)` |
| **Research Question** | 冻结配方下，PreAct 能否降低 test error？ |
| **Hypothesis** | PreAct 使 \(y \approx x + F(x)\) 更优化友好，test error **严格优于** 8.41% |
| **Success threshold** | 改善 ≥ **0.30 pp**（即 ≤ 8.11%） |
| **Proposed Method** | `PreActBasicBlock`: BN→ReLU→Conv→BN→ReLU→Conv→Add（无 post-add ReLU） |
| **Falsification** | PreAct ≥ 8.41%，或改进 < 0.30 pp，或训练不稳定 |

**Source:** `research/phase3-improvement-research-design/PHASE_3_RESEARCH_DESIGN.md` §Step 2–6

### 3.2 为何选择 PreAct 而非 SE / Cutout 等

设计文档评估了 5 个候选（C1 PreAct, C2 Option B, C3 SE, C4 Cutout, C5 Mixup），选定 C1 因为：

- 单因子可控（仅改 block 顺序）
- 参数/算力几乎不变
- 与 ResNet 研究谱系直接相关
- 可分解为 Phase 5 消融

**Source:** 同上 §Step 5

---

## 4. Improvement Analysis

### 4.1 架构改动

| 组件 | ResNet-20-A (Baseline) | PreAct-ResNet-20-A |
|---|---|---|
| Block 顺序 | Conv→BN→ReLU→Conv→BN→Add→**ReLU** | **BN→ReLU→Conv→BN→ReLU→Conv→Add**（无 post-add ReLU） |
| Shortcut | Option A（零填充） | 不变 |
| Stem / Head | Conv-BN-ReLU + GAP-FC | 不变 |
| 参数量 | 270,410 | 270,314（Δ **−96**，BN 位置变化） |

**Source:** `experiments/results/phase4/comparison.json`; `code/deep-residual-learning-pytorch-master/models.py` `PreActBasicBlock`

### 4.2 理论机制（文献 + 设计假设）

**来自 Identity Mappings 论文的方向性动机（非本实验已证事实）：**

- Pre-activation 使 BN/ReLU 在 Conv 之前，shortcut 上的恒等路径在 add 前不受 ReLU 截断。
- 梯度可更直接经 shortcut 传播。

**本项目 Hypothesis 中的 Expected Mechanism：**

- 少一次 post-add 非线性；BN 标准化更贴近残差函数输入。

### 4.3 计算 / 训练成本

| 指标 | ResNet-20-A | PreAct | Δ |
|---|---:|---:|---|
| Params | 270,410 | 270,314 | −96 |
| Duration | 01:03:13 | 01:11:17 | +~8 min (+12.7%) |

**Source:** `experiments/results/phase4/comparison.json`

**Observed:** PreAct 训练更慢，参数量略少；成本增加主要来自实现/计算图差异，非参数量增加。

---

## 5. Controlled Comparison（Phase 4）

Phase 4 **无新训练**，只读汇总 Phase 2 + Phase 3 canonical runs。

### 5.1 Baseline vs Improved（PreAct vs ResNet-20-A）

| 指标 | ResNet-20-A | PreAct-ResNet-20-A | Δ |
|---|---:|---:|---|
| Best Test Error | **8.41%** | **9.47%** | **+1.06 pp**（PreAct 更差） |
| Best Epoch | 132 | 128 | −4 |
| Train@Best | 0.91% | 1.81% | +0.90 pp |
| Final Train | 0.72% | 1.45% | +0.73 pp |
| Test Loss@Best | 0.3501 | 0.4003 | +0.0502 |
| Params | 270,410 | 270,314 | −96 |

**Source:** `experiments/results/phase4/comparison.json`

**Relative change:** PreAct 比 baseline 差 **12.6%**（(9.47−8.41)/8.41）。

### 5.2 三模型排名

1. ResNet-20-A — 8.41%  
2. PreAct-ResNet-20-A — 9.47%  
3. Plain-20 — 9.68%

**Source:** `experiments/results/phase4/comparison.json` → `ranking_by_best_test_error`

### 5.3 Run-to-run 差异（PreAct）

| Run ID | Epochs | Best Test Error | 用途 |
|---|---:|---:|---|
| `16_16_32` | 1 (smoke) | 51.52% | 非 canonical |
| `16_18_38` | 1 (smoke) | 62.61% | 非 canonical |
| **`16_23_57`** | **160** | **9.47%** | **canonical** |

**Source:** 各 run 目录 `metrics.json`

**Limitation:** 仅 **1 次**完整 160-epoch PreAct run；无法报告 mean±std。设计文档建议 ≥2–3 seed，**未执行**。

### 5.4 曲线行为（Observed）

PreAct 在整个训练过程中 test error 高于 ResNet-20-A；train error 在 best epoch 处明显更高（1.81% vs 0.91%），表明在相同预算下 **相对 underfit**。

**Figures:**

- `experiments/results/phase4/figures/test_error_curves.png`
- `experiments/results/phase4/figures/train_error_curves.png`
- `experiments/results/phase4/figures/loss_curves.png`
- `experiments/results/phase4/figures/best_test_error_bar.png`

---

## 6. Ablation Analysis（Phase 5）

### 6.1 Ablation A — 去掉第一段 BN+ReLU

| 项 | 内容 |
|---|---|
| **Research Question** | 第一段 Pre-activation（BN+ReLU）是否关键？ |
| **What changed** | Block: `Conv→BN→ReLU→Conv→Add`（无 post-add ReLU） |
| **What fixed** | 数据、优化器、LR、epoch、Option A、评估协议 |
| **Result** | Best test error **8.32%**（epoch 124） |
| **Δ vs ResNet-20-A** | **−0.09 pp** |
| **Δ vs Full PreAct** | **−1.15 pp** |
| **Params** | 269,738（−672 vs ResNet） |
| **Duration** | 01:08:53 |

**Source:** `experiments/results/phase5/summary.json`; `experiments/configs/phase5/ablation_a.yaml`

**Run-to-run（Ablation A）：**

| Run ID | Epochs | Best Test Error |
|---|---:|---:|
| `18_46_54` | 1 (smoke) | 53.39% |
| `18_53_50` | 1 (smoke) | 52.14% |
| `18_57_26` | 1 (smoke) | 64.50% |
| **`18_59_29`** | **160** | **8.32%** |

**Interpretation:**

- **Observed:** 去掉第一段 BN+ReLU 后，模型可训且显著优于完整 PreAct（−1.15 pp）。
- **Observed:** 相对 ResNet-20-A 仅 −0.09 pp，落在设计文档估计的单 seed 噪声范围（±0.3–0.5 pp）内。
- **Inferred:** 第一段 PreAct 在本设置下**非必要**，完整 PreAct 的性能损失主要来自第一段 BN+ReLU 的存在。
- **不能宣称:** Ablation A **稳健超越** ResNet-20-A（证据不足）。

### 6.2 Ablation B — 去掉第二段 BN+ReLU

| 项 | 内容 |
|---|---|
| **Research Question** | 第二段 BN+ReLU 是否关键？ |
| **What changed** | Block: `BN→ReLU→Conv→Conv→Add` |
| **What fixed** | 同上 |
| **Result** | **failed** — `numerical_instability` |
| **Failure detail** | 从 epoch 0 起 train loss = NaN；train/test error ≈ 90%（随机猜测） |
| **Stopped** | epoch 20，用户停止；未重训 |

**Source:** `experiments/runs/phase5/ablation_b/.../20_08_23/status.json`

**Interpretation:**

- **Observed:** 去掉第二段 BN 后，在冻结 lr=0.1 配方下**不可训**。
- **Inferred:** 第二层 Conv 前的 BN 对数值稳定性至关重要（与 Conv-Conv 直连相关）。
- **Speculative:** 若降低 lr 或加 warmup，B 或许可训——**未验证**，不得写为结论。

### 6.3 哪个组件真正贡献了性能？

| 组件 | 完整 PreAct | Ablation A（无 1st BN+ReLU） | Ablation B（无 2nd BN+ReLU） |
|---|---|---|---|
| 第一段 BN+ReLU | 有 | **去掉** | 保留 |
| 第二段 BN+ReLU | 有 | 保留 | **去掉** |
| Test Error | 9.47% | **8.32%** | NaN / failed |
| 可训性 | 可训 | 可训 | **不可训** |

**Observed 结论:**

1. **第一段 BN+ReLU：** 去掉后 test error 下降 1.15 pp（相对完整 PreAct）→ 在本 shallow 设置下**可能有害**。
2. **第二段 BN+ReLU：** 去掉后训练崩溃 → 对**可训性必要**（在 lr=0.1 下）。
3. **完整 PreAct 不是免费升级：** 9.47% > 8.41% baseline。

---

## 7. Mechanism Analysis

结合架构、baseline、comparison、ablation，区分证据层级：

### 7.1 Observed

| 现象 | 证据 |
|---|---|
| 完整 PreAct test error 高于 post-act ResNet | 9.47% vs 8.41%（+1.06 pp） |
| PreAct 在 best epoch 训练误差更高 | 1.81% vs 0.91% |
| 去掉第一段 BN+ReLU 大幅改善相对 PreAct | −1.15 pp |
| 去掉第二段 BN 导致 NaN | `status.json` first_nan_epoch=0 |
| Ablation A 为已完成 run 中 best | 8.32% |

### 7.2 Inferred

| 推断 | 依据 |
|---|---|
| 完整 PreAct 在本配方下相对 underfit | train@best 1.81% > 0.91%；test 亦更差 |
| 第一段 PreAct 与浅层 CIFAR-20 + 后激活优化配方错配 | Ablation A 显著优于 PreAct；A 结构更接近 post-act 前半段 |
| 第二段 BN 提供必要的激活尺度控制 | B 的 Conv-Conv 直连 + lr=0.1 → NaN |

### 7.3 Speculative（不得写为 confirmed mechanism）

| 推测 | 说明 |
|---|---|
| PreAct 在 depth-20 上普遍更差 | 仅单次 CIFAR-20 run；He 2016 收益多见于更深网络 |
| 若 tune LR，PreAct 可能追上 | 未做 hyperparameter search |
| Ablation A 结构可泛化优于 post-act | Δ=0.09 pp，单 seed |
| 第一段 BN+ReLU 的害处机制是梯度/表示特定路径 | 仅有误差与结构一致性，无梯度/激活可视化 |

---

## 8. Parameter / Efficiency Analysis

| Model | Params | Δ vs ResNet | Best Test Error | Δ Error (pp) | Duration | Error per 1k params* |
|---|---:|---:|---:|---:|---:|---|
| Plain-20 | 270,410 | 0 | 9.68% | +1.27 | 01:04:19 | — |
| ResNet-20-A | 270,410 | 0 | 8.41% | 0 (ref) | 01:03:13 | baseline |
| PreAct | 270,314 | −96 | 9.47% | +1.06 | 01:11:17 | 更差 + 更慢 |
| Ablation A | 269,738 | −672 | 8.32% | −0.09 | 01:08:53 | 略好（within noise） |
| Ablation B | 269,642 | −768 | failed | — | ~20 ep | 不可比 |

\*定性比较，非论文指标。

**Observed:** 性能变化与参数量变化**无单调关系**；PreAct 参数略少但性能更差。Ablation A 参数最少且 error 最低，但相对 baseline 改善不足以证明“效率值得”。

**Relative cost-benefit（Phase 3 假设视角）:**

- 预期：≈0 额外参数 → 测试误差下降 ≥0.30 pp  
- 实际：−96 参数 → 测试误差 **上升** 1.06 pp  
- **结论：** 完整 PreAct 在本设置下**不值得**作为 drop-in 替换。

---

## 9. Failure / Negative Results

必须记录的负结果与限制：

| 类型 | 详情 | Source |
|---|---|---|
| **PreAct 未改善 baseline** | 9.47% vs 8.41%（+1.06 pp） | phase4 comparison |
| **未达 success threshold** | 需 ≤8.11%（−0.30 pp），实际 +1.06 pp | phase3 design |
| **Ablation B 训练失败** | NaN from epoch 0 | ablation_b status.json |
| **Ablation A 未稳健超越 baseline** | −0.09 pp，单 seed | phase5 summary |
| **PreAct smoke runs** | 16_16_32, 16_18_38 仅 1 epoch | metrics.json |
| **Ablation A 前 3 次 smoke** | 18_46_54 等，1 epoch | metrics.json |
| **Ablation B 多次失败** | 18_47_56, 18_58_36 亦 ~90% @ epoch 0 | metrics.json |
| **多种子未做** | 全部 seed=null | configs |
| **Git provenance 缺失** | commit 早于实验日；大量 untracked | git log |

**数字冲突记录:**

| 冲突 | 详情 | Canonical |
|---|---|---|
| `comparison.md` 符号 | §Pre-activation 写 "Absolute change: **-1.06 pp**"，语义应为 PreAct **更差** +1.06 pp | `comparison.json` → `preact_minus_resnet20a_best_test_error_pp: 1.06` |
| environment_report vs config | environment_report 描述 uv/CPU 路径；实际训练用 conda deeplearn | `experiments/configs/phase2/...yaml`, `README.md` |

---

## 10. Hypothesis Verification

### Original Hypothesis

> Pre-activation 使残差支路与恒等捷径的组合更接近 \(y = x + F(x)\) 的优化友好形式，从而在相同参数量与 Option A 捷径下，获得**严格优于**当前 ResNet-20-A baseline（8.41%）的测试错误率。

**Success threshold:** 改善 ≥ 0.30 pp（≤ 8.11%）  
**Source:** `research/phase3-improvement-research-design/PHASE_3_RESEARCH_DESIGN.md`

### Evidence Supporting

- （无）完整 PreAct **未**优于 8.41%。
- Ablation A（8.32%）优于 PreAct，但不构成对**原假设**（完整 PreAct 改进）的支持。

### Evidence Against

1. PreAct best test error **9.47%** > 8.41%（+1.06 pp）。
2. 改进方向与假设相反（变差而非变好）。
3. 未达 0.30 pp 阈值；差距 1.06 pp。
4. PreAct train@best（1.81%）高于 baseline（0.91%），不支持“更好优化”。

### Final Judgment

**Not Supported**

完整 Pre-activation 单元在冻结 CIFAR-10 ResNet-20（Option A）、160 epoch、单 seed 设置下，**未能**降低测试错误率；假设被实验否证。

---

## 11. Limitations

仅列本项目**实际存在**的限制：

1. **Single random seed** — 全部 run `seed: null`；小 delta（如 0.09 pp）不可判显著。
2. **Single full run per model** — PreAct、Ablation A 各仅 1 次 160-epoch canonical run。
3. **Depth-20 only** — 未跑 32/44/56；不能外推深度效应。
4. **CIFAR-10 only** — 无 ImageNet 或其他数据集。
5. **Frozen post-act training recipe** — lr=0.1、milestones 等为后激活基线优化；未为 PreAct tune。
6. **Test-set checkpoint selection** — 每 4 epoch 用 test error 选 best.pt（与参考 repo 一致，但引入 test 泄漏风险）。
7. **Hardware** — RTX 3050 4GB 笔记本 GPU；约 1 h/run。
8. **No run-level provenance** — 无 per-run git hash / config snapshot。
9. **Ablation B incomplete** — 失败 run 不能提供精度对比；未尝试 lr 调整 rescue。
10. **Experiments possibly on uncommitted code** — Git HEAD `dc2727f`（2026-09-02）早于 2026-09-03 实验。**[NEEDS VERIFICATION]**

---

## 12. Research Insights

以下为最值得写入未来论文 Discussion 的 insight（非简单重复数字）：

1. **Reproduction-first 价值：** 在 trust baseline（8.41% ≈ paper 8.75%）之上做改进，才使 PreAct 的 negative result（+1.06 pp）具有可审计意义，而非 implementation bug 假象。

2. **Drop-in 假设可被单次实验否证：** Identity Mappings 的 PreAct 收益在文献中多见于**更深**网络；在 shallow CIFAR-20 + 后激活配方上，完整 PreAct **不是**免费升级——这是有效的 null result。

3. **消融 > 整包改进：** PreAct 整体更差，但 Ablation A/B 揭示了两段 BN+ReLU **重要性不对称**——第一段可缺（甚至有害于 PreAct 相对表现），第二段对 lr=0.1 稳定性**必要**。这比单纯报告“PreAct 失败”更有机制信息量。

4. **Underfit 信号：** PreAct 更高 train@best（1.81% vs 0.91%）提示性能差距可能来自**优化/表示学习不足**，而非纯过拟合；但这仍是 Inferred，需多种子或 LR sweep 验证。

5. **Evidence discipline：** 0.09 pp 的 Ablation A “最好”结果必须标注为 **within single-run noise**——对小改进而言，多种子是科学结论的前置条件。

---

## Appendix: Figure & Table Index for Phase 7

| Artifact | Path | Phase |
|---|---|---|
| Plain vs Residual curve | `experiments/results/phase2/figures/plain_vs_residual.png` | 2 |
| Side-by-side bars | `experiments/results/phase2/figures/side_by_side.png` | 2 |
| Phase 2 metrics table | `experiments/results/phase2/metrics.csv` | 2 |
| Test error curves (3 models) | `experiments/results/phase4/figures/test_error_curves.png` | 4 |
| Train error curves | `experiments/results/phase4/figures/train_error_curves.png` | 4 |
| Loss curves | `experiments/results/phase4/figures/loss_curves.png` | 4 |
| Best test error bar | `experiments/results/phase4/figures/best_test_error_bar.png` | 4 |
| Phase 4 comparison table | `experiments/results/phase4/comparison.csv` | 4 |
| Phase 5 best error bar | `experiments/results/phase5/figures/best_test_error_completed.png` | 5 |
| Phase 5 comparison table | `experiments/results/phase5/comparison.csv` | 5 |
| Paper display copies | `paper/figures/`, `paper/tables/` | sync |

---

*Document generated for Phase 6. All metrics trace to files listed above. No experiments were run or modified during authoring.*
