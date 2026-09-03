# Experiments 目录约定

统一布局：**配置 / 启动 / 原始 run / 加工结果** 分离。  
Phase 2–5 的 raw 产物一律落在 `runs/<phase>/...`，不再使用顶层 `models/`、`logs/`、`plots/`。

## 目录树

```text
experiments/
├── configs/          # 各 Phase YAML（进 Git）
├── launch/           # 启动与监控脚本 *.ps1
├── manifests/        # 权威 run 指针（进 Git）
├── scripts/          # 汇总脚本 build_phase*.py
├── runs/             # 原始训练产物（权重/曲线/raw log；大体不进 Git）
│   ├── phase2/
│   │   ├── baseline/ # Plain-20 / ResNet-20-A（冻结）
│   │   └── logs/
│   ├── phase3/       # PreAct 等
│   ├── phase4/       # 预留
│   └── phase5/       # Ablation A/B
└── results/          # 加工后的 json/csv/图/阶段总结（进 Git）
    ├── phase2/
    ├── phase3/
    ├── phase4/
    ├── phase5/
    └── comparisons/
```

## 写到哪里

| 内容 | 路径 |
|------|------|
| 配置 | `configs/phase2\|3\|4\|5/` |
| 启动脚本 | `launch/` |
| 权威指针 | `manifests/` |
| 原始权重 / 曲线 / 训练 log | `runs/<phase>/<idea_id>/...` |
| 加工表 / 图 / 阶段汇总 | `results/<phase>/` |
| 研究叙述文档 | `../research/` |
| 论文可直接引用的图/表 | `../paper/` |

## 规则

1. Phase 2 `runs/phase2/baseline/` **冻结**，不要覆盖正式 run。
2. 正式对比只用 **manifest / results**，不要用“最新 mtime”发现。
3. 每次新 run 尽量带 `metrics.json`（或写入 `results/`）。
4. raw（权重、log）与 processed（json/csv/md）分离；大文件靠 `.gitignore` 排除。

## Phase 2 权威入口

- `manifests/phase2_baseline.json`
- `results/phase2/summary.json`
