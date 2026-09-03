# Phase 3 — Improvement Research Design

**Status:** design only. No code change, no training, no Phase 4/5. Waiting for confirmation of the selected method.

| Item | Value | Evidence tag |
|------|--------|----------------|
| Paper | Deep Residual Learning for Image Recognition (He et al., 2015 / CVPR 2016) | paper |
| In-repo notes | `research/resnet-cifar10-baseline-20260902/paper_summary.md` | paper / code |
| Implementation | `code/deep-residual-learning-pytorch-master/models.py` `CifarResNet` + `BasicBlock` | code |
| Frozen baseline | Plain-20 **9.68%**; ResNet-20-A **8.41%** best test error | baseline-run |
| Protocol | `experiments/configs/phase2/baseline_plain20_resnet20a.yaml` | config |
| Manifest | `experiments/manifests/phase2_baseline.json` | observed |
| Hardware | RTX 3050 Laptop 4GB; ~63 min / 160 epoch; conda `deeplearn` | observed |
| Reproduction status | `partially_reproduced` (depth-20 only, single seed) | observed |

**Scope of this document:** diagnose ResNet-20-A on the *current* CIFAR-10 task, list testable limitations, compare improvement candidates **without privileging SE**, pick **one** first improvement, and freeze a falsifiable hypothesis plus an implementation plan that cannot overwrite Phase 2.

External ResearchVault 精读笔记不在本仓库内；本设计以原论文 PDF（仓库内 `deep-residual-learning.pdf`）、本仓库 `paper_summary.md` / `code_analysis.md` / `reproduction_report.md`、以及 `models.py` / `train.py` 为准。

---

## Frozen evaluation contract (unchanged in Phase 3–5 unless explicitly revised)

| Contract item | Frozen value |
|---------------|----------------|
| Dataset / split | CIFAR-10 official 50k train / 10k test |
| Train aug | `RandomCrop(32, padding=4)`, `RandomHorizontalFlip` |
| Norm | per-channel mean/std `(0.4914, 0.4822, 0.4465)`, `(0.2023, 0.1994, 0.2010)` |
| Test | single 32×32 view, same Normalize, no crop/flip |
| Loss | CrossEntropy |
| Optim | SGD, lr 0.1, momentum 0.9, wd 1e-4 |
| Schedule | `MultiStepLR` at 32k / 48k iterations, γ=0.1; 160 epochs; batch 128 |
| Metric | **best test error (%)** among evals every 4 epochs (`best.pt`) |
| Depth / width / shortcut | ResNet-20, filters {16,32,64}, maps {32,16,8}, **Option A** |
| Phase 2 artifacts | do not retrain into `experiments/runs/phase2/baseline/CifarResNet-20-*` |

Phase 3 raw runs go to `experiments/runs/phase3/<idea_id>/<run_id>/`. Formal comparison must use manifests, not “latest mtime”.

---

## Step 1 — Baseline Diagnosis

### 1.1 Network structure (`CifarResNet`, n=20 → k=3)

Paper §4.2: 6n+2 weighted layers; first 3×3; then 2n layers at each of {32,16,8} with {16,32,64} filters; global average pool + 10-way FC.

Code (`models.py` `CifarResNet.__init__`) matches that layout:

1. Stem: `Conv2d(3→16, 3×3, pad=1)` → `BN` → `ReLU`
2. Stage 1: 3× `BasicBlock(16)` (identity shortcuts)
3. Downsample: `BasicBlock(16, downsample=True, option=A)` → 32 ch, stride 2
4. Stage 2: 2× `BasicBlock(32)`
5. Downsample: `BasicBlock(32, downsample=True, option=A)` → 64 ch, stride 2
6. Stage 3: 2× `BasicBlock(64)`
7. `ClassifierHead`: `AdaptiveAvgPool2d(1)` → Flatten → `Linear(64, 10)`

There are **9** residual blocks (3n). Subsampling is done **inside** the first conv of the downsample block (`stride=2`), not by a separate pool in the residual branch except on the shortcut (see 1.3).

