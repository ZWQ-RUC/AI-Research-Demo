# Research OS

> **一句话定义：** Research OS 是一个以 **证据链、阶段门禁、标准化 artifacts** 与 **AI agent orchestration** 为核心的 AI-native research workflow。  
> 它把科研从 **Tool Chain（堆工具）** 升级为 **Research Operating System（可追踪、可验证、可复用的科研生产系统）**。

本 README 是 **可重复执行的 SOP + 本 Demo 经验固化文档**。  
核心问题：

> 如果下一次拿到另一篇 AI 论文，应如何用 Research OS 从零走到论文成稿？

**本文件定位：** 不是项目介绍、工具清单、博客或实验流水账。  
**配套细节：** Phase 细节、schema、Overleaf 步骤见 `paper/`、`paper/latex/`、`canonical/SCHEMA.md` 等；本文件不重复粘贴长表。

**本仓库 Demo 实际停泊点（以 artifact 为准，非猜测）：**  
手稿与 pipeline 已达 `paper/FINAL_STATUS.md` → **`READY_FOR_FINAL_PDF_QA`**。  
`state.json` / `phase_registry.json` 可能滞后于手稿——**进度以实际产物 + Human 确认为准**，并应回写状态文件（本 README 不代写状态）。

---

## 1. Purpose

### Research OS 解决什么问题？

不是“用更多 AI 工具”，而是让科研过程具备：

| 支柱 | 含义 |
|------|------|
| **Phase-driven** | 阶段清晰；可 inherited / waived / blocked，且有记录 |
| **Evidence-driven** | 结论强度 ≤ 证据；Paper 消费 evidence，不创造 evidence |
| **Artifact-based state** | 进度看 manifests / results / canonical / sections，不看聊天记忆 |
| **Human gates** | RQ、假设、解释、投稿由人裁定 |
| **Reusable SOP** | 下一篇论文复制流程，而不是重新发明流程 |
| **Automation without overreach** | AI 可检查与执行；不能自动裁定科学结论 |

**核心原则：**

> Automation prepares evidence. Human decides science.  
> Research OS 的目标不是让 AI 替代科研判断，而是让科研判断发生在可追踪、可验证、可复用的生产系统中。

---

## 2. Core Research Loop

```text
Literature Discovery
  → Literature Management
  → AI-assisted Reading
  → Code / Dataset Discovery
  → Reproduction
  → Baseline
  → Research Question
  → Hypothesis
  → Experiment Design
  → Experiment
  → Evidence
  → Analysis
  → Paper
  → PDF QA
  → Publish
```

### 阶段灵活性（必须可审计）

Research OS **不要求**每个项目机械跑完所有阶段。允许：

| 状态 | 含义 |
|------|------|
| `inherited` / `imported` | 历史成果认领并登记 |
| `waived` | 明确豁免（须 decision 记录） |
| `skipped` / `repeated` | 跳过或重做 |
| `blocked` | 等人 / 等证据 |

**每个跳过/豁免必须有记录**（本仓库示例：`decisions/D1-D5_*.md`、`phase_registry.json`）。

---

## 3. Research OS Phase Model

| Phase | Goal | Input | Output / 核心 artifact | Human Gate | 自动化边界 |
|------:|------|-------|------------------------|------------|------------|
| **0** Intake / State Detect | 判断项目做到哪 | 仓库扫描 | `state.json`、`log.md`、handoff | 确认项目身份 | 可自动探测；人确认映射 |
| **1** Research Contract | RQ / Hypothesis / 证伪标准 | 想法、文献动机 | `contract/research-question-card.md` | **G1** | 可起草；**人批准** |
| **2** Literature Ops | 找/筛/核验文献 | RQ | candidates、vault 状态 | **G2**（纳入） | 可检索；人不接受虚构 cite |
| **3** Knowledge Base | 精读与知识沉淀 | 文献身份 | Analytical notes / Knowledge | G2 相关 | 可辅助；证据链仍要 Note/Fulltext |
| **4** Reproduction | 复现 baseline | 论文+代码+数据 | runs、metrics、reproduction status | 预算/环境 | 可跑训；人定容差与判定 |
| **5** Experiment | 受控改进/消融 | RQ+Hypothesis+baseline | configs、manifests、results、failures | **G3** | 可执行；人定设计与是否重训 |
| **6** Evidence / Visuals | 图/表/证据打包 | results | figures、pointers、analysis 素材 | **G5**（图语义，可选） | 可出图；人定图是否误导 |
| **7** Paper Production | 证据→手稿→QA | freeze + canonical | `paper/latex/`、audits、`FINAL_STATUS.md` | **G4** 科学结论；**G6** 投稿前 | 可生成 macros/表/校验；人定 claim |
| **8** Finalize / Publish | 终稿/发布 | PDF QA 通过稿 | 投稿包、发布物 | **G6/G7** | 可打包；人定发布 |

