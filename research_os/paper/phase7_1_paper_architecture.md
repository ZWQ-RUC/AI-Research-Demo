# Phase 7.1 — Paper Architecture

**status:** architecture recorded (no body prose)  
**utc:** 2026-09-04T01:43:00Z  
**reaffirmed_utc:** 2026-09-04T01:52:00Z  
**G1:** approved — RQ/Hypothesis locked to `contract/research-question-card.md`  
**inputs:** Phase 7.0 freeze + RQ card + `paper/conclusion.md` §12 + `paper/analysis.md`

## 1. Intended paper type

- **ML empirical / negative-result friendly** short paper or technical report style
- Core story: CIFAR-10 ResNet-20 baseline (partial reproduction) → frozen-recipe PreAct **null result** → asymmetric BN+ReLU ablations

## 2. Proposed section map → evidence

| Section | Primary sources | Numbers/figures |
|---------|-----------------|-----------------|
| Abstract | conclusion §3–7 (candidate) | headline % only via macros |
| Introduction | RQ card; paper_summary | — |
| Related Work | He 2015; He 2016 Identity Mappings（Phase 2–3 waived：仅项目内引用，无 vault） | — |
| Method | Models.md; Phase 3 design; code `models.py` pointers | block diagrams optional (not blocking) |
| Experiments / Setup | freeze protocol from phase4 comparison.json | macros for protocol constants |
| Results | phase2/4/5 results | Table main + Fig curves/bars |
| Analysis / Discussion | `paper/analysis.md` | mechanism tiers; no stronger than G4 |
| Conclusion | `paper/conclusion.md` after **G4** | allowed claims only |
| Limitations | conclusion §10 | single seed, depth-20, frozen recipe |

## 3. Figure / Table plan (from freeze)

| ID | Asset | Suggested paper role |
|----|-------|----------------------|
| Fig.A | `phase2/figures/plain_vs_residual.png` | residual vs plain |
| Fig.B | `phase4/figures/test_error_curves.png` | Plain/ResNet/PreAct curves |
| Fig.C | `phase4/figures/best_test_error_bar.png` | bar comparison |
| Fig.D | `phase5/figures/best_test_error_completed.png` | + Ablation A |
| Tab.1 | phase2/4/5 comparison CSVs → single main results table | canonical % |
| Tab.2 | ablation deltas | from phase5 `deltas_pp` |

Display copies under `paper/figures|tables` are OK for drafting; **compile-time** should prefer macros generated from SoT JSON.

## 4. Claim ledger posture (G4 pending)

- Seed claim ledger from `paper/conclusion.md` §12 **Claims We Can Make / Should Avoid**
- All claim rows: `strength=tentative` until G4 APPROVE
- Forbidden: upgrade wording to “we prove / universally / significant” without G4

## 5. Writing stack (when body starts — not now)

1. Outline + claim ledger → `ml-paper-writing`
2. 中文润色（若需要）→ `research-writing-skill`
3. Citation audit → `reference-checker`
4. Self-review → `paper-self-review`
5. Simulated review only after **G6**

## 6. Blockers before body drafting

1. ~~G1 APPROVE~~ ✅ (2026-09-04, as drafted)
2. **Overleaf/LaTeX template location** (currently absent in repo)
3. Confirm sync proposal (`phase7_sync_proposal.md`) before any new automation scripts
4. **G4** before final findings wording in manuscript（Human Approval Gate 保持）