`CifarResNet.transform` (per-image mean subtract) is **not** used by `train.py`; training uses dataset-level `Normalize`. That is a code inconsistency but it is the **frozen** baseline recipe (`code`).

### 1.2 Residual block (`BasicBlock`)

Each block is post-activation, two 3×3 convolutions:

```
x → Conv 3×3 → BN → ReLU → Conv 3×3 → BN → (+ shortcut) → ReLU
```

Facts from code:

- Convolutions use **bias** (PyTorch default); paper/ImageNet text says BN right after conv. Extra bias is redundant with BN and is a small deviation (`code` vs `paper`).
- Shortcut add happens **after** the second BN and **before** the last ReLU (`return F.relu(res)`).
- Same-size path is a true identity: `self.model(x) + x`.
- No dropout, no SE, no extra 1×1 except Option B (unused in baseline).
- Kaiming normal init on convs; Option B downsample averaging init exists but is unused for Option A.

Paper Fig. 2 and §3.2 hypothesized that F(x) is easier to push toward zero than to fit H(x) directly. Fig. 7 on CIFAR supports smaller residual-branch magnitudes than plain nets. **Our depth-20 run is consistent with “optimization is largely solved”:** final train error **0.72%** (`baseline-run`). That matters for what is *worth* changing next (see Step 2).

### 1.3 Shortcut Option A

Paper: identity when shapes match; when dimensions increase, identity + **zero-pad** extra channels; spatial downsampling of the shortcut uses **stride 2**. CIFAR experiments use Option A so residual and plain have the same parameter count (Table 6 note).

Code (`BasicBlock.forward`, option `'A'`):

- Spatial: `F.max_pool2d(x, kernel_size=1, stride=2)` — this is **not** a 2×2 max-pool. Kernel 1 / stride 2 keeps **one pixel in each 2×2 cell and drops the other three**. It is strided subsampling, not a pooling summary (`code`).
- Channels: concatenate zeros so `C → 2C`. New channels receive **no** identity copy; only the residual branch can write them.
- There is no learned projection (Option B exists in code but was not trained).

On ImageNet the same paper found Option B slightly better than A (Table 3: ResNet-34 A 25.03 vs B 24.52 top-1). On CIFAR they still chose A to keep the plain/residual param match. The local PyTorch repo’s own Option B number (8.82%) is **worse** than A (8.64%), so “just switch to B” is not a promising first story on this stack (`paper` + `literature`/`README`).

### 1.4 Feature representation

The network is **deep-and-thin by design** (paper §4.2: regularization via architecture, no maxout/dropout). Last stage is only **64 channels on 8×8 maps**, then a **64-D** vector after GAP. Classifier is a single linear map 64→10.

Capacity is real but narrow: unittest expects ~0.27M parameters (paper Table 6). Residual vs plain at this depth already bought **1.27 pp** (9.68 → 8.41). Paper Table 6 still has **1.24 pp** from ResNet-20 (8.75) to ResNet-32 (7.51) by adding depth, which we did **not** run. So leftover error is a mix of: (i) limited width/depth, (ii) representation inductive bias, (iii) generalization, (iv) single-seed noise — not a single missing module.

### 1.5 Channel interaction

Every 3×3 conv **does** mix channels, but only **locally** (3×3 neighborhood) and with **static** filters shared across spatial locations and samples. There is:

- no global (image-level) channel descriptor until the **final** GAP;
- no sample-adaptive reweighting of channels inside the trunk;
- no 1×1 bottleneck (BasicBlock, not BottleneckBlock).

Stage 1 has only 16 channels. Any SE-style FC bottleneck with reduction **r=16** collapses 16→1→16 at that stage (`inferred` from code widths + standard SE). That is a concrete reason **not** to treat textbook SE as the default patch for *this* backbone.

### 1.6 Spatial information

