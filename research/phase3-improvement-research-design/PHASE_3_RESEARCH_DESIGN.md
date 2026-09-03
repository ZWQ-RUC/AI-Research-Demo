# Phase 3 Research Design — Improvement Research Design

**Status:** design only (no code changes, no training)  
**Date:** 2026-09-03  
**Baseline (frozen):** Plain-20 = **9.68%** test error; ResNet-20-A = **8.41%** test error  
**Paper:** Deep Residual Learning for Image Recognition (He et al., 2015)  
**Code:** `code/deep-residual-learning-pytorch-master/`  
**Authority:** `experiments/manifests/phase2_baseline.json`

---

## Step 1 — Baseline Diagnosis（结合当前实现）

### 1.1 网络结构（`CifarResNet`）

当前 ResNet-20-A 对应 `n=20`，`k=(20-2)//6=3`，结构为：

| 段 | 实现 | 特征图 / 通道 |
|----|------|----------------|
| Stem | `Conv3×3 → BN → ReLU` | 32×32 / 16 |
| Stage 1 | `k=3` 个 `BasicBlock`（无下采样） | 32×32 / 16 |
| Stage 2 | 1 个 downsample block + `(k-1)` 个 block | 16×16 / 32 |
| Stage 3 | 1 个 downsample block + `(k-1)` 个 block | 8×8 / 64 |
| Head | `AdaptiveAvgPool → Linear(64→10)` | logits |

证据：`models.py` `CifarResNet.__init__`。参数量实测 **270,410（~0.27M）**，与论文 Table 6 一致。

### 1.2 Residual block（`BasicBlock`）

残差分支固定为：

```text
Conv3×3 → BN → ReLU → Conv3×3 → BN
```

然后与 shortcut 相加，**相加后再 `ReLU`**（post-activation 形式）。

含义：

- 恒等捷径上的信号在相加后仍会被 ReLU 截断负值；
- BN 只出现在残差支路上，shortcut 本身无 BN（Option A 时尤其明显）；
- 这是 2015 原文式残差单元，不是 2016 Identity Mappings 的 pre-activation 单元。

### 1.3 Shortcut Option A（代码行为）

当 `needs_projection` 且 `option=='A'`：

1. 空间下采样：`F.max_pool2d(x, 1, 2)`（stride-2 pooling，非可学习投影）；
2. 通道扩展：对新增通道 **零填充** `torch.zeros(...)` 再 `cat`；
3. 旧通道恒等传递，新通道 shortcut 贡献恒为 0。

证据：`BasicBlock.forward` Option A 分支。  
论文意图：零参数捷径；代价是**维度匹配处没有可学习对齐**，新通道完全依赖残差支路从零学起。

### 1.4 Feature representation

- 全网仅用 **3×3 卷积** 堆叠局部空间模式；
- 末端 **GAP + 线性分类器**，无多尺度融合、无显式全局上下文模块；
- CIFAR 输入 32×32，最深层空间分辨率为 8×8，表征容量有限但任务匹配。

### 1.5 Channel interaction

- 通道混合仅来自卷积核的跨通道求和；
- **没有**通道注意力 / 门控 / 重标定；
- Option A 零填充使“新通道”在 shortcut 上永久缺失，通道角色不对称。

### 1.6 Spatial information

- 下采样仅靠 stride-2 卷积（残差支路）+ Option A 的 max-pool shortcut；
- 无空洞卷积、无显式空间注意力；
- 对 CIFAR 小图通常够用，但难区分依赖精细空间布局的类（如 bird/cat/dog）。

### 1.7 Optimization（`train.py`）

| 项 | 当前值 |
|----|--------|
| 优化器 | SGD momentum 0.9, wd 1e-4 |
| LR | 0.1，MultiStep 于 32k / 48k iteration ÷10 |
| Batch / Epochs | 128 / 160 |
| 增强 | pad4+crop, hflip, Normalize |
| Seed | **未固定** |
| Checkpoint | 每 4 epoch 用 **测试集** 选 `best.pt` |

本机单次 run：ResNet-20-A 最佳测试误差 **8.41%**（约 epoch 132），最终训练误差 **0.72%**，末次评估测试约 **8.58%** → **train–test 差距约 7.8 pp**。

### 1.8 Parameter efficiency / compute

- ~0.27M 参数，RTX 3050 4GB 上约 **1 小时 / 160 epoch**，显存占用约 1.6GB；
- 改进空间必须优先考虑：**低额外参数、低额外算力、可在 1–3 次全量 run 内验证**。

### 1.9 诊断小结（事实层）