### 进入 / 完成（摘要）

- **进入下一 Phase：** 上一 Phase 完成条件满足，或已登记 inherited/waived。  
- **完成：** 见 §4（不是“命令跑通了”）。  
- **本 Demo：** Phase 2–3 = `waived_for_demo`；4–6 = inherited / inherited_partial；7 = 手稿至 **READY_FOR_FINAL_PDF_QA**；8 = 未开始。

---

## 4. Phase Completion Criteria

### Phase 0 — Intake

- [ ] 项目根与 `research_os/` 可识别  
- [ ] 现有实验/文献/代码指针已扫描  
- [ ] `state.json` / registry 已初始化或更新意图明确  

### Phase 1 — Research Contract

- [ ] RQ 可检验  
- [ ] Hypothesis 可证伪  
- [ ] 成功/失败标准写明  
- [ ] **G1 批准**  

### Phase 2 — Literature

- [ ] 候选文献有身份（DOI/arXiv/venue）或显式 waived  
- [ ] 不编造 citation  
- [ ] 纳入决定可追溯（或 waiver 记录）  

### Phase 3 — Knowledge

- [ ] 关键论文有可追溯笔记/全文链，或显式 waived  
- [ ] Knowledge 不替代原文证据  

### Phase 4 — Reproduction（不是“代码跑通”）

- [ ] environment recorded  
- [ ] dataset identified  
- [ ] baseline protocol recorded  
- [ ] run artifact exists  
- [ ] metrics recorded  
- [ ] reproduction tolerance defined  
- [ ] reproduction status **显式分类**（如 `partially_reproduced`）  

### Phase 5 — Experiment（不是“模型训完”）

- [ ] RQ linked  
- [ ] hypothesis registered  
- [ ] variables defined（改什么 / 冻什么）  
- [ ] control established  
- [ ] experiment artifact exists  
- [ ] result recorded  
- [ ] **failure states recorded**（失败也是证据）  

### Phase 6 — Evidence / Visuals

- [ ] 主结果有图/表或可指向 SoT  
- [ ] display copy 与 SoT 关系清楚  
- [ ] 分析素材不覆盖数字权威  

### Phase 7 — Paper（不是“main.tex 能编译”）

- [ ] evidence frozen  
- [ ] canonical data built  
- [ ] macros / tables generated（禁止手改 generated）  
- [ ] sections complete  
- [ ] claim / numerical / citation / structural audit 完成  
- [ ] 正文无 Engineering Scaffold  
- [ ] **Final PDF QA**（本机无 TeX → Overleaf；状态见 `FINAL_STATUS.md`）  
- [ ] Human Final Science Gate（投稿前）  

**正文写完 ≠ Phase 7 完成。** PDF QA + Human Gate 前不得宣称 PHASE 7 COMPLETE / READY_TO_SUBMIT。

### Phase 8 — Finalize / Publish

- [ ] 投稿/发布包齐  
- [ ] 作者信息等人定项完成  
- [ ] Human 发布决定  

---

## 5. Evidence Architecture

### 正确数据流