Resolution path: 32→32 (stem/stage1) → 16 → 8, then GAP to 1×1. CIFAR objects often fill most of the canvas; 8×8 still has layout (object parts, left/right), but the head **throws spatial layout away**. Downsample shortcuts additionally **discard 75% of spatial locations** (kernel-1 stride-2). Residual 3×3s with stride 2 do use all input locations for the F-path, so the two branches are spatially asymmetric at stage boundaries (`code`).

### 1.7 Optimization

| Quantity | Plain-20 | ResNet-20-A | Source |
|----------|----------|-------------|--------|
| Best test error | 9.68% | 8.41% | epoch 132 both |
| Final train error | 1.16% | 0.72% | last epoch |
| Train−test gap (approx.) | ~8.5 pp | ~7.7 pp | train final vs best test |
| Wall time | ~64 min | ~63 min | RTX 3050 4GB |

SGD + step decay is the paper recipe. LR is stepped **per iteration** (`scheduler.step()` inside the batch loop), matching paper 32k/48k iterations. No seed, no cosine, no warmup (warmup only for n≥56). Checkpoint **selects on test** every 4 epochs — same as the reference repo; it slightly optimistically reports best test (`code` / flagged in `paper_summary.md`).

**Diagnosis:** at depth 20, residual learning has already made the training error small. The remaining test error is **not** primarily “cannot fit the training set”. Improvements that only clean up residual identity (pre-act) are theoretically tight but may move test error by less than seed noise at this depth. Improvements that change **representation or regularization** are better matched to the observed 7.7 pp gap (`baseline-run` + `paper` §4.2 on 1202-layer overfitting).

### 1.8 Parameter efficiency

~0.27M weights vs Highway/FitNet (1.25–2.5M) in Table 6, with competitive error. Extra parameters in a first improvement should stay **small** so Phase 4 cannot be dismissed as “we just added capacity”. A fair later control is a **parameter-matched** widening or extra 1×1 channels totaling the same Δparams.

### 1.9 Computational cost

One 160-epoch run ≈ **1 hour**, batch 128, FP32, 4GB VRAM. Phase 3+4+5 together should stay in the order of **4–8** full runs, not a depth/width sweep. That rules out WRN-style widening, ImageNet-scale attention, and multi-seed 5-way tables as the *first* idea. Cheap modules (few extra conv/FC, same 20-layer skeleton) fit; 110-layer ablations do not, unless separately authorized.

---

## Step 2 — Possible limitations (testable)

Five candidates. All are stated so that a CIFAR-10 experiment on **this** code can support or reject them.

### L1 — Residual identity is implemented as post-activation

- **Problem:** Addition is followed by ReLU; BN/ReLU sit inside F(x). The shortcut is not a pure identity mapping through the block (He et al., 2016, *Identity Mappings in Deep Residual Networks*).
- **Evidence:** `return F.relu(res)` in `BasicBlock.forward` (`code`). Original paper Fig. 2 is the same post-act form (`paper`). Train error is already 0.72% (`baseline-run`), so the *optimization* motivation of pre-act is weaker at depth 20 than at 110/164.
- **Why it may matter:** If ReLU after add clips negative identity signal, F(x) cannot be a small residual around a true identity. That is the authors’ own next paper.
- **How to test:** Swap in a pre-activation block (BN–ReLU–Conv–BN–ReLU–Conv, add, **no** post-add ReLU). Freeze data, width, Option A, SGD. Compare test error and residual-branch magnitude (Fig. 7-style). **Param/FLOP matched.**

### L2 — Option A shortcut is spatially and channel-wise lossy

- **Problem:** Downsample identity is strided skip + zero-filled new channels. Half of the channels at each stage boundary have **zero** identity; spatial shortcut ignores 3/4 of locations.
- **Evidence:** `max_pool2d(..., 1, 2)` and zero `torch.cat` (`code`). Paper defines zero-pad Option A and stride-2 shortcuts (`paper`). ImageNet A < B (`paper` Table 3); CIFAR repo B ≱ A (`code` README).
- **Why it may matter:** Stage boundaries are exactly where representation scale changes. A broken identity there is the place residual theory is least well realized — without adding a full projection (B).
- **How to test:** Replace kernel-1 skip with **2×2 average pool stride 2** (still parameter-free); separately run Option B as a known control. If avg-pool helps and B does not, the issue is spatial summary, not learned projection.

