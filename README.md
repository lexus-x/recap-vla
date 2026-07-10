# VLA Novelty Mission — Multi-Agent Discovery Run (2026-07-10)

An autonomous multi-agent research pipeline that mined, audited, and adversarially stress-tested
**67 candidate mechanisms** for improving sub-500M Vision-Language-Action (VLA) robot policies —
and reported honestly on what survived.

> **Headline result: zero of 67 mechanisms fully survived a Q1-journal-grade adversarial review.**
> Four passed all six screening gates; all four were killed in debate with substantive, checkable defects.
> The deliverables are (a) the committee-selected winner-with-caveats **R4 "Declarative Postcondition Retry"**
> with a zero-GPU first experiment, (b) five verified structural findings about why the obvious idea space
> is closed, and (c) the complete machine-readable record of every decision.

**⚠️ Pre-publication research. Keep this repository private until submission.**

---

## Quick start

| If you want… | Read… |
|---|---|
| The human-friendly version with charts | [`report/vla-novelty-mission-2026-07-10.pdf`](report/vla-novelty-mission-2026-07-10.pdf) |
| The full technical report | [`report/vla-novelty-mission-2026-07-10.md`](report/vla-novelty-mission-2026-07-10.md) |
| Every gate verdict / debate transcript / committee score | [`artifacts/`](artifacts/) (JSON) |
| The orchestration code that ran the pipeline | [`workflows/`](workflows/) |
| The prior verified landscape this run built on | [`background/research-direction-report.md`](background/research-direction-report.md) |

## Context

- **Base model**: SmolVLA 450M (lerobot 0.4.4), baseline **49.0% on LIBERO-Long** reproduced in-house
  (100 rollouts, seed 1000) vs ~97% for 7B models.
- **Constraints**: frozen backbone (plug-in modules preferred), simulation only (LIBERO, LIBERO-Plus,
  Meta-World), single A100 80GB, target venues CoRL / RA-L / T-RO / RSS / TMLR.
- **Hard exclusions**: world models, medical applications, pure scaling/data/prompting/distillation,
  plus 7 previously-killed directions documented in `background/`.

## Method

```
Phase 1  Landscape scan     14 scanner agents over 14 non-VLA domains ─┐
         + bottleneck map   (control theory, neuroscience, info theory, │→ 67 candidates
                             comp. architecture, databases, immunology…)─┘
Phase 2  Novelty audit      10 auditor agents, arXiv/Semantic Scholar prior-art checks;
                            kills require a NAMED paper; low-confidence kills get a 2nd vote
Phase 3  Six gates          A Novelty · B Importance · C Mechanism · D Generality ·
                            E Efficiency (≥3 of 7 dimensions) · F Publication realism
Phase 4  Debates            3 independent kill-attempt rounds per gate-passer
                            (supporter-vs-critic, Reviewer #2, Area Chair)
Revision round              2 independent "surgeon" agents engineered 8 revised mechanisms
                            answering the recorded fatal attacks → same gates + debates
Phase 5  Ranking committee  3 lenses (scientist / engineer / reviewer) × 7 axes + chair
Phase 6  Implementation     Full plans (architecture, equations, pipelines, GPU budget,
                            pre-registered kill criteria) for the top 3
```

**Decision integrity rules** (enforced throughout): no number without a run log or fetched source;
no kill or ranking by a single agent (≥3 independent agents or a 3-lens committee per decision);
every experiment plan carries a pre-registered success/kill criterion written before launch;
negative results reported, not hidden.

Models: Sonnet for search/extraction workers, Fable 5 for all judge/verify/rank decisions
(Opus 4.8 x-high as fallback). ~5.5M tokens total, ~60 sub-agents, 7 orchestrated workflows.

## Results

### The funnel

| Stage | Count |
|---|---|
| Ideas generated (14 domains + 8 engineered revisions) | 67 |
| Reached the six gates | 63 |
| Passed all six gates | 4 (C4, C7, R2, S1) |
| Survived 3-round adversarial debate | **0** |

### Five verified structural findings

1. **Perception-driven OOD collapse cannot be fixed downstream of a frozen backbone** — every monitor,
   gate, verifier, or action-space corrector died because its own inputs are corrupted by the shift it must detect.
2. **Upstream fixes need factor variation, and factor variation is augmentation** — the augmentation-only
   fair baseline captures the gain (this killed C7, S1, S2).
3. **One benchmark factor re-counted as three benefit dimensions fails scrutiny** — the ≥3-dimensions
   requirement is a real filter.
4. **Borrowed formalisms degenerate on robot policies** — Dempster–Shafer with n=2 cameras is a scalar gate;
   symbolic machinery has no purchase on continuous action chunks.
5. **The crowded clusters are closed at mechanism grain (2025–26)** — test-time scaling, action tokenizers,
   replan cadence, memory modules, few-shot adapters all have named prior art within one thin twist.

