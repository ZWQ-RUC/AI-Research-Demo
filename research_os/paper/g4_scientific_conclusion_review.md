# G4 Scientific Conclusion Review

**Phase:** Research OS Phase 7 — Gate G4  
**Purpose:** Human approval of scientific findings / claim strength **before** manuscript body wording  
**Generated:** 2026-09-04  
**Constraint:** Review only — no paper body; no experiment edits; canonical/LaTeX untouched  

**Number authority (SoT):** `experiments/manifests/` + `experiments/results/`  
**Frozen snapshot (read-only for this review):** `research_os/paper/canonical/data.json`  
**Narrative evidence:** `paper/analysis.md`, `paper/conclusion.md`  
**Architecture context:** `research_os/paper/phase7_0_paper_freeze.md`, `phase7_1_paper_architecture.md`  
**RQ contract:** `research_os/contract/research-question-card.md` (G1 approved)

---

## 1. Research Question

在冻结 CIFAR-10 数据与 He et al. §4.2 训练配方的前提下，将 ResNet-20-A 的 post-activation `BasicBlock` 替换为 pre-activation 残差单元，**能否降低测试错误率**？

**Sources:** RQ card (G1); `paper/conclusion.md` §1; Phase 3 design doc.

---

## 2. Hypothesis

Pre-activation 使残差支路与恒等捷径更接近 \(y = x + F(x)\) 的优化友好形式，从而在相同参数量与 Option A 捷径下，获得**严格优于**冻结 ResNet-20-A baseline（**8.41%**）的测试错误率。

**Sources:** RQ card; `paper/analysis.md` §3.1 / §10; `paper/conclusion.md` §7.

---

## 3. Falsification / Success Criterion

| Item | Preset |
|------|--------|
| Primary metric | Best test error (%)，与 Phase 2 相同记录方式 |
| Success threshold | 相对 8.41% **改善 ≥ 0.30 pp**（即 ≤ **8.11%**） |
| Falsification (any one) | (1) PreAct ≥ 8.41%；或 (2) 改善 < 0.30 pp 且多种子仍未达标；或 (3) 训练不稳无法形成可靠结论；或 (4) 实现偏离“单元重排”设定 |

**Observed vs criterion**

| Check | Value | Met? |
|-------|------:|:----:|
| PreAct best test error | **9.47%** | — |
| Δ vs ResNet-20-A | **+1.06 pp**（更差） | Fail success |
| ≤ 8.11% | No | Fail |
| Falsification (1) PreAct ≥ 8.41% | Yes (9.47 ≥ 8.41) | Triggered |

**Hypothesis verdict (candidate for G4):** **Not Supported** under this DEMO scope.

---

## 4. Baseline Evidence

| Model | Best test error | Evidence |
|-------|----------------:|----------|
| Plain-20 | **9.68%** | `experiments/manifests/phase2_baseline.json`; `experiments/results/phase2/summary.json` |
| ResNet-20-A (frozen control) | **8.41%** | same |
| Residual advantage (Plain − ResNet) | **1.27 pp** | phase2 summary / canonical scalars |
| vs He et al. Table 6 ResNet-20 (8.75%) | Δ **0.34 pp** | within preset ±**1.0 pp** |
| Reproduction status | `partially_reproduced` | depth-20 only; not full Table 6 suite |

**Boundary:** CIFAR-10; depth-20; Option A; single seed (`seed: null`); 160 epochs; frozen post-act recipe.

---

## 5. Improvement Evidence

| Item | Value | Evidence |
|------|------:|----------|
| PreAct-ResNet-20-A | **9.47%** | `experiments/results/phase4/comparison.json`; phase5 summary |
| vs ResNet-20-A | **+1.06 pp** | phase4 deltas; canonical `delta_preact_minus_resnet_pp` |
| Success threshold met? | **No** | required ≤ 8.11% |
| Protocol change | Block activation order only (post → pre); recipe frozen | phase4 `protocol_consistency` |
| Param count | 270,314 vs 270,410 (−96) | phase4 / phase5 |