1. Baseline 已复现成功，残差相对 Plain 有 **1.27 pp** 优势。  
2. 相对论文 8.75%，我们略好（单次 run，无多种子）。  
3. 结构仍是 2015 post-activation + Option A 零填充捷径。  
4. 存在明显 **拟合训练 / 泛化测试** 间隙。  
5. 通道侧几乎无可自适应重加权机制；捷径在扩通道处信息为零。

---

## Step 2 — Possible Limitations（可实验验证）

### L1 — Post-activation 残差单元阻碍“干净恒等”

| 项 | 内容 |
|----|------|
| **Problem** | 相加后强制 ReLU，且 BN 只在残差支路，恒等映射并非严格 `y=x+F(x)` 后的自由传播。 |
| **Evidence** | `BasicBlock.forward` 末尾 `return F.relu(res)`；He et al. 后续 Identity Mappings 工作正针对此。 |
| **Why it may matter** | 即使深度只有 20，优化几何与特征传播仍受单元形式影响；可能留下可复现的小幅误差改进。 |
| **How to test** | 保持深度/Option A/训练配方不变，仅改 block 为 pre-activation；对比 test error 与训练曲线。 |

### L2 — Option A 零填充捷径在扩通道处“半残差”

| 项 | 内容 |
|----|------|
| **Problem** | 下采样扩通道时，新通道 shortcut=0，不是完整恒等。 |
| **Evidence** | Option A 的 `torch.zeros` 填充；论文也区分 A/B。 |
| **Why it may matter** | Stage 边界（16→32、32→64）是表征突变点；对齐方式可能影响误差。 |
| **How to test** | 同设定下 ResNet-20-B（1×1 projection）vs A；或只在 downsample 使用 B。 |

### L3 — 通道表征缺乏自适应重标定

| 项 | 内容 |
|----|------|
| **Problem** | 所有通道在残差相加后被同等对待，无任务相关的通道门控。 |
| **Evidence** | 代码中无 SE/ECA 等；仅卷积隐式混通道。 |
| **Why it may matter** | CIFAR 类间差异常体现为“哪些纹理/颜色通道有用”；轻量重标定或可降错。 |
| **How to test** | 在每个 BasicBlock 残差支路末端插入轻量通道模块，控制 reduction，对比误差与参数量。 |

### L4 — 泛化间隙大（训练几乎记牢，测试仍有 ~8% 错）

| 项 | 内容 |
|----|------|
| **Problem** | 训练误差 0.72% vs 最佳测试 8.41%，主要瓶颈更像泛化而非欠拟合。 |
| **Evidence** | Phase 2 曲线 `.npy`；Plain 同样 train≪test。 |
| **Why it may matter** | 纯加宽/加深在 4GB 上贵，且可能继续过拟合；正则/增强可能更对症。 |
| **How to test** | 冻结结构，只改增强/损失（如 Cutout、Mixup、label smoothing），看 test error 与 train–test gap。 |

### L5 — 评估协议与随机性使“小改进”难判定

| 项 | 内容 |
|----|------|
| **Problem** | 无 seed；用测试集选 best checkpoint，单次 run 方差可能达 ±0.3–0.5 pp。 |
| **Evidence** | `train.py` 无 seed；`best` 由 test 驱动；论文亦未固定种子。 |
| **Why it may matter** | 若不控，任何“改进”都可能是噪声。 |
| **How to test** | Phase 4 起固定 ≥2–3 个 seed，报告 mean±std；主结论不用单点。 |

---

## Step 3 — Improvement Candidates（精选，非堆砌）

针对 L1–L4，提出 **5 个** 候选（SE 仅为其中之一）：

| ID | Method | 主要针对 |
|----|--------|----------|
| C1 | **Pre-activation BasicBlock**（BN→ReLU→Conv→BN→ReLU→Conv，相加后不再 ReLU 或仅 stem/head 保留） | L1 |
| C2 | **Downsample Option B**（仅投影捷径，其余仍恒等） | L2 |
| C3 | **SE (Squeeze-and-Excitation)** 轻量通道重标定（reduction=16 或 8） | L3 |
| C4 | **Cutout**（训练增强，结构不动） | L4 |
| C5 | **Mixup**（训练插值，结构不动） | L4 |

不在此轮展开：大幅加宽/加深、重型 attention、NAS——在 3050 + 单机时间预算下可控性差。

---

## Step 4 — Candidate Evaluation