```text
Evidence (SoT)
  experiments/manifests/
  experiments/results/
        ↓
Canonical snapshot
  research_os/paper/canonical/data.json
        ↓
Generated paper assets
  research_os/paper/latex/macros.tex
  research_os/paper/latex/tables/*
        ↓
Manuscript
  research_os/paper/latex/sections/*.tex
  research_os/paper/latex/main.tex
        ↓
PDF (Overleaf / local TeX)
```

### 为什么这样设计？

| 原则 | 说明 |
|------|------|
| **Paper → Evidence 是错误方向** | 禁止用叙事改数字、改实验、补造结果 |
| **Paper 是 evidence consumer** | 手稿只消费 macros / tables / 已登记图 |
| **Canonical = 论文数字 SSoT** | 正文禁止随意手写 headline；冲突以 canonical ← SoT 为准 |
| **Generated 不可手改** | 改 SoT 后重跑 pipeline，不要在三处各改一遍 |

### 本仓库脚本（已验证过的入口）

```powershell
python research_os/paper/scripts/run_pipeline.py
python research_os/paper/scripts/verify_latex_structure.py
```

Schema：`research_os/paper/canonical/SCHEMA.md`  
工程：`research_os/paper/latex/README.md`、`OVERLEAF.md`

### 叙事素材 vs 数字权威

| 类型 | 示例 | 角色 |
|------|------|------|
| Evidence SoT | `experiments/manifests/`、`experiments/results/` | 只读权威 |
| Canonical | `research_os/paper/canonical/data.json` | 论文数字快照 |
| Generated | `macros.tex`、`tables/*` | LaTeX 出口 |
| Narrative material | 仓库根 `paper/analysis.md`、`paper/conclusion.md` | claim/讨论素材；**不覆盖** SoT 数字 |
| Process metadata | `state.json`、`phase_registry.json`、`decisions/`、`log.md` | 进度与门禁，非科学证据 |

---

## 6. Scientific Claim Discipline

写作与审计时强制分层：

| 层 | 含义 | 允许写法 |
|----|------|----------|
| **Observed** | 实验直接记录 | “attains X%”，“status = failed_…” |
| **Interpretation** | 合理但非唯一解释 | “suggests / consistent with” |
| **Hypothesis** | 未验证机制 | 明确标 Hypothesis / unproven |
| **Unsupported** | 证据不够 | 明确 “do not claim / not supported” |
| **Future Work** | 未执行实验 | 不得写成已完成 |

### 硬禁令

| 禁止 | 正确 |
|------|------|
| Future Work → Completed Experiment | 标 `[REQUIRES_EXPERIMENT]` / future |
| Single-run 小 delta → Validated improvement | “single-run gap；not validated” |
| Failed run → Accuracy result | `failed_numerical_instability`；不作 accuracy baseline |
| Scoped negative → Universal negative | “not supported under \<scope\>” ≠ “method is ineffective” |
| 手写 headline | 只用 macros |

Claim Audit 分类：`SUPPORTED` / `PARTIALLY SUPPORTED` / `OVERSTATED` / `UNSUPPORTED` + severity。  
**Audit 先出问题清单，再最小修订**——禁止边审边大规模重写。

---

## 7. Research Question → Hypothesis → Experiment

### 错误路径

```text
Baseline → 随便换模块 → 跑实验 → 挑好看的数写论文
```

### 正确路径

```text
Baseline (frozen)
  → Identify phenomenon
  → Research Question
  → Hypothesis (+ falsification)
  → Candidate intervention (服务于 RQ)
  → Controlled experiment
  → Result (+ failures)
  → Interpretation (分层)
```

**模块（SE / Attention / Transformer / PreAct…）不是默认答案。**  
干预必须回答已登记的 RQ；没有 RQ 的 “module shopping” 是反模式（§18）。

---

## 8. Experiment Design SOP（可复制模板）

新实验开工前填齐：

