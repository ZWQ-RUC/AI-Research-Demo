# Phase 7 — LaTeX Template Comparison (Read-Only)

**status:** analysis only — no project init, no body, no template copy/move/edit  
**date:** 2026-09-04  
**G4:** approved (user)  
**Overleaf:** still deferred (1C)  
**Analyzed paths (external, read-only):**

1. `C:\Work\Papers\Templates\arXiv_bioRxiv_Template`
2. `C:\Work\Papers\Templates\NeurIPS_2026_Template`
3. `C:\Work\Papers\Templates\中国人民大学本硕博毕业论文LaTeX模板`

---

## Template A — arXiv / bioRxiv style manuscript

### 1. 类型与适用场景
- **类型:** 通用 `article` + 宽左边距 / margin notes 的 **bioRxiv / 预印本排版演示模板**（“embedded figures” 示例稿）。
- **适用:** 生命科学/预印本式手稿排版练习；强调图文混排与边注图注。
- **不适用作为:** 顶会 ML 投稿格式；也非学校学位格式。

### 2. main.tex / document class
- **入口:** `main.tex`（目录内唯一主文件）
- **Class:** `\documentclass[10pt,letterpaper]{article}`
- **无** 独立 `.cls` / conference `.sty`；样式全部写在 preamble。

### 3. Section 组织
示例章节（多为 `\section*` 无编号）：
`Abstract` → `Introduction` → `Results` → `Discussion` → `Supporting Information` → `Acknowledgments` → bibliography  
偏实验报告/生物稿结构，**无**标准 ML 的 Method / Related Work / Experiments 强制骨架（需自行改）。

### 4. Bibliography
- **文件:** `library.bib`
- **机制:** 传统 **BibTeX**
- **命令:** `\bibliography{library}` + `\bibliographystyle{abbrv}`
- **引用包:** `\usepackage{cite}`（非 natbib / 非 biblatex）

### 5. Figure / Table
- 强调 `wrapfigure`、`marginnote`、`sidecap`、`changepage` 等**手工排版**技巧。
- 示例图为模板自带 `fig1.pdf`–`fig3.pdf`。
- 标准 `figure` float 也有示例；表格能力一般，未预装 `booktabs`。
- 对自动生成的 `main_results.tex` / `deltas.tex`：**可用，但边注布局会增加接入摩擦**。

### 6. 中文支持
- **弱 / 基本未设计中文正文。**
- `inputenc` utf8；无 `ctex` / `xeCJK`；中文需另配引擎与字体，非开箱即用。

### 7. 编译方式
- 典型：`pdflatex` → `bibtex` → `pdflatex` ×2  
- 未声明强制 XeLaTeX。

### 8. 是否适合当前 AI/ML 论文
- **弱适合。** 可作为任意 article 底稿，但社区读者更期望 NeurIPS/ICML/ICLR 风格；页边距与边注样式对 ML 短文不典型。

### 9. 是否适合本 ResNet / CIFAR-10 Demo
- **可用作“随便写一篇技术笔记”**，但与 Phase 7.1 的 conference-style empirical paper 目标不一致。
- Negative-result / ablation 表格用标准 float 即可，不必依赖 margin caption。

### 10. 与 Paper Data Pipeline 兼容
| 产物 | 兼容性 |
|------|--------|
| `\input{.../macros.tex}` | 可行（article preamble） |
| `\input{.../tables/*.tex}` | 需补 `booktabs`；边注模板非必需 |
| `paper/figures/*.png` | `graphicx` 已有；路径需相对主工程 |
| Overleaf | 暂缓；本地可编 |

---

## Template B — NeurIPS 2026

### 1. 类型与适用场景
- **类型:** **NeurIPS 2026 官方投稿 / camera-ready / preprint** 样式。
- **适用:** ML/AI 会议投稿、workshop、arXiv preprint（`[preprint]`）、教育/评测等 track 选项。
- **场景匹配:** 与 Research OS Phase 7 ML 默认写作栈高度一致。

### 2. main.tex / document class
- **入口示例:** `neurips_2026.tex`（非名为 `main.tex`，但等价主文件）
- **Class:** `\documentclass{article}`
- **样式:** `\usepackage{neurips_2026}` → `neurips_2026.sty`（2026-01-29）
- **选项:** `main` / `position` / `eandd` / `creativeai` / `education` / workshop 盲审选项；`final`；`preprint`；`nonatbib`
- **附加:** `checklist.tex`（NeurIPS paper checklist）

### 3. Section 组织
官方说明稿自身是 formatting instructions，但惯例与 Phase 7.1 对齐良好：
`Abstract` → `Introduction` → `Related Work` → `Method` → `Experiments` → `Results`/`Discussion` → `Conclusion` → `Acknowledgments` → `References` → checklist / appendix  
正文页限：**9 页**（含图）；references / checklist / appendix 另计（以模板说明为准）。