### Winner: R4 — Declarative Postcondition Retry (chair confidence 0.55)

~1.5M-parameter probes on the frozen backbone's features verify **declarative** (looked-up, not predicted)
subgoal postconditions after each subtask; a violation triggers a scripted retreat-and-reattempt.
It survived where 66 died because the retry **changes the world state** rather than re-querying corrupted
perception. Retry arithmetic p→p(2−p) directly attacks the multiplicative long-horizon failure structure.
Expected +5–15pt LIBERO-Long if the premise holds; publishes as a measurement+mechanism paper (RA-L/TMLR).

**First experiment costs zero GPU**: relabel the existing 100 baseline failure logs; the idea dies
immediately if <25% of failures are silent postcondition violations. Full plan (architecture, equations,
training/eval pipelines, ablations, failure analysis): `artifacts/phase56_result.json`.

**Runners-up**: R1 *First-Glance Nuisance Recalibration* (highest novelty 5/5/5, premise likelier false
than true — a ~1-day identifiability test decides) and S3 *Kernel-Associative Fast-Binding with Calibrated
Abstention* (zero-weight few-shot adaptation, cheap offline falsification).

### Dedicated novelty sweep on R4 (ran 2026-07-10) — verdict: PARTIAL_THIN_DELTA

R4 is **not novel as a mechanism**, and the sweep found the field heavily bracketed: **HELM**
(arXiv 2604.18791: verifier + physical rollback + LIBERO-Long + matched budget + failure taxonomy),
**ProbeAct** (2606.09740: probe on frozen VLA internals → autonomous recovery), **Agentic Robot**
(2505.23450: scripted recovery + retry on LIBERO-Long, external-VLM verifier), **SAFE** (NeurIPS 2025:
failure detection from frozen latents). Every pairwise combination of R4's components is published;
only the exact four-way conjunction is open, and it survives **only** with (i) the narrowed claim wording
in `artifacts/novelty_sweep_r4.json` (`verdict.surviving_delta`), (ii) budget-matched head-to-heads against
an external-verifier trigger (HELM/Agentic-Robot-style) AND a continuous-correction baseline
(ProbeAct-style), and (iii) engagement with HELM's LIBERO-Recovery protocol and its 41/33/26 gap
breakdown. 18 must-cite papers are listed in the artifact. This further tilts venue positioning toward
RA-L-with-baselines or TMLR.

## Roadmap (diagnostics-first, all pre-registered)

| Step | What | A100-h | Kill criterion |
|---|---|---|---|
| 0a | R4: relabel 100 existing failure logs | 0 | <25% silent postcondition violations |
| 0b | R3 seed-variance decomposition (side value) | 2 | — |
| 1 | R4 probes on cached features | 2 | >1cm pose error / >3% false positives |
| 2 | R4 pilot on 3 LIBERO-Long tasks | 12 | retry ≉ independent second attempt |
| 3 | R1 identifiability test | 18–24 | displacement outside span(B) |
| 4 | S3 KRR-vs-LoRA offline test | 1–2 | reconstruction L2 >1.5× LoRA |
| 5 | Full builds of survivors (500 rollouts × 3 seeds, matched budget) | 40–80 | standard statistics |

## Repository layout

```
report/       Technical report (.md), human-friendly PDF, and the PDF's HTML source
artifacts/    Machine-readable record:
              phase1_result.json            60 candidates + evidence-cited bottleneck map
              phase34_wave{1..4}_result.json  every gate verdict + full debate transcripts
              phase5_input_finalists.json   16 finalists with complete records
              phase56_result.json           3×7-axis committee scores, chair verdict, top-3 full plans
              revision_proposals{,_b}.json  the two surgeons' engineered revisions
workflows/    The four orchestration scripts (Claude Code Workflow DSL) that ran the pipeline
background/   The prior verified SOTA landscape + killed-directions report this run built on
```

## Known limitations

- 11 candidates (C49–C59) never received a dedicated novelty audit (audit stage wedged); they were
  gated with scanner-level evidence and instructed extra skepticism — all 11 also failed on non-novelty gates.
- Literature coverage is arXiv/Semantic-Scholar-centric; workshop proceedings were not systematically searched.
- Debate verdicts are strong model judgments, not ground truth — which is why every surviving thread
  carries a cheap pre-registered empirical kill-test as the decisive arbiter.
- The dedicated novelty sweep on R4's claim **has now run** (verdict above: PARTIAL_THIN_DELTA;
  full record in `artifacts/novelty_sweep_r4.json`). Re-run a fresh scan immediately before submission —
  this area produced 4+ bracketing papers in 2026 alone. One searcher hallucination was caught and purged
  during the sweep's verification pass; treat single-source citations with care.

---
*Generated by an autonomous multi-agent pipeline (Claude Code) on 2026-07-10, supervised by lexus-x.*