1. **Research Question**  
2. **Hypothesis**  
3. **Control**（冻结对照）  
4. **Treatment**  
5. **Variables held fixed**（数据、深度、shortcut、recipe…）  
6. **Variable changed**（唯一故意变量）  
7. **Metric**（定义与 checkpoint 规则）  
8. **Success / falsification criterion**  
9. **Compute budget**  
10. **Expected interpretation**（预先写清“支持/不支持分别意味着什么”）  
11. **Failure condition**（NaN、不收敛等如何记录）  

### Frozen recipe 的正确理解

冻结训练配方，是为了回答：

> **在该协议下**，某架构改动是否为 drop-in 改进？

**不是**证明该架构在所有 recipe 下最优。  
负结果的范围必须写清 recipe / seed / 数据 / 深度。

---

## 9. Ablation SOP

Ablation **不是**为了增加实验数量，而是回答：

> 为什么观察到这个结果？

推荐结构：

```text
Full model
  → Remove component A
  → Remove component B
```

每条消融分别记录：

- performance effect（若可比较）  
- trainability effect  
- mechanism hypothesis（标为假设）  
- 是否有资格做因果断言（通常：单次结构消融 ≠ 证明机制）  

### 数值不稳定

若 ablation 出现 NaN / 崩溃：

- **不要**强行报告可比 accuracy  
- 记录状态：如 `failed_numerical_instability`  
- 作为 **trainability evidence**，不是 accuracy ranking  

本 Demo：Ablation B 即此处理。

---

## 10. Negative Result SOP

负结果 **≠** “实验失败”。  
它可以是：**明确排除某一假设空间**。

必须同时具备：

1. **Scope**（数据 / 模型 / recipe / seed）  
2. **Protocol**（冻什么、改什么）  
3. **Evidence**（SoT 可追溯）  
4. **Limitations**（不能推广到哪里）  

**推荐措辞：**

> The hypothesized improvement was **not supported** under the frozen training recipe and single-seed setting.

**禁止措辞：**

> PreAct is ineffective / generally worse / does not work on CIFAR.

---

## 11. Paper Production SOP（Phase 7）

实际验证过的写作与资产顺序：

```text
1  Freeze evidence
2  Build canonical data
3  Generate macros
4  Generate tables
5  Write Method
6  Write Experiments / Setup
7  Write Results          ← What happened?
8  Write Discussion       ← What might it mean?（分层）
9  Write Limitations      ← What can we NOT conclude?
10 Write Conclusion
11 Write Related Work     ← citation-safe
12 Write Introduction
13 Write Abstract         ← 最后定稿
14 Claim Audit
15 Numerical Audit
16 Citation Audit
17 Structural Audit
18 Final revision (minimal)
19 Final PDF QA
20 Human Final Science Gate → (Git freeze / Phase 8)
```

**Abstract 放后面：** 避免先写摘要再被 Results 打脸；摘要必须与 Conclusion 同故事。

### Phase 7 子阶段速查（保留）

| Stage | 要点 |
|-------|------|
| 7.0 Freeze | 只读盘点 SoT；不改实验 |
| 7.1 Architecture | section/figure/claim 姿态；人确认 |
| 7.1b Pipeline | canonical → macros/tables |
| 7.2–7.7 | Method → Conclusion |
| 7.8 | Abstract / Intro / Related |
| 7.9–7.13 | Audits → 最小修订 |
| 7.14–7.15 | Compile / PDF QA / Git freeze |

细节表曾单独展开于旧版 Phase 7 SOP；执行时以本节 + `paper/FINAL_STATUS.md` 为准。

---

## 12. Paper Writing Rules

| Section | 只回答 |
|---------|--------|
| **Results** | What happened? |
| **Discussion** | What might it mean?（Observed / Interpretation / Hypothesis / Unsupported） |
| **Limitations** | What can we NOT conclude? |
| **Conclusion** | What is actually established? |

避免：夸张 novelty、universal claims、未标记的因果解释、隐藏 limitations、手写实验数字、把工程记录包装成科学贡献。

---

## 13. Final QA Gate

### Scientific
- [ ] RQ / hypothesis clear  
- [ ] evidence sufficient for claims  
- [ ] scope bounded  
- [ ] no unsupported / universalized claims  

