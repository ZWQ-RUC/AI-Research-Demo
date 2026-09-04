# Research Question Card (imported)

**status:** `approved`  
**source_mode:** read-only inheritance from existing DEMO docs  
**created_utc:** 2026-09-04T01:43:00Z  
**G1:** **APPROVED** as drafted (user confirm 2026-09-04)

## Research Question

在冻结 CIFAR-10 数据与 He et al. §4.2 训练配方的前提下，将 ResNet-20-A 的 post-activation `BasicBlock` 替换为 pre-activation 残差单元，能否降低测试错误率？

## Hypothesis

Pre-activation 使残差支路与恒等捷径的组合更接近 \(y = x + F(x)\) 的优化友好形式，从而在相同参数量与 Option A 捷径下，获得**严格优于**当前 ResNet-20-A baseline（8.41%）的测试错误率。

## Success threshold (preset)

主 run 相对 8.41% 改善 ≥ 0.30 pp（即 best test error ≤ 8.11%）。

## Falsification criteria

出现以下任一情况，则判定本假设在本项目设定下不成立或未获支持：

1. Pre-act 最佳测试错误率 ≥ 8.41%（无改进或变差）；或
2. 改进幅度 < 0.30 pp，且在额外 1–2 个 seed 上均值仍未达到阈值；或
3. 测试略好但训练崩溃/不稳定（loss NaN、误差不下降），无法形成可靠结论；或
4. 参数量或每 epoch 时间异常增加（说明实现偏离“重排单元”的设定）。

## Scope

**In scope**

- CIFAR-10 depth-20；Option A；冻结后激活训练配方
- Plain-20 / ResNet-20-A baseline；PreAct；Ablation A/B
- Single-seed DEMO 设定下的可审计结果与 negative result

**Out of scope (for this DEMO paper)**

- ImageNet；Table 6 全深度套件
- 为 PreAct 单独大规模调参后的“最佳可达精度”宣称
- 未经 G4 批准的更强外推措辞

## Provenance (pointers only)

| Field | Path |
|-------|------|
| RQ / Hypothesis design | `research/phase3-improvement-research-design/PHASE_3_RESEARCH_DESIGN.md` §Step 6 |
| Conclusion restatement | `paper/conclusion.md` §1, §7 |
| Observed outcome (not G4-approved findings) | PreAct 9.47% → Hypothesis **Not Supported** (`paper/conclusion.md` §7) |