**Train@best (observational, not causal proof):** PreAct 1.81% vs ResNet 0.91% (`paper/analysis.md` / phase4–5 metrics).

---

## 6. Ablation Evidence

| Variant | Change | Best test error | vs Full PreAct | vs ResNet-20-A | Status |
|---------|--------|----------------:|---------------:|---------------:|--------|
| Full PreAct | BN→ReLU→Conv→BN→ReLU→Conv→Add | **9.47%** | 0 | +1.06 pp | completed |
| Ablation A | Drop 1st BN+ReLU | **8.32%** | **−1.15 pp** | −0.09 pp | completed |
| Ablation B | Drop 2nd BN+ReLU | **N/A** | — | — | **failed** (NaN / numerical instability) |

**Evidence:** `experiments/results/phase5/summary.json`, `comparison.csv`; Ablation B run `status.json` under `experiments/runs/phase5/ablation_b/`.

**Hard rule for G4 wording**

- Ablation B **must not** be reported as a normal accuracy/error baseline.
- Allowed: “training failed due to numerical instability (NaN from early epochs) under lr=0.1.”
- Forbidden: quoting failed-run error (~90% class noise) as comparable test error.

---

## 7. Negative Result

Under the frozen post-activation CIFAR-10 ResNet-20-A recipe (single seed, depth-20, Option A):

1. **Primary negative result:** Full PreAct does **not** improve the frozen baseline; error rises from **8.41% → 9.47%** (**+1.06 pp**).
2. This fails the preset success criterion (≤ 8.11%) and triggers falsification condition (1).
3. Ablation A recovers strongly vs full PreAct (**−1.15 pp** → 8.32%) but is only **0.09 pp** better than ResNet-20-A — within plausible single-run noise; **not** a validated win over baseline.
4. Ablation B is a **trainability failure**, not a precision ranking result.

This negative/null package is scientifically reportable **within the stated scope**; it does **not** generalize to “PreAct is always worse.”

---

## 8. 最终可以支持的科学结论

在 **CIFAR-10 / depth-20 / Option A / 冻结后激活训练配方 / 160 epoch / single-seed** 边界内，证据支持：

1. ResNet-20-A（8.41%）优于 Plain-20（9.68%）；残差优势约 **1.27 pp**。
2. ResNet-20-A 与论文 Table 6（8.75%）相差 **0.34 pp**，落在预设 ±1.0 pp 容差内；复现判定为 **`partially_reproduced`**（仅 depth-20）。
3. 完整 PreAct 在**相同冻结配方**下未改善后激活 ResNet-20-A（9.47% vs 8.41%，**+1.06 pp**）；对应 Hypothesis **Not Supported**。
4. Ablation A（去掉第一段 BN+ReLU）相对完整 PreAct 明显更好（8.32%，**−1.15 pp**）。
5. Ablation B（去掉第二段 BN+ReLU）在 lr=0.1 下出现数值不稳定并失败，**不能**作为精度对照。
6. 在本 shallow 设置下，PreAct 两段 BN+ReLU 的经验重要性**不对称**（第一段可缺且去掉后相对 PreAct 大幅改善；第二段与可训性相关）——属**观察级**结论，非严格因果证明。

---

## 9. 当前不能支持的结论

1. PreAct 在 CIFAR / 残差网络上**普遍**或**必然**更差。
2. Ablation A **统计显著**或**稳健**优于 ResNet-20-A（仅 −0.09 pp，单 seed）。
3. Ablation A 是新的最优 CIFAR-20 结构 / SOTA 声明。
4. 已**严格证明** PreAct 变差的因果机制（仅有 underfit 等观测线索）。
5. 第二段 BN 对**所有**深度/配方/优化器设置都必要。
6. 完整 Table 6（多深度）复现已完成。
7. 任何 p-value / 显著性检验结论（未做多种子）。
8. 将 Ablation B 失败轨迹当作公平 accuracy/error baseline。
9. 为 PreAct 调参后的“最佳可达精度”结论（未做配方适配 sweep）。

