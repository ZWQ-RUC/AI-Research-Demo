# research/ — 研究叙述与审计文档

存放**过程性、解释性**文档：论文理解、代码分析、环境报告、实验日志、复现判定、改进设计等。  
**不放**训练权重、原始曲线、加工后的指标表（那些分别在 `experiments/runs/` 与 `experiments/results/`）。

## 目录

| 子目录 | 内容 |
|--------|------|
| `resnet-cifar10-baseline-20260902/` | Phase 2 复现审计包（paper_summary、code_analysis、environment、experiment_log、reproduction、innovation） |
| `phase3-improvement-design/` | PreAct 改进设计稿（早期版本） |
| `phase3-improvement-research-design/` | PreAct 改进设计稿（正式版本） |

## 与 experiments / paper 的分工

| 目录 | 职责 |
|------|------|
| `experiments/runs/` | 原始训练产物 |
| `experiments/results/` | 加工后的指标、对比表、阶段图（**权威数字**） |
| `paper/` | 从 results 复制的写论文用图/表/指标 |
| `research/`（本目录） | 为什么这样训、结论是否站得住、下一步设计 |
