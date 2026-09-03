# paper/ — 写论文 / 汇报用材料包

本目录包含两类内容：

1. **自动同步层** — 从 `experiments/results/` 复制的图、表、指标（跑 `sync_paper.py`）
2. **Phase 6 人工撰写层** — `analysis.md` 与 `conclusion.md`（Paper Evidence Base，**不**随 sync 覆盖）

**权威数字仍以** `experiments/results/` **与** `experiments/manifests/` **为准**。若实验结果更新，请先更新 results，再跑 `sync_paper.py`，最后**手动**核对/更新 Phase 6 两份 Markdown。

```text
paper/
├── README.md         # 本文件
├── analysis.md       # ★ Phase 6 研究分析（Evidence Base）
├── conclusion.md     # ★ Phase 6 研究结论（Phase 7 素材）
├── figures/          # 对比图、曲线图（sync）
├── tables/           # CSV 表（sync）
└── metrics/          # JSON / 阶段总结（sync）
```

---

## Phase 6 核心文档

| 文档 | 回答的问题 | 主要章节 | 何时读 |
|------|-----------|---------|--------|
| **`analysis.md`** | 实验**为什么**出现这些结果？ | Evidence Map；Baseline / Improvement / Ablation 分析；Mechanism（Observed/Inferred/Speculative）；Hypothesis Verification；Limitations | 写 Discussion、查证据来源、理解机制 |
| **`conclusion.md`** | 我们**最终**发现了什么？ | Main Findings；核心结果表；Hypothesis 判定；**Paper-Ready Claims**；Figure/Table 索引 | 写论文前定 Claims 边界；5 分钟速览全局 |

**阅读顺序：** `conclusion.md` → `analysis.md`（由总到分）

**与相邻目录的分工：**

| 目录 | 角色 |
|------|------|
| `../research/` | 实验**前/中**：设计、审计、复现判定 |
| `../experiments/results/` | 权威**数字与图** |
| `analysis.md` | 实验**后**：机制分析与证据追溯 |
| `conclusion.md` | 实验**后**：结论摘要 + 论文 Claims 边界 |

---

## 自动同步收录（figures / tables / metrics）

| 类型 | 文件 | 来源 |
|------|------|------|
| 图 | `figures/phase2_plain_vs_residual.png` | `experiments/results/phase2/figures/` |
| 图 | `figures/phase2_side_by_side.png` | 同上 |
| 图 | `figures/phase4_*.png` | `experiments/results/phase4/figures/` |
| 图 | `figures/phase5_best_test_error.png` | `experiments/results/phase5/figures/` |
| 表 | `tables/phase2_metrics.csv` | `experiments/results/phase2/metrics.csv` |
| 表 | `tables/phase4_comparison.csv` | `experiments/results/phase4/comparison.csv` |
| 表 | `tables/phase5_comparison.csv` | `experiments/results/phase5/comparison.csv` |
| 指标 | `metrics/phase2_summary.json` 等 | 对应 phase results |

同步命令：

```powershell
python experiments/scripts/sync_paper.py
```

---

## Phase 7 写论文入口

1. **Claims 边界** → `conclusion.md` §12 Paper-Ready Claims
2. **核心数字表** → `conclusion.md` §4 Main Experimental Results
3. **插图** → `figures/`（或 `experiments/results/phase*/figures/`）
4. **表格** → `tables/`（或 `experiments/results/phase*/comparison.csv`）
5. **Discussion 素材** → `analysis.md` §7 Mechanism Analysis、§12 Research Insights

研究过程叙述（环境、复现判定、改进**设计**）在 `../research/`，不在本目录。