### 4. Bibliography
- **默认加载 `natbib`**（可 `nonatbib` 关闭）
- 引用：`\citep` / `\citet` 等 natbib 习惯
- 示例未捆绑具体 `.bib`；任意 BibTeX 风格通常可接受（模板说明：style flexible if consistent）
- **非** biblatex/biber 默认路径

### 5. Figure / Table
- 标准 `figure` / `table`；**强烈推荐 `booktabs`**（示例已 `\usepackage{booktabs}`）
- 图注在图后、表题在表前；禁竖线表；支持彩色图
- 与已生成 `tables/main_results.tex`、`tables/deltas.tex`（booktabs tabular）**直接匹配**

### 6. 中文支持
- **英文会议模板；中文非一等公民。**
- 含 `inputenc` + `fontenc`；中文需额外配置，且投稿通常要求英文。
- 对本 DEMO：若目标为英文 ML 短文 / preprint → **匹配**；若必须中文学位正文 → **不匹配**。

### 7. 编译方式
- 典型 TeX Live：`pdflatex`（或 `latexmk`）+ BibTeX（若用 `.bib`）
- 依赖 `neurips_2026.sty` 同目录或 `TEXINPUTS`
- Times 字体由 sty 加载（作者侧）

### 8. 是否适合当前 AI/ML 论文
- **强适合。** 当前顶会默认外观；`preprint` 选项可直接用于 arXiv；与 `ml-paper-writing` 默认栈一致。

### 9. 是否适合本 ResNet / CIFAR-10 Demo
- **强适合** 作为：
  - 英文 empirical / negative-result 短文
  - 课程/仓库展示用 “conference-formatted” PDF
  - 未来若投稿 NeurIPS（需自行满足页限、checklist、贡献门槛——本 DEMO 未必够会议贡献强度，但**格式**合适）
- 注意：科学内容受 G4 边界约束；格式合适 ≠ 一定达到 NeurIPS 录用标准。

### 10. 与 Paper Data Pipeline 兼容
| 产物 | 兼容性 |
|------|--------|
| `macros.tex` | **高** — preamble `\input{...}` |
| `tables/main_results.tex` / `deltas.tex` | **高** — 已按 booktabs 生成 |
| figures PNG | **高** — 标准 `\includegraphics` |
| checklist | 投稿时再纳入；当前 DEMO 可暂缓 |
| Overleaf | 仍按 1C 暂缓；本地工程初始化时再挂路径 |

---

## Template C — 中国人民大学本硕博毕业论文（RUCThesis）

### 1. 类型与适用场景
- **类型:** **人大学位论文**（本科 / 学硕 / 专硕 / 博士）中文模板。
- **适用:** 学位论文送审、封面/独创性声明/中英摘要/目录/章结构。
- **不适用:** 国际会议短文投稿格式。

### 2. main.tex / document class
- **入口:** `main.tex`
- **Class:** `\documentclass[a4paper,master]{ructhesis}`（可改 `bachelor` / `doctor` / `promaster`）
- **文件:** `ructhesis.cls` (+ `ructhesis.dtx` / `.ins`)
- **结构:** `chap/`、`format/`、`ref/`、`figures/`、封面字体等

### 3. Section 组织
学位制：封面 → 独创性/授权 → 中英摘要 → 目录/图目录/表目录 → `\chapter` 正文 → `\printbibliography` → 附录 → 致谢  
与会议 paper 的 Abstract–Method–Experiments 扁平 `\section` **组织不同**（章驱动）。

### 4. Bibliography
- **main.tex 实际使用:** **biblatex + biber**，国标 `gb7714-2015`
  ```tex
  \usepackage[backend=biber,bibstyle=gb7714-2015,...]{biblatex}
  \addbibresource{ref/test.bib}
  \printbibliography
  ```
- **README 写的是** `bibtex` 流程 —— 与当前 `main.tex` **不一致**；以 `main.tex` 为准时应走 **biber**。
- 另有 `ref/rucbib.bst`（传统 BST，可能为旧路径遗留）。

### 5. Figure / Table
- 中文章格式；`subfigure`、`float`、`placeins` 等已示例外装。
- 可插入实验图/表，但版式为 **A4 学位长文**，非 9 页会议双栏/单栏紧凑稿。
- 自动 tables 可 `\input`，但需符合中文章标题/浮动习惯。

### 6. 中文支持
- **强。** XeLaTeX + 中文字体（宋黑仿、Times/Arial 等；封面或需方正小标宋）。
- README 强调 UTF-8 + **XeLaTeX**。

### 7. 编译方式
- **强制 XeLaTeX**（README）
- 参考文献：按 main 应为 `xelatex` → `biber` → `xelatex` ×2  
  （勿盲从 README 的 `bibtex main.tex` 字面，除非改回 BibTeX 流程）
- 依赖本机中英文字体文件。