| Method | Problem Addressed | Theoretical Motivation | Implementation Difficulty | Extra Params | Extra Compute | Expected Benefit | Risk |
|--------|-------------------|------------------------|---------------------------|--------------|---------------|------------------|------|
| **C1 Pre-activation** | L1 残差单元形式 | 同系后续工作：更干净的恒等映射与优化 | 中（改 `BasicBlock` 前向顺序） | ≈0 | ≈0 | 小到中等（常 0.2–0.8 pp 量级，需实测） | 与 BN 统计/初始化交互；改动面在 block 内部 |
| **C2 Option B @ downsample** | L2 捷径对齐 | 论文原生对比 A/B | 低（已有 Option B 代码） | 很少（两个 1×1） | 很少 | 不定；仓库 ResNet-20-B≈8.62%，未必优于我们的 8.41% | 可能无增益；故事偏“论文复现扩展”而非新机制 |
| **C3 SE** | L3 通道交互 | 通道注意力重标定 | 低–中 | 低（~数千–1万级） | 低 | 中等可能 | CIFAR-20 上增益可能被噪声淹没；易被看成“套模块” |
| **C4 Cutout** | L4 泛化间隙 | 遮挡正则，逼迫分布式表征 | 低（只改 transform） | 0 | ≈0 | 中等可能（CIFAR 上常见） | 超参敏感（孔洞大小）；非结构创新 |
| **C5 Mixup** | L4 泛化间隙 | 邻域风险最小化 | 低–中（改 loss/采样） | 0 | 很低 | 中等可能 | 改变有效标签分布；与现有 CE 训练曲线不可直接比“同损失” |

---

## Step 5 — Selection（首个 Improvement）

### 选定：**C1 — Pre-activation Residual Unit（Identity-Mappings 风格）**

**不是默认 SE。** SE 保留为 Phase 5 或下一轮候选。

#### 选定理由

| 准则 | 评估 |
|------|------|
| Scientific motivation | 直接继承 ResNet 研究谱系；针对我们代码里可定位的 post-add ReLU / BN 布局 |
| Feasibility | 只动 `BasicBlock`（CIFAR 路径）；不改数据管道即可做第一刀 |
| Experimental controllability | 冻结：深度 20、Option A、数据、优化器、epoch；**单因子** = block 公式 |
| Computational cost | 参数与算力基本不变，3050 可承受多次对照 |
| Meaningful ablation | 可拆：是否 pre-act、相加后是否 ReLU、BN 是否在 shortcut 上（后续 Phase 5） |
| Research story | “在已复现的 ResNet-20-A 上，更有利于恒等映射的残差单元能否降低 CIFAR-10 测试错误率？”完整、可证伪 |

#### 未首选其他方法的原因（简要）

- **C2 Option B：** 仓库历史点已暗示未必优于 A；故事偏复现扩展。  
- **C3 SE：** 动机成立，但更像通用插件；留作对照/第二改进更合适。  
- **C4/C5：** 对 L4 很对症，但会改变训练契约，和“结构改进”叙事混杂；建议 Phase 4 作为独立对照轴。

---

## Step 6 — Research Hypothesis

**Research Question：**  
在冻结 CIFAR-10 数据与 He et al. §4.2 训练配方的前提下，将 ResNet-20-A 的 post-activation `BasicBlock` 替换为 pre-activation 残差单元，能否降低测试错误率？

**Hypothesis：**  
Pre-activation 使残差支路与恒等捷径的组合更接近 \(y = x + F(x)\) 的优化友好形式，从而在相同参数量与 Option A 捷径下，获得 **严格优于** 当前 ResNet-20-A baseline（8.41%）的测试错误率。

**Proposed Method：**  
`PreActBasicBlock`：

```text
out = BN → ReLU → Conv3×3 → BN → ReLU → Conv3×3
y = shortcut(x) + out    # Option A 规则保持不变
# 块内相加后不再 ReLU（ReLU 移到下一层入口 / 残差支路开头）
```

Stem / ClassifierHead 保持与 baseline 兼容的最小改动（stem 可保留 Conv-BN-ReLU，避免破坏第一层）。

**Expected Mechanism：**  
- 梯度经恒等路径传播时少一次强制非线性；  
- BN 标准化更贴近残差函数输入；  
- 不增加通道注意力或额外投影，效应归因于单元重排。

**Evaluation：**

| 项 | 设定 |
|----|------|
| 主指标 | best test error (%)（与 Phase 2 相同记录方式） |
| 对照 | 冻结 Phase 2 ResNet-20-A（8.41%）；同机再跑 1× post-act 对照（建议固定 seed）更佳 |
| 成功阈值（预设） | 主 run 相对 8.41% **改善 ≥ 0.30 pp**（即 ≤ 8.11%） |
| 次要 | 最终 train error、train–test gap、参数量、单 epoch 耗时 |
| 预算 | 每配置 ≤ 160 epoch；优先 1 seed 探路，确认后 2–3 seed |