### L3 — No sample-adaptive *global* channel modulation in a thin trunk

- **Problem:** Channel mixing is local and static. The only global descriptor is the final 64-D GAP. Thin stages (16/32/64) make a naïve SE reduction **r=16** degenerate at stage 1.
- **Evidence:** `BasicBlock` is two 3×3s only (`code`). Widths {16,32,64} (`paper` §4.2 + `code`). Train error low but test 8.41% (`baseline-run`) — leftover error is consistent with representation, not under-fitting.
- **Why it may matter:** CIFAR classes differ in which mid-level patterns fire (texture vs shape vs color). A cheap global gate can reweight channels **per image** before GAP. This is the SE/ECA family — **not assumed to be the winner a priori** (see Steps 4–5).
- **How to test:** Insert a tiny channel gate after the second BN (before add). Compare: none vs ECA vs SE with **CIFAR-safe** r (e.g. 4) vs **last stage only**. Require a **random/fixed-scale** control so extra compute is not the whole story.

### L4 — Spatial layout is discarded at the head; downsample shortcut is spatially naive

- **Problem:** 8×8 features are pooled to 1×1. Combined with L2, spatial structure is weakly used at the end of the net.
- **Evidence:** `ClassifierHead` is AdaptiveAvgPool2d(1) (`code`); paper §4.2 ends with GAP (`paper`). CIFAR-10 images are 32×32 with object-centric layout (`config`).
- **Why it may matter:** Fine-grained cues (wheel vs background, animal parts) live in space. Channel-only gates cannot move spatial attention. Spatial attention or pooling (GeM, weighted GAP) could help — at extra cost and extra factors.
- **How to test:** (i) GeM pooling vs GAP; (ii) spatial attention on 8×8 only (last stage); freeze the rest. If last-stage spatial attention ≈ all-stage, the issue is the head, not the trunk.

### L5 — Generalization gap with only weight decay

- **Problem:** ~7.7 pp train/test gap; paper deliberately avoided dropout/maxout and left stronger regularization as future work (1202-layer discussion, §4.2).
- **Evidence:** train 0.72% vs best test 8.41% (`baseline-run`). Paper: “we use no maxout/dropout… combining with stronger regularization may improve results, which we will study in the future” (`paper`). Augmentation is only pad-crop + flip (`code`).
- **Why it may matter:** Architecture-only tweaks may overfit more if they add capacity. Occlusion-style aug (Cutout) or Mixup attacks the gap **without** changing the residual definition.
- **How to test:** Add Cutout (one hole, length as the only hyperparameter) or Mixup (α as the only hyperparameter). Same model weights class. If test improves **and** train error rises, the mechanism is regularization, not extra features.

---

## Step 3 — Improvement candidates

Not a catalogue. Each candidate is tied to one limitation and is implementable on this repo and GPU.

| ID | Method | Limitation | What would actually change |
|----|--------|------------|----------------------------|
| C1 | **Pre-activation BasicBlock** | L1 | Block algebra only; 0 params |
| C2 | **Avg-pool Option A downsample** | L2 | Shortcut spatial op only; 0 params |
| C3 | **ECA (1-D conv on GAP descriptors)** | L3 | Tiny channel gate after BN2; ~3 weights × 9 blocks |
| C4 | **SE with r=4 (not r=16)** | L3 | Two FC per block; ~8k params; stage-1 bottleneck is usable |
| C5 | **Last-stage spatial attention or GeM** | L4 | Head / last 8×8 only |
| C6 | **Cutout** | L5 | `train.py` transforms only |

Rejected for *first* improvement (kept as later options):

