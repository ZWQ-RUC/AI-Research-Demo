#!/usr/bin/env python3
"""Build read-only canonical snapshot for Phase 7 paper numbers.

Reads experiments/manifests + experiments/results only.
Never writes under experiments/.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
PAPER_DIR = SCRIPT_DIR.parent
ROS_DIR = PAPER_DIR.parent
PROJECT_ROOT = ROS_DIR.parent

MANIFEST = PROJECT_ROOT / "experiments" / "manifests" / "phase2_baseline.json"
PHASE2_SUMMARY = PROJECT_ROOT / "experiments" / "results" / "phase2" / "summary.json"
PHASE4_COMPARISON = PROJECT_ROOT / "experiments" / "results" / "phase4" / "comparison.json"
PHASE5_SUMMARY = PROJECT_ROOT / "experiments" / "results" / "phase5" / "summary.json"

OUT_PATH = PAPER_DIR / "canonical" / "data.json"


def die(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def load_json(path: Path) -> Any:
    if not path.is_file():
        die(f"missing required SoT file: {path.relative_to(PROJECT_ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def git_head() -> str | None:
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=PROJECT_ROOT,
            stderr=subprocess.DEVNULL,
            text=True,
        )
        return out.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def find_model(models: list[dict], name: str) -> dict:
    for m in models:
        if m.get("display_name") == name:
            return m
    die(f"model not found in phase5 summary: {name}")


def approx_eq(a: float | None, b: float | None, tol: float = 1e-9) -> bool:
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return abs(float(a) - float(b)) <= tol


def main() -> int:
    parser = argparse.ArgumentParser(description="Build canonical paper data snapshot (read-only SoT).")
    parser.add_argument(
        "--out",
        type=Path,
        default=OUT_PATH,
        help="Output canonical JSON path",
    )
    args = parser.parse_args()

    # Refuse writing anywhere under experiments/
    out = args.out.resolve()
    experiments_root = (PROJECT_ROOT / "experiments").resolve()
    if experiments_root in out.parents or out == experiments_root:
        die("refusing to write under experiments/")

    sources = {
        "phase2_manifest": MANIFEST,
        "phase2_summary": PHASE2_SUMMARY,
        "phase4_comparison": PHASE4_COMPARISON,
        "phase5_summary": PHASE5_SUMMARY,
    }
    for p in sources.values():
        if not p.is_file():
            die(f"missing SoT: {p.relative_to(PROJECT_ROOT)}")

    manifest = load_json(MANIFEST)
    phase2 = load_json(PHASE2_SUMMARY)
    phase4 = load_json(PHASE4_COMPARISON)
    phase5 = load_json(PHASE5_SUMMARY)

    conflicts: list[dict[str, Any]] = []
    notes: list[str] = []

    # --- Extract from manifest canonical runs ---
    plain_m = next(r for r in manifest["canonical_runs"] if r["display_name"] == "Plain-20")
    resnet_m = next(r for r in manifest["canonical_runs"] if r["display_name"] == "ResNet-20-A")

    plain2 = next(r for r in phase2["results"] if r["model"] == "Plain-20")
    resnet2 = next(r for r in phase2["results"] if r["model"] == "ResNet-20-A")

    plain4 = next(m for m in phase4["models"] if m["display_name"] == "Plain-20")
    resnet4 = next(m for m in phase4["models"] if m["display_name"] == "ResNet-20-A")
    preact4 = next(m for m in phase4["models"] if m["display_name"] == "PreAct-ResNet-20-A")

    plain5 = find_model(phase5["models"], "Plain-20")
    resnet5 = find_model(phase5["models"], "ResNet-20-A")
    preact5 = find_model(phase5["models"], "PreAct-ResNet-20-A")
    abl_a = find_model(phase5["models"], "Ablation-A")
    abl_b = find_model(phase5["models"], "Ablation-B")

    checks = [
        ("Plain-20 best_test_error_pct", plain_m["best_test_error_pct"], plain2["observed_best_test_error_pct"], plain4["best_test_error_pct"], plain5["best_test_error_pct"]),
        ("ResNet-20-A best_test_error_pct", resnet_m["best_test_error_pct"], resnet2["observed_best_test_error_pct"], resnet4["best_test_error_pct"], resnet5["best_test_error_pct"]),
        ("PreAct-ResNet-20-A best_test_error_pct", preact4["best_test_error_pct"], preact5["best_test_error_pct"]),
    ]
    for label, *vals in checks:
        base = vals[0]
        for v in vals[1:]:
            if not approx_eq(base, v):
                conflicts.append({"field": label, "values": vals, "message": "cross-source mismatch"})

    # residual advantage
    residual_pp = round(plain_m["best_test_error_pct"] - resnet_m["best_test_error_pct"], 2)
    if not approx_eq(residual_pp, phase2.get("residual_advantage_pp"), tol=0.011):
        conflicts.append(
            {
                "field": "residual_advantage_pp",
                "computed": residual_pp,
                "phase2_summary": phase2.get("residual_advantage_pp"),
            }
        )

    deltas = phase5.get("deltas_pp", {})
    preact_minus_resnet = round(preact4["best_test_error_pct"] - resnet_m["best_test_error_pct"], 2)
    if not approx_eq(preact_minus_resnet, deltas.get("preact_minus_resnet20a"), tol=0.011):
        conflicts.append(
            {
                "field": "preact_minus_resnet20a",
                "computed": preact_minus_resnet,
                "phase5_deltas": deltas.get("preact_minus_resnet20a"),
            }
        )
    if not approx_eq(preact_minus_resnet, phase4.get("deltas", {}).get("preact_minus_resnet20a_best_test_error_pp"), tol=0.011):
        conflicts.append(
            {
                "field": "preact_minus_resnet20a vs phase4.deltas",
                "computed": preact_minus_resnet,
                "phase4": phase4.get("deltas", {}).get("preact_minus_resnet20a_best_test_error_pp"),
            }
        )

    abl_a_minus_resnet = round(abl_a["best_test_error_pct"] - resnet_m["best_test_error_pct"], 2)
    abl_a_minus_preact = round(abl_a["best_test_error_pct"] - preact4["best_test_error_pct"], 2)
    if not approx_eq(abl_a_minus_resnet, deltas.get("ablation_a_minus_resnet20a"), tol=0.011):
        conflicts.append(
            {
                "field": "ablation_a_minus_resnet20a",
                "computed": abl_a_minus_resnet,
                "phase5_deltas": deltas.get("ablation_a_minus_resnet20a"),
            }
        )
    if not approx_eq(abl_a_minus_preact, deltas.get("ablation_a_minus_preact"), tol=0.011):
        conflicts.append(
            {
                "field": "ablation_a_minus_preact",
                "computed": abl_a_minus_preact,
                "phase5_deltas": deltas.get("ablation_a_minus_preact"),
            }
        )

    if abl_b.get("status") != "failed":
        notes.append("Ablation-B status unexpected; expected failed")
    if abl_b.get("best_test_error_pct") is not None:
        conflicts.append(
            {
                "field": "Ablation-B best_test_error_pct",
                "message": "failed run must not expose comparable accuracy",
                "value": abl_b.get("best_test_error_pct"),
            }
        )

    # Prefer phase5 as the widest completed table; scalars from authoritative sources
    models_out = []
    for m in phase5["models"]:
        models_out.append(
            {
                "id": m["display_name"].lower().replace(" ", "_").replace("-", "_"),
                "display_name": m["display_name"],
                "demo_phase": m.get("phase"),
                "status": m.get("status"),
                "failure_mode": m.get("failure_mode"),
                "best_test_error_pct": m.get("best_test_error_pct"),
                "best_epoch": m.get("best_epoch"),
                "train_error_at_best_pct": m.get("train_error_at_best_pct"),
                "final_train_error_pct": m.get("final_train_error_pct"),
                "param_count": m.get("param_count"),
                "duration": m.get("duration"),
                "block": m.get("block"),
                "artifact_root": m.get("artifact_root"),
                "source": "experiments/results/phase5/summary.json",
            }
        )

    scalars = {
        "err_plain": plain_m["best_test_error_pct"],
        "err_resnet": resnet_m["best_test_error_pct"],
        "err_preact": preact4["best_test_error_pct"],
        "err_ablation_a": abl_a["best_test_error_pct"],
        "ablation_b_status": "failed_numerical_instability",
        "residual_advantage_pp": residual_pp,
        "delta_plain_minus_resnet_pp": residual_pp,
        "delta_resnet_minus_plain_pp": round(-residual_pp, 2),
        "delta_preact_minus_resnet_pp": preact_minus_resnet,
        "delta_ablation_a_minus_resnet_pp": abl_a_minus_resnet,
        "delta_ablation_a_minus_preact_pp": abl_a_minus_preact,
        "paper_resnet20_table6_pct": resnet2.get("paper_reference_pct"),
        "repo_plain_ref_pct": plain2.get("repo_reference_pct"),
        "repo_resnet_ref_pct": resnet2.get("repo_reference_pct"),
        "reproduction_status": phase2.get("status"),
        "tolerance_pp": phase2.get("tolerance_pp"),
    }

    protocol = phase4.get("protocol", {})

    figures = {
        "phase2": list(manifest.get("plots", [])),
        "phase4": list(phase4.get("figures", [])),
        "phase5": list(phase5.get("figures", [])),
    }

    source_meta = {
        rel: {
            "path": str(path.relative_to(PROJECT_ROOT)).replace("\\", "/"),
            "sha256": sha256_file(path),
        }
        for rel, path in sources.items()
    }

    canonical = {
        "schema_version": "1.0.0",
        "kind": "phase7_paper_canonical_snapshot",
        "frozen_at_utc": datetime.now(timezone.utc).isoformat(),
        "git_head": git_head(),
        "project_root": str(PROJECT_ROOT),
        "read_only_sources": True,
        "overleaf_deferred": True,
        "decision": {"sync": "1C_2A_3A"},
        "sources": source_meta,
        "protocol": {
            "dataset": protocol.get("dataset"),
            "epochs": protocol.get("epochs"),
            "batch_size": protocol.get("batch_size"),
            "optimizer": protocol.get("optimizer"),
            "momentum": protocol.get("momentum"),
            "weight_decay": protocol.get("weight_decay"),
            "lr": protocol.get("lr"),
            "lr_milestones_iters": protocol.get("lr_milestones_iters"),
            "augmentation": protocol.get("augmentation"),
            "shortcut_when_residual": protocol.get("shortcut_when_residual"),
            "seed": protocol.get("seed"),
            "source": "experiments/results/phase4/comparison.json#protocol",
        },
        "scalars": scalars,
        "models": models_out,
        "ranking_completed_only": phase5.get("ranking_completed_only", []),
        "deltas_pp": {
            "preact_minus_resnet20a": preact_minus_resnet,
            "ablation_a_minus_resnet20a": abl_a_minus_resnet,
            "ablation_a_minus_preact": abl_a_minus_preact,
            "plain_minus_resnet": residual_pp,
            "resnet_minus_plain": round(-residual_pp, 2),
        },
        "figures": figures,
        "consistency": {
            "ok": len(conflicts) == 0,
            "conflicts": conflicts,
            "notes": notes,
        },
    }

    if conflicts:
        print("CONFLICTS detected:", file=sys.stderr)
        print(json.dumps(conflicts, ensure_ascii=False, indent=2), file=sys.stderr)
        die("canonical build aborted due to cross-source conflicts", code=2)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(canonical, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {args.out.relative_to(PROJECT_ROOT)}")
    print(f"models={len(models_out)} conflicts=0")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