---

## 10. Paper-ready claims（保守版本）

建议批准为正文可用、带边界的保守 claims（数字必须来自 SoT / canonical macros）：

1. **C1 (baseline):** On CIFAR-10, depth-20, Option A, 160 epochs, single seed, ResNet-20-A achieves **8.41%** best test error vs Plain-20 **9.68%** (advantage **1.27 pp**).
2. **C2 (reproduction scope):** ResNet-20-A is within **0.34 pp** of He et al. 2015 Table 6 ResNet-20 (**8.75%**) under a ±**1.0 pp** tolerance; status **`partially_reproduced`** (depth-20 subset only).
3. **C3 (negative result):** Replacing the post-activation block with a full pre-activation unit under the **frozen** training recipe yields **9.47%** (**+1.06 pp** vs 8.41%); the improvement hypothesis is **not supported**.
4. **C4 (ablation A vs PreAct):** Removing the first BN+ReLU (Ablation A) yields **8.32%**, **1.15 pp** lower error than full PreAct in this single run.
5. **C5 (ablation A vs baseline — weak):** Ablation A is **0.09 pp** lower than ResNet-20-A in this single run; this delta is **too small** to claim a robust improvement without multi-seed evidence.
6. **C6 (ablation B):** Removing the second BN+ReLU leads to **training failure** (NaN / numerical instability) under lr=0.1; **no comparable accuracy** is reported.
7. **C7 (scope sentence):** All claims above are limited to CIFAR-10, depth-20, Option A, frozen post-act recipe, and single-seed evaluation.

---

## 11. Claims that would be overclaiming

| Overclaim | Why forbidden |
|-----------|----------------|
| “PreAct is generally worse than post-act on CIFAR.” | Scope: depth-20 + one seed + frozen recipe only |
| “Ablation A significantly outperforms ResNet-20-A.” | Δ=0.09 pp; no multi-seed / no significance test |
| “We prove why PreAct underperforms.” | No causal identification experiments |
| “Second BN is universally necessary.” | Observed only under this lr/block setting |
| “Full Table 6 reproduction.” | Only depth-20 run |
| Reporting Ablation B as X% test error baseline | Failed / non-comparable |
| “Ablation A is the best CIFAR-20 architecture.” | Single run; no broader validation |

---

## 12. G4 approval checklist

Please confirm each item explicitly:

- [ ] **RQ / Hypothesis / criteria** above match the G1-approved contract.
- [ ] **Headline numbers** accepted: Plain 9.68; ResNet **8.41**; PreAct **9.47** (+**1.06** pp); Ablation A **8.32** (−**1.15** pp vs PreAct; −0.09 vs ResNet); Ablation B = **failed/NaN** (no accuracy baseline).
- [ ] Hypothesis status **Not Supported** approved for paper use (with scope bounds).
- [ ] Conservative claims **C1–C7** approved as maximum claim strength for drafting.
- [ ] Overclaims in §11 remain **forbidden** in manuscript / abstract / talks.
- [ ] Ablation B wording rule accepted (failure/trainability only).
- [ ] Limitations retained: single-seed, depth-20, CIFAR-10, frozen recipe, no causal proof, no significance tests.
- [ ] Engineering caveats noted but **not** upgraded to scientific proof: e.g. git provenance `[NEEDS VERIFICATION]` in analysis/conclusion remains unresolved and must not be hidden.

**Reply format (required to close G4):**

```text
APPROVE: G4 as drafted
```

or

```text
REVISE: <edits to allowed claims / forbidden claims>
```

or

```text
REJECT: <reason>
```

---

## G4 status

**PENDING_USER_APPROVAL**

Agent pause: no manuscript body writing until G4 is explicitly approved or revised.