- **Option B projection** — extra params; repo CIFAR number did not beat A.
- **WRN / extra depth (32+)** — budget and confounds (not a minimal module).
- **Vanilla SE r=16** — ill-posed at 16 channels; would masquerade as “SE failed” when the reduction ratio failed.
- **CBAM / heavy non-local** — two mechanisms at once; VRAM/time; weak ablation.
- **Cosine LR / Mixup as first change** — training-recipe confounds if the research story is architectural; Mixup is a valid L5 method but harder to ablate as a *module*.
- **Stochastic depth** — designed for much deeper nets; 9 blocks give little signal.

---

## Step 4 — Candidate comparison

| Method | Problem addressed | Theoretical motivation | Implementation difficulty | Extra params | Extra compute | Expected benefit on **ResNet-20-A** | Risk |
|--------|-------------------|------------------------|---------------------------|--------------|---------------|--------------------------------------|------|
| C1 Pre-act | L1 post-add ReLU | Same authors: clean identity mapping | Low (rewrite block) | ~0 | ~0 | **Small** (literature gains are on 110/164; here train error already 0.72%) | Effect < seed noise (~0.3–0.5 pp); story dies empirically even if theory is right |
| C2 Avg-pool A | L2 spatial skip | Identity should summarize, not drop, locations | Very low | 0 | ~0 | Uncertain, possibly tiny | May be a one-line hack without a full story; easy to bury in noise |
| C3 ECA | L3 global channels, SE-incompatible width | Global channel dependencies **without** FC reduction | Low (one module + flag) | ~10¹–10² | GAP + 1-D conv per block (tiny) | Modest, **more plausible than C1 at depth 20** | May still be <0.5 pp; must beat a non-learned baseline |
| C4 SE r=4 | L3 | Classic recalibration | Low | ~8k (~3% of 0.27M) | 2× FC per block | Similar to C3, slightly more capacity | Confound: capacity vs attention; r is a new hyperparameter |
| C5 GeM / spatial att. | L4 spatial collapse | Preserve 8×8 layout | Medium | small–medium | higher on 8×8 | Unclear | Extra knobs; easy to overfit 10-class GAP replacement |
| C6 Cutout | L5 gap 7.7 pp | Paper’s own “future work”: stronger regularizers | Very low | 0 | 0 (CPU aug) | **Often the largest pp** on CIFAR ResNets | Not an architectural claim; changes the data contract; weaker module ablation |

---

## Step 5 — Selection (one first improvement)

**Selected: C3 — Efficient Channel Attention (ECA) on ResNet-20-A.**

SE was evaluated and **not** chosen as the first method.

### Why not SE first

1. Standard SE **r=16** is a bad match to **16-filter** stage 1 (`code` widths). A failed SE run would be ambiguous (mechanism vs reduction collapse).
2. SE r=4 is a reasonable cousin, but it adds ~8k parameters. ECA tests the **same scientific claim** (sample-adaptive global channel weights) with almost no capacity confound — better Phase 4/5 hygiene.
3. The user requirement was not to default SE; the diagnosis must drive the choice.

### Why not pre-act first

Scientific lineage is excellent, cost is zero, ablations are clean. It loses on **match to this baseline**: depth-20 residual already fits the training set (0.72% train error). Pre-act’s published gains are mainly for **much deeper** CIFAR ResNets. With **one GPU-hour per run**, no seed, and expected Δ ≈ 0.1–0.4 pp, the experiment is under-powered. It remains the best **follow-up if ECA is falsified** and we want a zero-capacity residual-theory check.

### Why not Cutout first

Strongest expected pp and directly invited by the paper. It **changes the data contract** (augmentation is currently frozen with Phase 2). A first improvement that is only aug makes Phase 5 “module ablations” vacuous. Keep Cutout as the preferred **training-side** idea after an architecture-side result, or as a later add-on with the architecture frozen.

### Why ECA first (against the listed criteria)