### Numerical
- [ ] SoT ↔ canonical ↔ macros ↔ tables ↔ prose  

### Citation
- [ ] keys ∈ bib；无虚构；无 undefined  

### Structural
- [ ] sections present；无 Engineering Scaffold 正文；无错误记号（如错误的 `$n$`）  
- [ ] `NEEDS_VERIFICATION` 仅保留真正未决项  

### PDF
- [ ] figures/tables 可读；无 `[??]`；无严重版式问题  
- [ ] （投稿前）清理或显式接受文中 NV 标记  

### 状态机（本 Demo）

```text
READY_FOR_FINAL_PDF_QA   ← 当前（见 paper/FINAL_STATUS.md）
        ↓  Overleaf 目视通过 + Human Science Gate
READY_TO_SUBMIT
        ↓
Phase 8 Publish
```

本地无 TeX：**允许** `LOCAL_COMPILE = UNAVAILABLE`，改走 Overleaf；**不可假装**已做 PDF visual QA。

---

## 14. Human vs Automation

| 可自动化（本 Demo 已实践或可脚本化） | 必须 Human Gate |
|--------------------------------------|-----------------|
| state / 文件发现、结构校验 | Research Question |
| canonical / macro / table 生成 | Hypothesis |
| numerical / citation presence 检查 | 科学解释与贡献定位 |
| routing、报告草稿 | novelty / 最终结论 |
| Overleaf 工程准备 | 投稿与发布决定 |
| | 是否重训、算力/下载（G7） |

---

## 15. Human Gates

| Gate | 内容 |
|------|------|
| **G1** | RQ / Hypothesis |
| **G2** | Literature inclusion |
| **G3** | Experiment design / budget |
| **G4** | Final science conclusion（写正文前/定 claim） |
| **G5** | Figure semantics（可选） |
| **G6** | Pre-submission |
| **G7** | Long training / download / paid compute |

本 Demo：G1/G3/G4 曾批准；G6 与最终 PDF QA 仍属人侧。

---

## 16. This Demo: AI-Research-Demo（Case Study）

| 项 | 内容 |
|----|------|
| Source paper | Deep Residual Learning for Image Recognition（+ Identity Mappings 作为 PreAct 动机） |
| RQ | 在 **frozen post-activation recipe** 下，PreAct 是否降低 CIFAR-10 depth-20 ResNet-20-A 的 test error？ |
| Path | Plain → ResNet → PreAct → Ablation A/B → Evidence → Canonical → Paper |
| Phase 映射 | 2–3 waived；4–6 inherited；7 → `READY_FOR_FINAL_PDF_QA` |

**Headline（canonical）：** Plain 9.68% · ResNet-20-A 8.41% · PreAct 9.47% · Ablation A 8.32% · Ablation B = numerical instability  

### 本项目验证了哪些流程设计？

1. **Evidence → Canonical → Macros → Paper** 数字链  
2. **Frozen control** 回答 drop-in 问题  
3. **Bounded negative result** 可写、可审计  
4. **Ablation** 服务 why；失败 run 不作 accuracy  
5. **Claim / numerical / citation / structural** 审计管线  
6. **Abstract 最后写**；Results/Discussion 分离  
7. **Waived / inherited phases** 可登记，不必假跑文献 vault  

手稿入口：`research_os/paper/latex/main.tex`  
状态：`research_os/paper/FINAL_STATUS.md`

---

## 17. Lessons Learned（长期规则）

1. 不要一开始堆工具。  
2. 先建立 evidence chain。  
3. Baseline 必须先冻结。  
4. 改进必须由 RQ 驱动。  
5. Ablation 必须服务于 why。  
6. Failed run 也是 evidence，但不是 accuracy evidence。  
7. Single-seed 必须降低结论强度。  
8. Negative result 可以是有效研究产物（若有界）。  
9. Paper 数字必须来自 canonical / macros。  
10. Results 与 Discussion 必须分开。  
11. Abstract 最后写。  
12. AI 可自动化流程，不能自动替代科学判断。  
13. 状态文件可能滞后——以 artifact + Human 确认为准并回写。  
14. DEMO 实验 Phase 编号 ≠ Research OS Phase 0–8——文档中写清 ROS Phase。  