### 8. 是否适合当前 AI/ML 论文
- **作为会议/预印本 ML 论文：不适合。**
- **作为中文学位论文外壳：适合**（若本 DEMO 最终目标是写入学位论文某一章）。

### 9. 是否适合本 ResNet / CIFAR-10 Demo
- 若交付物是 **英文 ML 短文 / Research OS Phase 7 默认产出** → **暂不采用**。
- 若用户明确要 **人大硕/博论文章节** → 可后期另开 “thesis lane”，与会议稿并行，而非替换当前 pipeline 默认模板。

### 10. 与 Paper Data Pipeline 兼容
| 产物 | 兼容性 |
|------|--------|
| macros / booktabs tables | 技术上可 `\input`，但全文引擎为 XeLaTeX、中文章结构 |
| 图 PNG | 可用 |
| 与当前 `latex/` 英文字段宏 | 兼容数字；正文语言与版式不匹配默认 Phase 7 |
| Overleaf | 字体/中文常更麻烦；且仍暂缓 |

---

## 总对比表

| 维度 | A arXiv/bioRxiv | **B NeurIPS 2026** | C 人大论文 |
|------|-----------------|--------------------|------------|
| 主用途 | 预印本排版示例 | **ML 会议/预印本** | 中文学位 |
| Class | `article` | `article` + `neurips_2026` | `ructhesis` |
| 主文件 | `main.tex` | `neurips_2026.tex` | `main.tex` |
| 文献 | BibTeX + `cite` | **natbib** + BibTeX | **biblatex+biber**（国标） |
| 表 | 弱约定 | **booktabs 友好** | 学位浮动 |
| 中文 | 弱 | 弱（英文本体） | **强** |
| 编译 | pdfLaTeX 系 | pdfLaTeX 系 | **XeLaTeX** |
| AI/ML | 一般 | **高** | 低（会议向） |
| 本 Demo | 勉强 | **高** | 仅学位场景 |
| Pipeline | 中 | **高** | 中（版式不匹配） |

---

## 推荐

### 推荐模板
**Template B — `C:\Work\Papers\Templates\NeurIPS_2026_Template`**

### 推荐理由
1. 与 Phase 7.1「ML empirical / negative-result short paper」及 Research OS ML 默认栈一致。  
2. `booktabs` + 标准 float 与已生成 `research_os/paper/latex/tables/*.tex`、`macros.tex` **直接兼容**。  
3. 提供 `[preprint]`，在暂缓 Overleaf / 未正式投稿时仍可产出规范 PDF。  
4. 英文会议惯例匹配当前证据叙事（ResNet / CIFAR-10 / ablation）；G4 保守 claims 可直接写入该结构。  
5. 体积小、依赖清晰（`neurips_2026.sty` + 示例 tex + checklist），后续初始化工程成本低。

### 另外两个暂不采用的原因

**A — arXiv/bioRxiv Template**  
- 定位是生物预印本 **embedded-figure 技巧示例**，非 ML 社区默认格式。  
- 边注/wrapfig 增加维护成本，对自动表格管线无增益。  
- 无会议 sty；中文与 natbib/booktabs 生态弱于 NeurIPS。

**C — 人大毕业论文模板**  
- 学位长文 + XeLaTeX + 国标参考文献，服务于 **答辩/存档**，不是当前 Phase 7 会议/预印本目标。  
- 章结构与 9 页级 empirical short paper 不匹配。  
- README 与 `main.tex` 参考文献流程不一致，初始化时还要先理清 biber vs bibtex。  
- 若未来需要写入学位论文，建议 **另开 thesis 工程**，而不是替换本 Demo 的主论文模板。

---

## 若选择推荐模板，下一步需要做什么（尚未执行）

> 以下仅清单；**本次分析结束后暂停，不初始化、不写正文。**

1. **Human 确认**采用 NeurIPS 2026（或改选 A/C）。  
2. 在仓库内新建论文工程目录（建议例如 `research_os/paper/latex_project/` 或 `paper/neurips2026/`），**引用**而非修改 Templates 原目录（复制 sty/入口时保留 Templates 只读源）。  
3. 将入口改为可 `\input`：  
   - `research_os/paper/latex/macros.tex`  
   - `research_os/paper/latex/tables/main_results.tex`  
   - `research_os/paper/latex/tables/deltas.tex`  
4. 用相对路径挂载 `paper/figures/` 或 `experiments/results/**/figures/`（SoT 优先）。  
5. 新建空 `.bib`（He 2015 / He 2016 等），natbib 引用。  
6. 可选：`[preprint]` 用于本地/arXiv；正式投稿再切换 track + `final` + checklist。  
7. 再进入 outline / claim ledger / 正文起草（仍受 G4 C1–C7 约束）。  
8. Overleaf 仍按 1C 暂缓，直到你另行授权。

---

## Analysis gate

**STOP:** Template Analysis 完成。等待你确认推荐模板后，再初始化论文工程。