| Criterion | How ECA scores |
|-----------|----------------|
| Scientific motivation | Residual trunk has only local, static channel mixing; leftover error looks like representation/generalization, not under-optimization. |
| Feasibility | One `nn.Module`, optional flag, default path identical to Phase 2. |
| Experimental controllability | Single conceptual factor: **learned global channel gates**. Depth, width, Option A, SGD, aug frozen. |
| Compute | Negligible vs 3×3 convs; still ~1 hour / run on 3050. |
| Ablation | Stage placement, kernel k, vs SE r=4, vs **non-learned** channel scale. |
| Research story | “Thin CIFAR ResNet-20-A already optimizes well; identity Option A is in place; what it still lacks is *global, sample-adaptive channel use*, and textbook SE is the wrong tool at C=16.” |

**Idea id:** `eca_resnet20a`

---

## Step 6 — Research hypothesis

**Research question:**  
On CIFAR-10, with the frozen ResNet-20 Option A baseline, does adding a **parameter-free-reduction global channel gate** (ECA) after each block’s residual branch reduce **best test error** relative to the same network without that gate?

**Hypothesis:**  
ResNet-20-A’s 3×3 residual branches mix channels only locally. A cheap global descriptor (GAP over the block output) plus a 1-D convolution across channels can produce **per-sample channel weights** that improve the 64-D classifier representation, lowering test error **without** changing depth, width, shortcut Option A, or the SGD recipe.

**Proposed method:**  
ECA after the second BN of each `BasicBlock`, **before** the residual add (gate F(x), not the identity). Sigmoid weights broadcast over H×W. Kernel size **k=3** as the default (odd, covers immediate channel neighbors). No FC reduction.

**Expected mechanism:**  
Channel maps that are globally useful for the current image are amplified; locally noisy maps are suppressed, **before** they are added to the identity and later collapsed by GAP. Effect should be **larger at 32/64-channel stages** than at 16-channel stage (more channels to select among). Training error should not need to fall much further (already 0.72%); test error should fall if the mechanism is generalization/representation rather than extra memorization.

**Evaluation:**

| Item | Rule |
|------|------|
| Primary metric | Best test error (%) , same checkpoint rule as Phase 2 |
| Frozen baseline | Manifest ResNet-20-A **8.41%** (`resnet20a_09_53_41`) |
| Minimum meaningful effect | **≥ 0.50 pp** absolute (8.41% → **≤ 7.91%**). Rationale: paper ResNet-20→32 is 1.24 pp; we require less than half a depth step, but above plausible single-seed jitter (~0.3 pp; paper ResNet-110 std 0.16 on 5 runs). |
| Secondary | Final train error; train/test gap; param count; wall time |
| Protocol | Same data, aug, SGD, 160 epochs, batch 128, Option A |
| Seeds | Phase 3 may be **1 run** (match Phase 2). If the point estimate is between 0.3 and 0.5 pp, **do not claim success**; schedule a second seed before Phase 4 claims. |
| Hardware stop | If a run does not fit 4GB or exceeds ~90 min without progress, stop and record `blocked` |

**Falsification condition (must be able to kill the hypothesis):**

The hypothesis is **rejected** if **any** of the following holds under the frozen protocol:

1. **Primary miss:** ECA best test error is **not** at least 0.50 pp below 8.41% (i.e. remains **> 7.91%**), including **no change** or **degradation**.
2. **Overfit signature:** test error does not improve (or worsens) while final train error drops clearly below 0.72% — extra fit without generalization.
3. **“Any gate will do”:** a **non-learned** control (channel weights frozen at 1, or random sigmoid weights not trained) matches ECA within 0.50 pp — then the story is not *learned* channel attention.
4. **Reduction-style SE explains it:** SE r=4 (more params) is no better than ECA **and** last-stage-only ECA matches all-stage ECA — then we do not have evidence for global channel interaction throughout the thin trunk; we only nudged the head.

A **supported** hypothesis requires (1) failed and (3) failed (learned gates beat identity/random). (4) is Phase 5 ablation, not required to *start* Phase 4, but required before any strong “channel attention in ResNet-20-A” claim.

