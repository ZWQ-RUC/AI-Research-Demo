# ResNet-20 改进与消融实验设计

## 1. 实验模型

### ① 原始模型 A：Plain-20

- **结构：** 普通 CNN，无残差连接
- **实验目的：** 作为基础 Baseline，验证残差连接带来的性能提升。

---

### ② 原始模型 B：ResNet-20-A

- **结构：**
  `Conv → BN → ReLU → Conv → BN → Add → ReLU`
- **Shortcut：** Option A
- **实验目的：** 作为主要 Baseline。
- **当前结果：** **8.41% Test Error**

---

### ③ 改进模型：Pre-activation ResNet-20

- **结构：**
  `BN → ReLU → Conv → BN → ReLU → Conv → Add`
- **核心改进：** 将 BN + ReLU 从卷积之后移动到卷积之前。
- **实验目的：** 验证 Pre-activation 是否能够进一步提升 ResNet-20-A 的性能。

---

## 2. 消融实验

### ④ 消融实验 A：去掉第一个 BN + ReLU

**完整 Pre-activation：**

`BN → ReLU → Conv → BN → ReLU → Conv`

**消融后：**

`Conv → BN → ReLU → Conv`

- **实验目的：** 验证**第一个 Pre-activation** 是否是性能提升的重要因素。

---

### ⑤ 消融实验 B：去掉第二个 BN + ReLU

**完整 Pre-activation：**

`BN → ReLU → Conv → BN → ReLU → Conv`

**消融后：**

`BN → ReLU → Conv → Conv`

- **实验目的：** 验证**第二个 Pre-activation** 是否是性能提升的重要因素。

---

## 3. 整体实验逻辑

```text
                 Phase 2：原始实验
                        │
             ┌──────────┴──────────┐
             ↓                     ↓
         Plain-20             ResNet-20-A
         9.68%                  8.41%
                                  │
                                  ↓
                       Phase 3：结构改进
                                  │
                                  ↓
                    Pre-activation ResNet-20
                                  │
                         ┌────────┴────────┐
                         ↓                 ↓
                   Ablation A        Ablation B
                  去掉第一个           去掉第二个
                   BN + ReLU           BN + ReLU
```

## 4. 实验目的总结

| 实验 | 核心问题 |
|---|---|
| **Plain-20** | 没有残差连接时性能如何？ |
| **ResNet-20-A** | 残差连接能否改善 Plain-20？ |
| **Pre-activation ResNet-20** | Pre-activation 能否进一步改善 ResNet-20-A？ |
| **Ablation A** | 第一个 Pre-activation 是否重要？ |
| **Ablation B** | 第二个 Pre-activation 是否重要？ |

> **最终目标：** 从“残差连接是否有效”进一步研究到“Pre-activation 是否有效，以及其两个关键组成部分分别贡献了多少”。