**Falsification Condition（假设不成立的判据）：**

出现以下**任一**情况，则判定本假设在本项目设定下**不成立或未获支持**：

1. Pre-act 最佳测试错误率 **≥ 8.41%**（无改进或变差）；或  
2. 改进幅度 **&lt; 0.30 pp**，且在额外 1–2 个 seed 上均值仍未达到阈值；或  
3. 测试略好但训练崩溃/不稳定（loss NaN、误差不下降），无法形成可靠结论；或  
4. 参数量或每 epoch 时间异常增加（说明实现偏离“重排单元”的设定）。

> 明确：若 Pre-act ≈ 8.3%–8.4% 且多种子无显著优势，应如实报告 **negative / null result**，并转向 C4（Cutout）或 C3（SE）作为下一假设——否定结果仍是有效研究产出。

---

## Step 7 — Implementation Plan（确认后才执行）

### 7.1 改哪些文件 / 类

| 动作 | 位置 |
|------|------|
| 新增或扩展 | `code/deep-residual-learning-pytorch-master/models.py` |
| 新增类 | `PreActBasicBlock`（推荐）或给 `BasicBlock` 增加 `preact: bool` 开关 |
| 组装 | `CifarResNet` 增加参数如 `block_type='post'|'pre'` / `preact=False` |
| 训练入口 | `train.py` 增加 CLI 标志，例如 `--preact`（默认关闭） |

### 7.2 模块插入位置

- **仅替换** Stage 1–3 的残差块为 `PreActBasicBlock`；  
- Option A/B 逻辑 **复用** 现有 downsample / zero-pad / 1×1 投影代码路径；  
- `ClassifierHead` 不变；stem 建议保持 `Conv-BN-ReLU`（与常见 PreAct ResNet CIFAR 实现一致）。

### 7.3 明确保持不变（保护 Phase 2）

- **不修改** Phase 2 已有产物路径与文件；  
- 默认 CLI **不加 `--preact`** 时，数值行为与当前 ResNet-20-A **一致**；  
- 数据、`SGD`、LR schedule、epoch、增强默认值不变；  
- 新 run 写入 `experiments/runs/phase3/preact_resnet20a/<run_id>/`，**禁止**写入 `experiments/runs/phase2/baseline/CifarResNet-20-R-A/` 以免污染 baseline。

### 7.4 新增配置

```text
experiments/configs/phase3/preact_resnet20a.yaml
```

建议字段：`phase`, `idea_id: preact_resnet20a`, `model.preact: true`, `option: A`, `depth: 20`, 完整训练超参副本，`baseline_ref: experiments/manifests/phase2_baseline.json`。

### 7.5 新增实验脚本（确认后）

| 脚本 | 作用 |
|------|------|
| `experiments/scripts/run_phase3_preact.ps1` | 调用 `train.py 20 -r -o A --preact`，日志/曲线落到 `runs/phase3/...` |
| `experiments/scripts/export_run_metrics.py` | 从 `.npy` 写 `metrics.json` |
| （可选）包装 `train.py` 的 `--outdir` | 若暂不改训练脚本落盘路径，可用 junction/包装层把 `models/` 重定向到 `runs/phase3/...`（工程项，确认后设计） |

### 7.6 Phase 4 / 5 预留（本步不做）

- Phase 4：Pre-act vs Post-act，同 seed×3，受控对比表；  
- Phase 5：相加后 ReLU 有无、仅深层 stage 使用 pre-act、与 Cutout/SE 正交消融。

---

## Deliverables & Placement

| 文件 | 路径 |
|------|------|
| 本设计文档 | `research/phase3-improvement-research-design/PHASE_3_RESEARCH_DESIGN.md` |
| （后续）配置 | `experiments/configs/phase3/preact_resnet20a.yaml` |
| （后续）raw runs | `experiments/runs/phase3/preact_resnet20a/` |
| （后续）processed | `experiments/results/phase3/` |

---

## Decision Gate

**请确认：**

1. 是否同意首个 Improvement = **Pre-activation ResNet-20-A**；  
2. 成功阈值 **≥0.30 pp** 是否可接受（可改为 0.20 / 0.50）；  
3. 确认后是否进入 **实现 + 单次探路训练**（仍先不自动跑满多种子）。

在确认前：**不修改代码、不启动训练。**
