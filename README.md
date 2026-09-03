# AI Research Demo — 完整项目文档

> **本文档定位：** 本仓库的**唯一入口与自描述说明书**。  
> 设计目标：即使**不提供任何对话上下文**，把本文件交给 Cursor / 新协作者 / 未来的自己，也能完整理解这个 DEMO 的论文背景、目录结构、实验过程、数字来源、结论边界与后续优化方向。

---

## 0. 给 Cursor / 新读者的阅读指南

### 0.1 30 秒速览

| 项 | 内容 |
|----|------|
| **做什么** | 复现 He et al. 2015 ResNet 在 CIFAR-10 上的 depth-20 基线，并探索 Pre-activation 结构改进与消融 |
| **论文** | [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385)（CVPR 2016） |
| **参考代码** | [samitmohan/deep-residual-learning-pytorch](https://github.com/samitmohan/deep-residual-learning-pytorch) → `code/deep-residual-learning-pytorch-master/` |
| **数据集** | CIFAR-10（50k train / 10k test）→ `data/cifar-10-batches-py/` |
| **当前闭环** | Phase 2 基线 ✅ → Phase 3 PreAct ✅ → Phase 4 对比 ✅ → Phase 5 消融 ✅ → **Phase 6 研究分析 ✅** |
| **下一步** | Phase 7 正式写论文（素材已就绪：`paper/analysis.md` + `paper/conclusion.md`） |
| **权威数字** | `experiments/results/` + `experiments/manifests/`（**不是** `code/` 下的临时输出） |

### 0.2 按任务跳转

| 任务 | 章节 |
|------|------|
| 理解论文与本 DEMO 的关系 | [§1 论文脉络](#1-论文脉络与本-demo-的关系) |
| 看全部实验数字与 canonical run | [§2 实验结果总览](#2-实验结果总览) |
| 理解目录怎么组织 | [§3 目录结构详解](#3-目录结构详解) |
| 理解代码入口与模型类 | [§4 代码架构](#4-代码架构) |
| 复现或追加实验 | [§5 工作流与命令](#5-工作流与命令) |
| 各 Phase 细节 | [§6 Phase 逐阶段说明](#6-phase-逐阶段说明) |
| 找某个文件/文档 | [§7 文档与产物索引](#7-文档与产物索引) |
| 知道结论能说到哪、不能说到哪 | [§8 结论边界](#8-结论边界) |
| **读 Phase 6 研究分析与结论** | [§6 Phase 6](#phase-6--research-analysis--conclusion) · `paper/analysis.md` · `paper/conclusion.md` |
| **准备 Phase 7 写论文** | [§7.1 必读文档](#71-必读文档) · `paper/conclusion.md` §Paper-Ready Claims |
| 下一步怎么优化仓库 | [§9 优化路线图](#9-优化路线图) |
| 踩坑与经验 | [§10 经验总结](#10-经验总结) |

### 0.3 四层心智模型（贯穿全仓库）

```text
code/ + data/           →  手 + 料（能跑）
experiments/            →  账本（配置、原始 run、加工结果、manifest）
research/               →  脑（为什么、怎么判、下一步设计）
paper/                  →  脸（图表副本 + Phase 6 研究分析/结论素材）
```

**铁律：**

1. 正式对比**只引用** `experiments/manifests/` 与 `experiments/results/`，不用文件夹 mtime 猜 run。
2. Phase 2 基线 **冻结**，新实验只追加到 Phase 3+。
3. `paper/figures/`、`paper/tables/`、`paper/metrics/` 是展示层，数字以 `experiments/results/` 为准；更新后跑 `sync_paper.py`。
4. `paper/analysis.md` 与 `paper/conclusion.md` 是 **Phase 6 人工撰写的 Evidence Base**，不随 `sync_paper.py` 覆盖；若实验数字变更，需手动同步这两份文档。

---

## 1. 论文脉络与本 DEMO 的关系

### 1.1 原论文（He et al., 2015）结构

| 章节 | 内容 | 与本 DEMO 关系 |
|------|------|----------------|
| §1 Introduction | 深度网络退化问题；提出残差学习 | 动机：Plain vs Residual |
| §2 Related Work | 与 Highway、FitNet 等对比 | 未单独复现 |
| §3 Deep Residual Learning | 残差块公式 \(y = F(x) + x\)；Option A/B shortcut | **核心**：BasicBlock + Option A |
| §4 Experiments | ImageNet + CIFAR-10 | 本 DEMO 只做 **CIFAR-10 §4.2** |
| §4.2 CIFAR-10 | 6n+2 结构；Plain/ResNet 20/32/44/56；Table 6 | Phase 2 复现 **depth-20** 子集 |
| Table 6 | 各深度 test error (%) | 目标：ResNet-20 ≈ 8.75% |
| Fig. 6 | Plain 随深度退化；ResNet 改善 | Phase 2 出图 `plain_vs_residual.png` |

**论文核心 claim（CIFAR-10）：** 相同深度下，带残差捷径的网络测试错误率低于 plain 网络；更深时 plain 退化而 residual 仍改善。

### 1.2 与本 DEMO 扩展相关的第二篇论文

| 论文 | 关系 |
|------|------|
| [Identity Mappings in Deep Residual Networks](https://arxiv.org/abs/1603.05027)（He et al., 2016, ECCV） | 提出 **Pre-activation** 残差单元：`BN→ReLU→Conv→BN→ReLU→Conv→Add`，主张更干净的恒等映射 |

本 DEMO 的 Phase 3–5 **不是**复现 Identity Mappings 全文，而是在 **Phase 2 冻结的后激活 ResNet-20-A 配方**上，测试 PreAct 是否 drop-in 改善，并通过消融定位哪段 BN+ReLU 关键。

### 1.3 本 DEMO 在论文谱系中的位置

```text
He 2015 (ResNet, post-act)          He 2016 (PreAct / identity mappings)
        │                                        │
        │  Phase 2：复现 CIFAR depth-20           │
        │  Plain-20 vs ResNet-20-A               │
        └──────────────┬─────────────────────────┘
                       │  Phase 3：在冻结配方上试 PreAct
                       │  Phase 4：控制变量对比
                       │  Phase 5：消融两段 BN+ReLU
                       │  Phase 6：研究分析 & 结论（Evidence Base）
                       ↓
              「浅层 CIFAR-20 上 PreAct 是否免费升级？」
              答案：否；且两段 PreAct 重要性不等
              → 详见 paper/analysis.md · paper/conclusion.md
```

### 1.4 复现范围与状态

| 范围 | 状态 | 说明 |
|------|------|------|
| Plain-20 + ResNet-20-A | ✅ `partially_reproduced` | 数值在 ±1.0 pp 容差内 |
| ResNet 32/44/56, Option B, ResNet-110 | ❌ 未跑 | 需追加 ~5×1h 训练 |
| ImageNet | ❌ 未跑 | 超出本 DEMO |
| PreAct + 消融 | ✅ 完成 | 本 DEMO 原创实验线 |
| Phase 6 研究分析 & 结论 | ✅ 完成 | `paper/analysis.md`, `paper/conclusion.md` |

复现判定详见：`research/resnet-cifar10-baseline-20260902/reproduction_report.md`  
研究结论与 Claims 边界详见：`paper/conclusion.md`

---

## 2. 实验结果总览

### 2.1 五模型主表（单次运行，seed 未固定）

| 排名 | 模型 | Phase | Block 结构 | Best Test Error | Best Epoch | 状态 |
|------|------|-------|-----------|----------------:|-----------:|------|
| 1 | Ablation A | 5 | `Conv→BN→ReLU→Conv→Add` | **8.32%** | 124 | completed |
| 2 | ResNet-20-A | 2 | `Conv→BN→ReLU→Conv→BN→Add→ReLU` | **8.41%** | 132 | completed ★基线 |
| 3 | PreAct-ResNet-20-A | 3 | `BN→ReLU→Conv→BN→ReLU→Conv→Add` | 9.47% | 128 | completed |
| 4 | Plain-20 | 2 | 无 shortcut | 9.68% | 132 | completed |
| — | Ablation B | 5 | `BN→ReLU→Conv→Conv→Add` | NaN | — | **failed** |

★ **ResNet-20-A (8.41%)** 是 Phase 3–5 的冻结对照基线。

### 2.2 与论文 / 参考仓库对比（Phase 2）

| 模型 | 本仓库 | 参考仓库 README | 论文 Table 6 |
|------|-------:|----------------:|-------------:|
| Plain-20 | 9.68 | 9.26 | — |
| ResNet-20-A | **8.41** | 8.64 | **8.75** |

- 残差优势：**1.27 pp**（Plain → ResNet）
- 容差：**±1.0 pp** → 判定通过

### 2.3 Canonical Run 注册表（正式 run 完整路径）

> 同一模型目录下可能有多个时间戳（smoke / 中断重跑）。**只有下表路径是正式 run。**

| 模型 | Run ID | 权威 artifact_root |
|------|--------|-------------------|
| Plain-20 | `plain20_08_49_22` | `experiments/runs/phase2/baseline/CifarResNet-20-P-N/09_03_2026/08_49_22/` |
| ResNet-20-A | `resnet20a_09_53_41` | `experiments/runs/phase2/baseline/CifarResNet-20-R-A/09_03_2026/09_53_41/` |
| PreAct-ResNet-20-A | `preact_16_23_57` | `experiments/runs/phase3/preact_resnet20a/CifarPreActResNet-20-R-A/09_03_2026/16_23_57/` |
| Ablation A | `abl_a_18_59_29` | `experiments/runs/phase5/ablation_a/CifarPreActAblationA-20-R-A/09_03_2026/18_59_29/` |
| Ablation B | `abl_b_20_08_23` | `experiments/runs/phase5/ablation_b/CifarPreActAblationB-20-R-A/09_03_2026/20_08_23/`（failed） |

每个 canonical run 目录典型内容：

```text
<artifact_root>/
├── weights/best.pt          # 最佳 checkpoint（.gitignore，本地保留）
├── train_errors.npy         # 训练曲线（.gitignore）
├── test_errors.npy
├── train_losses.npy
├── test_losses.npy
└── metrics.json             # 小文件摘要（可选进 Git）
```

失败 run 额外有：`status.json`（含 `failure_mode: numerical_instability`）

### 2.4 关键相对差异（百分点）

| 对比 | Δ (pp) | 解读 |
|------|-------:|------|
| ResNet-20-A vs Plain-20 | −1.27 | 残差有效（Phase 2 主结论） |
| PreAct vs ResNet-20-A | +1.06 | 完整 PreAct 更差 |
| Ablation A vs ResNet-20-A | −0.09 | 略好，但属单 seed 噪声范围 |
| Ablation A vs PreAct | −1.15 | 去掉第一段 BN+ReLU 显著帮助 |
| Ablation B | — | 不可训，不参与排名 |

### 2.5 实验逻辑树

```text
                    Phase 2：基线复现（冻结）
                           │
              ┌────────────┴────────────┐
              ↓                         ↓
          Plain-20                 ResNet-20-A ★
          9.68%                       8.41%
                                          │
                              Phase 3：Pre-activation 改进
                                          │
                              PreAct 9.47%（+1.06 pp，更差）
                                          │
                              Phase 4：三模型只读对比
                                          │
                              Phase 5：消融
                              ┌───────────┴───────────┐
                              ↓                       ↓
                        Ablation A              Ablation B
                        8.32%（最好）            NaN / failed
                   去掉第一段 BN+ReLU         去掉第二段 BN
                                          │
                              Phase 6：Evidence Base
                                          │
                              paper/analysis.md（机制分析）
                              paper/conclusion.md（结论 + Claims）
```

---

## 3. 目录结构详解

### 3.1 顶层树

```text
AI-Research-Demo/
├── README.md                 # ★ 本文件（项目总入口）
├── Models.md                 # 五模型 block 结构速查
├── environment.yml           # 环境声明（参考，未 pin exact version）
├── .gitignore                # 大数据 / checkpoint 排除规则
│
├── code/deep-residual-learning-pytorch-master/
│   ├── models.py             # Plain / ResNet / PreAct / Ablation 模型
│   ├── train.py              # 训练 CLI 入口
│   ├── test.py               # 单元测试（34 tests）
│   ├── results_plot.py       # Phase 2 出图
│   ├── data/                 # junction → ../../data/
│   ├── models/               # junction → experiments/runs/...（训练输出）
│   └── runs/                 # TensorBoard 临时（.gitignore）
│
├── data/                     # 数据集（不进 Git）
│   ├── cifar-10-batches-py/  # 官方 pickle
│   └── cifar10_images/       # 60000 PNG 导出（人工查看）
│
├── experiments/              # ★ 实验中枢
│   ├── README.md
│   ├── configs/phase{2,3,4,5}/
│   ├── launch/*.ps1
│   ├── manifests/
│   ├── scripts/build_*.py, sync_paper.py
│   ├── runs/phase{2,3,4,5}/
│   └── results/phase{2,3,4,5}/
│
├── paper/                    # 写论文 / 汇报材料包
│   ├── README.md
│   ├── analysis.md           # ★ Phase 6 研究分析（Evidence Base）
│   ├── conclusion.md         # ★ Phase 6 研究结论（Phase 7 素材）
│   ├── figures/              # 从 results 同步的图
│   ├── tables/               # 从 results 同步的表
│   └── metrics/              # 从 results 同步的 JSON
│
└── research/                 # 研究叙述与审计
    ├── README.md
    ├── resnet-cifar10-baseline-20260902/   # Phase 0–2 审计包
    ├── phase3-improvement-design/          # PreAct 设计（早期）
    └── phase3-improvement-research-design/ # PreAct 设计（正式）
```

### 3.2 `experiments/` 子目录职责

| 子目录 | 职责 | 典型文件 | Git |
|--------|------|---------|-----|
| `configs/` | 实验配方声明 | `phase2/baseline_plain20_resnet20a.yaml` | ✅ |
| `launch/` | 一键启动 / 监控 | `run_subset_20.ps1`, `run_phase3_preact.ps1` | ✅ |
| `manifests/` | 权威 run 指针 | `phase2_baseline.json` | ✅ |
| `runs/` | 原始训练产物 | `weights/`, `*.npy`, `*.log`, `metrics.json` | 大体 ❌ |
| `results/` | 加工后的表/图/JSON | `summary.json`, `comparison.csv`, `figures/` | ✅ |
| `scripts/` | 自动化汇总 | `build_phase4_comparison.py`, `sync_paper.py` | ✅ |

### 3.3 Run 目录命名约定

```text
experiments/runs/<phase>/<idea_id>/<ModelClassName>/<MM_DD_YYYY>/<HH_MM_SS>/
```

示例：

```text
experiments/runs/phase2/baseline/CifarResNet-20-R-A/09_03_2026/09_53_41/
│          │      │         │                      │           │
│          │      │         │                      │           └─ 启动时刻（canonical 标识）
│          │      │         │                      └─ 日期
│          │      │         └─ 模型类名（由 train.py 根据参数生成）
│          │      └─ 实验 idea（baseline / preact_resnet20a / ablation_a）
│          └─ 研究阶段
└─ 固定前缀
```

### 3.4 数据流（一次实验的完整生命周期）

```text
① 设计文档       research/phase3-improvement-design/PHASE_3_RESEARCH_DESIGN.md
       ↓
② YAML 配置      experiments/configs/phase3/preact_resnet20a.yaml
       ↓
③ 启动脚本       experiments/launch/run_phase3_preact.ps1
       ↓
④ 训练           code/.../train.py --preact ...
       ↓
⑤ 原始产物       experiments/runs/phase3/.../metrics.json + weights/ + *.npy
       ↓
⑥ 汇总脚本       experiments/scripts/build_phase4_comparison.py
                 experiments/scripts/build_phase5_summary.py
       ↓
⑦ 加工结果       experiments/results/phase4/, phase5/
       ↓
⑧ 同步展示       python experiments/scripts/sync_paper.py → paper/figures|tables|metrics
       ↓
⑨ 阶段汇总       research/ 或 results/phaseN/summary.md
       ↓
⑩ Phase 6 分析   paper/analysis.md + paper/conclusion.md（基于 ①–⑨ 全部证据）
       ↓
⑪ Phase 7 写论文  以 paper/conclusion.md 的 Claims 为边界起草正文
```

Phase 4 特殊：**无新训练**，只读 Phase 2+3 已有产物。  
Phase 6 特殊：**无新训练**，只读汇总 + 撰写分析文档。

### 3.5 Git 策略

| 进 Git ✅ | 不进 Git ❌ |
|----------|------------|
| `code/*.py`, configs, launch, manifests, scripts | `data/` 全部 |
| `experiments/results/` | `runs/**/weights/*.pt` |
| `paper/`（副本） | `runs/**/*.npy`, `*.log` |
| `research/*.md` | `code/**/runs/`（TensorBoard） |
| 选择性 `runs/**/metrics.json`, `status.json` | checkpoint 大文件 |

---

## 4. 代码架构

### 4.1 入口与 CLI

**训练入口：** `code/deep-residual-learning-pytorch-master/train.py`

```text
python train.py <depth> [-r] [-o A|B] [--preact] [--ablation A|B] [--quick] [--output-root PATH]
```

| 参数 | 含义 | 本 DEMO 用法 |
|------|------|-------------|
| `n` | 深度 20/32/44/56/110 | 只用 **20** |
| `-r` | 启用残差 | ResNet / PreAct |
| `-o A\|B` | Shortcut 类型 | 只用 **A** |
| `--preact` | Pre-activation 块 | Phase 3 |
| `--ablation A\|B` | 消融（隐含 --preact） | Phase 5 |
| `--quick` | 5 epoch 调试 | smoke test |
| `--output-root` | 产物根目录 | launch 脚本指向 `experiments/runs/...` |

### 4.2 模型类（`models.py`）

| 类 | 用途 | Phase |
|----|------|-------|
| `BasicBlock` | 后激活残差块 | 2 |
| `PreActBasicBlock` | 完整 PreAct 块 | 3 |
| `CifarResNet` | Plain / ResNet-20-A | 2 |
| `CifarPreActResNet` | PreAct + Ablation A/B | 3, 5 |
| `ClassifierHead` | GAP + FC | 共用 |
| `BottleneckBlock`, `ImageNetResNet` | ImageNet 用 | 未使用 |

Ablation 通过 `PreActBasicBlock` 内部 flag 控制：

- **Ablation A：** 去掉第一段 `BN+ReLU` → `Conv→BN→ReLU→Conv→Add`
- **Ablation B：** 去掉第二段 `BN+ReLU` → `BN→ReLU→Conv→Conv→Add`（不可训）

### 4.3 目录联接（Windows junction）

launch 脚本或手动创建：

```text
code/.../data   →  AI-Research-Demo/data/
code/.../models →  AI-Research-Demo/experiments/runs/<phase>/...
```

**目的：** 代码在 `code/` 下运行，产物统一落到 `experiments/runs/`。

### 4.4 环境

| 项 | 值 |
|----|-----|
| Python 环境 | conda `deeplearn` |
| PyTorch | `2.0.1+cu117` |
| GPU | RTX 3050 Laptop 4GB |
| 备选 | `code/.../uv.lock` + `.venv`（Windows 上 uv 装 CUDA torch 曾遇文件锁，实际用 conda） |

详见：`research/resnet-cifar10-baseline-20260902/environment_report.md`

---

## 5. 工作流与命令

### 5.1 Phase 定义与状态

| Phase | 名称 | 训练 | 状态 | 产出 |
|-------|------|------|------|------|
| 0/1 | 论文理解 + 代码审计 + 环境 | 否 | ✅ | `research/resnet-cifar10-baseline-20260902/` |
| 2 | 基线复现 | 是 | ✅ 冻结 | `manifests/phase2_baseline.json`, `results/phase2/` |
| 3 | PreAct 改进 | 是 | ✅ | `runs/phase3/preact_resnet20a/` |
| 4 | 控制变量对比 | **否**（只读） | ✅ | `results/phase4/comparison.md` |
| 5 | PreAct 消融 A/B | 是 | ✅（B failed） | `results/phase5/summary.md` |
| **6** | **Research Analysis & Conclusion** | **否**（只读） | **✅** | **`paper/analysis.md`, `paper/conclusion.md`** |
| 7 | 正式写论文 | 否 | ⏳ 待开始 | （以 Phase 6 素材为输入） |

### 5.2 冻结评估协议（Phase 2–5 共用）

| 设置 | 值 |
|------|-----|
| 结构 | CIFAR 6n+2，depth=20 → n=3 |
| 通道 | {16, 32, 64} @ {32×32, 16×16, 8×8} |
| Shortcut | Option A（零填充） |
| 优化器 | SGD，m=0.9，wd=1e-4 |
| 学习率 | 0.1；32k / 48k iter 处 ÷10 |
| Batch / Epoch | 128 / 160（≈64k iter） |
| 增强 | pad4 + random crop 32×32 + hflip |
| 归一化 | 逐通道 mean/std（torchvision 惯例） |
| 指标 | best test error (%)；每 4 epoch eval；存 `best.pt` |
| Seed | **未固定**（已知局限） |

### 5.3 常用命令

```powershell
# ── 训练 ──
.\experiments\launch\run_subset_20.ps1          # Phase 2：Plain-20 + ResNet-20-A
.\experiments\launch\run_phase3_preact.ps1      # Phase 3：PreAct
.\experiments\launch\run_phase5_ablations.ps1   # Phase 5：Ablation A/B
.\experiments\launch\monitor_training.ps1       # 监控

# ── 汇总 ──
python experiments/scripts/build_phase2_results.py
python experiments/scripts/build_phase4_comparison.py
python experiments/scripts/build_phase5_summary.py

# ── 同步到 paper/ ──
python experiments/scripts/sync_paper.py

# ── 测试 ──
cd code/deep-residual-learning-pytorch-master
python -m unittest test.py                      # 34 tests
```

### 5.4 新实验 Checklist

追加实验时按此顺序：

1. [ ] 在 `research/` 写设计文档（假设 + 阈值 + 控制变量）
2. [ ] 添加 `experiments/configs/phaseN/xxx.yaml`
3. [ ] 添加 `experiments/launch/run_xxx.ps1`（含 `--output-root`）
4. [ ] 训练完成后确认 `runs/.../metrics.json` 存在
5. [ ] 更新或新建 `experiments/manifests/phaseN_xxx.json` 登记 canonical run
6. [ ] 跑 `build_phaseN_*.py` 更新 `results/`
7. [ ] 跑 `sync_paper.py`
8. [ ] 更新本 README 的 §2 canonical run 表（若产生新的正式 run）
9. [ ] 若数字变更，手动同步 `paper/analysis.md` 与 `paper/conclusion.md`（**不**由 sync 脚本覆盖）

---

## 6. Phase 逐阶段说明

### Phase 0/1 — 准备

**产物：** `research/resnet-cifar10-baseline-20260902/`

| 文件 | 内容 |
|------|------|
| `paper_summary.md` | 论文 claim、Table 6、评估协议 |
| `code_analysis.md` | 论文概念 → 代码文件映射 |
| `environment_report.md` | conda 环境、GPU、偏差 |
| `experiment_log.md` | 时间线、命令、失败与修复 |
| `reproduction_report.md` | 复现判定 `partially_reproduced` |
| `innovation_report.md` | Phase 3+ 改进提案 |

### Phase 2 — 基线复现

**目标：** Plain-20 vs ResNet-20-A；验证残差优势；数值可比论文 Table 6。

| 项 | 路径 |
|----|------|
| 配置 | `experiments/configs/phase2/baseline_plain20_resnet20a.yaml` |
| 启动 | `experiments/launch/run_subset_20.ps1` |
| Manifest ★ | `experiments/manifests/phase2_baseline.json` |
| 结果 | `experiments/results/phase2/summary.json` |
| 图 | `experiments/results/phase2/figures/plain_vs_residual.png` |

**注意：** `runs/phase2/baseline/` 下 Plain-20 有 6 个时间戳目录，**仅 `08_49_22` 是正式 run**；其余为 smoke / 中断。

### Phase 3 — Pre-activation 改进

**假设：** 在冻结 ResNet-20-A 配方上，PreAct 块（Identity Mappings 风格）进一步降低 test error。

**结果：** 9.47% vs 8.41%，**假设被否证**（+1.06 pp）。

| 项 | 路径 |
|----|------|
| 设计 | `research/phase3-improvement-research-design/PHASE_3_RESEARCH_DESIGN.md` |
| 配置 | `experiments/configs/phase3/preact_resnet20a.yaml` |
| 启动 | `experiments/launch/run_phase3_preact.ps1` |
| Canonical run | `runs/phase3/preact_resnet20a/.../16_23_57/` |

**注意：** PreAct 有 3 次 run（16_16_32, 16_18_38, 16_23_57），正式取最后一次完整 160 epoch。

### Phase 4 — 控制变量对比

**特点：** 无新训练；只读汇总 Phase 2 + Phase 3。

| 项 | 路径 |
|----|------|
| 汇总 | `experiments/results/phase4/comparison.md` |
| CSV | `experiments/results/phase4/comparison.csv` |
| 图 | `experiments/results/phase4/figures/`（4 张） |
| 脚本 | `experiments/scripts/build_phase4_comparison.py` |

### Phase 5 — 消融

**目的：** 分解 PreAct 的两段 BN+ReLU，各自贡献多少。

| 消融 | 改动 | 结果 | 含义 |
|------|------|------|------|
| A | 去掉第一段 BN+ReLU | 8.32% ✅ | 第一段 PreAct 在本设置下非必要，甚至有害 |
| B | 去掉第二段 BN+ReLU | NaN ❌ | 第二段 BN 对 lr=0.1 稳定性关键 |

| 项 | 路径 |
|----|------|
| 配置 | `experiments/configs/phase5/ablation_{a,b}.yaml` |
| 启动 | `experiments/launch/run_phase5_ablations.ps1` |
| 汇总 | `experiments/results/phase5/summary.md` |
| 脚本 | `experiments/scripts/build_phase5_summary.py` |

### Phase 6 — Research Analysis & Conclusion

**目标：** 不跑新实验、不写正式论文；基于 Phase 0–5 全部真实产物，生成可追溯的 **Paper Evidence Base**。

| 文档 | 路径 | 内容 |
|------|------|------|
| **研究分析** | `paper/analysis.md` | Evidence Map；Baseline / Improvement / Comparison / Ablation 机制分析；Observed vs Inferred vs Speculative；负结果；假设验证；limitations |
| **研究结论** | `paper/conclusion.md` | Main Findings；核心结果表；Hypothesis 判定；Scientific / Engineering Conclusion；**Claims We Can Make / Should Avoid**；Phase 7 Figure/Table 索引 |

**阅读顺序建议：**

1. 先读 `conclusion.md`（5 分钟速览全局结论与 Claims 边界）
2. 再读 `analysis.md`（需要机制解释、Evidence Map、或写 Discussion 时）

**与 `research/`、`results/` 的分工：**

| 目录 | 角色 |
|------|------|
| `research/` | 实验**前**的设计与**中**的审计（为什么跑、怎么判复现） |
| `experiments/results/` | 加工后的**数字与图**（权威数据源） |
| `paper/analysis.md` | 实验**后**的「为什么会出现这些结果」 |
| `paper/conclusion.md` | 实验**后**的「我们最终发现了什么」+ 论文 Claims 边界 |

**Phase 6 核心判定（摘要）：**

| 项 | 结论 |
|----|------|
| Research Question | 冻结配方下 PreAct 能否降低 test error？ |
| Hypothesis | **Not Supported**（PreAct 9.47% > baseline 8.41%） |
| 最强正向结论 | 残差有效；完整 PreAct 非 drop-in 升级；两段 BN+ReLU 重要性不等 |
| 待验证项 | Ablation A 略优于 baseline（−0.09 pp，单 seed）；Git provenance |

---

## 7. 文档与产物索引

### 7.1 必读文档

| 文档 | 路径 | 何时读 |
|------|------|--------|
| **本文件** | `README.md` | 首次进入项目 |
| **研究分析（Phase 6）** | `paper/analysis.md` | 理解实验机制、写 Discussion、查 Evidence Map |
| **研究结论（Phase 6）** | `paper/conclusion.md` | 写论文前查 Claims 边界、核心数字、Figure/Table 索引 |
| 五模型速查 | `Models.md` | 查 block 结构 |
| 实验约定 | `experiments/README.md` | 追加实验前 |
| 论文材料说明 | `paper/README.md` | 写论文/汇报前 |
| 研究目录说明 | `research/README.md` | 查审计文档分工 |

### 7.2 权威数字与图

| 类型 | 权威路径 | 展示副本 |
|------|---------|---------|
| Phase 2 指标 | `experiments/results/phase2/summary.json` | `paper/metrics/phase2_summary.json` |
| Phase 4 对比 | `experiments/results/phase4/comparison.json` | `paper/metrics/phase4_comparison.json` |
| Phase 5 汇总 | `experiments/results/phase5/summary.json` | `paper/metrics/phase5_summary.json` |
| Phase 2 图 | `experiments/results/phase2/figures/` | `paper/figures/phase2_*.png` |
| Phase 4 图 | `experiments/results/phase4/figures/` | `paper/figures/phase4_*.png` |
| Phase 5 图 | `experiments/results/phase5/figures/` | `paper/figures/phase5_*.png` |
| Phase 6 分析 | `paper/analysis.md`（引用上述权威源） | 同左（人工维护，非 sync） |
| Phase 6 结论 | `paper/conclusion.md`（引用上述权威源） | 同左（人工维护，非 sync） |

### 7.3 脚本清单

| 脚本 | 作用 |
|------|------|
| `build_phase2_results.py` | runs → results/phase2 |
| `build_phase4_comparison.py` | Phase 2+3 → results/phase4 |
| `build_phase5_summary.py` | 五模型 → results/phase5 |
| `sync_paper.py` | results → paper/ |
| `remote_check.sh` | 远程环境检查（预留） |

---

## 8. 结论边界

### 8.1 本 DEMO 能支持的结论

1. **残差有效：** 在相同 depth-20、相同 CIFAR-10 配方下，ResNet-20-A (8.41%) 优于 Plain-20 (9.68%)。
2. **数值可比：** ResNet-20-A 与论文 Table 6 (8.75%) 差 0.34 pp，在 ±1.0 pp 容差内。
3. **PreAct 非 drop-in 升级：** 完整 PreAct (9.47%) 比后激活 ResNet-20-A 差 1.06 pp。
4. **消融信息：** 去掉第一段 BN+ReLU（Ablation A）显著优于完整 PreAct（−1.15 pp）；去掉第二段 BN（Ablation B）导致 NaN。
5. **BN 重要性不等：** 第一段 PreAct 可缺；第二段 BN 对可训性近乎必需（在 lr=0.1 下）。

### 8.2 本 DEMO 不能支持的结论

1. PreAct 在 CIFAR 或 ImageNet 上**普遍**更差或更好（深度、配方、种子不同）。
2. Ablation A **稳健超越** ResNet-20-A（Δ 仅 0.09 pp，单 seed，噪声约 ±0.3–0.5 pp）。
3. 把 Ablation B 的 ~90% error 当作公平精度基线。
4. 完整 Table 6（32/44/56 depth）或 Option B 的结论。
5. 多 seed 统计显著性（未做）。
6. PreAct 差的原因已严格因果证明（仅有训练误差与结构一致性证据）。

### 8.3 若写论文 / 报告，建议表述

> 在 CIFAR-10 ResNet-20（Option A）、160 epoch、单 seed 的设置下，完整 Pre-activation 单元未改善后激活基线；消融表明第一段 pre-activation 可能有害，而第二段 batch normalization 对训练稳定性至关重要。该结论限于浅层网络与固定优化配方，不能推广到更深架构。

**完整 Claims 清单与边界：** 见 `paper/conclusion.md` §12 **Paper-Ready Claims**（`Claims We Can Make` / `Claims We Should Avoid`）。  
**机制分析与证据追溯：** 见 `paper/analysis.md`（含 Evidence Map 与各节 Source 标注）。

---

## 9. 优化路线图

当前 DEMO 已具备 **四层分离 + phase 化工作流 + 自动化汇总 + 失败 run 记录**，优于多数「单脚本 + checkpoint 堆」项目。以下是向**可发表、可协作、可长期维护**方向的具体优化建议。

### 9.1 🔴 高优先级 — 科学可信度

| # | 缺口 | 现状 | 建议实现 |
|---|------|------|---------|
| H1 | **多种子** | 全部单 seed | 对 ResNet-20-A 和 Ablation A 各跑 seed {0,1,2}；`results/` 报告 mean±std；launch 脚本加 `--seed` |
| H2 | **Manifest 不全** | 仅 Phase 2 有 manifest | 新建 `manifests/phase3_preact.json`、`manifests/phase5_ablation.json`；含 canonical + failed run |
| H3 | **Run 快照** | YAML 在 configs/，run 目录无快照 | launch 脚本每次复制 effective yaml + `git rev-parse HEAD` 到 `runs/.../provenance.json` |
| H4 | **失败 run 标准化** | Ablation B 有 status.json 但未进 manifest | manifest 统一 schema：`status`, `failure_mode`, `first_nan_epoch`, `comparable_accuracy: false` |

**建议 manifest schema 扩展：**

```json
{
  "schema_version": 2,
  "phase": "phase5",
  "frozen": false,
  "canonical_runs": [
    {
      "run_id": "abl_a_18_59_29",
      "status": "completed",
      "artifact_root": "experiments/runs/phase5/ablation_a/.../18_59_29",
      "best_test_error_pct": 8.32,
      "seed": null,
      "provenance": "experiments/configs/phase5/ablation_a.yaml"
    },
    {
      "run_id": "abl_b_20_08_23",
      "status": "failed",
      "failure_mode": "numerical_instability",
      "comparable_accuracy": false,
      "artifact_root": "experiments/runs/phase5/ablation_b/.../20_08_23"
    }
  ]
}
```

### 9.2 🟡 中优先级 — 可复现性

| # | 缺口 | 建议实现 |
|---|------|---------|
| M1 | 环境未 pin | 添加 `environment.lock.yml`（`conda env export --no-builds`） |
| M2 | 无一键复现 | 添加 `reproduce.ps1`：data 检查 → unittest → phase2 subset → build results → sync paper |
| M3 | Phase 3 设计文档重复 | 合并 `research/phase3-improvement-design/` 与 `phase3-improvement-research-design/`，保留一份，另一份标 `DEPRECATED` |
| M4 | Phase 4 无 manifest | 添加 `manifests/phase4_comparison.json` 指向三个 canonical runs |
| M5 | launch 脚本硬编码路径 | 提取 `$ProjectRoot` 变量或使用相对路径 + 环境变量 |
| M6 | train.py 未写 seed | 添加 `--seed` 并 `torch.manual_seed` / `np.random.seed` / `random.seed` |

### 9.3 🟢 低优先级 — 协作与长期维护

| # | 缺口 | 建议实现 |
|---|------|---------|
| L1 | 无 CHANGELOG | 添加 `experiments/CHANGELOG.md`，每次 run 追加一行 |
| L2 | 无 CI | GitHub Actions：`unittest` + `build_phase*.py` dry-run |
| L3 | checkpoint 无哈希 | manifest 记录 `best.pt` sha256 |
| L4 | 大数据无获取说明 | README 或 `data/README.md` 注明 CIFAR 下载方式 + checkpoint 网盘链接 |
| L5 | 无 CONTRIBUTING | 添加贡献指南：新 phase 命名、manifest 规则、禁止覆盖 phase2 |
| L6 | code 下 TensorBoard runs 残留 | 定期清理或 `.gitignore` 已覆盖（当前已做） |
| L7 | 跨 phase 对比目录空 | `experiments/results/comparisons/` 放 phase2–5 汇总 mega-table |

### 9.4 ✅ 已经做得好的（保持）

- Phase 化目录（configs / launch / runs / results / manifests）
- Raw 与 processed 分离 + 清晰的 `.gitignore`
- `build_phase*.py` + `sync_paper.py` 自动化
- `research/` 完整审计链（paper_summary → reproduction_report → innovation_report）
- 失败实验有 `status.json` 而非静默丢弃
- `Models.md` 实验设计速查
- Phase 2 基线 manifest 冻结机制
- Phase 4 纯汇总不重复训练（节省算力）
- Phase 6 Evidence Base（`analysis.md` + `conclusion.md`）含 Evidence Map 与 Claims 边界

### 9.5 建议的「理想 DEMO」目标态

```text
README.md（本文件，自描述）
    │
    ├── manifests/          每个 phase 有 json，含 canonical + failed
    ├── configs/            每个实验有 yaml
    ├── launch/             相对路径 + seed + provenance 快照
    ├── runs/               每个 run 含 metrics.json + provenance.json
    ├── results/            每个 phase 有 summary.json + summary.md
    ├── scripts/            build + sync + reproduce 一键
    ├── research/           每 phase 一份设计 + 一份结论
    ├── paper/              figures/tables/metrics 自动 sync；analysis/conclusion 人工维护
    ├── tests/              unittest + 汇总脚本 smoke test
    └── CHANGELOG.md        按日期记录每次 run
```

---

## 10. 经验总结

### 10.1 环境与工程

| 问题 | 处理 | 教训 |
|------|------|------|
| Windows `uv` 装 CUDA PyTorch 文件锁 | 改用 conda `deeplearn` | 优先复用本机已验证环境 |
| CIFAR 下载 0-byte | 手动解压到 `data/` | 大下载后校验文件大小 |
| PS `NativeCommandError`（tqdm stderr） | `$ErrorActionPreference = 'Continue'` | Windows launch 脚本要容忍 stderr 进度条 |
| 产物散落在 `code/` | junction 指向 `experiments/runs/` | **项目第一天**就定 raw 产物根目录 |
| 同模型多个 run 文件夹 | manifest 登记 canonical | 不要靠 mtime 猜哪个是正式 run |

### 10.2 实验设计

| 原则 | 说明 |
|------|------|
| **先冻结基线再改** | Phase 2 manifest 冻结；Phase 3–5 只追加 |
| **假设要 falsifiable** | 设定阈值（如 ≥0.50 pp），避免事后解释 |
| **消融 > 整包改进** | PreAct 整体更差，但 A/B 消融揭示了 BN 的关键性 |
| **失败也是结果** | Ablation B NaN → 第二段 BN 对稳定性必需 |
| **浅层 ≠ 深层** | PreAct 在 ResNet-100+ 有效；depth-20 可能 underfit |
| **小 delta 不宣称超越** | 0.09 pp 在单 seed 噪声内；需 ≥3 seed |
| **Phase 4 不重复训练** | 只读汇总节省算力且避免 protocol drift |

### 10.3 文档与协作

| 原则 | 说明 |
|------|------|
| manifest 是指针，不是数据库 | 存 canonical 路径 + 主指标；细节在 results/ |
| research/ = 为什么；experiments/ = 是什么 | 叙述与数字分离 |
| paper/figures\|tables\|metrics 从 results 复制 | 跑 `sync_paper.py` |
| paper/analysis\|conclusion 人工撰写 | Phase 6 Evidence Base；实验数字变更时需手动更新 |
| 每 phase 结束写 json + md | 人读 md，脚本读 json |
| README 要自描述 | 让 Cursor 无上下文也能接手（即本文件目标） |

---

## 11. 项目时间线

| 日期 | 事件 | 产物 |
|------|------|------|
| 2026-09-02 | 环境配置、代码审计、CIFAR 准备 | `research/.../environment_report.md` |
| 2026-09-02 | 启动完整 9 模型 suite（后被 subset 替代） | smoke runs |
| 2026-09-03 08:49 | Plain-20 训练完成（9.68%） | `runs/phase2/.../08_49_22/` |
| 2026-09-03 09:53 | ResNet-20-A 训练完成（8.41%） | `runs/phase2/.../09_53_41/` |
| 2026-09-03 | Phase 2 manifest 冻结 + 出图 | `manifests/phase2_baseline.json` |
| 2026-09-03 16:23 | PreAct 正式 run 完成（9.47%） | `runs/phase3/.../16_23_57/` |
| 2026-09-03 | Phase 4 只读对比汇总 | `results/phase4/` |
| 2026-09-03 18:59 | Ablation A 完成（8.32%） | `runs/phase5/ablation_a/.../18_59_29/` |
| 2026-09-03 20:08 | Ablation B 失败（NaN @ epoch 0） | `runs/phase5/ablation_b/.../20_08_23/status.json` |
| 2026-09-03 | Phase 5 最终汇总 | `results/phase5/summary.md` |
| 2026-09-03 | **Phase 6 研究分析与结论** | **`paper/analysis.md`, `paper/conclusion.md`** |

---

## 12. 外部资源

| 资源 | 链接 / 位置 |
|------|-----------|
| 原论文 arXiv | https://arxiv.org/abs/1512.03385 |
| PreAct 论文 arXiv | https://arxiv.org/abs/1603.05027 |
| 参考 GitHub | https://github.com/samitmohan/deep-residual-learning-pytorch |
| 本地论文 PDF | `code/deep-residual-learning-pytorch-master/deep-residual-learning.pdf` |
| Zotero 精读笔记 | 独立 Obsidian 知识库（不在本仓库） |
| CIFAR-10 | https://www.cs.toronto.edu/~kriz/cifar.html |

---

## 13. 附录：快速问答（FAQ）

**Q: 哪个是 ResNet-20-A 的正式 run？**  
A: `experiments/runs/phase2/baseline/CifarResNet-20-R-A/09_03_2026/09_53_41/`，见 `manifests/phase2_baseline.json`。

**Q: 写论文插图从哪拿？**  
A: 先用 `experiments/results/` 的图；或跑 `sync_paper.py` 后从 `paper/figures/` 拿。

**Q: 能不能覆盖 Phase 2 的 run？**  
A: **不能。** Phase 2 已冻结。新实验从 Phase 3+ 追加。

**Q: Ablation B 的结果能写进表格吗？**  
A: 只能作为「失败案例」记录，不能参与精度排名。

**Q: 如何追加 depth-32/44/56？**  
A: 修改 `run_subset_20.ps1` 或新建 launch 脚本，输出到 `runs/phase2/` 新目录，更新 manifest。

**Q: Cursor 接手时应先读什么？**  
A: 本 README → `Models.md` → `paper/conclusion.md`（全局结论）→ 对应 phase 的 `results/phaseN/summary.md` → 需机制细节时读 `paper/analysis.md` → 实验前设计/审计进 `research/`。

**Q: Phase 6 的 analysis.md 和 conclusion.md 有什么区别？**  
A: `analysis.md` 回答「**为什么会出现这些结果**」（机制、消融解读、Observed/Inferred/Speculative 分层）；`conclusion.md` 回答「**我们最终发现了什么**」（Main Findings、核心表、Hypothesis 判定、Paper-Ready Claims）。写 Phase 7 论文时，以 `conclusion.md` 为入口，`analysis.md` 供 Discussion 展开。

**Q: 跑 sync_paper.py 会覆盖 analysis.md / conclusion.md 吗？**  
A: **不会。** `sync_paper.py` 只同步 `figures/`、`tables/`、`metrics/`；Phase 6 两份 Markdown 需人工维护。

**Q: 准备写正式论文（Phase 7）从哪开始？**  
A: `paper/conclusion.md` §Main Findings + §Paper-Ready Claims → 引用 `paper/figures/` 与 `paper/tables/` → Discussion 参考 `paper/analysis.md` §Mechanism Analysis 与 §Research Insights。

---

*最后更新：2026-09-03 · Phase 0–6 已闭环（depth-20 基线 + PreAct 消融 + Evidence Base）；Phase 7 正式写论文待开始。*