---

## 18. Anti-Patterns

| 反模式 | 表现 |
|--------|------|
| **Tool-first research** | 为用工具而用工具 |
| **Module shopping** | 无 RQ 地试 SE / Attention / Transformer… |
| **Metric laundering** | 挑最好看的数写论文 |
| **Failed-run laundering** | 把失败包装成 accuracy |
| **Single-seed overclaim** | 0.09 pp 单次差宣布 improvement |
| **Paper-first editing** | 先写论文再倒推实验 |
| **Reviewer-driven science** | 为猜审稿无限加实验导致 RQ 漂移 |
| **Universalized negative** | 把 scoped “not supported” 写成 “method is bad” |
| **Stale numbers** | 多处手写 headline，与 SoT 脱节 |

---

## 19. Reusable Project Template

```text
<project>/
├── README.md                 # 项目入口（可指向 research_os/README.md）
├── code/                     # 可运行实现
├── data/                     # 数据或获取说明
├── experiments/
│   ├── configs/
│   ├── manifests/            # ★ Evidence SoT（登记）
│   ├── results/              # ★ Evidence SoT（指标/图）
│   └── runs/                 # 原始 run artifacts
├── paper/                    # 叙事素材 / 展示副本（非数字权威）
│   ├── analysis.md
│   └── conclusion.md
├── research_os/              # ★ Research OS 状态与论文生产
│   ├── README.md             # 本 SOP
│   ├── state.json
│   ├── phase_registry.json
│   ├── log.md
│   ├── decisions/
│   ├── contract/
│   ├── literature/ · vault/
│   ├── engineering/
│   ├── figures/
│   └── paper/
│       ├── canonical/        # ★ 论文数字快照（generated）
│       ├── scripts/          # pipeline / verify
│       ├── latex/            # ★ manuscript
│       └── FINAL_STATUS.md
└── notes/                    # 可选：过程笔记
```

| 角色 | 示例 |
|------|------|
| **Source of truth** | `experiments/manifests/`、`experiments/results/` |
| **Derived / generated** | `canonical/data.json`、`macros.tex`、`tables/` |
| **Human decisions** | `decisions/`、`contract/`、Gates |
| **Manuscript** | `research_os/paper/latex/` |
| **Process metadata** | `state.json`、`phase_registry.json`、`log.md` |

**注意：** 本仓库无 `research_os/state/` 目录；状态为根级 `state.json`。勿假定不存在的路径。

---

## 20. Quick Start（一页）

明天开始新论文：

1. Research Contract（G1）  
2. Literature / Knowledge（或登记 waiver）  
3. Reproduction record + tolerance  
4. **冻结 baseline**  
5. RQ + Hypothesis + falsification  
6. 最小控制实验（改一变量，冻其余）  
7. 记录 evidence（含失败）  
8. Canonical snapshot  
9. 生成 macros / tables  
10. 写论文（Method→…→Abstract 最后）  
11. Claim / Numerical / Citation / Structural QA  
12. PDF QA  
13. Human final gate  
14. Publish（Phase 8）  

---

## Appendix — 文档地图（避免重复）

| 文档 | 职责 |
|------|------|
| **本 README** | 全相位 SOP + Demo 经验固化 |
| 仓库根 `Research OS.md` | Phase 0–8 总览 / 接管说明 |
| `paper/FINAL_STATUS.md` | 本项目论文终态 |
| `paper/canonical/SCHEMA.md` | canonical 字段 |
| `paper/latex/OVERLEAF.md` | 编译上传 |
| `decisions/`、`contract/` | 门禁与 RQ 合同 |
| `phase_registry.json`、`state.json` | 机器可读进度（可能滞后） |

---

*End of Research OS SOP. 以证据为准，以门禁定科学，以 artifact 记进度。*