**Non-claims:** This design does **not** claim novelty of ECA (Wang et al., 2020). It claims a **task-specific, falsifiable** application on a frozen ResNet-20-A reproduction.

---

## Step 7 — Implementation plan (do not execute until confirmed)

### 7.1 Files and classes

| Action | Where |
|--------|--------|
| Add module | Prefer a **new** file `code/deep-residual-learning-pytorch-master/eca.py` with class `ECA` (GAP → squeeze spatial dims → `Conv1d` k=3 → sigmoid → multiply). Keep `models.py` readable. |
| Wire into block | `BasicBlock.__init__(..., attention=None)` ; after second BN, `y = attention(y)` if not None. **Do not** gate the identity `x`. |
| Factory | `CifarResNet(..., attention='eca' \| None, eca_k=3)` builds one ECA per block with the block’s `out_channels`. Default `attention=None`. |
| CLI | `train.py`: optional `--attention eca` and `--eca-k 3`. **Default CLI `train.py 20 -r -o A` must remain Phase 2 behavior.** |
| Output root | Add `--output-root` (or equivalent) defaulting to current `models/`. Phase 3 passes a path under `experiments/runs/phase3/eca_resnet20a/`. |

**Do not modify:** `ClassifierHead` logic, Option A math, SGD/aug/epoch defaults, Phase 2 configs, `experiments/runs/phase2/baseline/**`, `experiments/manifests/phase2_baseline.json`.

`BottleneckBlock` / `ImageNetResNet` can stay untouched (out of scope).

### 7.2 What stays invariant (baseline isolation)

- No change to `BasicBlock` forward when `attention is None`.
- No training into frozen Phase 2 directories.
- No download of new data; CIFAR-10 pickle already present.
- Junction `data/` remains; Phase 3 must **not** retarget `models/` junction at `experiments/runs/phase2/baseline/` in a way that overwrites canonical runs. Use `--output-root` instead of moving the junction.

### 7.3 New config (planned, not written until confirmation)

`experiments/configs/phase3/eca_resnet20a.yaml`

- `idea_id: eca_resnet20a`
- `cli: train.py 20 -r -o A --attention eca --eca-k 3 --output-root <runs path>`
- inherit Phase 2 protocol block (epochs, batch, SGD, aug)
- `baseline_manifest: experiments/manifests/phase2_baseline.json`
- `primary_metric: best_test_error`
- `success_threshold_pp: 0.50`

### 7.4 New scripts (planned)

| Script | Role |
|--------|------|
| `experiments/launch/run_phase3_eca.ps1` | One full 160-epoch ECA run into `experiments/runs/phase3/eca_resnet20a/<run_id>/`; log under `experiments/runs/phase2/logs/` with a **new** name (not `resnet_20_A.log`) |
| Optional later | `experiments/scripts/build_phase3_results.py` analog of Phase 2 summarizer; **Phase 4** comparison vs manifest — not this step |

### 7.5 Phase 5 ablations (design only; do not run now)

| Run | Factor |
|-----|--------|
| ECA all stages, k=3 | main |
| ECA last stage only | L3 vs L4 / head |
| ECA k=5 | kernel sensitivity |
| SE r=4 all stages | C4 control |
| Identity multiply (no ECA params) | falsification (3) |
| Frozen Phase 2 ResNet-20-A | not retrained; read manifest |

### 7.6 Explicitly out of scope until you confirm

- Code edits, training, extra seeds  
- Phase 4 controlled comparison write-up as a result  
- Phase 5 execution  
- Claiming ECA (or SE) works

---

## Decision requested

Please confirm **one** of:

1. **Accept C3 ECA** as specified (recommended in this design).  
2. **Switch first idea** to C1 pre-act / C2 avg-pool / C4 SE r=4 / C6 Cutout.  
3. **Revise** hypothesis, 0.50 pp threshold, or insertion point (before add vs after add).

After confirmation, Phase 3 step 2 is implementation of **only** the chosen method, still without claiming results until a run exists.
